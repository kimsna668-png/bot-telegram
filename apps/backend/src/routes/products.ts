import { Router, Request, Response } from 'express';
import { ProductModel, CategoryModel } from '../models/index.js';

const router = Router();

/**
 * GET /api/products
 * List products with filtering, search, pagination
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, type, search, page = '1', limit = '20', sort = 'recommended' } = req.query;

    const query: any = { isActive: true };

    if (category) {
      // Find category by slug or id
      const cat = await CategoryModel.findOne({
        $or: [{ slug: category }, { _id: category.toString().match(/^[0-9a-fA-F]{24}$/) ? category : null }]
      });
      if (cat) {
        query.categoryId = cat._id;
      }
    }

    if (type) {
      query.productType = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions: any = {};
    if (sort === 'price_asc') sortOptions.priceUSD = 1;
    else if (sort === 'price_desc') sortOptions.priceUSD = -1;
    else if (sort === 'newest') sortOptions.createdAt = -1;
    else if (sort === 'popular') sortOptions.salesCount = -1;
    else sortOptions.createdAt = -1;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      ProductModel.find(query)
        .populate('categoryId', 'name slug icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      ProductModel.countDocuments(query)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/products/:identifier (slug or id)
 */
router.get('/:identifier', async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const query = isObjectId ? { _id: identifier, isActive: true } : { slug: identifier, isActive: true };
    const product = await ProductModel.findOne(query).populate('categoryId', 'name slug icon');

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
