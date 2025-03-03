import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";
import { doc, collection, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { User } from "firebase/auth";

/**
 * Interface para los detalles de conversión de voz guardados en Firestore
 */
export interface VoiceConversionRecord {
  id?: string;
  userId: string;
  fileName: string;
  modelId: number;
  modelName: string;
  originalFileUrl: string;
  resultFileUrl?: string | null;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settings?: {
    conversionStrength: number;
    modelVolumeMix: number;
    pitchShift: number;
    usePreprocessing: boolean;
    usePostprocessing: boolean;
  };
}

/**
 * Sube un archivo de audio a Firebase Storage
 * @param file Archivo a subir
 * @param path Ruta en Storage (ej: 'voice-conversions/originals')
 * @param userId ID del usuario
 * @returns URL del archivo subido
 */
export async function uploadAudioFile(file: File, path: string, userId: string): Promise<string> {
  // Crear un nombre único para el archivo basado en timestamp
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
  const filePath = `${path}/${userId}/${fileName}`;
  
  // Referencia al archivo en Storage
  const storageRef = ref(storage, filePath);
  
  // Subir el archivo
  const snapshot = await uploadBytes(storageRef, file);
  
  // Obtener y devolver la URL del archivo subido
  return await getDownloadURL(snapshot.ref);
}

/**
 * Guarda los detalles de una conversión de voz en Firestore
 * @param conversion Detalles de la conversión
 * @returns ID del documento creado
 */
export async function saveVoiceConversion(conversion: Omit<VoiceConversionRecord, 'id'>): Promise<string> {
  const conversionsRef = collection(db, "voice-conversions");
  const docRef = await addDoc(conversionsRef, conversion);
  return docRef.id;
}

/**
 * Actualiza el estado de una conversión de voz en Firestore
 * @param conversionId ID de la conversión
 * @param updates Campos a actualizar
 */
export async function updateVoiceConversion(
  conversionId: string, 
  updates: Partial<VoiceConversionRecord>
): Promise<void> {
  const conversionRef = doc(db, "voice-conversions", conversionId);
  await updateDoc(conversionRef, updates);
}

/**
 * Obtiene todas las conversiones de voz de un usuario
 * @param userId ID del usuario
 * @returns Lista de conversiones
 */
export async function getUserVoiceConversions(userId: string): Promise<VoiceConversionRecord[]> {
  const conversionsRef = collection(db, "voice-conversions");
  const q = query(
    conversionsRef, 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data() as Omit<VoiceConversionRecord, 'id'>;
    return { ...data, id: doc.id };
  });
}

/**
 * Elimina un archivo de Storage
 * @param fileUrl URL del archivo a eliminar
 */
export async function deleteStorageFile(fileUrl: string): Promise<void> {
  // Extraer la ruta del archivo de la URL
  const decodedUrl = decodeURIComponent(fileUrl);
  const startIndex = decodedUrl.indexOf('/o/') + 3;
  const endIndex = decodedUrl.indexOf('?');
  
  if (startIndex > 2 && endIndex > startIndex) {
    const filePath = decodedUrl.substring(startIndex, endIndex);
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } else {
    throw new Error("URL de archivo inválida");
  }
}

/**
 * Obtiene el usuario actual de Firestore o crea un documento si no existe
 * @param user Usuario de Firebase Auth
 * @returns Datos del usuario
 */
export async function getOrCreateUserDocument(user: User): Promise<any> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  } else {
    // Crear un nuevo documento para el usuario
    const userData = {
      email: user.email,
      displayName: user.displayName || "Usuario",
      photoURL: user.photoURL,
      createdAt: Timestamp.now()
    };
    
    await updateDoc(userRef, userData);
    return { id: user.uid, ...userData };
  }
}