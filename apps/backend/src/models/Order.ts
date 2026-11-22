import mongoose, { Schema, Document } from 'mongoose';
import type { IOrder, IOrderItem } from '@telegram-store/types';

export interface IOrderDocument extends Omit<IOrder, '_id' | 'userId' | 'paymentId'>, Document {
  userId: any;
  paymentId?: any;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productType: { type: String, required: true },
    deliveryMethod: { type: String, required: true },
    unitPriceUSD: { type: Number, required: true },
    unitPriceKHR: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotalUSD: { type: Number, required: true },
    subtotalKHR: { type: Number, required: true },
    allocatedKeys: [{ type: String }],
    digitalAssetDownloadUrl: { type: String },
    deliveredContent: { type: String }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true } as any,
    telegramId: { type: Number, required: true, index: true },
    items: [OrderItemSchema],
    currency: { type: String, enum: ['USD', 'KHR'], default: 'USD', required: true },
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    payableAmount: { type: Number, required: true },
    couponCode: { type: String, uppercase: true },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'DELIVERED', 'CANCELLED', 'EXPIRED', 'REFUNDED'],
      default: 'PENDING',
      index: true
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' } as any,
    notes: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date }
  },
  { timestamps: true }
);

export const OrderModel = mongoose.model<IOrderDocument>('Order', OrderSchema);
