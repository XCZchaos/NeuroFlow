package toolinput

import (
	"context"
	"testing"
)

func TestUserTextAndNoSave(t *testing.T) {
	ctx := WithUserText(context.Background(), "分析 EEG，但是不用保存预处理文件")
	if got := UserText(ctx); got != "分析 EEG，但是不用保存预处理文件" {
		t.Fatalf("unexpected user text: %q", got)
	}
	if !ExplicitNoSave(UserText(ctx)) || !ExplicitNoSave("Please do not save the output") {
		t.Fatal("explicit no-save request was missed")
	}
	if ExplicitNoSave("请保存预处理文件") || ExplicitNoSave("分析 EEG 数据") {
		t.Fatal("neutral or positive save intent was misclassified")
	}
}
