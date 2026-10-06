import type { Request, Response, NextFunction } from 'express';

export const createAuthMiddleware = (expectedToken?: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // If no token is set in config, bypass (public development mode)
    if (!expectedToken) {
      return next();
    }

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const waToken = req.headers['x-wa-token'] as string;
    const queryToken = req.query.token as string;

    const provided = bearerToken || waToken || queryToken;

    if (provided && provided === expectedToken) {
      return next();
    }

    res.status(401).json({
      success: false,
      error: 'Unauthorized. Invalid or missing API token.'
    });
  };
};
