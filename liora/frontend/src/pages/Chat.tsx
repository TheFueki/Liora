import { useState, useEffect } from 'react';
// @ts-ignore
import { GetMyID, SendMessage, GetMessages } from '../../wailsjs/go/main/App';
import Sidebar from '../components/Layout/Sidebar';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';

export default function Chat() {
  const [myID, setMyID] = useState<string>('...');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadMessages, 1500);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const id = await GetMyID();
      setMyID(id);
      loadMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await GetMessages();
      setMessages(msgs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (content: string) => {
    try {
      await SendMessage(content);
      loadMessages();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="app" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar myID={myID} />
      <main className="chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <MessageList messages={messages} />
        <ChatInput onSend={handleSend} />
      </main>
    </div>
  );
}