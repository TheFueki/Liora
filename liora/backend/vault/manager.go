package vault

import (
	"errors"
	"os"
)

type VaultState struct {
	IsLocked bool
	HasKey   bool
}

func CheckIdentityExists() bool {
	if _, err := os.Stat("liora_identity.key"); errors.Is(err, os.ErrNotExist) {
		return false
	}
	return true
}

func LoadPrivateKey() ([]byte, error) {
	return os.ReadFile("liora_identity.key")
}
