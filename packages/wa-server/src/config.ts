import dotenv from 'dotenv';
dotenv.config();

export interface ServerConfig {
  port: number;
  apiToken?: string;
  allowedOrigin: string;
  sessionPath: string;
  aiProvider: 'gemini' | 'openrouter';
  aiApiKey: string;
  aiModel?: string;
  systemPrompt?: string;
}

export const loadConfig = (overrides: Partial<ServerConfig> = {}): ServerConfig => {
  return {
    port: Number(process.env.PORT) || 3001,
    apiToken: process.env.WA_API_TOKEN || '',
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
    sessionPath: process.env.WA_SESSION_PATH || './data/sessions',
    aiProvider: (process.env.AI_PROVIDER as any) || 'gemini',
    aiApiKey: process.env.AI_API_KEY || '',
    aiModel: process.env.AI_MODEL || 'gemini-2.0-flash',
    systemPrompt: process.env.AI_SYSTEM_PROMPT || 'You are a helpful and polite business sales and customer support assistant.',
    ...overrides
  };
};
