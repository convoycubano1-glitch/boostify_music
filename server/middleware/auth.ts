import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Niveles de suscripción disponibles, ordenados por jerarquía
 * - free: Acceso básico sin pago
 * - basic: Plan básico ($59.99/mes)
 * - pro: Plan profesional ($99.99/mes)
 * - premium: Plan premium ($149.99/mes)
 */
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';

/**
 * Jerarquía de niveles de suscripción para comparaciones de acceso
 * Un nivel mayor incluye todos los permisos de los niveles inferiores
 */
export const SUBSCRIPTION_LEVELS: Record<SubscriptionPlan, number> = {
  'free': 0,
  'basic': 1,
  'pro': 2,
  'premium': 3
};

// Subscription interface
export interface Subscription {
  plan: SubscriptionPlan;
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
 * @param req Express request
 * @param res Express response
 * @param next Next function
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

/**
 * Middleware para verificar que el usuario tenga al menos un nivel de suscripción específico
 * Protege rutas para que solo sean accesibles con la suscripción adecuada o superior
 * 
 * @param requiredPlan Nivel mínimo de suscripción requerido ('basic', 'pro', 'premium')
 * @returns Middleware de Express
 */
export function requireSubscription(requiredPlan: SubscriptionPlan) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Si no hay usuario autenticado, responder con error 401
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // El administrador (convoycubano@gmail.com) siempre tiene acceso completo
    if (req.user.isAdmin || req.user.email === 'convoycubano@gmail.com') {
      return next();
    }

    // Verificar si el usuario tiene una suscripción activa
    const userSubscription = req.user.subscription;
    if (!userSubscription || !userSubscription.active) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required',
        requiredPlan: requiredPlan
      });
    }

    // Obtener niveles numéricos para comparación
    const userLevel = SUBSCRIPTION_LEVELS[userSubscription.plan];
    const requiredLevel = SUBSCRIPTION_LEVELS[requiredPlan];

    // Verificar si el nivel de suscripción del usuario es suficiente
    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Subscription level ${requiredPlan} or higher required`,
        currentPlan: userSubscription.plan,
        requiredPlan: requiredPlan
      });
    }

    // Usuario tiene el nivel requerido, continuar
    return next();
  };
}