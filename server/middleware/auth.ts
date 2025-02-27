import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

// Interface for the authenticated user
export interface AuthUser {
  uid?: string;   // Para autenticación Firebase
  id?: string;    // Para autenticación de sesión
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
    if (req.session && req.session.user) {
      console.log('User authenticated via session:', req.session.user);
      req.user = req.session.user;
      return next();
    }
    
    // Check Firebase token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      // Handle both "Bearer token" and plain token formats
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;
      
      try {
        console.log('Verifying Firebase token...');
        const decodedToken: DecodedIdToken = await auth.verifyIdToken(token);
        console.log('Token verified successfully for UID:', decodedToken.uid);
        
        const user: AuthUser = {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          role: decodedToken.role || 'artist',
          isAdmin: decodedToken.admin === true
        };
        
        req.user = user;
        
        // Also store in session for future requests
        if (req.session) {
          req.session.user = user;
        }
        
        return next();
      } catch (error) {
        console.error('Failed to verify Firebase token:', error);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid authentication token', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    } else {
      console.error('No authorization header found in request');
    }
    
    // Neither session nor token authentication worked
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}