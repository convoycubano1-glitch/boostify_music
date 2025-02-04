import { auth } from './firebase';
import { type Express, type Request, type Response, type NextFunction } from "express";
import session from 'express-session';
import passport from 'passport';

// Middleware to check if the request is authenticated
async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  // First check if user is authenticated through session
  if (req.isAuthenticated()) {
    return next();
  }

  // If no session, check for Firebase token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      id: decodedToken.uid,
      role: 'artist'
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

export function setupAuth(app: Express) {
  // Initialize session middleware
  app.use(session({
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Apply authentication middleware to all /api routes except webhook
  app.use('/api/*', (req, res, next) => {
    if (req.path === '/api/stripe-webhook' || req.path === '/api/webhook') {
      return next();
    }
    return isAuthenticated(req, res, next);
  });

  // Serialize user for the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const userRecord = await auth.getUser(id);
      done(null, { id: userRecord.uid, role: 'artist' });
    } catch (error) {
      done(error);
    }
  });
}