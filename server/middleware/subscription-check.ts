import { Request, Response, NextFunction } from 'express';
import { AuthUser } from './auth';

type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';

/**
 * Middleware to check if a user has a specific subscription plan or higher
 * 
 * @param requiredPlan The minimum subscription plan required ('free', 'basic', 'pro', 'premium')
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

      // Map subscription plans to numeric values for easy comparison
      const planValues: Record<SubscriptionPlan, number> = {
        'free': 0,
        'basic': 1,
        'pro': 2,
        'premium': 3
      };

      const userPlanValue = planValues[subscription.plan] || 0;
      const requiredPlanValue = planValues[requiredPlan];

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

// Export a handler for premium features (shorthand for requireSubscription('premium'))
export const requirePremium = requireSubscription('premium');

// Export a handler for pro features (shorthand for requireSubscription('pro'))
export const requirePro = requireSubscription('pro');

// Export a handler for basic features (shorthand for requireSubscription('basic'))
export const requireBasic = requireSubscription('basic');