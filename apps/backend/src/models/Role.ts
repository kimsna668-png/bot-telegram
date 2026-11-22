import mongoose, { Schema, Document } from 'mongoose';
import type { IRole } from '@telegram-store/types';

export interface IRoleDocument extends Omit<IRole, '_id'>, Document {}

const RoleSchema = new Schema<IRoleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    permissions: [{ type: String, required: true }],
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const RoleModel = mongoose.model<IRoleDocument>('Role', RoleSchema);
