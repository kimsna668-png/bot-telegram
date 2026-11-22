import mongoose, { Schema, Document } from 'mongoose';
import type { ICategory } from '@telegram-store/types';

export interface ICategoryDocument extends Omit<ICategory, '_id'>, Document {}

const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, trim: true },
    icon: { type: String, default: 'folder' },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategoryDocument>('Category', CategorySchema);
