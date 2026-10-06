export interface ProductAttribute {
  name: string;   // e.g. "RAM", "Size", "Color", "Processor"
  value: string;  // e.g. "16GB", "XL", "Black", "i7 12th Gen"
}

export interface ProductItem {
  id: string | number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  brand?: string;
  price: number;
  currency?: string;       // Default: "Rs." or "₹"
  inStock?: boolean;
  stockQty?: number;
  imageUrl?: string;
  images?: string[];
  url?: string;            // Direct purchase / web link
  attributes?: ProductAttribute[];
  customFields?: Record<string, any>;
}

export interface BusinessProfile {
  name: string;
  tagline?: string;
  phone?: string;
  address?: string;
  city?: string;
  upiId?: string;
  currencySymbol?: string; // Default: "Rs."
  deliveryInfo?: string;   // e.g. "Same-day delivery locally, 2-3 days outside"
  returnPolicy?: string;   // e.g. "7 days replacement"
  warrantyInfo?: string;   // e.g. "1 year seller warranty"
  customFaqs?: Array<{ question: string; answer: string }>;
}

export interface ProductSearchParams {
  query?: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  minPrice?: number;
  limit?: number;
}

export interface CatalogAdapter {
  search(params: ProductSearchParams): Promise<ProductItem[]>;
  findById(id: string | number): Promise<ProductItem | null>;
  findByName(name: string): Promise<ProductItem | null>;
  getAll(limit?: number): Promise<ProductItem[]>;
  count(): Promise<number>;
}

export interface CapturedOrder {
  orderId: string;
  customerPhone: string;
  customerName?: string;
  product: ProductItem;
  quantity: number;
  totalAmount: number;
  deliveryAddress: string;
  createdAt: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
}
