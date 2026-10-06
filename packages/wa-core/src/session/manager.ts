import { EventEmitter } from 'events';
import { WhatsAppSession } from './session.js';
import type { SessionOptions, SessionState } from '@mlhk/types';

export class SessionManager extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map();

  public createSession(options: SessionOptions = {}): WhatsAppSession {
    const id = options.sessionId || 'default';
    if (this.sessions.has(id)) {
      return this.sessions.get(id)!;
    }

    const session = new WhatsAppSession(options);

    session.on('qr', (data) => this.emit('qr', data));
    session.on('ready', (data) => this.emit('ready', data));
    session.on('status', (data) => this.emit('status', data));
    session.on('disconnected', (data) => this.emit('disconnected', data));
    session.on('message', (ctx) => this.emit('message', ctx));
    session.on('error', (err) => this.emit('error', { sessionId: id, error: err }));

    this.sessions.set(id, session);
    return session;
  }

  public getSession(id = 'default'): WhatsAppSession | undefined {
    return this.sessions.get(id);
  }

  public getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values());
  }

  public getAllStates(): SessionState[] {
    return this.getAllSessions().map((s) => s.getState());
  }

  public async removeSession(id = 'default'): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      await session.clearSession();
      this.sessions.delete(id);
    }
  }

  public async disconnectAll(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.disconnect();
    }
  }
}
