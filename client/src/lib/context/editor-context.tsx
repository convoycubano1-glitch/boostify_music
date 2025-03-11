import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '@/hooks/use-auth';

// Definición de tipos para el editor
export interface AudioTrack {
  id: string;
  url: string;
  name: string;
  startTime: number;
  endTime?: number; // Optional para compatibilidad
  duration?: number; // Added para compatibilidad con MusicVideoWorkflow
  volume?: number; // Optional
  muted?: boolean; // Optional
  waveformData?: any[]; // Added para compatibilidad con MusicVideoWorkflow
}

export interface VideoClip {
  id: string;
  url: string;
  name: string;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  zIndex: number;
}

export interface TextElement {
  id: string;
  content: string;
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  zIndex: number;
}

export interface Effect {
  id: string;
  type: string;
  targetId: string;
  startTime: number;
  endTime: number;
  parameters: Record<string, any>;
}

export interface Transcription {
  id: string;
  audioId: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface Asset {
  id: string;
  type: 'audio' | 'video' | 'image';
  url: string;
  name: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export interface Prompt {
  id: string;
  text: string;
  category: string;
  timestamp: Date;
}

// Interfaz del proyecto de video musical
export interface WorkflowStepData {
  // Upload audio/video
  audioFile?: string; // URL del audio subido
  imageFiles?: { url: string; name: string; }[]; // URLs de imágenes subidas
  bRollFiles?: { url: string; name: string; duration?: number; }[]; // URLs de video B-roll

  // Transcription
  transcription?: string; // Texto transcrito de la canción
  transcriptionSegments?: {
    start: number;
    end: number;
    text: string;
  }[];
  
  // Script generation
  script?: string; // Guion generado
  scriptSegments?: {
    start: number;
    end: number;
    text: string;
    shotType?: string;
  }[];
  
  // Visual style
  visualStyle?: {
    cameraFormat?: 'landscape' | 'portrait' | 'square';
    mood?: string;
    colorPalette?: string;
    characterStyle?: string;
    visualIntensity?: number;
    narrativeIntensity?: number;
    referenceImageUrl?: string;
    director?: string;
  };
  
  // Beat sync
  beatSync?: {
    editingStyle?: 'dynamic' | 'steady' | 'minimal' | 'cinematic';
    detectedBeats?: number[];
  };
  
  // Prompt generation
  generatedPrompts?: Prompt[];
  
  // Image generation
  generatedImages?: string[]; // URLs de las imágenes generadas
  generatedImagesDetails?: {
    url: string;
    prompt: string;
    timestamp: number;
  }[];
  
  // Camera movements
  cameraMovements?: {
    name?: string; // Nombre descriptivo del movimiento
    type: 'pan' | 'zoom' | 'tilt' | 'dolly' | 'track';
    startTime?: number; // Alias de start para compatibilidad
    start: number;
    end: number;
    duration?: number; // Para compatibilidad con la interfaz de MusicVideoWorkflow
    parameters?: Record<string, any>;
  }[];
  
  // Video generation settings
  videoSettings?: {
    style?: string;
    quality?: string;
    resolution?: string;
    includeVoiceover?: boolean;
    includeCameraMovements?: boolean;
    includeSubtitles?: boolean;
  };
  
  // Lipsync data
  lipsyncData?: {
    enabled: boolean;
    confidence: number;
    segments: {
      start: number;
      end: number;
      words: string;
    }[];
  };
  
  // Generated segments (for video parts)
  generatedSegments?: {
    id: string;
    startTime: number;
    duration: number;
    prompt: string;
    style: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }[];
  
  // Final rendering
  videoGenerationModel?: 't2v-01' | 't2v-01-director' | 'i2v-01' | 's2v-01';
  videoGenerationTaskId?: string;
  generatedVideo?: string; // URL del video final
  finalVideoUrl?: string; // Alias para generatedVideo con nombre más descriptivo
  renderingStatus?: 'idle' | 'generating' | 'completed' | 'failed';
  renderStatus?: 'idle' | 'generating' | 'completed' | 'failed'; // Alias para renderingStatus
  renderingProgress?: number;
  renderingError?: string;
  processingTime?: number;
  videoMetadata?: {
    width: number;
    height: number;
    framerate: number;
    duration: number;
    format: string;
  };
  completed?: boolean;
}

export interface MusicVideoProject {
  id: string;
  name: string;
  duration: number;
  audioTracks: AudioTrack[];
  videoClips: VideoClip[];
  textElements: TextElement[];
  effects: Effect[];
  assets: Asset[];
  prompts: Prompt[];
  transcriptions: Transcription[];
  currentStep: number;
  completedSteps: number[];
  workflowData: WorkflowStepData; // Datos específicos de cada paso del flujo de trabajo
  lastModified: Date; // Fecha de última modificación
  createdAt: Date; // Fecha de creación
}

// Estado del contexto del editor
interface EditorContextState {
  project: MusicVideoProject;
  currentTime: number;
  isPlaying: boolean;
  selectedElements: string[];
  view: 'timeline' | 'workflow' | 'preview';
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  persistenceMode: 'local' | 'firestore' | 'hybrid';
}

// Acciones que se pueden realizar en el editor
interface EditorContextActions {
  // Navegación y control
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setView: (view: 'timeline' | 'workflow' | 'preview') => void;
  
  // Gestión de proyecto
  updateProjectName: (name: string) => void;
  updateProjectDuration: (duration: number) => void;
  updateWorkflowData: (updates: Partial<WorkflowStepData>) => void;
  
  // Gestión de elementos
  addAudioTrack: (track: Omit<AudioTrack, 'id'>) => void;
  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void;
  removeAudioTrack: (id: string) => void;
  
  addVideoClip: (clip: Omit<VideoClip, 'id'>) => void;
  updateVideoClip: (id: string, updates: Partial<VideoClip>) => void;
  removeVideoClip: (id: string) => void;
  
  addTextElement: (element: Omit<TextElement, 'id'>) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  removeTextElement: (id: string) => void;
  
  addEffect: (effect: Omit<Effect, 'id'>) => void;
  updateEffect: (id: string, updates: Partial<Effect>) => void;
  removeEffect: (id: string) => void;
  
  // Gestión de recursos
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  removeAsset: (id: string) => void;
  
  // Gestión de prompts
  addPrompt: (prompt: Omit<Prompt, 'id'>) => void;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  removePrompt: (id: string) => void;
  
  // Gestión de transcripciones
  addTranscription: (transcription: Omit<Transcription, 'id'>) => void;
  updateTranscription: (id: string, updates: Partial<Transcription>) => void;
  removeTranscription: (id: string) => void;
  
  // Gestión de clips unificados
  addClip: (clip: Omit<MediaClip, 'id'>) => string;
  updateClip: (id: string, updates: Partial<MediaClip>) => void;
  removeClip: (id: string) => void;
  
  // Gestión de selección
  selectElement: (id: string) => void;
  deselectElement: (id: string) => void;
  clearSelection: () => void;
  
  // Gestión de pasos del flujo de trabajo
  setCurrentStep: (step: number) => void;
  markStepAsCompleted: (step: number) => void;
  markStepAsIncomplete: (step: number) => void;
  
  // Sincronización de estado
  importProject: (project: MusicVideoProject) => void;
  exportProject: () => MusicVideoProject;
  resetProject: () => void;
}

// Clip genérico unificado para manejar diferentes tipos de medios
export interface MediaClip {
  id: string;
  type: 'video' | 'image';
  url: string;
  name: string;
  startTime: number;
  duration: number;
  layer: number;
  properties?: Record<string, any>;
}

// Tipo del contexto completo
type EditorContextType = EditorContextState & EditorContextActions;

// Proyecto vacío por defecto
const defaultProject: MusicVideoProject = {
  id: '',
  name: 'Nuevo Proyecto',
  duration: 180, // 3 minutos por defecto
  audioTracks: [],
  videoClips: [],
  textElements: [],
  effects: [],
  assets: [],
  prompts: [],
  transcriptions: [],
  currentStep: 0,
  completedSteps: [],
  workflowData: {}, // Datos específicos del flujo de trabajo de AI Video Creation
  lastModified: new Date(),
  createdAt: new Date(),
};

// Creación del contexto
const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor debe ser usado dentro de un EditorProvider');
  }
  return context;
}

