package groups

import "time"

type Group struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Username    string    `json:"username"`
	Description string    `json:"description"`
	AvatarURL   string    `json:"avatar_url"`
	CreatorID   string    `json:"creator_id"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateGroupRequest struct {
	Name        string   `json:"name"`
	Username    string   `json:"username"`
	Description string   `json:"description"`
	AvatarURL   string   `json:"avatar_url"`
	CreatorID   string   `json:"creator_id"`
	Members     []string `json:"members"`
}

type GroupMember struct {
	ID       int       `json:"id"`
	GroupID  int       `json:"group_id"`
	UserID   string    `json:"user_id"`
	Role     string    `json:"role"`
	JoinedAt time.Time `json:"joined_at"`
}

type GroupMessage struct {
	ID        int       `json:"id"`
	GroupID   int       `json:"group_id"`
	SenderID  string    `json:"sender_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type SendMessageRequest struct {
	GroupID  string `json:"group_id"`
	SenderID string `json:"sender_id"`
	Content  string `json:"content"`
}
