export const BUY_KEYWORDS = [
  'khareedna', 'kharidna', 'buy', 'order', 'purchase', 'lena', 'chahiye',
  'price', 'kitna', 'available', 'stock', 'confirm', 'book karo',
  'order karo', 'le lena', 'manga do', 'bhej do', 'rate'
];

export const HANDOFF_KEYWORDS = [
  'human', 'agent', 'person', 'staff', 'manager', 'insaan', 'banda',
  'koi insaan', 'real person', 'connect me', 'call me', 'baat karvao'
];

export const FAQ_KEYWORDS = [
  'warranty', 'return', 'refund', 'delivery', 'emi', 'payment',
  'guarantee', 'wapas', 'kitne din', 'how long', 'kab milega',
  'exchange', 'gst', 'bill', 'timing', 'address', 'location'
];

export const CONFIRM_EXACT = ['haan', 'yes', 'ha', 'haa', 'ok', 'okay', 'done', 'y', 'yep', 'yup', 'sure'];
export const CONFIRM_PHRASES = ['confirm', 'order karo', 'le lena', 'book karo', 'kar do', 'order kar', 'pakka'];

export const isBuyIntent = (message: string): boolean => {
  const lower = message.toLowerCase();
  return BUY_KEYWORDS.some(k => lower.includes(k));
};

export const isHandoffIntent = (message: string, customKeywords: string[] = []): boolean => {
  const lower = message.toLowerCase();
  const allKeywords = [...HANDOFF_KEYWORDS, ...customKeywords];
  return allKeywords.some(k => lower.includes(k));
};

export const isFaqIntent = (message: string): boolean => {
  const lower = message.toLowerCase();
  return FAQ_KEYWORDS.some(k => lower.includes(k));
};

export const isConfirming = (message: string): boolean => {
  const t = message.toLowerCase().trim();
  const words = t.split(/\s+/);
  if (CONFIRM_EXACT.includes(t)) return true;
  if (words.length <= 3 && words.some(w => CONFIRM_EXACT.includes(w))) return true;
  return CONFIRM_PHRASES.some(k => t.includes(k));
};
