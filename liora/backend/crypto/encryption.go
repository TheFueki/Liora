package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"

	"golang.org/x/crypto/curve25519"
)

func GenerateSharedSecret(privateKey, theirPublicKey [32]byte) ([32]byte, error) {
	var sharedSecret [32]byte
	curve25519.ScalarMult(&sharedSecret, &privateKey, &theirPublicKey)
	return sharedSecret, nil
}

func EncryptWithSharedKey(plaintext []byte, sharedKey [32]byte) ([]byte, error) {
	block, err := aes.NewCipher(sharedKey[:])
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

func DecryptWithSharedKey(ciphertext []byte, sharedKey [32]byte) ([]byte, error) {
	block, err := aes.NewCipher(sharedKey[:])
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, actualCiphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return gcm.Open(nil, nonce, actualCiphertext, nil)
}

func ToByte32(s []byte) ([32]byte, error) {
	var a [32]byte
	if len(s) != 32 {
		return a, fmt.Errorf("invalid key length: expected 32, got %d", len(s))
	}
	copy(a[:], s)
	return a, nil
}

func DecodeHexKey(s string) ([32]byte, error) {
	var a [32]byte
	b, err := hex.DecodeString(s)
	if err != nil {
		return a, err
	}
	return ToByte32(b)
}

func EncodeKeyToHex(b []byte) string {
	return hex.EncodeToString(b)
}
