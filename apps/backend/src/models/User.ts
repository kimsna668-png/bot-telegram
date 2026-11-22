import mongoose, { Schema, Document } from 'mongoose';
import type { IUser } from '@telegram-store/types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String, trim: true, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    referralCode: { type: String, required: true, unique: true, index: true },
    referredBy: { type: Number, index: true },
    totalOrders: { type: Number, default: 0 },
    totalSpentUSD: { type: Number, default: 0 },
    totalSpentKHR: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    role: { type: String, enum: ['customer', 'admin', 'staff'], default: 'customer' }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);
