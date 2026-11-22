export const CURRENCIES = {
  USD: 'USD',
  KHR: 'KHR'
} as const;

export const USD_TO_KHR_RATE = 4100;

export const PRODUCT_TYPES = {
  EBOOK_PDF: 'ebook_pdf',
  SOFTWARE: 'software',
  LICENSE_KEY: 'license_key',
  ACTIVATION_CODE: 'activation_code',
  ACCOUNT: 'account',
  COURSE: 'course',
  FILE: 'file',
  LINK: 'link',
  SUBSCRIPTION: 'subscription'
} as const;

export const DELIVERY_METHODS = {
  INSTANT_LICENSE: 'instant_license',
  SECURE_DOWNLOAD: 'secure_download',
  PRIVATE_LINK: 'private_link',
  CREDENTIALS: 'credentials',
  MANUAL: 'manual'
} as const;

export const ORDER_STATUSES = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED'
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED'
} as const;

export const DEFAULT_BAKONG_CONFIG = {
  BAKONG_ACCOUNT_ID: 'devb_retail@devb',
  MERCHANT_NAME: 'DIGITAL STORE PRO',
  MERCHANT_CITY: 'Phnom Penh',
  CURRENCY: 'USD',
  QR_EXPIRY_MINUTES: 15,
  POLL_INTERVAL_SECONDS: 3
} as const;
