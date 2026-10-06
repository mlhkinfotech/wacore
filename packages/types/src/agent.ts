import type { MediaData } from './whatsapp.js';

export type LLMProviderType = 'gemini' | 'openrouter' | 'openai' | 'ollama' | 'custom';

export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
  items?: any;
  enum?: any[];
  [key: string]: any;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: (params: any, ctx: AgentContext) => Promise<any>;
}

export interface BusinessHoursConfig {
  enabled: boolean;
  start: string; // e.g. "10:00"
  end: string;   // e.g. "20:00"
  days?: number[]; // [1, 2, 3, 4, 5, 6] 0 = Sun, 1 = Mon ...
  afterHoursMessage?: string;
}

export interface AgentConfig {
  provider: LLMProviderType;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  memoryLimit?: number;
  dailyLimit?: number;
  businessHours?: BusinessHoursConfig;
  features?: {
    typingIndicator?: boolean;
    replyDelayMin?: number; // seconds
    replyDelayMax?: number; // seconds
    autoGreeting?: boolean;
    productSearch?: boolean;
    orderWorkflow?: boolean;
    humanHandoff?: boolean;
  };
  fallbackMessage?: string;
  handoffKeywords?: string[];
}

export interface MemoryEntry {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolName?: string;
  timestamp?: Date;
}

export interface AgentContext {
  contactId: string;
  contactName: string;
  message: string;
  media?: MediaData;
  metadata?: Record<string, any>;
}

export interface ProductCardImage {
  url: string;
  caption?: string;
}

export interface AgentResponse {
  reply: string;
  images?: ProductCardImage[];
  isAI: boolean;
  isHandoff?: boolean;
  isOrder?: boolean;
  isFallback?: boolean;
  intent?: string;
  toolsCalled?: string[];
  metadata?: Record<string, any>;
}
