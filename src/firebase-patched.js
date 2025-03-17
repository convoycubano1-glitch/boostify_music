
// Firebase module patch to resolve ESM/CJS issues and type definitions
import * as firebaseOriginal from 'firebase/app';
import * as authOriginal from 'firebase/auth';
import * as firestoreOriginal from 'firebase/firestore';
import * as storageOriginal from 'firebase/storage';
import * as analyticsOriginal from 'firebase/analytics';

// Re-export with explicit named exports and type handling
export const { 
  initializeApp, 
  getApp, 
  getApps, 
  deleteApp 
} = firebaseOriginal;

// Auth exports
export const {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} = authOriginal;

// Firestore exports with proper type handling
export const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  CollectionReference
} = firestoreOriginal;

// Storage exports
export const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} = storageOriginal;

// Analytics exports
export const {
  getAnalytics,
  logEvent
} = analyticsOriginal;

export default firebaseOriginal;
