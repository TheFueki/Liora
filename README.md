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
|   ├── domains/  
      ├── channels/
      ├── groups/
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




### Roadmap 

#### 1. Compilation and Data Flow Diagram
```
       [ Client / Frontend (Vite + React) ]
                       │
             Wails JavaScript Bridge
                       │
                       ▼
       [ Backend Core (Go) ] ──(IPC)── [ Wails Runtime Environment ]
               │
               ├─► [ Cryptography / E2EE (Ed25519) ]
               └─► [ Local Database / Storage (Dexie/SQLite) ]

```

#### 2. Pre-launch Environment Check
Before starting, ensure that the versions meet the requirements:

* **Go:** `1.21+` (`go version`)
* **Node.js:** `20.0.0+` (`node -v`)
* **Wails CLI:** `2.12.0+` (`wails doctor`)


#### 3. Step-by-Step Deployment Guide

If the project is transferred to another PC or the cache is cleared, run this command sequence:

```bash

# Let’s change to the frontend directory and rebuild the dependencies according to the lockfile

cd frontend

npm ci
# We ensure that the icon package is installed

npm install lucide-react
# We check if Vite compiles the project without Rollup errors

npm run build
# We return to the root directory and start build/dev

cd ..

wails dev
```
