import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only in production
let analytics = null;
if (import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

export { analytics };