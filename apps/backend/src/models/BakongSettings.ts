import mongoose, { Schema, Document } from 'mongoose';
import type { IBakongSettings } from '@telegram-store/types';

export interface IBakongSettingsDocument extends Omit<IBakongSettings, '_id'>, Document {}

const BakongSettingsSchema = new Schema<IBakongSettingsDocument>(
  {
    merchantId: { type: String, default: 'devb_retail' },
    merchantName: { type: String, default: 'DIGITAL STORE PRO' },
    merchantCity: { type: String, default: 'Phnom Penh' },
    bakongAccountId: { type: String, default: 'devb_retail@devb' },
    acquireId: { type: String, default: 'DEVB' },
    apiToken: { type: String, default: '' },
    apiUrl: { type: String, default: 'https://api-bakong.nbc.gov.kh/v1' },
    isSandbox: { type: Boolean, default: true },
    sandboxMockDelayMs: { type: Number, default: 3000 },
    pollIntervalSeconds: { type: Number, default: 3 },
    qrExpiryMinutes: { type: Number, default: 15 }
  },
  { timestamps: true }
);

export const BakongSettingsModel = mongoose.model<IBakongSettingsDocument>(
  'BakongSettings',
  BakongSettingsSchema
);
