import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { FIREBASE_CONFIG } from "./env";

console.log('Starting Firebase initialization...');

// Initialize Firebase with error handling
let app;
let auth;
let db;
let storage;
let analytics = null;

try {
  app = initializeApp(FIREBASE_CONFIG);
  console.log('Firebase app initialized successfully');

  try {
    auth = getAuth(app);
    console.log('Firebase Auth initialized');
  } catch (authError) {
    console.error('Error initializing Firebase Auth:', authError);
  }

  try {
    db = getFirestore(app);
    console.log('Firestore initialized');
  } catch (dbError) {
    console.error('Error initializing Firestore:', dbError);
  }

  try {
    storage = getStorage(app);
    console.log('Firebase Storage initialized');
  } catch (storageError) {
    console.error('Error initializing Firebase Storage:', storageError);
  }

  // Only initialize analytics in production and when available
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } catch (analyticsError) {
      console.warn('Analytics initialization skipped:', analyticsError);
    }
  }
} catch (error) {
  console.error('Critical error initializing Firebase:', error);
}

// Export initialized services
export { app, auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage, analytics as firebaseAnalytics };

// Contract related functions
export interface Contract {
  id: string;
  title: string;
  type: string;
  content: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  userId: string;
}

export async function getAuthToken(): Promise<string | null> {
  const currentUser = auth?.currentUser;
  if (!currentUser) return null;

  try {
    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function saveContract(contractData: {
  title: string;
  type: string;
  content: string;
  status: string;
}): Promise<Contract> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    const contractsRef = collection(db, 'contracts');
    const newContract = {
      ...contractData,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(contractsRef, newContract);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Error creating contract - document does not exist');
    }

    const savedContract = {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: new Date(),
    } as Contract;

    return savedContract;
  } catch (error: any) {
    throw new Error(error.message || 'Error saving contract');
  }
}

export async function getUserContracts(): Promise<Contract[]> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    const contractsRef = collection(db, 'contracts');
    const q = query(
      contractsRef,
      where('userId', '==', currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const contracts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Contract[];

    contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return contracts;
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching contracts');
  }
}

export async function deleteContract(contractId: string): Promise<void> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    const docRef = doc(db, 'contracts', contractId);
    await deleteDoc(docRef);
  } catch (error: any) {
    throw new Error(error.message || 'Error deleting contract');
  }
}

export async function updateContract(contractId: string, updates: Partial<Contract>): Promise<void> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    const docRef = doc(db, 'contracts', contractId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    throw new Error(error.message || 'Error updating contract');
  }
}