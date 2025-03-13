import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlayCircle, PauseCircle, ZoomIn, ZoomOut, Plus, Scissors, Trash2, Music, Image, Text, Video } from 'lucide-react';

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

// Importar constantes
import {
  LAYER_TYPES,
  CLIP_COLORS,
  ClipOperation
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
            
            {selectedClip !== null && (
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
              {/* Capa de audio */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 text-xs font-medium text-muted-foreground">
                  Audio
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LAYER_TYPES.AUDIO)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={handleResizeClip}
                  onMoveClip={handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                />
              </div>
              
              {/* Capa de video/imagen */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 text-xs font-medium text-muted-foreground">
                  Video/Image
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LAYER_TYPES.VIDEO)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={handleResizeClip}
                  onMoveClip={handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                />
              </div>
              
              {/* Capa de texto */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 text-xs font-medium text-muted-foreground">
                  Text
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LAYER_TYPES.TEXT)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={handleResizeClip}
                  onMoveClip={handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                />
              </div>
              
              {/* Capa de efectos */}
              <div className="relative h-12 border-b border-gray-800 bg-card/10 px-1 py-1">
                <div className="absolute left-2 top-0 text-xs font-medium text-muted-foreground">
                  Effects
                </div>
                <ClipsLayer
                  clips={clips.filter(clip => clip.layer === LAYER_TYPES.EFFECTS)}
                  selectedClip={selectedClip}
                  timeToPixels={timeToPixels}
                  onSelectClip={handleSelectClip}
                  onResizeClip={handleResizeClip}
                  onMoveClip={handleMoveClip}
                  onPreviewClip={handleOpenPreview}
                  height={40}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      
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