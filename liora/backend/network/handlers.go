package network

import (
	"context"
	"encoding/hex"
	"fmt"
	"liora/backend/crypto"
	"liora/backend/db"
	"liora/backend/vault"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func HandleIncomingMessage(ctx context.Context, msg Message) {
	myPrivBytes, err := vault.LoadPrivateKey()
	if err != nil {
		fmt.Println("Critical: Could not load private key for decryption")
		return
	}

	myPriv, _ := crypto.ToByte32(myPrivBytes)
	theirPub, err := crypto.DecodeHexKey(msg.Sender)
	if err != nil {
		fmt.Println("Error decoding sender public key:", err)
		return
	}

	sharedKey, err := crypto.GenerateSharedSecret(myPriv, theirPub)
	if err != nil {
		fmt.Println("Error generating shared secret:", err)
		return
	}

	encryptedBytes, _ := hex.DecodeString(msg.Payload)
	decryptedBytes, err := crypto.DecryptWithSharedKey(encryptedBytes, sharedKey)
	if err != nil {
		fmt.Printf("Decryption failed for message from %s: %v\n", crypto.GenerateShortID(msg.Sender), err)
		return
	}

	decryptedText := string(decryptedBytes)
	timestamp := time.Now().Unix()

	localMsg := db.LocalMessage{
		Sender:    msg.Sender,
		Payload:   decryptedText,
		Timestamp: timestamp,
	}
	db.SaveMessageLocal(localMsg)

	runtime.EventsEmit(ctx, "new_message", map[string]interface{}{
		"sender":    msg.Sender,
		"short_id":  crypto.GenerateShortID(msg.Sender),
		"text":      decryptedText,
		"timestamp": timestamp,
	})

	fmt.Printf("✔ Processed E2EE message from %s\n", crypto.GenerateShortID(msg.Sender))
}
