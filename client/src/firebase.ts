import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence, 
  Auth,
  GoogleAuthProvider, 
  indexedDBLocalPersistence,
  browserPopupRedirectResolver 
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '@/env';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Inicialización con manejo de errores
try {
  // Inicializar Firebase con la configuración de env.ts
  app = initializeApp(FIREBASE_CONFIG);
  
  // Obtener instancias de servicios
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Configurar resolver personalizado para ayudar con problemas de popup
  auth.useDeviceLanguage(); // Usar el idioma del dispositivo para la UI de autenticación
  
  // Habilitar persistencia local para autenticación - más confiable
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Authentication persistence enabled');
    })
    .catch((error) => {
      console.error('Error enabling auth persistence:', error);
    });
  
  // Habilitar persistencia offline para Firestore
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('Firestore persistence enabled');
    })
    .catch((error) => {
      if (error.code === 'failed-precondition') {
        // Varios tabs abiertos, persistencia solo puede habilitarse en uno a la vez
        console.warn('Firestore persistence could not be enabled (multiple tabs open)');
      } else if (error.code === 'unimplemented') {
        // El navegador actual no soporta las características requeridas
        console.warn('Firestore persistence not supported by browser');
      } else {
        console.error('Error enabling Firestore persistence:', error);
      }
    });

  console.log('Firebase initialized with enhanced network resilience');
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
  
  // Fallback con configuración mínima por si hay algún problema
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { auth, db, storage };
export default app;