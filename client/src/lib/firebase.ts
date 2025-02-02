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
  serverTimestamp,
  enableIndexedDbPersistence 
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
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.error('Firebase persistence error:', err);
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

// Save contract to Firestore with better error handling
export async function saveContract(contractData: {
  title: string;
  type: string;
  content: string;
  status: string;
}): Promise<Contract> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Reference to the contracts collection
    const contractsRef = collection(db, 'contracts');

    // Add the document with proper typing
    const docRef = await addDoc(contractsRef, {
      ...contractData,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    });

    // Get the newly created document
    const newContract = await getDoc(docRef);

    if (!newContract.exists()) {
      throw new Error('Error al crear el contrato');
    }

    // Return the contract data with proper typing
    return {
      id: newContract.id,
      ...newContract.data(),
      createdAt: new Date(), // Convert timestamp to Date
    } as Contract;
  } catch (error: any) {
    console.error('Error saving contract:', error);
    throw new Error(error.message || 'Error al guardar el contrato');
  }
}

// Get user's contracts with better error handling
export async function getUserContracts(): Promise<Contract[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    // Create a query against the collection
    const q = query(
      collection(db, 'contracts'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(), // Convert timestamp to Date
    })) as Contract[];
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    throw new Error(error.message || 'Error al obtener los contratos');
  }
}

// Get a single contract with better error handling
export async function getContract(contractId: string): Promise<Contract | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const docRef = doc(db, 'contracts', contractId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().userId === currentUser.uid) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(), // Convert timestamp to Date
      } as Contract;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    throw new Error(error.message || 'Error al obtener el contrato');
  }
}

export { analytics };