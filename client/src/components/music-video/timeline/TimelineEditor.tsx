import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Slider } from '../../../components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { 
  PlayCircle, PauseCircle, ZoomIn, ZoomOut, Plus, Scissors, Trash2, 
  Music, Image, Text, Video, Layers, MoveVertical, Eye, EyeOff, Lock, Unlock,
  Settings, FileVideo
} from 'lucide-react';

// Importar nuestros componentes y hooks personalizados 
import { WaveformLayer } from './WaveformLayer';
import { BeatsLayer } from './BeatsLayer';
import { ClipsLayer } from './ClipsLayer';
import { PlayheadLayer } from './PlayheadLayer';
import { useWaveSurfer } from '../../../hooks/timeline/useWaveSurfer';
import { useClipInteractions } from '../../../hooks/timeline/useClipInteractions';
import { useBeatsVisualization } from '../../../hooks/timeline/useBeatsVisualization';
import { useTimelineNavigation } from '../../../hooks/timeline/useTimelineNavigation';
import { usePreviewDialogs } from '../../../hooks/timeline/usePreviewDialogs';
import { useClipOperations } from '../../../hooks/timeline/useClipOperations';
import { useTimelineLayers, LayerConfig } from '../../../hooks/timeline/useTimelineLayers';

// Importar componentes del editor profesional
import ResizeHandleControl from '../../../components/professional-editor/resize-handle-control';
import VideoPreviewPanelComponent from '../../../components/professional-editor/video-preview-panel';
import ModuleConfiguratorComponent from '../../../components/professional-editor/module-configurator';
import MediaLibraryComponent from '../../../components/professional-editor/media-library';

// Importar constantes
import {
  LAYER_TYPES,
  CLIP_COLORS,
  ClipOperation,
  LayerType,
  SNAP_THRESHOLD
} from '../../../constants/timeline-constants';

// Interfaces para datos
export interface TimelineClip {
  id: number;
  type: 'video' | 'audio' | 'image' | 'text';
  start: number;
  duration: number;
  layer: number;
  name: string;
  url?: string;
  content?: string;
}

export interface BeatData {
  time: number;
  type: string;
  intensity: number;
  isDownbeat: boolean;
  timecode: string;
}

export interface BeatMap {
  beats: BeatData[];
  metadata?: {
    bpm: number;
    timeSignature?: string;
    key?: string;
  };
}

interface VisualEffect {
  id: string;
  name: string;
  type: 'transition' | 'filter' | 'motion' | 'color' | 'text';
  intensity: number;
  applied: boolean;
  start: number;
  duration: number;
  layer?: number;
  settings?: Record<string, any>;
}

interface ModuleConfig {
  id: string;
  name: string;
  type: 'panel' | 'tool';
  enabled: boolean;
  visible: boolean;
  position: number;
  defaultSize?: number;
  settings?: Record<string, any>;
}

interface TimelineEditorProps {
  audioUrl?: string;
  initialClips?: TimelineClip[];
  initialBeats?: BeatMap;
  onClipsChange?: (clips: TimelineClip[]) => void;
  onCurrentTimeChange?: (time: number) => void;
}

/**
 * Editor de timeline profesional con múltiples capas y funcionalidades avanzadas
 */
