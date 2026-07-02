import type { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { findUserById } from '../repositories/index.js';
import { AppError, type AuthenticatedRequest } from '../lib/errors.js';

export async function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing authorization token');
    }
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);
    if (!user || !user.active) {
      throw new AppError(401, 'UNAUTHORIZED', 'User not found or inactive');
    }
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Not authenticated'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}
