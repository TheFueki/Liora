package db

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var LocalDB *sql.DB

func InitLocalDB() {
	var err error
	LocalDB, err = sql.Open("sqlite", "./liora_vault.db")
	if err != nil {
		log.Fatal(err)
	}

	msgTable := `
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender TEXT,
		payload TEXT,
		timestamp INTEGER
	);`

	// Таблица профилей
	resTable := `
	CREATE TABLE IF NOT EXISTS profiles (
		public_id TEXT PRIMARY KEY,
		username TEXT
	);`

	if _, err := LocalDB.Exec(msgTable); err != nil {
		log.Fatal(err)
	}

	if _, err := LocalDB.Exec(resTable); err != nil {
		log.Fatal(err)
	}
}