export function TimelineEditor({
  audioUrl,
  initialClips = [],
  initialBeats,
  onClipsChange,
  onCurrentTimeChange
}: TimelineEditorProps) {
  // Estado para el reproductor y clips
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [clips, setClips] = useState<TimelineClip[]>(initialClips);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [beatsData, setBeatsData] = useState<BeatMap | undefined>(initialBeats);
  const [showLayerManager, setShowLayerManager] = useState<boolean>(false);
  
  // Estado para gestión de capas
  const [visibleLayers, setVisibleLayers] = useState<string[]>(['audio', 'video', 'text', 'effects']);
  const [lockedLayers, setLockedLayers] = useState<string[]>([]);
  
  // Estados para componentes profesionales
  const [showModuleConfig, setShowModuleConfig] = useState<boolean>(false);
  const [activeEffects, setActiveEffects] = useState<VisualEffect[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [modules, setModules] = useState<ModuleConfig[]>([
    { id: 'preview', name: 'Vista previa', type: 'panel', enabled: true, visible: true, position: 0, defaultSize: 60 },
    { id: 'timeline', name: 'Línea de tiempo', type: 'panel', enabled: true, visible: true, position: 1, defaultSize: 20 },
    { id: 'media', name: 'Biblioteca', type: 'panel', enabled: true, visible: true, position: 2, defaultSize: 20 },
    { id: 'effects', name: 'Efectos', type: 'tool', enabled: true, visible: true, position: 3 },
    { id: 'audio', name: 'Audio', type: 'tool', enabled: true, visible: true, position: 4 },
    { id: 'text', name: 'Texto', type: 'tool', enabled: true, visible: true, position: 5 },
  ]);
  
  // Reproducción de audio con visualización de forma de onda
  const { 
    waveformContainerRef, 
    waveformData, 
    duration,
    play,
    pause,
    seekTo
  } = useWaveSurfer({
    audioUrl, 
    onTimeUpdate: (time) => {
      setCurrentTime(time);
      onCurrentTimeChange?.(time);
    },
    onPlayPause: (playing) => setIsPlaying(playing),
    onReady: () => console.log("Waveform ready")
  });
  
  // Navegación y zoom del timeline
  const {
    zoom,
    setZoom,
    scrollAreaRef,
    timeToPixels,
    pixelsToTime,
    handleZoomIn,
    handleZoomOut,
    updatePlayheadPosition
  } = useTimelineNavigation({
    duration,
    currentTime,
    isPlaying,
    selectedClip,
    clips
  });

  // Visualización de beats
  const {
    visibleBeats,
    hasBeats,
    bpmInfo
  } = useBeatsVisualization({
    beatsData,
    timeToPixels,
    duration,
    zoom
  });
  
  // Interacciones con clips (selección, movimiento, redimensionado)
  const {
    handleAddClip,
    handleSelectClip,
    handleDeleteClip,
    handleMoveClip,
    handleResizeClip,
    handleClipOperation
  } = useClipInteractions({
    clips,
    setClips,
    selectedClip,
    setSelectedClip,
    onClipsChange
  });
  
  // Diálogos de previsualización
  const {
    selectedImagePreview,
    setSelectedImagePreview,
    expandedPreview,
    setExpandedPreview,
    handleOpenPreview,
    handleClosePreview,
    handleToggleExpandPreview
  } = usePreviewDialogs();
  
  // Operaciones avanzadas para clips (dividir, combinar, duplicar)
  const {
    splitClip,
    combineClips,
    duplicateClip,
    findSnapPosition
  } = useClipOperations({
    onError: (message) => console.error(message),
    snapThreshold: SNAP_THRESHOLD,
    beatPositions: beatsData?.beats?.map(beat => beat.time) || [],
    beatSnapEnabled: true
  });
  
  // Gestión de capas del timeline
  const {
    layers,
    addLayer,
    removeLayer,
    updateLayer,
    getLayerById
  } = useTimelineLayers({
    onLayerChange: (updatedLayers) => {
      console.log("Capas actualizadas:", updatedLayers);
    }
  });
  
  // Funciones para gestionar la visibilidad de capas
  const toggleLayerVisibility = useCallback((layerId: string) => {
    if (visibleLayers.includes(layerId)) {
      setVisibleLayers(visibleLayers.filter(id => id !== layerId));
    } else {
      setVisibleLayers([...visibleLayers, layerId]);
    }
  }, [visibleLayers]);
  
  // Funciones para gestionar el bloqueo de capas
  const toggleLayerLock = useCallback((layerId: string) => {
    if (lockedLayers.includes(layerId)) {
      setLockedLayers(lockedLayers.filter(id => id !== layerId));
    } else {
      setLockedLayers([...lockedLayers, layerId]);
    }
  }, [lockedLayers]);
  
  // Verificar si una capa está bloqueada
  const isLayerLocked = useCallback((layerId: string) => {
    return lockedLayers.includes(layerId);
  }, [lockedLayers]);
  
  // Control de reproducción
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);
  
  // Actualizar tiempo actual al hacer click en la línea de tiempo
  const updateCurrentTime = useCallback((time: number) => {
    setCurrentTime(time);
    seekTo(time);
  }, [seekTo]);
  
  // Manejadores para agregar nuevos clips
  const addVideoClip = useCallback(() => {
    handleAddClip({
      type: 'video',
      start: currentTime,
      duration: 2,
      layer: LAYER_TYPES.VIDEO,
      name: 'New Video'
    });
  }, [currentTime, handleAddClip]);
  
  const addAudioClip = useCallback(() => {
    handleAddClip({
      type: 'audio',
      start: currentTime,
      duration: 2,
      layer: LAYER_TYPES.AUDIO,
      name: 'New Audio'
    });
  }, [currentTime, handleAddClip]);
  
  const addImageClip = useCallback(() => {
    handleAddClip({
      type: 'image',
      start: currentTime,
      duration: 1,
      layer: LAYER_TYPES.VIDEO,
      name: 'New Image'
    });
  }, [currentTime, handleAddClip]);
  
  const addTextClip = useCallback(() => {
    handleAddClip({
      type: 'text',
      start: currentTime,
      duration: 1.5,
      layer: LAYER_TYPES.TEXT,
      name: 'New Text',
      content: 'Sample Text'
    });
  }, [currentTime, handleAddClip]);
  
  // Renderizado del componente
  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-4">
        {/* Controles superiores */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
            </Button>
            
            <div className="ml-4 flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label="Zoom Out">
                <ZoomOut size={18} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label="Zoom In">
                <ZoomIn size={18} />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <span className="w-20 text-right">{formatTimecode(currentTime)}</span>
            <span>/</span>
            <span className="w-20">{formatTimecode(duration)}</span>
          </div>
          
          <div className="flex space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={addVideoClip}>
                    <Video size={16} className="text-purple-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Video Clip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={addAudioClip}>
                    <Music size={16} className="text-blue-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Audio Clip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={addImageClip}>
                    <Image size={16} className="text-green-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Image Clip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={addTextClip}>
                    <Text size={16} className="text-amber-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Text Clip</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setShowLayerManager(!showLayerManager)}
                  >
                    <Layers size={16} className="text-indigo-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage Layers</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {selectedClip !== null && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                          if (selectedClip) {
                            const clip = clips.find(c => c.id === selectedClip);
                            if (clip) {
                              // Calcular punto medio del clip para dividirlo
                              const clipMiddle = clip.start + (clip.duration / 2);
                              handleClipOperation(selectedClip, ClipOperation.SPLIT, { splitTime: clipMiddle });
                            }
                          }
                        }}
                      >
                        <Scissors size={16} className="text-orange-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Split Clip</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                          if (selectedClip) {
                            handleClipOperation(selectedClip, ClipOperation.DUPLICATE);
                          }
                        }}
                      >
                        <Plus size={16} className="text-teal-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate Clip</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => {
                          if (selectedClip) {
                            handleClipOperation(selectedClip, ClipOperation.CUT);
                          }
                        }}
                      >
                        <Scissors size={16} className="text-yellow-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Cut Clip</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDeleteClip(selectedClip)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Selected Clip</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </div>
        
        {/* Timeline principal con scroll */}
        <ScrollArea ref={scrollAreaRef} className="h-[calc(100vh-12rem)] overflow-x-auto">
          <div className="relative min-w-full" style={{ width: `${timeToPixels(duration)}px` }}>
            {/* Playhead y regla de tiempo */}
            <PlayheadLayer
              currentTime={currentTime}
              timeToPixels={timeToPixels}
              duration={duration}
              setCurrentTime={updateCurrentTime}
              isPlaying={isPlaying}
              zoom={zoom}
            />
            
            {/* Forma de onda de audio */}
            <WaveformLayer
              waveformData={waveformData}
              timeToPixels={timeToPixels}
              waveformContainerRef={waveformContainerRef}
              duration={duration}
            />
            
            {/* Capa de beats */}
            <BeatsLayer
              visibleBeats={visibleBeats}
              hasBeats={hasBeats}
              bpmInfo={bpmInfo}
            />
            
            {/* Capas para diferentes tipos de clips */}
            <div className="mt-1 border-t border-gray-800">
              {/* Capas predeterminadas */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 flex items-center text-xs font-medium text-muted-foreground">
                  <span>Audio</span>
                  <button 
                    className="ml-2 rounded-full bg-blue-500/20 p-0.5 text-blue-500 hover:bg-blue-500/30"
                    onClick={() => toggleLayerVisibility('audio')}
                  >
                    {isLayerLocked('audio') ? <Lock size={10} /> : (
                      visibleLayers.includes('audio') ? <Eye size={10} /> : <EyeOff size={10} />
                    )}
                  </button>
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LayerType.AUDIO)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={isLayerLocked('audio') ? undefined : handleResizeClip}
                  onMoveClip={isLayerLocked('audio') ? undefined : handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                  disabled={!visibleLayers.includes('audio')}
                />
              </div>
              
              {/* Capa de video/imagen */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 flex items-center text-xs font-medium text-muted-foreground">
                  <span>Video/Image</span>
                  <button 
                    className="ml-2 rounded-full bg-purple-500/20 p-0.5 text-purple-500 hover:bg-purple-500/30"
                    onClick={() => toggleLayerVisibility('video')}
                  >
                    {isLayerLocked('video') ? <Lock size={10} /> : (
                      visibleLayers.includes('video') ? <Eye size={10} /> : <EyeOff size={10} />
                    )}
                  </button>
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LayerType.VIDEO)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={isLayerLocked('video') ? undefined : handleResizeClip}
                  onMoveClip={isLayerLocked('video') ? undefined : handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                  disabled={!visibleLayers.includes('video')}
                />
              </div>
              
              {/* Capa de texto */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 flex items-center text-xs font-medium text-muted-foreground">
                  <span>Text</span>
                  <button 
                    className="ml-2 rounded-full bg-amber-500/20 p-0.5 text-amber-500 hover:bg-amber-500/30"
                    onClick={() => toggleLayerVisibility('text')}
                  >
                    {isLayerLocked('text') ? <Lock size={10} /> : (
                      visibleLayers.includes('text') ? <Eye size={10} /> : <EyeOff size={10} />
                    )}
                  </button>
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LayerType.TEXT)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={isLayerLocked('text') ? undefined : handleResizeClip}
                  onMoveClip={isLayerLocked('text') ? undefined : handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                  disabled={!visibleLayers.includes('text')}
                />
              </div>
              
              {/* Capa de efectos */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 flex items-center text-xs font-medium text-muted-foreground">
                  <span>Effects</span>
                  <button 
                    className="ml-2 rounded-full bg-pink-500/20 p-0.5 text-pink-500 hover:bg-pink-500/30"
                    onClick={() => toggleLayerVisibility('effects')}
                  >
                    {isLayerLocked('effects') ? <Lock size={10} /> : (
                      visibleLayers.includes('effects') ? <Eye size={10} /> : <EyeOff size={10} />
                    )}
                  </button>
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LayerType.EFFECTS)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={isLayerLocked('effects') ? undefined : handleResizeClip}
                  onMoveClip={isLayerLocked('effects') ? undefined : handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                  disabled={!visibleLayers.includes('effects')}
                />
              </div>
              
              {/* Capas personalizadas */}
              {layers.filter(layer => getLayerById(layer.id) && visibleLayers.includes(layer.id)).map(layer => (
                <div 
                  key={layer.id}
                  className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1"
                >
                  <div className="absolute left-2 top-0 flex items-center text-xs font-medium text-muted-foreground">
                    <span>{layer.name}</span>
                    <button 
                      className="ml-2 rounded-full bg-indigo-500/20 p-0.5 text-indigo-500 hover:bg-indigo-500/30"
                      onClick={() => toggleLayerVisibility(layer.id)}
                    >
                      {isLayerLocked(layer.id) ? <Lock size={10} /> : (
                        visibleLayers.includes(layer.id) ? <Eye size={10} /> : <EyeOff size={10} />
                      )}
                    </button>
                  </div>
                  <ClipsLayer
                    clips={clips.filter(clip => clip.layer === layer.id)}
                    selectedClip={selectedClip}
                    timeToPixels={timeToPixels}
                    onSelectClip={handleSelectClip}
                    onResizeClip={isLayerLocked(layer.id) ? undefined : handleResizeClip}
                    onMoveClip={isLayerLocked(layer.id) ? undefined : handleMoveClip}
                    onPreviewClip={handleOpenPreview}
                    height={40}
                    disabled={!visibleLayers.includes(layer.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Diálogo del administrador de capas */}
      <Dialog open={showLayerManager} onOpenChange={setShowLayerManager}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Layer Manager</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Timeline Layers</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Añadir nueva capa
                  const layerId = `layer-${Date.now()}`;
                  const newLayer: LayerConfig = {
                    id: layerId,
                    name: `Layer ${layers.length + 1}`,
                    type: LayerType.VIDEO,
                    visible: true,
                    locked: false,
                    index: layers.length
                  };
                  addLayer(newLayer);
                  
                  // Agregar a capas visibles automáticamente
                  if (!visibleLayers.includes(layerId)) {
                    setVisibleLayers([...visibleLayers, layerId]);
                  }
                }}
              >
                <Plus size={16} className="mr-1" /> Add Layer
              </Button>
            </div>
            
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {layers.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                  No custom layers added yet. Add a layer to get started.
                </div>
              ) : (
                layers.map((layer) => (
                  <div 
                    key={layer.id} 
                    className="flex items-center p-2 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{layer.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{LayerType[layer.type]}</div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => toggleLayerVisibility(layer.id)}
                      >
                        {isLayerLocked(layer.id) ? 
                          <Lock size={14} /> : 
                          (visibleLayers.includes(layer.id) ? <Eye size={14} /> : <EyeOff size={14} />)
                        }
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => toggleLayerLock(layer.id)}
                      >
                        {isLayerLocked(layer.id) ? <Lock size={14} /> : <Unlock size={14} />}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-red-500"
                        onClick={() => {
                          removeLayer(layer.id);
                          // Eliminar de las capas visibles y bloqueadas si existe
                          setVisibleLayers(visibleLayers.filter(id => id !== layer.id));
                          setLockedLayers(lockedLayers.filter(id => id !== layer.id));
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Default Layers</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded-md bg-muted/30">
                  <div className="font-medium text-sm">Audio</div>
                  <div className="text-xs text-muted-foreground">Base layer for audio clips</div>
                </div>
                <div className="p-2 border rounded-md bg-muted/30">
                  <div className="font-medium text-sm">Video/Image</div>
                  <div className="text-xs text-muted-foreground">Base layer for visual media</div>
                </div>
                <div className="p-2 border rounded-md bg-muted/30">
                  <div className="font-medium text-sm">Text</div>
                  <div className="text-xs text-muted-foreground">Titles and captions</div>
                </div>
                <div className="p-2 border rounded-md bg-muted/30">
                  <div className="font-medium text-sm">Effects</div>
                  <div className="text-xs text-muted-foreground">Visual effects and overlays</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de previsualización de imágenes/clips */}
      <Dialog open={!!selectedImagePreview} onOpenChange={(open) => !open && handleClosePreview()}>
        <DialogContent className={expandedPreview ? "max-w-4xl" : "max-w-md"}>
          <DialogHeader>
            <DialogTitle>{selectedImagePreview?.name || "Clip Preview"}</DialogTitle>
          </DialogHeader>
          
          <div className="relative mt-2">
            {selectedImagePreview?.type === 'image' && selectedImagePreview.url && (
              <img 
                src={selectedImagePreview.url} 
                alt={selectedImagePreview.name}
                className="w-full rounded object-contain"
              />
            )}
            {selectedImagePreview?.type === 'video' && selectedImagePreview.url && (
              <video 
                src={selectedImagePreview.url}
                controls
                className="w-full rounded"
              />
            )}
            {selectedImagePreview?.type === 'text' && (
              <div className="flex h-32 w-full items-center justify-center rounded bg-gray-100 p-4 text-center text-xl">
                {selectedImagePreview.content || "Text Content"}
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-2"
              onClick={handleToggleExpandPreview}
            >
              {expandedPreview ? "Shrink" : "Expand"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Herramientas profesionales de edición */}
      
      {/* Panel de vista previa de video */}
      <VideoPreviewPanelComponent 
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onSeek={seekTo}
        selectedClip={selectedClip ? clips.find(c => c.id === selectedClip) : null}
        visible={modules.find(m => m.id === 'preview')?.visible || false}
      />
      
      {/* Control de redimensionamiento de paneles */}
      <ResizeHandleControl 
        modules={modules}
        onResize={(newModules) => setModules(newModules)}
        direction="horizontal"
      />
      
      {/* Biblioteca de medios */}
      <MediaLibraryComponent 
        videos={videoFiles}
        images={imageFiles}
        audio={audioFile}
        onVideoSelect={(file) => {
          if (file) {
            handleAddClip({
              type: 'video',
              start: currentTime,
              duration: 3,
              layer: LAYER_TYPES.VIDEO,
              name: file.name,
              url: URL.createObjectURL(file)
            });
          }
        }}
        onImageSelect={(file) => {
          if (file) {
            handleAddClip({
              type: 'image',
              start: currentTime,
              duration: 2,
              layer: LAYER_TYPES.VIDEO,
              name: file.name,
              url: URL.createObjectURL(file)
            });
          }
        }}
        onAudioSelect={(file) => {
          if (file) {
            handleAddClip({
              type: 'audio',
              start: currentTime,
              duration: 5,
              layer: LAYER_TYPES.AUDIO,
              name: file.name,
              url: URL.createObjectURL(file)
            });
          }
        }}
        visible={modules.find(m => m.id === 'media')?.visible || false}
      />
      
      {/* Configurador de módulos y efectos */}
      <ModuleConfiguratorComponent 
        modules={modules}
        activeEffects={activeEffects}
        onModuleToggle={(moduleId, visible) => {
          setModules(modules.map(m => 
            m.id === moduleId ? {...m, visible} : m
          ));
        }}
        onEffectAdd={(effect) => {
          setActiveEffects([...activeEffects, effect]);
        }}
        onEffectRemove={(effectId) => {
          setActiveEffects(activeEffects.filter(e => e.id !== effectId));
        }}
        visible={showModuleConfig}
        onClose={() => setShowModuleConfig(false)}
      />
    </Card>
  );
}

// Función auxiliar para formatear tiempo en formato mm:ss.ms
function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 10);
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds}`;
}