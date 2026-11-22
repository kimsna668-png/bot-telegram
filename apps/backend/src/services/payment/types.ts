import type { Currency, IKHQRVerificationResult } from '@telegram-store/types';

export interface ICreatePaymentRequest {
  orderId: string;
  telegramId: number;
  amount: number;
  currency: Currency;
  billNumber?: string;
}

export interface ICreatePaymentResponse {
  paymentId: string;
  transactionRef: string;
  qrString: string;
  qrImageDataUrl: string;
  md5Hash?: string;
  currency: Currency;
  amount: number;
  expiresAt: Date;
  provider: 'BAKONG_KHQR' | 'SANDBOX_KHQR';
}

export interface IVerifyPaymentParams {
  transactionRef: string;
  md5Hash?: string;
  bakongHash?: string;
}

export interface IBakongProvider {
  name: string;
  generateDynamicQR(params: {
    transactionRef: string;
    amount: number;
    currency: Currency;
    bakongAccountId: string;
    merchantName: string;
    merchantCity: string;
  }): Promise<{ qrString: string; md5Hash: string }>;

  verifyPayment(params: IVerifyPaymentParams): Promise<IKHQRVerificationResult>;
}
