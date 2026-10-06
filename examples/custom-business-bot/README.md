# Custom Business Catalog WhatsApp AI Bot Example

Demonstrates a full commercial implementation of an AI Sales & Support Concierge for a retail store (*Balaji Smart Tech Store*).

---

## 🌟 Key Capabilities
- **Integrated Product Catalog**: Uses `@mlhkinfotech/plugin-catalog` with categorized products, live stock counts, and prices.
- **Natural Language Inquiry**: Customers can ask questions like *"Do you have mechanical keyboards under 3000?"* or *"What wireless earbuds do you recommend?"*
- **Automatic WhatsApp Formatting**: Returns formatted product lists with emojis and pricing.
- **Conversational Lead/Order Collection**: Steps customers through ordering items.

---

## 🚀 Setup & Run

### 1. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and insert your Gemini API Key:
```env
AI_PROVIDER=gemini
AI_API_KEY=your_gemini_api_key_here
```

### 2. Start the Bot
```bash
pnpm start
# or: node src/index.js
```

### 3. Scan QR Code
Scan the QR code with WhatsApp, then message your bot to test product lookups and catalog queries.
