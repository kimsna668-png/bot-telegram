import mongoose, { Schema, Document } from 'mongoose';
import type { IDigitalAsset } from '@telegram-store/types';

export interface IDigitalAssetDocument extends Omit<IDigitalAsset, '_id' | 'productId'>, Document {
  productId: any;
}

const DigitalAssetSchema = new Schema<IDigitalAssetDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true } as any,
    title: { type: String, required: true, trim: true },
    assetType: {
      type: String,
      enum: ['file', 'link', 'credentials', 'text'],
      required: true
    },
    filePath: { type: String },
    originalFileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    secureToken: { type: String, unique: true, sparse: true, index: true },
    externalUrl: { type: String },
    accessCredentials: {
      username: { type: String },
      password: { type: String },
      instructions: { type: String }
    },
    textContent: { type: String },
    downloadLimit: { type: Number, default: 5 },
    downloadCount: { type: Number, default: 0 },
    expiresInHours: { type: Number, default: 48 }
  },
  { timestamps: true }
);

export const DigitalAssetModel = mongoose.model<IDigitalAssetDocument>('DigitalAsset', DigitalAssetSchema);
