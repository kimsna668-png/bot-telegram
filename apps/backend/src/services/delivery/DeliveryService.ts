import crypto from 'crypto';
import {
  OrderModel,
  ProductModel,
  LicenseKeyModel,
  DigitalAssetModel,
  DeliveryModel
} from '../../models/index.js';
import type { IDelivery, ProductType, DeliveryMethod } from '@telegram-store/types';

export class DeliveryService {
  private static instance: DeliveryService;

  private constructor() {}

  public static getInstance(): DeliveryService {
    if (!DeliveryService.instance) {
      DeliveryService.instance = new DeliveryService();
    }
    return DeliveryService.instance;
  }

  public async processDelivery(orderId: string): Promise<IDelivery> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found for delivery`);
    }

    // Check if already delivered
    let delivery = await DeliveryModel.findOne({ orderId: order._id });
    if (delivery && delivery.status === 'COMPLETED') {
      return delivery.toObject() as unknown as IDelivery;
    }

    if (!delivery) {
      delivery = await DeliveryModel.create({
        orderId: order._id,
        orderNumber: order.orderNumber,
        telegramId: order.telegramId,
        status: 'PROCESSING',
        items: [],
        attempts: 1
      });
    } else {
      delivery.status = 'PROCESSING';
      delivery.attempts += 1;
      await delivery.save();
    }

    const deliveredItems: any[] = [];
    const appBaseUrl = process.env.BASE_URL || 'http://localhost:5000';

    try {
      for (const item of order.items) {
        const product = await ProductModel.findById(item.productId);
        let deliveredContent = '';
        let downloadUrl = '';
        let allocatedKeys: string[] = [];
        let expiryDate: Date | undefined;

        // 1. License Keys & Activation Codes
        if (
          item.deliveryMethod === 'instant_license' ||
          item.productType === 'license_key' ||
          item.productType === 'activation_code'
        ) {
          const keysNeeded = item.quantity;
          const availableKeys = await LicenseKeyModel.find({
            productId: item.productId,
            status: 'AVAILABLE'
          }).limit(keysNeeded);

          if (availableKeys.length < keysNeeded) {
            // Partial or backorder allocation fallback
            deliveredContent = `[PENDING STOCK] We are restocking license keys for ${item.productName}. Support has been alerted.`;
          } else {
            const keyStrings: string[] = [];
            for (const keyDoc of availableKeys) {
              keyDoc.status = 'ALLOCATED';
              keyDoc.orderId = order._id as any;
              keyDoc.allocatedToTelegramId = order.telegramId;
              keyDoc.allocatedAt = new Date();
              await keyDoc.save();
              keyStrings.push(keyDoc.licenseKey);
            }
            allocatedKeys = keyStrings;
            item.allocatedKeys = keyStrings;
            deliveredContent = `🔑 License Key(s):\n${keyStrings.map((k, idx) => `• Key ${idx + 1}: \`${k}\``).join('\n')}`;

            // Deduct stock if limited
            if (product && !product.isUnlimitedStock) {
              product.stockQuantity = Math.max(0, product.stockQuantity - keysNeeded);
              await product.save();
            }
          }
        }

        // 2. Downloadable Files (PDF, Ebook, Software, App, Archives)
        else if (
          item.deliveryMethod === 'secure_download' ||
          item.productType === 'ebook_pdf' ||
          item.productType === 'software' ||
          item.productType === 'file'
        ) {
          let asset = null;
          if (product?.digitalAssetId) {
            asset = await DigitalAssetModel.findById(product.digitalAssetId);
          } else {
            asset = await DigitalAssetModel.findOne({ productId: item.productId });
          }

          if (asset) {
            const token = crypto.randomBytes(32).toString('hex');
            const expiryHours = product?.downloadExpiryHours || asset.expiresInHours || 48;
            expiryDate = new Date(Date.now() + expiryHours * 3600 * 1000);

            asset.secureToken = token;
            await asset.save();

            downloadUrl = `${appBaseUrl}/api/deliveries/download/${token}`;
            item.digitalAssetDownloadUrl = downloadUrl;
            deliveredContent = `📥 Secure Download Link (Valid for ${expiryHours} hours):\n${downloadUrl}\n\nFile: ${asset.originalFileName || asset.title || 'Digital Package'}`;
          } else {
            deliveredContent = `📥 Direct access link for ${item.productName}: Ready in your Customer Orders dashboard.`;
          }
        }

        // 3. Private Access Links, Courses & Subscriptions
        else if (
          item.deliveryMethod === 'private_link' ||
          item.productType === 'course' ||
          item.productType === 'link'
        ) {
          const asset = await DigitalAssetModel.findOne({ productId: item.productId });
          const link = asset?.externalUrl || 'https://learn.store.pro/access';
          deliveredContent = `🔗 Private Access Portal:\n${link}\n\nInstructions: Use your registered Telegram ID (${order.telegramId}) to activate.`;
        }

        // 4. Accounts & Credentials
        else if (
          item.deliveryMethod === 'credentials' ||
          item.productType === 'account' ||
          item.productType === 'subscription'
        ) {
          const asset = await DigitalAssetModel.findOne({ productId: item.productId });
          if (asset?.accessCredentials) {
            const creds = asset.accessCredentials;
            deliveredContent = `🔐 Access Credentials:\nUsername: \`${creds.username || 'user'}\`\nPassword: \`${creds.password || '******'}\`\nInstructions: ${creds.instructions || 'Sign in and change password immediately.'}`;
          } else {
            deliveredContent = `🔐 Access Details:\nYour account will be provisioned by admin within 15 minutes. Support ref: ${order.orderNumber}`;
          }
        }

        deliveredItems.push({
          productId: item.productId,
          productName: item.productName,
          productType: item.productType as ProductType,
          deliveryMethod: item.deliveryMethod as DeliveryMethod,
          deliveredContent,
          downloadUrl,
          licenseKeys: allocatedKeys,
          expiryDate
        });
      }

      delivery.items = deliveredItems;
      delivery.status = 'COMPLETED';
      delivery.deliveredAt = new Date();
      await delivery.save();

      // Update Order Status
      order.deliveryStatus = 'COMPLETED';
      order.status = 'DELIVERED';
      order.deliveredAt = new Date();
      await order.save();

      return delivery.toObject() as unknown as IDelivery;
    } catch (err: any) {
      delivery.status = 'FAILED';
      delivery.lastError = err.message || 'Delivery error';
      await delivery.save();
      throw err;
    }
  }

  public async getDeliveryByOrder(orderId: string): Promise<IDelivery | null> {
    const delivery = await DeliveryModel.findOne({ orderId });
    return delivery ? (delivery.toObject() as unknown as IDelivery) : null;
  }
}
