import mongoose, { Schema, Document } from 'mongoose';
import type { ICoupon } from '@telegram-store/types';

export interface ICouponDocument extends Omit<ICoupon, '_id'>, Document {}

const CouponSchema = new Schema<ICouponDocument>(
  {
    code: { type: String, required: true, uppercase: true, unique: true, trim: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValueUSD: { type: Number, required: true, min: 0 },
    discountValueKHR: { type: Number, required: true, min: 0 },
    minOrderUSD: { type: Number, default: 0 },
    minOrderKHR: { type: Number, default: 0 },
    maxDiscountUSD: { type: Number },
    maxDiscountKHR: { type: Number },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const CouponModel = mongoose.model<ICouponDocument>('Coupon', CouponSchema);
