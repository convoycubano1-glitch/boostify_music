/**
 * Firebase setup for the client
 * Initializes Firebase app, auth, Firestore, and storage
 * 
 * Updated with improved persistence configuration for production
 */
import { initializeApp, FirebaseApp, FirebaseOptions } from "firebase/app";
import { 
  getAuth, 
  Auth,
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence
} from "firebase/auth";
import { 
  getFirestore, 
  Firestore, 
  initializeFirestore, 
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

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

// Initialize App Check with reCAPTCHA Enterprise
// TEMPORALMENTE DESHABILITADO PARA DIAGNOSTICAR PROBLEMA EN MÓVIL
// This protects your app from abuse by ensuring requests come from your app
try {
  // App Check DESACTIVADO temporalmente para debugging móvil
  console.log('⚠️ [APP CHECK] DESACTIVADO TEMPORALMENTE para diagnóstico móvil');
  
  // Descomentar para reactivar App Check:
  /*
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  if (!isLocalhost) {
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LeloAssAAAAAG7GWlxW1QGReAw_2y-bYSVmmH3K'),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ [APP CHECK] Firebase App Check initialized with reCAPTCHA Enterprise');
  } else {
    console.log('⚠️ [APP CHECK] Skipped in localhost (development mode)');
  }
  */
} catch (appCheckError) {
  // No fallar si App Check tiene problemas, solo loguear
  console.warn('⚠️ [APP CHECK] Failed to initialize:', appCheckError);
}

const auth = getAuth(app);

// Configurar persistencia de Auth para iOS
// iOS Safari puede tener problemas con persistencia, configuramos múltiples estrategias
// Intentar configurar persistencia con fallback para iOS
(async () => {
  try {
    // Intentar usar indexedDB primero (más robusto)
    await setPersistence(auth, indexedDBLocalPersistence);
    console.log('✅ [iOS] Auth persistence: indexedDB');
  } catch (indexedDBError) {
    try {
      // Si falla indexedDB, usar localStorage
      await setPersistence(auth, browserLocalPersistence);
      console.log('✅ [iOS] Auth persistence: localStorage');
    } catch (localStorageError) {
      try {
        // Último recurso: sessionStorage
        await setPersistence(auth, browserSessionPersistence);
        console.log('⚠️ [iOS] Auth persistence: sessionStorage (menos persistente)');
      } catch (sessionError) {
        console.warn('❌ [iOS] No se pudo configurar persistencia:', sessionError);
      }
    }
  }
})();

// Initialize Firestore with more reliable settings to prevent "failed-precondition" errors
// We're using a simplified configuration that's more stable across browsers and environments
let db: Firestore;

try {
  // Detectar si estamos en un entorno con restricciones (iOS Safari, modo incógnito, etc.)
  const isRestrictedEnv = (() => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return false;
    } catch {
      return true; // Safari privado, iOS restrictivo, etc.
    }
  })();

  if (isRestrictedEnv) {
    // En entornos restrictivos, usar Firestore sin persistencia
    console.log("🔒 Restricted environment detected (iOS Safari/Private mode) - Using Firestore without persistence");
    db = getFirestore(app);
  } else {
    // En entornos normales, usar persistencia avanzada
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        tabManager: persistentMultipleTabManager()
      })
    });
    console.log("✅ Firestore initialized with enhanced persistence");
  }
} catch (error) {
  // Fallback: Si falla cualquier cosa, usar Firestore estándar
  console.warn("⚠️ Enhanced persistence failed, using standard Firestore:", error);
  db = getFirestore(app);
}

const storage = getStorage(app);

// Log initialization success
console.log("Firebase initialized with enhanced network resilience and multi-tab support");

// Export the initialized services
export { app, auth, db, storage };