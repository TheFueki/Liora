package group

import (
	"sync"

	"github.com/pion/webrtc/v3"
)

type Participant struct {
	ID             string
	PeerConnection *webrtc.PeerConnection
	OutputTracks   map[string]*webrtc.TrackLocalStaticRTP
}

type Room struct {
	ID           string
	Mu           sync.RWMutex
	Participants map[string]*Participant
	Tracks       map[string]*webrtc.TrackLocalStaticRTP
}

type Manager struct {
	Mu    sync.RWMutex
	Rooms map[string]*Room
	API   *webrtc.API
}

func NewManager(api *webrtc.API) *Manager {
	return &Manager{
		Rooms: make(map[string]*Room),
		API:   api,
	}
}

func (m *Manager) GetOrCreateRoom(roomID string) *Room {
	m.Mu.Lock()
	defer m.Mu.Unlock()

	room, exists := m.Rooms[roomID]
	if !exists {
		room = &Room{
			ID:           roomID,
			Participants: make(map[string]*Participant),
			Tracks:       make(map[string]*webrtc.TrackLocalStaticRTP),
		}
		m.Rooms[roomID] = room
	}
	return room
}

func (r *Room) AddParticipant(userID string, pc *webrtc.PeerConnection) *Participant {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	p := &Participant{
		ID:             userID,
		PeerConnection: pc,
		OutputTracks:   make(map[string]*webrtc.TrackLocalStaticRTP),
	}
	r.Participants[userID] = p
	return p
}

func (r *Room) RemoveParticipant(userID string) {
	r.Mu.Lock()
	defer r.Mu.Unlock()

	p, exists := r.Participants[userID]
	if !exists {
		return
	}

	p.PeerConnection.Close()
	delete(r.Participants, userID)

	for trackID := range r.Tracks {
		if len(trackID) >= len(userID) && trackID[:len(userID)] == userID {
			delete(r.Tracks, trackID)
		}
	}
}

func (r *Room) BroadcastTrack(userID string, remoteTrack *webrtc.TrackRemote) {
	trackID := userID + "_" + remoteTrack.ID()

	r.Mu.Lock()
	localTrack, err := webrtc.NewTrackLocalStaticRTP(remoteTrack.Codec().RTPCodecCapability, remoteTrack.ID(), remoteTrack.StreamID())
	if err != nil {
		r.Mu.Unlock()
		return
	}
	r.Tracks[trackID] = localTrack
	r.Mu.Unlock()

	go func() {
		buf := make([]byte, 1500)
		for {
			n, _, err := remoteTrack.Read(buf)
			if err != nil {
				return
			}
			localTrack.Write(buf[:n])
		}
	}()

	r.Mu.RLock()
	defer r.Mu.RUnlock()

	for pID, p := range r.Participants {
		if pID == userID {
			continue
		}
		r.SubscribeToTrack(p, localTrack)
	}
}

func (r *Room) SubscribeToExistingTracks(p *Participant) {
	r.Mu.RLock()
	defer r.Mu.RUnlock()

	for trackID, localTrack := range r.Tracks {
		if len(trackID) >= len(p.ID) && trackID[:len(p.ID)] == p.ID {
			continue
		}
		r.SubscribeToTrack(p, localTrack)
	}
}

func (r *Room) SubscribeToTrack(p *Participant, track *webrtc.TrackLocalStaticRTP) {
	if _, exists := p.OutputTracks[track.ID()]; exists {
		return
	}

	rtpSender, err := p.PeerConnection.AddTrack(track)
	if err != nil {
		return
	}

	p.OutputTracks[track.ID()] = track

	go func() {
		buf := make([]byte, 1500)
		for {
			if _, _, err := rtpSender.Read(buf); err != nil {
				return
			}
		}
	}()
}
