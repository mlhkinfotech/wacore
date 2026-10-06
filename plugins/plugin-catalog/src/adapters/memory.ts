import type { CatalogAdapter, ProductItem, ProductSearchParams } from '../types.js';

export class MemoryCatalogAdapter implements CatalogAdapter {
  private products: ProductItem[] = [];

  constructor(initialProducts: ProductItem[] = []) {
    this.products = initialProducts;
  }

  public setProducts(items: ProductItem[]): void {
    this.products = items;
  }

  public addProduct(item: ProductItem): void {
    this.products.push(item);
  }

  public async search(params: ProductSearchParams): Promise<ProductItem[]> {
    const { query = '', category, brand, maxPrice, minPrice, limit = 5 } = params;
    const lowerQ = query.toLowerCase().trim();
    const stopWords = ['ka', 'ki', 'ke', 'hai', 'kya', 'mujhe', 'chahiye', 'price', 'kitna', 'show', 'dikhao', 'wale', 'wala', 'wali', 'me', 'in', 'the', 'is', 'for'];
    const queryTokens = lowerQ
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.includes(w) && !/^\d+$/.test(w));

    let matched = this.products.filter(item => {
      // 1. Price filters
      if (maxPrice !== undefined && item.price > maxPrice) return false;
      if (minPrice !== undefined && item.price < minPrice) return false;

      // 2. Category & Brand filter
      if (category && item.category && !item.category.toLowerCase().includes(category.toLowerCase())) return false;
      if (brand && item.brand && !item.brand.toLowerCase().includes(brand.toLowerCase())) return false;

      // 3. Keyword search
      if (queryTokens.length === 0) return true;

      const searchableText = [
        item.name,
        item.description || '',
        item.brand || '',
        item.category || '',
        item.sku || '',
        ...(item.attributes || []).map(a => `${a.name} ${a.value}`)
      ].join(' ').toLowerCase();

      // Check if any query token matches
      return queryTokens.some(token => searchableText.includes(token));
    });

    // Sort by relevance (exact name matches first, then price)
    matched.sort((a, b) => {
      const aNameMatch = lowerQ && a.name.toLowerCase().includes(lowerQ) ? 1 : 0;
      const bNameMatch = lowerQ && b.name.toLowerCase().includes(lowerQ) ? 1 : 0;
      return bNameMatch - aNameMatch;
    });

    return matched.slice(0, limit);
  }

  public async findById(id: string | number): Promise<ProductItem | null> {
    const item = this.products.find(p => String(p.id) === String(id));
    return item || null;
  }

  public async findByName(name: string): Promise<ProductItem | null> {
    const lower = name.toLowerCase().trim();
    const exact = this.products.find(p => p.name.toLowerCase() === lower);
    if (exact) return exact;

    const partial = this.products.find(p => p.name.toLowerCase().includes(lower));
    return partial || null;
  }

  public async getAll(limit = 50): Promise<ProductItem[]> {
    return this.products.slice(0, limit);
  }

  public async count(): Promise<number> {
    return this.products.length;
  }
}
