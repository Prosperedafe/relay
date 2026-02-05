import { webDatabase } from './webDatabase';
import { webWebSocketServer } from './webWebSocket';

const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
};

export const createWebAdapter = () => {
  if (isElectron()) {
    return window.electronAPI;
  }

  webWebSocketServer.start();

  return {
    dbInit: async () => {
      await webDatabase.initialize();
      return { success: true };
    },
    dbSeed: async () => {
      await webDatabase.seedData();
      return { success: true };
    },
    dbGetChats: async (limit: number, offset: number) => {
      return await webDatabase.getChats(limit, offset);
    },
    dbGetMessages: async (chatId: number, limit: number, offset: number) => {
      return await webDatabase.getMessages(chatId, limit, offset);
    },
    dbSearchMessages: async (chatId: number, query: string) => {
      return await webDatabase.searchMessages(chatId, query);
    },
    dbMarkChatAsRead: async (chatId: number) => {
      await webDatabase.markChatAsRead(chatId);
    },
    wsGetPort: async () => {
      return webWebSocketServer.getPort();
    },
    wsSimulateDrop: async () => {
      webWebSocketServer.simulateConnectionDrop();
    },
  };
};

