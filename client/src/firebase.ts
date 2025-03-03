/**
 * Firebase setup for the client
 * Initializes Firebase app, auth, Firestore, and storage
 */
import { initializeApp, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

/**
 * Default Firebase configuration from environment variables
 */
const defaultConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAKIV3Z-Yk8xSKDe9-0KjQC1X-87NLbE-E",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "artist-boost.firebaseapp.com", 
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "artist-boost",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "artist-boost.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "829606002665",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:829606002665:web:4fbdcb7ce0a7e16acfb87f"
};

// Check for FIREBASE_CONFIG in environment
let enhancedConfig: FirebaseOptions;

try {
  // Check if we have a FIREBASE_CONFIG object defined
  const envConfig = import.meta.env.VITE_FIREBASE_CONFIG;
  if (envConfig) {
    // Parse the configuration if it's a string
    const parsedConfig = typeof envConfig === 'string' 
      ? JSON.parse(envConfig)
      : envConfig;
    
    // Use the parsed config with fallbacks to default
    enhancedConfig = {
      ...defaultConfig,
      ...parsedConfig
    };
    console.log("Inicializando Firebase con configuración mejorada...");
  } else {
    enhancedConfig = defaultConfig;
  }
} catch (error) {
  console.error("Error parsing Firebase config:", error);
  enhancedConfig = defaultConfig;
}

// Initialize Firebase app
const app = initializeApp(enhancedConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence for Firestore (with error handling)
try {
  enableIndexedDbPersistence(db).then(() => {
    console.log("Firestore persistence enabled");
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence");
    } else {
      console.error("Error enabling Firestore persistence:", err);
    }
  });
} catch (error) {
  console.error("Error setting up Firestore persistence:", error);
}

// Log initialization success
console.log("Firebase initialized with enhanced network resilience");

// Export the initialized services
export { app, auth, db, storage };