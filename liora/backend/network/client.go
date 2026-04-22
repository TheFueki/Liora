package network

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"os"
	"time"

	"github.com/gorilla/websocket"
)

func ListenForMessages(myPubKey string, onMessage func(msg Message)) {
	supabaseUrl := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_KEY")

	u, _ := url.Parse(supabaseUrl)
	wsUrl := fmt.Sprintf("wss://%s/realtime/v1/websocket?apikey=%s&vsn=1.0.0", u.Host, supabaseKey)

	go func() {
		for {
			c, _, err := websocket.DefaultDialer.Dial(wsUrl, nil)
			if err != nil {
				log.Println("WS Dial error:", err)
				time.Sleep(5 * time.Second)
				continue
			}
			defer c.Close()

			joinMsg := map[string]interface{}{
				"topic":   "realtime:public:messages",
				"event":   "phx_join",
				"payload": map[string]interface{}{},
				"ref":     "1",
			}
			c.WriteJSON(joinMsg)

			for {
				var rawResponse struct {
					Topic   string      `json:"topic"`
					Event   string      `json:"event"`
					Payload interface{} `json:"payload"`
				}

				err := c.ReadJSON(&rawResponse)
				if err != nil {
					log.Println("WS Read error:", err)
					break
				}

				if rawResponse.Event == "INSERT" {
					payloadBytes, _ := json.Marshal(rawResponse.Payload)
					var data struct {
						Record Message `json:"record"`
					}

					if err := json.Unmarshal(payloadBytes, &data); err == nil {
						if data.Record.Receiver == myPubKey {
							onMessage(data.Record)
						}
					}
				}
			}
		}
	}()
}
