import { create } from 'zustand';
import { getDB, LocalConversation, LocalMessage } from './db';

interface CacheState {
  conversations: LocalConversation[];
  channels: LocalConversation[]; 
  isLoaded: boolean;
  
  loadFromStorage: (myID: string) => Promise<void>;
  setCache: (myID: string, data: { conversations?: any[], channels?: any[] }) => Promise<void>;
  updateLastMessage: (myID: string, displayID: string, text: string, time: string) => Promise<void>;
  
  saveMessages: (myID: string, chatId: string, messages: any[]) => Promise<void>;
  getMessages: (myID: string, chatId: string) => Promise<LocalMessage[]>;
  clearState: () => void;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  conversations: [],
  channels: [],
  isLoaded: false,

  loadFromStorage: async (myID) => {
    try {
      const db = getDB(myID);
      const allConvs = await db.conversations
        .orderBy('last_message_time')
        .reverse()
        .toArray();

      const conversations = allConvs.filter(c => c.type === 'direct');
      const channels = allConvs.filter(c => c.type === 'channel');

      set({ conversations, channels, isLoaded: true });
    } catch (e) {
      console.error("Failed to load IndexedDB cache", e);
    }
  },

  setCache: async (myID, data) => {
    try {
      const db = getDB(myID);
      const currentConvs = data.conversations ?? [];
      const currentChans = data.channels ?? [];
      
      const normalizedData: LocalConversation[] = [
        ...currentConvs.map(c => ({ ...c, type: 'direct' as const })),
        ...currentChans.map(c => ({ ...c, type: 'channel' as const }))
      ];

      if (normalizedData.length > 0) {
        await db.conversations.bulkPut(normalizedData);
      }

      set((state) => ({
        conversations: data.conversations ?? state.conversations,
        channels: data.channels ?? state.channels,
        isLoaded: true
      }));
    } catch (e) {
      console.error("Failed to save data to IndexedDB", e);
    }
  },

  updateLastMessage: async (myID, displayID, text, time) => {
    try {
      const db = getDB(myID);
      const existing = await db.conversations.get(displayID);
      if (existing) {
        await db.conversations.update(displayID, {
          last_message: text,
          last_message_time: time
        });
      } else {
        await db.conversations.put({
          displayID,
          username: 'User',
          last_message: text,
          last_message_time: time,
          type: 'direct'
        });
      }

      const allConvs = await db.conversations
        .orderBy('last_message_time')
        .reverse()
        .toArray();

      set({
        conversations: allConvs.filter(c => c.type === 'direct'),
        channels: allConvs.filter(c => c.type === 'channel')
      });
    } catch (e) {
      console.error("Failed to update last message in cache", e);
    }
  },

  saveMessages: async (myID, chatId, messages) => {
    try {
      const db = getDB(myID);
      const localMsgs: LocalMessage[] = messages.map(m => ({
        id: m.id || `${chatId}_${new Date(m.created_at).getTime()}`,
        chat_id: chatId,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at
      }));
      
      await db.messages.bulkPut(localMsgs);
    } catch (e) {
      console.error("Failed to cache messages", e);
    }
  },

  getMessages: async (myID, chatId) => {
    try {
      const db = getDB(myID);
      return await db.messages
        .where('chat_id')
        .equals(chatId)
        .sortBy('created_at');
    } catch (e) {
      console.error("Failed to fetch cached messages", e);
      return [];
    }
  },

  clearState: () => set({ conversations: [], channels: [], isLoaded: false })
}));