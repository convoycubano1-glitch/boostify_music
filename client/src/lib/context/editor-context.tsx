import React, { createContext, useContext, useState, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  EditorState, 
  Track, 
  TimelineClip, 
  Effect, 
  BeatMarker, 
  SectionMarker, 
  AudioTrack,
  Transcription,
  CameraMovement,
  EditorStateUtils
} from '@/lib/professional-editor-types';

// Tipos de acciones del editor
export enum EditorActionType {
  SET_PROJECT_NAME = 'SET_PROJECT_NAME',
  SET_CURRENT_TIME = 'SET_CURRENT_TIME',
  SET_DURATION = 'SET_DURATION',
  SET_PLAYING = 'SET_PLAYING',
  SET_ZOOM_LEVEL = 'SET_ZOOM_LEVEL',
  
  ADD_TRACK = 'ADD_TRACK',
  REMOVE_TRACK = 'REMOVE_TRACK',
  UPDATE_TRACK = 'UPDATE_TRACK',
  
  ADD_CLIP = 'ADD_CLIP',
  REMOVE_CLIP = 'REMOVE_CLIP',
  UPDATE_CLIP = 'UPDATE_CLIP',
  
  ADD_EFFECT = 'ADD_EFFECT',
  REMOVE_EFFECT = 'REMOVE_EFFECT',
  UPDATE_EFFECT = 'UPDATE_EFFECT',
  
  ADD_BEAT_MARKER = 'ADD_BEAT_MARKER',
  REMOVE_BEAT_MARKER = 'REMOVE_BEAT_MARKER',
  UPDATE_BEAT_MARKER = 'UPDATE_BEAT_MARKER',
  
  ADD_SECTION_MARKER = 'ADD_SECTION_MARKER',
  REMOVE_SECTION_MARKER = 'REMOVE_SECTION_MARKER',
  UPDATE_SECTION_MARKER = 'UPDATE_SECTION_MARKER',
  
  ADD_AUDIO_TRACK = 'ADD_AUDIO_TRACK',
  REMOVE_AUDIO_TRACK = 'REMOVE_AUDIO_TRACK',
  UPDATE_AUDIO_TRACK = 'UPDATE_AUDIO_TRACK',
  
  ADD_TRANSCRIPTION = 'ADD_TRANSCRIPTION',
  REMOVE_TRANSCRIPTION = 'REMOVE_TRANSCRIPTION',
  UPDATE_TRANSCRIPTION = 'UPDATE_TRANSCRIPTION',
  
  ADD_CAMERA_MOVEMENT = 'ADD_CAMERA_MOVEMENT',
  REMOVE_CAMERA_MOVEMENT = 'REMOVE_CAMERA_MOVEMENT',
  UPDATE_CAMERA_MOVEMENT = 'UPDATE_CAMERA_MOVEMENT',
  
  SELECT_CLIP = 'SELECT_CLIP',
  SELECT_TRACK = 'SELECT_TRACK',
  SELECT_EFFECT = 'SELECT_EFFECT',
  
  UNDO = 'UNDO',
  REDO = 'REDO',
  
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  
  LOAD_PROJECT = 'LOAD_PROJECT',
  RESET_PROJECT = 'RESET_PROJECT',
  
  UPDATE_METADATA = 'UPDATE_METADATA'
}

// Interfaz para acciones del editor
export interface EditorAction {
  type: EditorActionType;
  payload?: any;
}

