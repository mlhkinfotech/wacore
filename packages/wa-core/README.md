# @mlhkinfotech/wa-core

[![npm version](https://img.shields.io/npm/v/@mlhkinfotech/wa-core.svg?color=blue)](https://www.npmjs.com/package/@mlhkinfotech/wa-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Robust, multi-tenant WhatsApp Baileys Engine designed for 24/7 reliability, automated reconnects, session isolation, and real-time message handling.

---

## 🚀 Features

- **Built on `@whiskeysockets/baileys`**: No official Cloud API fee required; runs with standard phone numbers.
- **Multi-Tenant Session Manager**: Manage 1 to 100+ separate WhatsApp accounts in parallel with isolated session folders.
- **Smart QR Code Handling**: Emits raw QR strings, ASCII terminal QR, and Data URLs for web dashboards.
- **Auto-Reconnect & Exponential Backoff**: Resilient to network disconnects, server restarts, and temporary WhatsApp dropouts.
- **Normalized Phone & JID Utilities**: Easily parse and validate international phone numbers and group chats.
- **Event-Driven**: Typed EventEmitter for `qr`, `ready`, `message`, `disconnected`, and `error`.

---

## 📦 Installation

```bash
npm install @mlhkinfotech/wa-core
```

---

## 💻 Quick Start

### Single Bot Engine

```typescript
import { WhatsAppEngine } from '@mlhkinfotech/wa-core';

const bot = new WhatsAppEngine({
  sessionId: 'main-bot',
  sessionPath: './sessions/main-bot',
  printQRInTerminal: true // Prints QR in terminal automatically
});

// Listen for QR code updates (if not using terminal auto-print)
bot.on('qr', ({ qr, qrDataUrl }) => {
  console.log('Scan this QR code in WhatsApp Linked Devices');
});

// Bot is connected and ready
bot.on('ready', ({ phone, name }) => {
  console.log(`✅ WhatsApp Bot connected as: ${name} (${phone})`);
});

// Incoming message handler
bot.on('message', async (msg) => {
  if (msg.fromMe) return; // Ignore outgoing messages

  console.log(`Message from ${msg.from}: ${msg.text}`);

  if (msg.text?.toLowerCase() === 'ping') {
    await bot.sendMessage(msg.from, 'Pong! 🏓');
  }
});

// Start connection
await bot.start();
```

---

### Multi-Tenant Session Manager

Run multiple WhatsApp numbers on one server with complete isolation:

```typescript
import { SessionManager } from '@mlhkinfotech/wa-core';

const manager = new SessionManager({
  baseSessionDir: './sessions'
});

// Create or get session for Client A
const clientA = await manager.getOrCreateSession('client_alpha');
clientA.on('message', async (msg) => {
  // Alpha client business logic
});
await clientA.start();

// Create or get session for Client B
const clientB = await manager.getOrCreateSession('client_beta');
await clientB.start();

// List all active sessions
const active = manager.listSessions();
console.log('Active sessions:', active);
```

---

### Phone Number Utilities

```typescript
import { normalizePhone, toJID, extractPhoneFromJID, isGroupJID } from '@mlhkinfotech/wa-core';

// Format phone numbers safely
const jid = toJID('+91 98765 43210'); // '919876543210@s.whatsapp.net'
const phone = extractPhoneFromJID(jid); // '919876543210'
const isGroup = isGroupJID('12345-67890@g.us'); // true
```

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `sessionId` | `string` | **Required** | Unique identifier for this session |
| `sessionPath` | `string` | `./sessions/{id}` | Disk path to persist auth credentials |
| `printQRInTerminal` | `boolean` | `true` | Print QR directly to terminal console |
| `maxReconnectAttempts` | `number` | `10` | Max reconnection retries before giving up |
| `reconnectIntervalMs` | `number` | `3000` | Initial reconnect delay in milliseconds |

---

## 📄 License

MIT © [MLHK Infotech](https://github.com/mlhkinfotech)
