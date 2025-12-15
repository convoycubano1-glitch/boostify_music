import { Request, Response, NextFunction } from 'express';
import { AuthUser } from './auth';

// Soporta AMBAS nomenclaturas para compatibilidad:
// - Nueva: free, creator, professional, enterprise  
// - Legacy: free, basic, pro, premium
type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium' | 'creator' | 'professional' | 'enterprise';

// Mapeo de nomenclatura para normalizar planes
const PLAN_MAPPING: Record<string, string> = {
  'basic': 'creator',
  'pro': 'professional',
  'premium': 'enterprise',
  'free': 'free',
  'creator': 'creator',
  'professional': 'professional',
  'enterprise': 'enterprise'
};

/**
 * Middleware to check if a user has a specific subscription plan or higher
 * Soporta ambas nomenclaturas (legacy y nueva)
 * 
 * @param requiredPlan The minimum subscription plan required
 * @returns Middleware function that checks the user's subscription
 */
export function requireSubscription(requiredPlan: SubscriptionPlan = 'free') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // If no authentication, deny access
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      // Admin users always have access
      if (req.user.isAdmin === true) {
        return next();
      }

      // Check if email is admin email (convoycubano@gmail.com)
      if (req.user.email === 'convoycubano@gmail.com') {
        return next();
      }

      // Get user subscription information
      const user = req.user as AuthUser;
      const subscription = user.subscription;

      // If no subscription info, assign free plan
      if (!subscription) {
        if (requiredPlan === 'free') {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Subscription required',
            requiredPlan: requiredPlan,
            currentPlan: 'free'
          });
        }
      }

      // Check if subscription is active
      if (!subscription.active) {
        if (requiredPlan === 'free') {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Active subscription required',
            requiredPlan: requiredPlan,
            currentPlan: 'free'
          });
        }
      }

      // Map subscription plans to numeric values (usando nomenclatura normalizada)
      const planValues: Record<string, number> = {
        'free': 0,
        'creator': 1,
        'basic': 1,      // Legacy alias
        'professional': 2,
        'pro': 2,        // Legacy alias
        'enterprise': 3,
        'premium': 3     // Legacy alias
      };

      // Normalizar planes
      const normalizedUserPlan = PLAN_MAPPING[subscription.plan] || subscription.plan;
      const normalizedRequiredPlan = PLAN_MAPPING[requiredPlan] || requiredPlan;
      
      const userPlanValue = planValues[normalizedUserPlan] || 0;
      const requiredPlanValue = planValues[normalizedRequiredPlan] || 0;

      // Check if user's plan meets or exceeds the required plan
      if (userPlanValue >= requiredPlanValue) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Higher subscription plan required',
          requiredPlan: requiredPlan,
          currentPlan: subscription.plan
        });
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error during subscription check',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// Export handlers for premium features (shortcuts)
export const requirePremium = requireSubscription('premium');
export const requireEnterprise = requireSubscription('enterprise');
export const requireProfessional = requireSubscription('professional');
export const requireCreator = requireSubscription('creator');

// Export a handler for pro features (shorthand for requireSubscription('pro'))
export const requirePro = requireSubscription('pro');

// Export a handler for basic features (shorthand for requireSubscription('basic'))
export const requireBasic = requireSubscription('basic');