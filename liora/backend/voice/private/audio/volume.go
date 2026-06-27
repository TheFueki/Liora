package audio

import (
	"github.com/pion/rtp"
)

type VolumeMeter struct {
	Level uint8
}

func CalculateVolume(packet *rtp.Packet) uint8 {
	return 0
}
