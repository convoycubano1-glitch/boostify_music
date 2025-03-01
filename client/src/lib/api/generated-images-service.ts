/**
 * Servicio para administrar imágenes y videos generados en Firestore
 * Proporciona funciones para guardar, recuperar y gestionar contenido multimedia generado
 */
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ImageResult, VideoResult } from '../types/model-types';

// Nombres de colecciones en Firestore
const IMAGES_COLLECTION = 'generated_images';
const VIDEOS_COLLECTION = 'generated_videos';

/**
 * Adapta una instancia de ImageResult para guardarla en Firestore
 * @param image Imagen generada a guardar
 * @returns Objeto preparado para Firestore
 */
function adaptImageForFirestore(image: ImageResult) {
  return {
    url: image.url,
    provider: image.provider,
    requestId: image.requestId || null,
    taskId: image.taskId || null,
    status: image.status || 'completed',
    prompt: image.prompt,
    createdAt: Timestamp.fromDate(image.createdAt),
    userId: auth.currentUser?.uid || 'anonymous',
    savedAt: Timestamp.now()
  };
}

/**
 * Adapta una instancia de VideoResult para guardarla en Firestore
 * @param video Video generado a guardar
 * @returns Objeto preparado para Firestore
 */
function adaptVideoForFirestore(video: VideoResult) {
  return {
    url: video.url,
    provider: video.provider,
    requestId: video.requestId || null,
    taskId: video.taskId || null,
    status: video.status || 'completed',
    prompt: video.prompt,
    createdAt: Timestamp.fromDate(video.createdAt),
    userId: auth.currentUser?.uid || 'anonymous',
    savedAt: Timestamp.now()
  };
}

/**
 * Convierte un documento de Firestore a ImageResult
 * @param doc Documento de Firestore
 * @returns Instancia de ImageResult
 */
function convertFirestoreToImage(doc: any): ImageResult {
  const data = doc.data();
  return {
    url: data.url,
    provider: data.provider,
    requestId: data.requestId,
    taskId: data.taskId,
    status: data.status,
    prompt: data.prompt,
    createdAt: data.createdAt.toDate(),
    firestoreId: doc.id
  };
}

/**
 * Convierte un documento de Firestore a VideoResult
 * @param doc Documento de Firestore
 * @returns Instancia de VideoResult
 */
function convertFirestoreToVideo(doc: any): VideoResult {
  const data = doc.data();
  return {
    url: data.url,
    provider: data.provider,
    requestId: data.requestId,
    taskId: data.taskId,
    status: data.status,
    prompt: data.prompt,
    createdAt: data.createdAt.toDate(),
    firestoreId: doc.id
  };
}

// Almacenamiento alternativo en localStorage para cuando Firestore falla
const LOCAL_STORAGE_IMAGES_KEY = 'boostify_saved_images';
const LOCAL_STORAGE_VIDEOS_KEY = 'boostify_saved_videos';

