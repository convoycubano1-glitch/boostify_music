import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Check session first
    if (req.isAuthenticated() && req.user) {
      console.log('User authenticated via session:', req.user);
      return next();
    }

    // Check Firebase token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          role: 'artist'
        };
        console.log('User authenticated via Firebase token:', req.user);
        return next();
      } catch (error) {
        console.error('Error verifying Firebase token:', error);
      }
    }

    console.log('Authentication failed - no valid session or token');
    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}