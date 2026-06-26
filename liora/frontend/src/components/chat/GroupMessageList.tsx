import React, { useEffect, useState, useCallback } from 'react';
import { Check, CheckCheck, Copy, Trash2, Reply, Share2, FileText, Download, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface GroupMessageListProps {
  messages: any[];
  myID: string;
  onDeleteMessage: (msgId: string) => void;
  onViewProfile?: (item: any) => void;
}

interface UserProfile {
  public_id: string;
  username: string;
  avatar_url?: string;
}

interface ContextMenu {
  x: number;
  y: number;
  msg: any;
}

export default function GroupMessageList({ messages, myID, onDeleteMessage, onViewProfile }: GroupMessageListProps) {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      const uniqueSenderIds = Array.from(new Set(messages.filter(m => m && m.sender_id).map(m => m.sender_id)));
      const missingIds = uniqueSenderIds.filter(id => !profiles[id]);

      if (missingIds.length === 0) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('public_id, username, avatar_url')
          .in('public_id', missingIds);

        if (!error && data) {
          setProfiles(prev => {
            const updated = { ...prev };
            data.forEach((p: UserProfile) => {
              updated[p.public_id] = p;
            });
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to load group senders profiles:', err);
      }
    };

    if (messages.length > 0) {
      fetchProfiles();
    }
  }, [messages]);

  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    if (contextMenu) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [contextMenu, closeMenu]);

  const handleContextMenu = (e: React.MouseEvent, msg: any) => {
    e.preventDefault();
    const x = e.pageX > window.innerWidth - 160 ? e.pageX - 160 : e.pageX;
    const y = e.pageY > window.innerHeight - 200 ? e.pageY - 150 : e.pageY;
    setContextMenu({ x, y, msg });
  };

  const handleUserClick = (e: React.MouseEvent, senderId: string) => {
    e.stopPropagation();
    if (!onViewProfile) return;

    const profile = profiles[senderId];
    const username = profile?.username || `ID: ${senderId?.slice(0, 5)}`;
    const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${senderId}`;

    onViewProfile({
      id: senderId,
      name: username,
      username: username,
      avatar_url: avatarUrl,
      type: 'user',
      description: '',
      created_at: new Date().toISOString()
    });
  };

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    closeMenu();
  };

  const deleteSingleMessage = (msgId: string, msgOwnerId: string) => {
    if (msgOwnerId !== myID) return;
    onDeleteMessage(msgId);
    closeMenu();
  };

  const formatDateSeparator = (dateString: string) => {
    if (!dateString) return "Today";
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "Today";
    return date.toLocaleDateString('en-EN', { day: 'numeric', month: 'long' });
  };

  const renderMessageContent = (content: string) => {
    if (!content) return <p className="empty-msg"><i>Empty message</i></p>;

    if (content.startsWith("IMAGE_URL:")) {
      const parts = content.split("|CAPTION:");
      const imageUrl = parts[0].replace("IMAGE_URL:", "").trim();
      const caption = parts[1] || "";

      return (
        <div className="message-media-container">
          <img 
            src={imageUrl} 
            alt="Uploaded media" 
            className="message-attached-img" 
            loading="lazy"
            onClick={(e) => { e.stopPropagation(); window.open(imageUrl, '_blank'); }}
          />
          {caption.trim() && <p className="media-caption">{caption}</p>}
        </div>
      );
    }

    if (content.startsWith("FILE_URL:")) {
      const parts = content.split("|FILENAME:");
      const fileUrl = parts[0].replace("FILE_URL:", "").trim();
      const filename = parts[1] || "Attachment File";

      return (
        <div className="message-file-container">
          <div className="file-info-block">
            <FileText size={24} className="text-blue" />
            <span className="file-name-text" title={filename}>{filename}</span>
          </div>
          <button className="file-download-btn" onClick={(e) => { e.stopPropagation(); window.open(fileUrl, '_blank'); }}>
            <Download size={16} />
          </button>
        </div>
      );
    }

    return <p>{content}</p>;
  };

  return (
    <div className="messages-container tg-group-style">
      {messages.map((msg, index) => {
        if (!msg) return null;

        const isMine = msg.sender_id === myID;
        const isMenuOpen = contextMenu?.msg?.id === msg.id;
        const isPending = !!msg.isOptimistic;
        
        const senderProfile = profiles[msg.sender_id];
        const username = senderProfile?.username || `ID: ${msg.sender_id?.slice(0, 5)}`;
        const avatarUrl = senderProfile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${msg.sender_id}`;

        const time = msg.created_at 
          ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const prevMsg = messages[index - 1];
        const isNewDay = !prevMsg || !prevMsg.created_at ||
          new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

        return (
          <React.Fragment key={msg.id || `temp-key-${index}`}>
            {isNewDay && msg.created_at && (
              <div className="date-separator">
                <span>{formatDateSeparator(msg.created_at)}</span>
              </div>
            )}

            <div 
              className={`message-wrapper ${isMine ? 'mine' : 'theirs'} ${isMenuOpen ? 'selected' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              {!isMine && (
                <div 
                  className="message-avatar-holder" 
                  onClick={(e) => handleUserClick(e, msg.sender_id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={avatarUrl} alt={username} className="tg-sender-avatar" />
                </div>
              )}

              <div className={`message-bubble ${isMine ? 'glass-morphism-blue' : 'glass-morphism'} ${isPending ? 'pending' : ''}`}>
                {!isMine && (
                  <div 
                    className="tg-sender-name-tag" 
                    onClick={(e) => handleUserClick(e, msg.sender_id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {username}
                  </div>
                )}

                <div className="message-content">
                  {renderMessageContent(msg.content)}
                </div>
                
                <div className="message-details">
                  <span className="message-time">{time}</span>
                  {isMine && (
                    <div className="status-icons">
                      {isPending ? (
                        <Clock size={12} className="status-check pending-clock" />
                      ) : msg.is_read ? (
                        <CheckCheck size={14} className="status-check read" strokeWidth={3} />
                      ) : (
                        <Check size={14} className="status-check delivered" strokeWidth={3} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {contextMenu && (
        <div 
          className="custom-context-menu"
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }}
        >
          <div className="menu-inner glass-morphism">
            <button onClick={() => console.log('Reply to', contextMenu.msg?.id)}>
              <Reply size={16} /> Reply
            </button>
            <button onClick={() => copyMessage(contextMenu.msg?.content || '')}>
              <Copy size={16} /> Copy
            </button>
            <button onClick={() => console.log('Forward', contextMenu.msg?.id)}>
              <Share2 size={16} /> Forward
            </button>
            {contextMenu.msg?.sender_id === myID && !contextMenu.msg?.isOptimistic && (
              <button className="delete-item" onClick={() => deleteSingleMessage(contextMenu.msg?.id, contextMenu.msg?.sender_id)}>
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}