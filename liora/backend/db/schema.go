package db

type Contact struct {
	PubKey   string `json:"pubkey"`
	Username string `json:"username"`
}

type LocalMessage struct {
	ID        int    `json:"id"`
	Sender    string `json:"sender"`
	Payload   string `json:"payload"`
	Timestamp int64  `json:"timestamp"`
}
