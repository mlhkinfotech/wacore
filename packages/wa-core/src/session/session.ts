import { EventEmitter } from 'events';
import path from 'path';
import { rmSync, existsSync } from 'fs';
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  type WASocket,
  type proto
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import pino from 'pino';
import { v4 as uuid } from 'uuid';
import type {
  SessionOptions,
  SessionState,
  SessionStatus,
  MessageResult,
  MediaData,
  MessageContext
} from '@mlhkinfotech/types';
import { toJID, isGroupJID } from '../utils/phone.js';

interface InternalSessionOptions {
  sessionId: string;
  sessionPath: string;
  printQRInTerminal: boolean;
  browser: [string, string, string];
  reconnect: {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
  };
}

export class WhatsAppSession extends EventEmitter {
  public readonly id: string;
  private sock: WASocket | null = null;
  private status: SessionStatus = 'disconnected';
  private qrCode: string | null = null;
  private phoneNumber: string | null = null;
  private reconnectAttempts = 0;
  private reconnecting = false;
  private options: InternalSessionOptions;

  constructor(options: SessionOptions = {}) {
    super();
    this.id = options.sessionId || 'default';
    this.options = {
      sessionId: this.id,
      sessionPath: options.sessionPath || path.resolve(`data/sessions/${this.id}`),
      printQRInTerminal: options.printQRInTerminal ?? true,
      browser: options.browser || ['MLHK AI Agent', 'Chrome', '22.0'],
      reconnect: {
        maxAttempts: options.reconnect?.maxAttempts ?? 10,
        initialDelayMs: options.reconnect?.initialDelayMs ?? 5000,
        maxDelayMs: options.reconnect?.maxDelayMs ?? 300000,
      }
    };
  }

  public getState(): SessionState {
    return {
      id: this.id,
      status: this.status,
      qrCode: this.qrCode,
      phoneNumber: this.phoneNumber,
    };
  }

  public getSocket(): WASocket | null {
    return this.sock;
  }

