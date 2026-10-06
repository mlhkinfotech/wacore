import { WhatsAppEngine } from '@mlhkinfotech/wa-core';
import { AIAgent } from '@mlhkinfotech/ai-agent';
import { CatalogPlugin } from '@mlhkinfotech/plugin-catalog';

// 1. Apne Business ka Custom Catalog Define Karein (Laptops, Clothes, Food, Services etc.)
const catalogPlugin = new CatalogPlugin({
  business: {
    name: 'Balaji Tech & Gadgets',
    tagline: 'Best Refurbished & New Laptops in Indore',
    phone: '919893496163',
    address: 'Shop #12, Silver Mall, RNT Marg, Indore',
    city: 'Indore',
    currencySymbol: '₹',
    warrantyInfo: '1 Year Full Replacement Warranty',
    deliveryInfo: 'Indore me Free Same-Day Delivery, All India 2-3 Days',
    upiId: '9893496163@paytm'
  },
  products: [
    {
      id: 101,
      name: 'Lenovo ThinkPad T480',
      brand: 'Lenovo',
      category: 'Laptop',
      price: 21500,
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600',
      attributes: [
        { name: 'Processor', value: 'Intel Core i5 8th Gen' },
        { name: 'RAM/Storage', value: '16GB DDR4 / 512GB NVMe SSD' },
        { name: 'Display', value: '14 inch FHD IPS' },
        { name: 'Condition', value: 'Grade A+ Pristine' }
      ]
    },
    {
      id: 102,
      name: 'Dell Latitude 7490',
      brand: 'Dell',
      category: 'Laptop',
      price: 23000,
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600',
      attributes: [
        { name: 'Processor', value: 'Intel Core i7 8th Gen' },
        { name: 'RAM/Storage', value: '16GB RAM / 512GB SSD' },
        { name: 'Backlit Keyboard', value: 'Yes' },
        { name: 'Condition', value: 'Grade A+' }
      ]
    },
    {
      id: 103,
      name: 'HP EliteBook 840 G5',
      brand: 'HP',
      category: 'Laptop',
      price: 24500,
      inStock: true,
      attributes: [
        { name: 'Processor', value: 'Intel Core i5 8th Gen' },
        { name: 'RAM/Storage', value: '16GB / 256GB SSD' },
        { name: 'Body', value: 'Pure Aluminium Silver' }
      ]
    }
  ],
  onOrderPlaced: (order) => {
    console.log(`\n🎉 NAYA ORDER MILA!`);
    console.log(`Order ID: ${order.orderId}`);
    console.log(`Customer: ${order.customerName} (${order.customerPhone})`);
    console.log(`Product: ${order.product.name} - ₹${order.totalAmount}`);
    console.log(`Address: ${order.deliveryAddress}\n`);
    // Yahan aap apne CRM, Database ya Shop Owner ko SMS/WhatsApp alert bhej sakte hain!
  }
});

// 2. AI Agent Initialize Karein
const agent = new AIAgent({
  provider: (process.env.AI_PROVIDER || 'gemini'),
  apiKey: process.env.AI_API_KEY || '',
  model: process.env.AI_MODEL || 'gemini-2.0-flash',
  systemPrompt: `Aap Balaji Tech ke smart aur friendly sales assistant ho.
Customers ko unke budget ke hisab se laptops recommend karo.
Prices hamesha ₹ me batao. Baat polite Hinglish me karo.`,
  temperature: 0.7,
  features: {
    typingIndicator: true,
    humanHandoff: true
  }
});

// 3. WhatsApp Engine Initialize & Plugin Hook Karein
const bot = new WhatsAppEngine({
  sessionId: 'balaji-store',
  sessionPath: './data/session-balaji'
});

bot.use(catalogPlugin);

// 4. Handle Incoming Messages
bot.on('message', async (ctx) => {
  console.log(`📩 Message: "${ctx.body}" from ${ctx.fromName}`);

  await ctx.sendPresence('composing');

  // Let AI Agent process with Catalog integration
  const response = await agent.process({
    contactId: ctx.from,
    contactName: ctx.fromName,
    message: ctx.body
  });

  await ctx.sendPresence('paused');

  if (response.reply) {
    await ctx.reply(response.reply);
  }

  // Agar product image attach hai, toh image bhi send karo
  if (response.images && response.images.length > 0) {
    for (const img of response.images) {
      await ctx.replyWithImage(img.url, img.caption);
    }
  }
});

console.log('🚀 Balaji Tech WhatsApp AI Assistant Starting...');
await bot.start();
