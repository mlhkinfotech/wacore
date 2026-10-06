import type { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string;
}

export const createRateLimiter = (options: RateLimitOptions = {}) => {
  const windowMs = options.windowMs || 60000;
  const max = options.max || 60;
  const message = options.message || 'Too many requests, please try again later.';
  const hits = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const client = hits.get(ip);

    if (!client || now > client.resetTime) {
      hits.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    client.count++;
    if (client.count > max) {
      res.status(429).json({ success: false, error: message });
      return;
    }

    next();
  };
};
