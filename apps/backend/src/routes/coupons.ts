import { Router, Request, Response } from 'express';
import { CouponModel } from '../models/index.js';

const router = Router();

/**
 * GET /api/coupons/verify/:code
 */
router.get('/verify/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const coupon = await CouponModel.findOne({
      code,
      isActive: true,
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() }
    });

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
      return;
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      return;
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValueUSD: coupon.discountValueUSD,
        discountValueKHR: coupon.discountValueKHR,
        minOrderUSD: coupon.minOrderUSD,
        maxDiscountUSD: coupon.maxDiscountUSD
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
