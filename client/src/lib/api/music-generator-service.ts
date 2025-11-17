/**
 * Servicio unificado para la generación de música con PiAPI
 * 
 * Este servicio combina la interfaz de Zuno AI con la implementación
 * directa de PiAPI para proporcionar una experiencia coherente
 * al usuario final mientras aprovecha las mejores prácticas
 * de manejo de errores y reintentos.
 */

import {
  generateMusicWithUdio,
  generateMusicWithSuno,
  checkMusicGenerationStatus,
  MusicModel,
  UdioMusicParams,
  SunoMusicParams
} from './piapi-music';
import { getAuthToken } from '../auth';
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, Timestamp, query, where, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Interfaz para las opciones de generación de música
 * Mantiene compatibilidad con el servicio Zuno AI original
 */
export interface MusicGenerationOptions {
  prompt: string;
  title?: string;
  model: string;
  makeInstrumental?: boolean;
  negativeTags?: string;
  tags?: string;
  seed?: number;
  tempo?: number;
  keySignature?: string;
  continueClipId?: string;
  continueAt?: number;
  customLyrics?: string;
  generateLyrics?: boolean;
  audioUrl?: string;
  uploadAudio?: boolean;
}

/**
 * Interfaz para el estado de generación de música
 */
export interface MusicGenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  audioUrl?: string;
  message: string;
  error?: string;
}

/**
 * Interfaz para un elemento en el historial de generaciones
 */
export interface MusicGenerationHistoryItem {
  id: string;
  taskId: string;
  title: string;
  model: string;
  prompt: string;
  audioUrl: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'processing' | 'pending';
}

/**
 * Genera música utilizando PiAPI directamente o a través del servidor
 * @param options Opciones para la generación de música
 * @returns Objeto con el ID de la tarea iniciada
 */
export async function generateMusic(options: MusicGenerationOptions): Promise<{ taskId: string }> {
  try {
    console.log('Generando música con opciones:', options);
    
    // Determinar el modelo a utilizar
    const model = options.model as MusicModel;
    
    let taskId = '';
    
    // Generar música según el modelo seleccionado
    if (model === 'music-u') {
      // Para modelo Udio
      const udioParams: UdioMusicParams = {
        description: options.prompt,
        model: 'music-u',
        negativeTags: options.negativeTags,
        lyricsType: options.customLyrics ? 'user' : (options.makeInstrumental ? 'instrumental' : 'generate'),
        lyrics: options.customLyrics,
        seed: options.seed,
        continueClipId: options.continueClipId,
        continueAt: options.continueAt
      };
      
      const result = await generateMusicWithUdio(udioParams);
      taskId = result.taskId;
    } else if (model === 'music-s') {
      // Para modelo Suno
      const sunoParams: SunoMusicParams = {
        description: options.prompt,
        model: 'music-s',
        title: options.title,
        makeInstrumental: options.makeInstrumental,
        tags: options.tags,
        negativeTags: options.negativeTags,
        prompt: options.prompt,
        continueClipId: options.continueClipId,
        continueAt: options.continueAt
      };
      
      const result = await generateMusicWithSuno(sunoParams);
      taskId = result.taskId;
    } else {
      throw new Error(`Modelo no soportado: ${model}`);
    }
    
    // Si tenemos un usuario autenticado, guardaremos la generación en Firestore
    // Pero solamente si está configurado correctamente
    try {
      const user = auth.currentUser;
      if (user) {
        // Primero verificamos si la colección existe
        try {
          // Crear un objeto con solo las propiedades necesarias para evitar errores
          const generationData = {
            userId: user.uid,
            taskId: taskId,
            title: options.title || 'Generación sin título',
            prompt: options.prompt || '',
            model: options.model || 'unknown',
            status: 'pending',
            createdAt: Timestamp.now(),
            audioUrl: '', // Inicialmente vacío
            options: {
              makeInstrumental: Boolean(options.makeInstrumental),
              tags: options.tags || '',
              negativeTags: options.negativeTags || '',
              seed: options.seed || -1,
              tempo: options.tempo || 120,
              keySignature: options.keySignature || 'C Major'
            }
          };
          
          await addDoc(collection(db, 'music_generations'), generationData);
          console.log('Generación guardada en Firestore:', taskId);
        } catch (innerError) {
          console.warn('No se pudo guardar en Firestore, se omitirá el historial:', innerError);
        }
      }
    } catch (firestoreError) {
      // Si hay un error al guardar en Firestore, solo lo registramos pero continuamos
      console.error('Error al guardar la generación en Firestore:', firestoreError);
    }
    
    return { taskId };
  } catch (error) {
    console.error('Error en la generación de música:', error);
    
    // Propagar el error original para mantener la información detallada
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error generando música');
  }
}

