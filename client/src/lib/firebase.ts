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

// Save contract to Firestore with better error handling and debugging
export async function saveContract(contractData: {
  title: string;
  type: string;
  content: string;
  status: string;
}): Promise<Contract> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('No hay usuario autenticado al intentar guardar');
    throw new Error('Usuario no autenticado');
  }

  console.log('Intentando guardar contrato para usuario:', currentUser.uid);

  try {
    // Reference to the contracts collection
    const contractsRef = collection(db, 'contracts');

    const newContract = {
      ...contractData,
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    };

    console.log('Datos del contrato a guardar:', newContract);

    // Add the document with proper typing
    const docRef = await addDoc(contractsRef, newContract);
    console.log('Contrato guardado con ID:', docRef.id);

    // Get the newly created document
    const docSnap = await getDoc(docRef);
    console.log('Document exists:', docSnap.exists());

    if (!docSnap.exists()) {
      throw new Error('Error al crear el contrato - documento no existe');
    }

    // Return the contract data with proper typing
    const savedContract = {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: new Date(), // Convert timestamp to Date
    } as Contract;

    console.log('Contrato guardado exitosamente:', savedContract);
    return savedContract;
  } catch (error: any) {
    console.error('Error detallado al guardar contrato:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw new Error(error.message || 'Error al guardar el contrato');
  }
}


// Get user's contracts with better error handling and debugging
export async function getUserContracts(): Promise<Contract[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('No hay usuario autenticado');
    throw new Error('Usuario no autenticado');
  }

  console.log('Firebase Auth: Usuario autenticado:', currentUser.uid);

  try {
    // Reference to the contracts collection
    const contractsRef = collection(db, 'contracts');
    console.log('Consultando colección contracts');

    // Simplified query without orderBy to avoid index requirement
    const q = query(
      contractsRef,
      where('userId', '==', currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    console.log('Documentos encontrados:', querySnapshot.size);

    const contracts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Document data:', data);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    }) as Contract[];

    // Sort on client side instead
    contracts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log('Contratos procesados:', contracts.length);
    return contracts;
  } catch (error: any) {
    console.error('Error detallado al obtener contratos:', {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
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

export async function deleteContract(contractId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const docRef = doc(db, 'contracts', contractId);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error('Error deleting contract:', error);
    throw new Error(error.message || 'Error al eliminar el contrato');
  }
}

export async function updateContract(contractId: string, updates: Partial<Contract>): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const docRef = doc(db, 'contracts', contractId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Error updating contract:', error);
    throw new Error(error.message || 'Error al actualizar el contrato');
  }
}

export { analytics };