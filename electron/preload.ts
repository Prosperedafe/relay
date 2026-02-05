import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  dbInit: () => ipcRenderer.invoke('db:init'),
  dbSeed: () => ipcRenderer.invoke('db:seed'),
  dbGetChats: (limit: number, offset: number) => ipcRenderer.invoke('db:getChats', limit, offset),
  dbGetMessages: (chatId: number, limit: number, offset: number) =>
    ipcRenderer.invoke('db:getMessages', chatId, limit, offset),
  dbSearchMessages: (chatId: number, query: string) =>
    ipcRenderer.invoke('db:searchMessages', chatId, query),
  dbMarkChatAsRead: (chatId: number) => ipcRenderer.invoke('db:markChatAsRead', chatId),
  wsGetPort: () => ipcRenderer.invoke('ws:getPort'),
  wsSimulateDrop: () => ipcRenderer.invoke('ws:simulateDrop'),
});

