package chatServer

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/dataset"
	"OnCallAgent/internal/server/knowledgecatalog"
	"context"
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// turnPlan 是进入 ReAct 前的确定性计划，不让模型凭记忆决定是否已有真实文件。
// 复杂任务仍可由 Agent 在执行期间根据 inspect_dataset 的结果调整工具调用。
type turnPlan struct {
	Text                 string
	RequiresVerification bool
}

// The outer workflow uses the page-bound request context, never IDs mentioned
// in old chat text. PPG has a dedicated engine and must not enter the MNE plan.
func planWorkspaceTurn(ctx context.Context, question, datasetID string) turnPlan {
	if ui := toolinput.CurrentUIContext(ctx); ui != nil && ui.ExplainOnly {
		return turnPlan{Text: "本轮只解释用户选中的组件：先用 inspect_ui_component 读取参数与状态，需要时检索知识或读取已绑定数据集元数据。禁止分析、预处理、写入或修改任务；不能把界面显示说成工具已执行。"}
	}
	if scope, ok := toolinput.CurrentWorkspace(ctx); ok {
		if scope.Page == "ppg" {
			return turnPlan{Text: "当前页面为 PPG。只可使用 run_ppg_analysis(action=inspect/analyze) 检查或处理页面已选参数的 PPG 记录；用户要求处理时实际调用 analyze，结果会回填页面。不要调用 EEG/MNE 工具，也不要凭历史数据集 ID 操作。参数未确认时指出需要在页面修改的字段；信息问答不必运行分析。"}
		}
		if scope.Page == "help" || scope.Page == "sessions" || scope.Page == "history" || scope.Page == "datasets" {
			return turnPlan{Text: "当前为 " + scope.Page + " 页面。按本轮页面上下文回答，允许知识检索及当前所选数据集的只读检查。不得自动执行信号处理或修改任务。需要执行时引导用户进入对应信号页面；不要把历史记录当作本轮执行结果。"}
		}
	}
	return planTurn(question, datasetID)
}

var knowledgeCitation = regexp.MustCompile(`\[([A-Z][A-Z0-9-]*-[0-9]{3})\]\((https?://[^)\s]+)\)`)

func planTurn(question, datasetID string) turnPlan {
	q := strings.ToLower(strings.TrimSpace(question))
	domain := datasetID != "" || containsAny(q, "eeg", "meg", "fnirs", "脑电", "脑磁", "近红外", "信号", "数据", "通道", "坏道", "预处理", "gfp")
	operation := domain && containsAny(q, "预处理", "滤波", "插值", "计算", "坏道", "分析", "处理", "保存", "gfp", "run analysis", "preprocess", "calculate", "analyze", "save")
	if !operation || containsAny(q, "什么是", "为什么", "如何理解", "原理", "区别") {
		return turnPlan{Text: "信息问答：先核对知识证据；涉及已导入文件事实时读取 inspect_dataset。无需执行的请求不得声称已运行算法。"}
	}
	steps := "1. inspect_dataset 核对文件模态、通道、采样率和结构冲突；2. 根据目标及知识依据选择 MNE 或 NeuroKit2 工具；3. 执行后核对工具返回的 completed/skipped/degraded、质量指标和保存状态。"
	if datasetID == "" {
		return turnPlan{Text: "数据操作计划：当前会话未绑定 dataset_id。先请求用户导入并绑定文件；在拿到可信文件事实前只可给草案，不可声称完成分析。" + steps, RequiresVerification: true}
	}
	if record, ok := dataset.Get(datasetID); ok {
		requiresConfirmation, _ := record.Inspection.StructureReport["requires_confirmation"].(bool)
		if len(record.Inspection.StructureConflicts) > 0 || requiresConfirmation {
			return turnPlan{Text: "数据操作计划：文件结构存在冲突，先持久化待确认项并暂停执行。dataset_id=" + datasetID + "。" + steps, RequiresVerification: true}
		}
		if record.Inspection.EventsRequireConfirmation {
			steps += "事件字典仍需研究者确认；执行 Epoch/ERP/解码前必须先确认事件含义。"
		}
		return turnPlan{Text: "数据操作计划：已绑定数据集 " + datasetID + "；文件模态=" + record.Inspection.Modality + "。" + steps, RequiresVerification: true}
	}
	return turnPlan{Text: "数据操作计划：绑定的数据集已失效，先让用户重新导入。dataset_id=" + datasetID + "。" + steps, RequiresVerification: true}
}

func containsAny(text string, terms ...string) bool {
	for _, term := range terms {
		if strings.Contains(text, term) {
			return true
		}
	}
	return false
}

