import { Router } from 'express';
import type { WhatsAppEngine } from '@mlhkinfotech/wa-core';
import type { NotificationQueue } from '../notifications/queue.js';

export const createWhatsAppRoutes = (engine: WhatsAppEngine, queue: NotificationQueue): Router => {
  const router = Router();

  // Get current status & QR
  router.get('/status', (req, res) => {
    const sessionId = (req.query.sessionId as string) || 'default';
    const state = engine.getState(sessionId);
    res.json(state || { status: 'disconnected', id: sessionId });
  });

  // Get all active sessions
  router.get('/sessions', (_req, res) => {
    res.json(engine.getAllStates());
  });

  // Connect session
  router.post('/connect', async (req, res) => {
    const sessionId = req.body.sessionId || 'default';
    try {
      await engine.start(sessionId);
      res.json({ success: true, message: `Session ${sessionId} connecting...` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Disconnect session
  router.post('/disconnect', async (req, res) => {
    const sessionId = req.body.sessionId || 'default';
    try {
      await engine.stop(sessionId);
      res.json({ success: true, message: `Session ${sessionId} disconnected.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Send message
  router.post('/send', async (req, res) => {
    const { phone, message, sessionId = 'default' } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    try {
      const result = await engine.sendText(phone, message, sessionId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Send Image
  router.post('/send-image', async (req, res) => {
    const { phone, image, caption, sessionId = 'default' } = req.body;
    if (!phone || !image) {
      return res.status(400).json({ error: 'phone and image (url or base64) are required' });
    }

    try {
      const result = await engine.sendImage(phone, image, caption, sessionId);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Broadcast messages via queue
  router.post('/broadcast', (req, res) => {
    const { phones, message, type = 'broadcast' } = req.body;
    if (!phones || !Array.isArray(phones) || !message) {
      return res.status(400).json({ error: 'phones (array) and message are required' });
    }

    let queuedCount = 0;
    for (const phone of phones) {
      if (phone) {
        queue.enqueue(phone, message, type);
        queuedCount++;
      }
    }

    res.json({
      success: true,
      queued: queuedCount,
      message: `${queuedCount} messages successfully queued for delivery.`
    });
  });

  // Notification queue stats
  router.get('/notifications/stats', (_req, res) => {
    res.json(queue.getStats());
  });

  return router;
};