  public async connect(): Promise<void> {
    if (this.sock) return;

    this.setStatus('initializing');
    const { state, saveCreds } = await useMultiFileAuthState(this.options.sessionPath);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any }));

    const logger = pino({ level: 'silent' });

    this.sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: this.options.printQRInTerminal,
      browser: this.options.browser,
      generateHighQualityLinkPreview: false,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrCode = await qrcode.toDataURL(qr);
        this.setStatus('qr');
        this.emit('qr', { sessionId: this.id, qr: this.qrCode });
      }

      if (connection === 'open') {
        this.qrCode = null;
        this.reconnectAttempts = 0;
        this.reconnecting = false;
        if (this.sock?.user?.id) {
          this.phoneNumber = this.sock.user.id.split(':')[0] || null;
        }
        this.setStatus('ready');
        this.emit('ready', { sessionId: this.id, phone: this.phoneNumber });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const loggedOut = statusCode === DisconnectReason.loggedOut;
        this.sock = null;
        this.phoneNumber = null;
        this.setStatus('disconnected');
        this.emit('disconnected', { sessionId: this.id, reason: statusCode });

        if (loggedOut) {
          await this.clearSession();
          setTimeout(() => this.connect(), 2000);
          return;
        }

        if (this.reconnecting) return;
        if (this.reconnectAttempts >= this.options.reconnect.maxAttempts) {
          this.reconnecting = false;
          return;
        }

        this.reconnecting = true;
        this.reconnectAttempts++;
        const delay = Math.min(
          this.options.reconnect.initialDelayMs * Math.pow(2, this.reconnectAttempts - 1),
          this.options.reconnect.maxDelayMs
        );
        setTimeout(() => {
          this.reconnecting = false;
          this.connect();
        }, delay);
      }
    });

    this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const raw of messages) {
        try {
          if (raw.key.fromMe) continue;
          if (!raw.message) continue;

          const from = raw.key.remoteJid;
          if (!from || from === 'status@broadcast') continue;

          const ctx = await this.buildMessageContext(raw);
          if (ctx) {
            this.emit('message', ctx);
          }
        } catch (err: any) {
          this.emit('error', err);
        }
      }
    });
  }

  public async disconnect(): Promise<void> {
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch {}
      this.sock = null;
    }
    this.setStatus('disconnected');
  }

  public async clearSession(): Promise<void> {
    await this.disconnect();
    if (existsSync(this.options.sessionPath)) {
      try {
        rmSync(this.options.sessionPath, { recursive: true, force: true });
      } catch {}
    }
    this.qrCode = null;
  }

  public async sendText(to: string, text: string): Promise<MessageResult> {
    if (!this.sock || this.status !== 'ready') {
      throw new Error(`Session ${this.id} is not connected`);
    }
    const jid = toJID(to);
    const sent = await this.sock.sendMessage(jid, { text });
    return {
      messageId: sent?.key?.id || uuid(),
      timestamp: Date.now(),
      status: 'sent'
    };
  }

  public async sendImage(to: string, image: Buffer | string, caption?: string): Promise<MessageResult> {
    if (!this.sock || this.status !== 'ready') {
      throw new Error(`Session ${this.id} is not connected`);
    }
    const jid = toJID(to);
    const payload = typeof image === 'string' && image.startsWith('http')
      ? { image: { url: image }, caption }
      : { image: Buffer.isBuffer(image) ? image : Buffer.from(image, 'base64'), caption };

    const sent = await this.sock.sendMessage(jid, payload as any);
    return {
      messageId: sent?.key?.id || uuid(),
      timestamp: Date.now(),
      status: 'sent'
    };
  }

  public async sendPresence(to: string, presence: 'composing' | 'paused'): Promise<void> {
    if (!this.sock || this.status !== 'ready') return;
    try {
      await this.sock.sendPresenceUpdate(presence, toJID(to));
    } catch {}
  }

  private setStatus(newStatus: SessionStatus) {
    this.status = newStatus;
    this.emit('status', { sessionId: this.id, status: newStatus });
  }

  private async buildMessageContext(raw: proto.IWebMessageInfo): Promise<MessageContext | null> {
    const from = raw.key?.remoteJid;
    if (!from) return null;

    const isGroup = isGroupJID(from);
    const msg = raw.message;
    if (!msg) return null;

    let body = msg.conversation
      || msg.extendedTextMessage?.text
      || msg.imageMessage?.caption
      || msg.videoMessage?.caption
      || '';

    let type: any = 'text';
    let media: MediaData | undefined;

    if (msg.imageMessage) {
      type = 'image';
      try {
        const buffer = await downloadMediaMessage(raw as any, 'buffer', {});
        if (buffer && buffer.length < 10 * 1024 * 1024) {
          media = {
            mimeType: msg.imageMessage.mimetype || 'image/jpeg',
            data: buffer.toString('base64')
          };
        }
      } catch {}
      if (!body) body = '[image]';
    } else if (msg.videoMessage) {
      type = 'video';
      if (!body) body = '[video]';
    } else if (msg.audioMessage) {
      type = 'audio';
      if (!body) body = '[audio]';
    } else if (msg.documentMessage) {
      type = 'document';
      if (!body) body = '[document]';
    }

    const pushName = raw.pushName || from.split('@')[0];
    const contextInfo = msg.extendedTextMessage?.contextInfo || msg.imageMessage?.contextInfo;
    const quotedId = contextInfo?.stanzaId;
    const quotedText = contextInfo?.quotedMessage?.conversation || contextInfo?.quotedMessage?.extendedTextMessage?.text;

    return {
      sessionId: this.id,
      from,
      fromName: pushName,
      to: 'me',
      body,
      type,
      isGroup,
      groupId: isGroup ? from : undefined,
      media,
      quotedMessage: quotedId && quotedText ? { id: quotedId, body: quotedText } : undefined,
      timestamp: new Date((Number(raw.messageTimestamp) || Math.floor(Date.now() / 1000)) * 1000),
      raw,
      reply: (replyText: string) => this.sendText(from, replyText),
      replyWithImage: (img: Buffer | string, caption?: string) => this.sendImage(from, img, caption),
      sendPresence: (presence: 'composing' | 'paused') => this.sendPresence(from, presence)
    };
  }
}
