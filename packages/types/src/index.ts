/**
 * @telegram-store/types
 * Core domain types and interfaces for Telegram Digital Store Pro
 */

export type Currency = 'USD' | 'KHR';

export type ProductType =
  | 'ebook_pdf'
  | 'software'
  | 'license_key'
  | 'activation_code'
  | 'account'
  | 'course'
  | 'file'
  | 'link'
  | 'subscription';

export type DeliveryMethod =
  | 'instant_license'
  | 'secure_download'
  | 'private_link'
  | 'credentials'
  | 'manual';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED';

export type LicenseStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'ALLOCATED'
  | 'EXPIRED';

export type DeliveryStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface IUser {
  _id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  referralCode: string;
  referredBy?: number;
  totalOrders: number;
  totalSpentUSD: number;
  totalSpentKHR: number;
  isBlocked: boolean;
  role: 'customer' | 'admin' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  priceUSD: number;
  priceKHR: number;
  discountPriceUSD?: number;
  discountPriceKHR?: number;
  categoryId: string;
  category?: ICategory;
  images: string[];
  productType: ProductType;
  deliveryMethod: DeliveryMethod;
  stockQuantity: number;
  isUnlimitedStock: boolean;
  isActive: boolean;
  salesCount: number;
  rating: number;
  digitalAssetId?: string;
  downloadExpiryHours?: number;
  maxDownloadCount?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDigitalAsset {
  _id: string;
  productId: string;
  title: string;
  assetType: 'file' | 'link' | 'credentials' | 'text';
  filePath?: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  secureToken?: string;
  externalUrl?: string;
  accessCredentials?: {
    username?: string;
    password?: string;
    instructions?: string;
  };
  textContent?: string;
  downloadLimit: number;
  downloadCount: number;
  expiresInHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILicenseKey {
  _id: string;
  productId: string;
  orderId?: string;
  licenseKey: string;
  status: LicenseStatus;
  allocatedToTelegramId?: number;
  allocatedAt?: Date;
  reservedAt?: Date;
  reservationExpiresAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  productId: string;
  productName: string;
  productType: ProductType;
  deliveryMethod: DeliveryMethod;
  unitPriceUSD: number;
  unitPriceKHR: number;
  quantity: number;
  subtotalUSD: number;
  subtotalKHR: number;
  allocatedKeys?: string[];
  digitalAssetDownloadUrl?: string;
  deliveredContent?: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  userId: string;
  telegramId: number;
  items: IOrderItem[];
  currency: Currency;
  totalAmount: number;
  discountAmount: number;
  payableAmount: number;
  couponCode?: string;
  status: OrderStatus;
  deliveryStatus: DeliveryStatus;
  paymentId?: string;
  notes?: string;
  expiresAt: Date;
  paidAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  _id: string;
  transactionRef: string;
  orderId: string;
  telegramId: number;
  currency: Currency;
  amount: number;
  paymentMethod: 'KHQR';
  qrString: string;
  md5Hash?: string;
  bakongHash?: string;
  status: PaymentStatus;
  provider: 'BAKONG_KHQR' | 'SANDBOX_KHQR';
  qrExpiresAt: Date;
  paidAt?: Date;
  rawResponse?: Record<string, any>;
  verificationAttempts: number;
  lastCheckedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoupon {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValueUSD: number;
  discountValueKHR: number;
  minOrderUSD?: number;
  minOrderKHR?: number;
  maxDiscountUSD?: number;
  maxDiscountKHR?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDelivery {
  _id: string;
  orderId: string;
  orderNumber: string;
  telegramId: number;
  status: DeliveryStatus;
  items: {
    productId: string;
    productName: string;
    productType: ProductType;
    deliveryMethod: DeliveryMethod;
    deliveredContent: string;
    downloadUrl?: string;
    licenseKeys?: string[];
    expiryDate?: Date;
  }[];
  telegramNotificationSent: boolean;
  attempts: number;
  lastError?: string;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdmin {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  roleId: string;
  roleName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRole {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: string;
  adminId?: string;
  adminEmail?: string;
  telegramId?: number;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface ITelegramSettings {
  _id?: string;
  botToken: string;
  botUsername: string;
  miniAppUrl: string;
  welcomeMessage: string;
  supportContact: string;
  broadcastChannel?: string;
  defaultLanguage: 'en' | 'km';
  isBotActive: boolean;
  autoDeliveryEnabled: boolean;
}

export interface IBakongSettings {
  _id?: string;
  merchantId: string;
  merchantName: string;
  merchantCity: string;
  bakongAccountId: string;
  acquireId?: string;
  apiToken?: string;
  apiUrl: string;
  isSandbox: boolean;
  sandboxMockDelayMs: number;
  pollIntervalSeconds: number;
  qrExpiryMinutes: number;
}

export interface IKHQRGenerateParams {
  transactionRef: string;
  amount: number;
  currency: Currency;
  bakongAccountId: string;
  merchantName: string;
  merchantCity: string;
  expiryMinutes?: number;
  billNumber?: string;
  mobileNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
}

export interface IKHQRVerificationResult {
  isPaid: boolean;
  transactionRef: string;
  bakongHash?: string;
  amount?: number;
  currency?: Currency;
  paidAt?: Date;
  rawResponse?: any;
  message?: string;
}

export interface ICartItem {
  productId: string;
  product?: IProduct;
  quantity: number;
  priceUSD: number;
  priceKHR: number;
}

export interface ICart {
  items: ICartItem[];
  couponCode?: string;
  discountUSD: number;
  discountKHR: number;
  totalUSD: number;
  totalKHR: number;
}
