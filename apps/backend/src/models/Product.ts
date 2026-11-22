import mongoose, { Schema, Document } from 'mongoose';
import type { IProduct, ProductType, DeliveryMethod } from '@telegram-store/types';

export interface IProductDocument extends Omit<IProduct, '_id'>, Document {}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, trim: true },
    description: { type: String, required: true },
    priceUSD: { type: Number, required: true, min: 0 },
    priceKHR: { type: Number, required: true, min: 0 },
    discountPriceUSD: { type: Number, min: 0 },
    discountPriceKHR: { type: Number, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: [{ type: String }],
    productType: {
      type: String,
      enum: [
        'ebook_pdf',
        'software',
        'license_key',
        'activation_code',
        'account',
        'course',
        'file',
        'link',
        'subscription'
      ],
      required: true,
      index: true
    },
    deliveryMethod: {
      type: String,
      enum: ['instant_license', 'secure_download', 'private_link', 'credentials', 'manual'],
      required: true
    },
    stockQuantity: { type: Number, default: 0, min: 0 },
    isUnlimitedStock: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    salesCount: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    digitalAssetId: { type: Schema.Types.ObjectId, ref: 'DigitalAsset', default: null },
    downloadExpiryHours: { type: Number, default: 48 },
    maxDownloadCount: { type: Number, default: 5 },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });

export const ProductModel = mongoose.model<IProductDocument>('Product', ProductSchema);
