/**
 * Firebase setup for the client
 * Initializes Firebase app, auth, Firestore, and storage
 * 
 * Updated with improved persistence configuration for production
 */
import { initializeApp, FirebaseApp, FirebaseOptions } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

/**
 * Default Firebase configuration from environment variables
 */
const defaultConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBzkhBNdrQVU0gCUgI31CzlKbSkKG4_iG8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "artist-boost.firebaseapp.com", 
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "artist-boost",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "artist-boost.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "502955771825",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:502955771825:web:d6746677d851f9b1449f90",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ERCSSWTXCJ"
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

// Initialize Firestore with more reliable settings to prevent "failed-precondition" errors
// We're using a simplified configuration that's more stable across browsers and environments
let db: Firestore;

try {
  // First attempt: Create with advanced persistence settings
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      tabManager: persistentMultipleTabManager()
    })
  });
  console.log("Firestore initialized with enhanced persistence");
} catch (error) {
  // Fallback: If advanced persistence fails, use standard Firestore
  console.warn("Enhanced persistence failed, using standard Firestore:", error);
  db = getFirestore(app);
}

const storage = getStorage(app);

// Log initialization success
console.log("Firebase initialized with enhanced network resilience and multi-tab support");

// Export the initialized services
export { app, auth, db, storage };