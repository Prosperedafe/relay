import Dexie, { Table } from 'dexie';

export interface Chat {
  id?: number;
  title: string;
  lastMessageAt: number;
  unreadCount: number;
}

export interface Message {
  id?: number;
  chatId: number;
  ts: number;
  sender: string;
  body: string;
}

class MessengerDatabase extends Dexie {
  chats!: Table<Chat>;
  messages!: Table<Message>;

  constructor() {
    super('MessengerDB');
    this.version(1).stores({
      chats: '++id, title, lastMessageAt, unreadCount',
      messages: '++id, chatId, ts, sender, body, [chatId+ts]',
    });
  }
}

const db = new MessengerDatabase();

export class WebDatabaseService {
  async initialize(): Promise<void> {
    await db.open();
  }

  async seedData(): Promise<void> {
    const chatCount = await db.chats.count();
    if (chatCount >= 200) {
      return;
    }

    await db.chats.clear();
    await db.messages.clear();

    const now = Date.now();
    const chatIds: number[] = [];
    const senders = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
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

    for (let i = 0; i < 200; i++) {
      const senderName = senders[Math.floor(Math.random() * senders.length)];
      const chatId = await db.chats.add({
        title: senderName,
        lastMessageAt: now - Math.random() * 86400000 * 30,
        unreadCount: Math.floor(Math.random() * 10),
      });
      chatIds.push(chatId as number);
    }

    const messagesPerChat = Math.floor(20000 / 200);
    const messages: Message[] = [];

    for (const chatId of chatIds) {
      const messageCount = messagesPerChat + Math.floor(Math.random() * 20);
      for (let j = 0; j < messageCount; j++) {
        messages.push({
          chatId,
          ts: now - Math.random() * 86400000 * 30,
          sender: senders[Math.floor(Math.random() * senders.length)],
          body: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
        });
      }
    }

    await db.messages.bulkAdd(messages);

    for (const chatId of chatIds) {
      const lastMessage = await db.messages
        .where('chatId')
        .equals(chatId)
        .sortBy('ts');
      if (lastMessage.length > 0) {
        const latest = lastMessage[lastMessage.length - 1];
        await db.chats.update(chatId, { lastMessageAt: latest.ts });
      }
    }

  }

  async getChats(limit: number, offset: number): Promise<Chat[]> {
    return await db.chats
      .orderBy('lastMessageAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray()
      .then((chats) =>
        chats.map((chat) => ({
          id: chat.id!,
          title: chat.title,
          lastMessageAt: chat.lastMessageAt,
          unreadCount: chat.unreadCount,
        }))
      );
  }

  async getMessages(chatId: number, limit: number, offset: number): Promise<Message[]> {
    const allMessages = await db.messages
      .where('chatId')
      .equals(chatId)
      .sortBy('ts');
    const totalCount = allMessages.length;
    const startIndex = Math.max(0, totalCount - limit - offset);
    const endIndex = totalCount - offset;
    return allMessages.slice(startIndex, endIndex).map((msg) => ({
      id: msg.id!,
      chatId: msg.chatId,
      ts: msg.ts,
      sender: msg.sender,
      body: msg.body,
    }));
  }

  async searchMessages(chatId: number, query: string): Promise<Message[]> {
    return await db.messages
      .where('chatId')
      .equals(chatId)
      .filter((msg) => msg.body.toLowerCase().includes(query.toLowerCase()))
      .sortBy('ts')
      .then((msgs) =>
        msgs
          .reverse()
          .slice(0, 50)
          .map((msg) => ({
            id: msg.id!,
            chatId: msg.chatId,
            ts: msg.ts,
            sender: msg.sender,
            body: msg.body,
          }))
      );
  }

  async addMessage(chatId: number, messageId: number, ts: number, sender: string, body: string): Promise<void> {
    const existing = await db.messages.get(messageId);
    if (!existing) {
      await db.messages.add({
        id: messageId,
        chatId,
        ts,
        sender,
        body,
      });
    }

    const chat = await db.chats.get(chatId);
    if (chat) {
      await db.chats.update(chatId, {
        lastMessageAt: ts,
        unreadCount: chat.unreadCount + 1,
      });
    }
  }

  async markChatAsRead(chatId: number): Promise<void> {
    await db.chats.update(chatId, { unreadCount: 0 });
  }
}

export const webDatabase = new WebDatabaseService();

