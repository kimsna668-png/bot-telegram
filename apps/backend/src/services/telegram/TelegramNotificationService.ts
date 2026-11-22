import axios from 'axios';
import { TelegramSettingsModel } from '../../models/index.js';
import type { IOrder, IDelivery } from '@telegram-store/types';

export class TelegramNotificationService {
  private static instance: TelegramNotificationService;

  private constructor() {}

  public static getInstance(): TelegramNotificationService {
    if (!TelegramNotificationService.instance) {
      TelegramNotificationService.instance = new TelegramNotificationService();
    }
    return TelegramNotificationService.instance;
  }

  public async notifyCustomerPaymentSuccess(order: IOrder, delivery?: IDelivery): Promise<boolean> {
    try {
      const settings = await TelegramSettingsModel.findOne();
      const botToken = settings?.botToken || process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken || !order.telegramId) {
        return false;
      }

      let text = `🎉 *Payment Successful!*\n\n`;
      text += `📦 *Order:* \`${order.orderNumber}\`\n`;
      text += `💵 *Amount:* ${order.currency === 'USD' ? `$${order.payableAmount.toFixed(2)}` : `${order.payableAmount} ៛`}\n`;
      text += `💳 *Method:* Bakong KHQR\n\n`;

      if (delivery && delivery.items && delivery.items.length > 0) {
        text += `🎁 *Your Digital Products Are Ready:*\n\n`;
        delivery.items.forEach((item, index) => {
          text += `*${index + 1}. ${item.productName}*\n`;
          text += `${item.deliveredContent}\n\n`;
        });
      }

      text += `Thank you for shopping with us! Use /orders to view your past purchases.`;

      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      await axios.post(telegramApiUrl, {
        chat_id: order.telegramId,
        text,
        parse_mode: 'Markdown'
      });

      return true;
    } catch (err: any) {
      console.error('[TelegramNotification] Failed to send customer notification:', err.message);
      return false;
    }
  }

  public async sendDirectMessage(telegramId: number, message: string, parseMode: string = 'Markdown'): Promise<boolean> {
    try {
      const settings = await TelegramSettingsModel.findOne();
      const botToken = settings?.botToken || process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) return false;

      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: telegramId,
        text: message,
        parse_mode: parseMode
      });
      return true;
    } catch (err: any) {
      console.error('[TelegramNotification] Failed to send message:', err.message);
      return false;
    }
  }
}
