# @mlhkinfotech/wa-cli

[![npm version](https://img.shields.io/npm/v/@mlhkinfotech/wa-cli.svg?color=blue)](https://www.npmjs.com/package/@mlhkinfotech/wa-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Official Command-Line Interface (CLI) for the MLHK WhatsApp AI Agent Ecosystem. Allows developers and agencies to instantly scaffold client bots, launch servers, and verify local environments.

---

## 📦 Installation

You can run commands without installing via `npx`:

```bash
npx @mlhkinfotech/wa-cli <command>
```

Or install globally on your machine:

```bash
npm install -g @mlhkinfotech/wa-cli
```

Once installed, use either `mlhk-wa` or `wa-cli`:

```bash
mlhk-wa --help
```

---

## 🛠️ Commands

### 1. `create <projectName>`
Scaffold a complete, production-ready WhatsApp AI Agent bot in seconds:

```bash
mlhk-wa create my-pharmacy-bot
```

This generates:
- `package.json` pre-configured with `@mlhkinfotech/*` packages.
- `.env.example` with API key templates.
- `src/index.ts` containing WhatsApp Baileys connection and Gemini AI integration.
- `tsconfig.json` ready for TypeScript compilation.

To run the newly created bot:
```bash
cd my-pharmacy-bot
npm install
npm run dev
```

---

### 2. `start [options]`
Instantly launch the turnkey REST API & WebSocket server with terminal QR codes:

```bash
mlhk-wa start --port 3001 --provider gemini --key YOUR_GEMINI_API_KEY
```

**Options:**
- `-p, --port <port>`: Port to bind (default: `3001`).
- `-t, --token <token>`: Optional security token for protected REST endpoints.
- `--provider <provider>`: AI provider (`gemini` or `openrouter`, default: `gemini`).
- `--key <key>`: AI provider API key.

---

### 3. `doctor`
Verify your system environment, Node.js version, platform, and network readiness:

```bash
mlhk-wa doctor
```

Example Output:
```text
🩺 Checking System Environment:
Node Version: v22.13.0 (Required: >= 20.0.0)
Platform: linux (x64)
Status: Ready to build & run WhatsApp bots!
```

---

## 📄 License

MIT © [MLHK Infotech](https://github.com/mlhkinfotech)
