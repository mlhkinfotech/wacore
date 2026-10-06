import type { SessionStatus } from './whatsapp.js';

export interface SessionOptions {
  sessionId?: string;
  sessionPath?: string;
  printQRInTerminal?: boolean;
  browser?: [string, string, string];
  reconnect?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
  };
}

export interface SessionState {
  id: string;
  status: SessionStatus;
  qrCode?: string | null;
  phoneNumber?: string | null;
  connectedAt?: Date | null;
  error?: string | null;
}
