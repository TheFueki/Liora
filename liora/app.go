package main

import (
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"liora/backend/crypto"
	"liora/backend/db"
	"liora/backend/domains/channels"
	"liora/backend/network"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/supabase-community/postgrest-go"
	storage_go "github.com/supabase-community/storage-go"
	"github.com/supabase-community/supabase-go"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type ChatMessage struct {
	ID        int    `json:"id"`
	Content   string `json:"content"`
	IsMine    bool   `json:"is_mine"`
	Timestamp string `json:"timestamp"`
}
type GroupInfo struct {
	Name        string `json:"name"`
	Username    string `json:"username"`
	Description string `json:"description"`
	AvatarURL   string `json:"avatar_url"`
}

type Account struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatarUrl"`
}

type Message struct {
	ID          string  `json:"id"`
	SenderID    string  `json:"sender_id"`
	RecipientID string  `json:"recipient_id"`
	ChannelID   *string `json:"channel_id"`
	Content     string  `json:"content"`
	IsRead      bool    `json:"is_read"`
	CreatedAt   string  `json:"created_at"`
}

type GroupMessage struct {
	ID        string `json:"id,omitempty"`
	GroupID   string `json:"group_id"`
	SenderID  string `json:"sender_id"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at,omitempty"`
}

type App struct {
	ctx      context.Context
	client   *supabase.Client
	myID     string
	DB       *sql.DB
	Channels *channels.Service
}

type ChannelInfo struct {
	Name        string `json:"name"`
	Username    string `json:"username"`
	Description string `json:"description"`
	AvatarURL   string `json:"avatar_url"`
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

func (a *App) SelectFile() (string, error) {
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select File",
		Filters: []runtime.FileFilter{
			{DisplayName: "Images (*.png;*.jpg)", Pattern: "*.png;*.jpg;*.jpeg;*.gif"},
			{DisplayName: "All Files", Pattern: "*.*"},
		},
	})
	return selection, err
}

func (a *App) loadMyPrivateKey() ([32]byte, error) {
	var zero [32]byte
	data, err := os.ReadFile("liora_identity.key")
	if err != nil {
		return zero, err
	}
	if len(data) < 32 {
		return zero, fmt.Errorf("invalid key file size")
	}
	return crypto.ToByte32(data[:32])
}

func (a *App) initIdentity() string {
	keyFile := "liora_identity.key"

	data, err := os.ReadFile(keyFile)
	if err != nil || len(data) < 64 {
		pub, priv, _ := ed25519.GenerateKey(rand.Reader)
		id := hex.EncodeToString(pub)

		_ = os.WriteFile(keyFile, priv, 0600)
		_ = os.WriteFile(id+".key", priv, 0600)
		return id
	}

	privKey := ed25519.PrivateKey(data)
	publicKey := privKey.Public().(ed25519.PublicKey)
	return hex.EncodeToString(publicKey)
}

func (a *App) CreateNewIdentity() (string, error) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", err
	}

	id := hex.EncodeToString(pub)

	err = os.WriteFile("liora_identity.key", priv, 0600)
	if err != nil {
		return "", err
	}
	_ = os.WriteFile(id+".key", priv, 0600)

	a.myID = id
	return a.myID, nil
}

func (a *App) ImportKey(hexKey string) (string, error) {
	if len(hexKey) != 128 {
		return "", fmt.Errorf("INVALID_KEY_LENGTH_EXPECTED_128")
	}

	privKeyBytes, err := hex.DecodeString(hexKey)
	if err != nil {
		return "", fmt.Errorf("invalid hex format")
	}

	privKey := ed25519.PrivateKey(privKeyBytes)
	pub := privKey.Public().(ed25519.PublicKey)
	id := hex.EncodeToString(pub)

	err = os.WriteFile("liora_identity.key", privKeyBytes, 0600)
	if err != nil {
		return "", fmt.Errorf("failed to save: %v", err)
	}
	_ = os.WriteFile(id+".key", privKeyBytes, 0600)

	a.myID = id
	return a.myID, nil
}

func (a *App) GetMyID() string {
	if a.myID == "" || a.myID == "0000000000000000000000000000000000000000000000000000000000000000" {
		a.myID = a.initIdentity()
	}
	return a.myID
}

