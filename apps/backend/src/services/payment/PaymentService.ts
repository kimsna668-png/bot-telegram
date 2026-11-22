import QRCode from 'qrcode';
import { generateTransactionRef } from '@telegram-store/shared';
import {
  PaymentModel,
  OrderModel,
  TransactionModel,
  UserModel,
  BakongSettingsModel
} from '../../models/index.js';
import { BakongApiProvider } from './BakongApiProvider.js';
import { SandboxMockProvider } from './SandboxMockProvider.js';
import type { IBakongProvider, ICreatePaymentRequest, ICreatePaymentResponse } from './types.js';
import type { IKHQRVerificationResult } from '@telegram-store/types';
import { DeliveryService } from '../delivery/DeliveryService.js';
import { getSocketIO } from '../../socket.js';
import { TelegramNotificationService } from '../telegram/TelegramNotificationService.js';

export class PaymentService {
  private static instance: PaymentService;
  private bakongProvider!: IBakongProvider;
  public sandboxProvider: SandboxMockProvider = new SandboxMockProvider();

  private constructor() {
    this.initProvider();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  public async initProvider(): Promise<void> {
    const settings = await BakongSettingsModel.findOne();
    const isSandbox = settings ? settings.isSandbox : (process.env.BAKONG_IS_SANDBOX !== 'false');

    if (isSandbox) {
      this.bakongProvider = this.sandboxProvider;
    } else {
      const apiUrl = settings?.apiUrl || process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh/v1';
      const apiToken = settings?.apiToken || process.env.BAKONG_API_TOKEN || '';
      this.bakongProvider = new BakongApiProvider(apiUrl, apiToken);
    }
  }

  public getActiveProvider(): IBakongProvider {
    return this.bakongProvider;
  }

  public async createPayment(req: ICreatePaymentRequest): Promise<ICreatePaymentResponse> {
    const order = await OrderModel.findById(req.orderId);
    if (!order) {
      throw new Error(`Order ${req.orderId} not found`);
    }

    if (order.status === 'PAID' || order.status === 'DELIVERED') {
      throw new Error(`Order ${order.orderNumber} is already paid`);
    }

    // Load active Bakong settings
    let settings = await BakongSettingsModel.findOne();
    if (!settings) {
      settings = await BakongSettingsModel.create({
        merchantId: process.env.BAKONG_MERCHANT_ID || 'devb_retail',
        merchantName: process.env.BAKONG_MERCHANT_NAME || 'DIGITAL STORE PRO',
        merchantCity: process.env.BAKONG_MERCHANT_CITY || 'Phnom Penh',
        bakongAccountId: process.env.BAKONG_ACCOUNT_ID || 'devb_retail@devb',
        apiUrl: process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh/v1',
        isSandbox: process.env.BAKONG_IS_SANDBOX !== 'false',
        qrExpiryMinutes: 15
      });
    }

    // Refresh provider if settings changed
    await this.initProvider();

    const transactionRef = generateTransactionRef();
    const expiryMinutes = settings.qrExpiryMinutes || 15;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Generate Dynamic KHQR string
    const { qrString, md5Hash } = await this.bakongProvider.generateDynamicQR({
      transactionRef,
      amount: req.amount,
      currency: req.currency,
      bakongAccountId: settings.bakongAccountId,
      merchantName: settings.merchantName,
      merchantCity: settings.merchantCity
    });

    // Generate high quality QR code data URL for rendering in Mini App / Telegram
    const qrImageDataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const isSandbox = settings.isSandbox;
    const providerName = isSandbox ? 'SANDBOX_KHQR' : 'BAKONG_KHQR';

    const payment = await PaymentModel.create({
      transactionRef,
      orderId: order._id,
      telegramId: req.telegramId,
      currency: req.currency,
      amount: req.amount,
      paymentMethod: 'KHQR',
      qrString,
      md5Hash,
      status: 'PENDING',
      provider: providerName,
      qrExpiresAt: expiresAt,
      verificationAttempts: 0
    });

    // Record Transaction
    await TransactionModel.create({
      transactionRef,
      paymentId: payment._id,
      orderId: order._id,
      amount: req.amount,
      currency: req.currency,
      status: 'PENDING',
      provider: providerName,
      type: 'PAYMENT'
    });

    // Link payment to order
    order.paymentId = payment._id as any;
    await order.save();

    return {
      paymentId: payment._id.toString(),
      transactionRef,
      qrString,
      qrImageDataUrl,
      md5Hash,
      currency: req.currency,
      amount: req.amount,
      expiresAt,
      provider: providerName
    };
  }

  public async verifyAndConfirmPayment(transactionRef: string): Promise<IKHQRVerificationResult> {
    const payment = await PaymentModel.findOne({ transactionRef });
    if (!payment) {
      return { isPaid: false, transactionRef, message: 'Payment record not found' };
    }

    if (payment.status === 'SUCCESS') {
      return {
        isPaid: true,
        transactionRef,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        message: 'Payment already confirmed'
      };
    }

    if (new Date() > payment.qrExpiresAt) {
      payment.status = 'EXPIRED';
      await payment.save();
      await OrderModel.findByIdAndUpdate(payment.orderId, { status: 'EXPIRED' });
      return { isPaid: false, transactionRef, message: 'Payment request has expired' };
    }

    payment.verificationAttempts += 1;
    payment.lastCheckedAt = new Date();
    await payment.save();

    const verification = await this.bakongProvider.verifyPayment({
      transactionRef,
      md5Hash: payment.md5Hash,
      bakongHash: payment.bakongHash
    });

    if (verification.isPaid) {
      // Atomic status update to avoid race conditions
      const updatedPayment = await PaymentModel.findOneAndUpdate(
        { _id: payment._id, status: 'PENDING' },
        {
          status: 'SUCCESS',
          paidAt: verification.paidAt || new Date(),
          bakongHash: verification.bakongHash,
          rawResponse: verification.rawResponse
        },
        { new: true }
      );

      if (!updatedPayment) {
        return { isPaid: true, transactionRef, message: 'Payment already processed concurrently' };
      }

      // Update Order
      const order = await OrderModel.findByIdAndUpdate(
        payment.orderId,
        {
          status: 'PAID',
          paidAt: verification.paidAt || new Date()
        },
        { new: true }
      );

      // Update Transaction
      await TransactionModel.findOneAndUpdate(
        { transactionRef },
        {
          status: 'SUCCESS',
          externalRef: verification.bakongHash
        }
      );

      // Update User stats
      if (order) {
        const userUpdate: any = { $inc: { totalOrders: 1 } };
        if (order.currency === 'USD') {
          userUpdate.$inc.totalSpentUSD = order.payableAmount;
        } else {
          userUpdate.$inc.totalSpentKHR = order.payableAmount;
        }
        await UserModel.findByIdAndUpdate(order.userId, userUpdate);

        // Trigger Instant Digital Delivery
        const deliveryService = DeliveryService.getInstance();
        const deliveryResult = await deliveryService.processDelivery(order._id.toString());

        // Emit real-time WebSocket update for Mini App & Admin
        const io = getSocketIO();
        if (io) {
          io.emit(`payment:${transactionRef}`, {
            status: 'SUCCESS',
            orderId: order._id,
            orderNumber: order.orderNumber,
            amount: order.payableAmount,
            currency: order.currency,
            delivery: deliveryResult
          });

          io.emit('admin:order_paid', {
            orderNumber: order.orderNumber,
            payableAmount: order.payableAmount,
            currency: order.currency
          });
        }

        // Send instant notification to Telegram Customer
        TelegramNotificationService.getInstance().notifyCustomerPaymentSuccess(order, deliveryResult);
      }
    }

    return verification;
  }
}
