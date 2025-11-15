/**
 * Firebase Auth with Replit Auth Integration
 * 
 * Este módulo permite que usuarios autenticados con Replit Auth
 * también se autentiquen en Firebase para usar Firestore y Storage
 * manteniendo las reglas de seguridad actuales.
 */

import { auth } from '../firebase';
import { signInWithCustomToken } from 'firebase/auth';

let authInitialized = false;

/**
 * Autentica al usuario en Firebase usando su sesión de Replit Auth
 * Esto genera un Custom Token en el servidor y lo usa para autenticar en Firebase
 */
export async function authenticateWithFirebase(): Promise<boolean> {
  try {
    // Si ya está autenticado en Firebase, no hacer nada
    if (auth.currentUser && authInitialized) {
      return true;
    }

    // Obtener el Custom Token del servidor (requiere estar autenticado con Replit)
    const response = await fetch('/api/firebase-token', {
      credentials: 'include' // Incluir cookies de sesión
    });

    if (!response.ok) {
      console.error('Failed to get Firebase token:', response.status);
      return false;
    }

    const data = await response.json();
    
    if (!data.success || !data.token) {
      console.error('Invalid token response:', data);
      return false;
    }

    // Autenticar en Firebase con el Custom Token
    await signInWithCustomToken(auth, data.token);
    authInitialized = true;
    
    console.log('✅ Authenticated with Firebase using Replit Auth');
    return true;

  } catch (error) {
    console.error('Error authenticating with Firebase:', error);
    return false;
  }
}

/**
 * Hook para usar en componentes que requieren autenticación de Firebase
 * Llama a esta función cuando el componente se monte
 */
export async function ensureFirebaseAuth(): Promise<void> {
  if (authInitialized && auth.currentUser) {
    return;
  }

  const success = await authenticateWithFirebase();
  
  if (!success) {
    console.warn('Firebase authentication failed - some features may not work');
  }
}