/**
 * Verifica el estado de una generación de música en progreso
 * @param taskId ID de la tarea de generación
 * @returns Estado actual de la generación
 * @throws Error con mensaje descriptivo si hay un problema
 */
export async function checkGenerationStatus(taskId: string): Promise<MusicGenerationStatus> {
  try {
    console.log('Verificando estado de generación:', taskId);
    
    // Si es un ID de tarea local (no de PiAPI), buscamos en Firestore
    if (taskId.startsWith('local_')) {
      // Devolver datos simulados para pruebas locales
      return {
        id: taskId,
        status: 'completed',
        progress: 100,
        audioUrl: '/assets/music-samples/sample-music.mp3',
        message: 'Generación completada (local)'
      };
    }
    
    // Para tareas fallback (cuando PiAPI falló al iniciar)
    if (taskId.startsWith('fallback-')) {
      // Proporcionar una respuesta consistente para evitar errores en UI
      return {
        id: taskId,
        status: 'completed',
        progress: 100,
        audioUrl: '/assets/music-samples/fallback-music.mp3',
        message: 'Generación completada con modo alternativo'
      };
    }
    
    // Verificar el estado en PiAPI
    const status = await checkMusicGenerationStatus(taskId);
    
    // Mapear la respuesta de PiAPI a nuestro formato estándar
    let progress = 0;
    if (status.status === 'pending') {
      progress = 10;
    } else if (status.status === 'processing') {
      progress = 50;
    } else if (status.status === 'completed') {
      progress = 100;
    }
    
    // Actualizar el estado en Firestore si tenemos un usuario autenticado
    try {
      const user = auth.currentUser;
      if (user) {
        try {
          // Crear la consulta con cuidado, evitando errores
          const q = query(
            collection(db, 'music_generations'),
            where('taskId', '==', taskId),
            where('userId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(q);
          
          // Si no hay documentos, no hay problema
          if (querySnapshot.empty) {
            console.log('No se encontraron registros para actualizar en Firestore');
          } else {
            // Actualizar cada documento encontrado
            for (const doc of querySnapshot.docs) {
              const data = doc.data();
              
              // Solo actualizar si el estado ha cambiado
              if (data.status !== status.status) {
                try {
                  // Crear objeto de actualización con tipo
                  const updateData: Record<string, any> = {
                    status: status.status,
                    updatedAt: Timestamp.now()
                  };
                  
                  // Solo añadir audioUrl si está disponible
                  if (status.audioUrl) {
                    updateData.audioUrl = status.audioUrl;
                  }
                  
                  await updateDoc(doc.ref, updateData);
                  console.log('Documento actualizado en Firestore:', doc.id);
                } catch (updateError) {
                  console.error('Error al actualizar documento:', updateError);
                }
              }
            }
          }
        } catch (innerError) {
          console.warn('Error en la consulta a Firestore:', innerError);
        }
      }
    } catch (firestoreError) {
      // Si hay un error al actualizar Firestore, solo lo registramos
      console.error('Error al actualizar el estado en Firestore:', firestoreError);
    }
    
    return {
      id: taskId,
      status: status.status,
      progress,
      audioUrl: status.audioUrl,
      message: getStatusMessage(status.status),
      error: status.error
    };
  } catch (error) {
    console.error('Error verificando estado:', error);
    
    // Propagar el error original para mantener la información detallada
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Error verificando el estado de la generación');
  }
}

/**
 * Obtiene el historial de generaciones recientes del usuario actual
 * @returns Lista de generaciones recientes
 */
export async function getRecentGenerations(): Promise<MusicGenerationHistoryItem[]> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('No hay usuario autenticado para obtener historial');
      return [];
    }
    
    try {
      // Primero verificar si la colección existe
      try {
        // Consultar las generaciones del usuario desde Firestore
        const q = query(
          collection(db, 'music_generations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
          // limit(20) // Limitar a 20 resultados (opcional)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Mapear los documentos a nuestro formato estándar
        const generations: MusicGenerationHistoryItem[] = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            generations.push({
              id: doc.id,
              taskId: data.taskId || doc.id,
              title: data.title || 'Sin título',
              model: data.model || 'unknown',
              prompt: data.prompt || '',
              audioUrl: data.audioUrl || '',
              createdAt: data.createdAt?.toDate?.() 
                ? data.createdAt.toDate().toISOString() 
                : (data.createdAt instanceof Date 
                  ? data.createdAt.toISOString() 
                  : new Date().toISOString()),
              status: data.status || 'completed'
            });
          } catch (docError) {
            console.warn('Error procesando documento:', docError);
            // Continuar con el siguiente documento
          }
        });
        
        return generations;
      } catch (queryError: any) {
        console.error('Error en la consulta:', queryError);
        
        // Si el error es por índices no existentes, mostrar mensaje específico
        if (queryError.code === 'failed-precondition') {
          console.log('Se requiere configurar índices en Firestore. Devolviendo lista vacía por ahora.');
        }
        
        return [];
      }
    } catch (innerError) {
      console.error('Error interno obteniendo historial:', innerError);
      return [];
    }
  } catch (error) {
    console.error('Error externo obteniendo historial:', error);
    
    // Para cualquier error, devolver array vacío
    return [];
  }
}

