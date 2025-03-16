/**
 * Firebase client for frontend use
 * Enhanced version with improved error handling and persistence
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getAuth, getIdToken } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase app only if it doesn't exist already
// This prevents the "app/duplicate-app" error
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistence settings only if it hasn't been initialized yet
let firestoreDb;
try {
  // Try to get existing Firestore instance
  firestoreDb = getFirestore(app);
  console.log('Using existing Firestore instance');
} catch (error) {
  // If it doesn't exist, initialize with persistence settings
  console.log('Initializing Firestore with persistence settings');
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });
}

// Export the Firestore instance
export const db = firestoreDb;

// Initialize other services
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize persistence with error handling
async function initializePersistence() {
  try {
    console.log('Enabling Firestore persistence...');
    await enableIndexedDbPersistence(db);
    console.log('Firestore persistence enabled successfully');
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in only one tab at a time.');
      // Handle the "failed-precondition" error by using a different persistence strategy
      try {
        await enableMultiTabIndexedDbPersistence(db);
        console.log('Multi-tab persistence enabled as fallback');
      } catch (fallbackError) {
        console.error('Could not enable multi-tab persistence either:', fallbackError);
      }
    } else if (error.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    } else {
      console.error('Unexpected error when enabling persistence:', error);
    }
  }
}

// Start persistence initialization
initializePersistence().catch(err => {
  console.error('Failed to initialize persistence:', err);
});

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

console.log('Firebase initialized with enhanced network resilience and multi-tab support');

export default app;