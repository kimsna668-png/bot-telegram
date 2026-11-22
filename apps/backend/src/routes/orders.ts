import { Router, Response } from 'express';
import { generateOrderNumber } from '@telegram-store/shared';
import { OrderModel, ProductModel, CouponModel, UserModel } from '../models/index.js';
import { authenticateTelegramUser, type AuthenticatedRequest } from '../middleware/auth.js';
import { PaymentService } from '../services/payment/PaymentService.js';
import type { IOrderItem } from '@telegram-store/types';

const router = Router();

/**
 * POST /api/orders
 * Create order and initialize KHQR payment
 */
router.post('/', authenticateTelegramUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { items, couponCode, currency = 'USD', notes } = req.body;
    const telegramId = req.telegramUser!.telegramId;
    const dbUserId = req.telegramUser!.dbUserId;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Order must contain at least one item' });
      return;
    }

    const orderItems: IOrderItem[] = [];
    let subtotalUSD = 0;
    let subtotalKHR = 0;

    for (const item of items) {
      const product = await ProductModel.findOne({ _id: item.productId, isActive: true });
      if (!product) {
        res.status(400).json({ success: false, message: `Product ${item.productId} not found or inactive` });
        return;
      }

      const qty = Math.max(1, parseInt(item.quantity || 1, 10));
      if (!product.isUnlimitedStock && product.stockQuantity < qty) {
        res.status(400).json({
          success: false,
          message: `Product "${product.name}" only has ${product.stockQuantity} items in stock.`
        });
        return;
      }

      const unitPriceUSD = product.discountPriceUSD ?? product.priceUSD;
      const unitPriceKHR = product.discountPriceKHR ?? product.priceKHR;

      const itemSubtotalUSD = unitPriceUSD * qty;
      const itemSubtotalKHR = unitPriceKHR * qty;

      subtotalUSD += itemSubtotalUSD;
      subtotalKHR += itemSubtotalKHR;

      orderItems.push({
        productId: product._id.toString(),
        productName: product.name,
        productType: product.productType,
        deliveryMethod: product.deliveryMethod,
        unitPriceUSD,
        unitPriceKHR,
        quantity: qty,
        subtotalUSD: itemSubtotalUSD,
        subtotalKHR: itemSubtotalKHR
      });
    }

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await CouponModel.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() }
      });

      if (coupon && coupon.usedCount < coupon.usageLimit) {
        if (currency === 'USD') {
          discountAmount =
            coupon.discountType === 'percentage'
              ? (subtotalUSD * coupon.discountValueUSD) / 100
              : coupon.discountValueUSD;
          if (coupon.maxDiscountUSD && discountAmount > coupon.maxDiscountUSD) {
            discountAmount = coupon.maxDiscountUSD;
          }
        } else {
          discountAmount =
            coupon.discountType === 'percentage'
              ? (subtotalKHR * coupon.discountValueKHR) / 100
              : coupon.discountValueKHR;
          if (coupon.maxDiscountKHR && discountAmount > coupon.maxDiscountKHR) {
            discountAmount = coupon.maxDiscountKHR;
          }
        }

        coupon.usedCount += 1;
        await coupon.save();
        appliedCoupon = coupon.code;
      }
    }

    const totalAmount = currency === 'USD' ? subtotalUSD : subtotalKHR;
    const payableAmount = Math.max(0, currency === 'USD' ? Number((totalAmount - discountAmount).toFixed(2)) : Math.round(totalAmount - discountAmount));

    const orderNumber = generateOrderNumber();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    const order = await OrderModel.create({
      orderNumber,
      userId: dbUserId,
      telegramId,
      items: orderItems,
      currency,
      totalAmount,
      discountAmount,
      payableAmount,
      couponCode: appliedCoupon,
      status: 'PENDING',
      deliveryStatus: 'PENDING',
      notes,
      expiresAt
    });

    // Generate KHQR Payment immediately
    const paymentService = PaymentService.getInstance();
    const payment = await paymentService.createPayment({
      orderId: order._id.toString(),
      telegramId,
      amount: payableAmount,
      currency,
      billNumber: orderNumber
    });

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        currency: order.currency,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        payableAmount: order.payableAmount,
        status: order.status,
        expiresAt: order.expiresAt,
        items: order.items
      },
      payment
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/orders/:identifier
 */
router.get('/:identifier', authenticateTelegramUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const query: any = isObjectId ? { _id: identifier } : { orderNumber: identifier };
    query.telegramId = req.telegramUser!.telegramId;

    const order = await OrderModel.findOne(query).populate('paymentId');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
