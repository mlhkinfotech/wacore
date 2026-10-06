# @mlhkinfotech/types

[![npm version](https://img.shields.io/npm/v/@mlhkinfotech/types.svg?color=blue)](https://www.npmjs.com/package/@mlhkinfotech/types)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Canonical TypeScript interfaces, data contracts, and event schemas for the **MLHK WhatsApp AI Agent Ecosystem**.

---

## 📦 Installation

```bash
# Using npm
npm install @mlhkinfotech/types

# Using pnpm
pnpm add @mlhkinfotech/types

# Using yarn
yarn add @mlhkinfotech/types
```

---

## 🎯 What's Included

`@mlhkinfotech/types` exports zero-dependency TypeScript definitions across 4 domains:

### 1. WhatsApp Domain (`./whatsapp.js`)
- `WAMessage`: Unified incoming and outgoing message structure (text, media, buttons, interactive payloads).
- `WAContact`: WhatsApp user details (JID, phone number, name, profile status).
- `WASessionConfig`: Configuration object for WhatsApp Baileys socket connections.
- `WAConnectionState`: Connection states (`connecting`, `open`, `close`, `reconnecting`).

### 2. AI Agent Domain (`./agent.js`)
- `AIMessage`: Chat history message structure (`role: 'system' | 'user' | 'assistant' | 'tool'`).
- `AIProvider`: Supported LLM providers (`'gemini' | 'openrouter' | 'custom'`).
- `AIAgentConfig`: Agent options including temperature, maxTokens, and system prompt.
- `AIToolDefinition`: Schema for callable tools compatible with OpenAI and Google tool specs.
- `AIToolResult`: Standardized tool execution result.

### 3. Plugin Architecture (`./plugin.js`)
- `IPlugin`: Interface for building modular bot extensions.
- `PluginHook`: Message interception hooks (`beforeProcess`, `afterProcess`, `onCommand`).
- `CatalogProduct`: Business catalog product structure with SKU, price, stock, variants.
- `BusinessProfile`: Profile configuration for shops, clinics, agencies, or services.

### 4. Session & Storage Domain (`./session.js`)
- `ISessionStore`: Storage interface for session tokens and multi-tenant credentials.
- `SessionState`: Auth state tracking and QR code delivery.

---

## 💻 Usage Example

```typescript
import type { WAMessage, AIAgentConfig, IPlugin, CatalogProduct } from '@mlhkinfotech/types';

// Defining a typed business product
const product: CatalogProduct = {
  id: 'prod-001',
  name: 'Premium Cloud Hosting',
  description: 'High-speed VPS with 99.9% uptime',
  price: 1999,
  currency: 'INR',
  inStock: true,
  category: 'Infrastructure',
  tags: ['hosting', 'vps', 'cloud']
};

// Creating a typed AI Agent configuration
const config: AIAgentConfig = {
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  systemPrompt: 'You are the official MLHK Smart Store AI concierge.'
};
```

---

## 📄 License

MIT © [MLHK Infotech](https://github.com/mlhkinfotech)
