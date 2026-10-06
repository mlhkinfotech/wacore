import type {
  Plugin,
  ToolDefinition,
  MessageContext,
  AgentContext,
  AgentResponse
} from '@mlhk/types';
import type { CatalogAdapter, BusinessProfile, CapturedOrder, ProductItem } from './types.js';
import { MemoryCatalogAdapter } from './adapters/memory.js';
import { ProductFormatter } from './formatter.js';
import { OrderWorkflowManager } from './workflow.js';

export interface CatalogPluginOptions {
  adapter?: CatalogAdapter;
  products?: ProductItem[];
  business?: BusinessProfile;
  onOrderPlaced?: (order: CapturedOrder) => Promise<void> | void;
}

export class CatalogPlugin implements Plugin {
  public readonly name = '@mlhk/plugin-catalog';
  public readonly version = '1.0.0';
  public readonly description = 'Universal Business & Product Catalog Plugin';

  private adapter: CatalogAdapter;
  private business: BusinessProfile;
  private workflow: OrderWorkflowManager;
  private onOrderPlaced?: (order: CapturedOrder) => Promise<void> | void;

  constructor(options: CatalogPluginOptions = {}) {
    if (options.adapter) {
      this.adapter = options.adapter;
    } else {
      this.adapter = new MemoryCatalogAdapter(options.products || []);
    }

    this.business = options.business || {
      name: 'Our Business Store',
      currencySymbol: 'Rs.'
    };

    this.workflow = new OrderWorkflowManager();
    this.onOrderPlaced = options.onOrderPlaced;
  }

  public getAdapter(): CatalogAdapter {
    return this.adapter;
  }

  public setBusinessProfile(profile: Partial<BusinessProfile>): void {
    this.business = { ...this.business, ...profile };
  }

  public tools(): ToolDefinition[] {
    return [
      {
        name: 'search_catalog',
        description: 'Search products or services in the catalog by name, category, brand, or price ceiling',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Product or service search term' },
            maxPrice: { type: 'number', description: 'Maximum price ceiling (e.g. 50000)' },
            category: { type: 'string', description: 'Category filter' },
            limit: { type: 'number', description: 'Max results count', default: 5 }
          }
        },
        handler: async (params) => {
          return await this.adapter.search(params);
        }
      },
      {
        name: 'get_business_info',
        description: 'Get store business information such as address, warranty, delivery, returns, and FAQs',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'delivery, warranty, address, payment, or general' }
          }
        },
        handler: async () => {
          return {
            name: this.business.name,
            address: this.business.address,
            phone: this.business.phone,
            delivery: this.business.deliveryInfo,
            warranty: this.business.warrantyInfo,
            returnPolicy: this.business.returnPolicy,
            upiId: this.business.upiId
          };
        }
      }
    ];
  }

  // Intercept messages to handle order flow states
  public async onMessageReceived(ctx: MessageContext): Promise<boolean | void> {
    const state = this.workflow.getOrderState(ctx.from);
    if (!state) return true; // Normal message flow

    const text = ctx.body.trim().toLowerCase();

    // 1. If waiting for address
    if (state.step === 'awaiting_address') {
      const looksLikeQuestion = /\?|kya|kaise|kitna|price|warranty/i.test(text) && text.length < 35;
      if (!looksLikeQuestion && text.length >= 5) {
        this.workflow.setAddress(ctx.from, ctx.body.trim());
        const total = (state.product.price * state.quantity).toLocaleString('en-IN');
        const symbol = this.business.currencySymbol || 'Rs.';

        await ctx.reply(
          `*Order Summary:*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `📦 Item: *${state.product.name}*\n` +
          `💰 Amount: *${symbol}${total}*\n` +
          `📍 Delivery Address: ${ctx.body.trim()}\n` +
          `━━━━━━━━━━━━━━━━━━\n\n` +
          `Kya order confirm karein? (Haan / Na)`
        );
        return false; // Intercepted, no need to call LLM
      }
    }

    // 2. If waiting for final confirmation
    if (state.step === 'awaiting_confirmation') {
      const isYes = /^(haan|yes|ha|haa|ok|okay|confirm|sure|yep|kar do)$/i.test(text);
      const isNo = /^(na|nahi|no|cancel|mat karo)$/i.test(text);

      if (isYes) {
        const order = this.workflow.confirmOrder(ctx.from, ctx.fromName);
        if (order) {
          const total = order.totalAmount.toLocaleString('en-IN');
          const symbol = this.business.currencySymbol || 'Rs.';

          await ctx.reply(
            `🎉 *Order Confirmed!*\n\n` +
            `🧾 *Order ID:* ${order.orderId}\n` +
            `📦 *Product:* ${order.product.name}\n` +
            `💰 *Total:* ${symbol}${total}\n` +
            `📍 *Delivery:* ${order.deliveryAddress}\n\n` +
            `Hamari team aapse jald hi sampark karegi.\n` +
            `Dhanyavaad! 🙏`
          );

          if (this.onOrderPlaced) {
            try {
              await this.onOrderPlaced(order);
            } catch (err: any) {
              console.error('onOrderPlaced handler error:', err.message);
            }
          }
          return false;
        }
      } else if (isNo) {
        this.workflow.cancelOrder(ctx.from);
        await ctx.reply('Koi baat nahi! Order cancel kar diya gaya hai. Kuch aur dekhna ho toh batayein.');
        return false;
      }
    }

    return true;
  }

  // Inject catalog products & business information into AI context
  public async onBeforeAIProcess(ctx: AgentContext): Promise<AgentContext | void> {
    const products = await this.adapter.search({ query: ctx.message, limit: 5 });

    let catalogContext = '';
    if (products.length > 0) {
      catalogContext = ProductFormatter.formatProductList(products, this.business);
    }

    ctx.metadata = {
      ...ctx.metadata,
      storeInfo: {
        businessName: this.business.name,
        address: this.business.address,
        phone: this.business.phone,
        warranty: this.business.warrantyInfo,
        delivery: this.business.deliveryInfo,
        currency: this.business.currencySymbol || 'Rs.'
      },
      catalogProducts: products,
      formattedCatalog: catalogContext
    };

    return ctx;
  }

  // Auto-attach product cards or order start trigger
  public async onAfterAIProcess(ctx: AgentContext, res: AgentResponse): Promise<AgentResponse | void> {
    const products: ProductItem[] = ctx.metadata?.catalogProducts || [];

    if (products.length === 1 && res.intent === 'buy') {
      const p = products[0];
      if (p) {
        // Start order workflow
        this.workflow.startOrder(ctx.contactId, p);
        const card = ProductFormatter.formatProductCard(p, this.business);
        res.reply = `${card}\n\nDelivery address batayein order place karne ke liye:`;
        if (p.imageUrl) {
          res.images = [{ url: p.imageUrl, caption: p.name }];
        }
      }
    }

    return res;
  }
}
