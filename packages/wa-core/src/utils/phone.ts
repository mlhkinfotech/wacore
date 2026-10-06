/**
 * Phone number normalization utilities for WhatsApp
 */

export const normalizePhone = (phone: string): string => {
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  // Default to India (91) if 10 digits
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

export const toJID = (phone: string): string => {
  const p = String(phone).trim();
  if (p.endsWith('@s.whatsapp.net') || p.endsWith('@g.us') || p.endsWith('@lid')) {
    return p;
  }
  const clean = normalizePhone(p);
  return `${clean}@s.whatsapp.net`;
};

export const extractPhoneFromJID = (jid: string): string => {
  const cleaned = jid.replace('@s.whatsapp.net', '').replace('@lid', '').replace('@g.us', '');
  return cleaned.replace(/[^0-9]/g, '');
};

export const isGroupJID = (jid: string): boolean => {
  return jid.endsWith('@g.us');
};
