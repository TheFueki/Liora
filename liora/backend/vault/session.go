package vault

type Session struct {
	CurrentUserPubKey string
	IsAuthenticated   bool
}

var CurrentSession Session

func StartSession(pubKey string) {
	CurrentSession.CurrentUserPubKey = pubKey
	CurrentSession.IsAuthenticated = true
}
