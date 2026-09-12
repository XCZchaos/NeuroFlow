package tools

import (
	"OnCallAgent/internal/server/dataset"
	"context"
	"encoding/json"
	"fmt"
	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/components/tool/utils"
)

type InspectDatasetInput struct {
	// Agent 从用户消息的数据上下文中取得这个 ID，而不是猜测文件名或路径。
	DatasetID string `json:"dataset_id" jsonschema:"description=数据导入后获得的 dataset_id"`
}

// InspectDatasetTool 将注册表包装为 Eino 工具。
// 模型调用工具得到的是程序验证过的 JSON，因此可以可靠回答通道数和采样率；
// 没有这些字段时，模型提示用户重新导入，不能自行编造。
func InspectDatasetTool() (tool.InvokableTool, error) {
	return utils.InferTool("inspect_dataset",
		"读取已注册神经信号数据集的可信元数据，包括格式、模态、通道数、采样率、时长、通道类型、标注与已标记坏道。回答文件事实问题时优先使用。",
		func(ctx context.Context, input InspectDatasetInput) (string, error) {
			record, ok := dataset.Get(input.DatasetID)
			if !ok {
				return "", fmt.Errorf("dataset_id 不存在或后端已重启，请重新导入数据")
			}
			payload, err := json.Marshal(record)
			if err != nil {
				return "", fmt.Errorf("序列化数据集信息: %w", err)
			}
			return string(payload), nil
		})
}
