# @mlhkinfotech/wa-admin

[![npm version](https://img.shields.io/npm/v/@mlhkinfotech/wa-admin.svg?color=blue)](https://www.npmjs.com/package/@mlhkinfotech/wa-admin)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Modern, lightning-fast React 19 + Vite Admin Dashboard and Control Center for the MLHK WhatsApp AI Ecosystem.

---

## 🎨 Screenshots & Features

- **Live QR Code Scanner**: Scan WhatsApp web QR codes visually right in your browser tab without opening the server terminal.
- **Real-Time Live Chat Feed**: Watch incoming customer conversations and bot replies stream live via WebSockets.
- **AI Agent Settings & Persona Config**: Configure LLM provider (Gemini / OpenRouter), model names, temperatures, and custom system prompts in real time.
- **AI Playground & Sandbox**: Test your bot's conversational intelligence, catalog lookups, and answers in an interactive sandbox.
- **Broadcast & Campaign Messenger**: Send formatted broadcasts and promotions to multiple numbers safely.
- **System Health & Logs**: Real-time server uptime, memory usage, and socket status badges.
- **Dark Mode UI**: Sleek, eye-friendly design powered by Tailwind-like CSS styles and Lucide React icons.

---

## 📦 Installation & Setup

### Development Mode

```bash
# Clone the repository
git clone https://github.com/mlhkinfotech/wacore.git
cd wacore

# Install workspace dependencies
pnpm install

# Start the admin dashboard
cd packages/wa-admin
pnpm run dev
```

The dashboard will launch at **`http://localhost:5173`**.

---

### Production Build

```bash
# Build static assets
pnpm run build

# Preview production build locally
pnpm run preview
```

The compiled static assets in `dist/` can be deployed to Vercel, Netlify, Cloudflare Pages, Nginx, or served directly by `@mlhkinfotech/wa-server`.

---

## ⚙️ Environment Variables

Create `.env` in `packages/wa-admin`:

```env
# URL of your MLHK WhatsApp Server
VITE_SERVER_URL=http://localhost:3001

# Optional API bearer token
VITE_API_TOKEN=your-secret-token
```

---

## 📄 License

MIT © [MLHK Infotech](https://github.com/mlhkinfotech)