// Proveedor del contexto
export function EditorProvider({ children }: { children: React.ReactNode }) {
  // Obtener información del usuario autenticado
  const { user } = useAuth();
  
  // Colección para guardar clips unificados (MediaClip)
  // Estos no forman parte del proyecto pero se usan para soportar la interfaz de Workflow
  const [mediaClips, setMediaClips] = useState<MediaClip[]>([]);
  
  // Estado principal del editor
  const [state, setState] = useState<EditorContextState>({
    project: { ...defaultProject, id: `project-${Date.now()}` },
    currentTime: 0,
    isPlaying: false,
    selectedElements: [],
    view: 'workflow',
    saveStatus: 'idle',
    lastSaved: null,
    persistenceMode: 'local'
  });

  // Función para generar IDs únicos
  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Guardar en localStorage cuando cambia el proyecto
  useEffect(() => {
    try {
      localStorage.setItem('music-video-project', JSON.stringify(state.project));
    } catch (error) {
      console.error('Error guardando proyecto en localStorage:', error);
    }
  }, [state.project]);
  
  // Guardar en Firestore con debounce de 5 segundos
  useEffect(() => {
    // Solo guardar si hay un usuario autenticado
    if (!user?.uid) return;
    
    // Crear una referencia al documento del proyecto
    const projectRef = doc(db, 'musicVideoProjects', state.project.id);
    
    // Configurar un timer para el debounce
    const timer = setTimeout(async () => {
      try {
        setState(prev => ({ ...prev, saveStatus: 'saving' }));
        
        // Preparar datos para guardar, transformando fechas a Timestamp
        const projectToSave = {
          ...state.project,
          userId: user.uid,
          updatedAt: serverTimestamp(),
          prompts: state.project.prompts.map(prompt => ({
            ...prompt,
            timestamp: prompt.timestamp instanceof Date 
              ? Timestamp.fromDate(prompt.timestamp) 
              : prompt.timestamp
          }))
        };
        
        // Guardar en Firestore
        await setDoc(projectRef, projectToSave, { merge: true });
        
        // Actualizar estado de guardado
        setState(prev => ({ 
          ...prev, 
          saveStatus: 'saved',
          lastSaved: new Date(),
          persistenceMode: 'hybrid'
        }));
        
        console.log('Proyecto guardado automáticamente en Firestore:', state.project.id);
      } catch (error) {
        console.error('Error guardando en Firestore:', error);
        
        // Establecer modo de persistencia local si hay un error de permisos
        setState(prev => ({ 
          ...prev, 
          saveStatus: 'error',
          persistenceMode: 'local'
        }));
        
        // Seguir usando localStorage como respaldo
        try {
          localStorage.setItem('music-video-project', JSON.stringify(state.project));
          console.log('Proyecto guardado localmente debido a error en Firestore');
        } catch (localError) {
          console.error('Error guardando proyecto en localStorage:', localError);
        }
      }
    }, 5000); // Debounce de 5 segundos
    
    // Limpiar el timer en caso de cancelación
    return () => clearTimeout(timer);
  }, [state.project, user?.uid]);

  // Cargar desde localStorage al iniciar
  useEffect(() => {
    try {
      const savedProject = localStorage.getItem('music-video-project');
      if (savedProject) {
        const parsedProject = JSON.parse(savedProject);
        setState(prev => ({
          ...prev,
          project: parsedProject
        }));
      }
    } catch (error) {
      console.error('Error cargando proyecto desde localStorage:', error);
    }
  }, []);
  
  // Cargar proyectos guardados desde Firestore
  useEffect(() => {
    // Solo cargar si hay un usuario autenticado
    if (!user?.uid) return;
    
    const loadProjects = async () => {
      try {
        // Verificar si ya hay un proyecto cargado desde localStorage
        if (state.project.id !== defaultProject.id) {
          // Buscar el proyecto en Firestore para asegurar que es del usuario
          const projectRef = doc(db, 'musicVideoProjects', state.project.id);
          const projectSnap = await getDoc(projectRef);
          
          if (projectSnap.exists() && projectSnap.data()?.userId === user.uid) {
            // El proyecto existe en Firestore y pertenece al usuario
            console.log('Proyecto cargado desde Firestore:', state.project.id);
            return;
          }
        }
        
        // Buscar el proyecto más reciente del usuario
        // Nota: Este query requiere un índice compuesto en Firestore
        // Si el error persiste, crear el índice manualmente en la consola de Firebase
        try {
          const projectsQuery = query(
            collection(db, 'musicVideoProjects'),
            where('userId', '==', user.uid),
            orderBy('updatedAt', 'desc'),
            limit(1)
          );
          
          const indexQuerySnapshot = await getDocs(projectsQuery);
          
          if (!indexQuerySnapshot.empty) {
            const projectData = indexQuerySnapshot.docs[0].data();
            console.log('Cargando el proyecto más reciente desde Firestore:', projectData.id);
            
            // Transformar datos de Firestore a formato local
            const processedProject = {
              ...projectData,
              prompts: projectData.prompts?.map((prompt: any) => ({
                ...prompt,
                timestamp: prompt.timestamp?.toDate() || new Date()
              })) || []
            };
            
            setState(prev => ({
              ...prev,
              project: processedProject as MusicVideoProject
            }));
            
            // Guardar también en localStorage para tener copia local
            localStorage.setItem('music-video-project', JSON.stringify(processedProject));
          }
        } catch (indexError) {
          // Si hay un error con el índice, usar una consulta más simple
          console.log('Error con la consulta indexada, intentando alternativa:', indexError);
          
          const simpleQuery = query(
            collection(db, 'musicVideoProjects'),
            where('userId', '==', user.uid),
            limit(10)
          );
          
          const simpleQuerySnapshot = await getDocs(simpleQuery);
          
          if (!simpleQuerySnapshot.empty) {
            // Ordenar manualmente por updatedAt
            const projects = simpleQuerySnapshot.docs
              .map(doc => doc.data())
              .sort((a, b) => {
                const dateA = a.updatedAt?.toDate?.() || new Date(0);
                const dateB = b.updatedAt?.toDate?.() || new Date(0);
                return dateB.getTime() - dateA.getTime();
              });
            
            if (projects.length > 0) {
              const projectData = projects[0];
              console.log('Cargando proyecto alternativo desde Firestore:', projectData.id);
              
              // Transformar datos de Firestore a formato local
              const processedProject = {
                ...projectData,
                prompts: projectData.prompts?.map((prompt: any) => ({
                  ...prompt,
                  timestamp: prompt.timestamp?.toDate() || new Date()
                })) || []
              };
              
              setState(prev => ({
                ...prev,
                project: processedProject as MusicVideoProject
              }));
              
              // Guardar también en localStorage para tener copia local
              localStorage.setItem('music-video-project', JSON.stringify(processedProject));
            }
          }
        }
      } catch (error) {
        console.error('Error cargando proyectos desde Firestore:', error);
      }
    };
    
    loadProjects();
  }, [user?.uid]);

  // Implementación de acciones del contexto
  const setCurrentTime = (time: number) => {
    setState(prev => ({ ...prev, currentTime: time }));
  };

  const setIsPlaying = (isPlaying: boolean) => {
    setState(prev => ({ ...prev, isPlaying }));
  };

  const setView = (view: 'timeline' | 'workflow' | 'preview') => {
    setState(prev => ({ ...prev, view }));
  };

  const updateProjectName = (name: string) => {
    setState(prev => ({
      ...prev,
      project: { ...prev.project, name }
    }));
  };

  const updateProjectDuration = (duration: number) => {
    setState(prev => ({
      ...prev,
      project: { ...prev.project, duration }
    }));
  };
  
  // Función para actualizar datos específicos del workflow de AI Video Creation
  const updateWorkflowData = (updates: Partial<WorkflowStepData>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        workflowData: {
          ...prev.project.workflowData,
          ...updates
        },
        lastModified: new Date()
      },
      saveStatus: 'idle' // Marcar como pendiente de guardar
    }));
  };

  // Gestión de pistas de audio
  const addAudioTrack = (track: Omit<AudioTrack, 'id'>) => {
    const newTrack = { ...track, id: generateId('audio') };
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        audioTracks: [...prev.project.audioTracks, newTrack]
      }
    }));
    return newTrack.id;
  };

  const updateAudioTrack = (id: string, updates: Partial<AudioTrack>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        audioTracks: prev.project.audioTracks.map(track => 
          track.id === id ? { ...track, ...updates } : track
        )
      }
    }));
  };

  const removeAudioTrack = (id: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        audioTracks: prev.project.audioTracks.filter(track => track.id !== id)
      }
    }));
  };

  // Gestión de clips de video
  const addVideoClip = (clip: Omit<VideoClip, 'id'>) => {
    const newClip = { ...clip, id: generateId('video') };
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        videoClips: [...prev.project.videoClips, newClip]
      }
    }));
    return newClip.id;
  };

  const updateVideoClip = (id: string, updates: Partial<VideoClip>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        videoClips: prev.project.videoClips.map(clip => 
          clip.id === id ? { ...clip, ...updates } : clip
        )
      }
    }));
  };

  const removeVideoClip = (id: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        videoClips: prev.project.videoClips.filter(clip => clip.id !== id)
      }
    }));
  };

  // Gestión de elementos de texto
  const addTextElement = (element: Omit<TextElement, 'id'>) => {
    const newElement = { ...element, id: generateId('text') };
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        textElements: [...prev.project.textElements, newElement]
      }
    }));
    return newElement.id;
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        textElements: prev.project.textElements.map(element => 
          element.id === id ? { ...element, ...updates } : element
        )
      }
    }));
  };

  const removeTextElement = (id: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        textElements: prev.project.textElements.filter(element => element.id !== id)
      }
    }));
  };

  // Gestión de efectos
  const addEffect = (effect: Omit<Effect, 'id'>) => {
    const newEffect = { ...effect, id: generateId('effect') };
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        effects: [...prev.project.effects, newEffect]
      }
    }));
    return newEffect.id;
  };

  const updateEffect = (id: string, updates: Partial<Effect>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        effects: prev.project.effects.map(effect => 
          effect.id === id ? { ...effect, ...updates } : effect
        )
      }
    }));
  };

  const removeEffect = (id: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        effects: prev.project.effects.filter(effect => effect.id !== id)
      }
    }));
  };

  // Gestión de recursos (assets)
  const addAsset = (asset: Omit<Asset, 'id'>) => {
    const newAsset = { ...asset, id: generateId('asset') };
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        assets: [...prev.project.assets, newAsset]
      }
    }));
    return newAsset.id;
  };

  const removeAsset = (id: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        assets: prev.project.assets.filter(asset => asset.id !== id)
      }
    }));
  };

  // Gestión de prompts
  const addPrompt = (prompt: Omit<Prompt, 'id'>) => {
    const newPrompt = { ...prompt, id: generateId('prompt') };
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        prompts: [...prev.project.prompts, newPrompt]
      }
    }));
    return newPrompt.id;
  };

  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        prompts: prev.project.prompts.map(prompt => 
          prompt.id === id ? { ...prompt, ...updates } : prompt
        )
      }
    }));
  };

  const removePrompt = (id: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        prompts: prev.project.prompts.filter(prompt => prompt.id !== id)
      }
    }));
  };

  // Gestión de transcripciones
  const addTranscription = (transcription: Omit<Transcription, 'id'>) => {
    const newTranscription = { ...transcription, id: generateId('transcription') };
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        transcriptions: [...prev.project.transcriptions, newTranscription]
      }
    }));
    return newTranscription.id;
  };

  const updateTranscription = (id: string, updates: Partial<Transcription>) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        transcriptions: prev.project.transcriptions.map(transcription => 
          transcription.id === id ? { ...transcription, ...updates } : transcription
        )
      }
    }));
  };

  const removeTranscription = (id: string) => {
    setState(prev => ({
      ...prev,
      project: {
        ...prev.project,
        transcriptions: prev.project.transcriptions.filter(transcription => transcription.id !== id)
      }
    }));
  };

  // Gestión de selección
  const selectElement = (id: string) => {
    setState(prev => ({
      ...prev,
      selectedElements: prev.selectedElements.includes(id) 
        ? prev.selectedElements 
        : [...prev.selectedElements, id]
    }));
  };

  const deselectElement = (id: string) => {
    setState(prev => ({
      ...prev,
      selectedElements: prev.selectedElements.filter(elementId => elementId !== id)
    }));
  };

  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedElements: [] }));
  };

  // Gestión de pasos del workflow
  const setCurrentStep = (step: number) => {
    setState(prev => ({
      ...prev,
      project: { ...prev.project, currentStep: step }
    }));
  };

  const markStepAsCompleted = (step: number) => {
    setState(prev => {
      const currentCompleted = new Set(prev.project.completedSteps);
      currentCompleted.add(step);
      return {
        ...prev,
        project: { 
          ...prev.project, 
          completedSteps: Array.from(currentCompleted).sort((a, b) => a - b)
        }
      };
    });
  };

  const markStepAsIncomplete = (step: number) => {
    setState(prev => ({
      ...prev,
      project: { 
        ...prev.project, 
        completedSteps: prev.project.completedSteps.filter(s => s !== step)
      }
    }));
  };

  // Importación y exportación
  const importProject = (project: MusicVideoProject) => {
    setState(prev => ({ ...prev, project }));
  };

  const exportProject = () => {
    return state.project;
  };

  // Resetear el proyecto
  const resetProject = () => {
    setState(prev => ({
      ...prev,
      project: { ...defaultProject, id: `project-${Date.now()}` }
    }));
  };

  // Implementación de métodos para MediaClip (unified clips)
  const addClip = (clip: Omit<MediaClip, 'id'>): string => {
    const newClip = { ...clip, id: generateId(`${clip.type}-clip`) };
    setMediaClips(prev => [...prev, newClip]);
    
    // También agregar al sistema estándar basado en el tipo
    if (clip.type === 'video') {
      addVideoClip({
        url: clip.url,
        name: clip.name,
        startTime: clip.startTime,
        endTime: clip.startTime + clip.duration,
        x: 0,
        y: 0,
        width: 1280, // valores predeterminados
        height: 720,
        opacity: 1,
        zIndex: clip.layer || 1
      });
    }
    
    // Agregar como asset si no existe ya
    const assetExists = state.project.assets.some(asset => 
      asset.url === clip.url && asset.type === clip.type
    );
    
    if (!assetExists) {
      addAsset({
        type: clip.type,
        url: clip.url,
        name: clip.name
      });
    }
    
    return newClip.id;
  };
  
  const updateClip = (id: string, updates: Partial<MediaClip>) => {
    setMediaClips(prev => 
      prev.map(clip => clip.id === id ? { ...clip, ...updates } : clip)
    );
    
    // También actualizar en el sistema estándar
    const clip = mediaClips.find(c => c.id === id);
    if (clip && clip.type === 'video') {
      // Buscar el clip de video correspondiente para actualizar
      const videoClip = state.project.videoClips.find(v => v.url === clip.url);
      if (videoClip) {
        updateVideoClip(videoClip.id, {
          startTime: updates.startTime || clip.startTime,
          endTime: (updates.startTime || clip.startTime) + (updates.duration || clip.duration)
        });
      }
    }
  };
  
  const removeClip = (id: string) => {
    // Obtener el clip antes de eliminarlo
    const clipToRemove = mediaClips.find(clip => clip.id === id);
    
    // Eliminar de la lista unificada
    setMediaClips(prev => prev.filter(clip => clip.id !== id));
    
    // También eliminar del sistema estándar si se encuentra
    if (clipToRemove) {
      if (clipToRemove.type === 'video') {
        // Buscar el clip de video correspondiente para eliminar
        const videoClip = state.project.videoClips.find(v => v.url === clipToRemove.url);
        if (videoClip) {
          removeVideoClip(videoClip.id);
        }
      }
    }
  };

  // Construimos el valor del contexto combinando estado y acciones
  const contextValue: EditorContextType = {
    ...state,
    setCurrentTime,
    setIsPlaying,
    setView,
    updateProjectName,
    updateProjectDuration,
    updateWorkflowData,
    addAudioTrack,
    updateAudioTrack,
    removeAudioTrack,
    addVideoClip,
    updateVideoClip,
    removeVideoClip,
    addTextElement,
    updateTextElement,
    removeTextElement,
    addEffect,
    updateEffect,
    removeEffect,
    addAsset,
    removeAsset,
    addPrompt,
    updatePrompt,
    removePrompt,
    addTranscription,
    updateTranscription,
    removeTranscription,
    // Funciones de clips unificados
    addClip,
    updateClip,
    removeClip,
    // Funciones de selección
    selectElement,
    deselectElement,
    clearSelection,
    // Gestión de pasos del workflow
    setCurrentStep,
    markStepAsCompleted,
    markStepAsIncomplete,
    // Funciones de importación/exportación
    importProject,
    exportProject,
    resetProject,
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}