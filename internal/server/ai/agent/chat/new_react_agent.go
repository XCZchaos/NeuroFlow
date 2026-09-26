package chat

import (
	"OnCallAgent/internal/server/ai/toolinput"
	"OnCallAgent/internal/server/ai/tools"
	"OnCallAgent/internal/server/model"
	"context"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	einoagent "github.com/cloudwego/eino/flow/agent"
	"github.com/cloudwego/eino/flow/agent/react"
	"github.com/cloudwego/eino/schema"
)

func (u chatServer) newReactAgentLambda(ctx context.Context) (node *compose.Lambda, err error) {
	// 先初始化所需的 chatModel
	toolableChatModel, err := model.NewOpenaiModel(ctx, u.config)
	if err != nil {
		return nil, err
	}

	tools.InitRAGTool(u.retriever)

	retrieveTool, err := tools.RetrieveTool()
	if err != nil {
		return nil, err
	}
	neuroPlanTool, err := tools.NeuroPreprocessingDraftTool()
	if err != nil {
		return nil, err
	}
	inspectDatasetTool, err := tools.InspectDatasetTool()
	if err != nil {
		return nil, err
	}
	acquisitionConfigTool, err := tools.ValidateAcquisitionConfigTool()
	if err != nil {
		return nil, err
	}
	pythonAnalysisTool, err := tools.RunNeuroAnalysisTool()
	if err != nil {
		return nil, err
	}
	neuroKitTool, err := tools.RunNeuroKitAnalysisTool()
	if err != nil {
		return nil, err
	}
	taskTool, err := tools.PreprocessingTaskTool()
	if err != nil {
		return nil, err
	}
	evidenceAuditTool, err := tools.KnowledgeEvidenceAuditTool()
	if err != nil {
		return nil, err
	}
	sleepStagingTool, err := tools.SleepStagingTool()
	if err != nil {
		return nil, err
	}
	// 初始化所需的 tools
	ppgTool, err := tools.PPGTool()
	if err != nil {
		return nil, err
	}
	uiComponentTool, err := tools.InspectUIComponentTool()
	if err != nil {
		return nil, err
	}
	toolConfig := compose.ToolsNodeConfig{
		// retrieve 用于查知识库；inspectDataset 读取已验证的文件事实；
		// neuroPlan 根据这些事实生成草案。三者职责保持独立，便于以后增加执行工具。
		Tools: []tool.BaseTool{retrieveTool, inspectDatasetTool, acquisitionConfigTool, neuroPlanTool, pythonAnalysisTool, neuroKitTool, taskTool, evidenceAuditTool, sleepStagingTool, ppgTool, uiComponentTool},
	}
	for index, registered := range toolConfig.Tools {
		toolConfig.Tools[index], err = tools.ScopeTool(ctx, registered)
		if err != nil {
			return nil, err
		}
	}

	// 创建 agent
	agent, err := react.NewAgent(ctx, &react.AgentConfig{
		ToolCallingModel: toolableChatModel,
		ToolsConfig:      toolConfig,
	})
	if err != nil {
		return nil, err
	}
	// 每次调用独立设置图预算，避免修改共享 Agent 造成并发会话串模式。
	// 12/30 是图节点执行预算，不是 12/30 次工具，更不限制 Python 内部算法步骤。
	options := func(ctx context.Context, opts []einoagent.AgentOption) []einoagent.AgentOption {
		budget := toolinput.CurrentResponsePolicy(ctx).MaxGraphSteps
		if toolinput.IsAnswerRepair(ctx) {
			budget = toolinput.AnswerRepairMaxSteps
		}
		return append(opts, einoagent.WithComposeOptions(compose.WithRuntimeMaxSteps(budget)))
	}
	generate := func(ctx context.Context, messages []*schema.Message, opts ...einoagent.AgentOption) (*schema.Message, error) {
		return agent.Generate(ctx, messages, options(ctx, opts)...)
	}
	stream := func(ctx context.Context, messages []*schema.Message, opts ...einoagent.AgentOption) (*schema.StreamReader[*schema.Message], error) {
		return agent.Stream(ctx, messages, options(ctx, opts)...)
	}
	node, err = compose.AnyLambda(generate, stream, nil, nil)
	if err != nil {
		return nil, err
	}
	return node, nil
}
