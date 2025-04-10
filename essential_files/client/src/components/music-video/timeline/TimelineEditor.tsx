/**
 * Editor de timeline principal
 * Componente principal para la edición de videos con timeline multiples capas
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TimelineClip, LayerConfig, TimeMarker } from '../../../interfaces/timeline';
import TimelineLayers from './TimelineLayers';
import { DEFAULT_ZOOM, TIMELINE_DIMENSIONS, LayerType } from '../../../constants/timeline-constants';
import { enforceAllConstraints } from './TimelineConstraints';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { PlayIcon, PauseIcon, ZoomInIcon, ZoomOutIcon, UndoIcon, RedoIcon } from 'lucide-react';

// Definir los colores para las marcas de tiempo
const MARKER_COLORS = {
  beat: '#ff9800',
  section: '#e91e63',
  custom: '#2196f3'
};

// Props para el componente TimelineEditor
interface TimelineEditorProps {
  clips: TimelineClip[];
  duration: number;
  markers?: TimeMarker[];
  onClipsChange: (clips: TimelineClip[]) => void;
  onTimeChange?: (time: number) => void;
  onPlaybackStateChange?: (isPlaying: boolean) => void;
  showBeatGrid?: boolean;
  autoScroll?: boolean;
  readOnly?: boolean;
}

const TimelineEditor: React.FC<TimelineEditorProps> = ({
  clips,
  duration,
  markers = [],
  onClipsChange,
  onTimeChange,
  onPlaybackStateChange,
  showBeatGrid = false,
  autoScroll = true,
  readOnly = false
}) => {
  // Estado para el editor
  const [timeScale, setTimeScale] = useState(DEFAULT_ZOOM);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [dragOperation, setDragOperation] = useState<{
    type: 'move' | 'resize-start' | 'resize-end' | null;
    clipId: number | null;
    startX: number;
    startTime: number;
    startDuration?: number;
  }>({ type: null, clipId: null, startX: 0, startTime: 0 });
  
  // Referencia al contenedor del timeline para cálculos de posición
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Definir las capas del timeline
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: LayerType.AUDIO, name: 'Audio', type: LayerType.AUDIO, height: 60, visible: true, locked: false },
    { id: LayerType.VIDEO_IMAGE, name: 'Video', type: LayerType.VIDEO_IMAGE, height: 80, visible: true, locked: false },
    { id: LayerType.TEXT, name: 'Texto', type: LayerType.TEXT, height: 60, visible: true, locked: false },
    { id: LayerType.EFFECTS, name: 'Efectos', type: LayerType.EFFECTS, height: 60, visible: true, locked: false },
    { id: LayerType.AI_GENERATED, name: 'IA', type: LayerType.AI_GENERATED, height: 80, visible: true, locked: false }
  ]);
  
  // Historial de operaciones para undo/redo
  const [history, setHistory] = useState<{
    past: TimelineClip[][];
    future: TimelineClip[][];
  }>({ past: [], future: [] });
  
  // Aplicar restricciones cuando cambian los clips
  useEffect(() => {
    const constrainedClips = enforceAllConstraints([...clips]);
    
    // Solo actualizar si hay diferencias
    if (JSON.stringify(constrainedClips) !== JSON.stringify(clips)) {
      onClipsChange(constrainedClips);
    }
  }, [clips, onClipsChange]);
  
  // Actualizar tiempo de reproducción cuando está reproduciéndose
  useEffect(() => {
    let animationFrame: number;
    let lastTimestamp = 0;
    
    const updatePlayhead = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      
      const elapsed = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      
      if (isPlaying) {
        setCurrentTime(prevTime => {
          const newTime = prevTime + elapsed;
          // Reiniciar cuando llega al final
          if (newTime >= duration) {
            return 0;
          }
          return newTime;
        });
        animationFrame = requestAnimationFrame(updatePlayhead);
      }
    };
    
    if (isPlaying) {
      animationFrame = requestAnimationFrame(updatePlayhead);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, duration]);
  
  // Notificar cambios de tiempo
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(currentTime);
    }
  }, [currentTime, onTimeChange]);
  
  // Notificar cambios en el estado de reproducción
  useEffect(() => {
    if (onPlaybackStateChange) {
      onPlaybackStateChange(isPlaying);
    }
  }, [isPlaying, onPlaybackStateChange]);
  
  // Manejar la selección de un clip
  const handleClipSelect = useCallback((clipId: number) => {
    setSelectedClipId(clipId);
  }, []);
  
  // Iniciar operación de mover un clip
  const handleClipMoveStart = useCallback((clipId: number, e: React.MouseEvent) => {
    if (readOnly) return;
    
    e.preventDefault();
    const clip = clips.find(c => c.id === clipId);
    if (!clip || clip.locked) return;
    
    // Guardar el estado actual para el historial antes de la modificación
    setHistory(prev => ({
      past: [...prev.past, [...clips]],
      future: []
    }));
    
    setDragOperation({
      type: 'move',
      clipId,
      startX: e.clientX,
      startTime: clip.start
    });
    
    // Agregar manejadores de eventos al documento
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      const timelineBounds = timelineRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - e.clientX;
      const deltaTime = deltaX / timeScale;
      
      // Actualizar posición temporal del clip
      const updatedClips = clips.map(c => {
        if (c.id === clipId) {
          const newStart = Math.max(0, clip.start + deltaTime);
          return { ...c, start: newStart };
        }
        return c;
      });
      
      // Aplicar restricciones
      const constrainedClips = enforceAllConstraints(updatedClips);
      onClipsChange(constrainedClips);
    };
    
    const handleMouseUp = () => {
      setDragOperation({ type: null, clipId: null, startX: 0, startTime: 0 });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [clips, timeScale, readOnly, onClipsChange]);
  
  // Iniciar operación de redimensionar un clip
  const handleClipResizeStart = useCallback((clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => {
    if (readOnly) return;
    
    e.preventDefault();
    const clip = clips.find(c => c.id === clipId);
    if (!clip || clip.locked) return;
    
    // Guardar el estado actual para el historial antes de la modificación
    setHistory(prev => ({
      past: [...prev.past, [...clips]],
      future: []
    }));
    
    setDragOperation({
      type: direction === 'start' ? 'resize-start' : 'resize-end',
      clipId,
      startX: e.clientX,
      startTime: clip.start,
      startDuration: clip.duration
    });
    
    // Agregar manejadores de eventos al documento
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      const deltaX = moveEvent.clientX - e.clientX;
      const deltaTime = deltaX / timeScale;
      
      const updatedClips = clips.map(c => {
        if (c.id === clipId) {
          if (direction === 'start') {
            // Ajustar el inicio y duración al redimensionar desde el inicio
            const newStart = Math.max(0, clip.start + deltaTime);
            const deltaStart = newStart - clip.start;
            const newDuration = clip.duration - deltaStart;
            return {
              ...c,
              start: newStart,
              duration: Math.max(0.5, newDuration)
            };
          } else {
            // Ajustar solo la duración al redimensionar desde el final
            const newDuration = Math.max(0.5, clip.duration + deltaTime);
            return { ...c, duration: newDuration };
          }
        }
        return c;
      });
      
      // Aplicar restricciones
      const constrainedClips = enforceAllConstraints(updatedClips);
      onClipsChange(constrainedClips);
    };
    
    const handleMouseUp = () => {
      setDragOperation({ type: null, clipId: null, startX: 0, startTime: 0 });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [clips, timeScale, readOnly, onClipsChange]);
  
  // Manejar el arrastrar y soltar clips entre capas
  const handleLayerDrop = useCallback((e: React.DragEvent, layerId: number) => {
    if (readOnly) return;
    
    const clipIdString = e.dataTransfer.getData('clip-id');
    if (!clipIdString) return;
    
    const clipId = parseInt(clipIdString, 10);
    const clip = clips.find(c => c.id === clipId);
    if (!clip || clip.locked) return;
    
    // Calcular la posición en el timeline donde se soltó
    if (timelineRef.current) {
      const timelineBounds = timelineRef.current.getBoundingClientRect();
      const dropX = e.clientX - timelineBounds.left;
      const dropTime = dropX / timeScale;
      
      // Guardar el estado actual para el historial antes de la modificación
      setHistory(prev => ({
        past: [...prev.past, [...clips]],
        future: []
      }));
      
      // Actualizar el clip con la nueva capa y posición
      const updatedClips = clips.map(c => {
        if (c.id === clipId) {
          return { ...c, layer: layerId, start: dropTime };
        }
        return c;
      });
      
      // Aplicar restricciones
      const constrainedClips = enforceAllConstraints(updatedClips);
      onClipsChange(constrainedClips);
    }
  }, [clips, timeScale, readOnly, onClipsChange]);
  
  // Añadir un nuevo clip
  const handleAddClip = useCallback((layerId: number, position: number) => {
    if (readOnly) return;
    
    // Determinar el tipo de clip según la capa
    let clipType: 'audio' | 'video' | 'image' | 'text' | 'effect' = 'video';
    switch (layerId) {
      case LayerType.AUDIO:
        clipType = 'audio';
        break;
      case LayerType.VIDEO_IMAGE:
        clipType = 'video';
        break;
      case LayerType.TEXT:
        clipType = 'text';
        break;
      case LayerType.EFFECTS:
        clipType = 'effect';
        break;
      case LayerType.AI_GENERATED:
        clipType = 'image';
        break;
    }
    
    // Crear un nuevo clip
    const newClip: TimelineClip = {
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      start: position,
      duration: 3,
      type: clipType,
      layer: layerId,
      title: `Nuevo ${clipType}`,
      visible: true,
      locked: false
    };
    
    // Si es una imagen generada por IA
    if (layerId === LayerType.AI_GENERATED) {
      newClip.generatedImage = true;
      newClip.imagePrompt = 'Escriba su descripción aquí';
    }
    
    // Guardar el estado actual para el historial antes de la modificación
    setHistory(prev => ({
      past: [...prev.past, [...clips]],
      future: []
    }));
    
    // Añadir el nuevo clip y aplicar restricciones
    const updatedClips = [...clips, newClip];
    const constrainedClips = enforceAllConstraints(updatedClips);
    onClipsChange(constrainedClips);
    
    // Seleccionar el nuevo clip
    setSelectedClipId(newClip.id);
  }, [clips, readOnly, onClipsChange]);
  
  // Togglear la visibilidad de una capa
  const handleToggleLayerVisibility = useCallback((layerId: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);
  
  // Togglear el bloqueo de una capa
  const handleToggleLayerLock = useCallback((layerId: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  }, []);
  
  // Manejar el clic en el timeline para mover el playhead
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const timelineBounds = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - timelineBounds.left - TIMELINE_DIMENSIONS.LAYER_LABEL_WIDTH;
    const clickTime = Math.max(0, Math.min(duration, clickX / timeScale));
    
    setCurrentTime(clickTime);
  }, [timeScale, duration]);
  
  // Manejar zoom in/out
  const handleZoomIn = useCallback(() => {
    setTimeScale(prev => Math.min(prev * 1.2, 200));
  }, []);
  
  const handleZoomOut = useCallback(() => {
    setTimeScale(prev => Math.max(prev / 1.2, 20));
  }, []);
  
  // Manejar deshacer/rehacer
  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    
    const newPast = [...history.past];
    const prevClips = newPast.pop();
    
    if (prevClips) {
      setHistory({
        past: newPast,
        future: [clips, ...history.future]
      });
      
      onClipsChange(prevClips);
    }
  }, [history, clips, onClipsChange]);
  
  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    
    const newFuture = [...history.future];
    const nextClips = newFuture.shift();
    
    if (nextClips) {
      setHistory({
        past: [...history.past, clips],
        future: newFuture
      });
      
      onClipsChange(nextClips);
    }
  }, [history, clips, onClipsChange]);
  
  // Togglear la reproducción
  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  // Renderizar las marcas de tiempo (beats y secciones)
  const renderTimeMarkers = () => {
    return markers.map((marker, index) => {
      const left = marker.time * timeScale;
      const color = MARKER_COLORS[marker.type] || MARKER_COLORS.custom;
      
      return (
        <div
          key={index}
          className="timeline-marker"
          style={{
            left: `${left}px`,
            backgroundColor: color
          }}
          title={marker.label}
        />
      );
    });
  };
  
  // Renderizar la posición actual del playhead
  const renderPlayhead = () => {
    const left = currentTime * timeScale;
    
    return (
      <div 
        className="timeline-playhead" 
        style={{ 
          left: `${left}px`,
          width: `${TIMELINE_DIMENSIONS.PLAYHEAD_WIDTH}px`
        }}
      />
    );
  };
  
  // Renderizar el componente completo
  return (
    <div className="timeline-editor">
      {/* Barra de herramientas */}
      <div className="timeline-toolbar">
        <div className="toolbar-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayback}
            className="toolbar-button"
          >
            {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          </Button>
          <Badge variant="outline" className="current-time">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </Badge>
        </div>
        
        <div className="toolbar-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="toolbar-button"
          >
            <ZoomInIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="toolbar-button"
          >
            <ZoomOutIcon size={16} />
          </Button>
          <Badge variant="outline" className="zoom-level">
            {Math.round(timeScale)}x
          </Badge>
        </div>
        
        <div className="toolbar-group">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={history.past.length === 0}
            className="toolbar-button"
          >
            <UndoIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={history.future.length === 0}
            className="toolbar-button"
          >
            <RedoIcon size={16} />
          </Button>
        </div>
      </div>
      
      {/* Contenedor principal del timeline */}
      <div 
        className="timeline-container" 
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        {/* Regla de tiempo */}
        <div 
          className="timeline-ruler"
          style={{ height: `${TIMELINE_DIMENSIONS.RULER_HEIGHT}px` }}
        >
          {/* Aquí renderizar las marcas de la regla */}
        </div>
        
        {/* Marcas de tiempo (beats, secciones) */}
        <div className="time-markers">
          {renderTimeMarkers()}
        </div>
        
        {/* Playhead */}
        {renderPlayhead()}
        
        {/* Capas y clips */}
        <TimelineLayers
          layers={layers}
          clips={clips}
          timeScale={timeScale}
          selectedClipId={selectedClipId}
          onClipSelect={handleClipSelect}
          onClipMoveStart={handleClipMoveStart}
          onClipResizeStart={handleClipResizeStart}
          onLayerDrop={handleLayerDrop}
          onAddClip={handleAddClip}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onToggleLayerLock={handleToggleLayerLock}
        />
      </div>
      
      {/* Información del clip seleccionado */}
      {selectedClipId !== null && (
        <div className="selected-clip-info">
          {/* Aquí mostrar propiedades del clip seleccionado */}
        </div>
      )}
      
      {/* Estilos CSS para el timeline */}
      <style jsx>{`
        .timeline-editor {
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: system-ui, -apple-system, sans-serif;
          color: #333;
          background-color: #f5f5f5;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .timeline-toolbar {
          display: flex;
          justify-content: space-between;
          padding: 8px 16px;
          background-color: #fff;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .timeline-container {
          position: relative;
          flex: 1;
          overflow: auto;
          background-color: #f9f9fb;
        }
        
        .timeline-ruler {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background-color: #fff;
          border-bottom: 1px solid #e2e8f0;
          z-index: 10;
        }
        
        .time-markers {
          position: absolute;
          top: 0;
          left: ${TIMELINE_DIMENSIONS.LAYER_LABEL_WIDTH}px;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .timeline-marker {
          position: absolute;
          top: 0;
          width: 1px;
          height: 100%;
          pointer-events: none;
        }
        
        .timeline-playhead {
          position: absolute;
          top: 0;
          bottom: 0;
          background-color: #ff0000;
          z-index: 100;
          pointer-events: none;
        }
        
        .selected-clip-info {
          padding: 8px 16px;
          background-color: #fff;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default TimelineEditor;