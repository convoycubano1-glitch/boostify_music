import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

// Subscription interface
export interface Subscription {
  plan: 'free' | 'basic' | 'pro' | 'premium';
  active: boolean;
  customerId?: string;
  subscriptionId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

// Interface for the authenticated user
export interface AuthUser {
  uid?: string;   // Para autenticación Firebase
  id?: string;    // Para autenticación de sesión
  email?: string | null;
  role?: string;
  isAdmin?: boolean;
  subscription?: Subscription;
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
        
        // Check if user is the admin (convoycubano@gmail.com)
        const isAdmin = decodedToken.email === 'convoycubano@gmail.com' || decodedToken.admin === true;
        
        // Get subscription info from Firestore
        let subscriptionInfo: Subscription | undefined = undefined;
        
        try {
          // Import here to avoid circular dependency
          const { getDocById } = await import('../utils/firestore-helpers');
          
          // Get user document from Firestore
          const userDoc = await getDocById('users', decodedToken.uid);
          
          // Extract subscription information if available
          if (userDoc && userDoc.subscription) {
            subscriptionInfo = {
              plan: userDoc.subscription.plan || 'free',
              active: userDoc.subscription.active === true,
              customerId: userDoc.subscription.customerId,
              subscriptionId: userDoc.subscription.subscriptionId,
              currentPeriodEnd: userDoc.subscription.currentPeriodEnd,
              cancelAtPeriodEnd: userDoc.subscription.cancelAtPeriodEnd
            };
          }
        } catch (err) {
          console.error('Error fetching subscription data:', err);
          // Continue without subscription data
        }
        
        // Admin gets premium subscription by default
        if (isAdmin && !subscriptionInfo) {
          subscriptionInfo = {
            plan: 'premium',
            active: true
          };
        }
        
        const user: AuthUser = {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          role: isAdmin ? 'admin' : (decodedToken.role || 'artist'),
          isAdmin: isAdmin,
          subscription: subscriptionInfo
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