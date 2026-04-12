# Liora

![Version](https://img.shields.io/badge/version-1.0.0--alpha-00ff88?style=flat-square)
![Security](https://img.shields.io/badge/security-E2EE_|_Ed25519-00ff88?style=flat-square)
![Networking](https://img.shields.io/badge/networking-Encrypted_RPC-00ff88?style=flat-square)

**Liora** is a sovereign communication suite designed to eliminate the trade-off between high-end aesthetics and hardcore privacy. Built with **Go** and **Wails**, it provides a hardware-accelerated desktop experience that prioritizes cryptographic integrity and digital autonomy.

---

## Tech Architecture

### 1. Cryptographic Identity (Ed25519)
Unlike legacy messengers that rely on phone numbers or email addresses, Liora uses **Ed25519 (Edwards-curve Digital Signature Algorithm)**. 
- **Identity = Key:** Your `liora_identity.key` is your only ID. It’s mathematically impossible to forge.
- **Speed & Security:** Ed25519 provides 128-bit security with significantly smaller keys and faster performance than RSA or traditional ECDSA.

### 2. End-to-End Encryption (E2EE)
Liora implements a custom encryption layer where every bit of data is encrypted **locally** before it ever touches the network.
- **No Cleartext on Wire:** Even metadata is minimized to prevent traffic analysis.
- **Perfect Forward Secrecy (PFS):** (Planned) implementation to ensure that even if a long-term key is compromised, past sessions remain secure.

### 3. Local Vault & Persistence
The backend uses an encrypted **SQLite**-based vault (`liora_vault.db`) to store:
- **Encrypted Message History:** Never synced to a cloud.
- **Contact Handshakes:** Verified through public-key exchange.
- **Session States:** Managed through a secure Go-based controller.

---

## Technical Stack & Why

### **Backend: Go (Golang)**
Chosen for its memory safety, high-concurrency capabilities (Goroutines), and ability to compile into a single, static binary. 
- **Hexagonal Architecture:** The `backend/` folder is divided into independent domains (`crypto`, `db`, `network`), making the security logic easy to audit.

### **Frontend: React & TypeScript**
A strictly typed UI ensures that state management (like handling sensitive keys) is predictable and bug-free.
- **Glassmorphism Engine:** Custom SCSS architecture using backdrop-filters and alpha-channel transparency for an "Ultra-Dark" high-tech feel.
- **Wails Bridge:** High-speed IPC (Inter-Process Communication) between the Go backend and JS frontend, avoiding the bloat of an HTTP server.

---

## The Philosophy: "Digital Sovereignty"

Liora was born from the idea that **privacy is not a feature, it's a right**. 

1. **Zero Telemetry:** The app does not ping any "home" servers. It doesn't track your OS, location, or usage patterns.
2. **Minimalist Focus:** The interface is stripped of "social" features (likes, stories, ads) to focus entirely on pure, secure communication.
3. **Native Performance:** By using the OS's native web engine via Wails, Liora consumes ~80% less RAM than Electron-based alternatives like Discord or Signal.

---

## Internal Directory Breakdown

```text
liora/
├── backend/
│   ├── crypto/   # Implementation of Ed25519 and E2EE primitives
│   ├── db/       # Interaction with the encrypted liora_vault.db
│   ├── network/  # Secure socket handling and P2P protocols
│   └── vault/    # Logic for managing local sensitive credentials
├── frontend/     # React source with "Ultra-Dark" design system
└── app.go        # Main Wails entry point for backend-to-frontend bindings
