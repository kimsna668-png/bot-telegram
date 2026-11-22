import mongoose, { Schema, Document } from 'mongoose';
import type { IDelivery } from '@telegram-store/types';

export interface IDeliveryDocument extends Omit<IDelivery, '_id'>, Document {}

const DeliverySchema = new Schema<IDeliveryDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true },
    telegramId: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        productType: { type: String, required: true },
        deliveryMethod: { type: String, required: true },
        deliveredContent: { type: String, required: true },
        downloadUrl: { type: String },
        licenseKeys: [{ type: String }],
        expiryDate: { type: Date }
      }
    ],
    telegramNotificationSent: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    lastError: { type: String },
    deliveredAt: { type: Date }
  },
  { timestamps: true }
);

export const DeliveryModel = mongoose.model<IDeliveryDocument>('Delivery', DeliverySchema);
