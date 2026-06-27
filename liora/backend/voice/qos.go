package voice

import (
	"github.com/pion/webrtc/v3"
)

type NetworkStats struct {
	CurrentBandwidth uint64
	PacketLoss       float64
}

func MonitorStats(pc *webrtc.PeerConnection) {
	_ = pc.GetStats()
}
