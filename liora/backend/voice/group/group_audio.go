package group

import (
	"github.com/pion/rtp"
	"github.com/pion/webrtc/v3"
)

type AudioSession struct {
	Manager *Manager
}

func NewAudioSession(m *Manager) *AudioSession {
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

type AudioTrackHandler struct{}

func NewAudioTrackHandler() *AudioTrackHandler {
	return &AudioTrackHandler{}
}

func (h *AudioTrackHandler) CreateLocalTrack(remoteTrack *webrtc.TrackRemote) (*webrtc.TrackLocalStaticRTP, error) {
	return webrtc.NewTrackLocalStaticRTP(
		remoteTrack.Codec().RTPCodecCapability,
		remoteTrack.ID(),
		remoteTrack.StreamID(),
	)
}

type VolumeAnalyzer struct{}

func NewVolumeAnalyzer() *VolumeAnalyzer {
	return &VolumeAnalyzer{}
}

func (v *VolumeAnalyzer) GetLevel(packet *rtp.Packet) (uint8, bool) {
	payload := packet.GetExtension(1)
	if payload == nil || len(payload) == 0 {
		return 0, false
	}
	return payload[0] & 0x7F, true
}
