import { auth } from './firebase';
import { type Express, type Request, type Response, type NextFunction } from "express";

// Middleware to check if the request is authenticated
async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function setupAuth(app: Express) {
  app.use('/api/*', isAuthenticated);
}