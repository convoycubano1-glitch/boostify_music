import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  FileVideo,
  Image,
  Music,
  Type,
  Play,
  Pause,
  Plus,
  Scissors,
  Copy,
  Trash,
  Move,
  ZoomIn,
  ZoomOut,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Save,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineClip } from '@/lib/professional-editor-types';

interface ProfessionalTimelineProps {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  onAddClip?: (clip: Omit<TimelineClip, 'id'>) => void;
  onUpdateClip?: (id: string, updates: Partial<TimelineClip>) => void;
  onDeleteClip?: (id: string) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

// Colores por tipo de clip
const clipTypeColors: Record<string, string> = {
  video: '#3b82f6', // blue-500
  image: '#10b981', // green-500
  audio: '#f59e0b', // amber-500
  text: '#8b5cf6'   // violet-500
};

const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  clips = [],
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onAddClip,
  onUpdateClip,
  onDeleteClip,
  onPlay,
  onPause
}) => {
  // Estado
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [scrollPosition, setScrollPosition] = useState<number>(0);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [visibleTracks, setVisibleTracks] = useState<Set<number>>(new Set([0, 1, 2, 3, 4]));
  const [showAddClipDialog, setShowAddClipDialog] = useState<boolean>(false);
  const [clipBeingEdited, setClipBeingEdited] = useState<TimelineClip | null>(null);
  const [clipDialogMode, setClipDialogMode] = useState<'add' | 'edit'>('add');
  const [timelineHeight, setTimelineHeight] = useState<number>(200);
  const [trackHeight, setTrackHeight] = useState<number>(40);
  
  // Referencias
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Form state for new/edited clip
  const [newClipData, setNewClipData] = useState<Partial<TimelineClip>>({
    title: '',
    type: 'video',
    start: currentTime,
    duration: 5,
    url: '',
    trackId: 0,
    selected: false
  });
  
  // Formatear tiempo (mm:ss.ms)
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const ms = Math.floor((timeInSeconds % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Convertir tiempo a posición en la línea de tiempo
  const timeToPosition = (time: number): number => {
    return (time / duration) * 100 * (zoomLevel / 100);
  };
  
  // Convertir posición a tiempo
  const positionToTime = (position: number): number => {
    return (position / (100 * (zoomLevel / 100))) * duration;
  };
  
  // Calcular ancho de un clip
  const calculateClipWidth = (start: number, clipDuration: number): number => {
    const startPos = timeToPosition(start);
    const endPos = timeToPosition(start + clipDuration);
    return endPos - startPos;
  };
  
  // Ajustar scroll automáticamente para mantener tiempo actual visible
  useEffect(() => {
    if (scrollContainerRef.current && timelineRef.current) {
      const container = scrollContainerRef.current;
      const timeline = timelineRef.current;
      
      // Calcular posición del tiempo actual
      const currentTimePosition = (currentTime / duration) * timeline.scrollWidth;
      
      // Si el tiempo actual está fuera del área visible, ajustar scroll
      if (currentTimePosition < container.scrollLeft || 
          currentTimePosition > container.scrollLeft + container.clientWidth) {
        container.scrollLeft = currentTimePosition - (container.clientWidth / 2);
      }
    }
  }, [currentTime, duration]);
  
  // Obtener pistas visibles
  const getVisibleTracks = () => {
    // Obtener todas las pistas únicas de los clips
    const trackIds = new Set(clips.map(clip => clip.trackId));
    
    // Asegurar que siempre haya al menos 5 pistas (0-4)
    for (let i = 0; i < 5; i++) {
      trackIds.add(i);
    }
    
    // Filtrar por pistas visibles
    return Array.from(trackIds)
      .filter(trackId => visibleTracks.has(trackId))
      .sort((a, b) => a - b);
  };
  
  // Obtener altura total de la línea de tiempo
  const getTimelineHeight = () => {
    return getVisibleTracks().length * trackHeight;
  };
  
  // Manejar clic en la línea de tiempo
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !onSeek) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left + scrollContainerRef.current!.scrollLeft;
    const percentage = offsetX / (timelineRef.current.scrollWidth);
    
    onSeek(percentage * duration);
  };
  
  // Manejar selección de clips
  const handleClipClick = (e: React.MouseEvent<HTMLDivElement>, clipId: string) => {
    e.stopPropagation();
    
    // Modificar selección según teclas presionadas
    if (e.ctrlKey || e.metaKey) {
      // Toggle selección con Ctrl/Cmd
      const newSelection = new Set(selectedClipIds);
      if (newSelection.has(clipId)) {
        newSelection.delete(clipId);
      } else {
        newSelection.add(clipId);
      }
      setSelectedClipIds(newSelection);
    } else if (e.shiftKey && selectedClipIds.size > 0) {
      // Selección con Shift
      // Seleccionar todos los clips entre el último seleccionado y este
      const clipsArray = clips.map(c => c.id);
      const lastSelectedIndex = clipsArray.findIndex(id => 
        Array.from(selectedClipIds).includes(id));
      const currentIndex = clipsArray.indexOf(clipId);
      
      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        
        const newSelection = new Set(selectedClipIds);
        for (let i = start; i <= end; i++) {
          newSelection.add(clipsArray[i]);
        }
        setSelectedClipIds(newSelection);
      }
    } else {
      // Click simple
      setSelectedClipIds(new Set([clipId]));
    }
    
    // Actualizar clips seleccionados
    if (onUpdateClip) {
      clips.forEach(clip => {
        const willBeSelected = e.ctrlKey || e.metaKey 
          ? (clip.id === clipId ? !clip.selected : clip.selected)
          : clip.id === clipId;
          
        if (clip.selected !== willBeSelected) {
          onUpdateClip(clip.id, { selected: willBeSelected });
        }
      });
    }
  };
  
  // Agregar un nuevo clip
  const handleAddClip = () => {
    if (!onAddClip) return;
    
    const newClip: Omit<TimelineClip, 'id'> = {
      title: newClipData.title || `Nuevo ${newClipData.type}`,
      type: newClipData.type || 'video',
      start: newClipData.start || currentTime,
      duration: newClipData.duration || 5,
      url: newClipData.url || '',
      trackId: newClipData.trackId || 0,
      selected: false,
      end: (newClipData.start || currentTime) + (newClipData.duration || 5)
    };
    
    onAddClip(newClip);
    setShowAddClipDialog(false);
    resetNewClipForm();
  };
  
  // Editar un clip existente
  const handleEditClip = () => {
    if (!onUpdateClip || !clipBeingEdited) return;
    
    const updates: Partial<TimelineClip> = {
      title: newClipData.title,
      type: newClipData.type,
      start: newClipData.start,
      duration: newClipData.duration,
      url: newClipData.url,
      trackId: newClipData.trackId,
      end: (newClipData.start || clipBeingEdited.start) + 
          (newClipData.duration || clipBeingEdited.duration)
    };
    
    onUpdateClip(clipBeingEdited.id, updates);
    setShowAddClipDialog(false);
    setClipBeingEdited(null);
  };
  
  // Eliminar clips seleccionados
  const handleDeleteSelectedClips = () => {
    if (!onDeleteClip || selectedClipIds.size === 0) return;
    
    // Eliminar cada clip seleccionado
    selectedClipIds.forEach(clipId => {
      onDeleteClip(clipId);
    });
    
    // Limpiar selección
    setSelectedClipIds(new Set());
  };
  
  // Resetear formulario de nuevo clip
  const resetNewClipForm = () => {
    setNewClipData({
      title: '',
      type: 'video',
      start: currentTime,
      duration: 5,
      url: '',
      trackId: 0,
      selected: false
    });
  };
  
  // Preparar edición de clip
  const prepareEditClip = (clip: TimelineClip) => {
    setClipBeingEdited(clip);
    setNewClipData({
      title: clip.title,
      type: clip.type,
      start: clip.start,
      duration: clip.duration,
      url: clip.url,
      trackId: clip.trackId
    });
    setClipDialogMode('edit');
    setShowAddClipDialog(true);
  };
  
  // Preparar añadir nuevo clip
  const prepareAddClip = () => {
    resetNewClipForm();
    setClipDialogMode('add');
    setShowAddClipDialog(true);
  };
  
  // Obtener el número total de pistas
  const getTotalTracks = () => {
    const maxTrackId = clips.reduce((max, clip) => 
      Math.max(max, clip.trackId), 0);
    return Math.max(5, maxTrackId + 1); // Al menos 5 pistas
  };
  
  // Renderizar marcadores de tiempo
  const renderTimeMarkers = () => {
    // Calcular número de marcadores según zoom
    const markersCount = Math.ceil(10 * (zoomLevel / 100));
    const markers = [];
    
    for (let i = 0; i <= markersCount; i++) {
      const percent = (i / markersCount) * 100;
      const time = (percent / 100) * duration;
      
      markers.push(
        <div 
          key={`marker-${i}`} 
          className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-700" 
          style={{ left: `${percent}%` }}
        >
          <span className="absolute top-0 left-1 text-xs text-gray-500 bg-white dark:bg-gray-950 px-1">
            {formatTime(time)}
          </span>
        </div>
      );
    }
    
    return markers;
  };
  
  // Renderizar pistas de la línea de tiempo
  const renderTracks = () => {
    const visibleTrackIds = getVisibleTracks();
    
    return visibleTrackIds.map(trackId => (
      <div 
        key={`track-${trackId}`} 
        className="relative h-10 border-b border-gray-200 dark:border-gray-800"
        style={{ height: `${trackHeight}px` }}
      >
        <div className="absolute inset-y-0 left-0 w-12 bg-gray-100 dark:bg-gray-900 flex items-center justify-center border-r">
          <span className="text-xs text-gray-500">{trackId + 1}</span>
        </div>
        
        <div className="ml-12 h-full relative">
          {/* Clips en esta pista */}
          {clips
            .filter(clip => clip.trackId === trackId)
            .map(clip => (
              <ContextMenu key={clip.id}>
                <ContextMenuTrigger>
                  <div
                    className={cn(
                      "absolute top-1 h-[calc(100%-8px)] rounded-md border-2 cursor-pointer flex flex-col items-start overflow-hidden",
                      clip.selected && "ring-2 ring-white dark:ring-gray-950 ring-opacity-50",
                      "group"
                    )}
                    style={{
                      left: `${timeToPosition(clip.start)}%`,
                      width: `${calculateClipWidth(clip.start, clip.duration)}%`,
                      backgroundColor: clip.color || clipTypeColors[clip.type] || '#6b7280',
                      borderColor: clip.color || clipTypeColors[clip.type] || '#6b7280'
                    }}
                    onClick={(e) => handleClipClick(e, clip.id)}
                  >
                    <div className="w-full px-1 text-xs text-white font-medium truncate bg-black bg-opacity-30">
                      {clip.title}
                    </div>
                    
                    <div className="flex items-center space-x-1 absolute bottom-0 right-0 p-0.5 bg-black bg-opacity-30 rounded-tl-sm">
                      {clip.type === 'video' && <FileVideo className="h-2.5 w-2.5 text-white" />}
                      {clip.type === 'image' && <Image className="h-2.5 w-2.5 text-white" />}
                      {clip.type === 'audio' && <Music className="h-2.5 w-2.5 text-white" />}
                      {clip.type === 'text' && <Type className="h-2.5 w-2.5 text-white" />}
                    </div>
                    
                    {/* Overlay para mostrar al hacer hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 w-6 p-0 bg-white text-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            prepareEditClip(clip);
                          }}
                        >
                          <Scissors className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>
                
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => prepareEditClip(clip)}>
                    <Move className="h-4 w-4 mr-2" /> Editar
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => {
                    if (onUpdateClip) onUpdateClip(clip.id, { selected: true });
                    setSelectedClipIds(new Set([clip.id]));
                  }}>
                    <Move className="h-4 w-4 mr-2" /> Seleccionar
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => {
                    if (onSeek) onSeek(clip.start);
                  }}>
                    <Play className="h-4 w-4 mr-2" /> Reproducir desde aquí
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => {
                    if (onDeleteClip) onDeleteClip(clip.id);
                  }} className="text-red-500">
                    <Trash className="h-4 w-4 mr-2" /> Eliminar
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
        </div>
      </div>
    ));
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <Layers className="h-5 w-5 mr-2 text-orange-500" />
            Línea de tiempo
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2 py-1 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                disabled={zoomLevel <= 25}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-xs w-14 text-center">
                Zoom: {zoomLevel}%
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoomLevel(Math.min(400, zoomLevel + 25))}
                disabled={zoomLevel >= 400}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prepareAddClip}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Añadir clip
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Añadir un nuevo clip a la línea de tiempo</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="grid gap-2">
                  <h4 className="font-medium text-sm">Opciones</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTrackHeight(Math.max(20, trackHeight - 10))}
                    disabled={trackHeight <= 20}
                    className="justify-start"
                  >
                    <ChevronUp className="h-4 w-4 mr-2" /> Reducir altura de pistas
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTrackHeight(Math.min(80, trackHeight + 10))}
                    disabled={trackHeight >= 80}
                    className="justify-start"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" /> Aumentar altura de pistas
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedClipIds.size > 0 && onDeleteClip) {
                        handleDeleteSelectedClips();
                      }
                    }}
                    disabled={selectedClipIds.size === 0}
                    className="justify-start text-red-500"
                  >
                    <Trash className="h-4 w-4 mr-2" /> Eliminar seleccionados
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-hidden">
        <div className="relative min-h-[200px]" ref={containerRef}>
          {/* Línea de tiempo scrollable */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto"
            style={{ height: `${getTimelineHeight() + 30}px` }}
          >
            <div 
              ref={timelineRef}
              className="relative"
              style={{ 
                width: `${100 * (zoomLevel / 100)}%`,
                height: `${getTimelineHeight()}px`
              }}
              onClick={handleTimelineClick}
            >
              {/* Fondo de pistas */}
              <div className="absolute inset-0">
                {renderTracks()}
              </div>
              
              {/* Marcadores de tiempo */}
              <div className="absolute inset-0 pointer-events-none">
                {renderTimeMarkers()}
              </div>
              
              {/* Marcador de tiempo actual */}
              <div 
                className="absolute top-0 h-full w-0.5 bg-orange-500 z-10 pointer-events-none"
                style={{ left: `${timeToPosition(currentTime)}%` }}
              >
                <div className="w-3 h-3 bg-orange-500 rounded-full -ml-1.5 -mt-1.5"></div>
              </div>
            </div>
          </div>
          
          {/* Controles de reproducción */}
          <div className="flex items-center justify-center space-x-2 py-2 border-t">
            {isPlaying ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="h-8 w-8 p-0"
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onPlay}
                className="h-8 w-8 p-0"
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </CardContent>
      
      {/* Dialog para añadir/editar clips */}
      <Dialog open={showAddClipDialog} onOpenChange={setShowAddClipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {clipDialogMode === 'add' ? 'Añadir nuevo clip' : 'Editar clip'}
            </DialogTitle>
            <DialogDescription>
              Configura los parámetros del clip y haz clic en guardar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="clip-title" className="text-sm font-medium">
                  Título
                </label>
                <Input
                  id="clip-title"
                  value={newClipData.title || ''}
                  onChange={(e) => setNewClipData({ ...newClipData, title: e.target.value })}
                  placeholder="Título del clip"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="clip-type" className="text-sm font-medium">
                  Tipo
                </label>
                <Select
                  value={newClipData.type}
                  onValueChange={(value: 'video' | 'image' | 'audio' | 'text') => 
                    setNewClipData({ ...newClipData, type: value })
                  }
                >
                  <SelectTrigger id="clip-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="image">Imagen</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="clip-start" className="text-sm font-medium">
                  Inicio (s)
                </label>
                <Input
                  id="clip-start"
                  type="number"
                  value={newClipData.start}
                  onChange={(e) => setNewClipData({ 
                    ...newClipData, 
                    start: parseFloat(e.target.value) 
                  })}
                  min={0}
                  max={duration}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="clip-duration" className="text-sm font-medium">
                  Duración (s)
                </label>
                <Input
                  id="clip-duration"
                  type="number"
                  value={newClipData.duration}
                  onChange={(e) => setNewClipData({ 
                    ...newClipData, 
                    duration: parseFloat(e.target.value) 
                  })}
                  min={0.1}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="clip-track" className="text-sm font-medium">
                  Pista
                </label>
                <Select
                  value={newClipData.trackId?.toString()}
                  onValueChange={(value) => 
                    setNewClipData({ ...newClipData, trackId: parseInt(value) })
                  }
                >
                  <SelectTrigger id="clip-track">
                    <SelectValue placeholder="Seleccionar pista" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: getTotalTracks() }).map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        Pista {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="clip-url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="clip-url"
                value={newClipData.url || ''}
                onChange={(e) => setNewClipData({ ...newClipData, url: e.target.value })}
                placeholder={`URL del ${newClipData.type}`}
              />
              <p className="text-xs text-gray-500">
                {newClipData.type === 'video' && 'Introduce la URL del video (mp4, webm, etc.)'}
                {newClipData.type === 'image' && 'Introduce la URL de la imagen (jpg, png, etc.)'}
                {newClipData.type === 'audio' && 'Introduce la URL del audio (mp3, wav, etc.)'}
                {newClipData.type === 'text' && 'Introduce el texto a mostrar'}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddClipDialog(false);
              setClipBeingEdited(null);
            }}>
              Cancelar
            </Button>
            
            <Button 
              onClick={clipDialogMode === 'add' ? handleAddClip : handleEditClip}
              disabled={!newClipData.title || !newClipData.type}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {clipDialogMode === 'add' ? 'Añadir' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CardFooter className="pt-2 text-xs text-gray-500">
        <div className="flex justify-between w-full">
          <div>
            Clips: {clips.length} | Seleccionados: {selectedClipIds.size}
          </div>
          <div>
            Duración total: {formatTime(duration)}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProfessionalTimeline;