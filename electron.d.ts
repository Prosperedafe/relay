export interface ElectronAPI {
  dbInit: () => Promise<void>;
  dbSeed: () => Promise<void>;
  dbGetChats: (limit: number, offset: number) => Promise<any[]>;
  dbGetMessages: (chatId: number, limit: number, offset: number) => Promise<any[]>;
  dbSearchMessages: (chatId: number, query: string) => Promise<any[]>;
  dbMarkChatAsRead: (chatId: number) => Promise<void>;
  wsGetPort: () => Promise<number>;
  wsSimulateDrop: () => Promise<void>;
}

export type APIAdapter = ElectronAPI;

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    apiAdapter: APIAdapter;
  }
}

