import crypto from 'crypto';
import axios from 'axios';
import { generateKHQR } from '@telegram-store/shared';
import type { IBakongProvider, IVerifyPaymentParams } from './types.js';
import type { Currency, IKHQRVerificationResult } from '@telegram-store/types';

export class BakongApiProvider implements IBakongProvider {
  public readonly name = 'BAKONG_KHQR';

  constructor(
    private readonly apiUrl: string,
    private readonly apiToken: string
  ) {}

  async generateDynamicQR(params: {
    transactionRef: string;
    amount: number;
    currency: Currency;
    bakongAccountId: string;
    merchantName: string;
    merchantCity: string;
  }): Promise<{ qrString: string; md5Hash: string }> {
    const qrString = generateKHQR({
      transactionRef: params.transactionRef,
      amount: params.amount,
      currency: params.currency,
      bakongAccountId: params.bakongAccountId,
      merchantName: params.merchantName,
      merchantCity: params.merchantCity,
      billNumber: params.transactionRef
    });

    const md5Hash = crypto.createHash('md5').update(qrString).digest('hex');

    return { qrString, md5Hash };
  }

  async verifyPayment(params: IVerifyPaymentParams): Promise<IKHQRVerificationResult> {
    if (!this.apiToken) {
      throw new Error('Bakong API Token is required for production verification');
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/check_transaction_by_md5`,
        { md5: params.md5Hash },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const data = response.data;
      if (data && data.responseCode === 0 && data.data) {
        return {
          isPaid: true,
          transactionRef: params.transactionRef,
          bakongHash: data.data.hash,
          amount: data.data.amount,
          currency: data.data.currency === 'USD' ? 'USD' : 'KHR',
          paidAt: new Date(data.data.createdDateMs || Date.now()),
          rawResponse: data,
          message: 'Payment successfully verified by Bakong Open API'
        };
      }

      return {
        isPaid: false,
        transactionRef: params.transactionRef,
        message: data?.responseMessage || 'Payment pending on Bakong network'
      };
    } catch (error: any) {
      return {
        isPaid: false,
        transactionRef: params.transactionRef,
        message: error.response?.data?.responseMessage || error.message || 'Error connecting to Bakong Open API'
      };
    }
  }
}
