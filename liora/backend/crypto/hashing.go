package crypto

import (
	"crypto/sha256"
	"encoding/hex"
)

func HashData(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func GenerateShortID(pubKey string) string {
	if len(pubKey) < 8 {
		return pubKey
	}
	return pubKey[:4] + "-" + pubKey[len(pubKey)-4:]
}
