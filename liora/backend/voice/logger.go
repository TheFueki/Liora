package voice

import (
	"log"
	"os"
)

type VoiceLogger struct {
	infoLog *log.Logger
}

func NewVoiceLogger() *VoiceLogger {
	return &VoiceLogger{
		infoLog: log.New(os.Stdout, "VOICE: ", log.Ldate|log.Ltime),
	}
}

func (l *VoiceLogger) Info(msg string) {
	l.infoLog.Println(msg)
}
