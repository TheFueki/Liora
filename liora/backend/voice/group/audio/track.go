package audio

import (
	"github.com/pion/webrtc/v3"
)

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
