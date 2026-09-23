package chat

import (
	"context"

	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

func (u chatServer) BuildChatAgent(ctx context.Context) (r compose.Runnable[*UserMessage, *schema.Message], err error) {
	const (
		ModeEvidence = "ModeEvidence"
		ChatTemplate = "ChatTemplate"
		ReactAgent   = "ReactAgent"
		InputToChat  = "InputToChat"
	)
	g := compose.NewGraph[*UserMessage, *schema.Message]()
	_ = g.AddLambdaNode(ModeEvidence, compose.InvokableLambdaWithOption(modeRetrieval(u.retriever)), compose.WithNodeName("ModeEvidence"))
	chatTemplateKeyOfChatTemplate := newChatTemplateLambda(ctx)

	_ = g.AddChatTemplateNode(ChatTemplate, chatTemplateKeyOfChatTemplate)
	reactAgentKeyOfLambda, err := u.newReactAgentLambda(ctx)
	if err != nil {
		return nil, err
	}
	_ = g.AddLambdaNode(ReactAgent, reactAgentKeyOfLambda, compose.WithNodeName("ReActAgent"))

	// 外层工作流按模式执行 0/1/2 轮检索，再将结果与用户上下文合并给 ReAct。
	// 简单文件事实仍由 Agent 的 inspect_dataset 校验，不由知识库猜测。
	_ = g.AddLambdaNode(InputToChat, compose.InvokableLambdaWithOption(newInputToChatLambda), compose.WithNodeName("UserMessageToChat"))
	_ = g.AddEdge(compose.START, ModeEvidence)
	_ = g.AddEdge(compose.START, InputToChat)
	_ = g.AddEdge(ReactAgent, compose.END)
	_ = g.AddEdge(ModeEvidence, ChatTemplate)
	_ = g.AddEdge(InputToChat, ChatTemplate)
	_ = g.AddEdge(ChatTemplate, ReactAgent)
	r, err = g.Compile(ctx, compose.WithGraphName("ChatAgent"), compose.WithNodeTriggerMode(compose.AllPredecessor))
	if err != nil {
		return nil, err
	}
	return r, err
}
