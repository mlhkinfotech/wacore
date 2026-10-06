import type { ProductItem, BusinessProfile } from './types.js';

export class ProductFormatter {
  public static formatProductCard(product: ProductItem, business?: BusinessProfile): string {
    const symbol = business?.currencySymbol || product.currency || 'Rs.';
    const formattedPrice = Number(product.price).toLocaleString('en-IN');
    const stockStatus = product.inStock !== false ? 'Available ✅' : 'Out of Stock ❌';

    let card = `*${product.name}*\n`;
    card += `━━━━━━━━━━━━━━━━━━\n`;

    if (product.brand) {
      card += `🏷️ Brand: ${product.brand}\n`;
    }

    card += `💰 Price: *${symbol}${formattedPrice}*\n`;

    if (product.attributes && product.attributes.length > 0) {
      for (const attr of product.attributes) {
        card += `🔹 ${attr.name}: ${attr.value}\n`;
      }
    }

    card += `📦 Status: ${stockStatus}\n`;

    if (business?.warrantyInfo) {
      card += `🛡️ Warranty: ${business.warrantyInfo}\n`;
    }
    if (business?.deliveryInfo) {
      card += `🚚 Delivery: ${business.deliveryInfo}\n`;
    }

    card += `━━━━━━━━━━━━━━━━━━\n`;

    if (product.url) {
      card += `🔗 View/Order: ${product.url}\n`;
    } else if (business?.phone) {
      card += `📞 Contact: +${business.phone}\n`;
    }

    card += `\n💬 *Order karne ke liye "Order karo" ya "Haan" likhein.*`;

    return card;
  }

  public static formatProductList(products: ProductItem[], business?: BusinessProfile): string {
    if (products.length === 0) {
      return 'Maaf kijiye, koi matching product nahi mila.';
    }

    const symbol = business?.currencySymbol || 'Rs.';
    let message = `*Found ${products.length} Products:*\n\n`;

    products.forEach((p, index) => {
      const price = Number(p.price).toLocaleString('en-IN');
      const specs = (p.attributes || []).map(a => `${a.name}: ${a.value}`).join(' | ');

      message += `${index + 1}. *${p.name}*\n`;
      message += `   💰 Price: ${symbol}${price}\n`;
      if (specs) message += `   🔹 ${specs}\n`;
      message += `\n`;
    });

    message += `_Kissi bhi product ka naam likhein details dekhne ya order karne ke liye._`;
    return message;
  }
}
