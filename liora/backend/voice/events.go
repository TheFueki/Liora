package voice

type CallEvent struct {
	Type   string `json:"type"`
	ChatID string `json:"chat_id"`
	Data   string `json:"data,omitempty"`
}
