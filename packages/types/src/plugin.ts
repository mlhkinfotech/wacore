import type { MessageContext, MessageResult } from './whatsapp.js';
import type { AgentContext, AgentResponse, ToolDefinition } from './agent.js';

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
}

export interface PluginHooks {
  onInit?(): Promise<void> | void;
  onDestroy?(): Promise<void> | void;

  // Filter or intercept incoming messages
  onMessageReceived?(ctx: MessageContext): Promise<boolean | void>; // return false to stop processing

  // Intercept before AI agent generates reply
  onBeforeAIProcess?(ctx: AgentContext): Promise<AgentContext | void>;

  // Intercept after AI agent generates reply
  onAfterAIProcess?(ctx: AgentContext, res: AgentResponse): Promise<AgentResponse | void>;

  // Notification / event when message has been sent
  onMessageSent?(ctx: MessageContext, result: MessageResult): Promise<void> | void;
}

export interface Plugin extends PluginMetadata, PluginHooks {
  tools?(): ToolDefinition[];
}