func (a *App) EncryptMessage(theirPubKeyHex string, plaintext string) (string, error) {
	theirKey, err := crypto.DecodeHexKey(theirPubKeyHex)
	if err != nil {
		return "", err
	}

	myPrivKey, err := a.loadMyPrivateKey()
	if err != nil {
		return "", err
	}

	shared, err := crypto.GenerateSharedSecret(myPrivKey, theirKey)
	if err != nil {
		return "", err
	}

	ciphertext, err := crypto.EncryptWithSharedKey([]byte(plaintext), shared)
	if err != nil {
		return "", err
	}

	return hex.EncodeToString(ciphertext), nil
}

func (a *App) DecryptMessage(senderPubKeyHex string, ciphertextHex string) (string, error) {
	fmt.Printf("[DEBUG-CRYPTO] === НАЧАЛО ДЕШИФРОВАНИЯ ===\n")
	fmt.Printf("[DEBUG-CRYPTO] Мой Public ID (a.myID): %s\n", a.myID)
	fmt.Printf("[DEBUG-CRYPTO] Переданный ключ отправителя (senderPubKeyHex): %s\n", senderPubKeyHex)
	fmt.Printf("[DEBUG-CRYPTO] Длина шифротекста (ciphertextHex): %d символов\n", len(ciphertextHex))

	senderKey, err := crypto.DecodeHexKey(senderPubKeyHex)
	if err != nil {
		fmt.Printf("[DEBUG-CRYPTO] Ошибка DecodeHexKey: %v\n", err)
		return "[Key Error]", nil
	}

	myPrivKey, err := a.loadMyPrivateKey()
	if err != nil {
		fmt.Printf("[DEBUG-CRYPTO] Ошибка loadMyPrivateKey: %v\n", err)
		return "[Identity Error]", nil
	}

	ciphertext, err := hex.DecodeString(ciphertextHex)
	if err != nil {
		fmt.Printf("[DEBUG-CRYPTO] Ошибка DecodeString (не валидный Hex): %v\n", err)
		return "[Format Error]", nil
	}

	shared, err := crypto.GenerateSharedSecret(myPrivKey, senderKey)
	if err != nil {
		fmt.Printf("[DEBUG-CRYPTO] Ошибка GenerateSharedSecret (Diffie-Hellman паника): %v\n", err)
		return "[Crypto Error]", nil
	}
	fmt.Printf("[DEBUG-CRYPTO] Shared Secret успешно вычислен (Hex): %s\n", hex.EncodeToString(shared[:4]))

	plaintext, err := crypto.DecryptWithSharedKey(ciphertext, shared)
	if err != nil {
		fmt.Printf("[DEBUG-CRYPTO] Критическая ошибка DecryptWithSharedKey: %v (Неверный ключ или битый буфер)\n", err)
		return "[Decryption Error]", nil
	}

	fmt.Printf("[DEBUG-CRYPTO] УСПЕХ: Сообщение расшифровано\n")
	return string(plaintext), nil
}

func (a *App) GetAvailableAccounts() ([]Account, error) {
	files, err := os.ReadDir(".")
	if err != nil {
		return nil, err
	}

	var accountIDs []string
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".key" && file.Name() != "liora_identity.key" {
			id := file.Name()[:len(file.Name())-len(".key")]
			accountIDs = append(accountIDs, id)
		}
	}

	if len(accountIDs) == 0 {
		return []Account{}, nil
	}

	var results []map[string]interface{}
	_, err = a.client.From("profiles").
		Select("public_id, username, avatar_url", "exact", false).
		In("public_id", accountIDs).
		ExecuteTo(&results)

	profileMap := make(map[string]map[string]interface{})
	if err == nil {
		for _, p := range results {
			if id, ok := p["public_id"].(string); ok {
				profileMap[id] = p
			}
		}
	}

	var accounts []Account
	for _, id := range accountIDs {
		username := id
		avatar := ""

		if p, ok := profileMap[id]; ok {
			if u, ok := p["username"].(string); ok && u != "" {
				username = u
			}
			if av, ok := p["avatar_url"].(string); ok {
				avatar = av
			}
		}

		accounts = append(accounts, Account{
			ID:        id,
			Username:  username,
			AvatarURL: avatar,
		})
	}

	return accounts, nil
}

