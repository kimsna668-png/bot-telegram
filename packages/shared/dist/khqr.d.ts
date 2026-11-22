import type { Currency, IKHQRGenerateParams } from '@telegram-store/types';
/**
 * Format TLV (Tag-Length-Value)
 */
export declare function formatTLV(tag: string, value: string): string;
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
export declare function generateKHQR(params: IKHQRGenerateParams): string;
/**
 * Parse and validate KHQR EMVCo string
 */
export declare function parseKHQR(qrString: string): IKHQRParsedData;
//# sourceMappingURL=khqr.d.ts.map