/**
 * Script para inspeccionar los directores en Firestore y verificar sus URLs de imagen
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Configuración de Firebase
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

// URLs de ejemplo para directores (solo para análisis)
const directorImageUrls = {
  "Steven Spielberg": "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/directors%2Fspielberg.jpg?alt=media",
  "Quentin Tarantino": "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/directors%2Ftarantino.jpg?alt=media",
  "Christopher Nolan": "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/directors%2Fnolan.jpg?alt=media",
  "Sofia Coppola": "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/directors%2Fcoppola.jpg?alt=media",
  "Martin Scorsese": "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/directors%2Fscorsese.jpg?alt=media"
};

// Función para listar los directores en Firestore
async function listDirectors() {
  try {
    console.log("Consultando la colección 'directors' en Firestore...");
    
    const directorsSnapshot = await getDocs(collection(db, "directors"));
    
    if (directorsSnapshot.empty) {
      console.log("No hay documentos en la colección 'directors'");
      return [];
    }

    console.log(`Encontrados ${directorsSnapshot.size} directores`);
    
    const directors = directorsSnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      };
    });
    
    // Mostrar información completa de cada director
    directors.forEach(director => {
      console.log("\n---------------------------------");
      console.log(`ID: ${director.id}`);
      console.log(`Nombre: ${director.name}`);
      console.log(`Especialidad: ${director.specialty}`);
      console.log(`Estilo: ${director.style}`);
      console.log(`URL de imagen: ${director.imageUrl || "No tiene"}`);
      
      // Comprobar si la URL funciona (solo impresión a consola, no validación real)
      if (director.imageUrl) {
        if (director.imageUrl.startsWith("https://") || director.imageUrl.startsWith("http://")) {
          console.log("URL de imagen parece válida");
        } else {
          console.log("URL de imagen no tiene formato estándar");
        }
      }
    });
    
    return directors;
  } catch (error) {
    console.error("Error al consultar Firestore:", error);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    const directors = await listDirectors();
    
    console.log("\n\n=== RESUMEN ===");
    console.log(`Total de directores: ${directors.length}`);
    
    const withImages = directors.filter(d => d.imageUrl).length;
    const withoutImages = directors.length - withImages;
    
    console.log(`Con URLs de imagen: ${withImages}`);
    console.log(`Sin URLs de imagen: ${withoutImages}`);
    
    // Propuesta de solución
    if (withoutImages > 0) {
      console.log("\n=== PROPUESTA DE SOLUCIÓN ===");
      console.log("Para solucionar el problema, se podrían añadir URLs de imágenes a los directores que no las tienen.");
    }
    
  } catch (error) {
    console.error("Error en la ejecución principal:", error);
  }
}

// Ejecutar el script
main().then(() => {
  console.log("\nVerificación completada");
  process.exit(0);
}).catch(error => {
  console.error("Error en la verificación:", error);
  process.exit(1);
});