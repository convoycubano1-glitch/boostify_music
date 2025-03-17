
// Firebase module patch to resolve ESM/CJS issues
import * as firebaseOriginal from 'firebase/app';
import * as authOriginal from 'firebase/auth';
import * as firestoreOriginal from 'firebase/firestore';
import * as storageOriginal from 'firebase/storage';
import * as analyticsOriginal from 'firebase/analytics';

// Re-export with explicit named exports
export const initializeApp = firebaseOriginal.initializeApp;
export const getApp = firebaseOriginal.getApp;
export const getApps = firebaseOriginal.getApps;
export const deleteApp = firebaseOriginal.deleteApp;

// Auth exports
export const getAuth = authOriginal.getAuth;
export const signInWithEmailAndPassword = authOriginal.signInWithEmailAndPassword;
export const createUserWithEmailAndPassword = authOriginal.createUserWithEmailAndPassword;
export const signOut = authOriginal.signOut;
export const onAuthStateChanged = authOriginal.onAuthStateChanged;

// Firestore exports
export const getFirestore = firestoreOriginal.getFirestore;
export const collection = firestoreOriginal.collection;
export const doc = firestoreOriginal.doc;
export const getDoc = firestoreOriginal.getDoc;
export const getDocs = firestoreOriginal.getDocs;
export const setDoc = firestoreOriginal.setDoc;
export const updateDoc = firestoreOriginal.updateDoc;
export const deleteDoc = firestoreOriginal.deleteDoc;
export const addDoc = firestoreOriginal.addDoc;
export const query = firestoreOriginal.query;
export const where = firestoreOriginal.where;
export const orderBy = firestoreOriginal.orderBy;
export const limit = firestoreOriginal.limit;

// Storage exports
export const getStorage = storageOriginal.getStorage;
export const ref = storageOriginal.ref;
export const uploadBytes = storageOriginal.uploadBytes;
export const getDownloadURL = storageOriginal.getDownloadURL;
export const deleteObject = storageOriginal.deleteObject;

// Analytics exports
export const getAnalytics = analyticsOriginal.getAnalytics;
export const logEvent = analyticsOriginal.logEvent;

// Default export for compatibility
export default firebaseOriginal;