// Reducer para el estado del editor
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { type, payload } = action;
  
  // Crear copia del estado para modificaciones
  const newState = { ...state };
  
  // Histórico de acciones (solo para acciones que modifican el proyecto)
  const trackableActions = [
    EditorActionType.ADD_TRACK,
    EditorActionType.REMOVE_TRACK,
    EditorActionType.UPDATE_TRACK,
    EditorActionType.ADD_CLIP,
    EditorActionType.REMOVE_CLIP,
    EditorActionType.UPDATE_CLIP,
    EditorActionType.ADD_EFFECT,
    EditorActionType.REMOVE_EFFECT,
    EditorActionType.UPDATE_EFFECT,
    EditorActionType.ADD_BEAT_MARKER,
    EditorActionType.REMOVE_BEAT_MARKER,
    EditorActionType.UPDATE_BEAT_MARKER,
    EditorActionType.ADD_SECTION_MARKER,
    EditorActionType.REMOVE_SECTION_MARKER,
    EditorActionType.UPDATE_SECTION_MARKER,
    EditorActionType.ADD_AUDIO_TRACK,
    EditorActionType.REMOVE_AUDIO_TRACK,
    EditorActionType.UPDATE_AUDIO_TRACK,
    EditorActionType.ADD_TRANSCRIPTION,
    EditorActionType.REMOVE_TRANSCRIPTION,
    EditorActionType.UPDATE_TRANSCRIPTION,
    EditorActionType.ADD_CAMERA_MOVEMENT,
    EditorActionType.REMOVE_CAMERA_MOVEMENT,
    EditorActionType.UPDATE_CAMERA_MOVEMENT,
    EditorActionType.SET_PROJECT_NAME,
    EditorActionType.UPDATE_SETTINGS,
    EditorActionType.UPDATE_METADATA
  ];
  
  // Agregar acción al historial si es trackable y no es UNDO o REDO
  if (
    trackableActions.includes(type) && 
    type !== EditorActionType.UNDO && 
    type !== EditorActionType.REDO
  ) {
    // Si estamos en mitad del historial (después de un UNDO), descartar las acciones posteriores
    if (state.historyIndex < state.history.length - 1) {
      newState.history = state.history.slice(0, state.historyIndex + 1);
    }
    
    // Añadir acción al historial
    newState.history = [
      ...newState.history, 
      {
        type: type.toString(),
        payload,
        timestamp: Date.now(),
        description: getActionDescription(type, payload)
      }
    ];
    
    newState.historyIndex = newState.history.length - 1;
  }
  
  // Procesar la acción
  switch (type) {
    case EditorActionType.SET_PROJECT_NAME:
      return { ...newState, projectName: payload };
      
    case EditorActionType.SET_CURRENT_TIME:
      return { ...newState, currentTime: payload };
      
    case EditorActionType.SET_DURATION:
      return { ...newState, duration: payload };
      
    case EditorActionType.SET_PLAYING:
      return { ...newState, isPlaying: payload };
      
    case EditorActionType.SET_ZOOM_LEVEL:
      return { ...newState, zoomLevel: payload };
      
    case EditorActionType.ADD_TRACK: {
      const newTrack: Track = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, tracks: [...newState.tracks, newTrack] };
    }
      
    case EditorActionType.REMOVE_TRACK: {
      const trackId = payload;
      return { 
        ...newState, 
        tracks: newState.tracks.filter(track => track.id !== trackId),
        // Eliminar clips asociados a la pista
        clips: newState.clips.filter(clip => clip.trackId !== trackId)
      };
    }
      
    case EditorActionType.UPDATE_TRACK: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        tracks: newState.tracks.map(track => 
          track.id === id ? { ...track, ...updates } : track
        )
      };
    }
      
    case EditorActionType.ADD_CLIP: {
      const newClip: TimelineClip = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, clips: [...newState.clips, newClip] };
    }
      
    case EditorActionType.REMOVE_CLIP: {
      const clipId = payload;
      return { 
        ...newState, 
        clips: newState.clips.filter(clip => clip.id !== clipId),
        // Eliminar efectos asociados al clip
        effects: newState.effects.filter(effect => effect.clipId !== clipId)
      };
    }
      
    case EditorActionType.UPDATE_CLIP: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        clips: newState.clips.map(clip => 
          clip.id === id ? { ...clip, ...updates } : clip
        )
      };
    }
      
    case EditorActionType.ADD_EFFECT: {
      const newEffect: Effect = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, effects: [...newState.effects, newEffect] };
    }
      
    case EditorActionType.REMOVE_EFFECT: {
      const effectId = payload;
      return { 
        ...newState, 
        effects: newState.effects.filter(effect => effect.id !== effectId) 
      };
    }
      
    case EditorActionType.UPDATE_EFFECT: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        effects: newState.effects.map(effect => 
          effect.id === id ? { ...effect, ...updates } : effect
        )
      };
    }
      
    case EditorActionType.ADD_BEAT_MARKER: {
      const newMarker: BeatMarker = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, beatMarkers: [...newState.beatMarkers, newMarker] };
    }
      
    case EditorActionType.REMOVE_BEAT_MARKER: {
      const markerId = payload;
      return { 
        ...newState, 
        beatMarkers: newState.beatMarkers.filter(marker => marker.id !== markerId) 
      };
    }
      
    case EditorActionType.UPDATE_BEAT_MARKER: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        beatMarkers: newState.beatMarkers.map(marker => 
          marker.id === id ? { ...marker, ...updates } : marker
        )
      };
    }
      
    case EditorActionType.ADD_SECTION_MARKER: {
      const newMarker: SectionMarker = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, sectionMarkers: [...newState.sectionMarkers, newMarker] };
    }
      
    case EditorActionType.REMOVE_SECTION_MARKER: {
      const markerId = payload;
      return { 
        ...newState, 
        sectionMarkers: newState.sectionMarkers.filter(marker => marker.id !== markerId) 
      };
    }
      
    case EditorActionType.UPDATE_SECTION_MARKER: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        sectionMarkers: newState.sectionMarkers.map(marker => 
          marker.id === id ? { ...marker, ...updates } : marker
        )
      };
    }
      
    case EditorActionType.ADD_AUDIO_TRACK: {
      const newTrack: AudioTrack = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, audioTracks: [...newState.audioTracks, newTrack] };
    }
      
    case EditorActionType.REMOVE_AUDIO_TRACK: {
      const trackId = payload;
      return { 
        ...newState, 
        audioTracks: newState.audioTracks.filter(track => track.id !== trackId) 
      };
    }
      
    case EditorActionType.UPDATE_AUDIO_TRACK: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        audioTracks: newState.audioTracks.map(track => 
          track.id === id ? { ...track, ...updates } : track
        )
      };
    }
      
    case EditorActionType.ADD_TRANSCRIPTION: {
      const newTranscription: Transcription = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, transcriptions: [...newState.transcriptions, newTranscription] };
    }
      
    case EditorActionType.REMOVE_TRANSCRIPTION: {
      const transcriptionId = payload;
      return { 
        ...newState, 
        transcriptions: newState.transcriptions.filter(t => t.id !== transcriptionId) 
      };
    }
      
    case EditorActionType.UPDATE_TRANSCRIPTION: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        transcriptions: newState.transcriptions.map(t => 
          t.id === id ? { ...t, ...updates } : t
        )
      };
    }
      
    case EditorActionType.ADD_CAMERA_MOVEMENT: {
      const newMovement: CameraMovement = {
        id: payload.id || uuidv4(),
        ...payload
      };
      return { ...newState, cameraMovements: [...newState.cameraMovements, newMovement] };
    }
      
    case EditorActionType.REMOVE_CAMERA_MOVEMENT: {
      const movementId = payload;
      return { 
        ...newState, 
        cameraMovements: newState.cameraMovements.filter(m => m.id !== movementId) 
      };
    }
      
    case EditorActionType.UPDATE_CAMERA_MOVEMENT: {
      const { id, ...updates } = payload;
      return {
        ...newState,
        cameraMovements: newState.cameraMovements.map(m => 
          m.id === id ? { ...m, ...updates } : m
        )
      };
    }
      
    case EditorActionType.SELECT_CLIP:
      return { ...newState, selectedClipId: payload };
      
    case EditorActionType.SELECT_TRACK:
      return { ...newState, selectedTrackId: payload };
      
    case EditorActionType.SELECT_EFFECT:
      return { ...newState, selectedEffectId: payload };
      
    case EditorActionType.UPDATE_SETTINGS:
      return { 
        ...newState, 
        settings: { 
          ...newState.settings, 
          ...payload 
        } 
      };
      
    case EditorActionType.UPDATE_METADATA:
      return { 
        ...newState, 
        metadata: { 
          ...newState.metadata, 
          ...payload 
        } 
      };
      
    case EditorActionType.UNDO: {
      // No hacer nada si no hay acciones para deshacer
      if (newState.historyIndex < 0) return state;
      
      // Obtener el estado antes de la última acción
      const prevIndex = newState.historyIndex - 1;
      return loadProjectState(prevIndex, state, newState.history);
    }
      
    case EditorActionType.REDO: {
      // No hacer nada si estamos en la acción más reciente
      if (newState.historyIndex >= newState.history.length - 1) return state;
      
      // Obtener el estado después de deshacer
      const nextIndex = newState.historyIndex + 1;
      return loadProjectState(nextIndex, state, newState.history);
    }
      
    case EditorActionType.LOAD_PROJECT:
      return payload;
      
    case EditorActionType.RESET_PROJECT:
      return EditorStateUtils.createNewProject();
      
    default:
      return state;
  }
}

