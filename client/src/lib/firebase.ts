import { initializeApp } from "firebase/app";
import { getAuth, type User } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import type { ContractFormValues } from "@/components/contracts/contract-form";

const firebaseConfig = {
  apiKey: "AIzaSyBzkhBNdrQVU0gCUgI31CzlKbSkKG4_iG8",
  authDomain: "artist-boost.firebaseapp.com",
  projectId: "artist-boost",
  storageBucket: "artist-boost.firebasestorage.app",
  messagingSenderId: "502955771825",
  appId: "1:502955771825:web:d6746677d851f9b1449f90",
  measurementId: "G-ERCSSWTXCJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with persistent cache silently
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

let analytics = null;
if (import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

export async function getAuthToken(): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const token = await currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export interface Contract {
  id: string;
  title: string;
  type: string;
  content: string;
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  userId: string;
}

export async function saveContract(contractData: {
  title: string;
  type: string;
  content: string;
  status: string;
}): Promise<Contract> {
  const currentUser = auth.currentUser;
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
  const currentUser = auth.currentUser;
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

export async function getContract(contractId: string): Promise<Contract | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  try {
    const docRef = doc(db, 'contracts', contractId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().userId === currentUser.uid) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      } as Contract;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Error fetching contract');
  }
}

export async function deleteContract(contractId: string): Promise<void> {
  const currentUser = auth.currentUser;
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
  const currentUser = auth.currentUser;
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

export { analytics };