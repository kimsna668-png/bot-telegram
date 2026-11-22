import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './auth.js';
import { AuditLogModel } from '../models/index.js';

export function auditAction(action: string, entity: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Intercept finish to record log after successful response
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await AuditLogModel.create({
            adminId: req.admin?.id,
            adminEmail: req.admin?.email,
            telegramId: req.telegramUser?.telegramId,
            action,
            entity,
            entityId: req.params?.id || req.body?.id,
            details: {
              method: req.method,
              url: req.originalUrl,
              body: req.body ? { ...req.body, password: '[REDACTED]' } : undefined
            },
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent')
          });
        } catch (err) {
          console.error('[AuditLog] Error recording audit log:', err);
        }
      }
    });

    next();
  };
}
