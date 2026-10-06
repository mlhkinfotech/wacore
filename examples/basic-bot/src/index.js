import { WhatsAppEngine } from '@mlhkinfotech/wa-core';
import { AIAgent } from '@mlhkinfotech/ai-agent';

// 1. Initialize AI Agent
const agent = new AIAgent({
  provider: (process.env.AI_PROVIDER || 'gemini'),
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gemini-2.0-flash',
  systemPrompt: `Aap MLHK Solutions ke smart AI assistant ho.
Customers ki madad karo polite Hinglish/Hindi me. Short aur helpful jawab do.`,
  temperature: 0.7,
  features: {
    typingIndicator: true,
    humanHandoff: true,
  }
});

// 2. Register a Sample Tool (Function Calling)
agent.registerTool({
  name: 'get_service_info',
  description: 'MLHK company ke packages aur services ka price batata hai',
  parameters: {
    type: 'object',
    properties: {
      service_type: { type: 'string', description: 'POS, Website, ya AI Bot' }
    }
  },
  handler: async ({ service_type }) => {
    return {
      service: service_type,
      pricing: 'Custom quotation available',
      support: '24/7 WhatsApp & Phone Support'
    };
  }
});

// 3. Initialize WhatsApp Engine
const bot = new WhatsAppEngine({
  sessionId: 'mlhk-demo',
  sessionPath: './data/session-demo',
  printQRInTerminal: true,
});

// Listen for connection events
bot.on('ready', ({ sessionId, phone }) => {
  console.log(`🚀 [${sessionId}] WhatsApp Ready! Connected Phone: +${phone}`);
});

bot.on('disconnected', ({ sessionId, reason }) => {
  console.log(`⚠️ [${sessionId}] WhatsApp disconnected. Reason code: ${reason}`);
});

// 4. Handle Incoming Messages
bot.on('message', async (ctx) => {
  console.log(`📩 Incoming message from ${ctx.fromName} (${ctx.from}): "${ctx.body}"`);

  // Show "Typing..." in customer's WhatsApp chat
  await ctx.sendPresence('composing');

  // Process message with AI Agent
  const response = await agent.process({
    contactId: ctx.from,
    contactName: ctx.fromName,
    message: ctx.body,
    media: ctx.media
  });

  // Small delay to make response natural
  await new Promise(r => setTimeout(r, 1200));
  await ctx.sendPresence('paused');

  if (response.reply) {
    console.log(`🤖 AI Reply: "${response.reply}"`);
    await ctx.reply(response.reply);
  }

  if (response.isHandoff) {
    console.log(`🚨 Human handoff requested by customer: ${ctx.from}`);
  }
});

console.log('📱 Starting MLHK WhatsApp AI Bot...');
await bot.start();
