import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, 
  Eye, EyeOff, Lock, Unlock, Trash2, Scissors,
  SkipForward, SkipBack
} from 'lucide-react';

interface AudioLayerProps {
  id: string;
  title: string;
  audioUrl: string;
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
  onRegionUpdate: (id: string, start: number, end: number) => void;
  onPositionChange: (id: string, position: number) => void;
}

export const AudioLayer: React.FC<AudioLayerProps> = ({
  id,
  title,
  audioUrl,
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
  onRegionUpdate,
  onPositionChange
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localIsPlaying, setLocalIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [regionMode, setRegionMode] = useState(false);
  const [regionStart, setRegionStart] = useState(start);
  const [regionEnd, setRegionEnd] = useState(end);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  // Simular datos de forma de onda para visualización
  useEffect(() => {
    // En una implementación real, esto vendría de un analizador de audio real
    const simulatedWaveform = Array.from({ length: 50 }, () => Math.random());
    setWaveformData(simulatedWaveform);
  }, [audioUrl]);

  // Manejar la reproducción cuando cambia el estado global
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    // Si estamos dentro del rango de este clip
    if (currentTime >= start && currentTime <= end) {
      // Calcular la posición relativa dentro del clip
      const clipPosition = currentTime - start;
      
      // Actualizar posición local
      setLocalCurrentTime(clipPosition);
      
      // Actualizar la posición del audio
      if (Math.abs(audio.currentTime - clipPosition) > 0.2) {
        audio.currentTime = clipPosition;
      }
      
      // Reproducir o pausar según el estado global
      if (isPlaying && isVisible && !localIsPlaying) {
        audio.play().catch(e => console.error("Error reproduciendo audio:", e));
        setLocalIsPlaying(true);
      } else if (!isPlaying && localIsPlaying) {
        audio.pause();
        setLocalIsPlaying(false);
      }
    } else {
      // Si estamos fuera del rango del clip, pausar
      if (localIsPlaying) {
        audio.pause();
        setLocalIsPlaying(false);
      }
    }
    
    // Manejar el volumen
    audio.volume = volume;
  }, [currentTime, isPlaying, start, end, volume, localIsPlaying, isVisible]);

  // Manejar la carga de metadatos del audio
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Manejar selección del clip
  const handleSelect = () => {
    if (!isLocked) {
      onSelect(id);
    }
  };

  // Manejar interacciones de tiempo
  const handleTimeChange = (newLocalTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newLocalTime;
    }
    setLocalCurrentTime(newLocalTime);
    
    // Notificar al timeline principal sobre el cambio
    const globalTime = start + newLocalTime;
    onPositionChange(id, globalTime);
  };

  // Alternar y aplicar modo de región
  const toggleRegionMode = () => {
    if (regionMode) {
      // Aplicar cambios
      onRegionUpdate(id, regionStart, regionEnd);
      setRegionMode(false);
    } else {
      // Iniciar edición
      setRegionStart(start);
      setRegionEnd(end);
      setRegionMode(true);
    }
  };

  // Formatear tiempo en mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Comprobar si este clip está activo en el momento actual
  const isActive = currentTime >= start && currentTime <= end;
  
  // Calcular progreso relativo dentro del clip
  const progressPercent = 
    isActive ? ((currentTime - start) / (end - start) * 100) : 0;

  return (
    <Card 
      className={`
        overflow-hidden 
        ${isSelected ? 'ring-2 ring-primary' : ''} 
        ${isActive ? 'bg-primary-50 dark:bg-primary-950/20' : ''}
      `}
      onClick={handleSelect}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Button 
              size="icon" 
              variant={isVisible ? "default" : "outline"} 
              className="h-7 w-7 mr-2" 
              onClick={() => onVisibilityToggle(id, !isVisible)}
              disabled={isLocked}
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <span className="font-medium truncate">{title}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button 
              size="icon" 
              variant={isLocked ? "default" : "outline"} 
              className="h-7 w-7" 
              onClick={() => onLockToggle(id, !isLocked)}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
            
            <Button 
              size="icon" 
              variant="outline" 
              className="h-7 w-7" 
              onClick={() => onDelete(id)}
              disabled={isLocked}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Audio nativo para reproducción (oculto) */}
        <audio 
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={handleLoadedMetadata}
          className="hidden"
        />
        
        {/* Visualización de forma de onda */}
        <div className="h-16 w-full bg-gray-100 dark:bg-gray-800 rounded-md relative overflow-hidden">
          {/* Forma de onda simulada */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end h-12 space-x-px">
              {waveformData.map((height, index) => (
                <div 
                  key={`wave-${id}-${index}`}
                  className={`w-1 bg-gray-400 dark:bg-gray-600 ${index < (waveformData.length * progressPercent / 100) ? 'bg-primary' : ''}`} 
                  style={{ height: `${height * 100}%`, opacity: isVisible ? 1 : 0.4 }}
                />
              ))}
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div 
            className="absolute top-0 h-full bg-primary/20 pointer-events-none"
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Indicador de tiempo actual */}
          <div 
            className="absolute top-0 h-full w-0.5 bg-primary"
            style={{ left: `${progressPercent}%` }}
          />
          
          {/* Indicadores de región */}
          {regionMode && (
            <>
              <div 
                className="absolute top-0 h-full w-1 bg-blue-500 cursor-ew-resize"
                style={{ left: `${((regionStart - start) / (end - start)) * 100}%` }}
              />
              <div 
                className="absolute top-0 h-full w-1 bg-blue-500 cursor-ew-resize"
                style={{ left: `${((regionEnd - start) / (end - start)) * 100}%` }}
              />
            </>
          )}
        </div>
        
        {/* Controles de tiempo */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>{formatTime(start)}</span>
          <span>{formatTime(end - start)}</span>
          <span>{formatTime(end)}</span>
        </div>
        
        {/* Controles adicionales cuando está seleccionado */}
        {isSelected && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 w-7 p-0" 
                onClick={() => handleTimeChange(Math.max(0, localCurrentTime - 5))}
                disabled={isLocked}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button 
                size="sm" 
                variant={localIsPlaying ? "default" : "outline"} 
                className="h-7 w-7 p-0" 
                onClick={() => {
                  if (localIsPlaying) {
                    audioRef.current?.pause();
                    setLocalIsPlaying(false);
                  } else {
                    audioRef.current?.play();
                    setLocalIsPlaying(true);
                  }
                }}
                disabled={isLocked}
              >
                {localIsPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 w-7 p-0" 
                onClick={() => handleTimeChange(Math.min(duration, localCurrentTime + 5))}
                disabled={isLocked}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center flex-1 ml-2">
                <div className="flex items-center space-x-1 w-full">
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
                    className="w-24"
                    onValueChange={(value) => onVolumeChange(id, value[0])}
                    disabled={isLocked}
                  />
                </div>
              </div>
              
              <Button 
                size="sm" 
                variant={regionMode ? "default" : "outline"} 
                className="h-7" 
                onClick={toggleRegionMode}
                disabled={isLocked}
              >
                <Scissors className="h-3 w-3 mr-1" />
                {regionMode ? "Aplicar" : "Recortar"}
              </Button>
            </div>
            
            {/* Controles de región */}
            {regionMode && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Inicio: {formatTime(regionStart)}</span>
                    <span className="text-xs text-muted-foreground">Relativo: {formatTime(regionStart - start)}</span>
                  </div>
                  <Slider
                    value={[regionStart]}
                    min={Math.max(0, start - 10)}
                    max={regionEnd - 0.5}
                    step={0.1}
                    onValueChange={(value) => setRegionStart(value[0])}
                    disabled={isLocked}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs">Fin: {formatTime(regionEnd)}</span>
                    <span className="text-xs text-muted-foreground">Duración: {formatTime(regionEnd - regionStart)}</span>
                  </div>
                  <Slider
                    value={[regionEnd]}
                    min={regionStart + 0.5}
                    max={Math.min(start + duration, end + 10)}
                    step={0.1}
                    onValueChange={(value) => setRegionEnd(value[0])}
                    disabled={isLocked}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};