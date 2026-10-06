# @mlhkinfotech/ai-agent

[![npm version](https://img.shields.io/npm/v/@mlhkinfotech/ai-agent.svg?color=blue)](https://www.npmjs.com/package/@mlhkinfotech/ai-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Enterprise AI Brain Engine for conversational WhatsApp bots with multi-provider LLM support (Google Gemini & OpenRouter), sliding conversation memory, intent recognition, and dynamic tool-calling.

---

## 🚀 Features

- **Multi-Provider LLM**:
  - **Google Gemini**: Direct integration with `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`.
  - **OpenRouter**: Access to 100+ models (Claude 3.5 Sonnet, DeepSeek R1, GPT-4o, Llama 3.3).
- **Conversation Memory Manager**: Per-contact sliding conversation buffer with TTL and max message history.
- **Dynamic Tool Calling**: Register custom tools and functions that the AI can call seamlessly to fetch data or trigger actions.
- **Intent Recognition Engine**: Fast heuristic intent classification (greetings, product search, order placement, human handoff, FAQs).
- **System Prompt Templating**: Easily tailor persona, business rules, tone, and policies.

---

## 📦 Installation

```bash
npm install @mlhkinfotech/ai-agent
```

---

## 💻 Quick Start

### Basic Gemini Agent

```typescript
import { AIAgent } from '@mlhkinfotech/ai-agent';

const agent = new AIAgent({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-1.5-flash',
  systemPrompt: `You are the friendly AI assistant for "Apex Electronics".
Answer questions concisely and politely in WhatsApp style.`
});

// Process an incoming customer message
const response = await agent.process({
  contactId: '919876543210@s.whatsapp.net',
  contactName: 'Rahul Sharma',
  message: 'Do you have iPhone 15 Pro Max in stock?'
});

console.log('AI Reply:', response.reply);
```

---

### OpenRouter Multi-Model Agent (e.g., DeepSeek / Claude)

```typescript
import { AIAgent } from '@mlhkinfotech/ai-agent';

const agent = new AIAgent({
  provider: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'deepseek/deepseek-chat', // or 'anthropic/claude-3.5-sonnet'
  systemPrompt: 'You are an intelligent sales consultant.'
});
```

---

### Adding Custom Tools (Function Calling)

```typescript
import { AIAgent, ToolRegistry } from '@mlhkinfotech/ai-agent';

const agent = new AIAgent({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY!
});

// Register a real-time order tracking tool
agent.registerTool({
  name: 'track_order',
  description: 'Lookup current delivery status of an order by Order ID',
  parameters: {
    type: 'object',
    properties: {
      orderId: { type: 'string', description: 'The numeric or alphanumeric order ID' }
    },
    required: ['orderId']
  },
  handler: async ({ orderId }) => {
    // Database or API lookup
    return {
      orderId,
      status: 'Out for delivery',
      courier: 'BlueDart',
      estimatedArrival: 'Today by 5:00 PM'
    };
  }
});

// AI will automatically invoke the tool when customer asks: "Where is my order #12345?"
const result = await agent.process({
  contactId: 'customer_1',
  message: 'Please check where my order #12345 has reached.'
});

console.log(result.reply);
```

---

### Conversation Memory Buffer

```typescript
import { MemoryManager } from '@mlhkinfotech/ai-agent';

const memory = new MemoryManager({
  maxMessagesPerUser: 20, // Keep last 20 messages per contact
  ttlMs: 24 * 60 * 60 * 1000 // Expire inactive chat history after 24 hours
});

// Add message
memory.addMessage('user-1', { role: 'user', content: 'My name is Amit' });
memory.addMessage('user-1', { role: 'assistant', content: 'Nice to meet you, Amit!' });

// Get chat history for AI context
const history = memory.getHistory('user-1');
```

---

## 📄 License

MIT © [MLHK Infotech](https://github.com/mlhkinfotech)
