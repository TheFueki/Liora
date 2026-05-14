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
		INSERT INTO channels (name, description, owner_id, is_private)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	err := r.db.QueryRow(query, c.Name, c.Description, c.OwnerID, c.IsPrivate).Scan(&c.ID)
	if err != nil {
		return 0, fmt.Errorf("db error: %v", err)
	}

	return c.ID, nil
}

func (r *Repository) GetAll() ([]Channel, error) {
	rows, err := r.db.Query("SELECT id, name, description FROM channels WHERE is_private = false")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Channel
	for rows.Next() {
		var c Channel
		if err := rows.Scan(&c.ID, &c.Name, &c.Description); err != nil {
			continue
		}
		list = append(list, c)
	}
	return list, nil
}
