import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/telegram/webhook
 * Webhook receiver for Telegram Bot updates
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Acknowledge Telegram updates immediately
    res.status(200).json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ ok: false });
  }
});

/**
 * GET /api/telegram/webhook/health
 */
router.get('/health', (req: Request, res: Response): void => {
  res.json({ ok: true, status: 'Telegram webhook receiver ready' });
});

export default router;
