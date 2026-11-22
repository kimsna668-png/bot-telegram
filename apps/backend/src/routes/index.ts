import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import productRoutes from './products.js';
import categoryRoutes from './categories.js';
import cartRoutes from './cart.js';
import orderRoutes from './orders.js';
import paymentRoutes from './payments.js';
import deliveryRoutes from './deliveries.js';
import couponRoutes from './coupons.js';
import adminRoutes from './admin.js';
import webhookRoutes from './telegramWebhook.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/deliveries', deliveryRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/telegram/webhook', webhookRoutes);

export default apiRouter;
