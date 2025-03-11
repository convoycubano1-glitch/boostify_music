import React, { useState, useRef, useEffect } from 'react';
import { VideoLayer } from './video-layer';
import { AudioLayer } from './audio-layer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, SkipBack, SkipForward, 
  Plus, Trash2, Lock, Unlock, Eye, EyeOff,
  Shuffle, FastForward, Music, FilmIcon, ImageIcon, Type as TypeIcon,
  Sparkles, ZoomIn, ZoomOut, Maximize, Minimize
} from 'lucide-react';

// Tipos de datos para el timeline
export interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect';
  start: number;
  end: number;
  layer: number;
  title: string;
  videoUrl?: string;
  audioUrl?: string;
  imageUrl?: string;
  text?: string;
  visible: boolean;
  locked: boolean;
  metadata?: {
    volume?: number;
    speed?: number;
    effect?: string;
    textStyle?: any;
    aiGenerated?: boolean;
    prompt?: string;
  };
}

interface BeatData {
  time: number;
  type: 'downbeat' | 'accent' | 'regular';
  energy: number;
  section?: string;
}

export interface TimelineMulticapaProps {
  initialClips?: TimelineClip[];
  duration?: number;
  onClipAdd?: (clip: TimelineClip) => void;
  onClipUpdate?: (clip: TimelineClip) => void;
  onClipDelete?: (clipId: string) => void;
  onPlaybackChange?: (isPlaying: boolean) => void;
  onPositionChange?: (position: number) => void;
  audioBeats?: BeatData[];
  toolbarVisible?: boolean;
}

