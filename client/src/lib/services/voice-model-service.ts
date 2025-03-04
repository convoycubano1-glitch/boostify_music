/**
 * Servicio para interactuar con la API de modelos de voz
 * Basado en la API de Revocalize
 */
import axios from 'axios';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { 
  VoiceModel, 
  NewVoiceModel, 
  TrainingStatus, 
  VoiceConversionRequest,
  VoiceConversionTaskStatus
} from '../types/voice-model-types';

/**
 * Clase para el servicio de modelos de voz
 */
class VoiceModelService {
  private apiUrl: string = 'https://api.revocalize.ai';
  private apiToken: string = '';

  /**
   * Constructor del servicio
   */
  constructor() {
    // En un entorno real, obtendríamos el token de las variables de entorno
    // Para propósitos de desarrollo, usaremos un token simulado o lo cargaremos de Firestore
    this.loadApiToken();
  }

  /**
   * Carga el token API de Firestore o variables de entorno
   */
  private async loadApiToken() {
    try {
      // Primero intentamos obtener de localStorage para evitar llamadas innecesarias
      const cachedToken = localStorage.getItem('voice_api_token');
      if (cachedToken) {
        this.apiToken = cachedToken;
        return;
      }
      
      // En un entorno real, podríamos obtener el token de un endpoint seguro del backend
      // Para desarrollo, lo simulamos
      this.apiToken = 'simulated_token';
      
      // Guardar en caché local
      localStorage.setItem('voice_api_token', this.apiToken);
    } catch (error) {
      console.error('Error loading API token:', error);
      this.apiToken = 'simulated_token';
    }
  }

  /**
   * Obtiene los modelos de voz disponibles
   */
  async getAvailableModels(): Promise<VoiceModel[]> {
    try {
      // En un entorno real, haríamos una llamada a la API
      // const response = await axios.get(`${this.apiUrl}/models`, {
      //   headers: { Authorization: `Bearer ${this.apiToken}` }
      // });
      // return response.data.models;
      
      // Para desarrollo, usamos datos simulados combinados con modelos personalizados del usuario
      const demoModels: VoiceModel[] = this.getDemoModels();
      
      // Recuperar modelos personalizados de Firestore
      const customModels = await this.getUserCustomModels();
      
      return [...demoModels, ...customModels];
    } catch (error) {
      console.error('Error fetching voice models:', error);
      return this.getDemoModels();
    }
  }
  
