# @mlhkinfotech/wa-server

[![npm version](https://img.shields.io/npm/v/@mlhkinfotech/wa-server.svg?color=blue)](https://www.npmjs.com/package/@mlhkinfotech/wa-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Turnkey, production-grade REST API and WebSocket Server for the MLHK WhatsApp AI Ecosystem. Includes rate-limiting, bearer token security, multi-session management, live Socket.IO events, and a reliable notification queuing system.

---

## 🚀 Features

- **RESTful API**: Endpoints for sending messages, checking bot status, session control, and broadcasts.
- **Real-time WebSockets (Socket.IO)**: Live feeds for QR code generation, incoming WhatsApp chats, session connection state, and server telemetry.
- **Asynchronous Notification Queue (`NotificationQueue`)**: Priority-based background delivery queue with retries and delay spacing to prevent WhatsApp rate limits.
- **Security & Multi-Tenant**: Configurable API tokens (`API_SECRET_TOKEN`), CORS whitelist, and request rate limiting.
- **Docker-Ready**: Comes with production `Dockerfile` and `docker-compose.yml`.

---

## 📦 Installation

```bash
# Direct npm package
npm install @mlhkinfotech/wa-server

# Or run instantly via npx
npx @mlhkinfotech/wa-server
```

---

## 💻 Quick Start

### Embedded in Node.js

```typescript
import { createWAServer } from '@mlhkinfotech/wa-server';

const server = createWAServer({
  port: 3001,
  apiSecret: 'your-secure-secret-token',
  sessionDir: './sessions'
});

await server.start();
console.log('MLHK WhatsApp Server listening on port 3001');
```

---

## 🌐 REST API Endpoints

All protected endpoints accept header: `Authorization: Bearer <API_SECRET_TOKEN>`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health, uptime, and system status |
| `GET` | `/api/status` | Current WhatsApp connection status & session details |
| `GET` | `/api/qr` | Latest QR code in Data URL (image) and raw text |
| `POST` | `/api/send` | Send a text message to a specific phone number or group |
| `POST` | `/api/broadcast` | Broadcast message to multiple recipients with safe pacing |
| `POST` | `/api/notifications/queue` | Add a message to asynchronous delivery queue |
| `GET` | `/api/sessions` | List all managed sessions |
| `POST` | `/api/sessions/:id/restart` | Restart a specific WhatsApp session |

### Example: Send Message via cURL
```bash
curl -X POST http://localhost:3001/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-secret-token" \
  -d '{
    "to": "919876543210",
    "text": "Hello! Your invoice #INV-2024 is ready."
  }'
```

---

## 🔌 Real-Time WebSocket Events (Socket.IO)

Connect from any frontend dashboard (e.g., React, Vue, Mobile):

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: { token: 'my-secret-token' }
});

// Real-time QR Code
socket.on('wa:qr', ({ qrDataUrl }) => {
  document.getElementById('qr-img').src = qrDataUrl;
});

// WhatsApp Connected
socket.on('wa:ready', (data) => {
  console.log('Bot ready:', data);
});

// Live incoming/outgoing chat messages
socket.on('wa:message', (message) => {
  console.log('New message:', message);
});
```

---

## 🐳 Docker Deployment

Run with Docker Compose:

```yaml
version: '3.8'
services:
  wa-server:
    image: node:22-alpine
    working_dir: /app
    command: npx @mlhkinfotech/wa-server
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - API_SECRET_TOKEN=my-secret-token
      - AI_PROVIDER=gemini
      - GEMINI_API_KEY=your-api-key
    volumes:
      - ./sessions:/app/sessions
```

---

## 📄 License

MIT © [MLHK Infotech](https://github.com/mlhkinfotech)
