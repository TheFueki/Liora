package video

import (
	"liora/backend/voice/group"

	"github.com/pion/webrtc/v3"
)

type VideoSession struct {
	Manager *group.Manager
}

func NewVideoSession(m *group.Manager) *VideoSession {
	return &VideoSession{Manager: m}
}

func (s *VideoSession) JoinRoom(roomID string, userID string, pc *webrtc.PeerConnection) {
	room := s.Manager.GetOrCreateRoom(roomID)
	p := room.AddParticipant(userID, pc)

	pc.OnTrack(func(remoteTrack *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		if remoteTrack.Kind() == webrtc.RTPCodecTypeVideo || remoteTrack.Kind() == webrtc.RTPCodecTypeAudio {
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
