import crypto from 'crypto';
import type { Currency } from '@telegram-store/types';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'KHR') {
    return `${Math.round(amount).toLocaleString('en-US')} ៛`;
  }
  return `$${amount.toFixed(2)}`;
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${randomStr}`;
}

export function generateTransactionRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TX-${timestamp}-${random}`;
}

export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
