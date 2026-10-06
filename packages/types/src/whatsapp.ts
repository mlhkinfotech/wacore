export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact';

export type SessionStatus =
  | 'disconnected'
  | 'initializing'
  | 'qr'
  | 'ready'
  | 'banned';

export interface MessageButton {
  id: string;
  text: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface ListMessage {
  title: string;
  description?: string;
  buttonText: string;
  sections: ListSection[];
}

export interface MessageResult {
  messageId: string;
  timestamp: number;
  status: 'sent' | 'failed' | 'queued';
  error?: string;
}

export interface QuotedMessage {
  id: string;
  body: string;
}

export interface MediaData {
  mimeType: string;
  data: string; // base64
  fileName?: string;
  fileLength?: number;
}

export interface ContactInfo {
  id: string;
  name?: string;
  phone: string;
  isBusiness?: boolean;
}

export interface GroupInfo {
  id: string;
  subject: string;
  desc?: string;
  participantsCount: number;
}

export interface MessageContext {
  sessionId: string;
  from: string; // e.g. 919893496163@s.whatsapp.net
  fromName: string;
  to: string;
  body: string;
  type: MessageType;
  isGroup: boolean;
  groupId?: string;
  media?: MediaData;
  quotedMessage?: QuotedMessage;
  timestamp: Date;
  raw?: any;

  // Convenience helper methods
  reply(text: string): Promise<MessageResult>;
  replyWithImage(image: Buffer | string, caption?: string): Promise<MessageResult>;
  sendPresence(presence: 'composing' | 'paused'): Promise<void>;
}