// Función auxiliar para obtener una descripción legible de una acción
function getActionDescription(actionType: EditorActionType, payload: any): string {
  switch (actionType) {
    case EditorActionType.SET_PROJECT_NAME:
      return `Cambiar nombre del proyecto a "${payload}"`;
      
    case EditorActionType.ADD_TRACK:
      return `Añadir pista "${payload.name}"`;
      
    case EditorActionType.REMOVE_TRACK:
      return `Eliminar pista`;
      
    case EditorActionType.UPDATE_TRACK:
      return `Actualizar pista "${payload.name || ''}"`;
      
    case EditorActionType.ADD_CLIP:
      return `Añadir clip "${payload.name}"`;
      
    case EditorActionType.REMOVE_CLIP:
      return `Eliminar clip`;
      
    case EditorActionType.UPDATE_CLIP:
      return `Actualizar clip`;
      
    case EditorActionType.ADD_EFFECT:
      return `Añadir efecto "${payload.name}"`;
      
    case EditorActionType.REMOVE_EFFECT:
      return `Eliminar efecto`;
      
    case EditorActionType.UPDATE_EFFECT:
      return `Actualizar efecto`;
      
    case EditorActionType.ADD_BEAT_MARKER:
      return `Añadir marcador de beat en ${payload.time.toFixed(2)}s`;
      
    case EditorActionType.ADD_SECTION_MARKER:
      return `Añadir sección "${payload.label}"`;
      
    case EditorActionType.ADD_AUDIO_TRACK:
      return `Añadir pista de audio "${payload.name}"`;
      
    case EditorActionType.ADD_TRANSCRIPTION:
      return `Añadir transcripción`;
      
    case EditorActionType.ADD_CAMERA_MOVEMENT:
      return `Añadir movimiento de cámara "${payload.type}"`;
      
    default:
      return `Acción ${actionType}`;
  }
}

