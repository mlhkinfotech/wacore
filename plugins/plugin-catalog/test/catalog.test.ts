import { describe, it, expect } from 'vitest';
import { MemoryCatalogAdapter } from '../src/adapters/memory.js';
import { ProductFormatter } from '../src/formatter.js';
import { OrderWorkflowManager } from '../src/workflow.js';

describe('MemoryCatalogAdapter', () => {
  const adapter = new MemoryCatalogAdapter([
    {
      id: '1',
      name: 'Wireless Mouse',
      price: 499,
      category: 'Accessories',
      inStock: true,
      tags: ['mouse', 'wireless']
    },
    {
      id: '2',
      name: 'Mechanical Keyboard',
      price: 2499,
      category: 'Accessories',
      inStock: false,
      tags: ['keyboard']
    }
  ]);

  it('should search products by query keyword', async () => {
    const results = await adapter.search({ query: 'mouse' });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Wireless Mouse');
  });

  it('should filter products by category', async () => {
    const results = await adapter.search({ category: 'Accessories' });
    expect(results.length).toBe(2);
  });

  it('should get product by id', async () => {
    const product = await adapter.findById('1');
    expect(product).toBeDefined();
    expect(product?.price).toBe(499);
  });
});

describe('ProductFormatter', () => {
  it('should generate a formatted WhatsApp card string', () => {
    const card = ProductFormatter.formatProductCard(
      {
        id: '1',
        name: 'Smart Watch',
        price: 1999,
        inStock: true,
        brand: 'Noise'
      },
      {
        name: 'Gadget World',
        currencySymbol: '₹'
      }
    );

    expect(card).toContain('*Smart Watch*');
    expect(card).toContain('🏷️ Brand: Noise');
    expect(card).toContain('₹1,999');
    expect(card).toContain('Available ✅');
  });
});

describe('OrderWorkflowManager', () => {
  it('should step through order stages', () => {
    const manager = new OrderWorkflowManager();
    const state = manager.startOrder('user-1', {
      id: '1',
      name: 'Smart Watch',
      price: 1999,
      inStock: true
    }, 2);

    expect(state.step).toBe('awaiting_address');
    expect(state.quantity).toBe(2);

    const addressState = manager.setAddress('user-1', '123 MG Road, Bengaluru');
    expect(addressState?.deliveryAddress).toBe('123 MG Road, Bengaluru');
    expect(addressState?.step).toBe('awaiting_confirmation');

    const confirmed = manager.confirmOrder('user-1', 'Rahul');
    expect(confirmed).toBeDefined();
    expect(confirmed?.totalAmount).toBe(3998);
    expect(confirmed?.status).toBe('confirmed');
  });
});
