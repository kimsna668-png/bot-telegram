import { Router, Request, Response } from 'express';
import { CategoryModel } from '../models/index.js';

const router = Router();

/**
 * GET /api/categories
 * List active categories
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await CategoryModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/categories/:slug
 */
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = await CategoryModel.findOne({ slug: req.params.slug, isActive: true });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    res.json({ success: true, category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
