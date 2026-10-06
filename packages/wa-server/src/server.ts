import express, { type Express } from 'express';
import cors from 'cors';
import { createServer, type Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WhatsAppEngine } from '@mlhk/wa-core';
import { AIAgent } from '@mlhk/ai-agent';
import { loadConfig, type ServerConfig } from './config.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { NotificationQueue } from './notifications/queue.js';
import { createWhatsAppRoutes } from './routes/whatsapp.js';
import { createAgentRoutes } from './routes/agent.js';
import { createWebhookRoutes } from './routes/webhook.js';

export interface WAServerInstance {
  app: Express;
  httpServer: HttpServer;
  io: SocketIOServer;
  engine: WhatsAppEngine;
  agent: AIAgent;
  queue: NotificationQueue;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export const createWAServer = (configOverrides: Partial<ServerConfig> = {}): WAServerInstance => {
  const config = loadConfig(configOverrides);

  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: config.allowedOrigin, methods: ['GET', 'POST'] }
  });

  // 1. Core Engines
  const engine = new WhatsAppEngine({ sessionPath: config.sessionPath });
  const agent = new AIAgent({
    provider: config.aiProvider,
    apiKey: config.aiApiKey,
    model: config.aiModel,
    systemPrompt: config.systemPrompt
  });
  const queue = new NotificationQueue(engine);

  // 2. Middlewares
  app.use(cors({ origin: config.allowedOrigin }));
  app.use(express.json({ limit: '512kb' }));
  app.use(createRateLimiter({ windowMs: 60000, max: 120 }));

  const auth = createAuthMiddleware(config.apiToken);

  // 3. Health Check (Public)
  app.get('/', (_req, res) => {
    res.json({
      service: 'MLHK WhatsApp AI Server',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString()
    });
  });

  // 4. API Routes (Auth Protected)
  app.use('/api/whatsapp', auth, createWhatsAppRoutes(engine, queue));
  app.use('/api/agent', auth, createAgentRoutes(agent));
  app.use('/webhook', auth, createWebhookRoutes(queue));

  // 5. WhatsApp to Socket.IO & AI Processing Pipeline
  engine.sessions.on('qr', (data) => io.emit('whatsapp:qr', data));
  engine.sessions.on('status', (data) => io.emit('whatsapp:status', data));
  engine.sessions.on('ready', (data) => io.emit('whatsapp:ready', data));
  engine.sessions.on('disconnected', (data) => io.emit('whatsapp:disconnected', data));

  engine.on('message', async (ctx) => {
    io.emit('whatsapp:message', {
      from: ctx.from,
      fromName: ctx.fromName,
      body: ctx.body,
      timestamp: ctx.timestamp
    });

    // Auto-reply via AI Agent
    try {
      await ctx.sendPresence('composing');
      const response = await agent.process({
        contactId: ctx.from,
        contactName: ctx.fromName,
        message: ctx.body,
        media: ctx.media
      });
      await ctx.sendPresence('paused');

      if (response.reply) {
        await ctx.reply(response.reply);
        io.emit('whatsapp:reply', {
          to: ctx.from,
          reply: response.reply,
          isAI: true
        });
      }

      if (response.images && response.images.length > 0) {
        for (const img of response.images) {
          await ctx.replyWithImage(img.url, img.caption);
        }
      }
    } catch (err: any) {
      console.error('AI message handling error:', err.message);
    }
  });

  // 6. Socket.IO Connection Handler
  io.on('connection', (socket) => {
    // Send initial status on connect
    socket.emit('whatsapp:sessions', engine.getAllStates());
  });

  // 7. Lifecycle methods
  const start = async (): Promise<void> => {
    queue.startProcessor(4000);

    return new Promise((resolve) => {
      httpServer.listen(config.port, () => {
        console.log(`
╔══════════════════════════════════════════════╗
║  🟢 MLHK WhatsApp AI Server                 ║
║  Port: ${config.port}                                 ║
║  API: http://localhost:${config.port}/api/whatsapp    ║
║  AI Provider: ${config.aiProvider}                       ║
╚══════════════════════════════════════════════╝
        `);
        resolve();
      });
    });
  };

  const stop = async (): Promise<void> => {
    queue.stopProcessor();
    await engine.stop();
    return new Promise((resolve) => {
      httpServer.close(() => resolve());
    });
  };

  return {
    app,
    httpServer,
    io,
    engine,
    agent,
    queue,
    start,
    stop
  };
};
