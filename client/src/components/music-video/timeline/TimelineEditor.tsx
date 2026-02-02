/**
 * Editor de timeline principal
 * Componente principal para la edici�n de videos con timeline multiples capas
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Video as VideoIcon, Volume2 as VolumeIcon, VolumeX as VolumeMuteIcon, Volume1 as VolumeLowIcon, Wand2 as MotionIcon,
  Image as ImageIcon, Plus as PlusIcon, GripVertical, X as XIcon,
  FolderOpen, Save, FolderPlus, Clock, AlertCircle,
  SkipBack, SkipForward, Rewind, FastForward,
  Copy, ClipboardPaste, Split, Layers, Lock, Unlock, Eye, EyeOff, MoreHorizontal,
  Download, RefreshCw, Film, Pencil, Music, Camera, Sparkles, Loader2,
  HelpCircle, Upload, FileAudio, FileVideo, ImagePlus
} from 'lucide-react';
import { logger } from '@/lib/logger';
import type { MusicVideoScene } from '@/types/music-video-scene';

import { 
  TimelineClip, LayerConfig, ClipType, LayerType, TimelineMarker 
} from '@/interfaces/timeline';

// Responsive layer width - se calcula din�micamente
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

// Contexto del proyecto para regeneraci�n coherente
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
  // ?? Contexto del proyecto para regeneraci�n coherente
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
  const [clips, setClips] = useState<TimelineClip[]>(() => normalizeClips(initialClips));
  const [zoom, setZoom] = useState(initialZoom);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<number>>(new Set()); // ?? Multi-select
  const [playbackRate, setPlaybackRate] = useState(1); // ?? J/K/L playback control
  const [tool, setTool] = useState<Tool>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [rippleEnabled, setRippleEnabled] = useState(false);
  
  // 🔊 Audio volume control - Estado para controlar volumen como Adobe Premiere
  const [volume, setVolume] = useState(1); // 0 a 1
  const [isMuted, setIsMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GeneratedImage | null>(null);
  const [layerLabelWidth, setLayerLabelWidth] = useState(getLayerLabelWidth);
  
  // Estados para paneles redimensionables
  const [viewerHeight, setViewerHeight] = useState(55); // Altura del visor en % - Por defecto abierto
  const [galleryWidth, setGalleryWidth] = useState(180); // Ancho de la galer�a en px
  const [layerPanelWidth, setLayerPanelWidth] = useState(100); // Ancho de los labels de capas en px
  
  // Estados de arrastre
  const [isDraggingVertical, setIsDraggingVertical] = useState(false); // Divisor horizontal (visor/timeline)
  const [isDraggingGallery, setIsDraggingGallery] = useState(false); // Divisor vertical (visor/galer�a)
  const [isDraggingLayers, setIsDraggingLayers] = useState(false); // Divisor vertical (labels/tracks)
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  //  Audio Analysis para sincronizaci�n con beats
  const { 
    analysis: audioAnalysis, 
    isAnalyzing: isAnalyzingAudio, 
    analyzeAudio, 
    snapToBeat,
    getNearestBeat 
  } = useAudioAnalysis();
  
  // ?? Motion Control & Video Generation
  const [motionPanelOpen, setMotionPanelOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<MusicVideoScene | null>(null);
  
  // ??? Modales de Acciones sobre Clips
  const [showMusicianModal, setShowMusicianModal] = useState(false);
  const [musicianModalClip, setMusicianModalClip] = useState<TimelineClip | null>(null);
  const [showCameraAnglesModal, setShowCameraAnglesModal] = useState(false);
  const [cameraAnglesModalClip, setCameraAnglesModalClip] = useState<TimelineClip | null>(null);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
  const [imageEditorModalClip, setImageEditorModalClip] = useState<TimelineClip | null>(null);
  
  // 📥 Importacion de archivos multimedia
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'image' | 'audio' | 'video' | 'all'>('all');
  
  // 📂 Menu contextual de la galeria (click derecho para importar)
  const [galleryContextMenu, setGalleryContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  
  // 📁 Proyectos Guardados - Firebase + localStorage como cache
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [firebaseProjects, setFirebaseProjects] = useState<VideoProject[]>([]);
  const [showProjectsPanel, setShowProjectsPanel] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // ?? Cargar proyectos desde Firebase al montar o cuando cambia el usuario
  useEffect(() => {
    const loadFirebaseProjects = async () => {
      if (!user?.id) {
        setFirebaseProjects([]);
        return;
      }
      
      setIsLoadingProjects(true);
      try {
        const projects = await getUserProjects(user.id);
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
        console.error('? [FIREBASE] Error cargando proyectos:', error);
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
  
  // ?? CRITICAL: Sincronizar clips cuando initialClips cambian (ej: cuando se generan im�genes)
  useEffect(() => {
    if (initialClips && initialClips.length > 0) {
      const normalizedClips = normalizeClips(initialClips);
      
      // Verificar si hay cambios reales (comparar URLs de im�genes)
      const currentHasImages = clips.some(c => c.url || c.imageUrl || c.thumbnailUrl);
      const newHasImages = normalizedClips.some(c => c.url || c.imageUrl || c.thumbnailUrl);
      
      // Si los nuevos clips tienen im�genes que los actuales no tienen, actualizar
      if (newHasImages || normalizedClips.length !== clips.length) {
        logger.info(`?? [SYNC] Actualizando clips internos: ${normalizedClips.length} clips, im�genes: ${newHasImages}`);
        
        // Preservar las im�genes existentes y actualizar con las nuevas
        setClips(prevClips => {
          return normalizedClips.map(newClip => {
            const existingClip = prevClips.find(c => c.id === newClip.id);
            if (existingClip) {
              // Merge: priorizar im�genes nuevas, pero mantener datos existentes
              return {
                ...existingClip,
                ...newClip,
                // Priorizar URL no vac�a
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
  
  // ??? CRITICAL: Auto-sincronizar im�genes generadas con clips del timeline
  useEffect(() => {
    if (generatedImages && generatedImages.length > 0) {
      logger.info(`??? [AUTO-SYNC] ${generatedImages.length} im�genes generadas detectadas, sincronizando con timeline...`);
      
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
            logger.info(`??? [AUTO-SYNC] Clip ${clip.id} ? Imagen ${matchingImage.id}`);
            return {
              ...clip,
              layerId: clip.layerId || 1, // Asegurar layerId para capa de im�genes
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
          logger.info(`? [AUTO-SYNC] Timeline actualizado con im�genes generadas`);
        }
        
        return updated ? newClips : prevClips;
      });
    }
  }, [generatedImages]);
  
  // ?? AUTO-ADD: Crear clip de audio autom�ticamente cuando hay audioPreviewUrl
  // Tambi�n crear segmentos de audio para clips que necesitan lipsync
  useEffect(() => {
    if (audioPreviewUrl && duration > 0) {
      setClips(prevClips => {
        // Verificar si ya hay un clip de audio principal
        const hasMainAudioClip = prevClips.some(c => 
          (c.layerId === 2 || c.type === ClipType.AUDIO) && 
          !c.metadata?.isLipsyncSegment
        );
        
        const newClips = [...prevClips];
        
        if (!hasMainAudioClip) {
          const audioClip: TimelineClip = {
            id: 99999, // ID especial para audio
            layerId: 2,
            type: ClipType.AUDIO,
            start: 0,
            duration: duration,
            url: audioPreviewUrl,
            title: '?? Audio Principal',
            in: 0,
            out: duration,
            sourceStart: 0,
            metadata: {
              isMainAudio: true,
              totalDuration: duration
            }
          };
          newClips.push(audioClip);
        }
        
        // ?? LIPSYNC: Crear segmentos de audio para clips que necesitan lipsync
        const clipsNeedingLipsync = prevClips.filter(c => 
          c.layerId === 1 && 
          (c.metadata?.needsLipsync || c.needsLipsync) &&
          !prevClips.some(ac => ac.metadata?.parentSceneId === c.id && ac.metadata?.isLipsyncSegment)
        );
        
        if (clipsNeedingLipsync.length > 0) {
          logger.info(`?? [AUTO-ADD] Creando ${clipsNeedingLipsync.length} segmentos de lipsync`);
          
          clipsNeedingLipsync.forEach((clip, index) => {
            const lipsyncSegment: TimelineClip = {
              id: 90000 + index, // IDs especiales para segmentos lipsync
              layerId: 3, // Capa 3 = Lipsync Segments
              type: ClipType.AUDIO,
              start: clip.start,
              duration: clip.duration,
              url: audioPreviewUrl,
              title: `?? Vocal ${clip.id}`,
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
          });
        }
        
        return newClips.length !== prevClips.length ? newClips : prevClips;
      });
    }
  }, [audioPreviewUrl, duration, clips]);
  
  // ?? AUTO-ANALYZE: Analizar audio para obtener beats cuando se carga
  useEffect(() => {
    if (audioPreviewUrl && !audioAnalysis && !isAnalyzingAudio) {
      analyzeAudio(audioPreviewUrl).catch(() => {
        // Silently ignore audio analysis errors
      });
    }
  }, [audioPreviewUrl, audioAnalysis, isAnalyzingAudio, analyzeAudio]);
  
  // Generar marcadores de beat para el timeline
  const beatGuides = useMemo(() => {
    if (!audioAnalysis?.beats) return [];
    // Usar beats o downbeats para las gu�as visuales
    const beatsToUse = audioAnalysis.downbeats?.length > 0 
      ? audioAnalysis.downbeats 
      : audioAnalysis.beats.filter((_, i) => i % 4 === 0); // Cada 4 beats si no hay downbeats
    return beatsToUse.slice(0, 200); // Limitar para performance
  }, [audioAnalysis]);
  
  // ?? CRITICAL: Constante de duraci�n m�xima de clip (Grok Imagine = 6s)
  const MAX_CLIP_DURATION = 6;
  
  // ?? CRITICAL: Calcular clip activo basado en currentTime para sincronizaci�n exacta
  const activeClip = useMemo(() => {
    // Buscar clip de imagen (layerId 1) que est� en el tiempo actual
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
  
  // ??? Funci�n helper para obtener URL de imagen de un clip
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

  // ?? URL de video activo para el visor (si se gener� video desde imagen)
  const activeClipVideoUrl = useMemo(() => {
    if (!activeClip) return null;
    // Prioridad: lipsyncVideoUrl > videoUrl en metadata > videoUrl directo
    return activeClip.metadata?.lipsyncVideoUrl || 
           activeClip.metadata?.videoUrl || 
           activeClip.videoUrl || 
           null;
  }, [activeClip]);
  
  // ?? Ref para el video del clip activo
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  // ?? CRITICAL: Sincronizar video del clip activo con el timeline
  useEffect(() => {
    const video = activeVideoRef.current;
    if (!video || !activeClip || !activeClipVideoUrl) return;
    
    // Calcular tiempo local dentro del clip
    const clipLocalTime = currentTime - activeClip.start;
    
    // Solo actualizar si el tiempo es v�lido
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
  
  // ??? Men� Contextual (click derecho)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    clipId: number | null;
    time: number;
  }>({ visible: false, x: 0, y: 0, clipId: null, time: 0 });
  const [clipboardClip, setClipboardClip] = useState<TimelineClip | null>(null);

  // ?? Framerate para timecode
  const [framerate, setFramerate] = useState<24 | 30 | 60>(30);
  const frameInterval = 1 / framerate; // Duraci�n de un frame en segundos

  // Funci�n para formatear timecode seg�n framerate (HH:MM:SS:FF)
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

  // Snap al frame m�s cercano
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

  // Manejador del divisor horizontal (visor/galer�a)
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

  // 📥 Cerrar menu de importacion al hacer clic fuera
  useEffect(() => {
    if (!showImportMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-import-menu]')) {
        setShowImportMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showImportMenu]);

  // 📂 Cerrar menu contextual de galeria al hacer clic fuera
  useEffect(() => {
    if (!galleryContextMenu.visible) return;
    
    const handleClickOutside = () => {
      setGalleryContextMenu({ visible: false, x: 0, y: 0 });
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [galleryContextMenu.visible]);

  // Handler para menu contextual de la galeria
  const handleGalleryContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuWidth = 180;
    const menuHeight = 150;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + menuWidth > viewportWidth - 20) {
      x = viewportWidth - menuWidth - 20;
    }
    if (y + menuHeight > viewportHeight - 20) {
      y = viewportHeight - menuHeight - 20;
    }
    
    setGalleryContextMenu({ visible: true, x, y });
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

  // Beats como array simple - ahora usa audioAnalysis si est� disponible, sino markers
  // (beatGuides ya est� definido arriba con audioAnalysis)
  const sectionGuides = useMemo(() => markers.filter(m => m.type === 'section').map(m => m.time), [markers]);

  // ?? Play loop con tiempo real, framerate exacto y soporte J/K/L (playbackRate)
  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (playingRaf.current) cancelAnimationFrame(playingRaf.current);
      lastFrameTime.current = 0;
      return;
    }
    
    // ?? CRITICAL: Usar el audio como fuente de tiempo real para sincronizaci�n exacta
    const startPlaybackTime = performance.now();
    const startCurrentTime = currentTime;
    
    const tick = () => {
      // M�todo 1: Si hay audio Y playbackRate es 1x positivo, usar audio como referencia
      if (audioRef.current && !audioRef.current.paused && playbackRate === 1) {
        const audioTime = audioRef.current.currentTime;
        const snappedTime = Math.round(audioTime * framerate) / framerate;
        
        if (snappedTime >= duration || snappedTime < 0) {
          setIsPlaying(false);
          setCurrentTime(snappedTime >= duration ? 0 : 0);
          setPlaybackRate(1);
          return;
        }
        
        setCurrentTime(snappedTime);
      } else {
        // M�todo 2: Sin audio o con playbackRate != 1 (J/K/L control)
        const elapsedMs = performance.now() - startPlaybackTime;
        const elapsedSeconds = (elapsedMs / 1000) * playbackRate; // Aplicar velocidad
        let newTime = startCurrentTime + elapsedSeconds;
        
        // Snap al frame exacto
        newTime = Math.round(newTime * framerate) / framerate;
        
        // Limites
        if (newTime >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          setPlaybackRate(1);
          return;
        }
        if (newTime < 0) {
          setIsPlaying(false);
          setCurrentTime(0);
          setPlaybackRate(1);
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
      videoRef.current.playbackRate = Math.abs(playbackRate); // Video no soporta negativo
      if (playbackRate > 0) {
        videoRef.current.play().catch((err) => {
          console.warn('🎬 [Video] Error al reproducir:', err.message);
        });
      } else {
        videoRef.current.pause(); // Pausar si vamos hacia atrás
      }
    }
    if (audioRef.current) {
      // 🔊 Aplicar volumen antes de reproducir
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.currentTime = currentTime;
      // Audio solo soporta rates positivos normales
      if (playbackRate === 1) {
        audioRef.current.playbackRate = 1;
        audioRef.current.play()
          .then(() => {
            setAudioReady(true);
            setAudioError(null);
          })
          .catch((err) => {
            console.warn('🔊 [Audio] Error al reproducir:', err.message);
            // Si es error de autoplay, mostrar mensaje útil
            if (err.name === 'NotAllowedError') {
              setAudioError('Haz clic para activar audio');
            } else {
              setAudioError(err.message);
            }
          });
      } else {
        audioRef.current.pause(); // Silenciar en velocidades especiales
      }
    }
    
    return () => {
      if (playingRaf.current) cancelAnimationFrame(playingRaf.current);
    };
  }, [isPlaying, duration, framerate, playbackRate, volume, isMuted]);

  // 🔊 Sincronizar volumen con el elemento de audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

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

  const pushHistory = useCallback((newClips: TimelineClip[]) => {
    setHistory(h => ({
      past: [...h.past, clips],
      future: [],
    }));
    setClips(newClips);
  }, [clips]);

  // ?? Funciones de Proyectos Guardados (despu�s de pushHistory)
  const handleSaveProject = useCallback(async () => {
    // Verificar usuario autenticado
    if (!user?.id) {
      toast({
        title: "?? Usuario no autenticado",
        description: "Debes iniciar sesi�n para guardar proyectos de forma permanente",
        variant: "destructive"
      });
      return;
    }
    
    const name = projectName.trim() || `Proyecto ${new Date().toLocaleDateString()}`;
    
    // Verificar que hay im�genes para guardar
    const imagesWithUrls = generatedImages.filter(img => img.url);
    if (imagesWithUrls.length === 0) {
      toast({
        title: "?? Sin im�genes",
        description: "Genera im�genes antes de guardar el proyecto",
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
      
      // Preparar im�genes para subir a Firebase Storage
      const imagesToUpload = imagesWithUrls.map((img, i) => ({
        sceneId: `scene-${i + 1}`,
        imageData: img.url // URL temporal de FAL que se convertir� a permanente
      }));
      
      // Crear proyecto con im�genes en Firebase
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
        title: "? Proyecto guardado en la nube",
        description: `"${name}" guardado con ${clips.length} clips. Las im�genes ahora son permanentes.`,
      });
      
    } catch (error) {
      console.error('? [FIREBASE] Error guardando proyecto:', error);
      toast({
        title: "? Error al guardar",
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
    logger.info(`?? Cargando proyecto: ${project.name}`);
    logger.info(`?? Clips: ${project.clips?.length || 0}, Im�genes: ${project.generatedImages?.length || 0}`);
    
    // Usar normalizeClips para manejar la conversi�n de formato
    const normalizedClips = normalizeClips(project.clips || []);
    
    // Asociar im�genes generadas a los clips normalizados
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
      
      return {
        ...clip,
        url: finalImageUrl,
        imageUrl: finalImageUrl,
        thumbnailUrl: clip.thumbnailUrl || finalImageUrl,
      };
    });
    
    logger.info(`? ${loadedClips.filter(c => c.url || c.imageUrl).length} clips con im�genes cargados`);
    logger.info(`?? Clips por capa: Capa 1: ${loadedClips.filter(c => c.layerId === 1).length}, Capa 2: ${loadedClips.filter(c => c.layerId === 2).length}`);
    
    setClips(loadedClips);
    pushHistory(loadedClips);
    setShowProjectsPanel(false);
    
    toast({
      title: "? Proyecto cargado",
      description: `"${project.name}" con ${loadedClips.length} clips`,
    });
  }, [pushHistory, toast]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    // Eliminar de Firebase si el usuario est� autenticado
    if (user?.id) {
      try {
        await deleteVideoProject(projectId, user.id);
      } catch (error) {
        // Continuar con eliminaci�n local de todas formas
      }
    }
    
    // Eliminar del estado local
    const updated = savedProjects.filter(p => p.id !== projectId);
    setSavedProjects(updated);
    
    toast({
      title: "??? Proyecto eliminado",
      description: "El proyecto y sus im�genes han sido eliminados",
    });
  }, [savedProjects, user?.id, toast]);

  // ?? EXPORT VIDEO - Genera el video final a partir del timeline
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExportVideo = useCallback(async () => {
    if (clips.length === 0) {
      toast({
        title: "Sin clips",
        description: "A�ade clips al timeline para exportar",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: "?? Iniciando exportaci�n...",
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

      // Llamar al endpoint de exportaci�n
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
          title: "? Exportaci�n completa",
          description: "Tu video est� listo para descargar",
        });
      } else if (data.jobId) {
        // El renderizado est� en proceso
        toast({
          title: "? Renderizando video...",
          description: `Job ID: ${data.jobId}. Te notificaremos cuando est� listo.`,
        });
      }

      logger.info('?? [Export] Video exportado exitosamente', data);
    } catch (error) {
      logger.error('? [Export] Error exportando video:', error);
      toast({
        title: "Error en exportaci�n",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [clips, duration, audioPreviewUrl, projectName, toast]);

  //  CRITICAL: Auto-sincronizar im�genes generadas con clips del timeline
  useEffect(() => {
    if (generatedImages && generatedImages.length > 0) {
      logger.info(` [AUTO-SYNC] ${generatedImages.length} im�genes generadas detectadas, sincronizando con timeline...`);
      
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
          logger.info(` [AUTO-SYNC] Timeline actualizado con im�genes generadas`);
        }
        
        return updated ? newClips : prevClips;
      });
    }
  }, [generatedImages]);
  
  //  Men� Contextual
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
        logger.info('?? Clip copiado:', clip.id);
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
      logger.info('?? Clip pegado en:', currentTime);
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
        logger.info('?? Clip duplicado:', clip.id);
      }
    }
    closeContextMenu();
  }, [clips, contextMenu.clipId, pushHistory, closeContextMenu]);

  const handleDeleteClipContext = useCallback(() => {
    if (contextMenu.clipId) {
      const newClips = clips.filter(c => c.id !== contextMenu.clipId);
      pushHistory(newClips);
      setSelectedClipId(null);
      logger.info('??? Clip eliminado:', contextMenu.clipId);
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
        logger.info('?? Clip dividido en:', currentTime);
      }
    }
    closeContextMenu();
  }, [clips, contextMenu.clipId, currentTime, pushHistory, closeContextMenu]);

  const handleSetPlayheadHere = useCallback(() => {
    setCurrentTime(contextMenu.time);
    closeContextMenu();
  }, [contextMenu.time, closeContextMenu]);

  // Cerrar men� al hacer click fuera
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

  // ??? Selecci�n de clips con soporte para multi-select (Shift+Click, Ctrl+Click)
  const handleSelectClip = useCallback((id: number | null, event?: React.MouseEvent) => {
    if (id === null) {
      setSelectedClipId(null);
      setSelectedClipIds(new Set());
      return;
    }
    
    // Shift+Click: Seleccionar rango de clips
    if (event?.shiftKey && selectedClipId !== null) {
      const sortedClips = [...clips].sort((a, b) => a.start - b.start);
      const startIdx = sortedClips.findIndex(c => c.id === selectedClipId);
      const endIdx = sortedClips.findIndex(c => c.id === id);
      
      if (startIdx !== -1 && endIdx !== -1) {
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = sortedClips.slice(from, to + 1).map(c => c.id);
        setSelectedClipIds(new Set([...Array.from(selectedClipIds), ...rangeIds]));
      }
      return;
    }
    
    // Ctrl/Cmd+Click: Toggle individual en multi-select
    if (event?.ctrlKey || event?.metaKey) {
      setSelectedClipIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
      setSelectedClipId(id);
      return;
    }
    
    // Click normal: Selecci�n simple
    setSelectedClipId(id);
    setSelectedClipIds(new Set([id]));
  }, [clips, selectedClipId, selectedClipIds]);

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
    setSelectedClipId(null);
    setSelectedClipIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
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
    // Permitir redimensionar hasta duraci�n m�nima de 0.1s
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

  // Click en timeline/ruler: posiciona el cursor en el frame m�s cercano
  const handleTimelineClick = (timeGlobal: number) => {
    const clampedTime = clamp(timeGlobal, 0, duration);
    // Snap al frame exacto
    const snappedTime = Math.round(clampedTime * framerate) / framerate;
    setCurrentTime(snappedTime);
  };

  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 800));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 20));

  // ?? Shortcuts Profesionales (J/K/L, Ctrl+Z, Multi-select, etc)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignorar si estamos en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Ctrl/Cmd shortcuts
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            doRedo();
          } else {
            doUndo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          doRedo();
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          const allIds = new Set(clips.map(c => c.id));
          setSelectedClipIds(allIds);
          const firstId = clips.length > 0 ? clips[0].id : null;
          if (firstId !== null) setSelectedClipId(firstId);
        } else if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setSelectedClipIds(new Set());
          setSelectedClipId(null);
        }
        return;
      }
      
      // ?? J/K/L Playback Control
      if (e.code === 'KeyJ') {
        e.preventDefault();
        setPlaybackRate(prev => prev > 0 ? -1 : Math.max(-4, prev - 1));
        setIsPlaying(true);
      }
      if (e.code === 'KeyK') {
        e.preventDefault();
        setIsPlaying(false);
        setPlaybackRate(1);
      }
      if (e.code === 'KeyL') {
        e.preventDefault();
        if (!isPlaying) {
          setIsPlaying(true);
          setPlaybackRate(1);
        } else {
          setPlaybackRate(prev => prev < 0 ? 1 : Math.min(4, prev + 1));
        }
      }
      
      // Space = Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
        setPlaybackRate(1);
      }
      
      // Tool shortcuts
      if (e.code === 'KeyV') setTool('select');
      if (e.code === 'KeyC') setTool('razor');
      if (e.code === 'KeyT') setTool('trim');
      if (e.code === 'KeyH') setTool('hand');
      
      // Delete selected clips
      if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        if (selectedClipIds.size > 0) {
          const newClips = clips.filter(c => !selectedClipIds.has(c.id));
          pushHistory(newClips);
          setSelectedClipIds(new Set());
          setSelectedClipId(null);
        } else if (selectedClipId !== null) {
          const newClips = clips.filter(c => c.id !== selectedClipId);
          pushHistory(newClips);
          setSelectedClipId(null);
        }
      }
      
      // Zoom
      if (e.code === 'Equal' || e.code === 'Plus') {
        e.preventDefault();
        zoomIn();
      }
      if (e.code === 'Minus') {
        e.preventDefault();
        zoomOut();
      }
      
      // Navigation
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? (1 / framerate) : e.ctrlKey ? 5 : 1;
        setCurrentTime(t => Math.round(Math.max(0, t - step) * framerate) / framerate);
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? (1 / framerate) : e.ctrlKey ? 5 : 1;
        setCurrentTime(t => Math.round(Math.min(duration, t + step) * framerate) / framerate);
      }
      if (e.code === 'Comma') {
        e.preventDefault();
        setCurrentTime(t => Math.round(Math.max(0, t - (1 / framerate)) * framerate) / framerate);
      }
      if (e.code === 'Period') {
        e.preventDefault();
        setCurrentTime(t => Math.round(Math.min(duration, t + (1 / framerate)) * framerate) / framerate);
      }
      if (e.code === 'Home') {
        e.preventDefault();
        setCurrentTime(0);
      }
      if (e.code === 'End') {
        e.preventDefault();
        setCurrentTime(Math.round(duration * framerate) / framerate);
      }
      if (e.code === 'Escape') {
        setSelectedClipIds(new Set());
        setSelectedClipId(null);
        setShowImportMenu(false);
      }
      
      // ?? Import shortcut
      if (e.code === 'KeyI' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleOpenFilePicker('all');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration, framerate, clips, selectedClipId, selectedClipIds, isPlaying, doUndo, doRedo, pushHistory]);

  // ===== HANDLERS PARA ACCIONES SOBRE CLIPS =====

  // Actualizar un clip espec�fico
  const updateClip = useCallback((clipId: number, updates: Partial<TimelineClip>) => {
    setClips(prevClips => prevClips.map(c => 
      c.id === clipId ? { ...c, ...updates } : c
    ));
  }, []);

  // ===== ?? IMPORTACI�N DE ARCHIVOS MULTIMEDIA =====
  
  // Obtener tipos de archivo aceptados seg�n el tipo de importaci�n
  const getAcceptedFileTypes = useCallback((type: 'image' | 'audio' | 'video' | 'all') => {
    switch (type) {
      case 'image':
        return 'image/jpeg,image/png,image/gif,image/webp';
      case 'audio':
        return 'audio/mpeg,audio/wav,audio/ogg,audio/mp3,audio/aac,audio/m4a';
      case 'video':
        return 'video/mp4,video/webm,video/quicktime,video/x-msvideo';
      case 'all':
      default:
        return 'image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/mp3,video/mp4,video/webm,video/quicktime';
    }
  }, []);

  // Detectar tipo de archivo
  const detectFileType = useCallback((file: File): 'image' | 'audio' | 'video' | null => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return null;
  }, []);

  // Abrir selector de archivos
  const handleOpenFilePicker = useCallback((type: 'image' | 'audio' | 'video' | 'all' = 'all') => {
    setImportType(type);
    setShowImportMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = getAcceptedFileTypes(type);
      fileInputRef.current.click();
    }
  }, [getAcceptedFileTypes]);

  // Procesar archivos seleccionados
  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    logger.info(`?? [Import] Procesando ${files.length} archivo(s)...`);

    try {
      const newClips: TimelineClip[] = [];
      const maxClipId = clips.reduce((max, c) => Math.max(max, typeof c.id === 'number' ? c.id : 0), 0);
      let clipIdCounter = maxClipId + 1000; // Offset para nuevos clips importados

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = detectFileType(file);
        
        if (!fileType) {
          toast({
            title: "Tipo no soportado",
            description: `El archivo "${file.name}" no es compatible`,
            variant: "destructive"
          });
          continue;
        }

        // Crear URL temporal para el archivo
        const objectUrl = URL.createObjectURL(file);
        
        // Calcular posici�n de inicio (despu�s del �ltimo clip de ese tipo)
        const existingClipsOfType = clips.filter(c => {
          if (fileType === 'image') return c.layerId === 1;
          if (fileType === 'audio') return c.layerId === 2;
          if (fileType === 'video') return c.layerId === 1;
          return false;
        });
        const lastClipEnd = existingClipsOfType.length > 0 
          ? Math.max(...existingClipsOfType.map(c => c.start + c.duration))
          : 0;

        // Obtener duraci�n para audio/video
        let fileDuration = 3; // Default para im�genes
        
        if (fileType === 'audio' || fileType === 'video') {
          fileDuration = await new Promise<number>((resolve) => {
            const media = fileType === 'audio' 
              ? new Audio() 
              : document.createElement('video');
            media.onloadedmetadata = () => {
              resolve(media.duration || 3);
            };
            media.onerror = () => resolve(3);
            media.src = objectUrl;
          });
        }

        const newClip: TimelineClip = {
          id: clipIdCounter++,
          layerId: fileType === 'audio' ? 2 : 1, // Audio en capa 2, imagen/video en capa 1
          type: fileType === 'image' ? ClipType.IMAGE 
              : fileType === 'audio' ? ClipType.AUDIO 
              : ClipType.VIDEO,
          start: currentTime > 0 ? currentTime : lastClipEnd, // Insertar en playhead o al final
          duration: Math.min(fileDuration, Math.max(0.5, duration - (currentTime > 0 ? currentTime : lastClipEnd))),
          url: objectUrl,
          imageUrl: fileType === 'image' ? objectUrl : undefined,
          title: file.name,
          // Campos necesarios para el sistema de arrastre
          in: 0,
          out: fileDuration,
          sourceStart: 0,
          metadata: {
            isImported: true,
            originalFileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            importedAt: new Date().toISOString()
          }
        };

        newClips.push(newClip);
        logger.info(`?? [Import] Clip creado: ${file.name} (${fileType})`);
      }

      if (newClips.length > 0) {
        pushHistory(clips);
        setClips(prev => [...prev, ...newClips]);
        
        toast({
          title: "? Archivos importados",
          description: `${newClips.length} archivo(s) a�adido(s) al timeline`,
        });
      }

    } catch (error) {
      logger.error('? [Import] Error importando archivos:', error);
      toast({
        title: "Error de importaci�n",
        description: "No se pudieron importar los archivos",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
      // Limpiar el input para permitir reimportar el mismo archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [clips, currentTime, duration, detectFileType, pushHistory, toast]);

  // Drag & Drop handler para el timeline completo
  const handleTimelineDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Simular el evento de input
    const fakeEvent = {
      target: { files }
    } as React.ChangeEvent<HTMLInputElement>;
    
    await handleFileImport(fakeEvent);
  }, [handleFileImport]);

  const handleTimelineDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // ?? Editar Imagen con Nano Banana AI
  const handleEditImage = useCallback((clip: TimelineClip) => {
    setImageEditorModalClip(clip);
    setShowImageEditorModal(true);
    logger.info(`?? [Timeline] Abriendo editor de imagen para clip ${clip.id}`);
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
      logger.info(`? [Timeline] Imagen editada para clip ${imageEditorModalClip.id}`);
    }
    setShowImageEditorModal(false);
    setImageEditorModalClip(null);
  }, [imageEditorModalClip, updateClip, toast]);

  // ?? Agregar M�sico
  const handleAddMusician = useCallback((clip: TimelineClip) => {
    setMusicianModalClip(clip);
    setShowMusicianModal(true);
    logger.info(`?? [Timeline] Abriendo modal de m�sico para clip ${clip.id}`);
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
        title: "M�sico agregado",
        description: `${musicianData.musicianType || 'M�sico'} a�adido al timeline`,
      });
      logger.info(`? [Timeline] M�sico agregado a clip ${musicianModalClip.id}`);
    }
    setShowMusicianModal(false);
    setMusicianModalClip(null);
  }, [musicianModalClip, updateClip, toast]);

  // ?? �ngulos de C�mara
  const handleCameraAngles = useCallback((clip: TimelineClip) => {
    setCameraAnglesModalClip(clip);
    setShowCameraAnglesModal(true);
    logger.info(`?? [Timeline] Abriendo modal de c�mara para clip ${clip.id}`);
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
        title: "�ngulo aplicado",
        description: `�ngulo "${angleName}" aplicado al clip`,
      });
      logger.info(`? [Timeline] �ngulo de c�mara aplicado a clip ${cameraAnglesModalClip.id}`);
    }
  }, [cameraAnglesModalClip, updateClip, toast]);

  // ?? Regenerar Imagen - Usando FAL Nano-Banana CON CONTEXTO DEL PROYECTO
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);
  
  const handleRegenerateImage = useCallback(async (clip: TimelineClip) => {
    logger.info(`?? [Timeline] Regenerando imagen para clip ${clip.id} CON CONTEXTO`);
    setIsRegenerating(clip.id);
    
    toast({
      title: "Regenerando imagen...",
      description: "Generando nueva imagen coherente con el concepto del video",
    });

    try {
      // ?? Construir prompt ENRIQUECIDO con contexto del proyecto
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
          // Buscar la escena que corresponde al clip por timing o �ndice
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
      
      logger.info(`?? [Timeline] Prompt enriquecido:`, enrichedPrompt.substring(0, 200) + '...');
      
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
      
      logger.info(`?? [Timeline] Usando endpoint: ${endpoint}, con referencia: ${shouldUseReference}`);
      
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
          title: "? Imagen regenerada",
          description: "Nueva imagen generada coherente con el concepto",
        });
        logger.info(`? [Timeline] Imagen regenerada para clip ${clip.id} con contexto del proyecto`);
      }
    } catch (error) {
      logger.error(`? [Timeline] Error regenerando imagen:`, error);
      toast({
        title: "Error regenerando",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(null);
    }
  }, [toast, updateClip, projectContext, clips]);

  // ?? Generar Video desde Imagen - Usando GROK IMAGINE VIDEO (xAI)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<number | null>(null);
  
  const handleGenerateVideo = useCallback(async (clip: TimelineClip) => {
    logger.info(`?? [Timeline] Generando video para clip ${clip.id} con Grok Imagine Video`);
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
      
      // ?? Extraer metadata de la escena para instrucciones de movimiento
      const sceneMetadata = clip.metadata || {};
      const cameraMovement = sceneMetadata.camera_movement || sceneMetadata.cameraMovement || 'smooth';
      const audioEnergy = sceneMetadata.audio_energy || 'medium';
      
      // Construir prompt mejorado con movimiento
      const motionDesc = audioEnergy === 'high' ? 'dynamic, energetic movement' :
                        audioEnergy === 'low' ? 'subtle, slow movement' : 'smooth, natural movement';
      const enhancedPrompt = `${prompt}. ${cameraMovement} camera movement, ${motionDesc}, cinematic quality, professional music video style`;
      
      // ?? Duraci�n: Grok genera videos de 6 segundos
      const videoDuration = Math.min(clip.duration, 6);
      
      logger.info(`?? [Timeline] Grok Prompt: ${enhancedPrompt}`);
      
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
          videoUrl: data.videoUrl, // Propiedad ra�z para acceso directo
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
          title: "? Video generado",
          description: "Video creado exitosamente con Grok Imagine Video (xAI)",
        });
        logger.info(`? [Timeline] Video generado para clip ${clip.id}: ${data.videoUrl}`);
      } else {
        throw new Error('No se recibi� URL del video');
      }
    } catch (error) {
      logger.error(`? [Timeline] Error generando video:`, error);
      toast({
        title: "Error generando video",
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVideo(null);
    }
  }, [toast, updateClip]);
  
  // Polling para videos as�ncronos de FAL Kling
  const pollVideoStatus = useCallback(async (clipId: number, requestId: string, model: string) => {
    const maxAttempts = 60; // 5 minutos m�ximo (cada 5 segundos)
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
            title: "? Video listo",
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
            title: "? Error en video",
            description: data.error || 'La generaci�n de video fall�',
            variant: "destructive",
          });
          return;
        }
        
        // A�n procesando
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Revisar cada 5 segundos
        } else {
          toast({
            title: "? Tiempo excedido",
            description: "La generaci�n est� tomando m�s tiempo del esperado. Revisa m�s tarde.",
            variant: "destructive",
          });
        }
      } catch (error) {
        logger.error('Error polling video status:', error);
      }
    };
    
    // Iniciar despu�s de 10 segundos
    setTimeout(checkStatus, 10000);
  }, [updateClip, toast]);

  // ============================================================================
  // ?? LIPSYNC - Aplicar sincronizaci�n de labios a clips PERFORMANCE
  // ============================================================================
  // WORKFLOW: Video (ya generado) + Audio Segment ? Video con Lipsync
  const [isApplyingLipsync, setIsApplyingLipsync] = useState<number | null>(null);

  const handleApplyLipsync = useCallback(async (clip: TimelineClip) => {
    logger.info(`?? [Timeline] Aplicando lipsync a clip ${clip.id}`);
    
    // 1?? Verificar que el clip tiene video
    const videoUrl = clip.metadata?.videoUrl;
    if (!videoUrl) {
      toast({
        title: "Sin video",
        description: "Primero genera el video del clip antes de aplicar lipsync",
        variant: "destructive",
      });
      return;
    }

    // 2?? Verificar que tenemos audioBuffer disponible
    if (!audioBuffer) {
      toast({
        title: "Sin audio",
        description: "No hay audio disponible para sincronizar",
        variant: "destructive",
      });
      return;
    }

    // 3?? Verificar que el clip tiene timestamps v�lidos
    // NOTA: TimelineClip usa 'start' no 'startTime'
    const startTime = clip.start;
    const endTime = clip.start + clip.duration;
    
    if (startTime === undefined || endTime === undefined || endTime <= startTime) {
      toast({
        title: "Timestamps inv�lidos",
        description: "El clip no tiene tiempos v�lidos para cortar audio",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingLipsync(clip.id);

    toast({
      title: "?? Aplicando lipsync...",
      description: `Sincronizando labios con audio (${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s)`,
    });

    try {
      // 4?? Cortar el segmento de audio correspondiente al clip
      logger.info(`?? [Timeline] Cortando audio: ${startTime}s - ${endTime}s`);
      
      // Importar la funci�n de corte de audio
      const { cutAudioSegment } = await import('@/lib/services/audio-segmentation');
      const audioSegment = await cutAudioSegment(audioBuffer, startTime, endTime);
      
      logger.info(`? [Timeline] Audio cortado: ${(audioSegment.blob.size / 1024).toFixed(2)}KB`);

      // 5?? Subir el audio a un servidor temporal para obtener URL
      // Usamos FormData para subir el audio como archivo
      const audioFormData = new FormData();
      audioFormData.append('file', audioSegment.blob, `clip_${clip.id}_audio.wav`);
      
      const uploadResponse = await fetch('/api/upload/temp-audio', {
        method: 'POST',
        body: audioFormData,
      });

      if (!uploadResponse.ok) {
        // Si no hay endpoint de upload, usamos la URL local directamente
        // PixVerse deber�a poder aceptar data URLs o necesitamos un workaround
        logger.warn('?? No hay endpoint de upload, intentando con data URL');
        
        // Convertir blob a base64 data URL
        const reader = new FileReader();
        const audioDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(audioSegment.blob);
        });
        
        // Por ahora, loggeamos que necesitamos un endpoint de upload
        toast({
          title: "?? Pendiente",
          description: "Se requiere implementar endpoint de upload de audio temporal",
          variant: "destructive",
        });
        setIsApplyingLipsync(null);
        return;
      }

      const uploadData = await uploadResponse.json();
      const audioUrl = uploadData.url;
      
      logger.info(`?? [Timeline] Audio subido: ${audioUrl}`);

      // 6?? Llamar al endpoint de lipsync con video + audio
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
        // 7?? Actualizar el clip con el video sincronizado
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
          title: "? Lipsync aplicado",
          description: `Labios sincronizados en ${lipsyncData.processingTime?.toFixed(1) || '?'}s`,
        });
        
        logger.info(`? [Timeline] Lipsync aplicado a clip ${clip.id}: ${lipsyncData.videoUrl}`);
      } else {
        throw new Error('No se recibi� URL del video con lipsync');
      }

    } catch (error) {
      logger.error(`? [Timeline] Error aplicando lipsync:`, error);
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
      {/* ?? Input oculto para importaci�n de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileImport}
        accept={getAcceptedFileTypes('all')}
      />
      
      <div 
        ref={containerRef} 
        className="flex flex-col bg-neutral-900 text-white rounded-md overflow-hidden h-full select-none"
        onContextMenu={(e) => handleContextMenu(e)}
        onDrop={handleTimelineDrop}
        onDragOver={handleTimelineDragOver}
      >
        {/* Toolbar Principal - Compact & Professional */}
        <div className="flex flex-wrap items-center justify-between px-1.5 sm:px-2 py-1 border-b border-white/10 bg-neutral-950 gap-1 flex-shrink-0">
          
          {/* Herramientas de edici�n */}
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

            <div className="mx-0.5 h-4 w-px bg-white/10" />

            {/* ?? Import Media */}
            <div className="relative flex items-center gap-px" data-import-menu>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowImportMenu(!showImportMenu)}
                disabled={isImporting}
                className="p-1 h-6 px-2 bg-cyan-500/10 hover:bg-cyan-500/20 gap-0.5"
                title="Importar Media (I)"
              >
                {isImporting ? (
                  <Loader2 size={12} className="text-cyan-400 animate-spin" />
                ) : (
                  <Upload size={12} className="text-cyan-400" />
                )}
                <span className="hidden sm:inline text-[10px] text-cyan-400">Import</span>
              </Button>
              
              {/* Dropdown Menu de Importaci�n */}
              {showImportMenu && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-neutral-900 border border-white/20 rounded-lg shadow-xl py-1 min-w-[140px]" data-import-menu>
                  <button
                    onClick={() => handleOpenFilePicker('all')}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 flex items-center gap-2 text-white/90"
                  >
                    <Upload size={12} className="text-cyan-400" />
                    Todos los archivos
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button
                    onClick={() => handleOpenFilePicker('image')}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 flex items-center gap-2 text-white/90"
                  >
                    <ImagePlus size={12} className="text-green-400" />
                    Im�genes
                  </button>
                  <button
                    onClick={() => handleOpenFilePicker('audio')}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 flex items-center gap-2 text-white/90"
                  >
                    <FileAudio size={12} className="text-yellow-400" />
                    Audio
                  </button>
                  <button
                    onClick={() => handleOpenFilePicker('video')}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/10 flex items-center gap-2 text-white/90"
                  >
                    <FileVideo size={12} className="text-purple-400" />
                    Video
                  </button>
                </div>
              )}
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
            
            {/* 🎯 Indicador de velocidad J/K/L */}
            {playbackRate !== 1 && (
              <Badge 
                variant="outline" 
                className={`font-mono text-[9px] px-1 py-0 ml-0.5 ${
                  playbackRate < 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 
                  playbackRate > 1 ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                  'bg-black/30'
                }`}
              >
                {playbackRate > 0 ? `${playbackRate}x` : `${playbackRate}x ◀`}
              </Badge>
            )}
            
            {/* 🔊 Control de Volumen - Estilo Adobe Premiere */}
            <div className="flex items-center gap-1 ml-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  // Si hay error de autoplay, intentar reproducir con interacción
                  if (audioError && audioRef.current) {
                    audioRef.current.play()
                      .then(() => {
                        setAudioError(null);
                        setAudioReady(true);
                      })
                      .catch(err => {
                        setAudioError(err.message);
                      });
                  } else {
                    setIsMuted(m => !m);
                  }
                }}
                className={`p-0.5 h-5 w-5 ${isMuted || audioError ? 'text-red-400' : audioReady ? 'text-green-400' : 'text-white/50'}`}
                title={audioError ? `Clic para activar audio: ${audioError}` : isMuted ? 'Activar audio' : `Volumen: ${Math.round(volume * 100)}%`}
              >
                {audioError ? (
                  <AlertCircle size={11} />
                ) : isMuted || volume === 0 ? (
                  <VolumeMuteIcon size={11} />
                ) : volume < 0.5 ? (
                  <VolumeLowIcon size={11} />
                ) : (
                  <VolumeIcon size={11} />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVol = parseFloat(e.target.value);
                  setVolume(newVol);
                  if (newVol > 0 && isMuted) setIsMuted(false);
                }}
                className="w-12 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
                title={`Volumen: ${Math.round(volume * 100)}%`}
              />
            </div>
            
            {/* 📌 Indicador de multi-selección */}
            {selectedClipIds.size > 1 && (
              <Badge 
                variant="outline" 
                className="font-mono text-[9px] px-1 py-0 ml-0.5 bg-blue-500/20 text-blue-400 border-blue-500/50"
              >
                {selectedClipIds.size} sel
              </Badge>
            )}

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
                title={user?.id ? "Guardar en la nube" : "Inicia sesi�n para guardar"}
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
              
              {/* ?? Bot�n de Shortcuts */}
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-1 h-6 w-6 hover:bg-white/10"
                    >
                      <HelpCircle size={11} className="text-white/50" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-neutral-900 border-white/20 text-white p-3 max-w-xs">
                    <div className="text-xs space-y-1.5">
                      <p className="font-bold text-orange-400 mb-2">?? Atajos de Teclado</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        <span className="text-white/70">Space</span><span>Play/Pause</span>
                        <span className="text-white/70">J / K / L</span><span>? Pause ?</span>
                        <span className="text-white/70">? ?</span><span>�1s (Shift: frame)</span>
                        <span className="text-white/70">, .</span><span>Frame anterior/siguiente</span>
                        <span className="text-white/70">Home / End</span><span>Inicio / Final</span>
                        <span className="text-white/70">V / C / T / H</span><span>Select/Razor/Trim/Hand</span>
                        <span className="text-white/70">I</span><span>Importar archivos</span>
                        <span className="text-white/70">Ctrl+Z / Y</span><span>Undo / Redo</span>
                        <span className="text-white/70">Ctrl+A / D</span><span>Seleccionar / Deseleccionar</span>
                        <span className="text-white/70">Shift+Click</span><span>Multi-selecci�n</span>
                        <span className="text-white/70">Delete</span><span>Eliminar clips</span>
                        <span className="text-white/70">+ / -</span><span>Zoom In/Out</span>
                      </div>
                      <p className="text-white/50 mt-2 text-[10px]">?? Tambi�n puedes arrastrar archivos al timeline</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

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
                    {user?.id ? 'Guardar en Nube' : 'Inicia sesi�n'}
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
                        <span>�</span>
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
                <span className="text-xs">{user?.id ? 'No hay proyectos guardados' : 'Inicia sesi�n para ver tus proyectos'}</span>
                <span className="text-[10px]">{user?.id ? 'Guarda tu proyecto actual para verlo aqu�' : 'Los proyectos se guardan en la nube de forma permanente'}</span>
              </div>
            ) : null}
          </div>
        )}

        {/* ?? Panel de Acciones del Clip Seleccionado */}
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
                    {clips.find(c => c.id === selectedClipId)?.title || 'Sin t�tulo'}
                  </span>
                </div>
              </div>
              
              {/* Botones de Acci�n */}
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
                  title="Agregar M�sico"
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
                  title="�ngulos de C�mara"
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

        {/* Visor de Video + Galer�a de Im�genes - Altura ajustable */}
        <div 
          className="flex items-stretch px-2 sm:px-3 py-2 bg-neutral-950 flex-shrink-0"
          style={{ height: `${viewerHeight}%`, minHeight: '100px', maxHeight: '70%' }}
        >
          {/* Visor Principal */}
          <div className="relative flex-1 min-w-0 bg-black/70 rounded-md overflow-hidden border border-white/5">
            {selectedGalleryImage ? (
              // Mostrar imagen seleccionada de la galer�a
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
              // ?? CRITICAL: Mostrar VIDEO del clip activo (prioridad sobre imagen)
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
                  VIDEO � {activeClip?.title || `Escena ${activeClip?.id}`}
                </div>
                {/* Timecode */}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded font-mono text-[10px] text-orange-400">
                  {formatTimecode(currentTime)}
                </div>
              </div>
            ) : activeClipImageUrl ? (
              // ??? Mostrar IMAGEN del clip activo (fallback cuando no hay video)
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

          {/* Divisor Vertical - Entre Visor y Galer�a */}
          <div 
            className={`w-2 cursor-col-resize flex items-center justify-center transition-colors flex-shrink-0 hidden sm:flex ${
              isDraggingGallery ? 'bg-orange-500' : 'bg-neutral-800 hover:bg-orange-500/50'
            }`}
            onMouseDown={() => setIsDraggingGallery(true)}
            title="Arrastra para ajustar ancho de galer�a"
          >
            <div className="h-8 w-0.5 bg-white/20 rounded-full" />
          </div>

          {/* Galeria de Imagenes Generadas */}
          <div 
            className="hidden sm:flex flex-col flex-shrink-0 bg-neutral-900/50 rounded-md border border-white/5 overflow-hidden"
            style={{ width: `${galleryWidth}px`, minWidth: '80px', maxWidth: '350px' }}
            onContextMenu={handleGalleryContextMenu}
          >
            <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 bg-neutral-900">
              <div className="flex items-center gap-1">
                <ImageIcon size={10} className="text-orange-400" />
                <span className="text-[9px] sm:text-[10px] font-medium text-white/80">Imagenes</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Boton de importar rapido */}
                <button
                  onClick={() => handleOpenFilePicker('image')}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors"
                  title="Importar imagenes"
                >
                  <Upload size={10} className="text-cyan-400" />
                </button>
                <Badge variant="outline" className="text-[8px] px-1 py-0 bg-orange-500/10 border-orange-500/30 text-orange-400">
                  {generatedImages.length}
                </Badge>
              </div>
            </div>
            
            {/* Grid de imagenes */}
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
                      {/* Overlay con bot�n de agregar */}
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
          
          {/* 🔊 Audio Element - Mejorado con manejo de eventos */}
          {audioPreviewUrl && (
            <audio 
              ref={audioRef} 
              src={audioPreviewUrl} 
              preload="auto"
              onCanPlayThrough={() => {
                setAudioReady(true);
                setAudioError(null);
              }}
              onError={(e) => {
                const error = e.currentTarget.error;
                const errorMsg = error ? `Error ${error.code}: ${error.message}` : 'Error desconocido';
                setAudioError(errorMsg);
                setAudioReady(false);
              }}
              onPlay={() => {}}
              onPause={() => {}}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
            />
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
            <span className="hidden sm:inline">Duraci�n: {formatTime(duration)}</span>
            {/* BPM y estado de an�lisis */}
            {isAnalyzingAudio && (
              <span className="text-blue-400 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Analizando...
              </span>
            )}
            {audioAnalysis?.bpm && (
              <span className="text-green-400">? {Math.round(audioAnalysis.bpm)} BPM</span>
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
          logger.info(`? [Timeline] Motion aplicado a ${scenes.length} escenas`);
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
          logger.info(`? [Preview] Video aprobado para ${scene.scene_id}`);
          setPreviewModalOpen(false);
        }}
        onRegenerate={(scene) => {
          logger.info(`?? [Preview] Regenerando video para ${scene.scene_id}`);
        }}
      />

      {/* ?? Modal de M�sico */}
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

      {/* ?? Modal de �ngulos de C�mara */}
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

      {/* ?? Modal de Editor de Imagen (Nano Banana AI) */}
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

      {/* ??? Men� Contextual (Click Derecho) */}
      {contextMenu.visible && (
        <div 
          className="fixed z-50 bg-neutral-900 border border-white/20 rounded-lg shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del men� */}
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

              {/* ?? Generar Video */}
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

              {/* ?? Aplicar Lipsync - Solo para clips PERFORMANCE con video */}
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
                    <span>?? Aplicar Lipsync</span>
                  </button>
                );
              })()}

              {/* ?? Mostrar si ya tiene lipsync aplicado */}
              {(() => {
                const clip = clips.find(c => c.id === contextMenu.clipId);
                const hasLipsync = clip?.metadata?.lipsyncApplied;
                return hasLipsync && (
                  <div className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400">
                    <Music size={14} />
                    <span>? Lipsync aplicado</span>
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
                <span>Pegar aqu�</span>
                <span className="ml-auto text-[10px] text-white/40">Ctrl+V</span>
              </button>

              <button
                onClick={handleSetPlayheadHere}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-orange-500/20 hover:text-orange-400 transition-colors"
              >
                <MoreHorizontal size={14} />
                <span>Mover playhead aqu�</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={() => { setSnapEnabled(s => !s); closeContextMenu(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors"
              >
                <MagnetIcon size={14} className={snapEnabled ? 'text-orange-400' : ''} />
                <span>Snap magn�tico</span>
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

      {/* 📂 Menu Contextual de la Galeria (Click Derecho) */}
      {galleryContextMenu.visible && (
        <div
          className="fixed z-50 bg-neutral-900 border border-white/20 rounded-lg shadow-2xl py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
          style={{ left: galleryContextMenu.x, top: galleryContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-white/10 mb-1">
            <span className="text-[10px] text-white/50 uppercase tracking-wide">
              Importar Media
            </span>
          </div>
          
          <button
            onClick={() => { handleOpenFilePicker('image'); setGalleryContextMenu({ visible: false, x: 0, y: 0 }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-green-500/20 hover:text-green-400 transition-colors"
          >
            <ImagePlus size={14} />
            <span>Importar Imagenes</span>
          </button>
          
          <button
            onClick={() => { handleOpenFilePicker('audio'); setGalleryContextMenu({ visible: false, x: 0, y: 0 }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-yellow-500/20 hover:text-yellow-400 transition-colors"
          >
            <FileAudio size={14} />
            <span>Importar Audio</span>
          </button>
          
          <button
            onClick={() => { handleOpenFilePicker('video'); setGalleryContextMenu({ visible: false, x: 0, y: 0 }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
          >
            <FileVideo size={14} />
            <span>Importar Video</span>
          </button>
          
          <div className="my-1 border-t border-white/10" />
          
          <button
            onClick={() => { handleOpenFilePicker('all'); setGalleryContextMenu({ visible: false, x: 0, y: 0 }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors"
          >
            <Upload size={14} />
            <span>Todos los archivos</span>
          </button>
        </div>
      )}
    </>
  );
};

/** ---------- Helpers ---------- */
// ?? CRITICAL: M�xima duraci�n de clip (Grok Imagine Video = 6 segundos)
const MAX_CLIP_DURATION_SECONDS = 6;

// Función que acepta clips en cualquier formato (TimelineClip o TimelineItem) y los normaliza
// También segmenta clips mayores de 6 segundos para compatibilidad con generación de video
function normalizeClips(clips: any[]): TimelineClip[] {
  if (!clips || !Array.isArray(clips)) return [];
  
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
    
    // ?? CRITICAL: Segmentar clips mayores de MAX_CLIP_DURATION_SECONDS
    // Las generaciones de video solo soportan hasta 5 segundos
    if (durationSeconds > MAX_CLIP_DURATION_SECONDS && normalizedType !== ClipType.AUDIO) {
      const segmentCount = Math.ceil(durationSeconds / MAX_CLIP_DURATION_SECONDS);
      
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
      }
    } else {
      // Clip dentro de límites - agregar normalmente
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
  
  // Determinar niveles de detalle seg�n zoom
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
        // Subdivisiones: cada 5 frames m�s visible, cada 10 a�n m�s
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
      
      {/* L�nea base inferior */}
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
            {/* L�nea vertical */}
            <div 
              className={`absolute bottom-0 ${color} ${isMajor ? 'shadow-sm shadow-orange-500/50' : ''}`}
              style={{ width, height: `${height}%` }}
            />
            
            {/* N�mero de timecode */}
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
                  
                  {/* N�mero de frame peque�o (solo en zoom ultra) */}
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

