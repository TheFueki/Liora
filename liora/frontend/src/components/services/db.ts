import Dexie, { type Table } from 'dexie';

export interface LocalConversation {
  displayID: string;
  username: string;
  avatar_url?: string;
  last_message: string;
  last_message_time: string;
  type: 'direct' | 'channel';
  name?: string; 
}

export interface LocalMessage {
  id: string;        
  chat_id: string;    
  sender_id: string;
  content: string;
  created_at: string;
}

class LioraSecureDatabase extends Dexie {
  conversations!: Table<LocalConversation, string>;
  messages!: Table<LocalMessage, string>;

  constructor() {
    super('LioraSecureDB');

    this.version(1).stores({
      conversations: 'displayID, last_message_time',
      messages: 'id, chat_id, created_at'
    });
  }
}

export const db = new LioraSecureDatabase();