/**
 * Guarda una generación completada en Firestore
 * @param generation Datos de la generación a guardar
 * @returns ID del documento creado
 */
export async function saveMusicGeneration(generation: {
  taskId: string;
  title: string;
  prompt: string;
  model: string;
  audioUrl: string;
}): Promise<string> {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('No autenticado');
    }
    
    // Guardar en Firestore
    const docRef = await addDoc(collection(db, 'music_generations'), {
      userId: user.uid,
      taskId: generation.taskId,
      title: generation.title,
      prompt: generation.prompt,
      model: generation.model,
      audioUrl: generation.audioUrl,
      status: 'completed',
      createdAt: Timestamp.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar la generación:', error);
    throw error;
  }
}

/**
 * Guarda una generación de música en el perfil del artista (PostgreSQL)
 * @param generation Datos de la generación completada
 * @returns Datos de la canción guardada
 */
export async function saveGeneratedSongToProfile(generation: {
  title: string;
  audioUrl: string;
  prompt?: string;
  genre?: string;
  duration?: string;
  coverArt?: string;
}): Promise<any> {
  try {
    // Intentar obtener token de Firebase Auth primero
    let authToken = await getAuthToken();
    
    // Si no hay token de Firebase, intentar con credenciales por defecto (para Replit Auth)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log('✅ Usando Firebase Auth para guardar canción');
    } else {
      console.log('⚠️ No hay token de Firebase Auth, intentando guardar con sesión de Replit');
      // Las cookies de sesión de Replit Auth se envían automáticamente
    }
    
    console.log('📤 Guardando canción en perfil:', {
      title: generation.title,
      audioUrl: generation.audioUrl.substring(0, 50),
      genre: generation.genre
    });
    
    const response = await fetch('/api/songs/generated', {
      method: 'POST',
      headers,
      credentials: 'include', // Importante para enviar cookies de sesión
      body: JSON.stringify({
        title: generation.title,
        audioUrl: generation.audioUrl,
        description: generation.prompt,
        genre: generation.genre,
        duration: generation.duration,
        prompt: generation.prompt,
        coverArt: generation.coverArt
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error al guardar canción:', response.status, errorData);
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Música guardada en perfil del artista:', data.song);
    return data.song;
  } catch (error) {
    console.error('Error guardando música en perfil:', error);
    throw error;
  }
}

/**
 * Genera música usando FAL AI minimax-music/v2
 * @param options Opciones para la generación
 * @returns Objeto con el requestId
 */
export async function generateMusicWithFAL(options: {
  prompt: string;
  duration?: number;
  reference_audio_url?: string;
}): Promise<{ requestId: string }> {
  try {
    console.log('Generando música con FAL AI minimax-music/v2:', options);
    
    const response = await fetch('/api/fal/minimax-music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: options.prompt,
        duration: options.duration || 30,
        reference_audio_url: options.reference_audio_url
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error generating music with FAL');
    }
    
    const data = await response.json();
    return { requestId: data.requestId };
  } catch (error) {
    console.error('Error en generateMusicWithFAL:', error);
    throw error;
  }
}

/**
 * Verifica el estado de una generación de FAL minimax-music
 * @param requestId ID de la request de FAL
 * @returns Estado de la generación
 */
export async function checkFALMusicStatus(requestId: string): Promise<MusicGenerationStatus> {
  try {
    const response = await fetch(`/api/fal/minimax-music/${requestId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FAL status check error:', errorText);
      throw new Error(`Error checking FAL music status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('FAL status response:', data);
    
    // Map FAL status to our format
    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
    if (data.status === 'completed') {
      status = 'completed';
    } else if (data.status === 'in_progress' || data.status === 'in_queue' || data.status === 'IN_PROGRESS' || data.status === 'IN_QUEUE') {
      status = 'processing';
    } else if (data.status === 'failed' || data.status === 'FAILED') {
      status = 'failed';
    }
    
    return {
      id: requestId,
      status,
      audioUrl: data.audioUrl,
      message: getStatusMessage(status)
    };
  } catch (error) {
    console.error('Error en checkFALMusicStatus:', error);
    throw error;
  }
}

/**
 * Genera música usando FAL AI Stable Audio 2.5 (3 minutos, enterprise-grade)
 * @param options Opciones de generación
 * @returns Request ID para polling
 */
export async function generateMusicWithStableAudio(options: {
  prompt: string;
  duration?: number;
}): Promise<{ requestId: string }> {
  try {
    console.log('Generando música con FAL AI Stable Audio 2.5:', options);
    
    const response = await fetch('/api/fal/stable-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: options.prompt,
        duration: options.duration || 180  // 3 minutos por defecto
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error generating music with Stable Audio');
    }
    
    const data = await response.json();
    return { requestId: data.requestId };
  } catch (error) {
    console.error('Error en generateMusicWithStableAudio:', error);
    throw error;
  }
}

/**
 * Verifica el estado de una generación de FAL Stable Audio
 * @param requestId ID de la request de FAL
 * @returns Estado de la generación
 */
export async function checkStableAudioStatus(requestId: string): Promise<MusicGenerationStatus> {
  try {
    const response = await fetch(`/api/fal/stable-audio/${requestId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stable Audio status check error:', errorText);
      throw new Error(`Error checking Stable Audio status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Stable Audio status response:', data);
    
    // Map FAL status to our format
    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
    if (data.status === 'completed') {
      status = 'completed';
    } else if (data.status === 'in_progress' || data.status === 'in_queue' || data.status === 'IN_PROGRESS' || data.status === 'IN_QUEUE') {
      status = 'processing';
    } else if (data.status === 'failed' || data.status === 'FAILED') {
      status = 'failed';
    }
    
    return {
      id: requestId,
      status,
      audioUrl: data.audioUrl,
      message: getStatusMessage(status)
    };
  } catch (error) {
    console.error('Error en checkStableAudioStatus:', error);
    throw error;
  }
}

/**
 * Obtiene un mensaje descriptivo para cada estado
 * @param status Estado de la generación
 * @returns Mensaje descriptivo
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Esperando en cola';
    case 'processing':
      return 'Generando música';
    case 'completed':
      return 'Generación completada';
    case 'failed':
      return 'Error en la generación';
    default:
      return 'Estado desconocido';
  }
}