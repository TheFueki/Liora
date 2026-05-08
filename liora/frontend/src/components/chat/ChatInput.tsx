import { useState, KeyboardEvent, useEffect } from 'react';
import { SendHorizonal, Paperclip, Lock, ShieldAlert } from 'lucide-react';
import { EncryptMessage } from '../../../wailsjs/go/main/App'; 

interface ChatInputProps {
  recipientPubKey: string;
  onSend: (encryptedText: string) => void;
}

export default function ChatInput({ onSend, recipientPubKey }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [hasKeyError, setHasKeyError] = useState(false);

  useEffect(() => {
    if (!recipientPubKey || recipientPubKey.length === 0) {
      console.warn("ChatInput: recipientPubKey is missing or empty.");
      setHasKeyError(true);
    } else {
      setHasKeyError(false);
    }
  }, [recipientPubKey]);

  const handleSend = async () => {
    if (!text.trim() || isEncrypting) return;

    if (!recipientPubKey) {
      console.error("E2EE Error: No public key provided for encryption");
      return;
    }

    setIsEncrypting(true);
    try {
      const encryptedHex = await EncryptMessage(recipientPubKey, text);
      
      onSend(encryptedHex);

      setText('');
    } catch (error) {
      console.error("E2EE Encryption Error:", error);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`chat-input-wrapper glass-morphism ${hasKeyError ? 'key-warning' : ''}`}>
      <button className="attach-btn" title="Attach file">
        <Paperclip size={20} />
      </button>

      <div className="input-container">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasKeyError ? "Encryption key missing..." : "Write an encrypted message..."}
          disabled={isEncrypting || hasKeyError}
        />
        
        <div className="security-indicator">
          {hasKeyError ? (
            <ShieldAlert size={14} className="error-icon" title="Key validation failed" />
          ) : (
            <div className="lock-status" title="End-to-End Encrypted (X25519 + AES-GCM)">
              <Lock size={12} strokeWidth={3} />
              {isEncrypting && <span className="encrypting-loader"></span>}
            </div>
          )}
        </div>
      </div>

      <button 
        className={`send-btn ${text && !isEncrypting && !hasKeyError ? 'active' : ''}`} 
        onClick={handleSend}
        disabled={!text.trim() || isEncrypting || hasKeyError}
      >
        <SendHorizonal size={20} />
      </button>
    </div>
  );
}