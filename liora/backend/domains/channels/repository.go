package channels

import (
	"database/sql"
	"fmt"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(c *Channel) (int, error) {
	query := `
		INSERT INTO channels (name, description, owner_id, is_private, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id`

	err := r.db.QueryRow(query, c.Name, c.Description, c.OwnerID, c.IsPrivate).Scan(&c.ID)
	if err != nil {
		return 0, fmt.Errorf("db error creating channel: %v", err)
	}

	return c.ID, nil
}

func (r *Repository) GetAll() ([]Channel, error) {
	query := `SELECT id, name, description, owner_id, is_private, created_at FROM channels WHERE is_private = false`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Channel
	for rows.Next() {
		var c Channel
		err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.OwnerID, &c.IsPrivate, &c.CreatedAt)
		if err != nil {
			continue
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *Repository) SavePost(p *ChannelPost) (int, error) {
	query := `
		INSERT INTO messages (channel_id, sender_id, recipient_id, content, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, created_at`

	err := r.db.QueryRow(query, p.ChannelID, p.SenderID, p.RecipientID, p.Content).Scan(&p.ID, &p.CreatedAt)
	if err != nil {
		return 0, fmt.Errorf("db error saving post: %v", err)
	}

	return p.ID, nil
}

func (r *Repository) GetPostsByChannelId(channelID int) ([]ChannelPost, error) {
	query := `
		SELECT id, COALESCE(channel_id, 0), sender_id, recipient_id, content, created_at 
		FROM messages 
		WHERE channel_id = $1 
		ORDER BY created_at ASC`

	rows, err := r.db.Query(query, channelID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []ChannelPost
	for rows.Next() {
		var p ChannelPost
		err := rows.Scan(&p.ID, &p.ChannelID, &p.SenderID, &p.RecipientID, &p.Content, &p.CreatedAt)
		if err != nil {
			continue
		}
		list = append(list, p)
	}
	return list, nil
}
