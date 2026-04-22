package db

import (
	"fmt"
	"os"
	"strings"

	"github.com/supabase-community/supabase-go"
)

var Client *supabase.Client

func InitSupabase() {
	apiUrl := os.Getenv("SUPABASE_URL")
	apiKey := os.Getenv("SUPABASE_KEY")

	if apiUrl == "" || apiKey == "" {
		fmt.Println("CRITICAL: Supabase URL or Key is empty in .env")
		return
	}

	if strings.HasSuffix(apiUrl, "/") {
		fmt.Println("WARNING: Your SUPABASE_URL has a trailing slash. Removing it...")
		apiUrl = strings.TrimSuffix(apiUrl, "/")
	}

	fmt.Printf("Connecting to Supabase: %s\n", apiUrl)

	client, err := supabase.NewClient(apiUrl, apiKey, &supabase.ClientOptions{
		Schema: "public",
	})

	if err != nil {
		fmt.Printf("Connection Error: %v\n", err)
		return
	}

	Client = client
	fmt.Println("Supabase client initialized")
}
