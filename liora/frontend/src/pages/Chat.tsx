import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import { Phone, Video, MoreVertical, ShieldCheck } from 'lucide-react';
// @ts-ignore
import { DecryptMessage } from '../../wailsjs/go/main/App'; 
import '../styles/Chat.scss';

interface ChatProps {
  activeChat: any; 
  myID: string;
  onOpenProfile: () => void; 
}

export default function Chat({ activeChat, myID, onOpenProfile }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const partnerKey = activeChat?.public_id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!partnerKey || !myID) return;

    const channel = supabase.channel('online-status', {
      config: {
        presence: { key: myID },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isOnline = Object.values(state).some((presence: any) => 
          presence.some((p: any) => p.user_id === partnerKey)
        );
        setIsPartnerOnline(isOnline);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: myID, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [partnerKey, myID]);

  useEffect(() => {
    if (!activeChat || !partnerKey) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myID},recipient_id.eq.${partnerKey}),and(sender_id.eq.${partnerKey},recipient_id.eq.${myID})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const decrypted = await Promise.all(data.map(async (msg) => {
          try {
            const clearText = await DecryptMessage(partnerKey, msg.content);
            return { ...msg, content: clearText };
          } catch (err) {
            console.error("Decryption failed:", err);
            return { ...msg, content: "[🔒 Encrypted]" };
          }
        }));
        setMessages(decrypted);
      }
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${partnerKey}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        async (payload) => {
          const newMsg = payload.new;
          const isRelevant = 
            (newMsg.sender_id === partnerKey && newMsg.recipient_id === myID) || 
            (newMsg.sender_id === myID && newMsg.recipient_id === partnerKey);

          if (isRelevant) {
            try {
              const clearText = await DecryptMessage(partnerKey, newMsg.content);
              setMessages((prev) => [...prev, { ...newMsg, content: clearText }]);
            } catch (e) {
              setMessages((prev) => [...prev, { ...newMsg, content: "[🔒 New message]" }]);
            }
            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, myID, partnerKey]);

  const handleSend = async (encryptedContent: string) => {
    if (!partnerKey) return;
    
    const { error } = await supabase.from('messages').insert([
      {
        sender_id: myID,
        recipient_id: partnerKey,
        content: encryptedContent,
        is_read: false
      }
    ]);
    
    if (error) console.error("Send error:", error);
  };

  if (!activeChat) return null;

  return (
    <div className="chat-active-interface animate-fade">
      <header className="chat-header glass-morphism">
        <div className="header-info" onClick={onOpenProfile} style={{ cursor: 'pointer' }}>
          <div className="avatar-mini">
            {activeChat.avatar_url ? (
              <img 
                src={activeChat.avatar_url} 
                alt={activeChat.username} 
                className="avatar-img"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) parent.innerText = activeChat.username?.slice(0, 2).toUpperCase() || "??";
                }}
              />
            ) : (
              <span className="avatar-initials">
                {activeChat.username?.slice(0, 2).toUpperCase() || "??"}
              </span>
            )}
            <div className={`status-dot-mini ${isPartnerOnline ? 'online' : 'offline'}`}></div>
          </div>

          <div className="user-details">
            <div className="name-row">
              <h3>{activeChat.username || "Unknown"}</h3>
              {isPartnerOnline && <span className="online-label">online</span>}
            </div>
            <div className="status-container">
              <ShieldCheck size={14} className={isPartnerOnline ? "text-green" : "text-blue"} />
              <span className="status-text">
                {isPartnerOnline ? 'Secure Active Session' : 'End-to-end Encrypted'}
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button className="action-btn" title="Voice Call">
            <Phone size={20} />
          </button>
          <button className="action-btn" title="Video Call">
            <Video size={20} />
          </button>
          <div className="divider-v"></div>
          <button className="action-btn" title="More">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      <div className="messages-scroll-area">
        <MessageList messages={messages} myID={myID} />
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSend={handleSend} recipientPubKey={partnerKey} />
    </div>
  );
}