import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import CallOverlay from '../components/chat/CallOverlay';
import { useWebRTC } from '../hooks/useWebRTC';
import { Phone, Video, MoreVertical, ShieldCheck, Hash, User, Trash2, VolumeX } from 'lucide-react';
// @ts-ignore
import { DecryptMessage, SendMessage, GetMessages, DeleteMessageFromServer } from '../../wailsjs/go/main/App'; 
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isChannel = activeChat?.type === 'channel' || !!activeChat?.owner_id;
  const chatID = isChannel ? activeChat.id.toString() : activeChat?.public_id;

  const { getMessages, saveMessages } = useCacheStore();
  const { startCall, endCall, localStream, remoteStream } = useWebRTC(chatID, myID);

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

  const handleInitiateCall = async (isVideo: boolean) => {
    const callType = isVideo ? 'VIDEO' : 'VOICE';
    console.log(`[VOICE CALL] Initializing ${callType} call. Target Chat ID: ${chatID}, Initiator ID: ${myID}`);
    
    setIsCallActive(true);
    try {
      await startCall(isVideo);
      console.log(`[VOICE CALL] Local media stream successfully captured for ${callType} call.`);
    } catch (err) {
      console.error(`[VOICE CALL] Failed to establish local media stream:`, err);
      setIsCallActive(false);
    }
  };

  const handleHangUp = () => {
    console.log(`[VOICE CALL] Hanging up terminating session with Chat ID: ${chatID}`);
    endCall();
    setIsCallActive(false);
    console.log(`[VOICE CALL] WebRTC peer connection cleared and local streams stopped.`);
  };

  const handleDeleteMessage = async (msgId: string) => {
    const currentChatID = chatID.toString();
    
    setMessages((prev) => {
      const updated = prev.filter((msg) => msg.id !== msgId);
      saveMessages(myID, currentChatID, updated);
      return updated;
    });

    try {
      await supabase.from('messages').delete().eq('id', msgId);
      
      if (typeof DeleteMessageFromServer === 'function') {
        await DeleteMessageFromServer(msgId);
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  useEffect(() => {
    if (localStream) {
      console.log(`[VOICE CALL] Local stream updated. Active tracks:`, localStream.getTracks().map(t => t.kind));
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream) {
      console.log(`[VOICE CALL] Remote stream received. Processing incoming tracks:`, remoteStream.getTracks().map(t => t.kind));
    }
  }, [remoteStream]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!chatID || !myID || isChannel) {
      setIsPartnerOnline(false);
      return;
    }

    const channel = supabase.channel(`online-status:${chatID}`, {
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
      supabase.removeChannel(channel);
    };
  }, [chatID, myID, isChannel]);

  useEffect(() => {
    if (!activeChat || !chatID || !myID) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const currentChatID = chatID.toString();
    
    setMessages([]);

    const loadInitialCache = async () => {
      try {
        const cachedMsgs = await getMessages(myID, currentChatID);
        if (isMounted && cachedMsgs && cachedMsgs.length > 0) {
          setMessages(cachedMsgs);
          setTimeout(scrollToBottom, 20);
        }
      } catch (err) {
        console.error("Failed to fetch cached messages:", err);
      }
    };

    const syncWithNetwork = async () => {
      try {
        const pubKey = isChannel ? "" : currentChatID; 
        const networkData = await GetMessages(currentChatID, pubKey);
        
        if (isMounted && networkData) {
          setMessages(networkData);
          await saveMessages(myID, currentChatID, networkData);
          setTimeout(scrollToBottom, 50);
        }
      } catch (err) {
        console.error("Failed to fetch network messages:", err);
      }
    };

    loadInitialCache().then(() => {
      if (isMounted) syncWithNetwork();
    });

    const channel = supabase
      .channel(`chat_realtime:${currentChatID}_${myID}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        async (payload) => {
          if (!isMounted) return;

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMessages((prev) => {
              const updated = prev.filter(m => m.id !== deletedId);
              saveMessages(myID, currentChatID, updated);
              return updated;
            });
            return;
          }

          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;
            
            const isRelevant = isChannel 
              ? newMsg.channel_id?.toString() === currentChatID 
              : ((newMsg.sender_id?.toString() === currentChatID && newMsg.recipient_id === myID) || 
                 (newMsg.sender_id?.toString() === myID && newMsg.recipient_id === currentChatID));

            if (isRelevant) {
              let processedMsg = { ...newMsg };

              if (!isChannel) {
                try {
                  const decryptionKey = newMsg.sender_id === myID ? newMsg.recipient_id : newMsg.sender_id;

                  const clearText = await DecryptMessage(decryptionKey.toString(), newMsg.content.toString());
                  if (clearText) {
                    processedMsg.content = clearText;
                  }
                } catch (e) {
                  console.error("Crypto layer decryption failure:", e);
                  processedMsg.content = "🔒 [Decryption Error]";
                }
              }
              
              if (isMounted) {
                setMessages((prev) => {
                  const existingIdx = prev.findIndex(m => m.isOptimistic && m.content === processedMsg.content);
                  
                  if (existingIdx !== -1) {
                    const updated = [...prev];
                    updated[existingIdx] = { ...processedMsg, isOptimistic: false };
                    saveMessages(myID, currentChatID, updated);
                    return updated;
                  }

                  if (prev.some(m => m.id === processedMsg.id)) return prev;
                  
                  const updated = [...prev, processedMsg];
                  saveMessages(myID, currentChatID, updated);
                  return updated;
                });
                setTimeout(scrollToBottom, 50);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [activeChat, myID, chatID, isChannel]);

  const handleSend = async (content: string) => {
    if (!chatID || !myID) return;
    const currentChatID = chatID.toString();

    const optimisticMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`, 
      sender_id: myID,
      recipient_id: currentChatID,
      channel_id: isChannel ? currentChatID : null, 
      content: content,                      
      is_read: false,
      created_at: new Date().toISOString(),
      isOptimistic: true                     
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(scrollToBottom, 50); 

    try {
      await SendMessage(currentChatID, content);
      
      const confirmedMessage = { ...optimisticMessage, isOptimistic: false };
      
      setMessages((prev) => {
        const updated = prev.map((msg) => msg.id === optimisticMessage.id ? confirmedMessage : msg);
        saveMessages(myID, currentChatID, updated);
        return updated;
      });

    } catch (err) {
      console.error("Send error via Wails:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
    }
  };

  if (!activeChat) return null;

  return (
    <div className="chat-active-interface animate-fade">
      {isCallActive && (
        <CallOverlay 
          localStream={localStream} 
          remoteStream={remoteStream} 
          onHangUp={handleHangUp} 
        />
      )}

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

        <div className="header-actions" ref={menuRef}>
          {!isChannel && (
            <>
              <button className="action-btn" title="Voice Call" onClick={() => handleInitiateCall(false)}>
                <Phone size={20} />
              </button>
              <button className="action-btn" title="Video Call" onClick={() => handleInitiateCall(true)}>
                <Video size={20} />
              </button>
              <div className="divider-v"></div>
            </>
          )}
          <button 
            className={`action-btn ${isMenuOpen ? 'active' : ''}`} 
            title="More" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <MoreVertical size={20} />
          </button>

          {isMenuOpen && (
            <div className="dropdown-menu telegram-style animate-scale-up">
              <button className="dropdown-item" onClick={() => { setIsMenuOpen(false); handleHeaderClick(); }}>
                <User size={16} />
                <span>View Info</span>
              </button>
              <button className="dropdown-item">
                <VolumeX size={16} />
                <span>Mute Notifications</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item delete">
                <Trash2 size={16} />
                <span>Delete Chat</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="messages-scroll-area">
        <MessageList messages={messages} myID={myID} onDeleteMessage={handleDeleteMessage} />
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