export const TimelineMulticapa: React.FC<TimelineMulticapaProps> = ({
  initialClips = [],
  duration = 60,
  onClipAdd,
  onClipUpdate,
  onClipDelete,
  onPlaybackChange,
  onPositionChange,
  audioBeats = [],
  toolbarVisible = true
}) => {
  // Estado para clips
  const [clips, setClips] = useState<TimelineClip[]>(initialClips);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  
  // Estado para la reproducción
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Estado para zoom y vista
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleTimeRange, setVisibleTimeRange] = useState({ start: 0, end: duration });
  
  // Referencias
  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackInterval = useRef<number | null>(null);
  
  // Efecto para manejar clips iniciales
  useEffect(() => {
    setClips(initialClips);
  }, [initialClips]);
  
  // Efecto para manejar reproducción
  useEffect(() => {
    if (isPlaying) {
      if (playbackInterval.current) {
        window.clearInterval(playbackInterval.current);
      }
      
      // Intervalo para reproducción fluida
      playbackInterval.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1; // Avanzar 100ms
          if (next >= duration) {
            // Detener al final
            setIsPlaying(false);
            if (onPlaybackChange) {
              onPlaybackChange(false);
            }
            return 0;
          }
          return next;
        });
      }, 100);
    } else if (playbackInterval.current) {
      window.clearInterval(playbackInterval.current);
      playbackInterval.current = null;
    }
    
    if (onPlaybackChange) {
      onPlaybackChange(isPlaying);
    }
    
    return () => {
      if (playbackInterval.current) {
        window.clearInterval(playbackInterval.current);
      }
    };
  }, [isPlaying, duration, onPlaybackChange]);
  
  // Efecto para notificar cambios de posición
  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(currentTime);
    }
  }, [currentTime, onPositionChange]);
  
  // Manejar reproducción
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Manejar cambios en la posición del timeline
  const handlePositionChange = (value: number[]) => {
    const newPosition = value[0];
    setCurrentTime(newPosition);
  };
  
  // Agregar un nuevo clip
  const handleAddClip = (type: TimelineClip['type'], url: string, title: string) => {
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      type,
      start: currentTime,
      end: currentTime + (type === 'audio' ? 30 : 10), // Duración estimada
      layer: type === 'audio' ? 0 : 1, // Audio en capa 0, video en capa 1
      title,
      visible: true,
      locked: false,
      metadata: {
        volume: 1.0
      }
    };
    
    // Agregar URLs según el tipo
    if (type === 'video') {
      newClip.videoUrl = url;
    } else if (type === 'audio') {
      newClip.audioUrl = url;
    } else if (type === 'image') {
      newClip.imageUrl = url;
    }
    
    const updatedClips = [...clips, newClip];
    setClips(updatedClips);
    
    if (onClipAdd) {
      onClipAdd(newClip);
    }
  };
  
  // Seleccionar un clip
  const handleClipSelect = (clipId: string) => {
    setSelectedClipId(clipId);
  };
  
  // Eliminar un clip
  const handleClipDelete = (clipId: string) => {
    const updatedClips = clips.filter(clip => clip.id !== clipId);
    setClips(updatedClips);
    
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
    
    if (onClipDelete) {
      onClipDelete(clipId);
    }
  };
  
  // Actualizar un clip
  const updateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    const updatedClips = clips.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    );
    
    setClips(updatedClips);
    
    if (onClipUpdate) {
      const updatedClip = updatedClips.find(clip => clip.id === clipId);
      if (updatedClip) {
        onClipUpdate(updatedClip);
      }
    }
  };
  
  // Manejar cambio de volumen
  const handleVolumeChange = (clipId: string, volume: number) => {
    updateClip(clipId, {
      metadata: {
        ...clips.find(clip => clip.id === clipId)?.metadata,
        volume
      }
    });
  };
  
  // Manejar cambio de visibilidad
  const handleVisibilityToggle = (clipId: string, visible: boolean) => {
    updateClip(clipId, { visible });
  };
  
  // Manejar cambio de bloqueo
  const handleLockToggle = (clipId: string, locked: boolean) => {
    updateClip(clipId, { locked });
  };
  
  // Manejar recorte de clip
  const handleClipTrimmed = (clipId: string, start: number, end: number) => {
    updateClip(clipId, { start, end });
  };
  
  // Retroceder 5 segundos
  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    setCurrentTime(newTime);
  };
  
  // Avanzar 5 segundos
  const skipForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    setCurrentTime(newTime);
  };
  
  // Ir al inicio
  const goToStart = () => {
    setCurrentTime(0);
  };
  
  // Ir al final
  const goToEnd = () => {
    setCurrentTime(duration);
  };
  
  // Aumentar zoom
  const zoomIn = () => {
    const newZoom = Math.min(4, zoomLevel * 1.2);
    setZoomLevel(newZoom);
    updateVisibleTimeRange(newZoom);
  };
  
  // Disminuir zoom
  const zoomOut = () => {
    const newZoom = Math.max(0.5, zoomLevel / 1.2);
    setZoomLevel(newZoom);
    updateVisibleTimeRange(newZoom);
  };
  
  // Actualizar rango visible
  const updateVisibleTimeRange = (zoom: number) => {
    const visibleDuration = duration / zoom;
    const center = currentTime;
    const start = Math.max(0, center - visibleDuration / 2);
    const end = Math.min(duration, center + visibleDuration / 2);
    setVisibleTimeRange({ start, end });
  };
  
  // Verificar si hay beats cercanos para sincronización
  const findNearestBeat = (time: number, threshold: number = 0.5): BeatData | null => {
    if (!audioBeats || audioBeats.length === 0) return null;
    
    // Buscar el beat más cercano
    let nearestBeat: BeatData | null = null;
    let minDistance = Infinity;
    
    for (const beat of audioBeats) {
      const distance = Math.abs(beat.time - time);
      if (distance < minDistance && distance <= threshold) {
        minDistance = distance;
        nearestBeat = beat;
      }
    }
    
    return nearestBeat;
  };
  
  // Sincronizar clip con beats cercanos
  const syncClipWithBeats = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const startBeat = findNearestBeat(clip.start);
    const endBeat = findNearestBeat(clip.end);
    
    let updates: Partial<TimelineClip> = {};
    
    if (startBeat) {
      updates.start = startBeat.time;
    }
    
    if (endBeat) {
      updates.end = endBeat.time;
    }
    
    if (Object.keys(updates).length > 0) {
      updateClip(clipId, updates);
    }
  };
  
  // Renderizar las marcas de tiempo
  const renderTimeMarkers = () => {
    const markers = [];
    const timeStep = Math.max(1, Math.floor(duration / 20)); // Ajustar según zoom
    
    for (let i = 0; i <= duration; i += timeStep) {
      markers.push(
        <div 
          key={`marker-${i}`} 
          className="absolute top-0 h-4 border-l border-gray-300 dark:border-gray-700" 
          style={{ left: `${(i / duration) * 100}%` }}
        >
          <span className="absolute -left-2 top-4 text-xs text-gray-500">
            {formatTime(i)}
          </span>
        </div>
      );
    }
    
    return markers;
  };
  
  // Renderizar las marcas de beat
  const renderBeatMarkers = () => {
    if (!audioBeats || audioBeats.length === 0) return null;
    
    return audioBeats.map((beat, index) => (
      <div 
        key={`beat-${index}`} 
        className={`absolute top-8 w-px h-full ${beat.type === 'downbeat' ? 'bg-red-500' : beat.type === 'accent' ? 'bg-yellow-500' : 'bg-blue-500'}`}
        style={{ 
          left: `${(beat.time / duration) * 100}%`,
          opacity: beat.energy * 0.7 + 0.3
        }}
        title={`Beat at ${formatTime(beat.time)}`}
      />
    ));
  };
  
  // Agrupar clips por capas para mejor organización
  const clipsByLayer = clips.reduce<{ [layer: number]: TimelineClip[] }>((acc, clip) => {
    if (!acc[clip.layer]) {
      acc[clip.layer] = [];
    }
    acc[clip.layer].push(clip);
    return acc;
  }, {});
  
  // Renderizar clips de audio
  const renderAudioClips = () => {
    const audioClips = clips.filter(clip => clip.type === 'audio');
    
    return (
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-medium">Pistas de Audio</h3>
        {audioClips.map(clip => (
          <AudioLayer
            key={clip.id}
            id={clip.id}
            title={clip.title}
            audioUrl={clip.audioUrl || ''}
            start={clip.start}
            end={clip.end}
            currentTime={currentTime}
            isPlaying={isPlaying}
            isSelected={selectedClipId === clip.id}
            isLocked={clip.locked}
            isVisible={clip.visible}
            volume={clip.metadata?.volume || 1.0}
            onSelect={handleClipSelect}
            onDelete={handleClipDelete}
            onLockToggle={handleLockToggle}
            onVisibilityToggle={handleVisibilityToggle}
            onVolumeChange={handleVolumeChange}
            onRegionUpdate={handleClipTrimmed}
            onPositionChange={(id: string, position: number) => {
              setCurrentTime(position);
            }}
          />
        ))}
      </div>
    );
  };
  
  // Renderizar clips de video/imagen
  const renderVideoClips = () => {
    const videoClips = clips.filter(clip => clip.type === 'video' || clip.type === 'image');
    
    return (
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-medium">Clips de Video/Imagen</h3>
        <div className="grid grid-cols-2 gap-3">
          {videoClips.map(clip => (
            <VideoLayer
              key={clip.id}
              id={clip.id}
              title={clip.title}
              videoUrl={clip.videoUrl || clip.imageUrl || ''}
              start={clip.start}
              end={clip.end}
              currentTime={currentTime}
              isPlaying={isPlaying}
              isSelected={selectedClipId === clip.id}
              isLocked={clip.locked}
              isVisible={clip.visible}
              volume={clip.metadata?.volume || 1.0}
              onSelect={handleClipSelect}
              onDelete={handleClipDelete}
              onLockToggle={handleLockToggle}
              onVisibilityToggle={handleVisibilityToggle}
              onVolumeChange={handleVolumeChange}
              onClipTrimmed={handleClipTrimmed}
            />
          ))}
        </div>
      </div>
    );
  };
  
  // Formatear tiempo en formato mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Controles de reproducción */}
      {toolbarVisible && (
        <div className="flex items-center justify-between p-2 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={goToStart}
              title="Ir al inicio"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={skipBackward}
              title="Retroceder 5 segundos"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="default" 
              onClick={togglePlayback}
              title={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={skipForward}
              title="Avanzar 5 segundos"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={goToEnd}
              title="Ir al final"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={zoomOut}
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={zoomIn}
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Timeline principal */}
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <div 
            ref={timelineRef}
            className="relative w-full h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
          >
            {/* Marcadores de tiempo */}
            {renderTimeMarkers()}
            
            {/* Marcadores de beats */}
            {renderBeatMarkers()}
            
            {/* Indicador de posición actual */}
            <div 
              className="absolute top-0 h-full w-1 bg-red-500 pointer-events-none z-10"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
            
            {/* Control de posición */}
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.1}
              onValueChange={handlePositionChange}
              className="absolute bottom-0 w-full h-4 z-20"
            />
          </div>
        </div>
        
        {/* Contenido de clips */}
        {renderAudioClips()}
        {renderVideoClips()}
      </div>
      
      {/* Panel lateral de propiedades */}
      {selectedClipId && (
        <div className="w-full md:w-64 border-t md:border-l md:border-t-0 p-3 dark:border-gray-700">
          <h3 className="font-medium mb-3">Propiedades</h3>
          
          {(() => {
            const selectedClip = clips.find(clip => clip.id === selectedClipId);
            if (!selectedClip) return null;
            
            return (
              <div className="space-y-3">
                <div>
                  <Label>Nombre</Label>
                  <div className="font-medium">{selectedClip.title}</div>
                </div>
                
                <div>
                  <Label>Tipo</Label>
                  <div className="font-medium capitalize">{selectedClip.type}</div>
                </div>
                
                <div>
                  <Label>Duración</Label>
                  <div className="font-medium">
                    {formatTime(selectedClip.end - selectedClip.start)}
                  </div>
                </div>
                
                <div>
                  <Label>Inicio</Label>
                  <div className="font-medium">{formatTime(selectedClip.start)}</div>
                </div>
                
                <div>
                  <Label>Fin</Label>
                  <div className="font-medium">{formatTime(selectedClip.end)}</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Visible</Label>
                  <Button 
                    size="icon" 
                    variant={selectedClip.visible ? "default" : "outline"}
                    className="h-8 w-8" 
                    onClick={() => handleVisibilityToggle(selectedClip.id, !selectedClip.visible)}
                  >
                    {selectedClip.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Bloqueado</Label>
                  <Button 
                    size="icon" 
                    variant={selectedClip.locked ? "default" : "outline"}
                    className="h-8 w-8" 
                    onClick={() => handleLockToggle(selectedClip.id, !selectedClip.locked)}
                  >
                    {selectedClip.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                </div>
                
                {(selectedClip.type === 'audio' || selectedClip.type === 'video') && (
                  <div>
                    <Label>Volumen: {((selectedClip.metadata?.volume || 1) * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[selectedClip.metadata?.volume || 1]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={(value) => handleVolumeChange(selectedClip.id, value[0])}
                      disabled={selectedClip.locked}
                    />
                  </div>
                )}
                
                {audioBeats && audioBeats.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => syncClipWithBeats(selectedClip.id)}
                    disabled={selectedClip.locked}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Alinear con Beats
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleClipDelete(selectedClip.id)}
                  disabled={selectedClip.locked}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Clip
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};