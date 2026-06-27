package voice

import (
	"github.com/pion/webrtc/v3"
)

type CallSession struct {
	PeerConnection *webrtc.PeerConnection
	UserID         string
	ChatID         string
	AudioTrack     *webrtc.TrackLocalStaticRTP
	VideoTrack     *webrtc.TrackLocalStaticRTP
}

func NewCallSession(userID, chatID string, pc *webrtc.PeerConnection) *CallSession {
	return &CallSession{
		PeerConnection: pc,
		UserID:         userID,
		ChatID:         chatID,
	}
}
