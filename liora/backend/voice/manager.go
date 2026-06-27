package voice

import (
	"sync"
)

type CallManager struct {
	mu       sync.RWMutex
	sessions map[string]*CallSession
}

func NewCallManager() *CallManager {
	return &CallManager{
		sessions: make(map[string]*CallSession),
	}
}

func (m *CallManager) AddSession(id string, s *CallSession) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[id] = s
}

func (m *CallManager) RemoveSession(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if s, exists := m.sessions[id]; exists {
		s.PeerConnection.Close()
		delete(m.sessions, id)
	}
}

func (m *CallManager) GetSession(id string) (*CallSession, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, exists := m.sessions[id]
	return s, exists
}
