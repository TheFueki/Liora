# Privacy Policy & Manifesto

## 1. Digital Sovereignty
Liora is built on the principle of **Zero-Knowledge Architecture**. The developer(s) believe that privacy is a fundamental human right. 

## 2. Data Collection
- **No Personal Information:** Liora does not require, collect, or store your name, email, phone number, or any other PII (Personally Identifiable Information).
- **No Telemetry:** There are no tracking cookies, analytics, or crash reporting tools that send data to a central server.
- **Identity:** Your identity is defined solely by your local Ed25519 private key.

## 3. Encryption & Metadata
- **End-to-End Encryption (E2EE):** All message payloads are encrypted locally using AES-256-GCM before leaving your device. 
- **Ciphertext only:** The remote database (Supabase) only stores hex-encoded encrypted blobs.
- **Local Vault:** Your chat history is stored in an encrypted SQLite database on your local machine.

## 4. Third-Party Services
Liora uses Supabase as a backend provider. While Supabase handles the encrypted transport, they have no technical means to decrypt your messages.

---

# Disclaimer 

## 1. "As-Is" Basis
This software is provided "as is", without warranty of any kind, express or implied. In no event shall the authors be liable for any claim, damages, or other liability.

## 2. Key Responsibility
**You are the sole custodian of your private key.** - If you lose your `liora_identity.key` file, your account and all encrypted data are **permanently unrecoverable**. 
- There is no "Password Reset" or "Account Recovery" feature.

## 3. Experimental Software
Liora is currently in development. While we prioritize security, users should exercise caution when using the software for sensitive communications.

## 4. Use of Software
The developers of Liora do not condone and are not responsible for any illegal activities conducted through the use of this software.