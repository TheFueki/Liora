package network

type Message struct {
	ID        string `json:"id,omitempty"`
	Sender    string `json:"sender"`
	Receiver  string `json:"receiver"`
	Payload   string `json:"payload"`
	Timestamp int64  `json:"timestamp"`
}
