/**
 * Editor de línea de tiempo para música
 * Componente principal que integra gestión de capas, clips y reproducción de audio
 * @export TimelineEditor - Componente principal del editor
 * @export TimelineClip - Tipo para los clips de la línea de tiempo
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { 
  Play, Pause, SkipBack, SkipForward, Zoom, ZoomIn, ZoomOut,
  Music, Volume2, Volume1, VolumeX, Layers, Lock, Eye, Trash, 
  Plus, Save, Download, Upload, Share2
} from 'lucide-react';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Slider } from '../../components/ui/slider';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';

import LayerManager from '../timeline/LayerManager';
import { useTimelineLayers, LayerConfig } from '../../hooks/useTimelineLayers';
import { useIsolatedLayers, IsolatedLayerOperation, TimelineClip } from '../../hooks/useIsolatedLayers';
import { 
  LayerType, 
  PIXELS_PER_SECOND, 
  DEFAULT_ZOOM, 
  CLIP_COLORS,
  ClipOperation
} from '../../constants/timeline-constants';

// Metadatos del mapa de beats
export interface BeatMapMetadata {
  bpm: number;
  timeSignature: string;
  key: string;
}

// Mapa de beats para sincronización
export interface BeatMap {
  beats: {
    time: number;
    type: 'downbeat' | 'beat';
  }[];
  sections: {
    startTime: number;
    endTime: number;
    name: string;
  }[];
  metadata: BeatMapMetadata;
}

// Propiedades del editor de línea de tiempo
interface TimelineEditorProps {
  clips?: TimelineClip[];
  beatMap?: BeatMap;
  audioUrl?: string;
  duration?: number;
  className?: string;
  onClipsChange?: (clips: TimelineClip[]) => void;
  onTimeChange?: (time: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  onAddClip?: (clip: Omit<TimelineClip, 'id'>) => void;
  onUpdateClip?: (id: number, updates: Partial<TimelineClip>) => void;
  onDeleteClip?: (id: number) => void;
  showBeatGrid?: boolean;
  readOnly?: boolean;
  autoScroll?: boolean;
  initialTime?: number;
  maxTime?: number;
}

/**
 * Editor de línea de tiempo para música
 * 
 * Componente principal que integra:
 * - Gestión de capas (audio, video, texto, efectos)
 * - Edición de clips con restricciones
 * - Reproducción y visualización de audio
 * - Sincronización con beats
 */
