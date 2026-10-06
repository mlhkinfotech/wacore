import { describe, it, expect } from 'vitest';
import { normalizePhone, toJID, extractPhoneFromJID, isGroupJID } from '../src/utils/phone.js';

describe('Phone & JID Utilities', () => {
  it('should normalize a 10-digit Indian phone number with 91 prefix', () => {
    expect(normalizePhone('9876543210')).toBe('919876543210');
    expect(normalizePhone('+91 98765 43210')).toBe('919876543210');
  });

  it('should remove leading zero from phone numbers', () => {
    expect(normalizePhone('09876543210')).toBe('919876543210');
  });

  it('should convert raw phone string to WhatsApp JID', () => {
    expect(toJID('9876543210')).toBe('919876543210@s.whatsapp.net');
    expect(toJID('919876543210@s.whatsapp.net')).toBe('919876543210@s.whatsapp.net');
    expect(toJID('12345678-group@g.us')).toBe('12345678-group@g.us');
  });

  it('should extract plain phone number from JID', () => {
    expect(extractPhoneFromJID('919876543210@s.whatsapp.net')).toBe('919876543210');
  });

  it('should correctly identify group JIDs', () => {
    expect(isGroupJID('12345678@g.us')).toBe(true);
    expect(isGroupJID('919876543210@s.whatsapp.net')).toBe(false);
  });
});
