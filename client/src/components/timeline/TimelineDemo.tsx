import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { TimelineClip as ITimelineClip } from '../../components/music-video/timeline-editor';
import TimelineClip from './TimelineClip';
import LayerManager from './LayerManager';
import { useTimelineLayers, LayerType } from '../../hooks/useTimelineLayers';
import { Button } from '../../components/ui/button';
import { Slider } from '../../components/ui/slider';
import { Label } from '../../components/ui/label';
import { Wand2, Plus, Play, Pause, SkipBack } from 'lucide-react';
import { Progress } from '../../components/ui/progress';

/**
 * Demostración del sistema de timeline con capas aisladas y placeholders
 * 
 * Este componente muestra un timeline funcional con:
 * - Soporte completo para capas aisladas (capa de audio)
 * - Gestión de placeholders para generación AI
 * - Limitación de duración (máximo 5 segundos para clips AI)
 * - Integración con el panel de capas
 */
export function TimelineDemo() {
  // Estado para clips del timeline
  const [clips, setClips] = useState<ITimelineClip[]>([
    {
      id: 1,
      start: 0,
      duration: 10,
      type: 'audio',
      layer: 0, // Capa de audio (aislada)
      title: 'Pista de Audio',
      isIsolated: true, // Audio aislado
      locked: true, // Audio bloqueado
      visible: true
    },
    {
      id: 2,
      start: 0,
      duration: 3,
      type: 'image',
      layer: 1, // Capa de imagen
      title: 'Imagen de Intro',
      visible: true,
      locked: false,
      imageUrl: 'https://example.com/image.jpg'
    },
    {
      id: 3,
      start: 3,
      duration: 2,
      type: 'image',
      layer: 1, // Capa de imagen
      title: 'Placeholder AI',
      isPlaceholder: true, // Marcado como placeholder
      pendingGeneration: true, // Pendiente de generación
      placeholderType: 'image',
      generationPrompt: 'Imagen artística del artista en estudio',
      visible: true,
      locked: false
    },
    {
      id: 4,
      start: 5,
      duration: 5, // Duración exacta de 5 segundos (máximo permitido)
      type: 'video',
      layer: 1, // Capa de video
      title: 'Video con restricción',
      maxDuration: 5, // Restricción de duración máxima
      visible: true,
      locked: false,
      videoUrl: 'https://example.com/video.mp4'
    },
    {
      id: 5,
      start: 2,
      duration: 4,
      type: 'text',
      layer: 2, // Capa de texto
      title: 'Título principal',
      visible: true,
      locked: false,
      metadata: {
        textContent: 'Título del Video Musical'
      }
    },
    {
      id: 6,
      start: 7,
      duration: 3,
      type: 'effect',
      layer: 3, // Capa de efectos
      title: 'Efecto visual',
      visible: true,
      locked: false,
      effectType: 'glow',
      effectIntensity: 0.7
    }
  ]);
  
  // Estados para la reproducción
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(100); // Píxeles por segundo
  const totalDuration = 15; // Duración total en segundos
  
  // Usar nuestro hook personalizado para gestión de capas
  const { 
    layers,
    visibleLayers,
    lockedLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    addLayer,
    resetLayers
  } = useTimelineLayers({
    onLayerChange: (layers) => {
      console.log('Capas actualizadas:', layers);
    }
  });
  
  // Manejador para actualizar un clip
  const handleClipUpdate = (clipId: number, updates: Partial<ITimelineClip>) => {
    setClips(prev => 
      prev.map(clip => 
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    );
  };
  
  // Manejador para mover el inicio de un clip
  const handleMoveClipStart = (clipId: number, delta: number) => {
    setClips(prev => 
      prev.map(clip => {
        if (clip.id === clipId) {
          const newStart = Math.max(0, clip.start + delta);
          const newDuration = Math.max(0.5, clip.duration - delta);
          
          // No permitir exceder maxDuration
          if (clip.maxDuration && newDuration > clip.maxDuration) {
            return clip;
          }
          
          return {
            ...clip,
            start: newStart,
            duration: newDuration
          };
        }
        return clip;
      })
    );
  };
  
  // Manejador para mover el final de un clip
  const handleMoveClipEnd = (clipId: number, delta: number) => {
    setClips(prev => 
      prev.map(clip => {
        if (clip.id === clipId) {
          const newDuration = Math.max(0.5, clip.duration + delta);
          
          // No permitir exceder maxDuration
          if (clip.maxDuration && newDuration > clip.maxDuration) {
            return clip;
          }
          
          return {
            ...clip,
            duration: newDuration
          };
        }
        return clip;
      })
    );
  };
  
  // Manejador para regenerar contenido AI
  const handleRegenerateContent = (clipId: number) => {
    // Simulación de generación AI
    console.log(`Generando contenido AI para clip ${clipId}`);
    
    // Actualizar clip después de "generación"
    setTimeout(() => {
      setClips(prev => 
        prev.map(clip => {
          if (clip.id === clipId) {
            return {
              ...clip,
              pendingGeneration: false,
              isPlaceholder: false,
              title: `Contenido AI generado (${clipId})`,
              imageUrl: 'https://example.com/generated.jpg'
            };
          }
          return clip;
        })
      );
    }, 1500);
  };
  
  // Manejador para reproducción
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determinar si el playhead está sobre un clip
  const isPlayheadOverClip = (clip: ITimelineClip) => {
    return currentTime >= clip.start && currentTime <= (clip.start + clip.duration);
  };
  
  // Añadir un nuevo clip placeholder
  const addPlaceholderClip = () => {
    // Encontrar un espacio libre en la capa 1 (video/imagen)
    let startTime = 0;
    // Encontrar todos los clips en la capa 1
    const layer1Clips = clips.filter(clip => clip.layer === 1);
    
    // Si hay clips, encontrar un espacio o posicionar al final
    if (layer1Clips.length > 0) {
      // Ordenar por tiempo de inicio
      const sortedClips = [...layer1Clips].sort((a, b) => a.start - b.start);
      // Encontrar el último clip
      const lastClip = sortedClips[sortedClips.length - 1];
      startTime = lastClip.start + lastClip.duration;
    }
    
    // Crear nuevo clip placeholder
    const newClip: ITimelineClip = {
      id: Date.now(),
      start: startTime,
      duration: 3, // Duración predeterminada (respetando máximo de 5s)
      type: 'image',
      layer: 1,
      title: 'Nuevo Placeholder AI',
      isPlaceholder: true,
      pendingGeneration: true,
      placeholderType: 'image',
      generationPrompt: 'Imagen generada para sección musical',
      visible: true,
      locked: false,
      maxDuration: 5 // Restricción de duración máxima
    };
    
    // Agregar el nuevo clip
    setClips(prev => [...prev, newClip]);
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader>
        <CardTitle>Demo del Editor de Timeline</CardTitle>
        <CardDescription>
          Demostración del sistema de capas aisladas y placeholders para generación de contenido AI
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Panel de capas */}
          <div className="w-full md:w-64">
            <LayerManager
              layers={layers}
              visibleLayers={visibleLayers}
              lockedLayers={lockedLayers}
              onToggleLayerVisibility={toggleLayerVisibility}
              onToggleLayerLock={toggleLayerLock}
              className="mb-4"
            />
            
            <div className="space-y-4 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={addPlaceholderClip}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Placeholder AI
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="zoom-level">Zoom: {zoom}px/s</Label>
                <Slider
                  id="zoom-level"
                  min={50}
                  max={200}
                  step={5}
                  value={[zoom]}
                  onValueChange={([value]) => setZoom(value)}
                />
              </div>
            </div>
          </div>
          
          {/* Editor de Timeline */}
          <div className="flex-1">
            {/* Controles de reproducción */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentTime(0)}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <span className="text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">
                  La capa de audio está aislada y no puede modificarse
                </span>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="relative mb-1 overflow-x-auto">
              <div 
                className="bg-gray-800 rounded-md border border-gray-700 relative"
                style={{ height: '200px', width: `${totalDuration * zoom}px`, minWidth: '100%' }}
              >
                {/* Grid de tiempo */}
                {Array.from({ length: Math.ceil(totalDuration) }).map((_, i) => (
                  <div 
                    key={`grid-${i}`}
                    className="absolute top-0 bottom-0 border-l border-gray-700" 
                    style={{ left: `${i * zoom}px` }}
                  >
                    <div className="absolute -top-5 text-xs text-gray-400">
                      {formatTime(i)}
                    </div>
                  </div>
                ))}
                
                {/* Playhead */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-50"
                  style={{ 
                    left: `${currentTime * zoom}px`,
                    transform: 'translateX(-50%)'
                  }}
                />
                
                {/* Clips */}
                <div className="absolute inset-0">
                  {clips.filter(clip => visibleLayers.includes(clip.layer)).map(clip => (
                    <div 
                      key={clip.id}
                      className="absolute"
                      style={{
                        top: `${clip.layer * 50}px`,
                        height: '45px'
                      }}
                    >
                      <TimelineClip
                        clip={clip}
                        pixelsPerSecond={zoom}
                        currentTime={currentTime}
                        isSelected={false}
                        onSelect={() => {}}
                        onRegenerateContent={handleRegenerateContent}
                        onMoveClipStart={handleMoveClipStart}
                        onMoveClipEnd={handleMoveClipEnd}
                        isPlayheadOver={isPlayheadOverClip(clip)}
                        layersVisible={visibleLayers}
                        layersLocked={lockedLayers}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <Progress
              value={(currentTime / totalDuration) * 100}
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimelineDemo;