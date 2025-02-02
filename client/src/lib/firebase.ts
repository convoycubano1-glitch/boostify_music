import { initializeApp } from "firebase/app";
import { getAuth, type User } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

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

// Save contract to Firestore
export async function saveContract(contractData: {
  title: string;
  type: string;
  content: string;
  status: string;
}): Promise<Contract> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User not authenticated');

  try {
    const docRef = await addDoc(collection(db, 'contracts'), {
      ...contractData,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    });

    const newContract = await getDoc(docRef);
    return {
      id: newContract.id,
      ...newContract.data()
    } as Contract;
  } catch (error) {
    console.error('Error saving contract:', error);
    throw error;
  }
}

// Get user's contracts
export async function getUserContracts(): Promise<Contract[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User not authenticated');

  try {
    const q = query(
      collection(db, 'contracts'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Contract[];
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
}

// Get a single contract
export async function getContract(contractId: string): Promise<Contract | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User not authenticated');

  try {
    const docRef = doc(db, 'contracts', contractId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().userId === currentUser.uid) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Contract;
    }
    return null;
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
}

export { analytics };