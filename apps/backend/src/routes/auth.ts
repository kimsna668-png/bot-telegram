import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AdminModel, RoleModel } from '../models/index.js';
import { signAdminToken, authenticateAdmin, type AuthenticatedRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/auth/login
 * Admin authentication
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const admin = await AdminModel.findOne({ email: email.toLowerCase() });
    if (!admin) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated' });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const role = await RoleModel.findById(admin.roleId);
    const token = signAdminToken({
      id: admin._id.toString(),
      email: admin.email,
      roleId: admin.roleId.toString()
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: role?.name || 'Staff',
        permissions: role?.permissions || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current admin session info
 */
router.get('/me', authenticateAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = await AdminModel.findById(req.admin!.id).select('-passwordHash');
    if (!admin) {
      res.status(404).json({ success: false, message: 'Admin not found' });
      return;
    }

    const role = await RoleModel.findById(admin.roleId);
    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: role?.name,
        permissions: role?.permissions || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
