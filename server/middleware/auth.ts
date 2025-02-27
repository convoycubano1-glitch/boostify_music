import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

// Interface for the authenticated user
export interface AuthUser {
  uid: string;
  email?: string | null;
  role?: string;
  isAdmin?: boolean;
}

// Explicitly define the user interface to match our AuthUser
declare global {
  namespace Express {
    // This ensures our user property has the correct shape
    interface User extends AuthUser {}
  }
}

/**
 * Middleware to authenticate users using Firebase Authentication
 * Verifies the token from the Authorization header and attaches user data to the request
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is already authenticated via session
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      console.log('User authenticated via session:', req.user);
      return next();
    }

    // Check Firebase token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        // Verify the token using Firebase Admin SDK
        const decodedToken: DecodedIdToken = await auth.verifyIdToken(token);
        
        // Create a custom user object with necessary properties
        if (!decodedToken.uid) {
          console.error('Token decodificado sin UID válido:', decodedToken);
          return res.status(401).json({ error: 'Invalid authentication token - missing UID' });
        }
        
        const user: AuthUser = {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          role: decodedToken.role || 'artist',
          isAdmin: decodedToken.admin === true
        };
        
        // Log para asegurarnos que el UID está presente
        console.log('ID de usuario extraído del token:', decodedToken.uid);
        
        // Attach the user to the request
        req.user = user;
        
        console.log('User authenticated via Firebase token:', JSON.stringify(req.user));
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