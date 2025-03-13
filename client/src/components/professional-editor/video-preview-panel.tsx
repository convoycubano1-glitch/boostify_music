import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Slider } from '../../components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Image as ImageIcon
} from 'lucide-react';

interface VideoPreviewPanelProps {
  src?: string;
  poster?: string;
  duration?: number;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
}

// Combined default and named export
export default function VideoPreviewPanelComponent({
  src,
  poster,
  duration: propDuration,
  onSeek,
  onVolumeChange
}: VideoPreviewPanelProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(propDuration || 0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Controlar la reproducción/pausa
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Actualizar el tiempo actual
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  // Manejar el cambio en el slider de tiempo
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    
    if (onSeek) {
      onSeek(newTime);
    }
  };
  
  // Manejar el cambio de volumen
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
    
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };
  
  // Alternar silencio
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Formatear tiempo en formato MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Volver al inicio
  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      
      if (onSeek) {
        onSeek(0);
      }
    }
  };
  
  // Saltar al final
  const handleSkipForward = () => {
    if (videoRef.current && duration) {
      videoRef.current.currentTime = duration;
      setCurrentTime(duration);
      
      if (onSeek) {
        onSeek(duration);
      }
    }
  };
  
  // Manejar el modo pantalla completa
  const toggleFullScreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error al intentar mostrar la pantalla completa:`, err);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };
  
  // Actualizar duración cuando el video se carga
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  // Manejar cuando el video termina
  const handleEnded = () => {
    setIsPlaying(false);
  };
  
  // Sincronizar volumen y silencio cuando cambian los props
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  
  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-black/80 relative">
        {src ? (
          <video
            ref={videoRef}
            className="max-h-full max-w-full"
            src={src}
            poster={poster}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />
        ) : poster ? (
          <div className="relative max-h-full max-w-full">
            <img 
              src={poster} 
              alt="Preview" 
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <ImageIcon className="w-12 h-12 text-white opacity-70" />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">No hay contenido seleccionado</div>
          </div>
        )}
      </div>
      
      {/* Controles */}
      <Card className="border-t-0 rounded-none rounded-b-lg">
        <CardContent className="p-2">
          {/* Barra de progreso */}
          <div className="mb-2">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={!src}
              aria-label="Progreso de reproducción"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!src} 
                onClick={handleSkipBack}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!src} 
                onClick={togglePlayPause}
                className="h-8 w-8"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!src} 
                onClick={handleSkipForward}
                className="h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <div className="w-[80px]">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  aria-label="Control de volumen"
                />
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleFullScreen}
                className="h-8 w-8"
              >
                {isFullScreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}