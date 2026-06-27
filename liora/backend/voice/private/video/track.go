package video

import (
	"github.com/pion/webrtc/v3"
)

func CreateVideoTrack(id, label string) (*webrtc.TrackLocalStaticRTP, error) {
	return webrtc.NewTrackLocalStaticRTP(webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8}, id, label)
}
