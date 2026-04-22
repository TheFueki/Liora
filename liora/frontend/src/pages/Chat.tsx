import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';
import { Shield, ChevronLeft } from 'lucide-react';
import '../styles/Chat.scss';

interface ChatProps {
  activeChat: any;
  myID: string;
}

export default function Chat({ activeChat, myID }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Загрузка истории и подписка на Realtime
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${myID},recipient_id.eq.${activeChat.public_id}),and(sender_id.eq.${activeChat.public_id},recipient_id.eq.${myID})`)
        .order('created_at', { ascending: true });

      if (!error) setMessages(data || []);
      scrollToBottom();
    };

    fetchMessages();

    // Подписка на новые сообщения
    const channel = supabase
      .channel(`chat:${activeChat.public_id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          const newMsg = payload.new;
          // Проверяем, относится ли сообщение к текущему чату
          if ((newMsg.sender_id === activeChat.public_id && newMsg.recipient_id === myID) ||
              (newMsg.sender_id === myID && newMsg.recipient_id === activeChat.public_id)) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, myID]);

  const handleSend = async (content: string) => {
    const { error } = await supabase.from('messages').insert([
      {
        sender_id: myID,
        recipient_id: activeChat.public_id,
        content: content,
        is_read: false
      }
    ]);

    if (error) console.error("Send error:", error);
  };

return (
  <div className="chat-active-interface animate-fade">
    <header className="chat-header glass-morphism">
      <div className="header-info">
        <div className="avatar-mini">
          {activeChat.username?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3>{activeChat.username}</h3>
          <span className="status-online">Encrypted Link Active</span>
        </div>
      </div>
      <div className="header-actions">
        <Shield size={18} className="shield-icon" />
      </div>
    </header>

    <div className="messages-scroll-area">
      <MessageList messages={messages} myID={myID} />
      <div ref={messagesEndRef} />
    </div>
    
    <ChatInput onSend={handleSend} />
  </div>
);}