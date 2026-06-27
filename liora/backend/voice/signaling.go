package voice

import (
	"github.com/pion/webrtc/v3"
)

type SignalingPayload struct {
	ChatID string `json:"chatId"`
	SDP    string `json:"sdp"`
	Type   string `json:"type"`
}

func ProcessOffer(payload SignalingPayload, pc *webrtc.PeerConnection) (string, error) {
	desc := webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  payload.SDP,
	}
	if err := pc.SetRemoteDescription(desc); err != nil {
		return "", err
	}
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		return "", err
	}
	if err := pc.SetLocalDescription(answer); err != nil {
		return "", err
	}
	return answer.SDP, nil
}
