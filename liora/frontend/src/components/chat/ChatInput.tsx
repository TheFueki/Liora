import { useState, KeyboardEvent, useEffect } from 'react';
import { SendHorizonal, Paperclip, Lock, ShieldAlert, X, FileText, Image as ImageIcon, Globe } from 'lucide-react';
// @ts-ignore
import { SelectFile } from '../../../wailsjs/go/main/App'; 

interface Attachment {
  name: string;
  path: string;
  type: 'image' | 'file';
  preview?: string;
}

interface ChatInputProps {
  recipientPubKey: string; 
  onSend: (data: string) => void; 
  isChannel?: boolean;
}

export default function ChatInput({ onSend, recipientPubKey, isChannel }: ChatInputProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); 
  const [hasKeyError, setHasKeyError] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);

  useEffect(() => {
    if (!isChannel && (!recipientPubKey || recipientPubKey.trim() === '')) {
      setHasKeyError(true);
    } else {
      setHasKeyError(false);
    }
  }, [recipientPubKey, isChannel]);

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
    if ((!text.trim() && !attachment) || isProcessing || (hasKeyError && !isChannel)) return;

    setIsProcessing(true);
    try {
      const payload = attachment 
        ? `FILE_PATH:${attachment.path}|CAPTION:${text}` 
        : text;

      onSend(payload);

      setText('');
      setAttachment(null);
    } catch (error) {
      console.error("Sending Error:", error);
    } finally {
      setIsProcessing(false);
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

      <div className={`chat-input-wrapper glass-morphism ${hasKeyError && !isChannel ? 'key-warning' : ''}`}>
        <button 
          className={`attach-btn ${attachment ? 'active' : ''}`} 
          onClick={handleAttachClick}
          disabled={(hasKeyError && !isChannel) || isProcessing}
        >
          <Paperclip size={20} />
        </button>

        <div className="input-container">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasKeyError && !isChannel 
                ? "Encryption key missing..." 
                : isChannel 
                  ? "Broadcast to channel..." 
                  : "Write an encrypted message..."
            }
            disabled={isProcessing || (hasKeyError && !isChannel)}
          />
          
          <div className="security-indicator">
            {isChannel ? (
              <div className="channel-mode-icon" title="Public Channel Mode">
                <Globe size={14} className="text-blue" />
              </div>
            ) : hasKeyError ? (
              <ShieldAlert size={14} className="error-icon" />
            ) : (
              <div className="lock-status" title="End-to-End Encrypted Session">
                <Lock size={12} strokeWidth={3} />
                {isProcessing && <span className="encrypting-loader"></span>}
              </div>
            )}
          </div>
        </div>

        <button 
          className={`send-btn ${(text.trim() || attachment) && !isProcessing && (!hasKeyError || isChannel) ? 'active' : ''}`} 
          onClick={handleSend}
          disabled={(!text.trim() && !attachment) || isProcessing || (hasKeyError && !isChannel)}
        >
          <SendHorizonal size={20} />
        </button>
      </div>
    </div>
  );
}