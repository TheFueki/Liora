export default function MessageList({ messages }: { messages: any[] }) {
  return (
    <div className="messages">
      {messages.map((msg) => (
        <div key={msg.id} className={`msg ${msg.is_mine ? 'mine' : ''}`}>
          {msg.content}
        </div>
      ))}
    </div>
  );
}