// Función para cargar un estado específico del historial
function loadProjectState(index: number, currentState: EditorState, history: any[]): EditorState {
  // Creamos un nuevo proyecto con valores iniciales
  let newState = EditorStateUtils.createNewProject();
  
  // Preservamos la configuración actual
  newState.settings = currentState.settings;
  
  // Aplicamos todas las acciones hasta el índice especificado
  for (let i = 0; i <= index; i++) {
    const historyItem = history[i];
    const action = {
      type: historyItem.type as EditorActionType,
      payload: historyItem.payload
    };
    
    newState = editorReducer(newState, action);
  }
  
  // Actualizamos el índice del historial
  newState.historyIndex = index;
  newState.history = currentState.history;
  
  return newState;
}

// Contexto para el estado del editor y acciones
interface EditorContextState {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  
  // Acciones específicas para facilitar el uso
  setProjectName: (name: string) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setZoomLevel: (level: number) => void;
  
  addTrack: (track: Omit<Track, 'id'>) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  
  addClip: (clip: Omit<TimelineClip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  
  addEffect: (effect: Omit<Effect, 'id'>) => void;
  removeEffect: (effectId: string) => void;
  updateEffect: (effectId: string, updates: Partial<Effect>) => void;
  
  addBeatMarker: (marker: Omit<BeatMarker, 'id'>) => void;
  removeBeatMarker: (markerId: string) => void;
  updateBeatMarker: (markerId: string, updates: Partial<BeatMarker>) => void;
  
  addSectionMarker: (marker: Omit<SectionMarker, 'id'>) => void;
  removeSectionMarker: (markerId: string) => void;
  updateSectionMarker: (markerId: string, updates: Partial<SectionMarker>) => void;
  
  addAudioTrack: (track: Omit<AudioTrack, 'id'>) => void;
  removeAudioTrack: (trackId: string) => void;
  updateAudioTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  
  addTranscription: (transcription: Omit<Transcription, 'id'>) => void;
  removeTranscription: (transcriptionId: string) => void;
  updateTranscription: (transcriptionId: string, updates: Partial<Transcription>) => void;
  
  addCameraMovement: (movement: Omit<CameraMovement, 'id'>) => void;
  removeCameraMovement: (movementId: string) => void;
  updateCameraMovement: (movementId: string, updates: Partial<CameraMovement>) => void;
  
  selectClip: (clipId: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  selectEffect: (effectId: string | null) => void;
  
  undo: () => void;
  redo: () => void;
  
  updateSettings: (updates: Partial<EditorState['settings']>) => void;
  updateMetadata: (updates: Record<string, any>) => void;
  
  loadProject: (project: EditorState) => void;
  resetProject: () => void;
  
  getActiveEffects: () => Effect[];
  getClipsInTimeRange: (startTime: number, endTime: number) => TimelineClip[];
  getClipsInTrack: (trackId: string) => TimelineClip[];
  
  saveProject: () => void;
}

// Crear el contexto
const EditorContext = createContext<EditorContextState | undefined>(undefined);

// Proveedor del contexto
export function EditorProvider({ children }: { children: React.ReactNode }) {
  // Estado inicial del editor
  const initialState = EditorStateUtils.createNewProject();
  
  // Reducer para manejar el estado
  const [state, dispatch] = useReducer(editorReducer, initialState);
  
  // Acciones específicas
  const setProjectName = useCallback((name: string) => {
    dispatch({ type: EditorActionType.SET_PROJECT_NAME, payload: name });
  }, []);
  
  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: EditorActionType.SET_CURRENT_TIME, payload: time });
  }, []);
  
  const setDuration = useCallback((duration: number) => {
    dispatch({ type: EditorActionType.SET_DURATION, payload: duration });
  }, []);
  
  const setPlaying = useCallback((isPlaying: boolean) => {
    dispatch({ type: EditorActionType.SET_PLAYING, payload: isPlaying });
  }, []);
  
  const setZoomLevel = useCallback((level: number) => {
    dispatch({ type: EditorActionType.SET_ZOOM_LEVEL, payload: level });
  }, []);
  
  const addTrack = useCallback((track: Omit<Track, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_TRACK, payload: track });
  }, []);
  
  const removeTrack = useCallback((trackId: string) => {
    dispatch({ type: EditorActionType.REMOVE_TRACK, payload: trackId });
  }, []);
  
  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    dispatch({ type: EditorActionType.UPDATE_TRACK, payload: { id: trackId, ...updates } });
  }, []);
  
  const addClip = useCallback((clip: Omit<TimelineClip, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_CLIP, payload: clip });
  }, []);
  
  const removeClip = useCallback((clipId: string) => {
    dispatch({ type: EditorActionType.REMOVE_CLIP, payload: clipId });
  }, []);
  
  const updateClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    dispatch({ type: EditorActionType.UPDATE_CLIP, payload: { id: clipId, ...updates } });
  }, []);
  
  const addEffect = useCallback((effect: Omit<Effect, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_EFFECT, payload: effect });
  }, []);
  
  const removeEffect = useCallback((effectId: string) => {
    dispatch({ type: EditorActionType.REMOVE_EFFECT, payload: effectId });
  }, []);
  
  const updateEffect = useCallback((effectId: string, updates: Partial<Effect>) => {
    dispatch({ type: EditorActionType.UPDATE_EFFECT, payload: { id: effectId, ...updates } });
  }, []);
  
  const addBeatMarker = useCallback((marker: Omit<BeatMarker, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_BEAT_MARKER, payload: marker });
  }, []);
  
  const removeBeatMarker = useCallback((markerId: string) => {
    dispatch({ type: EditorActionType.REMOVE_BEAT_MARKER, payload: markerId });
  }, []);
  
  const updateBeatMarker = useCallback((markerId: string, updates: Partial<BeatMarker>) => {
    dispatch({ type: EditorActionType.UPDATE_BEAT_MARKER, payload: { id: markerId, ...updates } });
  }, []);
  
  const addSectionMarker = useCallback((marker: Omit<SectionMarker, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_SECTION_MARKER, payload: marker });
  }, []);
  
  const removeSectionMarker = useCallback((markerId: string) => {
    dispatch({ type: EditorActionType.REMOVE_SECTION_MARKER, payload: markerId });
  }, []);
  
  const updateSectionMarker = useCallback((markerId: string, updates: Partial<SectionMarker>) => {
    dispatch({ type: EditorActionType.UPDATE_SECTION_MARKER, payload: { id: markerId, ...updates } });
  }, []);
  
  const addAudioTrack = useCallback((track: Omit<AudioTrack, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_AUDIO_TRACK, payload: track });
  }, []);
  
  const removeAudioTrack = useCallback((trackId: string) => {
    dispatch({ type: EditorActionType.REMOVE_AUDIO_TRACK, payload: trackId });
  }, []);
  
  const updateAudioTrack = useCallback((trackId: string, updates: Partial<AudioTrack>) => {
    dispatch({ type: EditorActionType.UPDATE_AUDIO_TRACK, payload: { id: trackId, ...updates } });
  }, []);
  
  const addTranscription = useCallback((transcription: Omit<Transcription, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_TRANSCRIPTION, payload: transcription });
  }, []);
  
  const removeTranscription = useCallback((transcriptionId: string) => {
    dispatch({ type: EditorActionType.REMOVE_TRANSCRIPTION, payload: transcriptionId });
  }, []);
  
  const updateTranscription = useCallback((transcriptionId: string, updates: Partial<Transcription>) => {
    dispatch({ type: EditorActionType.UPDATE_TRANSCRIPTION, payload: { id: transcriptionId, ...updates } });
  }, []);
  
  const addCameraMovement = useCallback((movement: Omit<CameraMovement, 'id'>) => {
    dispatch({ type: EditorActionType.ADD_CAMERA_MOVEMENT, payload: movement });
  }, []);
  
  const removeCameraMovement = useCallback((movementId: string) => {
    dispatch({ type: EditorActionType.REMOVE_CAMERA_MOVEMENT, payload: movementId });
  }, []);
  
  const updateCameraMovement = useCallback((movementId: string, updates: Partial<CameraMovement>) => {
    dispatch({ type: EditorActionType.UPDATE_CAMERA_MOVEMENT, payload: { id: movementId, ...updates } });
  }, []);
  
  const selectClip = useCallback((clipId: string | null) => {
    dispatch({ type: EditorActionType.SELECT_CLIP, payload: clipId });
  }, []);
  
  const selectTrack = useCallback((trackId: string | null) => {
    dispatch({ type: EditorActionType.SELECT_TRACK, payload: trackId });
  }, []);
  
  const selectEffect = useCallback((effectId: string | null) => {
    dispatch({ type: EditorActionType.SELECT_EFFECT, payload: effectId });
  }, []);
  
  const undo = useCallback(() => {
    dispatch({ type: EditorActionType.UNDO });
  }, []);
  
  const redo = useCallback(() => {
    dispatch({ type: EditorActionType.REDO });
  }, []);
  
  const updateSettings = useCallback((updates: Partial<EditorState['settings']>) => {
    dispatch({ type: EditorActionType.UPDATE_SETTINGS, payload: updates });
  }, []);
  
  const updateMetadata = useCallback((updates: Record<string, any>) => {
    dispatch({ type: EditorActionType.UPDATE_METADATA, payload: updates });
  }, []);
  
  const loadProject = useCallback((project: EditorState) => {
    dispatch({ type: EditorActionType.LOAD_PROJECT, payload: project });
  }, []);
  
  const resetProject = useCallback(() => {
    dispatch({ type: EditorActionType.RESET_PROJECT });
  }, []);
  
  // Métodos de utilidad
  const getActiveEffects = useCallback(() => {
    return EditorStateUtils.findActiveEffectsAtTime(state.effects, state.currentTime);
  }, [state.effects, state.currentTime]);
  
  const getClipsInTimeRange = useCallback((startTime: number, endTime: number) => {
    return EditorStateUtils.findClipsInTimeRange(state.clips, startTime, endTime);
  }, [state.clips]);
  
  const getClipsInTrack = useCallback((trackId: string) => {
    return EditorStateUtils.findClipsInTrack(state.clips, trackId);
  }, [state.clips]);
  
  // Guardar proyecto (simulado - en implementación real se conectaría a una API)
  const saveProject = useCallback(() => {
    const projectData = JSON.stringify(state);
    localStorage.setItem('editorProject', projectData);
    
    // En implementación real:
    // 1. Mostrar indicador de guardado
    // 2. Enviar datos a una API
    // 3. Actualizar estado con resultado (ej: última fecha de guardado)
    
    console.log('Proyecto guardado localmente');
  }, [state]);
  
  // Contexto completo
  const contextValue: EditorContextState = {
    state,
    dispatch,
    
    setProjectName,
    setCurrentTime,
    setDuration,
    setPlaying,
    setZoomLevel,
    
    addTrack,
    removeTrack,
    updateTrack,
    
    addClip,
    removeClip,
    updateClip,
    
    addEffect,
    removeEffect,
    updateEffect,
    
    addBeatMarker,
    removeBeatMarker,
    updateBeatMarker,
    
    addSectionMarker,
    removeSectionMarker,
    updateSectionMarker,
    
    addAudioTrack,
    removeAudioTrack,
    updateAudioTrack,
    
    addTranscription,
    removeTranscription,
    updateTranscription,
    
    addCameraMovement,
    removeCameraMovement,
    updateCameraMovement,
    
    selectClip,
    selectTrack,
    selectEffect,
    
    undo,
    redo,
    
    updateSettings,
    updateMetadata,
    
    loadProject,
    resetProject,
    
    getActiveEffects,
    getClipsInTimeRange,
    getClipsInTrack,
    
    saveProject
  };
  
  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

// Hook para usar el contexto del editor
export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor debe ser usado dentro de un EditorProvider');
  }
  return context;
}