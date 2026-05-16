package channels

import "time"

type Channel struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	OwnerID     string    `json:"owner_id"`
	IsPrivate   bool      `json:"is_private"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateChannelRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	OwnerID     string `json:"owner_id"`
}

type ChannelPost struct {
	ID          int       `json:"id"`
	ChannelID   int       `json:"channel_id"`
	SenderID    string    `json:"sender_id"`
	RecipientID string    `json:"recipient_id"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
}

type SendPostRequest struct {
	ChannelID string `json:"channel_id"`
	SenderID  string `json:"sender_id"`
	Content   string `json:"content"`
}