  /**
   * Recupera los modelos personalizados del usuario actual
   */
  async getUserCustomModels(): Promise<VoiceModel[]> {
    try {
      // Obtener el ID del usuario actual
      const userId = localStorage.getItem('currentUserId') || 'demo-user';
      
      // Consultar Firestore para obtener los modelos personalizados
      const customModelsRef = collection(db, 'voice-models');
      const q = query(customModelsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          isCustom: true,
          createdAt: data.createdAt?.toDate() || new Date()
        } as VoiceModel;
      });
    } catch (error) {
      console.error('Error fetching custom voice models:', error);
      return [];
    }
  }

  /**
   * Crea un nuevo modelo de voz personalizado (fase inicial, pendiente)
   */
  async createCustomModel(modelData: NewVoiceModel, trainingAudio: File): Promise<string> {
    try {
      // 1. Subir el archivo de audio de entrenamiento a Firebase Storage
      const userId = localStorage.getItem('currentUserId') || 'demo-user';
      const fileUrl = await this.uploadTrainingAudio(trainingAudio, userId);
      
      // 2. Crear un documento en Firestore con el estado 'pending'
      const modelRef = collection(db, 'voice-models');
      const modelDoc = await addDoc(modelRef, {
        ...modelData,
        userId,
        audioUrl: fileUrl,
        isCustom: true,
        createdAt: Timestamp.now()
      });
      
      // 3. Crear un registro de entrenamiento
      const trainingRef = collection(db, 'voice-model-training');
      await addDoc(trainingRef, {
        model_id: modelDoc.id,
        status: 'pending',
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      
      // 4. En un entorno real, llamaríamos a la API para iniciar el entrenamiento
      // await this.startModelTraining(modelDoc.id, 100); // Empezar con 100 epochs
      
      // Para desarrollo, simular el inicio del entrenamiento
      this.simulateTraining(modelDoc.id);
      
      return modelDoc.id;
    } catch (error) {
      console.error('Error creating custom voice model:', error);
      throw new Error('Failed to create custom voice model');
    }
  }
  
  /**
   * Sube el audio de entrenamiento a Firebase Storage
   */
  private async uploadTrainingAudio(file: File, userId: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `voice_models/${userId}/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return downloadUrl;
  }
  
  /**
   * Inicia el entrenamiento del modelo
   */
  async startModelTraining(modelId: string, epochs: number): Promise<TrainingStatus> {
    try {
      // En un entorno real, llamaríamos a la API
      // const response = await axios.post(
      //   `${this.apiUrl}/models/${modelId}/train`,
      //   { epochs },
      //   { headers: { Authorization: `Bearer ${this.apiToken}` } }
      // );
      // return response.data;
      
      // Para desarrollo, actualizamos el estado en Firestore
      const trainingRef = collection(db, 'voice-model-training');
      const q = query(trainingRef, where('model_id', '==', modelId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Training record not found');
      }
      
      const trainingDoc = snapshot.docs[0];
      await updateDoc(trainingDoc.ref, {
        status: 'training',
        total_epochs: epochs,
        current_epoch: 0,
        updated_at: Timestamp.now()
      });
      
      // Simulamos el entrenamiento
      this.simulateTraining(modelId);
      
      return {
        status: 'training',
        model_id: modelId,
        current_epoch: 0,
        total_epochs: epochs
      };
    } catch (error) {
      console.error('Error starting model training:', error);
      throw new Error('Failed to start model training');
    }
  }
  
  /**
   * Verifica el estado del entrenamiento del modelo
   */
  async checkTrainingStatus(modelId: string): Promise<TrainingStatus> {
    try {
      // En un entorno real, llamaríamos a la API
      // const response = await axios.get(`${this.apiUrl}/models/${modelId}/status`, {
      //   headers: { Authorization: `Bearer ${this.apiToken}` }
      // });
      // return response.data;
      
      // Para desarrollo, consultamos Firestore
      const trainingRef = collection(db, 'voice-model-training');
      const q = query(trainingRef, where('model_id', '==', modelId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Training record not found');
      }
      
      const trainingData = snapshot.docs[0].data();
      return {
        status: trainingData.status,
        model_id: modelId,
        current_epoch: trainingData.current_epoch || 0,
        total_epochs: trainingData.total_epochs || 100,
        created_at: trainingData.created_at?.toDate(),
        updated_at: trainingData.updated_at?.toDate()
      };
    } catch (error) {
      console.error('Error checking training status:', error);
      throw new Error('Failed to check training status');
    }
  }
  
  /**
   * Convierte un archivo de audio vocal usando un modelo específico
   */
  async convertAudio(request: VoiceConversionRequest): Promise<string> {
    try {
      // En un entorno real, enviaríamos el archivo a la API
      // const formData = new FormData();
      // formData.append('audio_file', request.audio_file);
      // formData.append('model', request.model);
      // if (request.transpose !== undefined) formData.append('transpose', request.transpose.toString());
      // if (request.generations_count) formData.append('generations_count', request.generations_count.toString());
      
      // const response = await axios.post(`${this.apiUrl}/convert`, formData, {
      //   headers: { 
      //     'Content-Type': 'multipart/form-data',
      //     Authorization: `Bearer ${this.apiToken}`
      //   }
      // });
      // return response.data.task_id;
      
      // Para desarrollo, simulamos el proceso
      const taskId = `task-${Date.now()}`;
      
      // Guardar información de la tarea en Firestore
      const tasksRef = collection(db, 'voice-conversion-tasks');
      await addDoc(tasksRef, {
        task_id: taskId,
        status: 'in_progress',
        model: request.model,
        transpose: request.transpose || 0,
        generations_count: request.generations_count || 1,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
      
      // Simulamos la conversión (completará después de un delay)
      this.simulateConversion(taskId, request.audio_file);
      
      return taskId;
    } catch (error) {
      console.error('Error converting audio:', error);
      throw new Error('Failed to start audio conversion');
    }
  }
  
  /**
   * Verifica el estado de una tarea de conversión
   */
  async checkConversionStatus(taskId: string): Promise<VoiceConversionTaskStatus> {
    try {
      // En un entorno real, llamaríamos a la API
      // const response = await axios.get(`${this.apiUrl}/check-task/${taskId}`, {
      //   headers: { Authorization: `Bearer ${this.apiToken}` }
      // });
      // return response.data;
      
      // Para desarrollo, consultamos Firestore
      const tasksRef = collection(db, 'voice-conversion-tasks');
      const q = query(tasksRef, where('task_id', '==', taskId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Task not found');
      }
      
      const taskData = snapshot.docs[0].data();
      return {
        status: taskData.status,
        input_audio_url: taskData.input_audio_url,
        output_audio_urls: taskData.output_audio_urls,
        output_settings: {
          model: taskData.model,
          transpose: taskData.transpose || 0,
          vocal_style: taskData.vocal_style
        }
      };
    } catch (error) {
      console.error('Error checking conversion status:', error);
      throw new Error('Failed to check conversion status');
    }
  }
  
  /**
   * Simula el proceso de entrenamiento (solo para desarrollo)
   */
  private simulateTraining(modelId: string) {
    let currentEpoch = 0;
    const totalEpochs = 100;
    const interval = setInterval(async () => {
      try {
        currentEpoch += 5;
        
        // Actualizar el progreso en Firestore
        const trainingRef = collection(db, 'voice-model-training');
        const q = query(trainingRef, where('model_id', '==', modelId));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const trainingDoc = snapshot.docs[0];
          await updateDoc(trainingDoc.ref, {
            current_epoch: currentEpoch,
            updated_at: Timestamp.now(),
            status: currentEpoch >= totalEpochs ? 'completed' : 'training'
          });
        }
        
        // Completar si hemos llegado al final
        if (currentEpoch >= totalEpochs) {
          clearInterval(interval);
          
          // Actualizar el modelo también
          const modelRef = doc(db, 'voice-models', modelId);
          const modelSnap = await getDoc(modelRef);
          if (modelSnap.exists()) {
            await updateDoc(modelRef, {
              isReady: true,
              updatedAt: Timestamp.now()
            });
          }
        }
      } catch (error) {
        console.error('Error in training simulation:', error);
        clearInterval(interval);
      }
    }, 2000); // Actualizar cada 2 segundos
  }
  
  /**
   * Simula el proceso de conversión de audio (solo para desarrollo)
   */
  private async simulateConversion(taskId: string, audioFile: File) {
    try {
      // Creamos una URL para el archivo de audio original
      const originalUrl = URL.createObjectURL(audioFile);
      
      // Esperamos un tiempo para simular el procesamiento
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Actualizamos la tarea como completada
      const tasksRef = collection(db, 'voice-conversion-tasks');
      const q = query(tasksRef, where('task_id', '==', taskId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const taskDoc = snapshot.docs[0];
        await updateDoc(taskDoc.ref, {
          status: 'completed',
          input_audio_url: originalUrl,
          // Para demo usamos el mismo archivo como resultado
          output_audio_urls: [originalUrl],
          updated_at: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error in conversion simulation:', error);
    }
  }
  
  /**
   * Obtiene modelos de voz de demostración (solo para desarrollo)
   */
  private getDemoModels(): VoiceModel[] {
    return [
      {
        id: "andra",
        name: "Andra",
        gender: "female",
        age: "adult",
        description: "Popular pop singer with a powerful and dynamic vocal range. Her voice is characterized by its soulful quality, agility, and emotive expressiveness.",
        base_language: "en",
        traits: ["nasal", "powerful", "emotive", "dynamic", "soulful"],
        genre: "pop",
        voice_type: "tenor",
        vocal_range: {
          min: "C3",
          max: "C7",
        }
      },
      {
        id: "nicole_cherry",
        name: "Nicole Cherry",
        gender: "female",
        age: "young adult",
        description: "Young Romanian pop artist with a fresh, vibrant vocal style that combines contemporary pop with urban influences.",
        base_language: "ro",
        traits: ["fresh", "vibrant", "youthful", "contemporary", "urban"],
        genre: "pop",
        voice_type: "mezzo-soprano",
        vocal_range: {
          min: "A3",
          max: "E5",
        }
      },
      {
        id: "marius_moga",
        name: "Marius Moga",
        gender: "male",
        age: "adult",
        description: "Romanian producer and vocalist known for his smooth, polished vocal delivery and ability to blend pop, R&B and electronic music elements.",
        base_language: "ro",
        traits: ["smooth", "polished", "produced", "contemporary", "versatile"],
        genre: "pop",
        voice_type: "tenor",
        vocal_range: {
          min: "F2",
          max: "C5",
        }
      },
      {
        id: "sebastian_dobrincu",
        name: "Sebastian Dobrincu",
        gender: "male",
        age: "young adult",
        description: "Tech entrepreneur and musician with a modern, laid-back vocal approach suitable for contemporary pop and acoustic genres.",
        base_language: "en",
        traits: ["relaxed", "modern", "clear", "natural", "warm"],
        genre: "pop",
        voice_type: "baritone",
        vocal_range: {
          min: "A2",
          max: "G4",
        }
      }
    ];
  }
}

// Exportamos una instancia del servicio
export const voiceModelService = new VoiceModelService();