import mongoose, { Schema, Document } from 'mongoose';
import type { ITelegramSettings } from '@telegram-store/types';

export interface ITelegramSettingsDocument extends Omit<ITelegramSettings, '_id'>, Document {}

const TelegramSettingsSchema = new Schema<ITelegramSettingsDocument>(
  {
    botToken: { type: String, default: '' },
    botUsername: { type: String, default: 'DigitalStoreBot' },
    miniAppUrl: { type: String, default: 'http://localhost:3000/store' },
    welcomeMessage: {
      type: String,
      default: '🚀 Welcome to *Digital Store Pro*!\nYour instant digital marketplace in Telegram.'
    },
    supportContact: { type: String, default: '@StoreSupport' },
    broadcastChannel: { type: String, default: '@StoreUpdates' },
    defaultLanguage: { type: String, enum: ['en', 'km'], default: 'en' },
    isBotActive: { type: Boolean, default: true },
    autoDeliveryEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const TelegramSettingsModel = mongoose.model<ITelegramSettingsDocument>(
  'TelegramSettings',
  TelegramSettingsSchema
);
