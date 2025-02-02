import { initializeApp } from "firebase/app";
import { getAuth, type User } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

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

export { analytics };