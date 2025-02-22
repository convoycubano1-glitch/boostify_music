import { Request, Response, NextFunction } from 'express';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Add debug logging
  console.log('Auth middleware - Session:', req.session);
  console.log('Auth middleware - Is authenticated:', req.isAuthenticated());
  console.log('Auth middleware - User:', req.user);

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}