func (a *App) SwitchToAccount(accountID string) (string, error) {
	sourceFile := accountID + ".key"
	data, err := os.ReadFile(sourceFile)
	if err != nil {
		return "", fmt.Errorf("account file not found: %v", err)
	}

	err = os.WriteFile("liora_identity.key", data, 0600)
	if err != nil {
		return "", err
	}

	a.myID = hex.EncodeToString(ed25519.PrivateKey(data).Public().(ed25519.PublicKey))
	return a.myID, nil
}

func (a *App) Logout() error {
	keyFile := "liora_identity.key"
	a.myID = ""

	if _, err := os.Stat(keyFile); err == nil {
		err := os.Remove(keyFile)
		if err != nil {
			return fmt.Errorf("failed to delete identity file: %v", err)
		}
	}
	return nil
}

func (a *App) GetProfile() (map[string]interface{}, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database not connected")
	}

	myID := a.GetMyID()
	var results []map[string]interface{}

	_, err := a.client.From("profiles").
		Select("*", "exact", false).
		Eq("public_id", myID).
		ExecuteTo(&results)

	if err != nil {
		return nil, err
	}

	if len(results) > 0 {
		return results[0], nil
	}

	return nil, fmt.Errorf("profile not found")
}

func (a *App) GetMyInfo() (map[string]interface{}, error) {
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

	_, _, err := a.client.From("profiles").Upsert(row, "public_id", "representation", "exact").Execute()

	if err == nil {
		runtime.EventsEmit(a.ctx, "profile_updated")
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

func (a *App) uploadFileToStorage(filePath string) (string, error) {
	fileData, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	fileName := filepath.Base(filePath)
	uniqueName := fmt.Sprintf("%d_%s", time.Now().UnixNano(), fileName)

	type bucketInterface interface {
		Upload(string, []byte, storage_go.FileOptions) any
		GetPublicUrl(string, string) storage_go.SignedUrlResponse
	}

	rawStorage := any(a.client.Storage).(interface {
		From(string) *storage_go.Client
	})
	bucket := any(rawStorage.From("chat-attachments")).(bucketInterface)

	uploadResult := bucket.Upload(uniqueName, fileData, storage_go.FileOptions{})

	if resp, ok := uploadResult.(struct{ Error string }); ok && resp.Error != "" {
		return "", fmt.Errorf("storage error: %s", resp.Error)
	}

	publicUrlObj := bucket.GetPublicUrl(uniqueName, "")

	return publicUrlObj.SignedURL, nil
}

func (a *App) CreateNewChannel(info ChannelInfo) (map[string]interface{}, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database not connected")
	}

	row := map[string]interface{}{
		"name":        info.Name,
		"username":    info.Username,
		"description": info.Description,
		"owner_id":    a.myID,
		"created_at":  time.Now(),
		"avatar_url":  info.AvatarURL,
	}

	var results []map[string]interface{}
	_, err := a.client.From("channels").Insert(row, false, "", "", "").ExecuteTo(&results)

	if err != nil {
		return nil, err
	}

	if len(results) > 0 {
		return results[0], nil
	}

	row["owner_id"] = a.myID
	return row, nil
}
func (a *App) CreateNewGroup(info GroupInfo) (map[string]interface{}, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database not connected")
	}

	row := map[string]interface{}{
		"name":        info.Name,
		"username":    info.Username,
		"description": info.Description,
		"creator_id":  a.myID,
		"created_at":  time.Now(),
		"avatar_url":  info.AvatarURL,
	}

	var results []map[string]interface{}
	_, err := a.client.From("groups").Insert(row, false, "", "", "").ExecuteTo(&results)

	if err != nil {
		return nil, err
	}

	if len(results) > 0 {
		return results[0], nil
	}

	return row, nil
}

func (a *App) checkIfChannel(id string) bool {
	var result []map[string]interface{}
	_, err := a.client.From("channels").
		Select("id", "exact", false).
		Eq("id", id).
		ExecuteTo(&result)

	if err != nil || len(result) == 0 {
		return false
	}
	return true
}