// reflectTurn 只审查能由工具记录证明的执行性陈述，不让第二个模型凭文字
// “反思”出不存在的处理结果。未执行的计划、RAG 文档和对话历史都不算执行证据。
func reflectTurn(answer string, trace []toolinput.ToolResult) string {
	// 核对知识 ID 及链接必须同时存在于本地目录；无依据的引用不能作为专家结论证据。
	if !knowledgeCitationsValid(answer) {
		return localized(answer, "回答中的知识引用未通过本地知识目录核验，请重新检索并使用真实知识 ID 与官方来源。", "A knowledge citation in the answer did not match the local catalog. Retrieve the relevant evidence again and cite its registered source.")
	}
	lower := strings.ToLower(answer)
	performed, saved := false, false
	allCompleted := true
	var beforeScore, afterScore *float64
	for _, result := range trace {
		if result.Succeeded && (result.Name == "run_neuro_analysis" || result.Name == "run_neurokit_analysis" || result.Name == "run_ppg_analysis") {
			performed = true
			saved = saved || result.Saved
			if result.BeforeScore != nil && result.AfterScore != nil {
				beforeScore, afterScore = result.BeforeScore, result.AfterScore
			}
			for _, status := range result.Steps {
				if status == "skipped" || status == "degraded" || status == "failed" {
					allCompleted = false
				}
			}
		}
	}
	claim := containsAny(lower, "已完成预处理", "已经完成预处理", "已执行预处理", "已经执行预处理", "预处理完成", "已完成滤波", "已经完成滤波", "已计算gfp", "已经计算gfp", "已检测坏道", "preprocessing completed", "preprocessing is complete", "filtering completed", "gfp calculated", "bad channels detected")
	if claim && !performed {
		return localized(answer, "本轮没有可核验的分析工具成功记录，因此不能确认已完成处理。请检查数据集是否已导入、结构是否已确认，并重新发起分析。", "No successful analysis tool call was recorded in this turn, so completion cannot be confirmed. Check the imported dataset and its structure, then run the analysis again.")
	}
	if containsAny(lower, "已保存预处理文件", "已经保存预处理文件", "已生成fif", "saved the preprocessed file", "saved the fif file") && !saved {
		return localized(answer, "本轮工具记录不能证明预处理文件已保存。分析可能未执行，或仅在内存中完成；请以工具的 output.saved 和审计记录为准。", "The tool record does not show a saved preprocessing file. Check output.saved and the audit record before claiming that a file was saved.")
	}
	qualityClaim := containsAny(lower, "质量已改善", "质量提升了", "质量已提高", "质量明显改善", "quality improved")
	if qualityClaim && (beforeScore == nil || afterScore == nil) {
		return localized(answer, "本轮没有可核验的处理前后质量评分，不能确认质量改善。请先运行质量评估并查看报告。", "No comparable before/after quality scores were recorded in this turn, so improvement cannot be confirmed. Run quality assessment and review its report.")
	}
	if qualityClaim && *afterScore <= *beforeScore {
		return localized(answer, "本轮质量评分并未提高（处理前 "+formatScore(*beforeScore)+"，处理后 "+formatScore(*afterScore)+"）。请查看处理前后质量报告和执行记录，再决定是否调整参数。", "The quality score did not improve (before "+formatScore(*beforeScore)+", after "+formatScore(*afterScore)+"). Review the quality report before changing parameters.")
	}
	if performed && !allCompleted && containsAny(lower, "所有步骤均已完成", "全部步骤已完成", "所有步骤都已完成", "all steps completed", "all steps succeeded") {
		return localized(answer, "本轮执行记录包含 skipped、degraded 或 failed 步骤，不能将其视为全部成功。请逐项核对 execution_plan 和质量报告。", "The execution record contains skipped, degraded, or failed steps. Review execution_plan and the quality report before claiming that every step succeeded.")
	}
	return answer
}

// 深度模式增加“本轮检索来源”核验；目录中存在并不证明这轮确实读过。
// 这是确定性的出处检查，不声称自动验证所有科学结论，也不重跑有副作用的工具。
func reflectModeTurn(ctx context.Context, answer string, trace []toolinput.ToolResult) string {
	verified := reflectTurn(answer, trace)
	if verified != answer || toolinput.CurrentResponsePolicy(ctx).Mode != "deep" {
		return verified
	}
	seen := map[string]bool{}
	for _, result := range trace {
		if result.Succeeded {
			for _, id := range result.KnowledgeIDs {
				seen[id] = true
			}
		}
	}
	for _, match := range knowledgeCitation.FindAllStringSubmatch(answer, -1) {
		if !seen[match[1]] {
			return localized(answer, "回答引用了本轮未检索到的知识条目，尚未通过证据来源核验。请补充检索后再使用这些引用；本轮已执行操作的结果仍以工具记录为准。", "The answer cites knowledge not retrieved in this turn and has not passed source verification. Retrieve the missing evidence before using those citations; completed operations remain recorded in the tool results.")
		}
	}
	return verified
}

func knowledgeCitationsValid(answer string) bool {
	matches := knowledgeCitation.FindAllStringSubmatch(answer, -1)
	if len(matches) == 0 {
		return true
	}
	entries, err := knowledgecatalog.Load()
	if err != nil {
		return false
	}
	for _, match := range matches {
		entry, ok := entries[match[1]]
		if !ok || entry.SourceURL == "" || entry.SourceURL != match[2] {
			return false
		}
	}
	return true
}

func formatScore(value float64) string { return fmt.Sprintf("%.2f", value) }

func localized(answer, chinese, english string) string {
	for _, char := range answer {
		if unicode.Is(unicode.Han, char) {
			return chinese
		}
	}
	return english
}
