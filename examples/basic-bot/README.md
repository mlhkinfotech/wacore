# Basic WhatsApp AI Bot Example

A minimal, zero-boilerplate example demonstrating how to run a WhatsApp AI Bot using `@mlhkinfotech/wa-core` and `@mlhkinfotech/ai-agent`.

---

## 🚀 Setup & Run

### 1. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and insert your Gemini API Key:
```env
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
```

### 2. Start the Bot
```bash
pnpm start
# or: node src/index.js
```

### 3. Scan QR Code
Scan the QR code displayed in the terminal using your WhatsApp (Linked Devices).

Send any message to that WhatsApp number — the AI Assistant will respond in real time!