func (a *App) GetMessages(targetID string, targetPubKey string) ([]Message, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database not connected")
	}

	var messages []Message
	var err error

	if a.checkIfChannel(targetID) {
		_, err = a.client.From("messages").
			Select("*", "exact", false).
			Eq("channel_id", targetID).
			Order("created_at", &postgrest.OrderOpts{Ascending: true}).
			ExecuteTo(&messages)
	} else {
		filterQuery := fmt.Sprintf("and(sender_id.eq.%s,recipient_id.eq.%s),and(sender_id.eq.%s,recipient_id.eq.%s)", a.myID, targetID, targetID, a.myID)

		_, err = a.client.From("messages").
			Select("*", "exact", false).
			Or(filterQuery, "").
			Filter("channel_id", "is", "null").
			Order("created_at", &postgrest.OrderOpts{Ascending: true}).
			ExecuteTo(&messages)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages: %v", err)
	}

	for i := range messages {
		if messages[i].ChannelID != nil && *messages[i].ChannelID != "" {
			continue
		}
		var decryptionKey string
		if messages[i].SenderID == a.myID {
			decryptionKey = messages[i].RecipientID
		} else {
			decryptionKey = messages[i].SenderID
		}

		if decryptionKey != "" {
			decrypted, err := a.DecryptMessage(decryptionKey, messages[i].Content)
			if err == nil {
				messages[i].Content = decrypted
			} else {
				messages[i].Content = "🔒 [Decryption Error]"
			}
		}
	}

	return messages, nil
}

func (a *App) SendMessage(recipientID string, content string) error {
	if a.client == nil {
		return fmt.Errorf("database not connected")
	}

	finalContent := content

	if strings.HasPrefix(content, "FILE_PATH:") {
		parts := strings.Split(content, "|CAPTION:")
		filePath := strings.TrimPrefix(parts[0], "FILE_PATH:")
		caption := ""
		if len(parts) > 1 {
			caption = parts[1]
		}
		fileURL, err := a.uploadFileToStorage(filePath)
		if err != nil {
			return fmt.Errorf("failed to upload file: %v", err)
		}

		finalContent = fmt.Sprintf("IMAGE_URL:%s|CAPTION:%s", fileURL, caption)
	}

	isChannel := a.checkIfChannel(recipientID)

	var payload map[string]interface{}

	if isChannel {
		payload = map[string]interface{}{
			"sender_id":    a.myID,
			"recipient_id": recipientID,
			"channel_id":   recipientID,
			"content":      finalContent,
			"is_read":      false,
		}
	} else {
		encryptedHex, err := a.EncryptMessage(recipientID, finalContent)
		if err != nil {
			return fmt.Errorf("encryption failed: %v", err)
		}
		payload = map[string]interface{}{
			"sender_id":    a.myID,
			"recipient_id": recipientID,
			"content":      encryptedHex,
			"is_read":      false,
			"channel_id":   nil,
		}
	}

	_, _, err := a.client.From("messages").Insert(payload, false, "", "", "").Execute()
	if err != nil {
		return err
	}

	db.SaveMessageLocal(db.LocalMessage{
		Sender:    a.myID,
		Payload:   finalContent,
		Timestamp: time.Now().Unix(),
	})

	return nil
}

func (a *App) GetChatHistory(otherID string) ([]Message, error) {
	if a.client == nil {
		return nil, fmt.Errorf("no client")
	}

	var messages []Message
	filter := fmt.Sprintf("and(sender_id.eq.%s,recipient_id.eq.%s),and(sender_id.eq.%s,recipient_id.eq.%s)",
		a.myID, otherID, otherID, a.myID)

	_, err := a.client.From("messages").
		Select("*", "exact", false).
		Or(filter, "").
		Order("created_at", &postgrest.OrderOpts{Ascending: true}).
		ExecuteTo(&messages)

	return messages, err
}

func (a *App) GetLocalHistory(otherID string) ([]db.LocalMessage, error) {
	return db.GetChatHistory(otherID)
}

func (a *App) SendGroupMessage(groupID string, content string) error {
	if a.client == nil {
		return fmt.Errorf("database not connected")
	}

	payload := map[string]interface{}{
		"group_id":  groupID,
		"sender_id": a.myID,
		"content":   content,
	}

	_, _, err := a.client.From("group_messages").Insert(payload, false, "", "", "").Execute()
	return err
}

func (a *App) GetGroupMessages(groupID string) ([]GroupMessage, error) {
	if a.client == nil {
		return nil, fmt.Errorf("database not connected")
	}

	var messages []GroupMessage
	_, err := a.client.From("group_messages").
		Select("*", "exact", false).
		Eq("group_id", groupID).
		Order("created_at", &postgrest.OrderOpts{Ascending: true}).
		ExecuteTo(&messages)

	if err != nil {
		return nil, err
	}

	return messages, nil
}
