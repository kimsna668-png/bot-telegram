import { Router, Request, Response } from 'express';
import { ProductModel, CouponModel } from '../models/index.js';

const router = Router();

/**
 * POST /api/cart/validate
 * Validate cart items and compute pricing with optional coupon
 */
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, couponCode, currency = 'USD' } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.json({
        success: true,
        cart: {
          items: [],
          totalUSD: 0,
          totalKHR: 0,
          discountUSD: 0,
          discountKHR: 0,
          payableUSD: 0,
          payableKHR: 0
        }
      });
      return;
    }

    const validatedItems: any[] = [];
    let subtotalUSD = 0;
    let subtotalKHR = 0;

    for (const item of items) {
      const product = await ProductModel.findOne({ _id: item.productId, isActive: true });
      if (!product) continue;

      const qty = Math.max(1, parseInt(item.quantity || 1, 10));

      // Check stock
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

      validatedItems.push({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] || '',
        productType: product.productType,
        deliveryMethod: product.deliveryMethod,
        unitPriceUSD,
        unitPriceKHR,
        quantity: qty,
        subtotalUSD: itemSubtotalUSD,
        subtotalKHR: itemSubtotalKHR
      });
    }

    let discountUSD = 0;
    let discountKHR = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await CouponModel.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() }
      });

      if (coupon && coupon.usedCount < coupon.usageLimit) {
        if (coupon.discountType === 'percentage') {
          discountUSD = (subtotalUSD * coupon.discountValueUSD) / 100;
          discountKHR = (subtotalKHR * coupon.discountValueKHR) / 100;
          if (coupon.maxDiscountUSD && discountUSD > coupon.maxDiscountUSD) {
            discountUSD = coupon.maxDiscountUSD;
          }
          if (coupon.maxDiscountKHR && discountKHR > coupon.maxDiscountKHR) {
            discountKHR = coupon.maxDiscountKHR;
          }
        } else {
          discountUSD = coupon.discountValueUSD;
          discountKHR = coupon.discountValueKHR;
        }

        appliedCoupon = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValueUSD: coupon.discountValueUSD
        };
      }
    }

    const payableUSD = Math.max(0, subtotalUSD - discountUSD);
    const payableKHR = Math.max(0, subtotalKHR - discountKHR);

    res.json({
      success: true,
      cart: {
        items: validatedItems,
        subtotalUSD: Number(subtotalUSD.toFixed(2)),
        subtotalKHR: Math.round(subtotalKHR),
        discountUSD: Number(discountUSD.toFixed(2)),
        discountKHR: Math.round(discountKHR),
        payableUSD: Number(payableUSD.toFixed(2)),
        payableKHR: Math.round(payableKHR),
        coupon: appliedCoupon
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
