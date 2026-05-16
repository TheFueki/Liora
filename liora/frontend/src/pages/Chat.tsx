import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import { Phone, Video, MoreVertical, ShieldCheck, Hash } from 'lucide-react';
// @ts-ignore
import { DecryptMessage, SendMessage, GetMessages } from '../../wailsjs/go/main/App'; 
import { useCacheStore } from '../components/services/cacheManager';
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

  const { getMessages, saveMessages } = useCacheStore();

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
      try {
        const cachedMsgs = await getMessages(chatID.toString());
        if (cachedMsgs && cachedMsgs.length > 0) {
          setMessages(cachedMsgs);
          setTimeout(scrollToBottom, 20);
        }

        const pubKey = isChannel ? "" : (activeChat?.public_id || ""); 
        const networkData = await GetMessages(chatID.toString(), pubKey);
        
        if (networkData) {
          setMessages(networkData);
          await saveMessages(chatID.toString(), networkData);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
      setTimeout(scrollToBottom, 50);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_realtime:${chatID}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        async (payload) => {
          const newMsg = payload.new;
          
          if (newMsg.sender_id === myID) return;
          const isRelevant = isChannel 
            ? newMsg.channel_id === chatID 
            : (newMsg.sender_id === chatID && newMsg.recipient_id === myID);

          if (isRelevant) {
            let processedMsg = { ...newMsg };

            if (!isChannel) {
              try {
                const clearText = await DecryptMessage(chatID, newMsg.content);
                processedMsg.content = clearText;
              } catch (e) {
                console.error("Decryption failed for realtime message", e);
              }
            }
            
            setMessages((prev) => [...prev, processedMsg]);
            await saveMessages(chatID.toString(), [processedMsg]);
            
            setTimeout(scrollToBottom, 50);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, myID, chatID, isChannel, getMessages, saveMessages]);

  const handleSend = async (content: string) => {
    if (!chatID) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      sender_id: myID,
      recipient_id: chatID,
      channel_id: isChannel ? chatID : null, 
      content: content,                    
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true                     
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50); 

    try {
      await SendMessage(chatID, content);
      
      const confirmedMessage = { ...optimisticMessage, isOptimistic: false };
      
      setMessages((prev) => 
        prev.map((msg) => msg.id === optimisticMessage.id ? confirmedMessage : msg)
      );

      await saveMessages(chatID.toString(), [confirmedMessage]);

    } catch (err) {
      console.error("Send error via Wails:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    }
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