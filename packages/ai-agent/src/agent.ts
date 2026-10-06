import { MemoryManager } from './memory/manager.js';
import { ToolRegistry } from './tools/registry.js';
import { isHandoffIntent, isBuyIntent } from './intents/detector.js';
import { callGemini } from './providers/gemini.js';
import { callOpenRouter } from './providers/openrouter.js';
import type {
  AgentConfig,
  AgentContext,
  AgentResponse,
  ToolDefinition
} from '@mlhk/types';

export class AIAgent {
  private config: AgentConfig;
  public readonly memory: MemoryManager;
  public readonly tools: ToolRegistry;
  private dailyCounts: Map<string, { count: number; date: string }> = new Map();

  constructor(config: AgentConfig) {
    this.config = {
      systemPrompt: 'You are a helpful and polite business sales and support assistant.',
      temperature: 0.7,
      maxTokens: 800,
      memoryLimit: 20,
      dailyLimit: 100,
      fallbackMessage: 'Kripya thoda wait karein ya direct call karein.',
      handoffKeywords: [],
      ...config,
      provider: config.provider || 'gemini',
      apiKey: config.apiKey || process.env.AI_API_KEY || ''
    };

    this.memory = new MemoryManager(this.config.memoryLimit);
    this.tools = new ToolRegistry();
  }

  public registerTool(tool: ToolDefinition): this {
    this.tools.register(tool);
    return this;
  }

  public setSystemPrompt(prompt: string): void {
    this.config.systemPrompt = prompt;
  }

  public updateConfig(partial: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  public getConfig(): AgentConfig {
    return { ...this.config };
  }

  public async process(ctx: AgentContext): Promise<AgentResponse> {
    const { contactId, contactName, message, media } = ctx;

    // 1. Business Hours check
    if (this.config.businessHours?.enabled && !this.isWithinBusinessHours()) {
      return {
        reply: this.config.businessHours.afterHoursMessage || 'Hamara office abhi band hai. Business hours me contact karein.',
        isAI: true
      };
    }

    // 2. Daily limit check
    if (!this.checkDailyLimit(contactId)) {
      return {
        reply: 'Aapki aaj ki message limit reach ho gayi hai. Kal dobara sampark karein.',
        isAI: false
      };
    }

    // 3. Human Handoff Intent check
    if (this.config.features?.humanHandoff !== false && isHandoffIntent(message, this.config.handoffKeywords)) {
      return {
        reply: 'Main aapko hamare team member se connect kar raha hoon. Kripya thoda intezaar karein.',
        isAI: true,
        isHandoff: true
      };
    }

    // 4. Memory History
    const history = this.memory.getHistory(contactId);

    // 5. System Prompt Construction
    let systemInstruction = this.config.systemPrompt || '';
    if (ctx.metadata?.storeInfo) {
      systemInstruction += `\n\nSTORE INFO:\n${JSON.stringify(ctx.metadata.storeInfo)}`;
    }
    if (ctx.metadata?.customerInfo) {
      systemInstruction += `\n\nCUSTOMER INFO:\nName: ${ctx.metadata.customerInfo.name || contactName}`;
    }

    // 6. Call LLM
    let replyText: string | null = null;
    const apiKey = this.config.apiKey || '';

    if (this.config.provider === 'gemini') {
      replyText = await callGemini({
        apiKey,
        model: this.config.model,
        systemInstruction,
        history,
        prompt: message,
        media,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });
    } else if (this.config.provider === 'openrouter') {
      replyText = await callOpenRouter({
        apiKey,
        model: this.config.model,
        systemInstruction,
        history,
        prompt: message,
        media,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens
      });
    }

    // 7. Fallback if LLM failed
    if (!replyText) {
      return {
        reply: this.config.fallbackMessage || 'Technical problem ki wajah se response generate nahi ho saka.',
        isAI: true,
        isFallback: true
      };
    }

    // 8. Update Memory
    this.memory.addEntry(contactId, 'user', message);
    this.memory.addEntry(contactId, 'assistant', replyText);
    this.incrementDailyCount(contactId);

    return {
      reply: replyText,
      isAI: true,
      intent: isBuyIntent(message) ? 'buy' : undefined
    };
  }

  private isWithinBusinessHours(): boolean {
    const bh = this.config.businessHours;
    if (!bh || !bh.enabled) return true;

    const now = new Date();
    const day = now.getDay();
    const allowedDays = bh.days || [1, 2, 3, 4, 5, 6];
    if (!allowedDays.includes(day)) return false;

    const [sh, sm] = (bh.start || '10:00').split(':').map(Number);
    const [eh, em] = (bh.end || '20:00').split(':').map(Number);
    const cur = now.getHours() * 60 + now.getMinutes();

    return cur >= (sh * 60 + sm) && cur <= (eh * 60 + em);
  }

  private checkDailyLimit(contactId: string): boolean {
    const limit = this.config.dailyLimit || 100;
    const today = new Date().toISOString().split('T')[0];
    const record = this.dailyCounts.get(contactId);
    if (!record || record.date !== today) return true;
    return record.count < limit;
  }

  private incrementDailyCount(contactId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const record = this.dailyCounts.get(contactId);
    if (!record || record.date !== today) {
      this.dailyCounts.set(contactId, { count: 1, date: today });
    } else {
      record.count += 1;
    }
  }
}
