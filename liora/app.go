package main

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"liora/backend/crypto"
	"liora/backend/db"
	"liora/backend/network"
	"liora/backend/vault"

	"github.com/supabase-community/postgrest-go"
	"github.com/supabase-community/supabase-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ChatMessage struct {
	ID        int    `json:"id"`
	Content   string `json:"content"`
	IsMine    bool   `json:"is_mine"`
	Timestamp string `json:"timestamp"`
}

type Message struct {
	ID          string    `json:"id"`
	SenderID    string    `json:"sender_id"`
	RecipientID string    `json:"recipient_id"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"created_at"`
}

type App struct {
	ctx    context.Context
	client *supabase.Client
	myID   string
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	a.client = db.Client

	a.myID = a.initIdentity()

	network.ListenForMessages(a.myID, func(msg network.Message) {
		network.HandleIncomingMessage(a.ctx, msg)
	})
}

func (a *App) initIdentity() string {
	keyFile := "liora_identity.key"
	var publicKey ed25519.PublicKey

	data, err := os.ReadFile(keyFile)
	if err != nil {
		pub, priv, _ := ed25519.GenerateKey(rand.Reader)
		publicKey = pub
		_ = os.WriteFile(keyFile, priv, 0600)
	} else {
		privKey := ed25519.PrivateKey(data)
		publicKey = privKey.Public().(ed25519.PublicKey)
	}
	return hex.EncodeToString(publicKey)
}

func (a *App) CreateNewIdentity() (string, error) {
	keyFile := "liora_identity.key"

	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", err
	}

	err = os.WriteFile(keyFile, priv, 0600)
	if err != nil {
		return "", err
	}

	a.myID = hex.EncodeToString(pub)
	return a.myID, nil
}

func (a *App) ImportKey(hexKey string) (string, error) {
	return a.initIdentity(), nil
}

func (a *App) GetMyID() string {
	if a.myID == "" {
		a.myID = a.initIdentity()
	}
	return a.myID
}

func (a *App) GetProfile() (map[string]interface{}, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database not connected")
	}

	myID := a.GetMyID()
	var results []map[string]interface{}

	// Добавляем логирование
	fmt.Printf("Searching for profile with ID: [%s]\n", myID)

	_, err := a.client.From("profiles").
		Select("*", "exact", false).
		Eq("public_id", myID).
		ExecuteTo(&results)

	if err != nil {
		fmt.Println("SUPABASE ERROR:", err)
		return nil, err
	}

	if len(results) > 0 {
		fmt.Printf("Profile found: %+v\n", results[0])
		return results[0], nil
	}

	fmt.Println("Profile not found in DB rows")
	return nil, fmt.Errorf("profile not found")
}
func (a *App) GetMyInfo() (map[string]interface{}, error) {
	fmt.Println("DEBUG: Requesting info for ID:", a.myID)
	profile, err := a.GetProfile()
	if err != nil {
		return map[string]interface{}{
			"public_id":  a.myID,
			"username":   "New User",
			"avatar_url": "",
			"is_stub":    true,
		}, nil
	}
	return profile, nil
}
func (a *App) UpdateProfile(username, bio, avatar string) error {
	if a.client == nil {
		return fmt.Errorf("database not connected")
	}

	row := map[string]interface{}{
		"public_id":  a.GetMyID(),
		"username":   username,
		"bio":        bio,
		"avatar_url": avatar,
	}

	// Выполняем Upsert
	_, _, err := a.client.From("profiles").Upsert(row, "public_id", "representation", "exact").Execute()

	if err == nil {
		// КЛЮЧЕВОЙ МОМЕНТ: Сигнализируем фронтенду, что профиль обновился!
		runtime.EventsEmit(a.ctx, "profile_updated")
		fmt.Println("Event emitted: profile_updated")
	}

	return err
}

func (a *App) SearchUsers(query string) ([]map[string]interface{}, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database not connected")
	}
	if len(query) < 2 {
		return []map[string]interface{}{}, nil
	}

	var results []map[string]interface{}
	filter := fmt.Sprintf("username.ilike.%%%s%%,public_id.ilike.%%%s%%", query, query)

	_, err := a.client.From("profiles").
		Select("*", "exact", false).
		Or(filter, "").
		Limit(10, "").
		ExecuteTo(&results)

	return results, err
}

func (a *App) SendMessage(recipientID string, content string) error {
	if a.client == nil {
		return fmt.Errorf("database not connected")
	}

	myPrivBytes, err := vault.LoadPrivateKey()
	if err != nil {
		return fmt.Errorf("could not load private key")
	}

	myPriv, _ := crypto.ToByte32(myPrivBytes)
	theirPub, err := crypto.DecodeHexKey(recipientID)
	if err != nil {
		return fmt.Errorf("invalid recipient public key")
	}

	sharedKey, _ := crypto.GenerateSharedSecret(myPriv, theirPub)
	encryptedBytes, err := crypto.EncryptWithSharedKey([]byte(content), sharedKey)
	if err != nil {
		return fmt.Errorf("encryption failed: %v", err)
	}

	payloadHex := hex.EncodeToString(encryptedBytes)

	_, _, err = a.client.From("messages").Insert(map[string]interface{}{
		"sender_id":    a.myID,
		"recipient_id": recipientID,
		"content":      payloadHex,
	}, false, "", "", "").Execute()

	localMsg := db.LocalMessage{
		Sender:    a.myID,
		Payload:   content,
		Timestamp: time.Now().Unix(),
	}
	db.SaveMessageLocal(localMsg)

	return err
}

func (a *App) GetChatHistory(otherID string) ([]Message, error) {
	if a.client == nil {
		return nil, fmt.Errorf("no client")
	}

	var messages []Message
	filter := fmt.Sprintf("and(sender_id.eq.\"%s\",recipient_id.eq.\"%s\"),and(sender_id.eq.\"%s\",recipient_id.eq.\"%s\")",
		a.myID, otherID, otherID, a.myID)

	_, err := a.client.From("messages").
		Select("*", "exact", false).
		Or(filter, "").
		Order("created_at", &postgrest.OrderOpts{Ascending: true}).
		ExecuteTo(&messages)

	return messages, err
}

func (a *App) GetMessages() []Message {
	return []Message{
		{ID: "1", Content: "Liora Active.", SenderID: a.GetMyID(), RecipientID: "system", CreatedAt: time.Now()},
	}
}

func (a *App) GetLocalHistory(otherID string) ([]db.LocalMessage, error) {
	return db.GetChatHistory(otherID)
}