export function TimelineEditor({
  clips: initialClips = [],
  beatMap,
  audioUrl,
  duration = 0,
  className,
  onClipsChange,
  onTimeChange,
  onPlaybackStateChange,
  onAddClip,
  onUpdateClip,
  onDeleteClip,
  showBeatGrid = true,
  readOnly = false,
  autoScroll = true,
  initialTime = 0,
  maxTime = 0
}: TimelineEditorProps) {
  // Estado para clips
  const [clips, setClips] = useState<TimelineClip[]>(initialClips);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [nextClipId, setNextClipId] = useState<number>(
    Math.max(...initialClips.map(c => c.id), 0) + 1
  );
  
  // Estado para reproducción de audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  
  // Estado para UI y navegación
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showAllLayers, setShowAllLayers] = useState(true);
  const [snap, setSnap] = useState(true);
  const [activeOperation, setActiveOperation] = useState<ClipOperation>(ClipOperation.NONE);
  
  // Referencias a elementos DOM
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Hooks personalizados
  const { toast } = useToast();
  const isolatedLayers = useIsolatedLayers();
  
  // Hook para gestión de capas
  const {
    layers,
    visibleLayers,
    lockedLayers,
    selectedLayerId,
    addLayer,
    updateLayer,
    removeLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    selectLayer,
    canAddClipToLayer
  } = useTimelineLayers(clips);

  // Validar cambios en los clips iniciales
  useEffect(() => {
    setClips(initialClips);
    setNextClipId(Math.max(...initialClips.map(c => c.id), 0) + 1);
  }, [JSON.stringify(initialClips)]);

  // Gestionar reproducción de audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      
      if (isPlaying) {
        audioRef.current.play()
          .catch(error => {
            console.error("Error al iniciar reproducción:", error);
            setIsPlaying(false);
          });
      } else {
        audioRef.current.pause();
      }
    }
    
    // Notificar cambios de estado de reproducción
    if (onPlaybackStateChange) {
      onPlaybackStateChange(isPlaying);
    }
  }, [isPlaying, isMuted, volume]);

  // Actualización de tiempo durante reproducción
  useEffect(() => {
    if (isPlaying) {
      const updateTimeFromAudio = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          
          // Avanzar al siguiente frame
          animationFrameRef.current = requestAnimationFrame(updateTimeFromAudio);
        }
      };
      
      // Iniciar bucle de actualización
      animationFrameRef.current = requestAnimationFrame(updateTimeFromAudio);
      
      // Limpiar al desmontar
      return () => {
        cancelAnimationFrame(animationFrameRef.current);
      };
    }
  }, [isPlaying]);

  // Actualizar posición de tiempo
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(currentTime);
    }
    
    // Si está reproduciendo, no hacer nada más (el audio controla el tiempo)
    if (isPlaying) return;
    
    // Si está en pausa, actualizar tiempo manualmente en el audio
    if (audioRef.current) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, onTimeChange]);

  // Notificar cambios en los clips
  useEffect(() => {
    if (onClipsChange) {
      onClipsChange(clips);
    }
  }, [clips, onClipsChange]);

  // Funciones para reproducción
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);
  
  const seekToTime = useCallback((time: number) => {
    const clampedTime = Math.min(Math.max(time, 0), duration);
    setCurrentTime(clampedTime);
    
    if (audioRef.current) {
      audioRef.current.currentTime = clampedTime;
    }
  }, [duration]);
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Funciones para navegación y zoom
  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.2, 5.0));
  }, []);
  
  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  }, []);
  
  const resetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
  }, []);

  // Funciones para gestión de clips
  const addClip = useCallback((clipData: Omit<TimelineClip, 'id'>) => {
    if (readOnly) return;
    
    // Verificar si la capa está bloqueada
    if (lockedLayers[clipData.layer]) {
      toast({
        title: 'Capa bloqueada',
        description: 'No puedes añadir clips a una capa bloqueada',
        variant: 'destructive'
      });
      return;
    }
    
    // Validar operación con restricciones de capas aisladas
    const layerType = layers.find(l => l.id === clipData.layer)?.type;
    const dummyClip = { id: -1, ...clipData };
    
    const validationResult = isolatedLayers.validateClipOperation(
      dummyClip, clips, IsolatedLayerOperation.ADD, layerType
    );
    
    if (!validationResult.isValid) {
      toast({
        title: 'Operación no permitida',
        description: validationResult.message || 'No se puede añadir el clip con la configuración actual',
        variant: 'destructive'
      });
      return;
    }
    
    // Crear nuevo clip
    const newClip: TimelineClip = {
      id: nextClipId,
      ...clipData
    };
    
    setClips(prev => [...prev, newClip]);
    setNextClipId(prev => prev + 1);
    setSelectedClipId(newClip.id);
    
    // Notificar adición
    if (onAddClip) {
      onAddClip(clipData);
    }
    
    return newClip.id;
  }, [
    readOnly, 
    lockedLayers, 
    layers, 
    clips, 
    nextClipId, 
    onAddClip, 
    isolatedLayers,
    toast
  ]);
  
  const updateClip = useCallback((id: number, updates: Partial<TimelineClip>) => {
    if (readOnly) return;
    
    // Buscar el clip a actualizar
    const clipToUpdate = clips.find(c => c.id === id);
    if (!clipToUpdate) return;
    
    // Verificar si la capa está bloqueada
    if (lockedLayers[clipToUpdate.layer]) {
      toast({
        title: 'Capa bloqueada',
        description: 'No puedes modificar clips en una capa bloqueada',
        variant: 'destructive'
      });
      return;
    }
    
    // Si se está cambiando de capa, validar la operación
    if (updates.layer !== undefined && updates.layer !== clipToUpdate.layer) {
      const layerType = layers.find(l => l.id === updates.layer)?.type;
      
      const validationResult = isolatedLayers.validateClipOperation(
        { ...clipToUpdate, ...updates },
        clips.filter(c => c.id !== id),
        IsolatedLayerOperation.MOVE,
        layerType
      );
      
      if (!validationResult.isValid) {
        toast({
          title: 'Operación no permitida',
          description: validationResult.message || 'No se puede mover el clip a la capa seleccionada',
          variant: 'destructive'
        });
        return;
      }
    }
    
    // Si se está cambiando la duración o posición, validar overlap
    if (updates.duration !== undefined || updates.start !== undefined) {
      const updatedClip = { ...clipToUpdate, ...updates };
      
      const validationResult = isolatedLayers.validateClipOperation(
        updatedClip,
        clips.filter(c => c.id !== id),
        IsolatedLayerOperation.RESIZE,
        layers.find(l => l.id === updatedClip.layer)?.type
      );
      
      if (!validationResult.isValid) {
        toast({
          title: 'Operación no permitida',
          description: validationResult.message || 'La nueva duración o posición no es válida',
          variant: 'destructive'
        });
        return;
      }
    }
    
    // Actualizar clip
    setClips(prev => 
      prev.map(clip => clip.id === id ? { ...clip, ...updates } : clip)
    );
    
    // Notificar actualización
    if (onUpdateClip) {
      onUpdateClip(id, updates);
    }
  }, [
    readOnly, 
    lockedLayers, 
    clips, 
    layers, 
    onUpdateClip, 
    isolatedLayers, 
    toast
  ]);
  
  const deleteClip = useCallback((id: number) => {
    if (readOnly) return;
    
    // Buscar el clip a eliminar
    const clipToDelete = clips.find(c => c.id === id);
    if (!clipToDelete) return;
    
    // Verificar si la capa está bloqueada
    if (lockedLayers[clipToDelete.layer]) {
      toast({
        title: 'Capa bloqueada',
        description: 'No puedes eliminar clips de una capa bloqueada',
        variant: 'destructive'
      });
      return;
    }
    
    // Validar operación
    const validationResult = isolatedLayers.validateClipOperation(
      clipToDelete,
      clips,
      IsolatedLayerOperation.DELETE,
      layers.find(l => l.id === clipToDelete.layer)?.type
    );
    
    if (!validationResult.isValid) {
      toast({
        title: 'Operación no permitida',
        description: validationResult.message || 'No se puede eliminar este clip',
        variant: 'destructive'
      });
      return;
    }
    
    // Eliminar clip
    setClips(prev => prev.filter(clip => clip.id !== id));
    
    // Deseleccionar si era el clip seleccionado
    if (selectedClipId === id) {
      setSelectedClipId(null);
    }
    
    // Notificar eliminación
    if (onDeleteClip) {
      onDeleteClip(id);
    }
  }, [
    readOnly, 
    lockedLayers, 
    clips, 
    selectedClipId, 
    layers, 
    onDeleteClip, 
    isolatedLayers,
    toast
  ]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeOperation !== ClipOperation.NONE) return;
    
    // Obtener posición relativa en el timeline
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Convertir a tiempo
    const clickTime = (clickX / (PIXELS_PER_SECOND * zoom));
    
    // Actualizar tiempo actual
    seekToTime(clickTime);
  }, [activeOperation, zoom, seekToTime]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Atajos de teclado
    switch (e.key) {
      case ' ': // Espacio para reproducir/pausar
        togglePlay();
        e.preventDefault();
        break;
      case 'Delete': // Eliminar clip seleccionado
        if (selectedClipId !== null) {
          deleteClip(selectedClipId);
        }
        break;
      case 'Escape': // Cancelar operación y deseleccionar
        setActiveOperation(ClipOperation.NONE);
        setSelectedClipId(null);
        break;
      case '+': // Zoom in
        zoomIn();
        break;
      case '-': // Zoom out
        zoomOut();
        break;
      case '0': // Reset zoom
        resetZoom();
        break;
    }
  }, [togglePlay, selectedClipId, deleteClip, zoomIn, zoomOut, resetZoom]);

  // Clases dinámicas
  const timelineClasses = cn(
    'timeline-editor',
    'relative',
    'flex flex-col',
    'border rounded-md',
    'h-full overflow-hidden',
    className
  );
  
  // Calcular dimensiones del timeline
  const timelineDuration = maxTime > 0 ? maxTime : Math.max(duration, 
    clips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0)
  );
  
  const timelineWidth = timelineDuration * PIXELS_PER_SECOND * zoom;

  return (
    <div 
      className={timelineClasses}
      onKeyDown={handleKeyDown} 
      tabIndex={0}
    >
      {/* Audio player oculto */}
      <audio 
        ref={audioRef}
        src={audioUrl} 
        preload="auto" 
        loop={false}
        style={{ display: 'none' }}
      />
      
      {/* Barra de herramientas */}
      <div className="timeline-toolbar flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          {/* Controles de reproducción */}
          <Button 
            size="icon" 
            variant="outline" 
            onClick={stop}
            title="Detener"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant={isPlaying ? "secondary" : "outline"}
            onClick={togglePlay}
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          {/* Tiempo actual */}
          <div className="time-display bg-background px-2 py-1 rounded text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Control de volumen */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={toggleMute}
            title={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : volume > 0.5 ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <Volume1 className="h-4 w-4" />
            )}
          </Button>
          
          <Slider
            className="w-24"
            min={0}
            max={1}
            step={0.01}
            value={[volume]}
            onValueChange={([val]) => setVolume(val)}
            aria-label="Volumen"
          />
          
          {/* Controles de zoom */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={zoomOut}
            title="Reducir zoom"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={resetZoom}
            title="Restablecer zoom"
          >
            <Zoom className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={zoomIn}
            title="Aumentar zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          {/* Opciones adicionales */}
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setSnap(!snap)}
          >
            <Badge variant={snap ? "default" : "outline"}>Ajustar</Badge>
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowAllLayers(!showAllLayers)}
          >
            <Badge variant={showAllLayers ? "default" : "outline"}>Todas las capas</Badge>
          </Button>
        </div>
      </div>
      
      {/* Área principal */}
      <div className="timeline-content flex h-full">
        {/* Panel lateral de capas */}
        <div className="layers-panel w-64 border-r p-2 overflow-y-auto">
          <LayerManager
            layers={layers}
            clips={clips}
            visibleLayers={visibleLayers}
            lockedLayers={lockedLayers}
            selectedLayerId={selectedLayerId}
            onAddLayer={addLayer}
            onRemoveLayer={removeLayer}
            onUpdateLayer={updateLayer}
            onToggleLayerVisibility={toggleLayerVisibility}
            onToggleLayerLock={toggleLayerLock}
            onSelectLayer={selectLayer}
          />
        </div>
        
        {/* Panel principal de timeline */}
        <div className="timeline-panel flex-1 overflow-hidden">
          {/* Regla temporal */}
          <div className="time-ruler h-8 border-b relative bg-background/50 overflow-hidden">
            <div 
              className="ruler-marks absolute top-0 left-0 h-full"
              style={{ width: `${timelineWidth}px` }}
            >
              {/* Marcas temporales */}
              {Array.from({ length: Math.ceil(timelineDuration) + 1 }).map((_, i) => (
                <div 
                  key={`mark-${i}`}
                  className="time-mark absolute top-0 h-full border-l text-xs"
                  style={{ 
                    left: `${i * PIXELS_PER_SECOND * zoom}px`,
                    borderColor: i % 5 === 0 ? 'currentColor' : 'var(--border)'
                  }}
                >
                  {i % 5 === 0 && (
                    <span className="absolute top-1 left-1">{formatTime(i)}</span>
                  )}
                </div>
              ))}
              
              {/* Marcas de beats (si está habilitado) */}
              {showBeatGrid && beatMap && beatMap.beats.map((beat, i) => (
                <div 
                  key={`beat-${i}`}
                  className={cn(
                    "beat-mark absolute top-0 h-full border-l border-dashed",
                    beat.type === 'downbeat' ? 'border-primary/60' : 'border-primary/30'
                  )}
                  style={{ 
                    left: `${beat.time * PIXELS_PER_SECOND * zoom}px`,
                  }}
                />
              ))}
              
              {/* Marcador de posición actual */}
              <div 
                className="playhead absolute top-0 h-full w-px bg-destructive z-10"
                style={{ left: `${currentTime * PIXELS_PER_SECOND * zoom}px` }}
              >
                <div className="w-3 h-3 bg-destructive absolute -left-1.5 -top-1.5 rounded-full" />
              </div>
            </div>
          </div>
          
          {/* Área de clips */}
          <ScrollArea 
            className="timeline-scroll-area h-[calc(100%-2rem)]"
            scrollHideDelay={100}
          >
            <div 
              ref={timelineRef}
              className="timeline-tracks relative"
              style={{ 
                width: `${timelineWidth}px`,
                minHeight: `${layers.reduce((h, layer) => h + (layer.height || 50), 0)}px` 
              }}
              onClick={handleTimelineClick}
            >
              {/* Fondo de las secciones (si está habilitado) */}
              {showBeatGrid && beatMap && beatMap.sections.map((section, i) => (
                <div 
                  key={`section-${i}`}
                  className="section-marker absolute top-0 h-full bg-primary/5 border-l border-r border-primary/20"
                  style={{ 
                    left: `${section.startTime * PIXELS_PER_SECOND * zoom}px`,
                    width: `${(section.endTime - section.startTime) * PIXELS_PER_SECOND * zoom}px`
                  }}
                >
                  <div className="text-xs text-muted-foreground absolute top-0 left-1">
                    {section.name}
                  </div>
                </div>
              ))}
              
              {/* Lineas horizontales de capas */}
              {layers.map((layer, i) => (
                <div 
                  key={`layer-${layer.id}`}
                  className={cn(
                    "layer-track relative border-b",
                    !visibleLayers[layer.id] && "opacity-30"
                  )}
                  style={{ 
                    height: `${layer.height || 50}px`,
                    top: `${layers.slice(0, i).reduce((h, l) => h + (l.height || 50), 0)}px`
                  }}
                >
                  {/* Fondo de la capa */}
                  <div 
                    className="layer-background absolute inset-0 z-0"
                    style={{ 
                      backgroundColor: `${layer.color}10`,
                      borderLeft: `4px solid ${layer.color}`
                    }}
                  />
                  
                  {/* Clips de esta capa */}
                  {clips
                    .filter(clip => clip.layer === layer.id)
                    .map(clip => (
                      <div 
                        key={`clip-${clip.id}`}
                        className={cn(
                          "clip absolute rounded border-2 flex items-center justify-center overflow-hidden",
                          "cursor-pointer select-none shadow-sm",
                          selectedClipId === clip.id && "ring-2 ring-ring ring-offset-1",
                          lockedLayers[layer.id] && "opacity-50 cursor-not-allowed"
                        )}
                        style={{ 
                          left: `${clip.start * PIXELS_PER_SECOND * zoom}px`,
                          width: `${clip.duration * PIXELS_PER_SECOND * zoom}px`,
                          top: '4px',
                          height: 'calc(100% - 8px)',
                          backgroundColor: CLIP_COLORS[layer.type]?.background || '#e0e0e0',
                          borderColor: CLIP_COLORS[layer.type]?.border || '#c0c0c0',
                          color: CLIP_COLORS[layer.type]?.text || '#333333',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          seekToTime(clip.start);
                        }}
                      >
                        {/* Contenido del clip (diferente según el tipo) */}
                        <div className="clip-content text-xs font-medium px-1 truncate w-full text-center">
                          {clip.title}
                        </div>
                        
                        {/* Iconos de metadatos del clip */}
                        {clip.metadata && (
                          <div className="absolute right-1 top-1 flex space-x-1">
                            {clip.metadata.movementApplied && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" title="Movimiento aplicado" />
                            )}
                            {clip.metadata.faceSwapApplied && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full" title="Face swap aplicado" />
                            )}
                            {clip.metadata.musicianIntegrated && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" title="Músico integrado" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ))}
              
              {/* Marcador de posición actual (línea vertical) */}
              <div 
                className="playhead-line absolute top-0 h-full w-px bg-destructive z-20"
                style={{ left: `${currentTime * PIXELS_PER_SECOND * zoom}px` }}
              />
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* Panel de propiedades (para clip seleccionado) */}
      {selectedClipId !== null && (
        <div className="properties-panel border-t p-3 bg-muted/20">
          <h3 className="text-sm font-medium mb-2">Propiedades del clip</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Datos del clip */}
            <div className="space-y-2">
              {/* Título */}
              <div className="grid grid-cols-4 items-center">
                <Label htmlFor="clip-title" className="text-xs">Título:</Label>
                <Input 
                  id="clip-title"
                  className="col-span-3 h-7"
                  value={clips.find(c => c.id === selectedClipId)?.title || ''}
                  onChange={(e) => updateClip(selectedClipId, { title: e.target.value })}
                  disabled={readOnly}
                />
              </div>
              
              {/* Tipo */}
              <div className="grid grid-cols-4 items-center">
                <Label className="text-xs">Tipo:</Label>
                <span className="col-span-3 text-sm">
                  {clips.find(c => c.id === selectedClipId)?.type}
                </span>
              </div>
              
              {/* Capa */}
              <div className="grid grid-cols-4 items-center">
                <Label className="text-xs">Capa:</Label>
                <span className="col-span-3 text-sm">
                  {layers.find(l => 
                    l.id === clips.find(c => c.id === selectedClipId)?.layer
                  )?.name}
                </span>
              </div>
            </div>
            
            {/* Posición y tiempo */}
            <div className="space-y-2">
              {/* Inicio */}
              <div className="grid grid-cols-4 items-center">
                <Label htmlFor="clip-start" className="text-xs">Inicio:</Label>
                <Input 
                  id="clip-start"
                  className="col-span-3 h-7"
                  type="number"
                  min={0}
                  max={timelineDuration - (clips.find(c => c.id === selectedClipId)?.duration || 0)}
                  step={0.1}
                  value={clips.find(c => c.id === selectedClipId)?.start.toFixed(1) || '0.0'}
                  onChange={(e) => updateClip(selectedClipId, { start: parseFloat(e.target.value) })}
                  disabled={readOnly}
                />
              </div>
              
              {/* Duración */}
              <div className="grid grid-cols-4 items-center">
                <Label htmlFor="clip-duration" className="text-xs">Duración:</Label>
                <Input 
                  id="clip-duration"
                  className="col-span-3 h-7"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={clips.find(c => c.id === selectedClipId)?.duration.toFixed(1) || '0.0'}
                  onChange={(e) => updateClip(selectedClipId, { duration: parseFloat(e.target.value) })}
                  disabled={readOnly}
                />
              </div>
              
              {/* Acciones */}
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteClip(selectedClipId)}
                  disabled={readOnly}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Función auxiliar para formatear tiempo en formato MM:SS.MS
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

// Exportar los elementos necesarios para los otros componentes
export { TimelineClip };