package groups

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

func (r *Repository) Create(g *Group) (int, error) {
	query := `
		INSERT INTO groups (name, description, creator_id, created_at)
		VALUES ($1, $2, $3, NOW())
		RETURNING id`

	err := r.db.QueryRow(query, g.Name, g.Description, g.CreatorID).Scan(&g.ID)
	if err != nil {
		return 0, fmt.Errorf("db error creating group: %v", err)
	}
	return g.ID, nil
}

func (r *Repository) AddMember(groupID int, userID string, role string) error {
	query := `
		INSERT INTO group_members (group_id, user_id, role, joined_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (group_id, user_id) DO NOTHING`

	_, err := r.db.Exec(query, groupID, userID, role)
	if err != nil {
		return fmt.Errorf("db error adding group member: %v", err)
	}
	return nil
}

func (r *Repository) RemoveMember(groupID int, userID string) error {
	query := `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, groupID, userID)
	if err != nil {
		return fmt.Errorf("db error removing group member: %v", err)
	}
	return nil
}

func (r *Repository) GetUserGroups(userID string) ([]Group, error) {
	query := `
		SELECT g.id, g.name, g.description, g.creator_id, g.created_at 
		FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.user_id = $1`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Group
	for rows.Next() {
		var g Group
		err := rows.Scan(&g.ID, &g.Name, &g.Description, &g.CreatorID, &g.CreatedAt)
		if err != nil {
			continue
		}
		list = append(list, g)
	}
	return list, nil
}

func (r *Repository) SaveMessage(m *GroupMessage) (int, error) {
	query := `
		INSERT INTO messages (group_id, sender_id, recipient_id, content, created_at, is_read)
		VALUES ($1, $2, $3, $4, NOW(), false)
		RETURNING id, created_at`

	recipientID := fmt.Sprintf("group_%d", m.GroupID)

	err := r.db.QueryRow(query, m.GroupID, m.SenderID, recipientID, m.Content).Scan(&m.ID, &m.CreatedAt)
	if err != nil {
		return 0, fmt.Errorf("db error saving group message: %v", err)
	}
	return m.ID, nil
}

func (r *Repository) GetMessagesByGroupId(groupID int) ([]GroupMessage, error) {
	query := `
		SELECT id, group_id, sender_id, content, created_at 
		FROM messages 
		WHERE group_id = $1 
		ORDER BY created_at ASC`

	rows, err := r.db.Query(query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []GroupMessage
	for rows.Next() {
		var m GroupMessage
		err := rows.Scan(&m.ID, &m.GroupID, &m.SenderID, &m.Content, &m.CreatedAt)
		if err != nil {
			continue
		}
		list = append(list, m)
	}
	return list, nil
}
