import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  AdminModel,
  RoleModel,
  UserModel,
  ProductModel,
  CategoryModel,
  OrderModel,
  PaymentModel,
  TransactionModel,
  LicenseKeyModel,
  DigitalAssetModel,
  CouponModel,
  TelegramSettingsModel,
  BakongSettingsModel,
  AuditLogModel
} from '../models/index.js';
import { authenticateAdmin, requirePermission, type AuthenticatedRequest } from '../middleware/auth.js';
import { auditAction } from '../middleware/audit.js';
import { slugify } from '@telegram-store/shared';

const router = Router();

// Protect all admin routes with JWT authentication
router.use(authenticateAdmin);

// ==========================================
// 1. DASHBOARD ANALYTICS
// ==========================================
router.get('/dashboard/stats', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      totalCustomers,
      totalProducts,
      recentOrders,
      bestSellers
    ] = await Promise.all([
      OrderModel.countDocuments(),
      OrderModel.countDocuments({ status: { $in: ['PAID', 'DELIVERED'] } }),
      OrderModel.countDocuments({ status: 'PENDING' }),
      UserModel.countDocuments(),
      ProductModel.countDocuments({ isActive: true }),
      OrderModel.find().sort({ createdAt: -1 }).limit(8),
      ProductModel.find().sort({ salesCount: -1 }).limit(5)
    ]);

    // Aggregate total revenue USD & KHR
    const revenueAgg = await OrderModel.aggregate([
      { $match: { status: { $in: ['PAID', 'DELIVERED'] } } },
      {
        $group: {
          _id: '$currency',
          totalRevenue: { $sum: '$payableAmount' }
        }
      }
    ]);

    let totalRevenueUSD = 0;
    let totalRevenueKHR = 0;
    revenueAgg.forEach((item) => {
      if (item._id === 'USD') totalRevenueUSD = item.totalRevenue;
      if (item._id === 'KHR') totalRevenueKHR = item.totalRevenue;
    });

    res.json({
      success: true,
      stats: {
        totalRevenueUSD: Number(totalRevenueUSD.toFixed(2)),
        totalRevenueKHR,
        totalOrders,
        paidOrders,
        pendingOrders,
        totalCustomers,
        totalProducts,
        conversionRate: totalOrders > 0 ? Number(((paidOrders / totalOrders) * 100).toFixed(1)) : 0
      },
      recentOrders,
      bestSellers
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. PRODUCT MANAGEMENT
// ==========================================
router.get('/products', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, type, search } = req.query;
    const query: any = {};
    if (category) query.categoryId = category;
    if (type) query.productType = type;
    if (search) query.name = { $regex: search, $options: 'i' };

    const products = await ProductModel.find(query)
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/products', auditAction('CREATE', 'PRODUCT'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const productData = req.body;
    if (!productData.name || !productData.priceUSD || !productData.categoryId) {
      res.status(400).json({ success: false, message: 'Name, price and category are required' });
      return;
    }

    if (!productData.slug) {
      productData.slug = slugify(productData.name) + '-' + Date.now().toString(36);
    }

    if (!productData.priceKHR) {
      productData.priceKHR = Math.round(productData.priceUSD * 4100);
    }

    const product = await ProductModel.create(productData);
    res.status(201).json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/products/:id', auditAction('UPDATE', 'PRODUCT'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/products/:id', auditAction('DELETE', 'PRODUCT'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await ProductModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. CATEGORY MANAGEMENT
// ==========================================
router.get('/categories', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = await CategoryModel.find().sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/categories', auditAction('CREATE', 'CATEGORY'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon, sortOrder, isActive } = req.body;
    const catSlug = slug ? slugify(slug) : slugify(name);
    const category = await CategoryModel.create({
      name,
      slug: catSlug,
      description,
      icon: icon || 'folder',
      sortOrder: sortOrder || 0,
      isActive: isActive !== false
    });
    res.status(201).json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/categories/:id', auditAction('UPDATE', 'CATEGORY'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const category = await CategoryModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/categories/:id', auditAction('DELETE', 'CATEGORY'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await CategoryModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4 & 5. DIGITAL INVENTORY & LICENSE KEYS
// ==========================================
router.get('/inventory', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const products = await ProductModel.find()
      .populate('categoryId', 'name')
      .select('name slug productType deliveryMethod stockQuantity isUnlimitedStock salesCount');

    const licenseKeyCounts = await LicenseKeyModel.aggregate([
      {
        $group: {
          _id: { productId: '$productId', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, products, licenseKeyCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/license-keys', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId, status } = req.query;
    const query: any = {};
    if (productId) query.productId = productId;
    if (status) query.status = status;

    const keys = await LicenseKeyModel.find(query)
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, keys });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/license-keys/batch', auditAction('BATCH_UPLOAD', 'LICENSE_KEYS'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId, keys, notes } = req.body;
    if (!productId || !Array.isArray(keys) || keys.length === 0) {
      res.status(400).json({ success: false, message: 'Product ID and array of keys required' });
      return;
    }

    const inserted: any[] = [];
    let duplicates = 0;

    for (const key of keys) {
      const cleanKey = key.trim();
      if (!cleanKey) continue;
      try {
        const doc = await LicenseKeyModel.create({
          productId,
          licenseKey: cleanKey,
          status: 'AVAILABLE',
          notes
        });
        inserted.push(doc);
      } catch (err: any) {
        if (err.code === 11000) duplicates++;
      }
    }

    // Update product stock count
    const availableCount = await LicenseKeyModel.countDocuments({ productId, status: 'AVAILABLE' });
    await ProductModel.findByIdAndUpdate(productId, { stockQuantity: availableCount });

    res.json({
      success: true,
      message: `Successfully uploaded ${inserted.length} license keys (${duplicates} duplicates skipped)`,
      insertedCount: inserted.length,
      availableStock: availableCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. ORDER MANAGEMENT
// ==========================================
router.get('/orders', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '50' } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { telegramId: !isNaN(Number(search)) ? Number(search) : null }
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .populate('paymentId')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      OrderModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/orders/:id/status', auditAction('UPDATE_STATUS', 'ORDER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const order = await OrderModel.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 7. PAYMENT MANAGEMENT & KHQR MONITORING
// ==========================================
router.get('/payments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (search) query.transactionRef = { $regex: search, $options: 'i' };

    const payments = await PaymentModel.find(query)
      .populate('orderId', 'orderNumber status payableAmount')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 8. CUSTOMER MANAGEMENT
// ==========================================
router.get('/customers', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customers = await UserModel.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/customers/:id/toggle-block', auditAction('TOGGLE_BLOCK', 'USER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 9. COUPON MANAGEMENT
// ==========================================
router.get('/coupons', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const coupons = await CouponModel.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/coupons', auditAction('CREATE', 'COUPON'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const coupon = await CouponModel.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/coupons/:id', auditAction('DELETE', 'COUPON'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await CouponModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 10 & 11. TELEGRAM & BAKONG SETTINGS
// ==========================================
router.get('/settings/telegram', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let settings = await TelegramSettingsModel.findOne();
    if (!settings) {
      settings = await TelegramSettingsModel.create({
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        botUsername: 'DigitalStoreBot',
        miniAppUrl: 'http://localhost:3000/store'
      });
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings/telegram', auditAction('UPDATE', 'TELEGRAM_SETTINGS'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let settings = await TelegramSettingsModel.findOne();
    if (!settings) {
      settings = await TelegramSettingsModel.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/settings/bakong', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let settings = await BakongSettingsModel.findOne();
    if (!settings) {
      settings = await BakongSettingsModel.create({
        merchantId: 'devb_retail',
        merchantName: 'DIGITAL STORE PRO',
        merchantCity: 'Phnom Penh',
        bakongAccountId: 'devb_retail@devb',
        apiUrl: 'https://api-bakong.nbc.gov.kh/v1',
        isSandbox: true
      });
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings/bakong', auditAction('UPDATE', 'BAKONG_SETTINGS'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let settings = await BakongSettingsModel.findOne();
    if (!settings) {
      settings = await BakongSettingsModel.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 12 & 13. TRANSACTION & REVENUE REPORTS
// ==========================================
router.get('/reports/revenue', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transactions = await TransactionModel.find({ status: 'SUCCESS' }).sort({ createdAt: -1 });
    const monthlyRevenue = await TransactionModel.aggregate([
      { $match: { status: 'SUCCESS' } },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            currency: '$currency'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    res.json({ success: true, monthlyRevenue, recentTransactions: transactions.slice(0, 50) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 14 & 15. STAFF & ROLE MANAGEMENT
// ==========================================
router.get('/staff', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const staff = await AdminModel.find().populate('roleId').select('-passwordHash');
    res.json({ success: true, staff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/roles', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const roles = await RoleModel.find();
    res.json({ success: true, roles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 17. AUDIT LOGS
// ==========================================
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const logs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
