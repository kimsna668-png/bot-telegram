import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { DeliveryModel, DigitalAssetModel, OrderModel } from '../models/index.js';
import { DeliveryService } from '../services/delivery/DeliveryService.js';
import { TelegramNotificationService } from '../services/telegram/TelegramNotificationService.js';

const router = Router();

/**
 * GET /api/deliveries/order/:orderId
 * Get delivery details for a confirmed order
 */
router.get('/order/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const delivery = await DeliveryModel.findOne({ orderId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery record not found' });
      return;
    }

    res.json({ success: true, delivery });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/deliveries/download/:token
 * Secure, rate-limited, expiring file download gateway
 */
router.get('/download/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const asset = await DigitalAssetModel.findOne({ secureToken: token });

    if (!asset) {
      res.status(404).send('Invalid or expired download link.');
      return;
    }

    if (asset.downloadCount >= asset.downloadLimit) {
      res.status(403).send('Download limit exceeded for this link.');
      return;
    }

    // Increment download counter
    asset.downloadCount += 1;
    await asset.save();

    // Check if physical file exists
    if (asset.filePath && fs.existsSync(asset.filePath)) {
      res.download(asset.filePath, asset.originalFileName || 'digital-download');
      return;
    }

    // If text / credentials asset
    if (asset.textContent) {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${asset.title.replace(/\s+/g, '_')}.txt"`);
      res.send(asset.textContent);
      return;
    }

    // If external redirect
    if (asset.externalUrl) {
      res.redirect(asset.externalUrl);
      return;
    }

    // Default sample asset payload
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${asset.title.replace(/\s+/g, '_')}.txt"`);
    res.send(`=== TELEGRAM DIGITAL STORE PRO - LICENSED ASSET ===\nItem: ${asset.title}\nAuthorized Download.\n`);
  } catch (error: any) {
    res.status(500).send('Error serving file.');
  }
});

/**
 * POST /api/deliveries/resend/:orderId
 * Resend digital delivery to Telegram
 */
router.post('/resend/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const delivery = await DeliveryModel.findOne({ orderId });
    if (!delivery) {
      res.status(404).json({ success: false, message: 'Delivery not found' });
      return;
    }

    const sent = await TelegramNotificationService.getInstance().notifyCustomerPaymentSuccess(order, delivery.toObject() as any);

    res.json({
      success: sent,
      message: sent ? 'Delivery resent to Telegram chat successfully' : 'Failed to deliver to Telegram'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
