import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Video
} from 'lucide-react';
import { Effect, TimelineClip } from '@/lib/professional-editor-types';

interface VideoPreviewProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedClip?: TimelineClip;
  activeClips: TimelineClip[];
  appliedEffects: Effect[];
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export function VideoPreview({
  currentTime,
  duration,
  isPlaying,
  selectedClip,
  activeClips,
  appliedEffects,
  volume,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  isMuted
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(720);
  const [previewHeight, setPreviewHeight] = useState(405);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calcular dimensiones y relación de aspecto
  const aspectRatio = 16 / 9;
  
  // Formatear tiempo en formato MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Activar/desactivar fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };
  
  // Sincronizar tiempo de video con estado externo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Si hay una diferencia mayor a 0.5 segundos, actualizar
    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
    
    // Sincronizar estado de reproducción
    if (isPlaying && video.paused) {
      video.play().catch(err => console.error("Error al reproducir:", err));
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
    
    // Sincronizar volumen
    video.volume = isMuted ? 0 : volume / 100;
    
  }, [currentTime, isPlaying, volume, isMuted]);
  
  // Manejar actualización de tiempo del video
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    
    // Solo actualizar el tiempo externo si la diferencia es significativa
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      onSeek(video.currentTime);
    }
    
    // Si estamos en modo canvas, renderizar el frame actual con efectos
    if (isCanvasMode) {
      renderCanvasFrame();
    }
  };
  
  // Renderizar frame en canvas con efectos aplicados
  const renderCanvasFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar frame de video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Obtener los efectos activos en el tiempo actual
    const activeEffects = appliedEffects.filter(effect => {
      const start = effect.startTime ?? 0;
      const end = effect.endTime ?? duration;
      return currentTime >= start && currentTime <= end;
    });
    
    // Aplicar efectos al canvas
    activeEffects.forEach(effect => {
      applyCanvasEffect(ctx, effect, canvas.width, canvas.height);
    });
    
    // Solicitar siguiente frame de animación
    if (isPlaying) {
      requestAnimationFrame(renderCanvasFrame);
    }
  };
  
  // Aplicar un efecto específico al canvas
  const applyCanvasEffect = (
    ctx: CanvasRenderingContext2D, 
    effect: Effect, 
    width: number, 
    height: number
  ) => {
    switch (effect.type) {
      case 'filter':
        // Aplicar filtros CSS al contexto
        let filterString = '';
        
        if (effect.name === 'Desenfoque') {
          filterString += `blur(${effect.properties.amount / 10}px) `;
        }
        if (effect.name === 'Brillo') {
          filterString += `brightness(${effect.properties.amount / 100}) `;
        }
        if (effect.name === 'Contraste') {
          filterString += `contrast(${effect.properties.amount / 100}) `;
        }
        if (effect.name === 'Sepia') {
          filterString += `sepia(${effect.properties.amount / 100}) `;
        }
        
        if (filterString) {
          ctx.filter = filterString.trim();
          ctx.drawImage(videoRef.current!, 0, 0, width, height);
          ctx.filter = 'none';
        }
        break;
        
      case 'transform':
        // Guardar estado actual
        ctx.save();
        
        // Aplicar transformaciones
        if (effect.name === 'Rotación') {
          const angle = effect.properties.angle * (Math.PI / 180);
          ctx.translate(width / 2, height / 2);
          ctx.rotate(angle);
          ctx.translate(-width / 2, -height / 2);
          ctx.drawImage(videoRef.current!, 0, 0, width, height);
        }
        
        if (effect.name === 'Escala') {
          const scaleX = effect.properties.x / 100;
          const scaleY = effect.properties.y / 100;
          ctx.translate(width / 2, height / 2);
          ctx.scale(scaleX, scaleY);
          ctx.translate(-width / 2, -height / 2);
          ctx.drawImage(videoRef.current!, 0, 0, width, height);
        }
        
        // Restaurar estado
        ctx.restore();
        break;
        
      case 'color':
        if (effect.name === 'Tinte de color') {
          // Aplicar tinte de color con opacidad
          ctx.save();
          ctx.fillStyle = effect.properties.color;
          ctx.globalAlpha = effect.properties.opacity / 100;
          ctx.fillRect(0, 0, width, height);
          ctx.globalAlpha = 1.0;
          ctx.restore();
        }
        
        if (effect.name === 'Corrección de color') {
          // Simulación básica de LUTs (Look-Up Tables)
          const intensity = effect.properties.intensity / 100;
          ctx.save();
          
          switch (effect.properties.preset) {
            case 'Cálido':
              ctx.filter = `sepia(${intensity}) saturate(1.5)`;
              break;
            case 'Frío':
              ctx.filter = `hue-rotate(180deg) saturate(${1 + intensity})`;
              break;
            case 'Vibrante':
              ctx.filter = `saturate(${1 + intensity * 2})`;
              break;
            case 'Cinemático':
              ctx.filter = `contrast(${1 + intensity}) brightness(${0.8 + (intensity * 0.2)})`;
              break;
            case 'Blanco y negro':
              ctx.filter = `grayscale(${intensity})`;
              break;
          }
          
          ctx.drawImage(videoRef.current!, 0, 0, width, height);
          ctx.restore();
        }
        break;
        
      case 'text':
        // Dibujar texto sobre el video
        // (La implementación dependerá de los requisitos específicos)
        break;
        
      case 'transition':
        // Efectos de transición
        // (La implementación dependerá de los requisitos específicos)
        break;
    }
  };
  
  // Obtener URL del clip actual para reproducir
  const getCurrentVideoUrl = (): string => {
    // Si hay un clip seleccionado, mostrar ese
    if (selectedClip && selectedClip.type === 'video') {
      return selectedClip.url;
    }
    
    // Si no, buscar el primer clip de video activo en el tiempo actual
    const currentClip = activeClips.find(clip => {
      return clip.type === 'video' && 
             currentTime >= clip.start && 
             currentTime <= (clip.start + clip.duration);
    });
    
    return currentClip?.url || '';
  };
  
  // Ajustar dimensiones al montar el componente o cambiar el modo
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const updateDimensions = () => {
      const containerWidth = container.clientWidth;
      const width = Math.min(containerWidth, 720);
      setPreviewWidth(width);
      setPreviewHeight(width / aspectRatio);
    };
    
    // Actualizar dimensiones iniciales
    updateDimensions();
    
    // Responder a cambios de tamaño de ventana
    window.addEventListener('resize', updateDimensions);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [aspectRatio, isCanvasMode]);
  
  // Iniciar renderizado de canvas cuando cambia a modo canvas
  useEffect(() => {
    if (isCanvasMode && isPlaying) {
      renderCanvasFrame();
    }
  }, [isCanvasMode, isPlaying]);
  
  // Actualizar canvas si cambian los efectos
  useEffect(() => {
    if (isCanvasMode) {
      renderCanvasFrame();
    }
  }, [appliedEffects]);
  
  return (
    <Card className="w-full bg-zinc-900 border-0 rounded-xl overflow-hidden shadow-xl mb-4">
      <CardHeader className="pb-2 border-b border-zinc-800">
        <CardTitle className="text-xl flex items-center text-white">
          <Video className="h-5 w-5 mr-2 text-blue-400" />
          Vista Previa
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={containerRef}
          className="relative bg-black rounded-b-xl overflow-hidden"
          style={{ height: `${previewHeight}px` }}
        >
          {/* Video principal */}
          <video 
            ref={videoRef}
            src={getCurrentVideoUrl()}
            className={isCanvasMode ? "hidden" : "w-full h-full object-contain"}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => onPause()}
            playsInline
          />
          
          {/* Canvas para renderizar efectos */}
          <canvas 
            ref={canvasRef}
            width={previewWidth}
            height={previewHeight}
            className={isCanvasMode ? "block w-full h-full" : "hidden"}
          />
          
          {/* Controles superpuestos */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Barra de progreso */}
            <div className="w-full mb-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.01}
                onValueChange={(values) => onSeek(values[0])}
                aria-label="Seek"
                className="cursor-pointer"
              />
            </div>
            
            {/* Controles de reproducción y tiempo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
                  onClick={() => onSeek(Math.max(0, currentTime - 5))}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                {isPlaying ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPause}
                    className="h-10 w-10 p-0 rounded-full bg-white hover:bg-white/90 text-black"
                  >
                    <Pause className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPlay}
                    className="h-10 w-10 p-0 rounded-full bg-white hover:bg-white/90 text-black"
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
                  onClick={() => onSeek(Math.min(duration, currentTime + 5))}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <span className="text-sm text-white ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
                  onClick={onToggleMute}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[volume]}
                    max={100}
                    step={1}
                    onValueChange={(values) => onVolumeChange(values[0])}
                    aria-label="Volume"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
                  onClick={() => setIsCanvasMode(!isCanvasMode)}
                >
                  <div className="relative">
                    <span className="absolute -top-1 -right-1 text-[10px] bg-blue-500 rounded-full px-1">
                      {isCanvasMode ? "Off" : "On"}
                    </span>
                    <span className="text-[10px]">FX</span>
                  </div>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-full"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Overlay para clip seleccionado */}
          {!getCurrentVideoUrl() && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
              <Video className="h-12 w-12 mb-2 text-zinc-700" />
              <p className="text-zinc-500 text-center">
                Selecciona un clip de video para comenzar
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}