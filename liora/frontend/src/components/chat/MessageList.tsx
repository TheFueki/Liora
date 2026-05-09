import React from 'react';
import { Check, CheckCheck, Copy, Trash2, Reply, Share2 } from 'lucide-react';
import { useMessageActions } from '../../hooks/useMessageActions'; 

interface MessageListProps {
  messages: any[];
  myID: string;
}

export default function MessageList({ messages, myID }: MessageListProps) {
  const { contextMenu, handleContextMenu, copyMessage, deleteMessage } = useMessageActions();

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "Today";
    return date.toLocaleDateString('en-EN', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="messages-container">
      {messages.map((msg, index) => {
        const isMine = msg.sender_id === myID;
        const isMenuOpen = contextMenu?.msg?.id === msg.id;
        
        const time = new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const prevMsg = messages[index - 1];
        const isNewDay = !prevMsg || 
          new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

        return (
          <React.Fragment key={msg.id}>
            {isNewDay && (
              <div className="date-separator">
                <span>{formatDateSeparator(msg.created_at)}</span>
              </div>
            )}

            <div 
              className={`message-wrapper ${isMine ? 'mine' : 'theirs'} ${isMenuOpen ? 'selected' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
            >
              <div className={`message-bubble ${isMine ? 'glass-morphism-blue' : 'glass-morphism'}`}>
                <div className="message-content">
                  <p>{msg.content}</p>
                </div>
                
                <div className="message-details">
                  <span className="message-time">{time}</span>
                  {isMine && (
                    <div className="status-icons">
                      {msg.is_read ? (
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

      {/* Рендер контекстного меню */}
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
            <button onClick={() => console.log('Reply to', contextMenu.msg.id)}>
              <Reply size={16} /> Reply
            </button>
            
            <button onClick={() => copyMessage(contextMenu.msg.content)}>
              <Copy size={16} /> Copy
            </button>

            <button onClick={() => console.log('Forward', contextMenu.msg.id)}>
              <Share2 size={16} /> Forward
            </button>

            {contextMenu.msg.sender_id === myID && (
              <button 
                className="delete-item" 
                onClick={() => deleteMessage(contextMenu.msg.id)}
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