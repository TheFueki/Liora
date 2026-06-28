package audio

import (
	"github.com/pion/rtp"
)

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
