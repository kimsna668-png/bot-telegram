"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.generateOrderNumber = generateOrderNumber;
exports.generateTransactionRef = generateTransactionRef;
exports.generateSecureToken = generateSecureToken;
exports.slugify = slugify;
const crypto_1 = __importDefault(require("crypto"));
function formatCurrency(amount, currency) {
    if (currency === 'KHR') {
        return `${Math.round(amount).toLocaleString('en-US')} ៛`;
    }
    return `$${amount.toFixed(2)}`;
}
function generateOrderNumber() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
}
function generateTransactionRef() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
    return `TX-${timestamp}-${random}`;
}
function generateSecureToken(bytes = 32) {
    return crypto_1.default.randomBytes(bytes).toString('hex');
}
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}
//# sourceMappingURL=utils.js.map