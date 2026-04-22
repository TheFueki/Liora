interface MessageListProps {
  messages: any[];
  myID: string;
}

export default function MessageList({ messages, myID }: MessageListProps) {
  return (
    <div className="messages-container">
      {messages.map((msg) => {
        const isMine = msg.sender_id === myID;
        return (
          <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
            <div className={`message-bubble ${isMine ? 'glass-morphism-blue' : 'glass-morphism'}`}>
              <p>{msg.content}</p>
              <div className="message-info">
                <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isMine && <span className="read-status">{msg.is_read ? '✓✓' : '✓'}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}