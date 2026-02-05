import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export interface Chat {
  id: number;
  title: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface Message {
  id: number;
  chatId: number;
  ts: number;
  sender: string;
  body: string;
}

export class DatabaseService {
  private db: Database.Database | null = null;

  initialize(): void {
    const dbPath = path.join(app.getPath('userData'), 'messenger.db');
    this.db = new Database(dbPath);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        lastMessageAt INTEGER NOT NULL,
        unreadCount INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chatId INTEGER NOT NULL,
        ts INTEGER NOT NULL,
        sender TEXT NOT NULL,
        body TEXT NOT NULL,
        FOREIGN KEY (chatId) REFERENCES chats(id)
      );

      CREATE INDEX IF NOT EXISTS idx_chats_lastMessageAt ON chats(lastMessageAt DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_chatId_ts ON messages(chatId, ts DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_body ON messages(body);
    `);
  }

  seedData(): void {
    if (!this.db) throw new Error('Database not initialized');

    const existingChats = this.db.prepare('SELECT COUNT(*) as count FROM chats').get() as { count: number };
    if (existingChats.count >= 200) {
      return;
    }

    this.db.exec('DELETE FROM messages; DELETE FROM chats;');

    const insertChat = this.db.prepare('INSERT INTO chats (title, lastMessageAt, unreadCount) VALUES (?, ?, ?)');
    const insertMessage = this.db.prepare('INSERT INTO messages (chatId, ts, sender, body) VALUES (?, ?, ?, ?)');

    const now = Date.now();
    const chatIds: number[] = [];
    const senders = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];

    for (let i = 0; i < 200; i++) {
      const senderName = senders[Math.floor(Math.random() * senders.length)];
      const chatId = insertChat.run(senderName, now - Math.random() * 86400000 * 30, Math.floor(Math.random() * 10)).lastInsertRowid as number;
      chatIds.push(chatId);
    }

    const messagesPerChat = Math.floor(20000 / 200);
    const messageTemplates = [
      'Hello, how are you?',
      'I need to discuss something important.',
      'Can we schedule a meeting?',
      'Thanks for your help!',
      'Let me know when you are available.',
      'I have a question about the project.',
      'The deadline is approaching.',
      'Great work on this!',
      'We should review this together.',
      'Looking forward to your response.',
    ];

    const insertMany = this.db.transaction((chatIds: number[]) => {
      for (const chatId of chatIds) {
        const messageCount = messagesPerChat + Math.floor(Math.random() * 20);
        for (let j = 0; j < messageCount; j++) {
          const ts = now - Math.random() * 86400000 * 30;
          const sender = senders[Math.floor(Math.random() * senders.length)];
          const body = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
          insertMessage.run(chatId, ts, sender, body);
        }
      }
    });

    insertMany(chatIds);

    this.updateChatLastMessageTimes();
    
    const finalChatCount = this.db.prepare('SELECT COUNT(*) as count FROM chats').get() as { count: number };
    const finalMessageCount = this.db.prepare('SELECT COUNT(*) as count FROM messages').get() as { count: number };
  }

  private updateChatLastMessageTimes(): void {
    if (!this.db) return;
    this.db.exec(`
      UPDATE chats
      SET lastMessageAt = (
        SELECT MAX(ts) FROM messages WHERE messages.chatId = chats.id
      )
      WHERE EXISTS (SELECT 1 FROM messages WHERE messages.chatId = chats.id);
    `);
  }

  getChats(limit: number, offset: number): Chat[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db
      .prepare('SELECT * FROM chats ORDER BY lastMessageAt DESC LIMIT ? OFFSET ?')
      .all(limit, offset) as Chat[];
  }

  getMessages(chatId: number, limit: number, offset: number): Message[] {
    if (!this.db) throw new Error('Database not initialized');
    const totalCount = this.db
      .prepare('SELECT COUNT(*) as count FROM messages WHERE chatId = ?')
      .get(chatId) as { count: number };
    const startOffset = Math.max(0, totalCount.count - limit - offset);
    return this.db
      .prepare('SELECT * FROM messages WHERE chatId = ? ORDER BY ts ASC LIMIT ? OFFSET ?')
      .all(chatId, limit, startOffset) as Message[];
  }

  searchMessages(chatId: number, query: string): Message[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db
      .prepare('SELECT * FROM messages WHERE chatId = ? AND body LIKE ? ORDER BY ts DESC LIMIT 50')
      .all(chatId, `%${query}%`) as Message[];
  }

  addMessage(chatId: number, messageId: number, ts: number, sender: string, body: string): void {
    if (!this.db) throw new Error('Database not initialized');

    const insertMessage = this.db.prepare('INSERT OR IGNORE INTO messages (id, chatId, ts, sender, body) VALUES (?, ?, ?, ?, ?)');
    insertMessage.run(messageId, chatId, ts, sender, body);

    const updateChat = this.db.prepare('UPDATE chats SET lastMessageAt = ?, unreadCount = unreadCount + 1 WHERE id = ?');
    updateChat.run(ts, chatId);
  }

  markChatAsRead(chatId: number): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.prepare('UPDATE chats SET unreadCount = 0 WHERE id = ?').run(chatId);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

