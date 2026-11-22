import { Router, Response } from 'express';
import { UserModel, OrderModel } from '../models/index.js';
import { authenticateTelegramUser, type AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/users/profile
 * Current customer profile via Telegram WebApp
 */
router.get('/profile', authenticateTelegramUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findOne({ telegramId: req.telegramUser!.telegramId });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const referralCount = await UserModel.countDocuments({ referredBy: user.telegramId });

    res.json({
      success: true,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        referralCode: user.referralCode,
        referralCount,
        totalOrders: user.totalOrders,
        totalSpentUSD: user.totalSpentUSD,
        totalSpentKHR: user.totalSpentKHR,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/users/orders
 * Current customer order history
 */
router.get('/orders', authenticateTelegramUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const orders = await OrderModel.find({ telegramId: req.telegramUser!.telegramId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
