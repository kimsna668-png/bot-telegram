import mongoose, { Schema, Document } from 'mongoose';
import type { ILicenseKey, LicenseStatus } from '@telegram-store/types';

export interface ILicenseKeyDocument extends Omit<ILicenseKey, '_id'>, Document {}

const LicenseKeySchema = new Schema<ILicenseKeyDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
    licenseKey: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'ALLOCATED', 'EXPIRED'],
      default: 'AVAILABLE',
      index: true
    },
    allocatedToTelegramId: { type: Number, index: true },
    allocatedAt: { type: Date },
    reservedAt: { type: Date },
    reservationExpiresAt: { type: Date },
    notes: { type: String }
  },
  { timestamps: true }
);

LicenseKeySchema.index({ productId: 1, status: 1 });
LicenseKeySchema.index({ productId: 1, licenseKey: 1 }, { unique: true });

export const LicenseKeyModel = mongoose.model<ILicenseKeyDocument>('LicenseKey', LicenseKeySchema);
