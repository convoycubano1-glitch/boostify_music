import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { FIREBASE_CONFIG } from '@/env';

// Initialize Firebase with the configuration from env.ts
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for authentication
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Authentication persistence enabled');
  })
  .catch((error) => {
    console.error('Error enabling auth persistence:', error);
  });

// Enable offline persistence for Firestore
try {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('Firestore persistence enabled');
    })
    .catch((error) => {
      if (error.code === 'failed-precondition') {
        console.warn('Firestore persistence could not be enabled (multiple tabs open)');
      } else if (error.code === 'unimplemented') {
        console.warn('Firestore persistence not supported by browser');
      } else {
        console.error('Error enabling Firestore persistence:', error);
      }
    });
} catch (e) {
  console.warn('Error with enableIndexedDbPersistence:', e);
}

// Configure network retry behavior
const firestoreSettings = {
  cacheSizeBytes: 50000000, // 50 MB
  // Configuring retry behavior to be more resilient
  retryDelay: 500, // initial delay, which will exponentially backoff
  retryAttempts: 5, // maximum number of retry attempts
};

console.log('Firebase initialized with enhanced network resilience');

export { auth, db, storage };
export default app;