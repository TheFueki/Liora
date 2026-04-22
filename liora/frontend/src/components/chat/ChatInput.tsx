import { useState } from 'react';
import { SendHorizonal, Paperclip } from 'lucide-react';

export default function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="chat-input-wrapper glass-morphism">
      <button className="attach-btn"><Paperclip size={20} /></button>
      <input 
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Write an encrypted message..." 
      />
      <button className={`send-btn ${text ? 'active' : ''}`} onClick={submit}>
        <SendHorizonal size={20} />
      </button>
    </div>
  );
}