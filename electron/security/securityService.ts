export class SecurityService {
  encrypt(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  decrypt(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }

  sanitizeForLogging(data: string): string {
    if (data.length > 50) {
      return `${data.substring(0, 50)}... [truncated]`;
    }
    return '[REDACTED]';
  }
}

