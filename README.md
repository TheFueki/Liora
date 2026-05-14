# Liora: Technical Specification

![Version](https://img.shields.io/badge/version-1.0.0--alpha-00ff88?style=flat-square)
![Security](https://img.shields.io/badge/security-E2EE_|_AES--GCM_|_X25519-00ff88?style=flat-square)
![Stack](https://img.shields.io/badge/stack-Go_|_Wails_|_React-00ff88?style=flat-square)

Liora is a high-performance desktop communication suite utilizing a Go-based backend and a hardware-accelerated frontend. The system architecture enforces local cryptographic operations to ensure digital autonomy and data sovereignty.

---
![Liora Architecture](https://github.com/user-attachments/assets/0698ee0e-a037-47f6-bed7-2aed7e5cd615)

## 1. Security Architecture

### 1.1 Identity Management
*   **Protocol:** Ed25519 (Edwards-curve Digital Signature Algorithm).
*   **Mechanism:** User identity is bound to a 64-byte private key stored locally (`liora_identity.key`).
*   **Public ID:** Derived directly from the Ed25519 public key (Hex-encoded). No PII (Personally Identifiable Information) is required for account creation.

### 1.2 Encryption Layer (E2EE)
*   **Key Exchange:** X25519 (Diffie-Hellman) derived from Ed25519 seeds to establish a 32-byte Shared Secret.
*   **Symmetric Encryption:** AES-256-GCM (Galois/Counter Mode) for authenticated encryption of all message payloads.
*   **Local Processing:** All encryption/decryption occurs within the Go-native layer; plaintext never enters the network or the database.

### 1.3 Data Persistence
*   **Remote Storage:** Supabase (PostgreSQL) stores only Hex-encoded ciphertexts and public metadata(soon will be changed to the regular postgreSQL).
*   **Local Storage:** Encrypted SQLite vault for message history and verified contact handshakes.

---

## 2. Technical Stack

### 2.1 Backend (Go)
*   **Wails Framework:** Bridges Go logic to the UI via high-speed IPC, eliminating the overhead of a local HTTP server.
*   **Concurrency:** Goroutines manage real-time event listening and database operations.
*   **Cryptographic Primitives:** Native `crypto/ed25519` and `golang.org/x/crypto/curve25519`.

### 2.2 Frontend (React & TypeScript)
*   **UI Engine:** Strictly typed React components with custom SCSS for "Ultra-Dark Glassmorphism" aesthetics.
*   **State Management:** Predictable handling of session keys and message buffers.
*   **Performance:** Utilizes the native OS web engine (WebView2/WebKit), resulting in ~50-80MB RAM idle consumption.

---

## 3. Directory Structure

```
liora/
├── backend/
│   ├── crypto/   # Ed25519/X25519 primitives & AES-GCM logic
│   ├── db/       # Supabase client & local SQLite persistence
│   ├── network/  # Real-time message listeners & event routing
│   └── vault/    # Local filesystem key management
├── frontend/     # TypeScript source & Dark-mode design system
├── app.go        # Wails binding definitions and bridge methods
└── main.go       # Application entry point
```

## 4. Operational Requirements
Network: TLS-encrypted tunnel for all remote database interactions.

Identity: Possession of the liora_identity.key file is the sole method of authentication.

Privacy: Zero telemetry. No tracking of OS, usage metrics, or location data.


# README

## About

This is the official Wails React-TS template.

You can configure the project by editing `wails.json`. More information about the project settings can be found
here: https://wails.io/docs/reference/project-config

## Live Development

To run in live development mode, run `wails dev` in the project directory. This will run a Vite development
server that will provide very fast hot reload of your frontend changes. If you want to develop in a browser
and have access to your Go methods, there is also a dev server that runs on http://localhost:34115. Connect
to this in your browser, and you can call your Go code from devtools.

## Building

To build a redistributable, production mode package, use `wails build`.
