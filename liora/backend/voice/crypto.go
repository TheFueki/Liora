package voice

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"

	"github.com/pion/webrtc/v3"
)

func GenerateDTLSCertificate() ([]webrtc.Certificate, error) {
	secretKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, err
	}
	cert, err := webrtc.GenerateCertificate(secretKey)
	if err != nil {
		return nil, err
	}
	return []webrtc.Certificate{*cert}, nil
}
