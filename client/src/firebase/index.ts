/**
 * Firebase module - Main Implementation
 * This file directly exports the Firebase configuration and services
 */
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB20g_qBPHmYbYvF-Mi-tktBw3IaSKjGKE",
  authDomain: "artist-boost.firebaseapp.com",
  projectId: "artist-boost",
  storageBucket: "artist-boost.appspot.com",
  messagingSenderId: "498508895907",
  appId: "1:498508895907:web:bef50dc0b37e29d630ffda",
  measurementId: "G-JVX65RSBFK"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Export initialized app
export const firebaseApp = app;