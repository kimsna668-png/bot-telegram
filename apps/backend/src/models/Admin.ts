import mongoose, { Schema, Document } from 'mongoose';
import type { IAdmin } from '@telegram-store/types';

export interface IAdminDocument extends Omit<IAdmin, '_id'>, Document {}

const AdminSchema = new Schema<IAdminDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export const AdminModel = mongoose.model<IAdminDocument>('Admin', AdminSchema);
