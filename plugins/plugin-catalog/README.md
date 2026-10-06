# @mlhkinfotech/plugin-catalog

[![npm version](https://img.shields.io/npm/v/@mlhkinfotech/plugin-catalog.svg?color=blue)](https://www.npmjs.com/package/@mlhkinfotech/plugin-catalog)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Universal Business & Product Catalog Plugin for the MLHK WhatsApp AI Ecosystem. Enables dynamic product discovery, beautiful WhatsApp card formatting, and interactive conversational order capture for any business (retail, restaurant, clinic, service agency, wholesale).

---

## 🚀 Features

- **Store-Agnostic Architecture**: Works for any business model — not hardcoded to a single POS.
- **Pluggable Adapters**: Comes with `MemoryCatalogAdapter` (in-memory / JSON) and easily extensible to SQL, MongoDB, Shopify, WooCommerce, or UltimatePOS.
- **WhatsApp Card Formatter**: Formats product descriptions into WhatsApp-friendly text blocks with emojis, pricing, stock indicators, and SKU details.
- **Interactive Order & Lead State Machine (`OrderWorkflowManager`)**: Handles multi-step conversational ordering (item selection → quantity → customer address → confirmation).
- **Native AI Tool Provider**: Generates ready-to-use search and catalog tools for `@mlhkinfotech/ai-agent`.

---

## 📦 Installation

```bash
npm install @mlhkinfotech/plugin-catalog
```

---

## 💻 Quick Start

### 1. Setup Business Catalog with In-Memory Adapter

```typescript
import { MemoryCatalogAdapter, CatalogPlugin } from '@mlhkinfotech/plugin-catalog';

const adapter = new MemoryCatalogAdapter({
  id: 'store_101',
  name: 'Balaji Hardware & Electricals',
  currency: 'INR',
  products: [
    {
      id: 'p1',
      name: 'Havells 10W LED Bulb (Cool White)',
      description: 'Energy saving B22 base LED bulb',
      price: 120,
      category: 'Lighting',
      inStock: true,
      stockQuantity: 50,
      tags: ['bulb', 'led', 'havells']
    },
    {
      id: 'p2',
      name: 'Polycab 2.5 sq mm Wire (90m Roll)',
      description: 'FR PVC insulated copper wire',
      price: 2450,
      category: 'Wiring',
      inStock: true,
      stockQuantity: 15,
      tags: ['wire', 'polycab', 'cable']
    }
  ]
});

const plugin = new CatalogPlugin(adapter);
```

---

### 2. Format Products for WhatsApp

```typescript
import { ProductFormatter } from '@mlhkinfotech/plugin-catalog';

const products = await adapter.searchProducts('bulb');
const whatsappMessage = ProductFormatter.formatProductList(products, 'INR');

console.log(whatsappMessage);
/*
Output:
🛍️ *Our Available Products:*

1️⃣ *Havells 10W LED Bulb (Cool White)*
   💵 Price: ₹120
   📦 Status: In Stock (50 available)
   📝 Energy saving B22 base LED bulb

Reply with product name or number to order!
*/
```

---

### 3. Connect to `@mlhkinfotech/ai-agent`

```typescript
import { AIAgent } from '@mlhkinfotech/ai-agent';

const agent = new AIAgent({
  provider: 'gemini',
  apiKey: process.env.GEMINI_API_KEY!
});

// Register catalog search tool with the AI
agent.registerTool(plugin.getSearchTool());
agent.registerTool(plugin.getProductDetailsTool());

// The AI now has direct access to look up products, check stock, and quote prices!
```

---

### 4. Interactive Order & Lead Capture State Machine

```typescript
import { OrderWorkflowManager } from '@mlhkinfotech/plugin-catalog';

const orderManager = new OrderWorkflowManager();

// Customer wants to order
const state = orderManager.startOrder('919876543210', {
  productId: 'p1',
  productName: 'Havells 10W LED Bulb',
  unitPrice: 120,
  quantity: 5
});

console.log(state.step); // 'WAITING_FOR_ADDRESS'
// Prompt customer: "Please share your delivery address & contact number"
```

---

## 📄 License

MIT © [MLHK Infotech](https://github.com/mlhkinfotech)
