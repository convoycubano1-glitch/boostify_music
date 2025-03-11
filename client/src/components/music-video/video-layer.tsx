import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, 
  Eye, EyeOff, Lock, Unlock, Trash2, Scissors
} from 'lucide-react';

interface VideoLayerProps {
  id: string;
  title: string;
  videoUrl: string;
  start: number;
  end: number;
  currentTime: number;
  isPlaying: boolean;
  isSelected: boolean;
  isLocked: boolean;
  isVisible: boolean;
  volume: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onLockToggle: (id: string, locked: boolean) => void;
  onVisibilityToggle: (id: string, visible: boolean) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onClipTrimmed: (id: string, start: number, end: number) => void;
}

export const VideoLayer: React.FC<VideoLayerProps> = ({
  id,
  title,
  videoUrl,
  start,
  end,
  currentTime,
  isPlaying,
  isSelected,
  isLocked,
  isVisible,
  volume,
  onSelect,
  onDelete,
  onLockToggle,
  onVisibilityToggle,
  onVolumeChange,
  onClipTrimmed
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [trimMode, setTrimMode] = useState(false);
  const [trimStart, setTrimStart] = useState(start);
  const [trimEnd, setTrimEnd] = useState(end);
  const [isImage, setIsImage] = useState(false);

  // Detectar si es una imagen o un video basado en la extensión del archivo
  useEffect(() => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const isImageFile = imageExtensions.some(ext => videoUrl.toLowerCase().endsWith(ext));
    setIsImage(isImageFile);
  }, [videoUrl]);

  // Manejar la reproducción cuando cambia currentTime o isPlaying
  useEffect(() => {
    if (!videoRef.current || isImage) return;
    
    const video = videoRef.current;
    
    // Actualizar la posición de reproducción
    if (currentTime >= start && currentTime <= end) {
      // Calcular la posición relativa dentro del clip
      const clipPosition = currentTime - start;
      // Asegurarse de no pasar de la duración del video
      if (clipPosition <= video.duration) {
        video.currentTime = clipPosition;
      }
      
      // Si el timeline está reproduciendo y estamos dentro del clip, reproducir el video
      if (isPlaying && !localIsPlaying) {
        video.play().catch(e => console.error("Error reproduciendo video:", e));
        setLocalIsPlaying(true);
      } else if (!isPlaying && localIsPlaying) {
        video.pause();
        setLocalIsPlaying(false);
      }
    } else {
      // Si estamos fuera del rango del clip, pausar
      if (localIsPlaying) {
        video.pause();
        setLocalIsPlaying(false);
      }
    }
  }, [currentTime, isPlaying, start, end, localIsPlaying, isImage]);

  // Manejar el volumen
  useEffect(() => {
    if (videoRef.current && !isImage) {
      videoRef.current.volume = volume;
    }
  }, [volume, isImage]);

  // Manejar la carga inicial de metadatos
  const handleLoadedData = () => {
    if (videoRef.current && !isImage) {
      setDuration(videoRef.current.duration);
    }
  };

  // Manejar la selección del clip
  const handleSelect = () => {
    if (!isLocked) {
      onSelect(id);
    }
  };

  // Aplicar recorte cuando finaliza el modo trim
  const applyTrim = () => {
    if (trimMode) {
      onClipTrimmed(id, trimStart, trimEnd);
      setTrimMode(false);
    } else {
      setTrimStart(start);
      setTrimEnd(end);
      setTrimMode(true);
    }
  };

  // Formatear tiempo en formato mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determinar si este clip debe estar visible según la posición actual
  const isClipActive = currentTime >= start && currentTime <= end;

  return (
    <Card 
      className={`overflow-hidden ${isSelected ? 'ring-2 ring-primary' : ''} ${isClipActive ? 'bg-primary-50 dark:bg-primary-950/20' : ''}`}
      onClick={handleSelect}
    >
      <CardContent className="p-0">
        <div className="relative">
          {isImage ? (
            <img 
              src={videoUrl} 
              alt={title}
              className="w-full aspect-video object-cover" 
              style={{ opacity: isVisible ? 1 : 0.3 }}
            />
          ) : (
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video object-cover"
              onLoadedData={handleLoadedData}
              muted={false}
              style={{ opacity: isVisible ? 1 : 0.3 }}
            />
          )}
          
          {/* Overlay para clips bloqueados */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          )}
          
          {/* Controles */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex items-center justify-between">
            <div className="text-white text-xs font-medium truncate">{title}</div>
            
            <div className="flex space-x-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                onClick={() => onVisibilityToggle(id, !isVisible)}
                disabled={isLocked}
              >
                {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                onClick={() => onLockToggle(id, !isLocked)}
              >
                {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </Button>
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 text-white hover:text-white hover:bg-white/20"
                onClick={() => onDelete(id)}
                disabled={isLocked}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Info de tiempo */}
        <div className="px-3 py-1 flex items-center justify-between text-xs">
          <span>{formatTime(start)}</span>
          <span>{formatTime(end - start)}</span>
          <span>{formatTime(end)}</span>
        </div>
        
        {/* Controles de recorte en modo de edición */}
        {isSelected && trimMode && (
          <div className="p-3 border-t dark:border-gray-700">
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1 block">Inicio: {formatTime(trimStart)}</label>
                <Slider
                  value={[trimStart]}
                  min={Math.max(0, start - 10)}
                  max={trimEnd - 0.5}
                  step={0.1}
                  onValueChange={(value) => setTrimStart(value[0])}
                  disabled={isLocked}
                />
              </div>
              
              <div>
                <label className="text-xs mb-1 block">Fin: {formatTime(trimEnd)}</label>
                <Slider
                  value={[trimEnd]}
                  min={trimStart + 0.5}
                  max={Math.min(duration, end + 10)}
                  step={0.1}
                  onValueChange={(value) => setTrimEnd(value[0])}
                  disabled={isLocked}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Controles adicionales cuando está seleccionado */}
        {isSelected && (
          <div className="flex items-center justify-between p-2 border-t dark:border-gray-700">
            <Button 
              size="sm" 
              variant={trimMode ? "default" : "outline"} 
              className="h-7"
              onClick={applyTrim}
              disabled={isLocked}
            >
              <Scissors className="h-3 w-3 mr-1" />
              {trimMode ? "Aplicar recorte" : "Recortar"}
            </Button>
            
            <div className="flex items-center space-x-1">
              {volume === 0 ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
              
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                className="w-20"
                onValueChange={(value) => onVolumeChange(id, value[0])}
                disabled={isLocked}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};