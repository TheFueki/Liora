package video

import (
	"github.com/pion/webrtc/v3"
)

func BindVideoInbound(track *webrtc.TrackRemote, localTrack *webrtc.TrackLocalStaticRTP) {
	buf := make([]byte, 1500)
	for {
		i, _, err := track.Read(buf)
		if err != nil {
			return
		}
		if _, err = localTrack.Write(buf[:i]); err != nil {
			return
		}
	}
}
