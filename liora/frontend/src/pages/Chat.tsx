import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import { Phone, Video, MoreVertical, ShieldCheck, Hash } from 'lucide-react';
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
  const isChannel = activeChat?.type === 'channel' || !!activeChat?.owner_id;
  const chatID = isChannel ? activeChat.id.toString() : activeChat?.public_id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHeaderClick = () => {
    if (!isChannel) {
      onOpenProfile();
    } else {
      console.log("Channel details:", activeChat);
    }
  };

  useEffect(() => {
    if (!chatID || !myID || isChannel) return;

    const channel = supabase.channel('online-status', {
      config: {
        presence: { key: myID },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isOnline = Object.values(state).some((presence: any) => 
          presence.some((p: any) => p.user_id === chatID)
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
  }, [chatID, myID, isChannel]);

  useEffect(() => {
    if (!activeChat || !chatID) return;

    const fetchMessages = async () => {
      let query = supabase.from('messages').select('*');

      if (isChannel) {
        query = query.eq('recipient_id', chatID);
      } else {
        query = query.or(`and(sender_id.eq.${myID},recipient_id.eq.${chatID}),and(sender_id.eq.${chatID},recipient_id.eq.${myID})`);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (!error && data) {
        const decrypted = await Promise.all(data.map(async (msg) => {
          try {
            const clearText = await DecryptMessage(chatID, msg.content);
            return { ...msg, content: clearText };
          } catch (err) {
            return { ...msg, content: msg.content }; 
          }
        }));
        setMessages(decrypted);
      }
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_realtime:${chatID}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        async (payload) => {
          const newMsg = payload.new;
          
          const isRelevant = isChannel 
            ? newMsg.recipient_id === chatID 
            : (newMsg.sender_id === chatID && newMsg.recipient_id === myID) || 
              (newMsg.sender_id === myID && newMsg.recipient_id === chatID);

          if (isRelevant) {
            try {
              const clearText = await DecryptMessage(chatID, newMsg.content);
              setMessages((prev) => [...prev, { ...newMsg, content: clearText }]);
            } catch {
              setMessages((prev) => [...prev, newMsg]);
            }
            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, myID, chatID, isChannel]);

  const handleSend = async (encryptedContent: string) => {
    if (!chatID) return;
    
    const { error } = await supabase.from('messages').insert([
      {
        sender_id: myID,
        recipient_id: chatID,
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
        <div 
          className="header-info" 
          onClick={handleHeaderClick} 
          style={{ cursor: isChannel ? 'default' : 'pointer' }}
        >
          <div className="avatar-mini">
            {isChannel ? (
              <div className="channel-icon-wrapper">
                <Hash size={20} />
              </div>
            ) : activeChat.avatar_url ? (
              <img 
                src={activeChat.avatar_url} 
                alt={activeChat.username} 
                className="avatar-img"
              />
            ) : (
              <span className="avatar-initials">
                {activeChat.username?.slice(0, 2).toUpperCase() || "??"}
              </span>
            )}
            
            {!isChannel && (
              <div className={`status-dot-mini ${isPartnerOnline ? 'online' : 'offline'}`}></div>
            )}
          </div>

          <div className="user-details">
            <div className="name-row">
              <h3>{isChannel ? activeChat.name : (activeChat.username || "Unknown")}</h3>
              {!isChannel && isPartnerOnline && <span className="online-label">online</span>}
            </div>
            <div className="status-container">
              <ShieldCheck 
                size={14} 
                className={(isPartnerOnline || isChannel) ? "text-green" : "text-blue"} 
              />
              <span className="status-text">
                {isChannel ? 'Public Channel' : isPartnerOnline ? 'Secure Active Session' : 'Encrypted Chat'}
              </span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {!isChannel && (
            <>
              <button className="action-btn" title="Voice Call"><Phone size={20} /></button>
              <button className="action-btn" title="Video Call"><Video size={20} /></button>
              <div className="divider-v"></div>
            </>
          )}
          <button className="action-btn" title="More"><MoreVertical size={20} /></button>
        </div>
      </header>

      <div className="messages-scroll-area">
        <MessageList messages={messages} myID={myID} />
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput 
        onSend={handleSend} 
        recipientPubKey={chatID} 
        isChannel={isChannel} 
      />
    </div>
  );
}