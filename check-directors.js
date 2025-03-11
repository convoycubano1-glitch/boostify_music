/**
 * Script para verificar la estructura de los documentos en la colección "directors"
 * Específicamente para revisar si tienen URLs de imágenes válidas
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Configuración de Firebase (igual a la usada en client/src/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyAKIV3Z-Yk8xSKDe9-0KjQC1X-87NLbE-E",
  authDomain: "artist-boost.firebaseapp.com", 
  projectId: "artist-boost",
  storageBucket: "artist-boost.appspot.com",
  messagingSenderId: "829606002665",
  appId: "1:829606002665:web:4fbdcb7ce0a7e16acfb87f"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para verificar la estructura de los directores
async function checkDirectors() {
  try {
    console.log("Obteniendo documentos de la colección 'directors'...");
    
    const directorsSnapshot = await getDocs(collection(db, "directors"));
    
    if (directorsSnapshot.empty) {
      console.log("No hay documentos en la colección 'directors'");
      return;
    }

    console.log(`Encontrados ${directorsSnapshot.size} documentos de directores`);
    
    // Contar directores con y sin URLs de imágenes
    let directorsWithImages = 0;
    let directorsWithoutImages = 0;
    
    directorsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log("-".repeat(50));
      console.log(`Director ID: ${doc.id}`);
      console.log(`Nombre: ${data.name}`);
      console.log(`Especialidad: ${data.specialty}`);
      
      if (data.imageUrl) {
        console.log(`URL de imagen: ${data.imageUrl}`);
        directorsWithImages++;
      } else {
        console.log("Este director no tiene URL de imagen");
        directorsWithoutImages++;
      }
    });
    
    console.log("-".repeat(50));
    console.log(`Resumen:`);
    console.log(`- Directores con URLs de imágenes: ${directorsWithImages}`);
    console.log(`- Directores sin URLs de imágenes: ${directorsWithoutImages}`);
    
  } catch (error) {
    console.error("Error verificando directores:", error);
  }
}

// Ejecutar la función
checkDirectors().then(() => {
  console.log("Verificación completada");
  process.exit(0);
}).catch(error => {
  console.error("Error en la verificación:", error);
  process.exit(1);
});