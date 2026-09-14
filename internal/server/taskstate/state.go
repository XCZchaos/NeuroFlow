// Package taskstate stores resumable work separately from lossy conversation summaries.
package taskstate

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

type Field struct {
	Name     string `json:"name"`
	Question string `json:"question"`
}
type Answer struct {
	Value json.RawMessage `json:"value"`
	Quote string          `json:"user_quote"`
	At    string          `json:"at"`
}
type Step struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Detail string `json:"detail,omitempty"`
}
type Event struct {
	At     string `json:"at"`
	Action string `json:"action"`
	Detail string `json:"detail,omitempty"`
}
type State struct {
	ID         string            `json:"id"`
	SessionID  string            `json:"session_id"`
	DatasetID  string            `json:"dataset_id"`
	Revision   int               `json:"revision"`
	Status     string            `json:"status"`
	Fields     []Field           `json:"pending_fields"`
	Answers    map[string]Answer `json:"answers"`
	Plan       json.RawMessage   `json:"analysis_parameters"`
	Validation json.RawMessage   `json:"validation,omitempty"`
	Steps      []Step            `json:"steps"`
	Result     json.RawMessage   `json:"result,omitempty"`
	Events     []Event           `json:"audit"`
}

func (s *State) Record(action, detail string) {
	s.Events = append(s.Events, Event{time.Now().UTC().Format(time.RFC3339Nano), action, detail})
}
func (s *State) Active() bool { return s.Status != "completed" && s.Status != "cancelled" }

// Store uses the same SQLite database as sessions. CAS revisions prevent two tool
// calls from claiming the same step; every mutation is persisted before execution.
type Store struct{ DB *sql.DB }

func (s *Store) Init(ctx context.Context) error {
	_, err := s.DB.ExecContext(ctx, `CREATE TABLE IF NOT EXISTS agent_tasks (
 id TEXT PRIMARY KEY, session_id TEXT NOT NULL, revision INTEGER NOT NULL,
 state_json TEXT NOT NULL, FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE)`)
	if err != nil {
		return err
	}
	// A process crash cannot prove whether an external operation finished. Keep it
	// interrupted, never silently rerun a possibly saved analysis on startup.
	rows, err := s.DB.QueryContext(ctx, `SELECT state_json FROM agent_tasks`)
	if err != nil {
		return err
	}
	var interrupted []*State
	for rows.Next() {
		var raw []byte
		if err = rows.Scan(&raw); err != nil {
			rows.Close()
			return err
		}
		var state State
		if err = json.Unmarshal(raw, &state); err != nil {
			rows.Close()
			return err
		}
		if state.Status == "running" || state.Status == "validating" {
			interrupted = append(interrupted, &state)
		}
	}
	err = rows.Err()
	rows.Close()
	if err != nil {
		return err
	}
	for _, state := range interrupted {
		state.Status = "interrupted"
		for i := range state.Steps {
			if state.Steps[i].Status == "running" {
				state.Steps[i].Status = "interrupted"
			}
		}
		state.Record("interrupted", "Backend restarted; inspect outputs before explicitly retrying")
		if err = s.Save(ctx, state); err != nil {
			return err
		}
	}
	return nil
}
func (s *Store) Get(ctx context.Context, session string) (*State, error) {
	var raw []byte
	err := s.DB.QueryRowContext(ctx, `SELECT state_json FROM agent_tasks WHERE session_id=? ORDER BY rowid DESC LIMIT 1`, session).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var state State
	err = json.Unmarshal(raw, &state)
	return &state, err
}
func (s *Store) Save(ctx context.Context, state *State) error {
	next := *state
	next.Revision++
	raw, err := json.Marshal(next)
	if err != nil {
		return err
	}
	var result sql.Result
	if state.Revision == 0 {
		// Only one active task per session, even if start calls race.
		result, err = s.DB.ExecContext(ctx, `INSERT INTO agent_tasks(id,session_id,revision,state_json)
   SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM agent_tasks WHERE session_id=? AND json_extract(state_json,'$.status') NOT IN ('completed','cancelled'))`, state.ID, state.SessionID, next.Revision, string(raw), state.SessionID)
	} else {
		result, err = s.DB.ExecContext(ctx, `UPDATE agent_tasks SET revision=?,state_json=? WHERE id=? AND session_id=? AND revision=?`, next.Revision, string(raw), state.ID, state.SessionID, state.Revision)
	}
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n != 1 {
		return fmt.Errorf("task changed concurrently; read current task before retrying")
	}
	state.Revision = next.Revision
	return nil
}

type scopeKey struct{}
type Scope struct {
	Store                             *Store
	SessionID, DatasetID, UserMessage string
}

func WithScope(ctx context.Context, scope Scope) context.Context {
	return context.WithValue(ctx, scopeKey{}, scope)
}
func FromContext(ctx context.Context) (Scope, bool) {
	s, ok := ctx.Value(scopeKey{}).(Scope)
	return s, ok
}
