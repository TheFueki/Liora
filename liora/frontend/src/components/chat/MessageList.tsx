import React from 'react';
import { Check, CheckCheck, Copy, Trash2, Reply, Share2, FileText, Download, Clock, X } from 'lucide-react';
import { useMessageActions } from '../../hooks/useMessageActions';

interface MessageListProps {
  messages: any[];
  myID: string;
  onDeleteMessage: (msgId: string) => void;
  onViewProfile?: (item: any) => void;
}

export default function MessageList({ messages, myID, onDeleteMessage }: MessageListProps) {
  const { 
    contextMenu, 
    handleContextMenu, 
    copyMessage, 
    deleteSingleMessage,
    startSelection,
    enterSelection,
    endSelection,
    selectedMessages,
    clearSelection,
    copySelectedText,
    deleteSelectedMessages
  } = useMessageActions({ 
    currentUserId: myID, 
    onDeleteMessage 
  });

  const isSelectionMode = selectedMessages.length > 0;

  const handleDeleteClick = () => {
    const confirmDelete = window.confirm(`Удалить выбранные сообщения (${selectedMessages.length} шт.)?`);
    if (confirmDelete) {
      deleteSelectedMessages();
    }
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
    <div className="messages-container">
      {isSelectionMode && (
        <div className="selection-panel-top glass-morphism">
          <div className="selection-info">
            <button className="close-selection-btn" onClick={clearSelection}>
              <X size={20} />
            </button>
            <span className="selection-count">Выделено сообщений: {selectedMessages.length}</span>
          </div>
          <div className="selection-actions">
            <button onClick={copySelectedText} title="Копировать текст">
              <Copy size={18} />
            </button>
            <button onClick={() => console.log('Forward multi:', selectedMessages)} title="Переслать">
              <Share2 size={18} />
            </button>
            <button onClick={handleDeleteClick} className="delete-btn" title="Удалить выбранные">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {messages.map((msg, index) => {
        if (!msg) return null;

        const isMine = msg.sender_id === myID;
        const isMenuOpen = contextMenu?.msg?.id === msg.id;
        const isPending = !!msg.isOptimistic;
        const isSelected = selectedMessages.some(m => m.id === msg.id);

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
              className={`message-wrapper ${isMine ? 'mine' : 'theirs'} ${isMenuOpen ? 'selected' : ''} ${isSelected ? 'drag-selected' : ''}`}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              onMouseDown={(e) => startSelection(e, msg)}
              onMouseEnter={() => enterSelection(msg)}
              onMouseUp={(e) => endSelection(e, msg)}
            >
              <div className={`message-bubble ${isMine ? 'glass-morphism-blue' : 'glass-morphism'} ${isPending ? 'pending' : ''}`}>
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