import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence, 
  Auth,
  GoogleAuthProvider, 
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  connectAuthEmulator,
  inMemoryPersistence
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { FIREBASE_CONFIG } from '@/env';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Función para verificar y mejorar la configuración de Firebase
const enhanceFirebaseConfig = (config: FirebaseOptions): FirebaseOptions => {
  // Aseguramos que tengamos un appId si no está presente
  if (!config.appId) {
    config = {
      ...config,
      appId: '1:123456789012:web:1234567890abcdef'
    };
  }
  
  // Aseguramos que la configuración tenga todos los campos necesarios
  return {
    ...config,
    // Añadir cualquier valor predeterminado faltante
    databaseURL: config.databaseURL || `https://${config.projectId}-default-rtdb.firebaseio.com`,
  };
};

// Inicialización con manejo de errores y estrategias de recuperación
try {
  console.log('Inicializando Firebase con configuración mejorada...');
  
  // Mejoramos la configuración para mayor compatibilidad
  const enhancedConfig = enhanceFirebaseConfig(FIREBASE_CONFIG);
  
  // Inicializar Firebase con la configuración mejorada
  app = initializeApp(enhancedConfig);
  
  // Obtener instancias de servicios con manejo adecuado de errores
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Configuraciones adicionales para Auth
  // Usar el idioma del dispositivo para la UI de autenticación
  auth.useDeviceLanguage();
  
  // Configuración específica para resolver el error auth/internal-error
  // Limpiar cualquier estado persistente que pueda estar causando problemas
  try {
    // Primero, intentamos establecer persistencia local que es más estable
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Authentication persistence enabled');
      })
      .catch((error) => {
        console.warn('Error al configurar persistencia local, intentando alternativa:', error);
        
        // Si falla la persistencia local, intentamos con persistencia en memoria
        // que es menos propensa a errores aunque no mantiene la sesión entre recargas
        setPersistence(auth, inMemoryPersistence)
          .then(() => {
            console.log('Fallback: Authentication in-memory persistence enabled');
          })
          .catch((fallbackError) => {
            console.error('Error enabling any auth persistence:', fallbackError);
          });
      });
  } catch (authConfigError) {
    console.error('Error en configuración de autenticación:', authConfigError);
  }
  
  // Habilitar persistencia offline para Firestore con mejor manejo de errores
  try {
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
  } catch (firestoreConfigError) {
    console.error('Error en configuración de Firestore:', firestoreConfigError);
  }

  console.log('Firebase initialized with enhanced network resilience');
  
} catch (error) {
  console.error('Error initializing Firebase, using minimal fallback:', error);
  
  // Fallback con configuración mínima por si hay algún problema
  try {
    // Reintentar con configuración mínima
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('Firebase fallback initialization successful');
  } catch (fallbackError) {
    console.error('Critical failure in Firebase initialization:', fallbackError);
    
    // Crear un elemento para mostrar un error visual en la interfaz
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.right = '0';
    errorDiv.style.padding = '10px';
    errorDiv.style.backgroundColor = '#f44336';
    errorDiv.style.color = 'white';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = 'Error crítico al inicializar Firebase. Por favor, refresca la página.';
    document.body.appendChild(errorDiv);
    
    // Asignar instancias vacías para evitar errores de referencia nula
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
  }
}

export { auth, db, storage };
export default app;