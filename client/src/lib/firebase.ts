/**
 * Cliente de Firebase para uso en el frontend
 * Versión mejorada: previene inicialización múltiple
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, getIdToken } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase disponible en las variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Inicializar la aplicación de Firebase solo si no existe ya
// Esto previene el error de "app/duplicate-app"
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializar servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Función para obtener el token de autenticación
export async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('No hay usuario autenticado para obtener token');
      return null;
    }
    
    return await getIdToken(currentUser, true);
  } catch (error) {
    console.error('Error al obtener el token de autenticación:', error);
    return null;
  }
}

// Habilitar persistencia para funcionamiento offline
if (getApps().length === 1) { // Solo intentar una vez durante la inicialización inicial
  try {
    enableMultiTabIndexedDbPersistence(db)
      .then(() => {
        console.log('Firestore initialized with enhanced persistence');
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Probablemente múltiples pestañas abiertas
          console.log('Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          // Navegador no compatible
          console.log('Persistence not available in this browser');
        } else {
          console.error('Error enabling Firestore persistence:', err);
        }
      });
  } catch (error) {
    console.warn('Could not enable Firestore persistence:', error);
  }
}

export default app;