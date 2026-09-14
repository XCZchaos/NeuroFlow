// Package analysisprogress broadcasts structured backend execution events.
package analysisprogress

import (
	"sync"
	"time"
)

type Event struct {
	Sequence int64  `json:"sequence"`
	Dataset  string `json:"dataset_id"`
	Step     string `json:"step"`
	Status   string `json:"status"`
	Detail   string `json:"detail,omitempty"`
	Attempt  int    `json:"attempt,omitempty"`
	At       string `json:"at"`
}

type stream struct {
	sequence int64
	recent   []Event
	nextID   int
	clients  map[int]chan Event
}

var registry = struct {
	sync.Mutex
	streams map[string]*stream
}{streams: map[string]*stream{}}

func Publish(dataset, step, status, detail string, attempt int) Event {
	registry.Lock()
	defer registry.Unlock()
	s := registry.streams[dataset]
	if s == nil {
		s = &stream{clients: map[int]chan Event{}}
		registry.streams[dataset] = s
	}
	s.sequence++
	e := Event{Sequence: s.sequence, Dataset: dataset, Step: step, Status: status, Detail: detail,
		Attempt: attempt, At: time.Now().UTC().Format(time.RFC3339Nano)}
	s.recent = append(s.recent, e)
	if len(s.recent) > 200 {
		s.recent = append([]Event(nil), s.recent[len(s.recent)-200:]...)
	}
	for _, ch := range s.clients {
		select {
		case ch <- e:
		default:
		}
	}
	return e
}

func Subscribe(dataset string, after int64) (<-chan Event, []Event, func()) {
	registry.Lock()
	s := registry.streams[dataset]
	if s == nil {
		s = &stream{clients: map[int]chan Event{}}
		registry.streams[dataset] = s
	}
	id := s.nextID
	s.nextID++
	ch := make(chan Event, 32)
	s.clients[id] = ch
	backlog := []Event{}
	for _, e := range s.recent {
		if e.Sequence > after {
			backlog = append(backlog, e)
		}
	}
	registry.Unlock()
	return ch, backlog, func() {
		registry.Lock()
		if current := registry.streams[dataset]; current != nil {
			delete(current.clients, id)
		}
		registry.Unlock()
	}
}
