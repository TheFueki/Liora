package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ed25519"
	"crypto/rand"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"io"
	"math/big"

	"golang.org/x/crypto/curve25519"
)

func ed25519PrivateKeyToX25519(edPriv ed25519.PrivateKey) [32]byte {
	var x25519Priv [32]byte
	h := sha512.Sum512(edPriv.Seed())
	copy(x25519Priv[:], h[:32])

	x25519Priv[0] &= 248
	x25519Priv[31] &= 127
	x25519Priv[31] |= 64
	return x25519Priv
}

func ed25519PublicKeyToX25519(edPub ed25519.PublicKey) ([32]byte, error) {
	var x25519Pub [32]byte
	if len(edPub) != 32 {
		return x25519Pub, fmt.Errorf("invalid ed25519 public key length")
	}

	yBytes := make([]byte, 32)
	copy(yBytes, edPub)
	yBytes[31] &= 0x7F

	for i, j := 0, len(yBytes)-1; i < j; i, j = i+1, j-1 {
		yBytes[i], yBytes[j] = yBytes[j], yBytes[i]
	}

	y := new(big.Int).SetBytes(yBytes)

	p := new(big.Int).Sub(new(big.Int).Lsh(big.NewInt(1), 255), big.NewInt(19))
	one := big.NewInt(1)

	num := new(big.Int).Add(one, y)
	num.Mod(num, p)

	den := new(big.Int).Sub(one, y)
	den.Mod(den, p)

	denInv := new(big.Int).ModInverse(den, p)
	if denInv == nil {
		return x25519Pub, fmt.Errorf("failed to compute modular inverse")
	}

	u := new(big.Int).Mul(num, denInv)
	u.Mod(u, p)

	uBytes := u.Bytes()
	padded := make([]byte, 32)
	copy(padded[32-len(uBytes):], uBytes)

	for i, j := 0, len(padded)-1; i < j; i, j = i+1, j-1 {
		padded[i], padded[j] = padded[j], padded[i]
	}

	copy(x25519Pub[:], padded)
	return x25519Pub, nil
}

func GenerateSharedSecret(privateKey, theirPublicKey [32]byte) ([32]byte, error) {
	var edPriv ed25519.PrivateKey
	if len(privateKey) == 32 {
		edPriv = ed25519.NewKeyFromSeed(privateKey[:])
	} else {
		edPriv = privateKey[:]
	}

	x25519Priv := ed25519PrivateKeyToX25519(edPriv)

	x25519Pub, err := ed25519PublicKeyToX25519(theirPublicKey[:])
	if err != nil {
		return [32]byte{}, err
	}

	var sharedSecret [32]byte
	curve25519.ScalarMult(&sharedSecret, &x25519Priv, &x25519Pub)

	return sha256.Sum256(sharedSecret[:]), nil
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
