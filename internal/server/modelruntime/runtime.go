// Package modelruntime publishes complete, immutable model generations. A request
// keeps its original generation; subsequent requests see all new model consumers.
package modelruntime

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"

	"OnCallAgent/internal/server/ai/agent/chat"
	"OnCallAgent/internal/server/model"
	"OnCallAgent/pkg/config"
	"github.com/cloudwego/eino-ext/components/model/openai"
	qdrant "github.com/cloudwego/eino-ext/components/retriever/qdrant"
	"github.com/cloudwego/eino/compose"
	"github.com/cloudwego/eino/schema"
)

type Settings struct {
	Provider     string  `json:"provider"`
	APIBase      string  `json:"api_base"`
	Model        string  `json:"model"`
	APIKey       string  `json:"api_key"`
	MaxTokens    int     `json:"max_tokens"`
	Temperature  float32 `json:"temperature"`
	Revision     string  `json:"revision"`
	Capabilities struct {
		Detected    bool `json:"detected"`
		Temperature bool `json:"temperature"`
	} `json:"capabilities"`
}

type Snapshot struct {
	Config   config.Config
	Runner   compose.Runnable[*chat.UserMessage, *schema.Message]
	Model    *openai.ChatModel
	Revision string
}

// Public deliberately excludes the key and any reversible representation of it.
func (s *Snapshot) Public() map[string]any {
	c := s.Config.OpenAI
	return map[string]any{"revision": s.Revision, "provider": c.Provider, "api_base": c.APIBase, "model": c.Model,
		"max_tokens": c.MaxTokens, "temperature": c.Temperature, "temperature_sent": c.CapabilitiesDetected && c.SupportsTemperature,
		"has_api_key": c.APIKey != "", "enabled": c.APIKey != "", "scope": []string{"all_workspace_agents", "quick", "deep", "plan"}}
}

type Manager struct {
	current   atomic.Pointer[Snapshot]
	mu        sync.Mutex
	retriever *qdrant.Retriever
}

func New(cfg *config.Config, runner compose.Runnable[*chat.UserMessage, *schema.Message], model *openai.ChatModel, retriever *qdrant.Retriever) *Manager {
	m := &Manager{retriever: retriever}
	m.current.Store(&Snapshot{Config: *cfg, Runner: runner, Model: model, Revision: NewID()})
	return m
}
func NewID() string {
	var b [24]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b[:])
}
func (m *Manager) Snapshot() *Snapshot { return m.current.Load() }

func (m *Manager) Apply(ctx context.Context, value Settings) (*Snapshot, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	base, err := url.Parse(value.APIBase)
	if err != nil || base.Host == "" || (base.Scheme != "https" && base.Scheme != "http") || base.User != nil || base.RawQuery != "" || base.Fragment != "" {
		return nil, errors.New("API Base must be an HTTP(S) URL without credentials or query")
	}
	if strings.TrimSpace(value.Model) == "" || value.MaxTokens < 128 || value.MaxTokens > 32768 || value.Temperature < 0 || value.Temperature > 2 || len(value.Revision) < 16 || len(value.Revision) > 128 {
		return nil, errors.New("invalid model, token limit, temperature or revision")
	}
	previous := m.Snapshot()
	c := previous.Config
	c.OpenAI = config.OpenAIConfig{APIKey: strings.TrimSpace(value.APIKey), APIBase: strings.TrimRight(value.APIBase, "/"), Model: strings.TrimSpace(value.Model), Provider: value.Provider, MaxTokens: value.MaxTokens, Temperature: value.Temperature, CapabilitiesDetected: value.Capabilities.Detected, SupportsTemperature: value.Capabilities.Temperature}
	// Build first, swap last: an invalid update cannot half-update /chat and /plan.
	next := &Snapshot{Config: c, Revision: value.Revision}
	if c.OpenAI.APIKey != "" {
		agent := chat.NewChatServer(m.retriever, &next.Config)
		next.Runner, err = agent.BuildChatAgent(ctx)
		if err != nil {
			return nil, errors.New("could not build Agent for new configuration")
		}
		next.Model, err = model.NewOpenaiModel(ctx, &next.Config)
		if err != nil {
			return nil, errors.New("could not build plan model for new configuration")
		}
	}
	// Empty key explicitly disables new model requests; never fall back to the old key.
	m.current.Store(next)
	return next, nil
}

// The local control secret is read by Electron's main process only. It is not an
// API key, never enters the renderer, and survives a Go restart for reconnection.
func ControlToken(filename string) (string, error) {
	if err := os.MkdirAll(filepath.Dir(filename), 0700); err != nil {
		return "", err
	}
	token := NewID()
	f, err := os.OpenFile(filename, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if os.IsExist(err) {
		b, e := os.ReadFile(filename)
		if e != nil {
			return "", e
		}
		if len(strings.TrimSpace(string(b))) < 32 {
			return "", errors.New("invalid model control token")
		}
		return strings.TrimSpace(string(b)), nil
	}
	if err != nil {
		return "", err
	}
	defer f.Close()
	if _, err = f.WriteString(token); err != nil {
		return "", err
	}
	return token, nil
}
