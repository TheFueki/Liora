import { useState, KeyboardEvent, useEffect } from 'react';
import { SendHorizonal, Paperclip, Lock, ShieldAlert, X, FileText, Image as ImageIcon } from 'lucide-react';
import { EncryptMessage, SelectFile} from '../../../wailsjs/go/main/App'; 
import * as runtime from '../../../wailsjs/runtime/runtime'; 


interface Attachment {
  name: string;
  path: string;
  type: 'image' | 'file';
  preview?: string;
}

interface ChatInputProps {
  recipientPubKey: string;
  onSend: (encryptedData: string, isFile: boolean) => void;
}

export default function ChatInput({ onSend, recipientPubKey }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [hasKeyError, setHasKeyError] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  useEffect(() => {
    if (!recipientPubKey) {
      setHasKeyError(true);
    } else {
      setHasKeyError(false);
    }
  }, [recipientPubKey]);

const handleAttachClick = async () => {
  try {
    const result = await SelectFile(); 

    if (result) {
      const fileName = result.split(/[\\/]/).pop() || 'file';
      const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      
      setAttachment({
        name: fileName,
        path: result,
        type: isImg ? 'image' : 'file',
      });
    }
  } catch (err) {
    console.error("File selection error:", err);
  }
};

  const removeAttachment = () => setAttachment(null);

  const handleSend = async () => {
    if ((!text.trim() && !attachment) || isEncrypting || hasKeyError) return;

    setIsEncrypting(true);
    try {
      const payload = attachment 
        ? `FILE_PATH:${attachment.path}|CAPTION:${text}` 
        : text;

      const encryptedHex = await EncryptMessage(recipientPubKey, payload);
      
      onSend(encryptedHex, !!attachment);

      setText('');
      setAttachment(null);
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
    <div className="chat-input-area">
      {attachment && (
        <div className="attachment-preview-bar animate-fade">
          <div className="preview-card">
            {attachment.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
            <span className="file-name">{attachment.name}</span>
            <button onClick={removeAttachment} className="remove-btn">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className={`chat-input-wrapper glass-morphism ${hasKeyError ? 'key-warning' : ''}`}>
        <button 
          className={`attach-btn ${attachment ? 'active' : ''}`} 
          onClick={handleAttachClick}
          disabled={hasKeyError || isEncrypting}
        >
          <Paperclip size={20} />
        </button>

        <div className="input-container">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasKeyError ? "Encryption key missing..." : "Write a message..."}
            disabled={isEncrypting || hasKeyError}
          />
          
          <div className="security-indicator">
            {hasKeyError ? (
              <ShieldAlert size={14} className="error-icon" />
            ) : (
              <div className="lock-status">
                <Lock size={12} strokeWidth={3} />
                {isEncrypting && <span className="encrypting-loader"></span>}
              </div>
            )}
          </div>
        </div>

        <button 
          className={`send-btn ${(text.trim() || attachment) && !isEncrypting && !hasKeyError ? 'active' : ''}`} 
          onClick={handleSend}
          disabled={(!text.trim() && !attachment) || isEncrypting || hasKeyError}
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
}