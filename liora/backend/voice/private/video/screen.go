package video

import (
	"github.com/pion/webrtc/v3"
)

type ScreenShare struct {
	IsActive bool
	Track    *webrtc.TrackLocalStaticRTP
}
