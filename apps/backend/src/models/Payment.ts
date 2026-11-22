import mongoose, { Schema, Document } from 'mongoose';
import type { IPayment } from '@telegram-store/types';

export interface IPaymentDocument extends Omit<IPayment, '_id' | 'orderId'>, Document {
  orderId: any;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    transactionRef: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true } as any,
    telegramId: { type: Number, required: true, index: true },
    currency: { type: String, enum: ['USD', 'KHR'], required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['KHQR'], default: 'KHQR' },
    qrString: { type: String, required: true },
    md5Hash: { type: String, index: true },
    bakongHash: { type: String, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED'],
      default: 'PENDING',
      index: true
    },
    provider: { type: String, enum: ['BAKONG_KHQR', 'SANDBOX_KHQR'], required: true },
    qrExpiresAt: { type: Date, required: true, index: true },
    paidAt: { type: Date },
    rawResponse: { type: Schema.Types.Mixed },
    verificationAttempts: { type: Number, default: 0 },
    lastCheckedAt: { type: Date }
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<IPaymentDocument>('Payment', PaymentSchema);
