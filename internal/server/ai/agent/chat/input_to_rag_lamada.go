package chat

import (
	"context"
	"strings"

	"github.com/cloudwego/eino/compose"
)

func newInputToRagLambda(ctx context.Context, input *UserMessage, opts ...compose.LambdaOpt) (outPut string, err error) {
	query := buildKnowledgeQuery(input.Query)
	if input.ResponseMode == "deep" {
		query += "\ndeep analysis context: prerequisites constraints risks validation audit"
	}
	return query, nil
}

// buildKnowledgeQuery 为中文自然语言问题补充知识库中使用的标准术语。
//
// Qdrant 的向量检索仍以用户原问题为主体；补充词只用于提高“脑电/坏导/重参考”
// 等口语表达与知识条目中 “EEG/bad_channels/referencing” 元数据的匹配率。
// 这里不推断文件事实，也不生成参数，因此不会把未经验证的信息传给 Agent。
func buildKnowledgeQuery(query string) string {
	query = strings.TrimSpace(query)
	if query == "" {
		return query
	}

	type vocabulary struct {
		keywords []string
		term     string
	}
	vocabularies := []vocabulary{
		{[]string{"EEG", "eeg", "脑电"}, "modality:EEG"},
		{[]string{"MEG", "meg", "脑磁"}, "modality:MEG"},
		{[]string{"fNIRS", "fnirs", "近红外", "血氧"}, "modality:fNIRS"},
		{[]string{"滤波", "高通", "低通", "陷波", "filter"}, "stage:filtering"},
		{[]string{"坏道", "坏导", "坏通道", "插值"}, "stage:bad_channels"},
		{[]string{"参考", "重参考", "平均参考", "reference"}, "stage:referencing"},
		{[]string{"ICA", "ica", "伪迹", "眼电", "肌电", "心电"}, "stage:artifacts"},
		{[]string{"分段", "epoch", "Epoch", "事件", "基线"}, "stage:epoching"},
		{[]string{"P300", "p300"}, "paradigm:P300"},
		{[]string{"SSVEP", "ssvep", "稳态视觉"}, "paradigm:SSVEP"},
		{[]string{"cVEP", "CVEP", "cvep", "编码视觉"}, "paradigm:cVEP"},
		{[]string{"运动想象", "motor imagery"}, "paradigm:motor_imagery"},
		{[]string{"Maxwell", "maxwell", "SSS", "sss"}, "stage:maxwell_filter"},
		{[]string{"TDDR", "tddr", "运动校正"}, "stage:motion_correction"},
		{[]string{"评估", "准确率", "AUC", "泛化", "交叉验证"}, "stage:evaluation"},
	}

	terms := make([]string, 0, 4)
	for _, item := range vocabularies {
		for _, keyword := range item.keywords {
			if strings.Contains(query, keyword) {
				terms = append(terms, item.term)
				break
			}
		}
	}
	if len(terms) == 0 {
		return query
	}
	return query + "\nknowledge retrieval context: " + strings.Join(terms, " ")
}
