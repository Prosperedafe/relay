import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { DatabaseService } from './database/databaseService';
import { WebSocketServer } from './websocket/server';
import { SecurityService } from './security/securityService';

let mainWindow: BrowserWindow | null = null;
let dbService: DatabaseService | null = null;
let wsServer: WebSocketServer | null = null;
const securityService = new SecurityService();

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  dbService = new DatabaseService();
  wsServer = new WebSocketServer(dbService, securityService);

  ipcMain.handle('db:init', () => {
    try {
      dbService?.initialize();
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('db:seed', () => {
    try {
      dbService?.seedData();
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

  ipcMain.handle('db:getChats', (_event: IpcMainInvokeEvent, limit: number, offset: number) => {
    return dbService?.getChats(limit, offset);
  });

  ipcMain.handle('db:getMessages', (_event: IpcMainInvokeEvent, chatId: number, limit: number, offset: number) => {
    return dbService?.getMessages(chatId, limit, offset);
  });

  ipcMain.handle('db:searchMessages', (_event: IpcMainInvokeEvent, chatId: number, query: string) => {
    return dbService?.searchMessages(chatId, query);
  });

  ipcMain.handle('db:markChatAsRead', (_event: IpcMainInvokeEvent, chatId: number) => {
    return dbService?.markChatAsRead(chatId);
  });

  ipcMain.handle('ws:getPort', () => {
    return wsServer?.getPort();
  });

  ipcMain.handle('ws:simulateDrop', () => {
    return wsServer?.simulateConnectionDrop();
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    wsServer?.close();
    dbService?.close();
    app.quit();
  }
});

app.on('before-quit', () => {
  wsServer?.close();
  dbService?.close();
});

