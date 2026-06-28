package video

import (
	"github.com/pion/rtcp"
	"github.com/pion/webrtc/v3"
)

type VideoTrackHandler struct{}

func NewVideoTrackHandler() *VideoTrackHandler {
	return &VideoTrackHandler{}
}

func (h *VideoTrackHandler) RequestKeyFrame(pc *webrtc.PeerConnection, ssrc webrtc.SSRC) {
	pc.WriteRTCP([]rtcp.Packet{
		&rtcp.PictureLossIndication{MediaSSRC: uint32(ssrc)},
	})
}
