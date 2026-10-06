import { Router } from 'express';
import type { AIAgent } from '@mlhkinfotech/ai-agent';

export const createAgentRoutes = (agent: AIAgent): Router => {
  const router = Router();

  // Get AI settings
  router.get('/settings', (_req, res) => {
    const config = agent.getConfig();
    // Mask sensitive API Key
    const safeKey = config.apiKey && config.apiKey.length > 8
      ? config.apiKey.slice(0, 4) + '****' + config.apiKey.slice(-4)
      : '****';

    res.json({
      ...config,
      apiKey: safeKey
    });
  });

  // Update AI settings
  router.put('/settings', (req, res) => {
    const { systemPrompt, temperature, maxTokens, model, provider, apiKey } = req.body;
    const updates: any = {};

    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    if (temperature !== undefined) updates.temperature = parseFloat(temperature);
    if (maxTokens !== undefined) updates.maxTokens = parseInt(maxTokens);
    if (model !== undefined) updates.model = model;
    if (provider !== undefined) updates.provider = provider;
    if (apiKey && !apiKey.includes('****')) updates.apiKey = apiKey;

    agent.updateConfig(updates);
    res.json({ success: true, message: 'AI Agent settings updated successfully.' });
  });

  // Test AI processing without WhatsApp
  router.post('/test', async (req, res) => {
    const { message, contactName = 'Admin Tester' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    try {
      const response = await agent.process({
        contactId: 'admin-test',
        contactName,
        message
      });
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get contact conversation memory
  router.get('/memory/:contactId', (req, res) => {
    const history = agent.memory.getHistory(req.params.contactId);
    res.json(history);
  });

  // Clear contact memory
  router.delete('/memory/:contactId', (req, res) => {
    agent.memory.clear(req.params.contactId);
    res.json({ success: true, message: `Memory cleared for contact ${req.params.contactId}` });
  });

  return router;
};
