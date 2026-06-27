package voice

import (
	"github.com/pion/webrtc/v3"
)

func RegisterDefaultCodecs(m *webrtc.MediaEngine) error {
	if err := m.RegisterDefaultCodecs(); err != nil {
		return err
	}
	return nil
}
