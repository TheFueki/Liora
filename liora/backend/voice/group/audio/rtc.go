package audio

import (
	"liora/backend/voice/group"

	"github.com/pion/webrtc/v3"
)

type AudioSession struct {
	Manager *group.Manager
}

func NewAudioSession(m *group.Manager) *AudioSession {
	return &AudioSession{Manager: m}
}

func (s *AudioSession) JoinRoom(roomID string, userID string, pc *webrtc.PeerConnection) {
	room := s.Manager.GetOrCreateRoom(roomID)
	p := room.AddParticipant(userID, pc)

	pc.OnTrack(func(remoteTrack *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		if remoteTrack.Kind() == webrtc.RTPCodecTypeAudio {
			room.BroadcastTrack(userID, remoteTrack)
		}
	})

	room.SubscribeToExistingTracks(p)

	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		if state == webrtc.PeerConnectionStateDisconnected || state == webrtc.PeerConnectionStateFailed {
			room.RemoveParticipant(userID)
		}
	})
}
