import { EventEmitter } from 'events';
import { SessionManager } from './session/manager.js';
import type {
  SessionOptions,
  MessageContext,
  MessageResult,
  Plugin,
  SessionState
} from '@mlhkinfotech/types';

export class WhatsAppEngine extends EventEmitter {
  public readonly sessions: SessionManager;
  private plugins: Plugin[] = [];
  private defaultSessionOptions: SessionOptions;

  constructor(options: SessionOptions = {}) {
    super();
    this.defaultSessionOptions = options;
    this.sessions = new SessionManager();

    this.sessions.on('qr', (data) => this.emit('qr', data));
    this.sessions.on('ready', (data) => this.emit('ready', data));
    this.sessions.on('status', (data) => this.emit('status', data));
    this.sessions.on('disconnected', (data) => this.emit('disconnected', data));
    this.sessions.on('error', (err) => this.emit('error', err));

    this.sessions.on('message', async (ctx: MessageContext) => {
      // Execute plugin onMessageReceived hooks
      for (const plugin of this.plugins) {
        if (plugin.onMessageReceived) {
          const proceed = await plugin.onMessageReceived(ctx);
          if (proceed === false) return; // intercepted by plugin
        }
      }
      this.emit('message', ctx);
    });
  }

  public use(plugin: Plugin): this {
    this.plugins.push(plugin);
    if (plugin.onInit) {
      Promise.resolve(plugin.onInit()).catch((err) => {
        this.emit('error', { plugin: plugin.name, error: err });
      });
    }
    return this;
  }

  public async start(sessionId = 'default'): Promise<void> {
    const session = this.sessions.createSession({
      ...this.defaultSessionOptions,
      sessionId,
    });
    await session.connect();
  }

  public async stop(sessionId?: string): Promise<void> {
    if (sessionId) {
      const session = this.sessions.getSession(sessionId);
      if (session) await session.disconnect();
    } else {
      await this.sessions.disconnectAll();
    }

    for (const plugin of this.plugins) {
      if (plugin.onDestroy) {
        await Promise.resolve(plugin.onDestroy()).catch(() => {});
      }
    }
  }

  public async sendText(to: string, text: string, sessionId = 'default'): Promise<MessageResult> {
    const session = this.sessions.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return session.sendText(to, text);
  }

  public async sendImage(to: string, image: Buffer | string, caption?: string, sessionId = 'default'): Promise<MessageResult> {
    const session = this.sessions.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    return session.sendImage(to, image, caption);
  }

  public getState(sessionId = 'default'): SessionState | undefined {
    return this.sessions.getSession(sessionId)?.getState();
  }

  public getAllStates(): SessionState[] {
    return this.sessions.getAllStates();
  }

  public getPlugins(): Plugin[] {
    return [...this.plugins];
  }
}
