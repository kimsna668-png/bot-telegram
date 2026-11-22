import { calculateCRC16, verifyCRC16 } from './crc16.js';
import type { Currency, IKHQRGenerateParams } from '@telegram-store/types';

/**
 * Format TLV (Tag-Length-Value)
 */
export function formatTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export interface IKHQRParsedData {
  isValid: boolean;
  crcValid: boolean;
  payloadFormat?: string;
  pointOfInitiation?: 'static' | 'dynamic';
  bakongAccountId?: string;
  merchantName?: string;
  merchantCity?: string;
  currency?: Currency;
  currencyCode?: string;
  amount?: number;
  billNumber?: string;
  mobileNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
  rawTags: Record<string, string>;
}

/**
 * Generate standard Bakong KHQR String compliant with NBC KHQR standard
 */
export function generateKHQR(params: IKHQRGenerateParams): string {
  const {
    transactionRef,
    amount,
    currency,
    bakongAccountId,
    merchantName,
    merchantCity,
    mobileNumber,
    storeLabel = 'DIGITAL STORE',
    terminalLabel = 'ONLINE-01'
  } = params;

  // Tag 00: Payload Format Indicator (Fixed "01")
  let qr = formatTLV('00', '01');

  // Tag 01: Point of Initiation Method ("12" for Dynamic)
  qr += formatTLV('01', '12');

  // Tag 29: Merchant Account Information (Bakong Account)
  // Sub-tag 00: Global Unique Identifier "bakong@nbc"
  // Sub-tag 01: Bakong Account ID
  const sub29_00 = formatTLV('00', 'bakong@nbc');
  const sub29_01 = formatTLV('01', bakongAccountId);
  const tag29Value = sub29_00 + sub29_01;
  qr += formatTLV('29', tag29Value);

  // Tag 52: Merchant Category Code ("0000" or "5999" for general misc retail)
  qr += formatTLV('52', '0000');

  // Tag 53: Transaction Currency (840 = USD, 116 = KHR)
  const currencyCode = currency === 'KHR' ? '116' : '840';
  qr += formatTLV('53', currencyCode);

  // Tag 54: Transaction Amount
  const formattedAmount = currency === 'KHR' ? Math.round(amount).toString() : amount.toFixed(2);
  qr += formatTLV('54', formattedAmount);

  // Tag 58: Country Code ("KH")
  qr += formatTLV('58', 'KH');

  // Tag 59: Merchant Name
  const cleanMerchantName = (merchantName || 'DIGITAL STORE PRO').substring(0, 25);
  qr += formatTLV('59', cleanMerchantName);

  // Tag 60: Merchant City
  const cleanMerchantCity = (merchantCity || 'Phnom Penh').substring(0, 15);
  qr += formatTLV('60', cleanMerchantCity);

  // Tag 62: Additional Data Field Template
  let sub62 = '';
  // Sub-tag 01: Bill Number / Transaction Reference
  if (transactionRef) {
    sub62 += formatTLV('01', transactionRef.substring(0, 25));
  }
  // Sub-tag 02: Mobile Number
  if (mobileNumber) {
    sub62 += formatTLV('02', mobileNumber.substring(0, 25));
  }
  // Sub-tag 03: Store Label
  if (storeLabel) {
    sub62 += formatTLV('03', storeLabel.substring(0, 25));
  }
  // Sub-tag 07: Terminal Label
  if (terminalLabel) {
    sub62 += formatTLV('07', terminalLabel.substring(0, 25));
  }

  if (sub62.length > 0) {
    qr += formatTLV('62', sub62);
  }

  // Tag 63: Checksum prefix (6304)
  const preChecksum = qr + '6304';
  const checksum = calculateCRC16(preChecksum);

  return preChecksum + checksum;
}

/**
 * Parse and validate KHQR EMVCo string
 */
export function parseKHQR(qrString: string): IKHQRParsedData {
  const result: IKHQRParsedData = {
    isValid: false,
    crcValid: false,
    rawTags: {}
  };

  if (!qrString || typeof qrString !== 'string') return result;

  result.crcValid = verifyCRC16(qrString);

  let index = 0;
  while (index < qrString.length) {
    if (index + 4 > qrString.length) break;
    const tag = qrString.substring(index, index + 2);
    const lengthStr = qrString.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);
    if (isNaN(length) || index + 4 + length > qrString.length) break;

    const value = qrString.substring(index + 4, index + 4 + length);
    result.rawTags[tag] = value;
    index += 4 + length;
  }

  result.payloadFormat = result.rawTags['00'];
  result.pointOfInitiation = result.rawTags['01'] === '12' ? 'dynamic' : 'static';

  // Tag 29: Bakong Merchant Info
  if (result.rawTags['29']) {
    const tag29 = result.rawTags['29'];
    let idx29 = 0;
    while (idx29 < tag29.length) {
      if (idx29 + 4 > tag29.length) break;
      const subTag = tag29.substring(idx29, idx29 + 2);
      const subLen = parseInt(tag29.substring(idx29 + 2, idx29 + 4), 10);
      const subVal = tag29.substring(idx29 + 4, idx29 + 4 + subLen);
      if (subTag === '01') {
        result.bakongAccountId = subVal;
      }
      idx29 += 4 + subLen;
    }
  }

  // Tag 53: Currency
  result.currencyCode = result.rawTags['53'];
  if (result.currencyCode === '840') result.currency = 'USD';
  else if (result.currencyCode === '116') result.currency = 'KHR';

  // Tag 54: Amount
  if (result.rawTags['54']) {
    result.amount = parseFloat(result.rawTags['54']);
  }

  result.merchantName = result.rawTags['59'];
  result.merchantCity = result.rawTags['60'];

  // Tag 62: Additional Data
  if (result.rawTags['62']) {
    const tag62 = result.rawTags['62'];
    let idx62 = 0;
    while (idx62 < tag62.length) {
      if (idx62 + 4 > tag62.length) break;
      const subTag = tag62.substring(idx62, idx62 + 2);
      const subLen = parseInt(tag62.substring(idx62 + 2, idx62 + 4), 10);
      const subVal = tag62.substring(idx62 + 4, idx62 + 4 + subLen);
      if (subTag === '01') result.billNumber = subVal;
      else if (subTag === '02') result.mobileNumber = subVal;
      else if (subTag === '03') result.storeLabel = subVal;
      else if (subTag === '07') result.terminalLabel = subVal;
      idx62 += 4 + subLen;
    }
  }

  result.isValid = Boolean(
    result.crcValid &&
    result.payloadFormat === '01' &&
    result.bakongAccountId &&
    result.currency
  );

  return result;
}
