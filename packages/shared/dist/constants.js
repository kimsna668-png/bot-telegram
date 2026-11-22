"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BAKONG_CONFIG = exports.PAYMENT_STATUSES = exports.ORDER_STATUSES = exports.DELIVERY_METHODS = exports.PRODUCT_TYPES = exports.USD_TO_KHR_RATE = exports.CURRENCIES = void 0;
exports.CURRENCIES = {
    USD: 'USD',
    KHR: 'KHR'
};
exports.USD_TO_KHR_RATE = 4100;
exports.PRODUCT_TYPES = {
    EBOOK_PDF: 'ebook_pdf',
    SOFTWARE: 'software',
    LICENSE_KEY: 'license_key',
    ACTIVATION_CODE: 'activation_code',
    ACCOUNT: 'account',
    COURSE: 'course',
    FILE: 'file',
    LINK: 'link',
    SUBSCRIPTION: 'subscription'
};
exports.DELIVERY_METHODS = {
    INSTANT_LICENSE: 'instant_license',
    SECURE_DOWNLOAD: 'secure_download',
    PRIVATE_LINK: 'private_link',
    CREDENTIALS: 'credentials',
    MANUAL: 'manual'
};
exports.ORDER_STATUSES = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
    REFUNDED: 'REFUNDED'
};
exports.PAYMENT_STATUSES = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    EXPIRED: 'EXPIRED'
};
exports.DEFAULT_BAKONG_CONFIG = {
    BAKONG_ACCOUNT_ID: 'devb_retail@devb',
    MERCHANT_NAME: 'DIGITAL STORE PRO',
    MERCHANT_CITY: 'Phnom Penh',
    CURRENCY: 'USD',
    QR_EXPIRY_MINUTES: 15,
    POLL_INTERVAL_SECONDS: 3
};
//# sourceMappingURL=constants.js.map