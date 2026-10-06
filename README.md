# 🚀 MLHK AI WhatsApp Ecosystem

Enterprise-grade, modular, and multi-tenant WhatsApp AI Agent & Automation Platform built with TypeScript and Node.js.

---

## 📦 Packages in this Monorepo

| Package | Status | Description |
|---|---|---|
| [`@mlhkinfotech/types`](./packages/types) | `v1.0.0` | Shared TypeScript interfaces & contracts |
| [`@mlhkinfotech/wa-core`](./packages/wa-core) | `v1.0.0` | Core WhatsApp Engine with Baileys & Multi-Session support |
| [`@mlhkinfotech/ai-agent`](./packages/ai-agent) | `v1.0.0` | AI Agent Brain with Gemini, OpenRouter, Memory & Tool-calling |
| [`@mlhkinfotech/plugin-catalog`](./plugins/plugin-catalog) | `v1.0.0` | Universal Business & Product Customization Plugin |
| [`@mlhkinfotech/wa-server`](./packages/wa-server) | `v1.0.0` | Turnkey REST API, WebSocket & Notification Server |
| [`@mlhkinfotech/wa-admin`](./packages/wa-admin) | `v1.0.0` | React Admin Dashboard UI (Vite + Dark Mode) |

---

## ⚡ Quick Start

### 1. Requirements
- Node.js `>= 20`
- pnpm `>= 9`

### 2. Installation & Build
```bash
# Clone and install dependencies
pnpm install

# Build all packages
pnpm run build
```

### 3. Run Demo Bot
```bash
cd examples/basic-bot

# Set up your environment variables
cp .env.example .env
# Edit .env with your AI_API_KEY (e.g., Gemini or OpenRouter)

# Start the bot
pnpm start
```
Terminal par QR code print hoga, WhatsApp se scan karein aur aapka AI Bot active ho jayega!

---

## 🛠️ Usage Example

```typescript
import { WhatsAppEngine } from '@mlhkinfotech/wa-core';
import { AIAgent } from '@mlhkinfotech/ai-agent';

// 1. Configure the AI Agent
const agent = new AIAgent({
  provider: 'gemini',
  apiKey: process.env.AI_API_KEY,
  systemPrompt: 'You are a helpful customer support assistant.'
});

// 2. Initialize the WhatsApp Engine
const bot = new WhatsAppEngine({
  sessionId: 'client-1',
  sessionPath: './sessions/client-1'
});

// 3. Handle messages
bot.on('message', async (ctx) => {
  const response = await agent.process({
    contactId: ctx.from,
    contactName: ctx.fromName,
    message: ctx.body
  });

  if (response.reply) {
    await ctx.reply(response.reply);
  }
});

// 4. Start Engine
await bot.start();
```

---

## 🖥️ Web Admin Dashboard UI (`@mlhkinfotech/wa-admin`)

Aap bina code likhe direct browser se QR code scan kar sakte hain aur pura bot visually manage kar sakte hain:

```bash
# 1. Start Server (Terminal 1)
pnpm --filter @mlhkinfotech/wa-server start

# 2. Start Admin Dashboard UI (Terminal 2)
pnpm --filter @mlhkinfotech/wa-admin dev
```
👉 Open **`http://localhost:3000`** in your browser!

Features:
- 📱 Live WhatsApp QR Code Viewer
- 🤖 AI Brain Config (System Prompt, Temperature, Model selection)
- 💬 Real-time Messages Feed & Manual Reply Sender
- 📢 Broadcast Campaign Sender with anti-ban delay
- 🧪 AI Playground Sandbox for testing agent responses

---

## 🚢 Publishing to npm

To publish the packages to the npm registry:

```bash
# 1. Login to your npm account
npm login

# 2. Build the latest changes
pnpm run build

# 3. Publish packages with public access
pnpm --filter @mlhkinfotech/types publish --access public
pnpm --filter @mlhkinfotech/wa-core publish --access public
pnpm --filter @mlhkinfotech/ai-agent publish --access public
```

---

## 📄 License
MIT © MLHK
