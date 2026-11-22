import crypto from 'crypto';
import { generateKHQR } from '@telegram-store/shared';
import type { IBakongProvider, IVerifyPaymentParams } from './types.js';
import type { Currency, IKHQRVerificationResult } from '@telegram-store/types';

/**
 * SANDBOX / MOCK KHQR PROVIDER [DEVELOPMENT & TESTING ONLY]
 * WARNING: Never use in production. Never simulates successful production payments.
 */
export class SandboxMockProvider implements IBakongProvider {
  public readonly name = 'SANDBOX_KHQR';

  // In-memory registry of simulated bank approvals in test mode
  private simulatedApprovals = new Map<string, {
    paid: boolean;
    paidAt: Date;
    amount: number;
    currency: Currency;
  }>();

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
      merchantName: `[TEST] ${params.merchantName}`,
      merchantCity: params.merchantCity,
      billNumber: params.transactionRef
    });

    const md5Hash = crypto.createHash('md5').update(qrString).digest('hex');

    // Register simulated transaction in pending state
    this.simulatedApprovals.set(params.transactionRef, {
      paid: false,
      paidAt: new Date(),
      amount: params.amount,
      currency: params.currency
    });

    return { qrString, md5Hash };
  }

  /**
   * For automated testing / sandbox demo simulation:
   * Explicitly simulate customer completing payment from a banking app.
   */
  public simulateBankPaymentApproval(transactionRef: string): boolean {
    const record = this.simulatedApprovals.get(transactionRef);
    if (!record) return false;
    record.paid = true;
    record.paidAt = new Date();
    this.simulatedApprovals.set(transactionRef, record);
    return true;
  }

  async verifyPayment(params: IVerifyPaymentParams): Promise<IKHQRVerificationResult> {
    const record = this.simulatedApprovals.get(params.transactionRef);

    if (record && record.paid) {
      return {
        isPaid: true,
        transactionRef: params.transactionRef,
        bakongHash: `MOCK_HASH_${crypto.randomBytes(16).toString('hex')}`,
        amount: record.amount,
        currency: record.currency,
        paidAt: record.paidAt,
        rawResponse: {
          mock: true,
          provider: 'SANDBOX_KHQR',
          verifiedAt: new Date().toISOString()
        },
        message: '[SANDBOX] Mock payment verified for test transaction'
      };
    }

    return {
      isPaid: false,
      transactionRef: params.transactionRef,
      message: '[SANDBOX] Payment pending banking app scan in sandbox'
    };
  }
}