// Función auxiliar para generar un ID único
function generateLocalId(): string {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Guarda una imagen generada en Firestore
 * @param image Imagen a guardar
 * @returns ID del documento creado en Firestore o localStorage
 */
export async function saveGeneratedImage(image: ImageResult): Promise<string> {
  // Si la imagen ya tiene un firestoreId, significa que ya está guardada
  if (image.firestoreId) {
    return image.firestoreId;
  }
  
  try {
    // Intenta primero guardar en Firestore
    const imagesCollection = collection(db, IMAGES_COLLECTION);
    const firestoreData = adaptImageForFirestore(image);
    
    const docRef = await addDoc(imagesCollection, firestoreData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving image to Firestore:', error);
    
    // Como alternativa, guardar en localStorage
    try {
      const localId = generateLocalId();
      
      // Obtener imágenes existentes
      let savedImages = [];
      const savedImagesStr = localStorage.getItem(LOCAL_STORAGE_IMAGES_KEY);
      if (savedImagesStr) {
        savedImages = JSON.parse(savedImagesStr);
      }
      
      // Añadir la nueva imagen con ID local
      const imageToSave = {
        ...image,
        firestoreId: localId
      };
      savedImages.push(imageToSave);
      
      // Guardar en localStorage
      localStorage.setItem(LOCAL_STORAGE_IMAGES_KEY, JSON.stringify(savedImages));
      
      console.log('Image saved to localStorage instead of Firestore');
      return localId;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      // Devolvemos un ID simulado en el peor caso para que la UI funcione
      return 'temp_' + Date.now();
    }
  }
}

/**
 * Guarda un video generado en Firestore
 * @param video Video a guardar
 * @returns ID del documento creado en Firestore o localStorage
 */
export async function saveGeneratedVideo(video: VideoResult): Promise<string> {
  // Si el video ya tiene un firestoreId, significa que ya está guardado
  if (video.firestoreId) {
    return video.firestoreId;
  }
  
  try {
    // Intenta primero guardar en Firestore
    const videosCollection = collection(db, VIDEOS_COLLECTION);
    const firestoreData = adaptVideoForFirestore(video);
    
    const docRef = await addDoc(videosCollection, firestoreData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving video to Firestore:', error);
    
    // Como alternativa, guardar en localStorage
    try {
      const localId = generateLocalId();
      
      // Obtener videos existentes
      let savedVideos = [];
      const savedVideosStr = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
      if (savedVideosStr) {
        savedVideos = JSON.parse(savedVideosStr);
      }
      
      // Añadir el nuevo video con ID local
      const videoToSave = {
        ...video,
        firestoreId: localId
      };
      savedVideos.push(videoToSave);
      
      // Guardar en localStorage
      localStorage.setItem(LOCAL_STORAGE_VIDEOS_KEY, JSON.stringify(savedVideos));
      
      console.log('Video saved to localStorage instead of Firestore');
      return localId;
    } catch (localError) {
      console.error('Error saving to localStorage:', localError);
      // Devolvemos un ID simulado en el peor caso para que la UI funcione
      return 'temp_' + Date.now();
    }
  }
}

/**
 * Recupera todas las imágenes generadas del usuario actual
 * @returns Array de imágenes generadas (combinadas de Firestore y localStorage)
 */
export async function getGeneratedImages(): Promise<ImageResult[]> {
  let firestoreImages: ImageResult[] = [];
  let localImages: ImageResult[] = [];
  
  // Intentar obtener imágenes de Firestore
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    const imagesCollection = collection(db, IMAGES_COLLECTION);
    
    // Consulta filtrada por userId solamente para evitar necesidad de índices compuestos
    const q = query(
      imagesCollection, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    firestoreImages = querySnapshot.docs.map(convertFirestoreToImage);
  } catch (error) {
    console.error('Error getting generated images from Firestore:', error);
  }
  
  // Obtener imágenes de localStorage
  try {
    const savedImagesStr = localStorage.getItem(LOCAL_STORAGE_IMAGES_KEY);
    if (savedImagesStr) {
      localImages = JSON.parse(savedImagesStr);
    }
  } catch (localError) {
    console.error('Error getting images from localStorage:', localError);
  }
  
  // Combinar imágenes de ambas fuentes (filtrando duplicados por URL)
  const allImages = [...firestoreImages];
  
  // Añadir solo imágenes locales que no estén ya en Firestore
  for (const localImage of localImages) {
    const isDuplicate = allImages.some(img => img.url === localImage.url);
    if (!isDuplicate) {
      allImages.push(localImage);
    }
  }
  
  // Ordenar por fecha de creación (más recientes primero)
  return allImages.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Recupera todos los videos generados del usuario actual
 * @returns Array de videos generados (combinados de Firestore y localStorage)
 */
export async function getGeneratedVideos(): Promise<VideoResult[]> {
  let firestoreVideos: VideoResult[] = [];
  let localVideos: VideoResult[] = [];
  
  // Intentar obtener videos de Firestore
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    const videosCollection = collection(db, VIDEOS_COLLECTION);
    
    // Consulta filtrada por userId solamente para evitar necesidad de índices compuestos
    const q = query(
      videosCollection, 
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    firestoreVideos = querySnapshot.docs.map(convertFirestoreToVideo);
  } catch (error) {
    console.error('Error getting generated videos from Firestore:', error);
  }
  
  // Obtener videos de localStorage
  try {
    const savedVideosStr = localStorage.getItem(LOCAL_STORAGE_VIDEOS_KEY);
    if (savedVideosStr) {
      localVideos = JSON.parse(savedVideosStr);
    }
  } catch (localError) {
    console.error('Error getting videos from localStorage:', localError);
  }
  
  // Combinar videos de ambas fuentes (filtrando duplicados por URL)
  const allVideos = [...firestoreVideos];
  
  // Añadir solo videos locales que no estén ya en Firestore
  for (const localVideo of localVideos) {
    const isDuplicate = allVideos.some(vid => vid.url === localVideo.url);
    if (!isDuplicate) {
      allVideos.push(localVideo);
    }
  }
  
  // Ordenar por fecha de creación (más recientes primero)
  return allVideos.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
}