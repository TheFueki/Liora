package db

import (
	"log"
)

func SaveMessageLocal(msg LocalMessage) error {
	query := `
		INSERT INTO messages (sender, payload, timestamp) 
		VALUES (?, ?, ?)
	`
	_, err := LocalDB.Exec(query, msg.Sender, msg.Payload, msg.Timestamp)
	if err != nil {
		log.Println("Error saving message to local DB:", err)
		return err
	}
	return nil
}

func GetChatHistory(otherID string) ([]LocalMessage, error) {
	var messages []LocalMessage

	query := `
		SELECT id, sender, payload, timestamp 
		FROM messages 
		WHERE sender = ? OR sender = (SELECT public_id FROM profiles LIMIT 1) -- Упрощенно для фильтрации
		ORDER BY timestamp ASC
	`

	rows, err := LocalDB.Query(query, otherID)
	if err != nil {
		log.Println("Error querying local history:", err)
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var msg LocalMessage
		err := rows.Scan(&msg.ID, &msg.Sender, &msg.Payload, &msg.Timestamp)
		if err != nil {
			log.Println("Error scanning message row:", err)
			continue
		}
		messages = append(messages, msg)
	}

	return messages, nil
}
