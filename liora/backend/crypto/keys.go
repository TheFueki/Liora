package crypto

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"os"
)

func GenerateIdentity() (string, string, error) {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", "", err
	}

	pubHex := hex.EncodeToString(pub)
	privHex := hex.EncodeToString(priv)

	os.WriteFile("liora_identity.key", []byte(privHex), 0600)

	return pubHex, privHex, nil
}

func GetFingerprint(pubKeyHex string) string {
	if len(pubKeyHex) > 8 {
		return pubKeyHex[:8]
	}
	return pubKeyHex
}
