package audio

import (
	"github.com/pion/webrtc/v3"
)

func CreateAudioTrack(id, label string) (*webrtc.TrackLocalStaticRTP, error) {
	return webrtc.NewTrackLocalStaticRTP(webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeOpus}, id, label)
}
