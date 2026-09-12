package chat

import (
	"OnCallAgent/internal/server/ai/tools"
	"OnCallAgent/internal/server/model"
	"context"

	"github.com/cloudwego/eino/components/tool"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/flow/agent/react"
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
	pythonAnalysisTool, err := tools.RunNeuroAnalysisTool()
	if err != nil {
		return nil, err
	}
	// 初始化所需的 tools
	toolConfig := compose.ToolsNodeConfig{
		// retrieve 用于查知识库；inspectDataset 读取已验证的文件事实；
		// neuroPlan 根据这些事实生成草案。三者职责保持独立，便于以后增加执行工具。
		Tools: []tool.BaseTool{retrieveTool, inspectDatasetTool, neuroPlanTool, pythonAnalysisTool},
	}

	// 创建 agent
	agent, err := react.NewAgent(ctx, &react.AgentConfig{
		ToolCallingModel: toolableChatModel,
		ToolsConfig:      toolConfig,
	})
	if err != nil {
		return nil, err
	}
	node, err = compose.AnyLambda(agent.Generate, agent.Stream, nil, nil)
	if err != nil {
		return nil, err
	}
	return node, nil
}
