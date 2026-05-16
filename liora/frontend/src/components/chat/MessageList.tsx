import React from 'react';
import { Check, CheckCheck, Copy, Trash2, Reply, Share2, FileText, Download, Clock } from 'lucide-react';
import { useMessageActions } from '../../hooks/useMessageActions'; 

interface MessageListProps {
  messages: any[];
  myID: string;
}

export default function MessageList({ messages, myID }: MessageListProps) {
  const { contextMenu, handleContextMenu, copyMessage, deleteMessage } = useMessageActions();

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
            onClick={() => window.open(imageUrl, '_blank')}
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
          <button className="file-download-btn" onClick={() => window.open(fileUrl, '_blank')}>
            <Download size={16} />
          </button>
        </div>
      );
    }

    return <p>{content}</p>;
  };

  return (
    <div className="messages-container">
      {messages.map((msg, index) => {
        // ЗАЩИТА: Если сообщение null или undefined, полностью игнорируем его, избегая краша приложения
        if (!msg) return null;

        const isMine = msg.sender_id === myID;
        const isMenuOpen = contextMenu?.msg?.id === msg.id;
        const isPending = !!msg.isOptimistic; // Флаг оптимистичного UI (сообщение еще отправляется)
        
        const isFromChannel = msg.channel_id !== null && msg.channel_id !== undefined && msg.channel_id !== "";

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
              {/* Класс 'pending' добавляется, если сообщение находится в процессе доставки бэкендом */}
              <div className={`message-bubble ${isMine ? 'glass-morphism-blue' : 'glass-morphism'} ${isPending ? 'pending' : ''}`}>
                
                {isFromChannel && !isMine && (
                  <div className="channel-sender-name">
                    User #{msg.sender_id?.slice(0, 5) || "Anonymous"}
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
                        // Иконка часиков для оптимистичного состояния отправки
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
          style={{ 
            position: 'fixed',
            top: contextMenu.y, 
            left: contextMenu.x,
            zIndex: 1000 
          }}
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

            {contextMenu.msg?.sender_id === myID && (
              <button 
                className="delete-item" 
                onClick={() => deleteMessage(contextMenu.msg?.id)}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}