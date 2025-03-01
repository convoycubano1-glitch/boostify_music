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

/**
 * Guarda una imagen generada en Firestore
 * @param image Imagen a guardar
 * @returns ID del documento creado en Firestore
 */
export async function saveGeneratedImage(image: ImageResult): Promise<string> {
  try {
    // Si la imagen ya tiene un firestoreId, significa que ya está guardada
    if (image.firestoreId) {
      return image.firestoreId;
    }
    
    const imagesCollection = collection(db, IMAGES_COLLECTION);
    const firestoreData = adaptImageForFirestore(image);
    
    const docRef = await addDoc(imagesCollection, firestoreData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving image to Firestore:', error);
    throw new Error('Failed to save image');
  }
}

/**
 * Guarda un video generado en Firestore
 * @param video Video a guardar
 * @returns ID del documento creado en Firestore
 */
export async function saveGeneratedVideo(video: VideoResult): Promise<string> {
  try {
    // Si el video ya tiene un firestoreId, significa que ya está guardado
    if (video.firestoreId) {
      return video.firestoreId;
    }
    
    const videosCollection = collection(db, VIDEOS_COLLECTION);
    const firestoreData = adaptVideoForFirestore(video);
    
    const docRef = await addDoc(videosCollection, firestoreData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving video to Firestore:', error);
    throw new Error('Failed to save video');
  }
}

/**
 * Recupera todas las imágenes generadas del usuario actual
 * @returns Array de imágenes generadas
 */
export async function getGeneratedImages(): Promise<ImageResult[]> {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    const imagesCollection = collection(db, IMAGES_COLLECTION);
    
    // Consulta filtrada por userId y ordenada por fecha de creación
    const q = query(
      imagesCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertFirestoreToImage);
  } catch (error) {
    console.error('Error getting generated images:', error);
    return [];
  }
}

/**
 * Recupera todos los videos generados del usuario actual
 * @returns Array de videos generados
 */
export async function getGeneratedVideos(): Promise<VideoResult[]> {
  try {
    const userId = auth.currentUser?.uid || 'anonymous';
    const videosCollection = collection(db, VIDEOS_COLLECTION);
    
    // Consulta filtrada por userId y ordenada por fecha de creación
    const q = query(
      videosCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertFirestoreToVideo);
  } catch (error) {
    console.error('Error getting generated videos:', error);
    return [];
  }
}