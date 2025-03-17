import { auth } from './firebase';
import { type Express, type Request, type Response, type NextFunction } from "express";
import session from 'express-session';
import passport from 'passport';

// Define User interface para resolver problemas de tipado
interface User {
  uid: string;
  id: string;
  role: string;
}

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
      uid: decodedToken.uid,
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

  // Apply authentication middleware to all /api routes except webhook and chat completions
  app.use('/api', (req, res, next) => {
    console.log('DEBUG - Middleware Auth - Path:', req.path);
    // Lista de rutas públicas que no requieren autenticación
    // Nota: req.path no incluye '/api' porque eso está en el app.use('/api')
    const publicRoutes = [
      '/stripe-webhook',
      '/webhook',
      '/chat/completions',    // Ruta de chat para permitir el acceso sin autenticación
      '/task/status',         // Ruta para verificar el estado de tareas asíncronas
      '/video/generate',      // Ruta para generar videos
      '/video/status',        // Ruta para verificar el estado de videos
      '/stripe/publishable-key', // Ruta pública para obtener la clave publicable de Stripe
      '/subscription-plans',  // Ruta pública para obtener información sobre planes de suscripción
      '/stripe/create-product-payment', // Ruta pública para crear sesiones de pago de productos
      '/stripe/test-guest-checkout', // Ruta de prueba para verificar la integración de compras sin autenticación
      '/affiliate/register',  // Ruta para registrarse como afiliado (temporal para desarrollo)
      '/affiliate/me',        // Ruta para obtener información del afiliado (temporal para desarrollo)
    ];
    
    // Patrones de rutas públicas que se verifican con startsWith
    const publicRoutePatterns = [
      '/stripe/product-purchase-status', // Rutas para verificar estado de compra de productos (sin / al final)
    ];
    
    // Añadir soporte para coincidencia parcial de rutas públicas
    // Verificar si la ruta actual está en la lista de rutas públicas
    // o comienza con alguna de las rutas públicas parciales definidas
    console.log('DEBUG - Ruta solicitada:', req.path, 'Está en publicRoutes:', publicRoutes.includes(req.path));
    // Verificar si la ruta está en la lista de rutas públicas exactas
    // o si comienza con alguno de los patrones de rutas públicas
    const isPublicExactRoute = publicRoutes.includes(req.path);
    const isPublicPatternRoute = publicRoutePatterns.some(pattern => req.path.startsWith(pattern));
    const isProxyRoute = req.path.startsWith('/proxy/');
    
    if (isPublicExactRoute || isPublicPatternRoute || isProxyRoute) {
      console.log('Ruta pública accedida sin autenticación:', req.path);
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
      done(null, { id: userRecord.uid, uid: userRecord.uid, role: 'artist' });
    } catch (error) {
      done(error);
    }
  });
}