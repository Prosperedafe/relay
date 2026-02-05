import { webDatabase } from './webDatabase';

class WebWebSocketServer {
  private port: number;
  private messageInterval: number | null = null;
  private isDropped: boolean = false;

  constructor() {
    this.port = 8080;
  }

  start(): void {
    this.isDropped = false;
    this.messageInterval = window.setInterval(() => {
      if (this.isDropped) return;

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

      webDatabase.addMessage(chatId, messageId, ts, sender, body).then(() => {
        const event = new CustomEvent('websocket-message', {
          detail: {
            chatId,
            messageId,
            ts,
            sender,
            body: btoa(body),
          },
        });
        window.dispatchEvent(event);
      });
    }, 1000 + Math.random() * 2000);
  }

  getPort(): number {
    return this.port;
  }

  simulateConnectionDrop(): void {
    this.isDropped = true;
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
    const event = new CustomEvent('websocket-close');
    window.dispatchEvent(event);
  }

  close(): void {
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
      this.messageInterval = null;
    }
  }
}

export const webWebSocketServer = new WebWebSocketServer();

