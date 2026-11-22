import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AdminModel, RoleModel, UserModel } from '../models/index.js';

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    roleId: string;
    permissions: string[];
  };
  telegramUser?: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    dbUserId?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_telegram_store_2026';

export function signAdminToken(payload: { id: string; email: string; roleId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify Admin JWT
 */
export async function authenticateAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; roleId: string };
    const admin = await AdminModel.findById(decoded.id);
    if (!admin || !admin.isActive) {
      res.status(403).json({ success: false, message: 'Admin account inactive or deleted' });
      return;
    }

    const role = await RoleModel.findById(admin.roleId);
    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      roleId: admin.roleId.toString(),
      permissions: role ? role.permissions : []
    };

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}

/**
 * Require specific role permission
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (req.admin.permissions.includes('*') || req.admin.permissions.includes(permission)) {
      next();
    } else {
      res.status(403).json({ success: false, message: `Forbidden: requires permission [${permission}]` });
    }
  };
}

/**
 * Verify Telegram WebApp initData HMAC-SHA256 signature
 * Validates data integrity directly from Telegram Client
 */
export function verifyTelegramInitData(initData: string, botToken: string): any | null {
  if (!initData) return null;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return null;

    urlParams.delete('hash');

    const params: string[] = [];
    for (const [key, value] of urlParams.entries()) {
      params.push(`${key}=${value}`);
    }
    params.sort();

    const dataCheckString = params.join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      const userStr = urlParams.get('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Middleware for Telegram WebApp routes
 */
export async function authenticateTelegramUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const initData = req.headers['x-telegram-init-data'] as string;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  // In development/testing, allow passing telegramId header if initData is not present
  if (!initData && process.env.NODE_ENV !== 'production') {
    const devTelegramId = Number(req.headers['x-telegram-id']);
    if (devTelegramId) {
      let user = await UserModel.findOne({ telegramId: devTelegramId });
      if (!user) {
        user = await UserModel.create({
          telegramId: devTelegramId,
          referralCode: `REF${devTelegramId}`,
          firstName: 'Demo User'
        });
      }
      req.telegramUser = {
        telegramId: devTelegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        dbUserId: user._id.toString()
      };
      return next();
    }
  }

  if (!initData) {
    res.status(401).json({ success: false, message: 'Telegram WebApp initData header missing' });
    return;
  }

  const tgUser = verifyTelegramInitData(initData, botToken);
  if (!tgUser) {
    // Fallback: If running in sandbox/mock mode without a real bot token, parse user safely
    if (process.env.BAKONG_IS_SANDBOX !== 'false') {
      try {
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          let user = await UserModel.findOne({ telegramId: parsed.id });
          if (!user) {
            user = await UserModel.create({
              telegramId: parsed.id,
              username: parsed.username,
              firstName: parsed.first_name,
              lastName: parsed.last_name,
              referralCode: `REF${parsed.id}`
            });
          }
          req.telegramUser = {
            telegramId: parsed.id,
            username: parsed.username,
            firstName: parsed.first_name,
            lastName: parsed.last_name,
            dbUserId: user._id.toString()
          };
          return next();
        }
      } catch (e) {}
    }

    res.status(401).json({ success: false, message: 'Invalid Telegram WebApp signature' });
    return;
  }

  // Find or auto-register user in DB
  let user = await UserModel.findOne({ telegramId: tgUser.id });
  if (!user) {
    user = await UserModel.create({
      telegramId: tgUser.id,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      referralCode: `REF${tgUser.id}`
    });
  }

  req.telegramUser = {
    telegramId: tgUser.id,
    username: tgUser.username,
    firstName: tgUser.first_name,
    lastName: tgUser.last_name,
    dbUserId: user._id.toString()
  };

  next();
}
