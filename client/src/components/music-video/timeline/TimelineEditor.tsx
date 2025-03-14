/**
 * Componente para la edición profesional de la línea de tiempo de videos musicales
 * Implementa todas las restricciones y validaciones necesarias
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { Slider } from '../../ui/slider';
import { Input } from '../../ui/input';
import { Play, Pause, Plus, Trash2, AlignJustify, Image, Music, Type, Wand2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { WaveformTimeline } from './WaveformTimeline';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Label } from '../../ui/label';
import { useToast } from '../../../hooks/use-toast';
import { TimelineClip, LayerConfig } from '../../../interfaces/timeline';
import { LayerType, LAYER_PROPERTIES, MAX_CLIP_DURATION, MIN_CLIP_DURATION } from '../../../constants/timeline-constants';
import { hasValidDuration, clipsCollide, findClipCollisions, isInCorrectLayer, isAIGeneratedImage } from './TimelineConstraints';

interface TimelineEditorProps {
  clips: TimelineClip[];
  duration: number;
  onClipsChange: (updatedClips: TimelineClip[]) => void;
  onTimeChange: (time: number) => void;
  onPlaybackStateChange: (isPlaying: boolean) => void;
  showBeatGrid?: boolean;
  autoScroll?: boolean;
  audioTrack?: string;
}

/**
 * Editor de línea de tiempo profesional para videos musicales
 */
