import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { clerkClient, getAuth, requireAuth as clerkRequireAuth } from '@clerk/express';

export interface ClerkAuthUser {
  clerkUserId: string;
  id: string; // alias for compatibility with old code expecting req.user.id
  email?: string;
}

/**
 * Middleware that attaches Clerk user info to req.user if present.
 * Does NOT block unauthenticated requests (use isAuthenticated for that).
 */
export async function clerkAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authData = getAuth(req);
    
    if (!authData || !authData.userId) {
      // No auth – continue without user
      return next();
    }

    const userId = authData.userId;
    let email: string | undefined = undefined;
    try {
      const user = await clerkClient.users.getUser(userId);
      email = user?.emailAddresses?.[0]?.emailAddress;
    } catch (_) {}

    // Attach user info to request (id = clerkUserId for backward compat)
    (req as any).user = { clerkUserId: userId, id: userId, email } as ClerkAuthUser;
    return next();
  } catch (err) {
    console.error('Clerk auth middleware error:', err);
    return next();
  }
}

/**
 * Guard middleware: rejects request with 401 if no valid Clerk user.
 * Use after clerkAuthMiddleware or standalone.
 */
export const isAuthenticated: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const authData = getAuth(req);
  if (!authData || !authData.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Ensure req.user is set
  if (!(req as any).user) {
    (req as any).user = { clerkUserId: authData.userId, id: authData.userId } as ClerkAuthUser;
  }
  
  return next();
};

/**
 * Alias for isAuthenticated (drop-in replacement for old replitAuth export).
 */
export const requireAuth = isAuthenticated;

/**
 * Helper to get current user id from request (returns clerkUserId).
 */
export function getUserId(req: Request): string | null {
  const user = (req as any).user as ClerkAuthUser | undefined;
  return user?.clerkUserId ?? null;
}

/**
 * Check if the current user is an admin (by email).
 */
export function isAdmin(req: Request): boolean {
  const user = (req as any).user as ClerkAuthUser | undefined;
  return user?.email === 'convoycubano@gmail.com';
}
