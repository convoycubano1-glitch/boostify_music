/**
 * Editor de timeline principal
 * Componente principal para la edición de videos con timeline multiples capas
 * 
 * BOOSTIFY 2025 - Con acciones sobre clips:
 * - Edit Image (Nano Banana AI)
 * - Add Musician
 * - Camera Angles
 * - Regenerar Imagen
 * - Generar Video
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimelineLayers } from './TimelineLayers';
import { EditorAgentPanel } from '../editor-agent-panel';
import { MotionControlPanel } from '../motion-control-panel';
import { VideoPreviewModal } from '../video-preview-modal';
import { MusicianModal } from '../MusicianModal';
import CameraAnglesModal from '../CameraAnglesModal';
import { ImageEditorModal } from '../ImageEditorModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { 
  createProjectWithImages,
  getUserProjects,
  deleteVideoProject,
  type VideoProject
} from '@/lib/services/video-project-service';
import { 
  Play as PlayIcon, Pause as PauseIcon, 
  Scissors as ScissorIcon, Hand as HandIcon,
  Type as SelectIcon, MoveHorizontal as TrimIcon,
  ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon,
  Redo as RedoIcon, Undo as UndoIcon,
  Magnet as MagnetIcon, Trash as TrashIcon,
  Video as VideoIcon, Volume2 as VolumeIcon, Wand2 as MotionIcon,
  Image as ImageIcon, Plus as PlusIcon, GripVertical, X as XIcon,
  FolderOpen, Save, FolderPlus, Clock,
  SkipBack, SkipForward, Rewind, FastForward,
  Copy, ClipboardPaste, Split, Layers, Lock, Unlock, Eye, EyeOff, MoreHorizontal,
  Download, RefreshCw, Film, Pencil, Music, Camera, Sparkles, Loader2
} from 'lucide-react';
import { logger } from '@/lib/logger';
import type { MusicVideoScene } from '@/types/music-video-scene';

import { 
  TimelineClip, LayerConfig, ClipType, LayerType, TimelineMarker 
} from '@/interfaces/timeline';

// Responsive layer width - se calcula dinámicamente
const getLayerLabelWidth = () => {
  if (typeof window === 'undefined') return 120;
  if (window.innerWidth < 480) return 50;
  if (window.innerWidth < 640) return 70;
  if (window.innerWidth < 768) return 100;
  return 140;
};

const PLAYHEAD_WIDTH = 2;

type Tool = 'select' | 'razor' | 'trim' | 'hand';

interface GeneratedImage {
  id: string;
  url: string;
  prompt?: string;
  timestamp?: number;
  sceneId?: string;
}

// Interface para proyectos guardados
export interface SavedProject {
  id: string;
  name: string;
  thumbnail?: string;
  clips: TimelineClip[];
  generatedImages: GeneratedImage[];
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Contexto del proyecto para regeneración coherente
export interface ProjectContext {
  scriptContent?: string;
  selectedConcept?: {
    title?: string;
    story_concept?: string;
    visual_style?: string;
    mood?: string;
    color_palette?: string;
  };
  videoStyle?: {
    selectedDirector?: {
      name: string;
      style?: string;
    };
    style?: string;
    mood?: string;
  };
  artistReferenceImages?: string[];
  masterCharacter?: {
    imageUrl: string;
  };
}

interface TimelineEditorProps {
  initialClips: TimelineClip[];
  duration: number;
  initialZoom?: number;
  markers?: TimelineMarker[];
  readOnly?: boolean;
  videoPreviewUrl?: string;
  audioPreviewUrl?: string;
  onChange?: (clips: TimelineClip[]) => void;
  audioBuffer?: AudioBuffer;
  genreHint?: string;
  generatedImages?: GeneratedImage[];
  onAddImageToTimeline?: (image: GeneratedImage) => void;
  // 🔗 Contexto del proyecto para regeneración coherente
  projectContext?: ProjectContext;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  initialClips,
  duration,
  initialZoom = 120,
  markers = [],
  readOnly = false,
  videoPreviewUrl,
  audioPreviewUrl,
  onChange,
  audioBuffer,
  genreHint,
  generatedImages = [],
  onAddImageToTimeline,
  projectContext,
}) => {
  // 🔊 DEBUG: Log audioPreviewUrl on mount and changes
  useEffect(() => {
    console.log('═'.repeat(60));
    console.log('🎵 [TIMELINE] AUDIO PROP RECIBIDO');
    console.log('🔗 audioPreviewUrl:', audioPreviewUrl ? audioPreviewUrl.substring(0, 80) + '...' : '❌ NULL/UNDEFINED');
    console.log('⏱️ duration:', duration, 'segundos');
    console.log('═'.repeat(60));
  }, [audioPreviewUrl, duration]);
  
  const [clips, setClips] = useState<TimelineClip[]>(() => normalizeClips(initialClips));
  const [zoom, setZoom] = useState(initialZoom);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [rippleEnabled, setRippleEnabled] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GeneratedImage | null>(null);
  const [layerLabelWidth, setLayerLabelWidth] = useState(getLayerLabelWidth);
  
  // Estados para paneles redimensionables
  const [viewerHeight, setViewerHeight] = useState(55); // Altura del visor en % - Por defecto abierto
  const [galleryWidth, setGalleryWidth] = useState(180); // Ancho de la galería en px
  const [layerPanelWidth, setLayerPanelWidth] = useState(100); // Ancho de los labels de capas en px
  
  // Estados de arrastre
  const [isDraggingVertical, setIsDraggingVertical] = useState(false); // Divisor horizontal (visor/timeline)
  const [isDraggingGallery, setIsDraggingGallery] = useState(false); // Divisor vertical (visor/galería)
  const [isDraggingLayers, setIsDraggingLayers] = useState(false); // Divisor vertical (labels/tracks)
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // � Audio Analysis para sincronización con beats
  const { 
    analysis: audioAnalysis, 
    isAnalyzing: isAnalyzingAudio, 
    analyzeAudio, 
    snapToBeat,
    getNearestBeat 
  } = useAudioAnalysis();
  
  // �🎬 Motion Control & Video Generation
  const [motionPanelOpen, setMotionPanelOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<MusicVideoScene | null>(null);
  
  // 🖌️ Modales de Acciones sobre Clips
  const [showMusicianModal, setShowMusicianModal] = useState(false);
  const [musicianModalClip, setMusicianModalClip] = useState<TimelineClip | null>(null);
  const [showCameraAnglesModal, setShowCameraAnglesModal] = useState(false);
  const [cameraAnglesModalClip, setCameraAnglesModalClip] = useState<TimelineClip | null>(null);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
  const [imageEditorModalClip, setImageEditorModalClip] = useState<TimelineClip | null>(null);
  
  // 📁 Proyectos Guardados - Firebase + localStorage como caché
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [firebaseProjects, setFirebaseProjects] = useState<VideoProject[]>([]);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // 🔥 Cargar proyectos desde Firebase al montar o cuando cambia el usuario
  useEffect(() => {
    const loadFirebaseProjects = async () => {
      if (!user?.id) {
        setFirebaseProjects([]);
        return;
      }
      
      setIsLoadingProjects(true);
      try {
        console.log('🔥 [FIREBASE] Cargando proyectos del usuario:', user.id);
        const projects = await getUserProjects(user.id);
        console.log('🔥 [FIREBASE] Proyectos cargados:', projects.length);
        setFirebaseProjects(projects);
        
        // Convertir a formato SavedProject para compatibilidad
        const converted: SavedProject[] = projects.map(p => ({
          id: p.id,
          name: p.name,
          thumbnail: p.images?.[0]?.publicUrl,
          clips: p.script?.scenes?.map((scene, i) => ({
            id: i + 1,
            start: scene.start_time || 0,
            duration: scene.duration || 3,
            layerId: 1,
            type: ClipType.IMAGE,
            url: p.images?.find(img => img.sceneId === `scene-${i + 1}`)?.publicUrl || '',
            imageUrl: p.images?.find(img => img.sceneId === `scene-${i + 1}`)?.publicUrl || '',
            label: scene.scene_description?.substring(0, 30) || `Escena ${i + 1}`,
            metadata: { sceneData: scene }
          })) || [],
          generatedImages: p.images?.map((img, i) => ({
            id: img.sceneId,
            url: img.publicUrl,
            sceneId: img.sceneId
          })) || [],
          duration: p.script?.duration || 60,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }));
        
        setSavedProjects(converted);
      } catch (error) {
        console.error('❌ [FIREBASE] Error cargando proyectos:', error);
        // Fallback a localStorage
        try {
          const saved = localStorage.getItem('boostify_timeline_projects');
          const parsed = saved ? JSON.parse(saved) : [];
          setSavedProjects(parsed);
        } catch (e) {
          setSavedProjects([]);
        }
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    loadFirebaseProjects();
  }, [user?.id]);
  
  // 🔄 CRITICAL: Sincronizar clips cuando initialClips cambian (ej: cuando se generan imágenes)
  useEffect(() => {
    if (initialClips && initialClips.length > 0) {
      const normalizedClips = normalizeClips(initialClips);
      
      // Verificar si hay cambios reales (comparar URLs de imágenes)
      const currentHasImages = clips.some(c => c.url || c.imageUrl || c.thumbnailUrl);
      const newHasImages = normalizedClips.some(c => c.url || c.imageUrl || c.thumbnailUrl);
      
      // Si los nuevos clips tienen imágenes que los actuales no tienen, actualizar
      if (newHasImages || normalizedClips.length !== clips.length) {
        logger.info(`🔄 [SYNC] Actualizando clips internos: ${normalizedClips.length} clips, imágenes: ${newHasImages}`);
        
        // Preservar las imágenes existentes y actualizar con las nuevas
        setClips(prevClips => {
          return normalizedClips.map(newClip => {
            const existingClip = prevClips.find(c => c.id === newClip.id);
            if (existingClip) {
              // Merge: priorizar imágenes nuevas, pero mantener datos existentes
              return {
                ...existingClip,
                ...newClip,
                // Priorizar URL no vacía
                url: newClip.url || newClip.imageUrl || existingClip.url || existingClip.imageUrl || '',
                imageUrl: newClip.imageUrl || newClip.url || existingClip.imageUrl || existingClip.url || '',
                thumbnailUrl: newClip.thumbnailUrl || existingClip.thumbnailUrl || newClip.url || newClip.imageUrl || '',
              };
            }
            return newClip;
          });
        });
      }
    }
  }, [initialClips]);
  
  // 🖼️ CRITICAL: Auto-sincronizar imágenes generadas con clips del timeline
  useEffect(() => {
    if (generatedImages && generatedImages.length > 0) {
      logger.info(`🖼️ [AUTO-SYNC] ${generatedImages.length} imágenes generadas detectadas, sincronizando con timeline...`);
      
      setClips(prevClips => {
        let updated = false;
        const newClips = prevClips.map(clip => {
          const sceneNumber = typeof clip.id === 'number' ? clip.id : 
                              parseInt(String(clip.id).match(/(\d+)$/)?.[1] || '0');
          
          const matchingImage = generatedImages.find(img => {
            const imgSceneNumber = parseInt(String(img.id).match(/(\d+)$/)?.[1] || '0');
            return imgSceneNumber === sceneNumber;
          });
          
          if (matchingImage && matchingImage.url && !clip.url && !clip.imageUrl) {
            updated = true;
            logger.info(`🖼️ [AUTO-SYNC] Clip ${clip.id} → Imagen ${matchingImage.id}`);
            return {
              ...clip,
              layerId: clip.layerId || 1, // Asegurar layerId para capa de imágenes
              url: matchingImage.url,
              imageUrl: matchingImage.url,
              thumbnailUrl: matchingImage.url,
            };
          }
          
          // Asegurar layerId incluso si no hay imagen nueva
          return {
            ...clip,
            layerId: clip.layerId || (clip.type === ClipType.AUDIO ? 2 : 1),
          };
        });
        
        if (updated) {
          logger.info(`✅ [AUTO-SYNC] Timeline actualizado con imágenes generadas`);
        }
        
        return updated ? newClips : prevClips;
      });
    }
  }, [generatedImages]);
  
  // 🎵 AUTO-ADD: Crear clip de audio automáticamente cuando hay audioPreviewUrl
  // También crear segmentos de audio para clips que necesitan lipsync
  useEffect(() => {
    console.log('🎵 [AUTO-ADD EFFECT] Verificando condiciones para crear audio clip:');
    console.log('  - audioPreviewUrl:', audioPreviewUrl ? '✅ ' + audioPreviewUrl.substring(0, 50) + '...' : '❌ NULL');
    console.log('  - duration:', duration > 0 ? '✅ ' + duration + 's' : '❌ ' + duration);
    
    if (audioPreviewUrl && duration > 0) {
      setClips(prevClips => {
        // Verificar si ya hay un clip de audio principal
        const hasMainAudioClip = prevClips.some(c => 
          (c.layerId === 2 || c.type === ClipType.AUDIO) && 
          !c.metadata?.isLipsyncSegment
        );
        
        const newClips = [...prevClips];
        
        if (!hasMainAudioClip) {
          console.log('═'.repeat(60));
          console.log('🎵 [AUTO-ADD] CREANDO CLIP DE AUDIO PRINCIPAL');
          console.log(`🔗 URL: ${audioPreviewUrl.substring(0, 80)}...`);
          console.log(`⏱️ Duración: ${duration} segundos`);
          console.log('═'.repeat(60));
          const audioClip: TimelineClip = {
            id: 99999, // ID especial para audio
            layerId: 2,
            type: ClipType.AUDIO,
            start: 0,
            duration: duration,
            url: audioPreviewUrl,
            title: '🎵 Audio Principal',
            in: 0,
            out: duration,
            sourceStart: 0,
            metadata: {
              isMainAudio: true,
              totalDuration: duration
            }
          };
          console.log(`🎵 [AUTO-ADD] Audio clip creado:`, audioClip);
          newClips.push(audioClip);
        }
        
        // 🎤 LIPSYNC: Crear segmentos de audio para clips que necesitan lipsync
        const clipsNeedingLipsync = prevClips.filter(c => 
          c.layerId === 1 && 
          (c.metadata?.needsLipsync || c.needsLipsync) &&
          !prevClips.some(ac => ac.metadata?.parentSceneId === c.id && ac.metadata?.isLipsyncSegment)
        );
        
        if (clipsNeedingLipsync.length > 0) {
          logger.info(`🎤 [AUTO-ADD] Creando ${clipsNeedingLipsync.length} segmentos de lipsync`);
          
          clipsNeedingLipsync.forEach((clip, index) => {
            const lipsyncSegment: TimelineClip = {
              id: 90000 + index, // IDs especiales para segmentos lipsync
              layerId: 3, // Capa 3 = Lipsync Segments
              type: ClipType.AUDIO,
              start: clip.start,
              duration: clip.duration,
              url: audioPreviewUrl,
              title: `🎤 Vocal ${clip.id}`,
              in: clip.start, // Punto de entrada en el audio
              out: clip.start + clip.duration, // Punto de salida
              sourceStart: clip.start,
              metadata: {
                isLipsyncSegment: true,
                parentSceneId: clip.id,
                lyrics: clip.metadata?.lyrics || '',
                hasVocals: true,
                inPoint: clip.start,
                outPoint: clip.start + clip.duration
              }
            };
            newClips.push(lipsyncSegment);
            console.log(`🎤 [AUTO-ADD] Lipsync segment creado para clip ${clip.id}:`, lipsyncSegment);
          });
        }
        
        return newClips.length !== prevClips.length ? newClips : prevClips;
      });
    }
  }, [audioPreviewUrl, duration, clips]);
  
  // 🎵 AUTO-ANALYZE: Analizar audio para obtener beats cuando se carga
  useEffect(() => {
    if (audioPreviewUrl && !audioAnalysis && !isAnalyzingAudio) {
      console.log('🎵 [AUTO-ANALYZE] Iniciando análisis de audio para beats...');
      analyzeAudio(audioPreviewUrl).then(() => {
        console.log('🎵 [AUTO-ANALYZE] Análisis de audio completado:', audioAnalysis);
      }).catch((err) => {
        console.warn('⚠️ [AUTO-ANALYZE] Error analizando audio:', err);
      });
    }
  }, [audioPreviewUrl, audioAnalysis, isAnalyzingAudio, analyzeAudio]);
  
  // Generar marcadores de beat para el timeline
  const beatGuides = useMemo(() => {
    if (!audioAnalysis?.beats) return [];
    // Usar beats o downbeats para las guías visuales
    const beatsToUse = audioAnalysis.downbeats?.length > 0 
      ? audioAnalysis.downbeats 
      : audioAnalysis.beats.filter((_, i) => i % 4 === 0); // Cada 4 beats si no hay downbeats
    return beatsToUse.slice(0, 200); // Limitar para performance
  }, [audioAnalysis]);
  
  // ⏱️ CRITICAL: Constante de duración máxima de clip (Grok Imagine = 6s)
  const MAX_CLIP_DURATION = 6;
  
  // 🎬 CRITICAL: Calcular clip activo basado en currentTime para sincronización exacta
  const activeClip = useMemo(() => {
    // Buscar clip de imagen (layerId 1) que esté en el tiempo actual
    const imageClips = clips.filter(c => c.layerId === 1 || c.type === ClipType.IMAGE || c.type === ClipType.GENERATED_IMAGE);
    
    for (const clip of imageClips) {
      const clipEnd = clip.start + clip.duration;
      // currentTime debe estar >= start y < end para estar "dentro" del clip
      if (currentTime >= clip.start && currentTime < clipEnd) {
        return clip;
      }
    }
    return null;
  }, [clips, currentTime]);
  
  // 🖼️ Función helper para obtener URL de imagen de un clip
  const getClipImageUrl = useCallback((clip: TimelineClip | null): string | null => {
    if (!clip) return null;
    return clip.imageUrl || clip.thumbnailUrl || clip.url || 
           (typeof clip.generatedImage === 'string' ? clip.generatedImage : null) ||
           clip.image_url || clip.publicUrl || clip.firebaseUrl || null;
  }, []);
  
  // URL de imagen activa para el visor
  const activeClipImageUrl = useMemo(() => {
    return getClipImageUrl(activeClip);
  }, [activeClip, getClipImageUrl]);

  // 🎬 URL de video activo para el visor (si se generó video desde imagen)
  const activeClipVideoUrl = useMemo(() => {
    if (!activeClip) return null;
    // Prioridad: lipsyncVideoUrl > videoUrl en metadata > videoUrl directo
    return activeClip.metadata?.lipsyncVideoUrl || 
           activeClip.metadata?.videoUrl || 
           activeClip.videoUrl || 
           null;
  }, [activeClip]);
  
  // 🎥 Ref para el video del clip activo
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  // 🎬 CRITICAL: Sincronizar video del clip activo con el timeline
  useEffect(() => {
    const video = activeVideoRef.current;
    if (!video || !activeClip || !activeClipVideoUrl) return;
    
    // Calcular tiempo local dentro del clip
    const clipLocalTime = currentTime - activeClip.start;
    
    // Solo actualizar si el tiempo es válido
    if (clipLocalTime >= 0 && clipLocalTime < (video.duration || 6)) {
      // Evitar actualizaciones constantes - solo si diferencia > 0.1s
      if (Math.abs(video.currentTime - clipLocalTime) > 0.1) {
        video.currentTime = clipLocalTime;
      }
    }
    
    // Controlar play/pause
    if (isPlaying && video.paused) {
      video.play().catch(() => {}); // Ignorar errores de autoplay
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying, currentTime, activeClip, activeClipVideoUrl]);
  
  // 🖱️ Menú Contextual (click derecho)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    clipId: number | null;
    time: number;
  }>({ visible: false, x: 0, y: 0, clipId: null, time: 0 });
  const [clipboardClip, setClipboardClip] = useState<TimelineClip | null>(null);

  // 🎬 Framerate para timecode
  const [framerate, setFramerate] = useState<24 | 30 | 60>(30);
  const frameInterval = 1 / framerate; // Duración de un frame en segundos

  // Función para formatear timecode según framerate (HH:MM:SS:FF)
  const formatTimecode = useCallback((seconds: number): string => {
    const totalFrames = Math.floor(seconds * framerate);
    const frames = totalFrames % framerate;
    const totalSeconds = Math.floor(seconds);
    const secs = totalSeconds % 60;
    const mins = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  }, [framerate]);

  // Snap al frame más cercano
  const snapToFrame = useCallback((time: number): number => {
    return Math.round(time * framerate) / framerate;
  }, [framerate]);

  // Manejador del divisor vertical (visor/timeline)
  useEffect(() => {
    if (!isDraggingVertical) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const toolbarHeight = 60;
      const availableHeight = rect.height - toolbarHeight;
      const mouseY = e.clientY - rect.top - toolbarHeight;
      const percentage = (mouseY / availableHeight) * 100;
      setViewerHeight(Math.max(15, Math.min(65, percentage)));
    };
    
    const handleMouseUp = () => setIsDraggingVertical(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVertical]);

  // Manejador del divisor horizontal (visor/galería)
  useEffect(() => {
    if (!isDraggingGallery) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = rect.right - e.clientX;
      setGalleryWidth(Math.max(80, Math.min(350, mouseX)));
    };
    
    const handleMouseUp = () => setIsDraggingGallery(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingGallery]);

  // Manejador del divisor de capas (labels/tracks)
  useEffect(() => {
    if (!isDraggingLayers) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      setLayerPanelWidth(Math.max(50, Math.min(200, mouseX)));
    };
    
    const handleMouseUp = () => setIsDraggingLayers(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingLayers]);

  // Responsive layer width
  useEffect(() => {
    const handleResize = () => setLayerLabelWidth(getLayerLabelWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Undo/redo
  const [history, setHistory] = useState<{ past: TimelineClip[][]; future: TimelineClip[][] }>({
    past: [],
    future: [],
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRaf = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);

  // Beats como array simple - ahora usa audioAnalysis si está disponible, sino markers
  // (beatGuides ya está definido arriba con audioAnalysis)
  const sectionGuides = useMemo(() => markers.filter(m => m.type === 'section').map(m => m.time), [markers]);

  // Play loop con tiempo real y exacto basado en framerate
  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (playingRaf.current) cancelAnimationFrame(playingRaf.current);
      lastFrameTime.current = 0;
      return;
    }
    
    // 🎯 CRITICAL: Usar el audio como fuente de tiempo real para sincronización exacta
    // El audio es la única fuente de verdad para el tiempo
    const startPlaybackTime = performance.now();
    const startCurrentTime = currentTime;
    
    const tick = () => {
      // Método 1: Si hay audio, usar su tiempo como referencia (más preciso)
      if (audioRef.current && !audioRef.current.paused) {
        const audioTime = audioRef.current.currentTime;
        // Snap al frame más cercano para display
        const snappedTime = Math.round(audioTime * framerate) / framerate;
        
        if (snappedTime >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          return;
        }
        
        setCurrentTime(snappedTime);
      } else {
        // Método 2: Sin audio, usar performance.now() para tiempo real
        const elapsedMs = performance.now() - startPlaybackTime;
        const elapsedSeconds = elapsedMs / 1000;
        let newTime = startCurrentTime + elapsedSeconds;
        
        // Snap al frame exacto
        newTime = Math.round(newTime * framerate) / framerate;
        
        if (newTime >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          return;
        }
        
        setCurrentTime(newTime);
      }
      
      playingRaf.current = requestAnimationFrame(tick);
    };
    
    playingRaf.current = requestAnimationFrame(tick);
    
    // Sincronizar media con el tiempo actual al iniciar
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
      videoRef.current.playbackRate = 1;
      videoRef.current.play().catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
      audioRef.current.playbackRate = 1;
      audioRef.current.play().catch(() => {});
    }
    
    return () => {
      if (playingRaf.current) cancelAnimationFrame(playingRaf.current);
    };
  }, [isPlaying, duration, framerate]);

  // Sync media time on currentTime change if paused
  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current) videoRef.current.currentTime = currentTime;
      if (audioRef.current) audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

  // emit onChange
  useEffect(() => {
    onChange?.(clips);
  }, [clips, onChange]);

  // Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          doUndo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          doRedo();
        }
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
      if (e.code === 'KeyV') setTool('select');
      if (e.code === 'KeyC') setTool('razor');
      if (e.code === 'KeyT') setTool('trim');
      if (e.code === 'KeyH') setTool('hand');
      if (e.code === 'Equal' || e.code === 'Plus') {
        e.preventDefault();
        zoomIn();
      }
      if (e.code === 'Minus') {
        e.preventDefault();
        zoomOut();
      }
      // Navegación del timeline con flechas (basada en frames)
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setCurrentTime(t => {
          // Shift = 1 frame, normal = 1 segundo, Ctrl = 5 segundos
          const step = e.shiftKey ? (1 / framerate) : e.ctrlKey ? 5 : 1;
          const newTime = Math.max(0, t - step);
          // Snap al frame exacto
          return Math.round(newTime * framerate) / framerate;
        });
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        setCurrentTime(t => {
          const step = e.shiftKey ? (1 / framerate) : e.ctrlKey ? 5 : 1;
          const newTime = Math.min(duration, t + step);
          return Math.round(newTime * framerate) / framerate;
        });
      }
      // Comma/Period para avanzar frame por frame (estándar de edición)
      if (e.code === 'Comma') {
        e.preventDefault();
        setCurrentTime(t => {
          const newTime = Math.max(0, t - (1 / framerate));
          return Math.round(newTime * framerate) / framerate;
        });
      }
      if (e.code === 'Period') {
        e.preventDefault();
        setCurrentTime(t => {
          const newTime = Math.min(duration, t + (1 / framerate));
          return Math.round(newTime * framerate) / framerate;
        });
      }
      if (e.code === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      }
      if (e.code === 'End') {
        e.preventDefault();
        setCurrentTime(Math.round(duration * framerate) / framerate);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration, framerate]);

  const pushHistory = useCallback((newClips: TimelineClip[]) => {
    setHistory(h => ({
      past: [...h.past, clips],
      future: [],
    }));
    setClips(newClips);
  }, [clips]);

  // 📁 Funciones de Proyectos Guardados (después de pushHistory)
  const handleSaveProject = useCallback(async () => {
    // Verificar usuario autenticado
    if (!user?.id) {
      toast({
        title: "⚠️ Usuario no autenticado",
        description: "Debes iniciar sesión para guardar proyectos de forma permanente",
        variant: "destructive"
      });
      return;
    }
    
    const name = projectName.trim() || `Proyecto ${new Date().toLocaleDateString()}`;
    
    // Verificar que hay imágenes para guardar
    const imagesWithUrls = generatedImages.filter(img => img.url);
    if (imagesWithUrls.length === 0) {
      toast({
        title: "⚠️ Sin imágenes",
        description: "Genera imágenes antes de guardar el proyecto",
        variant: "destructive"
      });
      return;
    }
    
    setIsSavingProject(true);
    setSaveProgress(0);
    setSaveStatus('Preparando proyecto...');
    
    try {
      // Preparar datos del script para Firebase
      const scriptData = {
        scenes: clips.map((clip, i) => ({
          scene_number: i + 1,
          start_time: clip.start,
          duration: clip.duration,
          scene_description: clip.label || `Escena ${i + 1}`,
          prompt: clip.metadata?.prompt || '',
          camera: clip.metadata?.camera || 'Medium shot'
        })),
        duration: duration,
        sceneCount: clips.length
      };
      
      // Preparar imágenes para subir a Firebase Storage
      const imagesToUpload = imagesWithUrls.map((img, i) => ({
        sceneId: `scene-${i + 1}`,
        imageData: img.url // URL temporal de FAL que se convertirá a permanente
      }));
      
      console.log('🔥 [FIREBASE] Guardando proyecto:', name, 'con', imagesToUpload.length, 'imágenes');
      
      // Crear proyecto con imágenes en Firebase
      const { projectId, project } = await createProjectWithImages(
        name,
        user.id,
        scriptData,
        imagesToUpload,
        {
          createdFrom: 'TimelineEditor',
          director: projectContext?.videoStyle?.selectedDirector?.name,
          concept: projectContext?.selectedConcept
        },
        (progress, status) => {
          setSaveProgress(progress);
          setSaveStatus(status);
        }
      );
      
      console.log('✅ [FIREBASE] Proyecto guardado con ID:', projectId);
      
      // Actualizar lista de proyectos
      const newProject: SavedProject = {
        id: projectId,
        name,
        thumbnail: project.images?.[0]?.publicUrl,
        clips: clips.map(c => ({
          ...c,
          // Actualizar URLs a las permanentes de Firebase
          url: project.images?.find(img => img.sceneId === `scene-${c.id}`)?.publicUrl || c.url,
          imageUrl: project.images?.find(img => img.sceneId === `scene-${c.id}`)?.publicUrl || c.imageUrl,
        })),
        generatedImages: project.images?.map((img, i) => ({
          id: img.sceneId,
          url: img.publicUrl, // URL permanente de Firebase Storage
          sceneId: img.sceneId
        })) || generatedImages,
        duration: duration,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
      
      setSavedProjects(prev => [newProject, ...prev]);
      setProjectName('');
      
      toast({
        title: "✅ Proyecto guardado en la nube",
        description: `"${name}" guardado con ${clips.length} clips. Las imágenes ahora son permanentes.`,
      });
      
    } catch (error) {
      console.error('❌ [FIREBASE] Error guardando proyecto:', error);
      toast({
        title: "❌ Error al guardar",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive"
      });
    } finally {
      setIsSavingProject(false);
      setSaveProgress(0);
      setSaveStatus('');
    }
  }, [clips, generatedImages, duration, projectName, user?.id, projectContext, toast]);

  const handleLoadProject = useCallback((project: SavedProject) => {
    logger.info(`📂 Cargando proyecto: ${project.name}`);
    logger.info(`📊 Clips: ${project.clips?.length || 0}, Imágenes: ${project.generatedImages?.length || 0}`);
    
    // Log para debug - ver estructura de clips guardados
    console.log('📂 [DEBUG] Clips del proyecto (raw):', JSON.stringify(project.clips, null, 2));
    console.log('📂 [DEBUG] Imágenes del proyecto:', project.generatedImages);
    
    // Usar normalizeClips para manejar la conversión de formato
    const normalizedClips = normalizeClips(project.clips || []);
    
    // Asociar imágenes generadas a los clips normalizados
    const loadedClips = normalizedClips.map((clip, index) => {
      // Buscar si hay una imagen generada correspondiente
      const matchingImage = (project.generatedImages || []).find(img => {
        const clipSceneNumber = typeof clip.id === 'number' ? clip.id : 
                                parseInt(String(clip.id).match(/(\d+)$/)?.[1] || '0');
        const imgSceneNumber = parseInt(String(img.id).match(/(\d+)$/)?.[1] || '0');
        return imgSceneNumber === clipSceneNumber;
      });
      
      // Si el clip no tiene imagen pero hay una matching, asignarla
      const finalImageUrl = clip.url || clip.imageUrl || matchingImage?.url || '';
      
      console.log(`📍 [LOAD] Clip ${clip.id}: start=${clip.start?.toFixed(2)}s, dur=${clip.duration?.toFixed(2)}s, layerId=${clip.layerId}, img=${!!finalImageUrl}`);
      
      return {
        ...clip,
        url: finalImageUrl,
        imageUrl: finalImageUrl,
        thumbnailUrl: clip.thumbnailUrl || finalImageUrl,
      };
    });
    
    logger.info(`✅ ${loadedClips.filter(c => c.url || c.imageUrl).length} clips con imágenes cargados`);
    logger.info(`📊 Clips por capa: Capa 1: ${loadedClips.filter(c => c.layerId === 1).length}, Capa 2: ${loadedClips.filter(c => c.layerId === 2).length}`);
    console.log('📂 [DEBUG] Clips finales a setear:', loadedClips.map(c => ({id: c.id, start: c.start, duration: c.duration, layerId: c.layerId, hasImg: !!(c.url || c.imageUrl)})));
    
    setClips(loadedClips);
    pushHistory(loadedClips);
    setShowProjectsPanel(false);
    
    toast({
      title: "✅ Proyecto cargado",
      description: `"${project.name}" con ${loadedClips.length} clips`,
    });
  }, [pushHistory, toast]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    // Eliminar de Firebase si el usuario está autenticado
    if (user?.id) {
      try {
        console.log('🗑️ [FIREBASE] Eliminando proyecto:', projectId);
        await deleteVideoProject(projectId, user.id);
        console.log('✅ [FIREBASE] Proyecto eliminado');
      } catch (error) {
        console.error('❌ [FIREBASE] Error eliminando proyecto:', error);
        // Continuar con eliminación local de todas formas
      }
    }
    
    // Eliminar del estado local
    const updated = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updated);
    
    toast({
      title: "🗑️ Proyecto eliminado",
      description: "El proyecto y sus imágenes han sido eliminados",
    });
  }, [savedProjects, user?.id, toast]);

  // 🎬 EXPORT VIDEO - Genera el video final a partir del timeline
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExportVideo = useCallback(async () => {
    if (clips.length === 0) {
      toast({
        title: "Sin clips",
        description: "Añade clips al timeline para exportar",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: "🎬 Iniciando exportación...",
      description: "Preparando video para renderizado",
    });

    try {
      // Preparar datos del timeline para exportar
      const exportData = {
        clips: clips.map(c => ({
          id: c.id,
          start: c.start,
          duration: c.duration,
          layerId: c.layerId,
          type: c.type,
          imageUrl: c.imageUrl || c.url,
          videoUrl: c.metadata?.videoUrl,
          title: c.title,
          effects: c.effects,
          transition: c.transition,
        })),
        duration: duration,
        audioUrl: audioPreviewUrl,
        projectName: projectName || `Export_${new Date().toISOString().slice(0,10)}`,
      };

      // Llamar al endpoint de exportación
      const response = await fetch('/api/video-projects/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error exportando video');
      }

      const data = await response.json();

      if (data.downloadUrl) {
        // Descargar directamente
        window.open(data.downloadUrl, '_blank');
        toast({
          title: "✅ Exportación completa",
          description: "Tu video está listo para descargar",
        });
      } else if (data.jobId) {
        // El renderizado está en proceso
        toast({
          title: "⏳ Renderizando video...",
          description: `Job ID: ${data.jobId}. Te notificaremos cuando esté listo.`,
        });
      }

      logger.info('🎬 [Export] Video exportado exitosamente', data);
    } catch (error) {
      logger.error('❌ [Export] Error exportando video:', error);
      toast({
        title: "Error en exportación",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [clips, duration, audioPreviewUrl, projectName, toast]);

  //  CRITICAL: Auto-sincronizar imágenes generadas con clips del timeline
  useEffect(() => {
    if (generatedImages && generatedImages.length > 0) {
      logger.info(` [AUTO-SYNC] ${generatedImages.length} imágenes generadas detectadas, sincronizando con timeline...`);
      
      setClips(prevClips => {
        let updated = false;
        const newClips = prevClips.map(clip => {
          const sceneNumber = typeof clip.id === 'number' ? clip.id : 
                              parseInt(String(clip.id).match(/(\d+)$/)?.[1] || '0');
          
          const matchingImage = generatedImages.find(img => {
            const imgSceneNumber = parseInt(String(img.id).match(/(\d+)$/)?.[1] || '0');
            return imgSceneNumber === sceneNumber;
          });
          
          if (matchingImage && matchingImage.url && !clip.url && !clip.imageUrl) {
            updated = true;
            logger.info(` [AUTO-SYNC] Clip ${clip.id}  Imagen ${matchingImage.id}`);
            return {
              ...clip,
              url: matchingImage.url,
              imageUrl: matchingImage.url,
              thumbnail: matchingImage.url,
            };
          }
          
          return clip;
        });
        
        if (updated) {
          logger.info(` [AUTO-SYNC] Timeline actualizado con imágenes generadas`);
        }
        
        return updated ? newClips : prevClips;
      });
    }
  }, [generatedImages]);
  
  //  Menú Contextual
  const handleContextMenu = useCallback((e: React.MouseEvent, clipId?: number) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    const time = currentTime;
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, clipId: clipId || null, time });
  }, [currentTime]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleCopyClip = useCallback(() => {
    if (contextMenu.clipId) {
      const clip = clips.find(c => c.id === contextMenu.clipId);
      if (clip) {
        setClipboardClip({ ...clip });
        logger.info('📋 Clip copiado:', clip.id);
      }
    }
    closeContextMenu();
  }, [clips, contextMenu.clipId, closeContextMenu]);

  const handlePasteClip = useCallback(() => {
    if (clipboardClip) {
      const newClip: TimelineClip = {
        ...clipboardClip,
        id: Math.max(0, ...clips.map(c => c.id)) + 1,
        start: currentTime,
      };
      pushHistory([...clips, newClip]);
      logger.info('📋 Clip pegado en:', currentTime);
    }
    closeContextMenu();
  }, [clipboardClip, clips, currentTime, pushHistory, closeContextMenu]);

  const handleDuplicateClip = useCallback(() => {
    if (contextMenu.clipId) {
      const clip = clips.find(c => c.id === contextMenu.clipId);
      if (clip) {
        const newClip: TimelineClip = {
          ...clip,
          id: Math.max(0, ...clips.map(c => c.id)) + 1,
          start: clip.start + clip.duration + 0.1,
        };
        pushHistory([...clips, newClip]);
        logger.info('🔄 Clip duplicado:', clip.id);
      }
    }
    closeContextMenu();
  }, [clips, contextMenu.clipId, pushHistory, closeContextMenu]);

  const handleDeleteClipContext = useCallback(() => {
    if (contextMenu.clipId) {
      const newClips = clips.filter(c => c.id !== contextMenu.clipId);
      pushHistory(newClips);
      setSelectedClipId(null);
      logger.info('🗑️ Clip eliminado:', contextMenu.clipId);
    }
    closeContextMenu();
  }, [clips, contextMenu.clipId, pushHistory, closeContextMenu]);

  const handleSplitAtPlayhead = useCallback(() => {
    if (contextMenu.clipId) {
      const clip = clips.find(c => c.id === contextMenu.clipId);
      if (clip && currentTime > clip.start && currentTime < clip.start + clip.duration) {
        const splitTime = currentTime - clip.start;
        const newClip: TimelineClip = {
          ...clip,
          id: Math.max(0, ...clips.map(c => c.id)) + 1,
          start: currentTime,
          duration: clip.duration - splitTime,
          sourceStart: (clip.sourceStart || 0) + splitTime,
        };
        const updatedClips = clips.map(c =>
          c.id === contextMenu.clipId ? { ...c, duration: splitTime } : c
        );
        pushHistory([...updatedClips, newClip]);
        logger.info('✂️ Clip dividido en:', currentTime);
      }
    }
    closeContextMenu();
  }, [clips, contextMenu.clipId, currentTime, pushHistory, closeContextMenu]);

  const handleSetPlayheadHere = useCallback(() => {
    setCurrentTime(contextMenu.time);
    closeContextMenu();
  }, [contextMenu.time, closeContextMenu]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) closeContextMenu();
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible, closeContextMenu]);

  // Ref para acceder al estado actual de clips sin closures obsoletas
  const clipsRef = useRef(clips);
  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  const doUndo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const currentClips = clipsRef.current;
      const newPast = h.past.slice(0, -1);
      const newFuture = [currentClips, ...h.future];
      const restored = h.past[h.past.length - 1];
      setClips(restored);
      return { past: newPast, future: newFuture };
    });
  }, []);

  const doRedo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const currentClips = clipsRef.current;
      const newPast = [...h.past, currentClips];
      const newFuture = h.future.slice(1);
      const restored = h.future[0];
      setClips(restored);
      return { past: newPast, future: newFuture };
    });
  }, []);

  const handleSelectClip = useCallback((id: number | null) => {
    setSelectedClipId(id);
  }, []);

  const handleDeleteClip = useCallback((id: number) => {
    if (readOnly) return;
    const newClips = clips.filter(c => c.id !== id);
    if (rippleEnabled) {
      const deletedClip = clips.find(c => c.id === id);
      if (deletedClip) {
        const shiftAmount = deletedClip.duration;
        const shifted = newClips.map(c => {
          if (c.start > deletedClip.start) {
            return { ...c, start: c.start - shiftAmount };
          }
          return c;
        });
        pushHistory(shifted);
        return;
      }
    }
    pushHistory(newClips);
  }, [clips, pushHistory, readOnly, rippleEnabled]);

  // Ref para guardar el estado antes de empezar a mover/redimensionar
  const operationStartClipsRef = useRef<TimelineClip[] | null>(null);

  // Al comenzar un drag o resize, guardamos el estado inicial
  const handleDragStart = useCallback(() => {
    if (!operationStartClipsRef.current) {
      operationStartClipsRef.current = [...clipsRef.current];
    }
  }, []);

  const handleResizeStart = useCallback(() => {
    if (!operationStartClipsRef.current) {
      operationStartClipsRef.current = [...clipsRef.current];
    }
  }, []);

  // Al terminar un drag, guardamos en el historial
  const handleDragEnd = useCallback(() => {
    if (operationStartClipsRef.current) {
      // Solo guardar si hubo cambios
      const startClips = operationStartClipsRef.current;
      const currentClips = clipsRef.current;
      const hasChanges = JSON.stringify(startClips) !== JSON.stringify(currentClips);
      if (hasChanges) {
        setHistory(h => ({
          past: [...h.past, startClips],
          future: [],
        }));
      }
      operationStartClipsRef.current = null;
    }
  }, []);

  // Al terminar un resize, guardamos en el historial
  const handleResizeEnd = useCallback(() => {
    if (operationStartClipsRef.current) {
      const startClips = operationStartClipsRef.current;
      const currentClips = clipsRef.current;
      const hasChanges = JSON.stringify(startClips) !== JSON.stringify(currentClips);
      if (hasChanges) {
        setHistory(h => ({
          past: [...h.past, startClips],
          future: [],
        }));
      }
      operationStartClipsRef.current = null;
    }
  }, []);

  const handleMoveClip = useCallback((id: number, newStart: number) => {
    if (readOnly) return;
    const currentClips = clipsRef.current;
    const snap = (t: number) => {
      if (!snapEnabled) return t;
      const snapDist = 5 / zoom; // 5px
      const allGuides = [...beatGuides, ...sectionGuides, 0, duration];
      for (const guide of allGuides) {
        if (Math.abs(t - guide) < snapDist) return guide;
      }
      for (const clip of currentClips) {
        if (clip.id === id) continue;
        if (Math.abs(t - clip.start) < snapDist) return clip.start;
        if (Math.abs(t - (clip.start + clip.duration)) < snapDist) return clip.start + clip.duration;
      }
      return t;
    };
    const snappedStart = snap(newStart);
    const newClips = currentClips.map(c => c.id === id ? { ...c, start: Math.max(0, snappedStart) } : c);
    setClips(newClips);
  }, [readOnly, snapEnabled, beatGuides, sectionGuides, duration, zoom]);

  const handleSplitClip = useCallback((id: number, timeAtClip: number) => {
    if (readOnly) return;
    const clip = clips.find(c => c.id === id);
    if (!clip) return;
    const relativeTime = timeAtClip - clip.start;
    if (relativeTime <= 0 || relativeTime >= clip.duration) return;
    const newClip: TimelineClip = {
      ...clip,
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      start: clip.start + relativeTime,
      duration: clip.duration - relativeTime,
      sourceStart: (clip.sourceStart || 0) + relativeTime,
    };
    const updated = clips.map(c =>
      c.id === id ? { ...c, duration: relativeTime } : c
    );
    pushHistory([...updated, newClip]);
  }, [clips, readOnly, pushHistory]);

  const handleResizeClip = useCallback((id: number, newStart: number, newDuration: number, edge?: string) => {
    if (readOnly) return;
    const currentClips = clipsRef.current;
    const clip = currentClips.find(c => c.id === id);
    if (!clip) return;
    // Permitir redimensionar hasta duración mínima de 0.1s
    const newClips = currentClips.map(c => {
      if (c.id === id) {
        return {
          ...c,
          start: Math.max(0, newStart),
          duration: Math.max(0.1, newDuration),
        };
      }
      return c;
    });
    setClips(newClips);
  }, [readOnly]);

  const handleRazorClick = useCallback((clipId: number, timeAtClipGlobal: number) => {
    handleSplitClip(clipId, timeAtClipGlobal);
  }, [handleSplitClip]);

  // Click en timeline/ruler: posiciona el cursor en el frame más cercano
  const handleTimelineClick = (timeGlobal: number) => {
    const clampedTime = clamp(timeGlobal, 0, duration);
    // Snap al frame exacto
    const snappedTime = Math.round(clampedTime * framerate) / framerate;
    setCurrentTime(snappedTime);
  };

  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 800));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 20));

  // ===== HANDLERS PARA ACCIONES SOBRE CLIPS =====

  // Actualizar un clip específico
  const updateClip = useCallback((clipId: number, updates: Partial<TimelineClip>) => {
    setClips(prevClips => prevClips.map(c => 
      c.id === clipId ? { ...c, ...updates } : c
    ));
  }, []);

  // ✏️ Editar Imagen con Nano Banana AI
  const handleEditImage = useCallback((clip: TimelineClip) => {
    setImageEditorModalClip(clip);
    setShowImageEditorModal(true);
    logger.info(`✏️ [Timeline] Abriendo editor de imagen para clip ${clip.id}`);
  }, []);

  const handleImageEdited = useCallback((newImageUrl: string, newPrompt: string) => {
    if (imageEditorModalClip) {
      updateClip(imageEditorModalClip.id, {
        imageUrl: newImageUrl,
        metadata: {
          ...imageEditorModalClip.metadata,
          imagePrompt: newPrompt,
          isGeneratedImage: true
        }
      });
      toast({
        title: "Imagen editada",
        description: "La imagen ha sido actualizada con Nano Banana AI",
      });
      logger.info(`✅ [Timeline] Imagen editada para clip ${imageEditorModalClip.id}`);
    }
    setShowImageEditorModal(false);
    setImageEditorModalClip(null);
  }, [imageEditorModalClip, updateClip, toast]);

  // 🎸 Agregar Músico
  const handleAddMusician = useCallback((clip: TimelineClip) => {
    setMusicianModalClip(clip);
    setShowMusicianModal(true);
    logger.info(`🎸 [Timeline] Abriendo modal de músico para clip ${clip.id}`);
  }, []);

  const handleMusicianAdded = useCallback((musicianData: any) => {
    if (musicianModalClip) {
      updateClip(musicianModalClip.id, {
        metadata: {
          ...musicianModalClip.metadata,
          musicianIntegrated: true,
          musicianData: musicianData
        }
      });
      toast({
        title: "Músico agregado",
        description: `${musicianData.musicianType || 'Músico'} añadido al timeline`,
      });
      logger.info(`✅ [Timeline] Músico agregado a clip ${musicianModalClip.id}`);
    }
    setShowMusicianModal(false);
    setMusicianModalClip(null);
  }, [musicianModalClip, updateClip, toast]);

  // 📷 Ángulos de Cámara
  const handleCameraAngles = useCallback((clip: TimelineClip) => {
    setCameraAnglesModalClip(clip);
    setShowCameraAnglesModal(true);
    logger.info(`📷 [Timeline] Abriendo modal de cámara para clip ${clip.id}`);
  }, []);

  const handleCameraAngleSelected = useCallback((imageUrl: string, angleName: string) => {
    if (cameraAnglesModalClip) {
      updateClip(cameraAnglesModalClip.id, {
        imageUrl,
        thumbnailUrl: imageUrl,
        metadata: {
          ...cameraAnglesModalClip.metadata,
          cameraAngle: angleName,
        },
      });
      toast({
        title: "Ángulo aplicado",
        description: `Ángulo "${angleName}" aplicado al clip`,
      });
      logger.info(`✅ [Timeline] Ángulo de cámara aplicado a clip ${cameraAnglesModalClip.id}`);
    }
  }, [cameraAnglesModalClip, updateClip, toast]);

  // 🔄 Regenerar Imagen - Usando FAL Nano-Banana CON CONTEXTO DEL PROYECTO
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);
  
  const handleRegenerateImage = useCallback(async (clip: TimelineClip) => {
    logger.info(`🔄 [Timeline] Regenerando imagen para clip ${clip.id} CON CONTEXTO`);
    setIsRegenerating(clip.id);
    
    toast({
      title: "Regenerando imagen...",
      description: "Generando nueva imagen coherente con el concepto del video",
    });

    try {
      // 🎯 Construir prompt ENRIQUECIDO con contexto del proyecto
      const basePrompt = clip.metadata?.imagePrompt || clip.title || '';
      
      // Extraer contexto del proyecto
      const concept = projectContext?.selectedConcept;
      const director = projectContext?.videoStyle?.selectedDirector;
      const hasReferenceImages = (projectContext?.artistReferenceImages?.length ?? 0) > 0 || 
                                  !!projectContext?.masterCharacter;
      
      // Intentar extraer info de la escena desde el script
      let sceneContext = '';
      if (projectContext?.scriptContent) {
        try {
          const parsedScript = JSON.parse(projectContext.scriptContent);
          const scenes = parsedScript.scenes || parsedScript;
          // Buscar la escena que corresponde al clip por timing o índice
          const clipIndex = clips.findIndex(c => c.id === clip.id);
          const scene = scenes[clipIndex];
          
          if (scene) {
            sceneContext = `
SCENE CONTEXT:
Visual: ${scene.visual_description || scene.description || ''}
Narrative: ${scene.narrative_context || ''}
Lyrics: ${scene.lyric_connection || ''}
Emotion: ${scene.emotion || scene.mood || ''}
Shot Type: ${scene.shot_type || 'medium-shot'}
Camera: ${scene.camera_movement || 'static'}
Location: ${scene.location || ''}
Lighting: ${scene.lighting || 'cinematic lighting'}`;
          }
        } catch (e) {
          logger.warn('Could not parse script for context');
        }
      }
      
      // Construir el prompt completo con todo el contexto
      const enrichedPrompt = `MUSIC VIDEO FRAME:
${concept?.story_concept ? `Concept: ${concept.story_concept}` : ''}
${concept?.visual_style ? `Visual Style: ${concept.visual_style}` : ''}
${concept?.mood ? `Mood: ${concept.mood}` : ''}
${director?.name ? `Director Style: ${director.name}` : ''}
${sceneContext}

SCENE DESCRIPTION:
${basePrompt || 'Professional music video scene'}

TECHNICAL:
High production quality, cinematic, 16:9 aspect ratio, professional lighting, cohesive with music video narrative.
${concept?.color_palette ? `Color Palette: ${concept.color_palette}` : ''}`.trim();
      
      logger.info(`🎬 [Timeline] Prompt enriquecido:`, enrichedPrompt.substring(0, 200) + '...');
      
      // Determinar si usar referencia del artista
      const shouldUseReference = hasReferenceImages && 
        (clip.metadata?.shotCategory === 'PERFORMANCE' || !clip.metadata?.shotCategory);
      
      const referenceImages = shouldUseReference 
        ? (projectContext?.masterCharacter 
            ? [projectContext.masterCharacter.imageUrl] 
            : projectContext?.artistReferenceImages)
        : undefined;
      
      const endpoint = shouldUseReference
        ? '/api/fal/nano-banana/generate-with-face'
        : '/api/fal/nano-banana/generate';
      
      const requestBody = shouldUseReference
        ? { 
            prompt: enrichedPrompt,
            referenceImages: referenceImages,
            aspectRatio: '16:9'
          }
        : { 
            prompt: enrichedPrompt,
            aspectRatio: '16:9'
          };
      
      logger.info(`🔄 [Timeline] Usando endpoint: ${endpoint}, con referencia: ${shouldUseReference}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Error regenerando imagen');
      }

      const data = await response.json();
      
      if (data.imageUrl || data.success) {
        const newImageUrl = data.imageUrl || data.url;
        updateClip(clip.id, {
          imageUrl: newImageUrl,
          url: newImageUrl,
          thumbnailUrl: newImageUrl,
          metadata: {
            ...clip.metadata,
            imagePrompt: enrichedPrompt,
            regeneratedAt: new Date().toISOString(),
            isGeneratedImage: true,
            generatedWith: 'fal-nano-banana',
            usedProjectContext: true,
            usedArtistReference: shouldUseReference,
          },
        });

        toast({
          title: "✅ Imagen regenerada",
          description: "Nueva imagen generada coherente con el concepto",
        });
        logger.info(`✅ [Timeline] Imagen regenerada para clip ${clip.id} con contexto del proyecto`);
      }
    } catch (error) {
      logger.error(`❌ [Timeline] Error regenerando imagen:`, error);
      toast({
        title: "Error regenerando",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(null);
    }
  }, [toast, updateClip, projectContext, clips]);

  // 🎬 Generar Video desde Imagen - Usando GROK IMAGINE VIDEO (xAI)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<number | null>(null);
  
  const handleGenerateVideo = useCallback(async (clip: TimelineClip) => {
    logger.info(`🎬 [Timeline] Generando video para clip ${clip.id} con Grok Imagine Video`);
    setIsGeneratingVideo(clip.id);
    
    const imageUrl = clip.imageUrl || clip.url || clip.thumbnailUrl;
    
    if (!imageUrl) {
      toast({
        title: "Sin imagen",
        description: "El clip necesita una imagen para generar video",
        variant: "destructive",
      });
      setIsGeneratingVideo(null);
      return;
    }

    toast({
      title: "Generando video...",
      description: "Convirtiendo imagen a video con Grok Imagine (xAI) - esto puede tardar 1-3 minutos",
    });

    try {
      const prompt = clip.metadata?.imagePrompt || clip.title || 'cinematic motion, smooth camera movement';
      
      // 🎬 Extraer metadata de la escena para instrucciones de movimiento
      const sceneMetadata = clip.metadata || {};
      const cameraMovement = sceneMetadata.camera_movement || sceneMetadata.cameraMovement || 'smooth';
      const audioEnergy = sceneMetadata.audio_energy || 'medium';
      
      // Construir prompt mejorado con movimiento
      const motionDesc = audioEnergy === 'high' ? 'dynamic, energetic movement' :
                        audioEnergy === 'low' ? 'subtle, slow movement' : 'smooth, natural movement';
      const enhancedPrompt = `${prompt}. ${cameraMovement} camera movement, ${motionDesc}, cinematic quality, professional music video style`;
      
      // ⏱️ Duración: Grok genera videos de 6 segundos
      const videoDuration = Math.min(clip.duration, 6);
      
      logger.info(`🎬 [Timeline] Grok Prompt: ${enhancedPrompt}`);
      
      // Usar endpoint de Grok Video
      const response = await fetch('/api/fal/grok-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: imageUrl,
          prompt: enhancedPrompt,
          duration: videoDuration,
          resolution: '720p',
          aspectRatio: '16:9',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error generando video');
      }

      const data = await response.json();
      
      if (data.videoUrl) {
        // Video generado exitosamente - actualizar clip con videoUrl
        updateClip(clip.id, {
          videoUrl: data.videoUrl, // Propiedad raíz para acceso directo
          metadata: {
            ...clip.metadata,
            videoUrl: data.videoUrl,
            videoGeneratedAt: new Date().toISOString(),
            hasVideo: true,
            generatedWith: 'grok-imagine-video',
            videoDuration: data.duration,
            videoWidth: data.width,
            videoHeight: data.height,
          },
        });

        toast({
          title: "✅ Video generado",
          description: "Video creado exitosamente con Grok Imagine Video (xAI)",
        });
        logger.info(`✅ [Timeline] Video generado para clip ${clip.id}: ${data.videoUrl}`);
      } else {
        throw new Error('No se recibió URL del video');
      }
    } catch (error) {
      logger.error(`❌ [Timeline] Error generando video:`, error);
      toast({
        title: "Error generando video",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideo(null);
    }
  }, [toast, updateClip]);
  
  // Polling para videos asíncronos de FAL Kling
  const pollVideoStatus = useCallback(async (clipId: number, requestId: string, model: string) => {
    const maxAttempts = 60; // 5 minutos máximo (cada 5 segundos)
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/fal/kling-video/${requestId}?model=${model}`);
        const data = await response.json();
        
        if (data.status === 'completed' && data.videoUrl) {
          updateClip(clipId, {
            metadata: {
              videoUrl: data.videoUrl,
              videoGeneratedAt: new Date().toISOString(),
              hasVideo: true,
              videoGenerating: false,
              generatedWith: `fal-kling-${model}`,
            },
          });
          toast({
            title: "✅ Video listo",
            description: "Tu video ha sido generado exitosamente",
          });
          return;
        }
        
        if (data.status === 'failed') {
          updateClip(clipId, {
            metadata: {
              videoGenerating: false,
              videoError: data.error,
            },
          });
          toast({
            title: "❌ Error en video",
            description: data.error || 'La generación de video falló',
            variant: "destructive",
          });
          return;
        }
        
        // Aún procesando
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Revisar cada 5 segundos
        } else {
          toast({
            title: "⏰ Tiempo excedido",
            description: "La generación está tomando más tiempo del esperado. Revisa más tarde.",
            variant: "destructive",
          });
        }
      } catch (error) {
        logger.error('Error polling video status:', error);
      }
    };
    
    // Iniciar después de 10 segundos
    setTimeout(checkStatus, 10000);
  }, [updateClip, toast]);

  // ============================================================================
  // 🎤 LIPSYNC - Aplicar sincronización de labios a clips PERFORMANCE
  // ============================================================================
  // WORKFLOW: Video (ya generado) + Audio Segment → Video con Lipsync
  const [isApplyingLipsync, setIsApplyingLipsync] = useState<number | null>(null);

  const handleApplyLipsync = useCallback(async (clip: TimelineClip) => {
    logger.info(`🎤 [Timeline] Aplicando lipsync a clip ${clip.id}`);
    
    // 1️⃣ Verificar que el clip tiene video
    const videoUrl = clip.metadata?.videoUrl;
    if (!videoUrl) {
      toast({
        title: "Sin video",
        description: "Primero genera el video del clip antes de aplicar lipsync",
        variant: "destructive",
      });
      return;
    }

    // 2️⃣ Verificar que tenemos audioBuffer disponible
    if (!audioBuffer) {
      toast({
        title: "Sin audio",
        description: "No hay audio disponible para sincronizar",
        variant: "destructive",
      });
      return;
    }

    // 3️⃣ Verificar que el clip tiene timestamps válidos
    // NOTA: TimelineClip usa 'start' no 'startTime'
    const startTime = clip.start;
    const endTime = clip.start + clip.duration;
    
    if (startTime === undefined || endTime === undefined || endTime <= startTime) {
      toast({
        title: "Timestamps inválidos",
        description: "El clip no tiene tiempos válidos para cortar audio",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingLipsync(clip.id);

    toast({
      title: "🎤 Aplicando lipsync...",
      description: `Sincronizando labios con audio (${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s)`,
    });

    try {
      // 4️⃣ Cortar el segmento de audio correspondiente al clip
      logger.info(`✂️ [Timeline] Cortando audio: ${startTime}s - ${endTime}s`);
      
      // Importar la función de corte de audio
      const { cutAudioSegment } = await import('@/lib/services/audio-segmentation');
      const audioSegment = await cutAudioSegment(audioBuffer, startTime, endTime);
      
      logger.info(`✅ [Timeline] Audio cortado: ${(audioSegment.blob.size / 1024).toFixed(2)}KB`);

      // 5️⃣ Subir el audio a un servidor temporal para obtener URL
      // Usamos FormData para subir el audio como archivo
      const audioFormData = new FormData();
      audioFormData.append('file', audioSegment.blob, `clip_${clip.id}_audio.wav`);
      
      const uploadResponse = await fetch('/api/upload/temp-audio', {
        method: 'POST',
        body: audioFormData,
      });

      if (!uploadResponse.ok) {
        // Si no hay endpoint de upload, usamos la URL local directamente
        // PixVerse debería poder aceptar data URLs o necesitamos un workaround
        logger.warn('⚠️ No hay endpoint de upload, intentando con data URL');
        
        // Convertir blob a base64 data URL
        const reader = new FileReader();
        const audioDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioSegment.blob);
        });
        
        // Por ahora, loggeamos que necesitamos un endpoint de upload
        toast({
          title: "⚠️ Pendiente",
          description: "Se requiere implementar endpoint de upload de audio temporal",
          variant: "destructive",
        });
        setIsApplyingLipsync(null);
        return;
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.url;
      
      logger.info(`📤 [Timeline] Audio subido: ${audioUrl}`);

      // 6️⃣ Llamar al endpoint de lipsync con video + audio
      const lipsyncResponse = await fetch('/api/fal/pixverse/lipsync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoUrl,
          audioUrl: audioUrl,
          clipId: clip.id,
        }),
      });

      if (!lipsyncResponse.ok) {
        const errorData = await lipsyncResponse.json();
        throw new Error(errorData.error || 'Error aplicando lipsync');
      }

      const lipsyncData = await lipsyncResponse.json();

      if (lipsyncData.success && lipsyncData.videoUrl) {
        // 7️⃣ Actualizar el clip con el video sincronizado
        updateClip(clip.id, {
          metadata: {
            ...clip.metadata,
            lipsyncVideoUrl: lipsyncData.videoUrl,
            lipsyncApplied: true,
            lipsyncAppliedAt: new Date().toISOString(),
            lipsyncProcessingTime: lipsyncData.processingTime,
          },
        });

        toast({
          title: "✅ Lipsync aplicado",
          description: `Labios sincronizados en ${lipsyncData.processingTime?.toFixed(1) || '?'}s`,
        });
        
        logger.info(`✅ [Timeline] Lipsync aplicado a clip ${clip.id}: ${lipsyncData.videoUrl}`);
      } else {
        throw new Error('No se recibió URL del video con lipsync');
      }

    } catch (error) {
      logger.error(`❌ [Timeline] Error aplicando lipsync:`, error);
      toast({
        title: "Error en lipsync",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsApplyingLipsync(null);
    }
  }, [audioBuffer, toast, updateClip]);

  return (
    <>
      <div 
        ref={containerRef} 
        className="flex flex-col bg-neutral-900 text-white rounded-md overflow-hidden h-full select-none"
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {/* Toolbar Principal - Compact & Professional */}
        <div className="flex flex-wrap items-center justify-between px-1.5 sm:px-2 py-1 border-b border-white/10 bg-neutral-950 gap-1 flex-shrink-0">
          
          {/* Herramientas de edición */}
          <div className="flex items-center gap-0.5">
            {/* Tools */}
            <div className="flex items-center gap-px">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setTool('select')} 
                className={`p-1 h-6 w-6 ${tool==='select'?'bg-orange-500/20 text-orange-400':''}`} 
                title="Seleccionar (V)"
              >
                <SelectIcon size={12} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setTool('razor')} 
                className={`p-1 h-6 w-6 ${tool==='razor'?'bg-orange-500/20 text-orange-400':''}`} 
                title="Cuchilla (C)"
              >
                <ScissorIcon size={12} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setTool('trim')} 
                className={`p-1 h-6 w-6 ${tool==='trim'?'bg-orange-500/20 text-orange-400':''}`} 
                title="Trim (T)"
              >
                <TrimIcon size={12} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setTool('hand')} 
                className={`p-1 h-6 w-6 ${tool==='hand'?'bg-orange-500/20 text-orange-400':''}`} 
                title="Mano (H)"
              >
                <HandIcon size={12} />
              </Button>
            </div>

            <div className="mx-0.5 h-4 w-px bg-white/10" />

            {/* Snap/Ripple */}
            <div className="flex items-center gap-px">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setSnapEnabled(s => !s)} 
                className={`p-1 h-6 w-6 ${snapEnabled ? 'bg-orange-500/20 text-orange-400' : ''}`}
                title="Snap"
              >
                <MagnetIcon size={12} />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setRippleEnabled(r => !r)} 
                className={`p-1 h-6 w-6 ${rippleEnabled ? 'bg-red-500/20 text-red-400' : ''}`}
                title="Ripple"
              >
                <TrashIcon size={12} />
              </Button>
            </div>
          </div>

          {/* Playback Controls - Centro */}
          <div className="flex items-center justify-center gap-0.5">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setCurrentTime(0)} 
              className="p-1 h-6 w-6 hover:bg-white/10"
              title="Inicio"
            >
              <SkipBack size={11} className="text-white/70"/>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setCurrentTime(t => Math.max(0, Math.round((t - 1) * framerate) / framerate))} 
              className="p-1 h-6 w-6 hover:bg-white/10"
              title="-1s"
            >
              <Rewind size={11} className="text-white/70"/>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsPlaying(p=>!p)} 
              className="p-1 h-7 w-7 bg-orange-500/20 hover:bg-orange-500/30"
              title="Play/Pause"
            >
              {isPlaying ? <PauseIcon size={14} className="text-orange-400"/> : <PlayIcon size={14} className="text-orange-400"/>}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setCurrentTime(t => Math.min(duration, Math.round((t + 1) * framerate) / framerate))} 
              className="p-1 h-6 w-6 hover:bg-white/10"
              title="+1s"
            >
              <FastForward size={11} className="text-white/70"/>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setCurrentTime(Math.round(duration * framerate) / framerate)} 
              className="p-1 h-6 w-6 hover:bg-white/10"
              title="Final"
            >
              <SkipForward size={11} className="text-white/70"/>
            </Button>
            
            <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 bg-black/30 ml-1">
              {formatTime(currentTime)}
            </Badge>

            <div className="mx-0.5 h-4 w-px bg-white/10" />

            {/* Zoom */}
            <div className="flex items-center gap-px">
              <Button size="sm" variant="ghost" onClick={zoomOut} className="p-0.5 h-5 w-5" title="-">
                <ZoomOutIcon size={10}/>
              </Button>
              <span className="font-mono text-[8px] text-white/50 w-6 text-center">{Math.round(zoom)}</span>
              <Button size="sm" variant="ghost" onClick={zoomIn} className="p-0.5 h-5 w-5" title="+">
                <ZoomInIcon size={10}/>
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            {/* Undo/Redo */}
            <div className="flex items-center gap-px">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={doUndo} 
                disabled={history.past.length===0} 
                className="p-1 h-6 w-6 disabled:opacity-30"
                title="Undo"
              >
                <UndoIcon size={11}/>
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={doRedo} 
                disabled={history.future.length===0} 
                className="p-1 h-6 w-6 disabled:opacity-30"
                title="Redo"
              >
                <RedoIcon size={11}/>
              </Button>
            </div>

            <div className="mx-0.5 h-4 w-px bg-white/10" />

            {/* Quick Actions */}
            <div className="flex items-center gap-px">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setMotionPanelOpen(true)}
                className="p-1 h-6 w-6 bg-purple-500/10 hover:bg-purple-500/20"
                title="Motion"
              >
                <MotionIcon size={11} className="text-purple-400" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowProjectsPanel(!showProjectsPanel)}
                className={`p-1 h-6 w-6 ${showProjectsPanel ? 'bg-blue-500/20' : 'bg-blue-500/10 hover:bg-blue-500/20'}`}
                title="Proyectos"
              >
                <FolderOpen size={11} className="text-blue-400" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleSaveProject}
                disabled={isSavingProject}
                className="p-1 h-6 w-6 bg-green-500/10 hover:bg-green-500/20"
                title={user?.id ? "Guardar en la nube" : "Inicia sesión para guardar"}
              >
                {isSavingProject ? (
                  <Loader2 size={11} className="text-green-400 animate-spin" />
                ) : (
                  <Save size={11} className="text-green-400" />
                )}
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleExportVideo}
                className="p-1 h-6 w-6 bg-orange-500/10 hover:bg-orange-500/20"
                title="Export"
              >
                <Download size={11} className="text-orange-400" />
              </Button>
              <div className="hidden md:block">
                <EditorAgentPanel 
                  timeline={clips.map((c, i) => ({
                    id: String(c.id),
                    group: c.layerId || 0,
                    label: `Clip ${i + 1}`,
                    start_time: c.start,
                    end_time: c.start + c.duration,
                    duration: c.duration,
                  }))}
                  audioBuffer={audioBuffer}
                  genreHint={genreHint}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Proyectos Guardados */}
        {showProjectsPanel && (
          <div className="px-2 sm:px-3 py-2 bg-neutral-900 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-white">Proyectos Guardados</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 border-blue-500/30 text-blue-400">
                  {savedProjects.length}
                </Badge>
              </div>
              <button
                onClick={() => setShowProjectsPanel(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <XIcon size={14} className="text-white/60" />
              </button>
            </div>
            
            {/* Input para nombre del proyecto */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nombre del proyecto..."
                className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50"
                disabled={isSavingProject}
              />
              <Button
                size="sm"
                onClick={handleSaveProject}
                disabled={isSavingProject || !user?.id}
                className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 disabled:opacity-50"
              >
                {isSavingProject ? (
                  <>
                    <Loader2 size={14} className="mr-1 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FolderPlus size={14} className="mr-1" />
                    {user?.id ? 'Guardar en Nube' : 'Inicia sesión'}
                  </>
                )}
              </Button>
            </div>
            
            {/* Barra de progreso de guardado */}
            {isSavingProject && (
              <div className="mb-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{saveStatus}</span>
                  <span className="text-green-400">{Math.round(saveProgress)}%</span>
                </div>
                <Progress value={saveProgress} className="h-1.5" />
              </div>
            )}
            
            {/* Indicador de carga de proyectos */}
            {isLoadingProjects && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin mr-2" />
                <span className="text-sm text-white/60">Cargando proyectos...</span>
              </div>
            )}
            
            {/* Grid de proyectos */}
            {!isLoadingProjects && savedProjects.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="relative group bg-black/30 rounded-lg border border-white/10 hover:border-blue-500/50 transition-all overflow-hidden cursor-pointer"
                    onClick={() => handleLoadProject(project)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <VideoIcon size={20} className="text-white/20" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="p-1.5">
                      <p className="text-[10px] sm:text-xs font-medium text-white truncate">{project.name}</p>
                      <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-white/50">
                        <Clock size={8} />
                        <span>{formatTime(project.duration)}</span>
                        <span>•</span>
                        <span>{project.clips.length} clips</span>
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Eliminar proyecto"
                    >
                      <XIcon size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : !isLoadingProjects ? (
              <div className="flex flex-col items-center justify-center py-4 text-white/40">
                <FolderOpen size={24} className="mb-1" />
                <span className="text-xs">{user?.id ? 'No hay proyectos guardados' : 'Inicia sesión para ver tus proyectos'}</span>
                <span className="text-[10px]">{user?.id ? 'Guarda tu proyecto actual para verlo aquí' : 'Los proyectos se guardan en la nube de forma permanente'}</span>
              </div>
            ) : null}
          </div>
        )}

        {/* 🎬 Panel de Acciones del Clip Seleccionado */}
        {selectedClipId && (
          <div className="px-1.5 py-1 bg-gradient-to-r from-purple-900/20 via-neutral-900 to-orange-900/20 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              {/* Info del clip */}
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
                  <ImageIcon size={11} className="text-orange-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-white leading-tight">
                    Clip #{selectedClipId}
                  </span>
                  <span className="text-[8px] text-white/50 leading-tight">
                    {clips.find(c => c.id === selectedClipId)?.title || 'Sin título'}
                  </span>
                </div>
              </div>
              
              {/* Botones de Acción */}
              <div className="flex items-center gap-0.5">
                {/* Edit Image */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const clip = clips.find(c => c.id === selectedClipId);
                    if (clip) handleEditImage(clip);
                  }}
                  className="p-1 h-6 w-6 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20"
                  title="Editar Imagen"
                >
                  <Pencil size={11} className="text-blue-400" />
                </Button>

                {/* Add Musician */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const clip = clips.find(c => c.id === selectedClipId);
                    if (clip) handleAddMusician(clip);
                  }}
                  className="p-1 h-6 w-6 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20"
                  title="Agregar Músico"
                >
                  <Music size={11} className="text-green-400" />
                </Button>

                {/* Camera Angles */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const clip = clips.find(c => c.id === selectedClipId);
                    if (clip) handleCameraAngles(clip);
                  }}
                  className="p-1 h-6 w-6 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20"
                  title="Ángulos de Cámara"
                >
                  <Camera size={11} className="text-purple-400" />
                </Button>

                {/* Regenerate */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const clip = clips.find(c => c.id === selectedClipId);
                    if (clip) handleRegenerateImage(clip);
                  }}
                  disabled={isRegenerating === selectedClipId}
                  className="p-1 h-6 w-6 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 disabled:opacity-50"
                  title="Regenerar Imagen"
                >
                  {isRegenerating === selectedClipId ? (
                    <Loader2 size={11} className="text-yellow-400 animate-spin" />
                  ) : (
                    <RefreshCw size={11} className="text-yellow-400" />
                  )}
                </Button>

                {/* Generate Video */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const clip = clips.find(c => c.id === selectedClipId);
                    if (clip) handleGenerateVideo(clip);
                  }}
                  disabled={isGeneratingVideo === selectedClipId}
                  className="p-1 h-6 w-6 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 disabled:opacity-50"
                  title="Generar Video"
                >
                  {isGeneratingVideo === selectedClipId ? (
                    <Loader2 size={11} className="text-orange-400 animate-spin" />
                  ) : (
                    <Film size={11} className="text-orange-400" />
                  )}
                </Button>

                {/* Deselect */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedClipId(null)}
                  className="p-1 h-6 w-6 bg-white/5 hover:bg-white/10"
                  title="Deseleccionar"
                >
                  <XIcon size={11} className="text-white/60" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Visor de Video + Galería de Imágenes - Altura ajustable */}
        <div 
          className="flex items-stretch px-2 sm:px-3 py-2 bg-neutral-950 flex-shrink-0"
          style={{ height: `${viewerHeight}%`, minHeight: '100px', maxHeight: '70%' }}
        >
          {/* Visor Principal */}
          <div className="relative flex-1 min-w-0 bg-black/70 rounded-md overflow-hidden border border-white/5">
            {selectedGalleryImage ? (
              // Mostrar imagen seleccionada de la galería
              <div className="relative w-full h-full">
                <img 
                  src={selectedGalleryImage.url} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setSelectedGalleryImage(null)}
                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  title="Volver al video"
                >
                  <XIcon size={14} className="text-white" />
                </button>
                {selectedGalleryImage.prompt && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[9px] sm:text-[10px] text-white/70 line-clamp-2">{selectedGalleryImage.prompt}</p>
                  </div>
                )}
              </div>
            ) : activeClipVideoUrl ? (
              // 🎬 CRITICAL: Mostrar VIDEO del clip activo (prioridad sobre imagen)
              <div className="relative w-full h-full">
                <video
                  ref={activeVideoRef}
                  src={activeClipVideoUrl}
                  className="w-full h-full object-contain"
                  playsInline
                  muted
                  loop
                  autoPlay={isPlaying}
                  key={`video-${activeClip?.id}-${activeClipVideoUrl}`}
                  onLoadedMetadata={() => {
                    // Sincronizar video con currentTime del clip
                    if (activeVideoRef.current && activeClip) {
                      const clipLocalTime = currentTime - activeClip.start;
                      if (clipLocalTime >= 0 && clipLocalTime < (activeVideoRef.current.duration || 6)) {
                        activeVideoRef.current.currentTime = clipLocalTime;
                      }
                    }
                  }}
                />
                {/* Badge indicando que es video */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-orange-500/80 rounded text-[9px] text-white font-medium flex items-center gap-1">
                  <Film size={10} />
                  VIDEO • {activeClip?.title || `Escena ${activeClip?.id}`}
                </div>
                {/* Timecode */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded font-mono text-[10px] text-orange-400">
                  {formatTimecode(currentTime)}
                </div>
              </div>
            ) : activeClipImageUrl ? (
              // 🖼️ Mostrar IMAGEN del clip activo (fallback cuando no hay video)
              <div className="relative w-full h-full">
                <img 
                  src={activeClipImageUrl} 
                  alt={activeClip?.title || 'Preview'} 
                  className="w-full h-full object-contain transition-opacity duration-75"
                  key={activeClip?.id} // Forzar re-render cuando cambia el clip
                />
                {/* Indicador de clip activo */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[9px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {activeClip?.title || `Escena ${activeClip?.id}`}
                </div>
                {/* Timecode */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded font-mono text-[10px] text-orange-400">
                  {formatTimecode(currentTime)}
                </div>
              </div>
            ) : videoPreviewUrl ? (
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                playsInline
                muted
                controls={false}
                className="w-full h-full object-contain"
                onClick={() => setIsPlaying(p=>!p)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-2">
                <VideoIcon size={24} className="sm:w-8 sm:h-8" />
                <span className="text-[10px] sm:text-xs">Vista previa del video</span>
              </div>
            )}
            {/* Barra de progreso */}
            {!selectedGalleryImage && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-100" style={{ width: `${(currentTime/duration)*100}%` }}/>
              </div>
            )}
          </div>

          {/* Divisor Vertical - Entre Visor y Galería */}
          <div 
            className={`w-2 cursor-col-resize flex items-center justify-center transition-colors flex-shrink-0 hidden sm:flex ${
              isDraggingGallery ? 'bg-orange-500' : 'bg-neutral-800 hover:bg-orange-500/50'
            }`}
            onMouseDown={() => setIsDraggingGallery(true)}
            title="Arrastra para ajustar ancho de galería"
          >
            <div className="h-8 w-0.5 bg-white/20 rounded-full" />
          </div>

          {/* Galería de Imágenes Generadas */}
          <div 
            className="hidden sm:flex flex-col flex-shrink-0 bg-neutral-900/50 rounded-md border border-white/5 overflow-hidden"
            style={{ width: `${galleryWidth}px`, minWidth: '80px', maxWidth: '350px' }}
          >
            <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 bg-neutral-900">
              <div className="flex items-center gap-1">
                <ImageIcon size={10} className="text-orange-400" />
                <span className="text-[9px] sm:text-[10px] font-medium text-white/80">Imágenes</span>
              </div>
              <Badge variant="outline" className="text-[8px] px-1 py-0 bg-orange-500/10 border-orange-500/30 text-orange-400">
                {generatedImages.length}
              </Badge>
            </div>
            
            {/* Grid de imágenes */}
            <div className="p-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 flex-1">
              {generatedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-1">
                  {generatedImages.map((img) => (
                    <div 
                      key={img.id}
                      className={`relative aspect-square rounded overflow-hidden cursor-pointer group border-2 transition-all ${
                        selectedGalleryImage?.id === img.id 
                          ? 'border-orange-500 ring-1 ring-orange-500/50' 
                          : 'border-transparent hover:border-white/30'
                      }`}
                      onClick={() => setSelectedGalleryImage(img)}
                    >
                      <img
                        src={img.url} 
                        alt={img.prompt || 'Generated'} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Overlay con botón de agregar */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        {onAddImageToTimeline && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddImageToTimeline(img);
                            }}
                            className="p-1 bg-orange-500 hover:bg-orange-600 rounded-full transition-colors"
                            title="Agregar al timeline"
                          >
                            <PlusIcon size={12} className="text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2 text-white/30 gap-1">
                  <ImageIcon size={16} />
                  <span className="text-[8px] text-center">Sin imágenes</span>
                </div>
              )}
            </div>
          </div>
          
          {audioPreviewUrl && (
            <audio ref={audioRef} src={audioPreviewUrl} preload="auto" />
          )}
        </div>

        {/* Divisor Arrastrable Horizontal - Entre Visor y Timeline */}
        <div 
          className={`h-2 cursor-row-resize flex items-center justify-center transition-colors flex-shrink-0 ${
            isDraggingVertical ? 'bg-orange-500' : 'bg-neutral-800 hover:bg-orange-500/50'
          }`}
          onMouseDown={() => setIsDraggingVertical(true)}
          title="Arrastra para ajustar altura del visor"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Timeline con Capas - Ocupa el resto del espacio */}
        <div className="relative flex-1 overflow-hidden min-h-[120px]">
          {/* Divisor para ajustar ancho del panel de capas */}
          <div 
            className={`absolute top-0 bottom-0 w-2 cursor-col-resize z-20 flex items-center justify-center transition-colors ${
              isDraggingLayers ? 'bg-orange-500' : 'bg-transparent hover:bg-orange-500/50'
            }`}
            style={{ left: `${layerPanelWidth - 4}px` }}
            onMouseDown={() => setIsDraggingLayers(true)}
            title="Arrastra para ajustar ancho del panel de capas"
          >
            <div className="w-0.5 h-8 bg-white/30 rounded-full" />
          </div>

          {/* Regla superior con timecode y playhead */}
          <div className="relative border-b border-white/10 bg-gradient-to-b from-neutral-800 to-neutral-900" style={{ height: 48 }}>
            {/* Panel de Timecode y Framerate - siempre visible */}
            <div 
              className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center bg-gradient-to-r from-neutral-800 to-neutral-700 z-20 shadow-lg border-r border-white/10"
              style={{ width: layerPanelWidth }}
            >
              {/* Timecode principal */}
              <div className="text-[9px] sm:text-[11px] md:text-xs font-mono font-bold text-orange-400 tracking-wider" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {formatTimecode(currentTime)}
              </div>
              
              {/* Selector de Framerate */}
              <div className="flex items-center gap-0.5 mt-0.5">
                {[24, 30, 60].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => setFramerate(fps as 24 | 30 | 60)}
                    className={`text-[7px] sm:text-[8px] px-1 py-0.5 rounded font-bold transition-all ${
                      framerate === fps 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80'
                    }`}
                  >
                    {fps}fps
                  </button>
                ))}
              </div>
            </div>
            
            <Ruler 
              zoom={zoom} 
              duration={duration} 
              labelWidth={layerPanelWidth} 
              onRulerClick={handleTimelineClick}
              framerate={framerate}
            />
            
            {/* Playhead indicator en regla */}
            <div
              className="absolute top-0 bottom-0 bg-orange-500 z-10 pointer-events-none"
              style={{ left: layerPanelWidth + currentTime * zoom, width: PLAYHEAD_WIDTH }}
            >
              {/* Cabeza del playhead */}
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-orange-500" />
            </div>
          </div>

          <TimelineLayers
            clips={clips}
            currentTime={currentTime}
            duration={duration}
            zoom={zoom}
            tool={tool}
            snapEnabled={snapEnabled}
            beatMarkers={beatGuides.map(time => ({ time }))}
            onSelectClip={handleSelectClip}
            selectedClipId={selectedClipId}
            onMoveClip={handleMoveClip}
            onResizeClip={handleResizeClip}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onResizeStart={handleResizeStart}
            onResizeEnd={handleResizeEnd}
            onRazorClick={handleRazorClick}
            onTimelineClick={handleTimelineClick}
            onDeleteClip={handleDeleteClip}
            layerLabelWidth={layerPanelWidth}
            // Acciones sobre clips
            onEditImage={handleEditImage}
            onAddMusician={handleAddMusician}
            onCameraAngles={handleCameraAngles}
            onRegenerateImage={handleRegenerateImage}
            onGenerateVideo={handleGenerateVideo}
          />
        </div>

        {/* Barra de estado inferior - Mobile friendly */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-t border-white/10 bg-neutral-950/80 text-[9px] sm:text-[10px] text-white/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <span>Clips: {clips.length}</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Duración: {formatTime(duration)}</span>
            {/* BPM y estado de análisis */}
            {isAnalyzingAudio && (
              <span className="text-blue-400 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Analizando...
              </span>
            )}
            {audioAnalysis?.bpm && (
              <span className="text-green-400">♪ {Math.round(audioAnalysis.bpm)} BPM</span>
            )}
            {beatGuides.length > 0 && (
              <span className="hidden md:inline text-purple-400">{beatGuides.length} beats</span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline text-orange-400/60">Space: Play</span>
            <span className="hidden lg:inline">V/C/T/H: Tools</span>
            <span className="hidden xl:inline">Ctrl+Z/Y: Undo/Redo</span>
          </div>
        </div>
      </div>

      {/* Motion Control Panel */}
      <MotionControlPanel
        open={motionPanelOpen}
        onClose={() => setMotionPanelOpen(false)}
        scenes={[]}
        onApplyMotion={(scenes) => {
          logger.info(`✅ [Timeline] Motion aplicado a ${scenes.length} escenas`);
          setMotionPanelOpen(false);
        }}
      />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        scene={selectedScene}
        videoUrl={selectedScene?.video_url}
        isGenerating={selectedScene?.video_status === 'generating'}
        onApprove={(scene) => {
          logger.info(`✅ [Preview] Video aprobado para ${scene.scene_id}`);
          setPreviewModalOpen(false);
        }}
        onRegenerate={(scene) => {
          logger.info(`🔄 [Preview] Regenerando video para ${scene.scene_id}`);
        }}
      />

      {/* 🎸 Modal de Músico */}
      {showMusicianModal && musicianModalClip && (
        <MusicianModal
          open={showMusicianModal}
          onClose={() => {
            setShowMusicianModal(false);
            setMusicianModalClip(null);
          }}
          timelineItem={{
            id: String(musicianModalClip.id),
            timestamp: musicianModalClip.start,
            imageUrl: musicianModalClip.imageUrl || musicianModalClip.url,
          }}
          scriptContext={musicianModalClip.title || ''}
          onMusicianCreated={handleMusicianAdded}
        />
      )}

      {/* 📷 Modal de Ángulos de Cámara */}
      {showCameraAnglesModal && cameraAnglesModalClip && (
        <CameraAnglesModal
          open={showCameraAnglesModal}
          onClose={() => {
            setShowCameraAnglesModal(false);
            setCameraAnglesModalClip(null);
          }}
          clip={cameraAnglesModalClip}
          onSelectAngle={handleCameraAngleSelected}
        />
      )}

      {/* ✏️ Modal de Editor de Imagen (Nano Banana AI) */}
      {showImageEditorModal && imageEditorModalClip && (
        <ImageEditorModal
          open={showImageEditorModal}
          onClose={() => {
            setShowImageEditorModal(false);
            setImageEditorModalClip(null);
          }}
          imageUrl={imageEditorModalClip.imageUrl || imageEditorModalClip.url}
          originalPrompt={imageEditorModalClip.metadata?.imagePrompt || imageEditorModalClip.title}
          onImageEdited={handleImageEdited}
        />
      )}

      {/* 🖱️ Menú Contextual (Click Derecho) */}
      {contextMenu.visible && (
        <div 
          className="fixed z-50 bg-neutral-900 border border-white/20 rounded-lg shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del menú */}
          <div className="px-3 py-1.5 border-b border-white/10 mb-1">
            <span className="text-[10px] text-white/50 uppercase tracking-wide">
              {contextMenu.clipId ? 'Opciones del Clip' : 'Timeline'}
            </span>
          </div>

          {/* Opciones para clips */}
          {contextMenu.clipId && (
            <>
              <button
                onClick={handleCopyClip}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
              >
                <Copy size={14} />
                <span>Copiar</span>
                <span className="ml-auto text-[10px] text-white/40">Ctrl+C</span>
              </button>
              
              <button
                onClick={handleDuplicateClip}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-blue-500/20 hover:text-blue-400 transition-colors"
              >
                <Layers size={14} />
                <span>Duplicar</span>
                <span className="ml-auto text-[10px] text-white/40">Ctrl+D</span>
              </button>

              <button
                onClick={handleSplitAtPlayhead}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
              >
                <Split size={14} />
                <span>Dividir en playhead</span>
                <span className="ml-auto text-[10px] text-white/40">C</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              {/* 🎬 Generar Video */}
              {(() => {
                const clip = clips.find(c => c.id === contextMenu.clipId);
                const hasImage = clip?.imageUrl || clip?.url || clip?.thumbnailUrl;
                const hasVideo = clip?.metadata?.videoUrl || clip?.metadata?.hasVideo;
                return hasImage && !hasVideo && (
                  <button
                    onClick={() => {
                      if (clip) handleGenerateVideo(clip);
                      closeContextMenu();
                    }}
                    disabled={isGeneratingVideo === clip?.id}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-blue-500/20 hover:text-blue-400 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingVideo === clip?.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Film size={14} />
                    )}
                    <span>Generar Video</span>
                  </button>
                );
              })()}

              {/* 🎤 Aplicar Lipsync - Solo para clips PERFORMANCE con video */}
              {(() => {
                const clip = clips.find(c => c.id === contextMenu.clipId);
                const hasVideo = clip?.metadata?.videoUrl;
                const isPerformance = clip?.metadata?.shotCategory === 'PERFORMANCE';
                const hasLipsync = clip?.metadata?.lipsyncApplied;
                return hasVideo && isPerformance && !hasLipsync && (
                  <button
                    onClick={() => {
                      if (clip) handleApplyLipsync(clip);
                      closeContextMenu();
                    }}
                    disabled={isApplyingLipsync === clip?.id}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-pink-500/20 hover:text-pink-400 transition-colors disabled:opacity-50"
                  >
                    {isApplyingLipsync === clip?.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Music size={14} />
                    )}
                    <span>🎤 Aplicar Lipsync</span>
                  </button>
                );
              })()}

              {/* 🎤 Mostrar si ya tiene lipsync aplicado */}
              {(() => {
                const clip = clips.find(c => c.id === contextMenu.clipId);
                const hasLipsync = clip?.metadata?.lipsyncApplied;
                return hasLipsync && (
                  <div className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400">
                    <Music size={14} />
                    <span>✓ Lipsync aplicado</span>
                  </div>
                );
              })()}

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={handleDeleteClipContext}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <TrashIcon size={14} />
                <span>Eliminar</span>
                <span className="ml-auto text-[10px] text-white/40">Del</span>
              </button>
            </>
          )}

          {/* Opciones generales */}
          {!contextMenu.clipId && (
            <>
              <button
                onClick={handlePasteClip}
                disabled={!clipboardClip}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  clipboardClip 
                    ? 'text-white/90 hover:bg-green-500/20 hover:text-green-400' 
                    : 'text-white/30 cursor-not-allowed'
                }`}
              >
                <ClipboardPaste size={14} />
                <span>Pegar aquí</span>
                <span className="ml-auto text-[10px] text-white/40">Ctrl+V</span>
              </button>

              <button
                onClick={handleSetPlayheadHere}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
              >
                <MoreHorizontal size={14} />
                <span>Mover playhead aquí</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={() => { setSnapEnabled(s => !s); closeContextMenu(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <MagnetIcon size={14} className={snapEnabled ? 'text-orange-400' : ''} />
                <span>Snap magnético</span>
                <span className={`ml-auto text-[10px] ${snapEnabled ? 'text-orange-400' : 'text-white/40'}`}>
                  {snapEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => { setRippleEnabled(r => !r); closeContextMenu(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <TrashIcon size={14} className={rippleEnabled ? 'text-red-400' : ''} />
                <span>Ripple delete</span>
                <span className={`ml-auto text-[10px] ${rippleEnabled ? 'text-red-400' : 'text-white/40'}`}>
                  {rippleEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </>
          )}

          {/* Footer con timestamp */}
          <div className="px-3 py-1.5 border-t border-white/10 mt-1">
            <span className="text-[10px] text-white/40 font-mono">
              @ {formatTime(currentTime)}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

/** ---------- Helpers ---------- */
// ⚠️ CRITICAL: Máxima duración de clip (Grok Imagine Video = 6 segundos)
const MAX_CLIP_DURATION_SECONDS = 6;

// Función que acepta clips en cualquier formato (TimelineClip o TimelineItem) y los normaliza
// También segmenta clips mayores de 6 segundos para compatibilidad con generación de video
function normalizeClips(clips: any[]): TimelineClip[] {
  if (!clips || !Array.isArray(clips)) return [];
  
  console.log('📊 [normalizeClips] Input clips:', clips?.length, clips);
  
  const normalizedClips: TimelineClip[] = [];
  let globalId = 1;
  
  clips.forEach((c, index) => {
    // Priorizar URLs de imagen en este orden
    const imageUrl = c.url || c.imageUrl || c.image_url || c.generatedImageUrl || 
                     c.publicUrl || c.firebaseUrl || c.thumbnailUrl || '';
    
    // CRITICAL: Asignar layerId por defecto basado en el tipo de clip
    // Capa 1 = Video/Imágenes, Capa 2 = Audio Principal, Capa 3 = Lipsync Segments
    // NOTA: Aceptar tanto 'layerId' como 'layer' para compatibilidad con TimelineClipUnified
    const typeStr = typeof c.type === 'string' ? c.type.toUpperCase() : 'IMAGE';
    const normalizedType = (typeStr === 'AUDIO' ? ClipType.AUDIO : 
                            typeStr === 'VIDEO' ? ClipType.VIDEO :
                            typeStr === 'GENERATED_IMAGE' ? ClipType.GENERATED_IMAGE :
                            ClipType.IMAGE) as ClipType;
    
    // Determinar layerId: 1=Video/Imagen, 2=Audio Principal, 3=Lipsync Segments
    let layerId = c.layerId || c.layer;
    if (!layerId) {
      if (normalizedType === ClipType.AUDIO) {
        // Si es segmento de lipsync, usar capa 3; sino capa 2
        layerId = c.metadata?.isLipsyncSegment ? 3 : 2;
      } else {
        layerId = 1;
      }
    }
    
    console.log(`📍 [normalizeClips] Clip ${index}: type='${typeStr}', layer=${c.layer}, layerId=${c.layerId} -> finalLayerId=${layerId}, isLipsync=${c.metadata?.isLipsyncSegment || false}`);
    
    // CRITICAL: Convertir start_time/end_time (ms) a start/duration (segundos)
    // TimelineItem usa start_time en ms, TimelineClip usa start en segundos
    let startSeconds: number;
    let durationSeconds: number;
    
    if (typeof c.start_time === 'number') {
      // Es un TimelineItem - convertir de ms a segundos
      startSeconds = c.start_time / 1000;
      if (typeof c.end_time === 'number') {
        durationSeconds = (c.end_time - c.start_time) / 1000;
      } else if (typeof c.duration === 'number' && c.duration > 100) {
        // duration en ms
        durationSeconds = c.duration / 1000;
      } else {
        durationSeconds = c.duration || 3;
      }
    } else {
      // Ya es TimelineClip format
      startSeconds = typeof c.start === 'number' ? c.start : 0;
      durationSeconds = typeof c.duration === 'number' ? c.duration : 3;
    }
    
    // 🔥 CRITICAL: Segmentar clips mayores de MAX_CLIP_DURATION_SECONDS
    // Las generaciones de video solo soportan hasta 5 segundos
    if (durationSeconds > MAX_CLIP_DURATION_SECONDS && normalizedType !== ClipType.AUDIO) {
      const segmentCount = Math.ceil(durationSeconds / MAX_CLIP_DURATION_SECONDS);
      console.log(`⚡ [normalizeClips] Segmentando clip ${c.id} de ${durationSeconds.toFixed(2)}s en ${segmentCount} partes`);
      
      for (let i = 0; i < segmentCount; i++) {
        const segmentStart = startSeconds + (i * MAX_CLIP_DURATION_SECONDS);
        const remainingDuration = durationSeconds - (i * MAX_CLIP_DURATION_SECONDS);
        const segmentDuration = Math.min(MAX_CLIP_DURATION_SECONDS, remainingDuration);
        
        normalizedClips.push({
          ...c,
          id: globalId++,
          layerId: layerId,
          in: 0,
          out: segmentDuration,
          sourceStart: 0,
          type: normalizedType,
          start: segmentStart,
          duration: segmentDuration,
          url: imageUrl,
          imageUrl: imageUrl,
          thumbnailUrl: c.thumbnailUrl || imageUrl,
          title: c.title ? `${c.title} (${i + 1}/${segmentCount})` : `Escena ${globalId - 1}`,
          // Marcar como segmento para posible regeneración
          isSegment: true,
          originalDuration: durationSeconds,
          segmentIndex: i,
        } as TimelineClip);
        
        console.log(`   📍 Segmento ${i + 1}: start=${segmentStart.toFixed(2)}s, duration=${segmentDuration.toFixed(2)}s`);
      }
    } else {
      // Clip dentro de límites - agregar normalmente
      console.log(`📍 [normalizeClips] Clip ${index}: id=${c.id}, start=${startSeconds.toFixed(2)}s, duration=${durationSeconds.toFixed(2)}s, layerId=${layerId}, hasImage=${!!imageUrl}`);
      
      normalizedClips.push({
        ...c,
        id: typeof c.id === 'number' ? c.id : globalId++,
        layerId: layerId,
        in: c.in ?? 0,
        out: c.out ?? durationSeconds,
        sourceStart: c.sourceStart ?? 0,
        type: normalizedType,
        start: startSeconds,
        duration: durationSeconds,
        url: imageUrl,
        imageUrl: imageUrl,
        thumbnailUrl: c.thumbnailUrl || imageUrl,
      } as TimelineClip);
    }
  });
  
  console.log(`📊 [normalizeClips] Output: ${normalizedClips.length} clips (segmentados de ${clips.length} originales)`);
  return normalizedClips;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const d = Math.floor((sec % 1) * 10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${d}`;
}

const Ruler: React.FC<{ zoom: number; duration: number; labelWidth: number; onRulerClick?: (time: number) => void; framerate?: number }> = ({ zoom, duration, labelWidth, onRulerClick, framerate = 30 }) => {
  const ticks = Math.ceil(duration);
  
  // Determinar niveles de detalle según zoom
  const zoomLevel = zoom < 40 ? 'low' : zoom < 80 ? 'medium' : zoom < 150 ? 'high' : 'ultra';
  
  // Mostrar marcas principales cada X segundos
  const majorEvery = zoomLevel === 'low' ? 10 : zoomLevel === 'medium' ? 5 : 1;
  const minorEvery = zoomLevel === 'low' ? 5 : 1;
  const showFrameMarks = zoomLevel === 'ultra' || (zoomLevel === 'high' && zoom >= 120);
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onRulerClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const time = clickX / zoom;
    const snappedTime = Math.round(time * framerate) / framerate;
    onRulerClick(Math.max(0, Math.min(duration, snappedTime)));
  };

  // Formatear timecode MM:SS:FF
  const formatTimecode = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds) % 60;
    const frames = Math.floor((seconds % 1) * framerate);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  // Formato corto para zoom bajo
  const formatShort = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}:${String(secs).padStart(2, '0')}`;
    return `${secs}s`;
  };

  // Generar marcas de frames entre segundos
  const frameMarks = [];
  if (showFrameMarks) {
    for (let sec = 0; sec <= ticks; sec++) {
      for (let f = 1; f < framerate; f++) {
        const time = sec + f / framerate;
        if (time > duration) break;
        const x = time * zoom;
        // Subdivisiones: cada 5 frames más visible, cada 10 aún más
        const isMidFrame = f === Math.floor(framerate / 2);
        const isQuarterFrame = f % Math.floor(framerate / 4) === 0;
        const height = isMidFrame ? 40 : isQuarterFrame ? 28 : 16;
        const opacity = isMidFrame ? 0.4 : isQuarterFrame ? 0.25 : 0.12;
        
        frameMarks.push(
          <div 
            key={`f-${sec}-${f}`} 
            className="absolute bottom-0 pointer-events-none"
            style={{ 
              left: x, 
              width: 1, 
              height: `${height}%`,
              background: `rgba(255,255,255,${opacity})`
            }}
          />
        );
      }
    }
  }
  
  return (
    <div 
      className="absolute inset-0 select-none overflow-hidden cursor-pointer" 
      style={{ marginLeft: labelWidth }}
      onClick={handleClick}
    >
      {/* Fondo degradado profesional */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/80 via-neutral-900/90 to-black" />
      
      {/* Línea base inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-orange-500/50 via-orange-400/30 to-orange-500/50" />
      
      {/* Marcas de frames */}
      {frameMarks}
      
      {/* Marcas de segundos */}
      {[...Array(ticks + 1)].map((_, sec) => {
        const x = sec * zoom;
        const isMajor = sec % majorEvery === 0;
        const isMinor = sec % minorEvery === 0;
        if (!isMinor) return null;
        
        const height = isMajor ? 65 : 35;
        const width = isMajor ? 2 : 1;
        const color = isMajor ? 'bg-orange-400' : 'bg-white/30';
        
        return (
          <div key={`s-${sec}`} className="absolute h-full pointer-events-none" style={{ left: x }}>
            {/* Línea vertical */}
            <div 
              className={`absolute bottom-0 ${color} ${isMajor ? 'shadow-sm shadow-orange-500/50' : ''}`}
              style={{ width, height: `${height}%` }}
            />
            
            {/* Número de timecode */}
            {isMajor && (
              <div className="absolute top-[3px] -translate-x-1/2" style={{ left: 0 }}>
                <div className="flex flex-col items-center">
                  {/* Timecode principal */}
                  <span 
                    className="font-mono font-bold text-white px-1.5 py-0.5 rounded-sm leading-none"
                    style={{ 
                      fontSize: zoomLevel === 'low' ? '9px' : '11px',
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)',
                      textShadow: '0 1px 2px rgba(0,0,0,1), 0 0 8px rgba(249,115,22,0.3)',
                      border: '1px solid rgba(249,115,22,0.2)'
                    }}
                  >
                    {zoomLevel === 'ultra' ? formatTimecode(sec) : formatShort(sec)}
                  </span>
                  
                  {/* Número de frame pequeño (solo en zoom ultra) */}
                  {zoomLevel === 'ultra' && (
                    <span 
                      className="font-mono text-orange-300/60 mt-0.5 leading-none"
                      style={{ fontSize: '7px' }}
                    >
                      f{sec * framerate}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {/* Indicador de framerate */}
      <div 
        className="absolute top-1 right-2 font-mono font-bold text-orange-400/80 px-1.5 py-0.5 rounded"
        style={{ 
          fontSize: '9px',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(249,115,22,0.3)'
        }}
      >
        {framerate} FPS
      </div>
      
      {/* Indicador de zoom level */}
      <div 
        className="absolute bottom-1 right-2 font-mono text-white/30"
        style={{ fontSize: '7px' }}
      >
        {Math.round(zoom)}px/s
      </div>
    </div>
  );
};

export default TimelineEditor;

