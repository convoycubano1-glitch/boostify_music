import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, getIdToken } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDYrcJmOIiDpwBE5YItA9s3HdDQimSgOwI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "artist-boost.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "artist-boost",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "artist-boost.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "552590586602",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:552590586602:web:8e17377b95ed9ca9066c3a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MCPNLJYJFJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

/**
 * Gets the current user's authentication token
 * @returns A promise that resolves to the current user's ID token, or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    return await getIdToken(user);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export { db, auth, storage };
export default app;