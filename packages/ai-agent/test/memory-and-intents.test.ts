import { describe, it, expect } from 'vitest';
import { MemoryManager } from '../src/memory/manager.js';
import { isBuyIntent, isHandoffIntent, isFaqIntent, isConfirming } from '../src/intents/detector.js';

describe('MemoryManager', () => {
  it('should store and retrieve conversation history', () => {
    const memory = new MemoryManager(5);
    memory.addEntry('contact-1', 'user', 'Hello');
    memory.addEntry('contact-1', 'assistant', 'Hi! How can I help?');

    const history = memory.getHistory('contact-1');
    expect(history.length).toBe(2);
    expect(history[0].content).toBe('Hello');
    expect(history[1].content).toBe('Hi! How can I help?');
  });

  it('should auto-trim history when exceeding maxEntries', () => {
    const memory = new MemoryManager(3);
    for (let i = 1; i <= 5; i++) {
      memory.addEntry('contact-1', 'user', `Msg ${i}`);
    }

    const history = memory.getHistory('contact-1');
    expect(history.length).toBe(3);
    expect(history[0].content).toBe('Msg 3');
    expect(history[2].content).toBe('Msg 5');
  });

  it('should clear memory for a contact', () => {
    const memory = new MemoryManager();
    memory.addEntry('contact-1', 'user', 'Test');
    memory.clear('contact-1');
    expect(memory.getHistory('contact-1').length).toBe(0);
  });
});

describe('Intent Detection', () => {
  it('should detect buy/purchase intent in English and Hindi', () => {
    expect(isBuyIntent('I want to buy a laptop')).toBe(true);
    expect(isBuyIntent('Mujhe ye phone khareedna hai')).toBe(true);
    expect(isBuyIntent('Just checking weather')).toBe(false);
  });

  it('should detect human handoff intent', () => {
    expect(isHandoffIntent('Connect me to a human agent')).toBe(true);
    expect(isHandoffIntent('Kisi insaan se baat karvao')).toBe(true);
    expect(isHandoffIntent('Show me prices')).toBe(false);
  });

  it('should detect FAQ intent', () => {
    expect(isFaqIntent('What is the warranty policy?')).toBe(true);
    expect(isFaqIntent('Item kab milega delivery kitne din me hogi?')).toBe(true);
  });

  it('should detect confirmation intent', () => {
    expect(isConfirming('yes')).toBe(true);
    expect(isConfirming('haan pakka book karo')).toBe(true);
    expect(isConfirming('nahin mat karo')).toBe(false);
  });
});
