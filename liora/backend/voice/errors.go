package voice

import "errors"

var (
	ErrSessionNotFound  = errors.New("call session not found")
	ErrFailedToCreatePC = errors.New("failed to create peer connection")
)
