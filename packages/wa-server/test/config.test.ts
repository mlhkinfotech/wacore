import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('Server loadConfig', () => {
  it('should load default configuration when no environment variables are set', () => {
    const config = loadConfig();
    expect(config.port).toBeDefined();
    expect(config.allowedOrigin).toBe('*');
    expect(config.aiProvider).toBe('gemini');
  });

  it('should apply overrides provided programmatically', () => {
    const config = loadConfig({
      port: 8080,
      apiToken: 'super-secret',
      aiModel: 'gemini-1.5-pro'
    });

    expect(config.port).toBe(8080);
    expect(config.apiToken).toBe('super-secret');
    expect(config.aiModel).toBe('gemini-1.5-pro');
  });
});
