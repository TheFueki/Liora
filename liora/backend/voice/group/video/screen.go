package video

import (
	"liora/backend/voice/group"

	"github.com/pion/webrtc/v3"
)

type ScreenShareHandler struct {
	Manager *group.Manager
}

func NewScreenShareHandler(m *group.Manager) *ScreenShareHandler {
	return &ScreenShareHandler{Manager: m}
}

func (h *ScreenShareHandler) HandleScreenTrack(roomID string, userID string, remoteTrack *webrtc.TrackRemote) {
	room := h.Manager.GetOrCreateRoom(roomID)
	screenTrackID := userID + "_screen_" + remoteTrack.ID()

	room.Mu.Lock()
	localTrack, err := webrtc.NewTrackLocalStaticRTP(remoteTrack.Codec().RTPCodecCapability, screenTrackID, remoteTrack.StreamID())
	if err != nil {
		room.Mu.Unlock()
		return
	}
	room.Tracks[screenTrackID] = localTrack
	room.Mu.Unlock()

	go func() {
		buf := make([]byte, 1500)
		for {
			n, _, err := remoteTrack.Read(buf)
			if err != nil {
				return
			}
			localTrack.Write(buf[:n])
		}
	}()
}