export function TimelineEditor({
  clips,
  duration,
  onClipsChange,
  onTimeChange,
  onPlaybackStateChange,
  showBeatGrid = false,
  autoScroll = true,
  audioTrack
}: TimelineEditorProps) {
  // Estados para reproducción y posición del tiempo
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Estado para capas visibles y seleccionadas
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: LayerType.AUDIO, name: LAYER_PROPERTIES[LayerType.AUDIO].name, type: LayerType.AUDIO, locked: false, visible: true, height: LAYER_PROPERTIES[LayerType.AUDIO].height, color: LAYER_PROPERTIES[LayerType.AUDIO].color },
    { id: LayerType.VIDEO_IMAGE, name: LAYER_PROPERTIES[LayerType.VIDEO_IMAGE].name, type: LayerType.VIDEO_IMAGE, locked: false, visible: true, height: LAYER_PROPERTIES[LayerType.VIDEO_IMAGE].height, color: LAYER_PROPERTIES[LayerType.VIDEO_IMAGE].color },
    { id: LayerType.TEXT, name: LAYER_PROPERTIES[LayerType.TEXT].name, type: LayerType.TEXT, locked: false, visible: true, height: LAYER_PROPERTIES[LayerType.TEXT].height, color: LAYER_PROPERTIES[LayerType.TEXT].color },
    { id: LayerType.EFFECTS, name: LAYER_PROPERTIES[LayerType.EFFECTS].name, type: LayerType.EFFECTS, locked: false, visible: true, height: LAYER_PROPERTIES[LayerType.EFFECTS].height, color: LAYER_PROPERTIES[LayerType.EFFECTS].color },
    { id: LayerType.AI_GENERATED, name: LAYER_PROPERTIES[LayerType.AI_GENERATED].name, type: LayerType.AI_GENERATED, locked: false, visible: true, height: LAYER_PROPERTIES[LayerType.AI_GENERATED].height, color: LAYER_PROPERTIES[LayerType.AI_GENERATED].color }
  ]);
  
  // Estados para selección y edición de clips
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClipType, setNewClipType] = useState<'audio' | 'video' | 'image' | 'text' | 'effect'>('image');
  const [newClipLayer, setNewClipLayer] = useState<number>(LayerType.VIDEO_IMAGE);
  const [draggedClip, setDraggedClip] = useState<{ id: number, offsetX: number } | null>(null);
  
  // Referencias
  const timelineRef = useRef<HTMLDivElement>(null);
  const playTimerRef = useRef<number | null>(null);
  
  // Toast para notificaciones
  const { toast } = useToast();
  
  // Manejar cambios en el tiempo actual
  useEffect(() => {
    setCurrentTime(prevTime => {
      // Solo actualizar si hay un cambio significativo
      if (Math.abs(prevTime - currentTime) > 0.01) {
        return currentTime;
      }
      return prevTime;
    });
  }, [currentTime]);
  
  // Manejar la reproducción
  useEffect(() => {
    if (isPlaying) {
      const startTime = performance.now();
      const startPosition = currentTime;
      
      const updatePlayback = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const newTime = Math.min(duration, startPosition + elapsed);
        
        setCurrentTime(newTime);
        onTimeChange(newTime);
        
        if (newTime < duration) {
          playTimerRef.current = requestAnimationFrame(updatePlayback);
        } else {
          setIsPlaying(false);
          onPlaybackStateChange(false);
        }
      };
      
      playTimerRef.current = requestAnimationFrame(updatePlayback);
    } else if (playTimerRef.current) {
      cancelAnimationFrame(playTimerRef.current);
      playTimerRef.current = null;
    }
    
    return () => {
      if (playTimerRef.current) {
        cancelAnimationFrame(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, currentTime, duration, onTimeChange, onPlaybackStateChange]);
  
  // Función para alternar entre reproducción y pausa
  const togglePlayback = useCallback(() => {
    setIsPlaying(playing => !playing);
    onPlaybackStateChange(!isPlaying);
  }, [isPlaying, onPlaybackStateChange]);
  
  // Función para añadir un nuevo clip
  const addNewClip = useCallback((type: 'audio' | 'video' | 'image' | 'text' | 'effect', layerId: number) => {
    // Determinar la capa correcta basada en el tipo
    let targetLayer = layerId;
    
    // Validar que el tipo de clip sea compatible con la capa seleccionada
    switch (type) {
      case 'audio':
        targetLayer = LayerType.AUDIO;
        break;
      case 'video':
      case 'image':
        // Si no es capa de AI generada, usar VIDEO_IMAGE
        if (targetLayer !== LayerType.AI_GENERATED) {
          targetLayer = LayerType.VIDEO_IMAGE;
        }
        break;
      case 'text':
        targetLayer = LayerType.TEXT;
        break;
      case 'effect':
        targetLayer = LayerType.EFFECTS;
        break;
    }
    
    // Buscar un espacio adecuado en la capa para el nuevo clip
    const clipsInLayer = clips.filter(clip => clip.layer === targetLayer);
    let startPosition = 0;
    
    // Si hay clips en la capa, encontrar un espacio libre
    if (clipsInLayer.length > 0) {
      // Ordenar clips por posición inicial
      const sortedClips = [...clipsInLayer].sort((a, b) => a.start - b.start);
      
      // Buscar espacio entre clips o después del último
      let foundSpace = false;
      
      // Verificar espacio al inicio
      if (sortedClips[0].start >= MAX_CLIP_DURATION) {
        startPosition = 0;
        foundSpace = true;
      }
      
      // Verificar espacios entre clips
      if (!foundSpace) {
        for (let i = 0; i < sortedClips.length - 1; i++) {
          const endOfCurrent = sortedClips[i].start + sortedClips[i].duration;
          const startOfNext = sortedClips[i + 1].start;
          
          if (startOfNext - endOfCurrent >= MAX_CLIP_DURATION) {
            startPosition = endOfCurrent;
            foundSpace = true;
            break;
          }
        }
      }
      
      // Si no hay espacios, colocar después del último clip
      if (!foundSpace) {
        const lastClip = sortedClips[sortedClips.length - 1];
        startPosition = lastClip.start + lastClip.duration;
      }
    }
    
    // Crear nuevo clip con valores por defecto según el tipo
    const newClip: TimelineClip = {
      id: Date.now(), // ID único basado en timestamp
      type,
      layer: targetLayer,
      start: startPosition,
      duration: type === 'text' ? 2 : MAX_CLIP_DURATION, // Duración más corta para textos
      title: `Nuevo ${type === 'audio' ? 'Audio' : 
              type === 'video' ? 'Video' : 
              type === 'image' ? 'Imagen' : 
              type === 'text' ? 'Texto' : 'Efecto'}`,
      visible: true,
      locked: false,
      
      // Propiedades específicas por tipo
      ...(type === 'audio' && { audioUrl: '' }),
      ...(type === 'video' && { videoUrl: '' }),
      ...(type === 'image' && { imageUrl: '' }),
      ...(type === 'text' && { textContent: 'Texto de ejemplo' }),
      
      // Si es imagen generada por IA, marcarla como tal
      ...(type === 'image' && targetLayer === LayerType.AI_GENERATED && { generatedImage: true }),
      
      createdAt: new Date()
    };
    
    // Actualizar los clips y cerrar el diálogo
    onClipsChange([...clips, newClip]);
    setDialogOpen(false);
    
    // Mostrar toast de confirmación
    toast({
      title: "Elemento añadido",
      description: `Se ha añadido un nuevo elemento de tipo ${type} a la línea de tiempo.`,
      variant: "default"
    });
    
    // Seleccionar el clip recién creado
    setSelectedClipId(newClip.id);
  }, [clips, onClipsChange, toast]);
  
  // Función para eliminar un clip
  const deleteClip = useCallback((id: number) => {
    onClipsChange(clips.filter(clip => clip.id !== id));
    
    if (selectedClipId === id) {
      setSelectedClipId(null);
    }
    
    toast({
      title: "Elemento eliminado",
      description: "Se ha eliminado el elemento seleccionado de la línea de tiempo.",
      variant: "destructive"
    });
  }, [clips, onClipsChange, selectedClipId, toast]);
  
  // Función para actualizar un clip existente
  const updateClip = useCallback((id: number, updates: Partial<TimelineClip>) => {
    const updatedClips = clips.map(clip => 
      clip.id === id ? { ...clip, ...updates } : clip
    );
    
    onClipsChange(updatedClips);
  }, [clips, onClipsChange]);
  
  // Manejar la selección de un clip
  const handleClipSelect = (id: number) => {
    setSelectedClipId(id === selectedClipId ? null : id);
  };
  
  // Convertir tiempo a píxeles para la visualización
  const timeToPixels = (time: number) => time * 100 * zoom;
  
  // Formatear tiempo en formato mm:ss.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
  };
  
  // Aplicar todas las restricciones cada vez que cambian los clips
  useEffect(() => {
    // Validar que los clips cumplen con las restricciones
    let hasViolations = false;
    
    for (const clip of clips) {
      // Verificar que la duración no exceda el máximo
      if (clip.duration > MAX_CLIP_DURATION) {
        hasViolations = true;
        console.warn(`Clip ${clip.id} excede la duración máxima permitida`);
      }
      
      // Verificar que el tipo de clip es adecuado para su capa
      if (!isInCorrectLayer(clip)) {
        hasViolations = true;
        console.warn(`Clip ${clip.id} está en una capa incorrecta para su tipo ${clip.type}`);
      }
      
      // Verificar colisiones con otros clips
      const collisions = findClipCollisions(clip, clips);
      if (collisions.length > 0) {
        hasViolations = true;
        console.warn(`Clip ${clip.id} colisiona con otros clips en la misma capa`);
      }
    }
    
    if (hasViolations) {
      toast({
        title: "Advertencia de línea de tiempo",
        description: "Algunos clips no cumplen con las restricciones establecidas.",
        variant: "destructive"
      });
    }
  }, [clips, toast]);
  
  // Renderizar marcas de tiempo (regla) en la parte superior
  const renderTimeMarkers = () => {
    const markers = [];
    const step = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 1 : 0.5;
    
    for (let t = 0; t <= Math.ceil(duration); t += step) {
      const position = timeToPixels(t);
      
      markers.push(
        <div 
          key={`marker-${t}`}
          className="absolute top-0 h-5 border-l border-gray-500"
          style={{ left: `${position}px` }}
        >
          <span className="absolute -left-3 text-xs text-gray-400">
            {formatTime(t)}
          </span>
        </div>
      );
    }
    
    return markers;
  };
  
  // Renderizar la línea de playhead (posición actual)
  const renderPlayhead = () => {
    const position = timeToPixels(currentTime);
    
    return (
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
        style={{ left: `${position}px` }}
      >
        <div className="absolute -top-6 -left-8 bg-gray-900 px-1 py-0.5 rounded text-xs text-white whitespace-nowrap">
          {formatTime(currentTime)}
        </div>
      </div>
    );
  };
  
  // Renderizar capas y clips en cada capa
  const renderLayers = () => {
    return layers.map(layer => (
      <div 
        key={`layer-${layer.id}`}
        className={cn(
          "relative border-t border-gray-800 mb-1",
          layer.locked && "opacity-70",
          !layer.visible && "opacity-30"
        )}
        style={{ height: `${layer.height}px` }}
      >
        {/* Etiqueta de la capa */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gray-800 flex items-center px-2 z-10">
          <div 
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: layer.color }}
          />
          <span className="text-sm font-medium truncate">{layer.name}</span>
        </div>
        
        {/* Contenido de la capa (clips) */}
        <div className="absolute left-32 right-0 top-0 bottom-0">
          {clips
            .filter(clip => clip.layer === layer.id && layer.visible)
            .map(clip => (
              <div
                key={`clip-${clip.id}`}
                className={cn(
                  "absolute top-1 bottom-1 rounded px-2 py-1 cursor-pointer border-2 flex items-center overflow-hidden",
                  selectedClipId === clip.id ? "border-white" : "border-transparent",
                  clip.locked && "opacity-60 cursor-not-allowed"
                )}
                style={{
                  left: `${timeToPixels(clip.start)}px`,
                  width: `${timeToPixels(clip.duration)}px`,
                  backgroundColor: clip.type === 'audio' ? LAYER_PROPERTIES[LayerType.AUDIO].color :
                                  clip.type === 'video' ? LAYER_PROPERTIES[LayerType.VIDEO_IMAGE].color :
                                  clip.type === 'image' && clip.layer === LayerType.AI_GENERATED ? LAYER_PROPERTIES[LayerType.AI_GENERATED].color :
                                  clip.type === 'image' ? LAYER_PROPERTIES[LayerType.VIDEO_IMAGE].color :
                                  clip.type === 'text' ? LAYER_PROPERTIES[LayerType.TEXT].color :
                                  LAYER_PROPERTIES[LayerType.EFFECTS].color
                }}
                onClick={() => handleClipSelect(clip.id)}
              >
                {/* Icono según el tipo de clip */}
                <span className="mr-1">
                  {clip.type === 'audio' && <Music className="h-4 w-4" />}
                  {clip.type === 'video' && <Play className="h-4 w-4" />}
                  {clip.type === 'image' && <Image className="h-4 w-4" />}
                  {clip.type === 'text' && <Type className="h-4 w-4" />}
                  {clip.type === 'effect' && <Wand2 className="h-4 w-4" />}
                </span>
                
                {/* Título del clip */}
                <span className="text-xs truncate">
                  {clip.title}
                </span>
              </div>
            ))
          }
        </div>
      </div>
    ));
  };
  
  return (
    <Card className="w-full h-full bg-gray-900 text-white overflow-hidden border-gray-800">
      <CardContent className="p-0 flex flex-col h-full">
        {/* Barra de herramientas superior */}
        <div className="flex items-center justify-between p-2 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            {/* Control de reproducción */}
            <Button
              size="sm"
              variant={isPlaying ? "destructive" : "default"}
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              {isPlaying ? "Pausar" : "Reproducir"}
            </Button>
            
            {/* Tiempo actual / duración */}
            <div className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Control de zoom */}
            <div className="flex items-center space-x-2">
              <span className="text-sm">Zoom:</span>
              <Slider
                className="w-32"
                min={0.5}
                max={5}
                step={0.5}
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
              />
              <span className="text-sm">{zoom.toFixed(1)}x</span>
            </div>
            
            {/* Botón para añadir nuevo clip */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir Clip
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-gray-700">
                <DialogHeader>
                  <DialogTitle>Añadir nuevo elemento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="clip-type">Tipo de elemento</Label>
                    <Select 
                      value={newClipType} 
                      onValueChange={(value: any) => setNewClipType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Imagen</SelectItem>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="effect">Efecto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Solo mostrar selección de capa para imágenes (puede ser normal o generada) */}
                  {newClipType === 'image' && (
                    <div className="grid gap-2">
                      <Label htmlFor="clip-layer">Capa</Label>
                      <Select 
                        value={String(newClipLayer)} 
                        onValueChange={(value) => setNewClipLayer(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar capa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={String(LayerType.VIDEO_IMAGE)}>Video e Imagen</SelectItem>
                          <SelectItem value={String(LayerType.AI_GENERATED)}>Imagen Generada IA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => addNewClip(newClipType, newClipLayer)}>Añadir</Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Botón para eliminar clip seleccionado */}
            <Button 
              variant="destructive" 
              size="sm"
              disabled={selectedClipId === null}
              onClick={() => selectedClipId && deleteClip(selectedClipId)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          </div>
        </div>
        
        {/* Panel de forma de onda (WaveformTimeline) */}
        {audioTrack && (
          <div className="h-64 border-b border-gray-800">
            <WaveformTimeline
              audioUrl={audioTrack}
              duration={duration}
              currentTime={currentTime}
              clips={clips}
              onClipUpdate={updateClip}
              onTimeUpdate={setCurrentTime}
              isPlaying={isPlaying}
              onPlayPause={togglePlayback}
            />
          </div>
        )}
        
        {/* Área principal del timeline */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div 
              ref={timelineRef}
              className="relative"
              style={{ 
                width: `${timeToPixels(duration) + 100}px`, 
                minHeight: `${layers.length * 80 + 30}px`
              }}
            >
              {/* Regla de tiempo */}
              <div className="h-8 border-b border-gray-800 pl-32 relative">
                {renderTimeMarkers()}
              </div>
              
              {/* Línea que muestra la posición actual */}
              {renderPlayhead()}
              
              {/* Capas del timeline */}
              <div className="relative">
                {renderLayers()}
              </div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}