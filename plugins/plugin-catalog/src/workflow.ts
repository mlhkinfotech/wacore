import type { ProductItem, CapturedOrder, BusinessProfile } from './types.js';

export interface OrderState {
  contactId: string;
  step: 'awaiting_address' | 'awaiting_confirmation';
  product: ProductItem;
  quantity: number;
  deliveryAddress?: string;
  updatedAt: Date;
}

export class OrderWorkflowManager {
  private activeOrders: Map<string, OrderState> = new Map();
  private orderCounter = 1000;

  public startOrder(contactId: string, product: ProductItem, quantity = 1): OrderState {
    const state: OrderState = {
      contactId,
      step: 'awaiting_address',
      product,
      quantity,
      updatedAt: new Date()
    };
    this.activeOrders.set(contactId, state);
    return state;
  }

  public getOrderState(contactId: string): OrderState | undefined {
    const state = this.activeOrders.get(contactId);
    if (!state) return undefined;

    // 30 min state timeout
    const ageMs = Date.now() - state.updatedAt.getTime();
    if (ageMs > 30 * 60 * 1000) {
      this.activeOrders.delete(contactId);
      return undefined;
    }
    return state;
  }

  public setAddress(contactId: string, address: string): OrderState | undefined {
    const state = this.getOrderState(contactId);
    if (!state) return undefined;

    state.deliveryAddress = address;
    state.step = 'awaiting_confirmation';
    state.updatedAt = new Date();
    return state;
  }

  public confirmOrder(contactId: string, customerName?: string): CapturedOrder | undefined {
    const state = this.getOrderState(contactId);
    if (!state || !state.deliveryAddress) return undefined;

    this.orderCounter++;
    const orderId = `ORD-${Date.now().toString().slice(-4)}-${this.orderCounter}`;

    const captured: CapturedOrder = {
      orderId,
      customerPhone: contactId.replace(/[^0-9]/g, ''),
      customerName: customerName || 'WhatsApp Customer',
      product: state.product,
      quantity: state.quantity,
      totalAmount: state.product.price * state.quantity,
      deliveryAddress: state.deliveryAddress,
      createdAt: new Date(),
      status: 'confirmed'
    };

    this.activeOrders.delete(contactId);
    return captured;
  }

  public cancelOrder(contactId: string): void {
    this.activeOrders.delete(contactId);
  }
}
