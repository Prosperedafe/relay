import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { DatabaseService } from '../database/databaseService';
import { SecurityService } from '../security/securityService';

export class WebSocketServer {
  private server: WSServer | null = null;
  private port: number = 0;
  private clients: Set<WebSocket> = new Set();
  private messageInterval: ReturnType<typeof setInterval> | null = null;
  private isDropped: boolean = false;
  private dbService: DatabaseService;
  private securityService: SecurityService;

  constructor(dbService: DatabaseService, securityService: SecurityService) {
    this.dbService = dbService;
    this.securityService = securityService;
    this.start();
  }

  private start(): void {
    this.server = new WSServer({ port: 0 });
    this.port = (this.server.address() as { port: number }).port;

    this.server.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      this.isDropped = false;

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error.message);
      });
    });

    this.startMessageEmitter();
  }

  private startMessageEmitter(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }

    this.messageInterval = setInterval(() => {
      if (this.isDropped || this.clients.size === 0) return;

      const chatId = Math.floor(Math.random() * 200) + 1;
      const messageId = Date.now();
      const ts = Date.now();
      const senders = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
      const sender = senders[Math.floor(Math.random() * senders.length)];
      const messages = [
        'New message received',
        'Update on the project',
        'Meeting reminder',
        'Quick question',
        'Status update',
        'Action required',
        'Follow-up needed',
        'Important notice',
      ];
      const body = messages[Math.floor(Math.random() * messages.length)];

      this.dbService.addMessage(chatId, messageId, ts, sender, body);

      const event = {
        chatId,
        messageId,
        ts,
        sender,
        body: this.securityService.encrypt(body),
      };

      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    }, 1000 + Math.random() * 2000);
  }

  getPort(): number {
    return this.port;
  }

  simulateConnectionDrop(): void {
    this.isDropped = true;
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.clients.clear();
  }

  close(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
    this.clients.forEach((client) => client.close());
    this.clients.clear();
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

