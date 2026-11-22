import { Router, Request, Response } from 'express';
import { PaymentModel, OrderModel } from '../models/index.js';
import { PaymentService } from '../services/payment/PaymentService.js';
import { paymentRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * GET /api/payments/status/:transactionRef
 * Check current payment and order status
 */
router.get('/status/:transactionRef', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionRef } = req.params;
    const payment = await PaymentModel.findOne({ transactionRef });
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    const order = await OrderModel.findById(payment.orderId);

    res.json({
      success: true,
      payment: {
        transactionRef: payment.transactionRef,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        qrExpiresAt: payment.qrExpiresAt,
        provider: payment.provider
      },
      order: order ? {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        deliveryStatus: order.deliveryStatus
      } : null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/payments/verify/:transactionRef
 * Trigger authoritative server-side verification against Bakong network
 */
router.post('/verify/:transactionRef', paymentRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionRef } = req.params;
    const paymentService = PaymentService.getInstance();
    const result = await paymentService.verifyAndConfirmPayment(transactionRef);

    res.json({
      success: result.isPaid,
      verification: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/payments/sandbox-simulate-approval/:transactionRef
 * [SANDBOX ONLY] Simulate customer completing payment in ABA/Wing/Bakong app
 */
router.post('/sandbox-simulate-approval/:transactionRef', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionRef } = req.params;
    const paymentService = PaymentService.getInstance();

    const isSandboxActive = paymentService.getActiveProvider().name === 'SANDBOX_KHQR';
    if (!isSandboxActive) {
      res.status(403).json({
        success: false,
        message: 'Sandbox simulation is disabled when connected to live Bakong network'
      });
      return;
    }

    const approved = paymentService.sandboxProvider.simulateBankPaymentApproval(transactionRef);
    if (!approved) {
      res.status(404).json({ success: false, message: 'Sandbox payment transaction not found' });
      return;
    }

    // Immediately trigger server-side verification and order completion
    const verification = await paymentService.verifyAndConfirmPayment(transactionRef);

    res.json({
      success: true,
      message: '[SANDBOX] Simulated bank payment approved and verified',
      verification
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
