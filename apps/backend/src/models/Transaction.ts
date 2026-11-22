import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionDocument extends Document {
  transactionRef: string;
  paymentId: Schema.Types.ObjectId;
  orderId: Schema.Types.ObjectId;
  amount: number;
  currency: 'USD' | 'KHR';
  externalRef?: string;
  type: 'PAYMENT' | 'REFUND';
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  provider: 'BAKONG_KHQR' | 'SANDBOX_KHQR';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    transactionRef: { type: String, required: true, unique: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ['USD', 'KHR'], required: true },
    externalRef: { type: String, index: true },
    type: { type: String, enum: ['PAYMENT', 'REFUND'], default: 'PAYMENT' },
    status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], required: true, index: true },
    provider: { type: String, enum: ['BAKONG_KHQR', 'SANDBOX_KHQR'], required: true },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const TransactionModel = mongoose.model<ITransactionDocument>('Transaction', TransactionSchema);
