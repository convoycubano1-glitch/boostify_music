import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Music, Image as ImageIcon, Edit, RefreshCw, X, 
  PictureInPicture, MoreHorizontal, Save, Maximize2, Minimize2,
  Scissors, ArrowLeftRight, Film, Wand2, Layers, Plus, 
  CornerUpLeft, CornerUpRight, ArrowUpDown, Sparkles,
  ArrowRight, Sunset, MoveHorizontal, ArrowRight as ArrowRightIcon
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WaveSurfer from 'wavesurfer.js';
import interact from 'interactjs';

export interface TimelineClip {
  id: number;
  start: number;
  duration: number;
  type: 'video' | 'image' | 'transition' | 'audio' | 'effect';
  thumbnail?: string;
  title: string;
  description?: string;
  waveform?: number[];
  imagePrompt?: string;
  shotType?: string;
  // Campos para URL de imagen/video
  imageUrl?: string;
  movementUrl?: string;
  // Campos específicos para lipsync
  lipsyncApplied?: boolean;
  lipsyncVideoUrl?: string;
  lipsyncProgress?: number;
  // Campo para transiciones
  transitionType?: 'crossfade' | 'wipe' | 'fade' | 'slide' | 'zoom';
  transitionDuration?: number;
  // Campo para efectos
  effectType?: 'blur' | 'glow' | 'sepia' | 'grayscale' | 'saturation' | 'custom';
  effectIntensity?: number;
  // Metadata adicional para el clip
  metadata?: {
    section?: string;    // Sección musical (coro, verso, etc.)
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    faceSwapApplied?: boolean;
    musicianIntegrated?: boolean;
  };
}

// WaveSurfer extended interface to handle missing methods in type definitions
interface ExtendedWaveSurfer extends WaveSurfer {
  loadDecodedBuffer?: (buffer: AudioBuffer) => void;
}

interface TimelineEditorProps {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
  onTimeUpdate: (time: number) => void;
  onClipUpdate: (clipId: number, updates: Partial<TimelineClip>) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  onRegenerateImage?: (clipId: number) => void;
  onSplitClip?: (clipId: number, splitTime: number) => void;
}

export function TimelineEditor({
  clips,
  currentTime,
  duration,
  audioBuffer,
  onTimeUpdate,
  onClipUpdate,
  onPlay,
  onPause,
  isPlaying,
  onRegenerateImage,
  onSplitClip
}: TimelineEditorProps) {
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [waveformData, setWaveformData] = useState<Array<{ max: number; min: number; }>>([]);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [isWaveformHovered, setIsWaveformHovered] = useState(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [clipStartTime, setClipStartTime] = useState<number>(0);
  const [resizingSide, setResizingSide] = useState<'start' | 'end' | null>(null);
  const playheadAnimation = useAnimation();
  const [selectedImagePreview, setSelectedImagePreview] = useState<TimelineClip | null>(null);
  const [expandedPreview, setExpandedPreview] = useState(false);

  const timelineWidth = duration * zoom * 100;
  const timeToPixels = (time: number) => time * zoom * 100;
  const pixelsToTime = (pixels: number) => pixels / (zoom * 100);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 10));
    
    // Si hay un clip seleccionado, centrar la vista en él
    if (selectedClip !== null) {
      const clip = clips.find(c => c.id === selectedClip);
      if (clip && scrollAreaRef.current) {
        const clipCenter = timeToPixels(clip.start + clip.duration / 2);
        scrollAreaRef.current.scrollLeft = clipCenter - scrollAreaRef.current.clientWidth / 2;
      }
    }
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.1));
  };

  // Efecto para la animación del cursor de reproducción (mejorado para fluidez al estilo CapCut)
  useEffect(() => {
    const playheadPosition = timeToPixels(currentTime);
    
    if (isPlaying) {
      // Animación suave del playhead con transición mejorada
      playheadAnimation.start({
        x: playheadPosition,
        transition: {
          duration: 0.08, // Duración levemente mayor para un movimiento tipo CapCut
          ease: "cubicBezier(0.2, 0.0, 0.2, 1.0)", // Curva de aceleración profesional
          type: "tween" // Asegura una animación fluida
        }
      });
      
      // Auto-scroll mejorado para seguir la cabeza de reproducción
      if (scrollAreaRef.current) {
        const scrollLeft = scrollAreaRef.current.scrollLeft;
        const clientWidth = scrollAreaRef.current.clientWidth;
        const threshold = clientWidth * 0.2; // 20% del ancho como umbral
        
        // Scroll suave cuando el playhead se acerca al borde (estilo CapCut)
        if (playheadPosition > scrollLeft + clientWidth - threshold) {
          // Si se acerca al borde derecho
          const targetScroll = playheadPosition - (clientWidth * 0.7); // Posicionar al 70% de la vista
          scrollAreaRef.current.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          });
        } else if (playheadPosition < scrollLeft + threshold) {
          // Si se acerca al borde izquierdo
          const targetScroll = playheadPosition - (clientWidth * 0.3); // Posicionar al 30% de la vista
          scrollAreaRef.current.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          });
        }
      }
    } else {
      // Posicionamiento instantáneo cuando no está reproduciendo
      playheadAnimation.set({ x: playheadPosition });
    }
  }, [currentTime, isPlaying, playheadAnimation, timeToPixels]);

  // Referencia para WaveSurfer
  const wavesurferRef = useRef<ExtendedWaveSurfer | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  
  // Función para convertir AudioBuffer a WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    // Función auxiliar para escribir un string en un array (WAV format)
    const writeString = (view: DataView, offset: number, string: string): void => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // Calculamos el tamaño del archivo WAV
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new ArrayBuffer(length);
    const view = new DataView(out);

    // Cabecera RIFF
    writeString(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(view, 8, 'WAVE');

    // Cabecera FMT
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numOfChan, true); // canales
    view.setUint32(24, buffer.sampleRate, true); // sample rate
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true); // byte rate
    view.setUint16(32, numOfChan * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // Data chunk header
    writeString(view, 36, 'data');
    view.setUint32(40, length - 44, true);

    // Escribir los datos de audio
    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array): void => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };

    // Copiar los datos de audio
    let offset = 44;
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      floatTo16BitPCM(view, offset, buffer.getChannelData(i));
      offset += buffer.length * 2;
    }

    return out;
  };
  
  // Generar datos de forma de onda para visualización de audio mejorada
  useEffect(() => {
    // Verificación robusta de requisitos previos
    if (!audioBuffer || !waveformContainerRef.current || audioBuffer.length === 0) {
      console.log("Requisitos previos de WaveSurfer no disponibles");
      return;
    }
    
    // Limpiar instancia anterior de WaveSurfer si existe con manejo de errores
    if (wavesurferRef.current) {
      try {
        // Primero eliminamos los eventos para evitar errores de "signal is aborted"
        wavesurferRef.current.unAll();
        wavesurferRef.current.destroy();
      } catch (err) {
        console.warn("Error al limpiar instancia WaveSurfer previa:", err);
      }
    }
    
    // Crear nueva instancia de WaveSurfer con estilo mejorado estilo CapCut
    try {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: 'rgba(249, 115, 22, 0.4)',
        progressColor: 'rgba(249, 115, 22, 0.8)',
        cursorColor: 'transparent', // Ocultamos el cursor nativo ya que tenemos el nuestro
        barWidth: 2,
        barRadius: 3,
        barGap: 2,
        height: 80,
        normalize: true,
        barHeight: 0.8, // Altura variable para efecto profesional
        backend: 'WebAudio',
        fillParent: true,
        hideScrollbar: true,
        // La propiedad responsive se aplicará mediante CSS
      });
    } catch (err) {
      console.error("Error al crear WaveSurfer:", err);
      return;
    }
    
    // Crear un AudioContext y cargar el buffer en WaveSurfer
    try {
      // Método para cargar buffer en WaveSurfer (versión 6+)
      if (typeof wavesurferRef.current.loadDecodedBuffer === 'function') {
        wavesurferRef.current.loadDecodedBuffer(audioBuffer);
      } else {
        // Método alternativo para versiones anteriores
        const audioContext = new AudioContext();
        wavesurferRef.current.load(URL.createObjectURL(new Blob(
          [audioBufferToWav(audioBuffer)], 
          { type: 'audio/wav' }
        )));
      }
    } catch (error) {
      console.error("Error al cargar audio en WaveSurfer:", error);
    }
    
    // Eventos para WaveSurfer
    wavesurferRef.current.on('ready', () => {
      console.log('WaveSurfer está listo');
    });
    
    wavesurferRef.current.on('seeking', (position: number) => {
      const seekTime = position * duration;
      onTimeUpdate(seekTime);
    });
    
    // Generar también los datos de miniatura para los clips
    const channelData = audioBuffer.getChannelData(0);
    const samples = 2000;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let max = 0;
      let min = 0;

      for (let j = 0; j < blockSize; j++) {
        const value = channelData[start + j];
        max = Math.max(max, value);
        min = Math.min(min, value);
      }

      waveform.push({ max, min });
    }

    setWaveformData(waveform);
    
    // Limpieza al desmontar con manejo de errores seguro
    return () => {
      try {
        if (wavesurferRef.current) {
          // Desconectar eventos primero para evitar errores "signal is aborted"
          wavesurferRef.current.unAll();
          wavesurferRef.current.destroy();
        }
      } catch (err) {
        console.warn("Limpieza segura de WaveSurfer:", err);
      }
    };
  }, [audioBuffer, duration, onTimeUpdate]);
  
  // Actualizar la posición de reproducción en WaveSurfer
  useEffect(() => {
    if (wavesurferRef.current && duration > 0) {
      const position = currentTime / duration;
      wavesurferRef.current.seekTo(position);
    }
  }, [currentTime, duration]);

  // Manejar clic en la línea de tiempo para mover la posición actual
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    const newTime = pixelsToTime(x);
    onTimeUpdate(Math.max(0, Math.min(newTime, duration)));
  };

  // Manejar movimiento del mouse sobre la forma de onda
  const handleWaveformMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    setHoveredTime(pixelsToTime(x));
  };

  // Funciones para manejar arrastrar y soltar clips
  const handleClipDragStart = (clipId: number, e: React.MouseEvent) => {
    e.preventDefault();
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setIsDragging(true);
      setSelectedClip(clipId);
      setDragStartX(e.clientX);
      setClipStartTime(clip.start);
      
      // Agregar listeners al documento
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && selectedClip !== null) {
      const deltaX = e.clientX - dragStartX;
      const deltaTime = pixelsToTime(deltaX);
      const newStartTime = Math.max(0, clipStartTime + deltaTime);
      
      onClipUpdate(selectedClip, {
        start: newStartTime
      });
    } else if (resizingSide && selectedClip !== null) {
      handleResizeMove(e as any);
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setResizingSide(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Funciones para manejar redimensionamiento de clips
  const handleResizeStart = (clipId: number, side: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedClip(clipId);
    setResizingSide(side);
    setDragStartX(e.clientX);
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setClipStartTime(clip.start);
      
      // Agregar listeners al documento
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!selectedClip || !resizingSide) return;

    const clip = clips.find(c => c.id === selectedClip);
    if (!clip) return;

    const deltaX = e.clientX - dragStartX;
    const deltaTime = pixelsToTime(deltaX);

    if (resizingSide === 'start') {
      const newStart = Math.max(0, clipStartTime + deltaTime);
      const newDuration = Math.max(0.5, (clip.start + clip.duration) - newStart);
      onClipUpdate(selectedClip, {
        start: newStart,
        duration: newDuration
      });
    } else {
      const newDuration = Math.max(0.5, clip.duration + deltaTime);
      onClipUpdate(selectedClip, {
        duration: newDuration
      });
    }
  };

  // Abrir vista previa al hacer doble clic en un clip
  const handleClipDoubleClick = (clip: TimelineClip) => {
    setSelectedImagePreview(clip);
  };

  return (
    <Card className="p-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onTimeUpdate(0)}
            disabled={clips.length === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            onClick={isPlaying ? onPause : onPlay}
            disabled={clips.length === 0}
            className="min-w-24 bg-orange-500 hover:bg-orange-600"
          >
            {isPlaying ? (
              <><Pause className="h-4 w-4 mr-2" /> Pausar</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Reproducir</>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onTimeUpdate(duration)}
            disabled={clips.length === 0}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-black/5 px-3 py-1.5 rounded-md font-mono text-sm border">
            {formatTimecode(currentTime)}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleZoomOut}
                    className="border-orange-500/30"
                  >
                    <ZoomOut className="h-4 w-4 text-orange-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alejar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleZoomIn}
                    className="border-orange-500/30"
                  >
                    <ZoomIn className="h-4 w-4 text-orange-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Acercar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setExpandedPreview(!expandedPreview)}
                    className="border-orange-500/30"
                  >
                    {expandedPreview ? (
                      <Minimize2 className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-orange-500" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{expandedPreview ? 'Minimizar' : 'Maximizar'} vista previa</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Barra de herramientas de edición */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1"
                disabled={selectedClip === null}
                onClick={() => {
                  if (selectedClip !== null) {
                    // Lógica para cortar el clip en la posición actual
                    const clip = clips.find(c => c.id === selectedClip);
                    if (clip && currentTime > clip.start && currentTime < clip.start + clip.duration) {
                      const relativePosition = currentTime - clip.start;
                      
                      // Actualizar el clip actual para que termine en la posición de corte
                      onClipUpdate(selectedClip, {
                        duration: relativePosition
                      });
                      
                      // Crear un nuevo clip con la segunda parte
                      if (onSplitClip) {
                        onSplitClip(selectedClip, currentTime);
                      }
                    }
                  }
                }}
              >
                <Scissors className="h-4 w-4" />
                <span className="hidden sm:inline">Cortar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cortar clip en la posición actual</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1"
                disabled={!selectedClip}
                onClick={() => {
                  /* Lógica para agregar transición */
                }}
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden sm:inline">Transición</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Agregar transición</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-1"
                disabled={!selectedClip}
                onClick={() => {
                  /* Lógica para agregar efecto */
                }}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Efecto</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Agregar efecto visual</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="h-6 border-r mx-1"></div>
        
        <Select
          disabled={selectedClip === null}
          onValueChange={(value) => {
            if (selectedClip !== null) {
              onClipUpdate(selectedClip, {
                transitionType: value as 'crossfade' | 'wipe' | 'fade' | 'slide' | 'zoom'
              });
            }
          }}
        >
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder="Transición..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="crossfade">Fundido cruzado</SelectItem>
            <SelectItem value="wipe">Barrido</SelectItem>
            <SelectItem value="fade">Desvanecer</SelectItem>
            <SelectItem value="slide">Deslizar</SelectItem>
            <SelectItem value="zoom">Zoom</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="h-6 border-r mx-1"></div>
        
        <Select
          disabled={selectedClip === null}
          onValueChange={(value) => {
            if (selectedClip !== null) {
              onClipUpdate(selectedClip, {
                effectType: value as 'blur' | 'glow' | 'sepia' | 'grayscale' | 'saturation' | 'custom'
              });
            }
          }}
        >
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder="Efecto..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blur">Desenfoque</SelectItem>
            <SelectItem value="glow">Resplandor</SelectItem>
            <SelectItem value="sepia">Sepia</SelectItem>
            <SelectItem value="grayscale">Escala de grises</SelectItem>
            <SelectItem value="saturation">Saturación</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={cn(
        "relative w-full rounded-lg overflow-hidden mb-4 transition-all duration-300",
        expandedPreview ? "aspect-video" : "h-48"
      )}>
        {selectedClip !== null && clips.find(c => c.id === selectedClip)?.thumbnail ? (
          <img
            src={clips.find(c => c.id === selectedClip)?.thumbnail}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : clips.some(c => c.thumbnail) ? (
          <img
            src={clips.find(c => c.thumbnail)?.thumbnail}
            alt="Preview"
            className="w-full h-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5">
            <ImageIcon className="h-12 w-12 text-muted-foreground/25" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary/10">
          <div
            className="absolute h-full bg-orange-500 transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Controles de reproducción superpuestos */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 5))}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? onPause : onPlay}
            className="h-8 w-8 text-white hover:bg-white/20"
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
            onClick={() => onTimeUpdate(Math.min(duration, currentTime + 5))}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea 
        ref={scrollAreaRef as any}
        className="h-[300px] sm:h-[400px] border rounded-lg"
        onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
      >
        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Music className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No hay clips en el timeline</p>
            <p className="text-sm">Utiliza "Detectar Cortes Musicales" para generar los clips automáticamente</p>
          </div>
        ) : (
          <div
            ref={timelineRef}
            className="relative"
            style={{ width: `${timelineWidth}px`, minHeight: "300px" }}
            onClick={handleTimelineClick}
          >
            {/* Escala de tiempo */}
            <div className="absolute top-0 left-0 right-0 h-6 border-b flex">
              {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
                <div
                  key={i}
                  className="border-l h-full flex items-center justify-center text-xs text-muted-foreground"
                  style={{ width: `${timeToPixels(1)}px` }}
                >
                  {formatTimecode(i)}
                </div>
              ))}
            </div>

            {/* Forma de onda con WaveSurfer.js */}
            <div
              className="absolute left-0 right-0 h-24 mt-8"
              onMouseEnter={() => setIsWaveformHovered(true)}
              onMouseLeave={() => {
                setIsWaveformHovered(false);
                setHoveredTime(null);
              }}
              onMouseMove={handleWaveformMouseMove}
              onClick={handleTimelineClick}
            >
              {/* Contenedor para WaveSurfer */}
              <div 
                ref={waveformContainerRef}
                className="relative w-full h-20 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden"
              />
                
              {/* Marcadores de tiempo */}
              <div className="relative w-full h-4 flex items-center justify-between mt-1">
                {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                  <div key={i} className="absolute text-xs text-muted-foreground" style={{ left: `${(i / duration) * 100}%` }}>
                    {formatTime(i)}
                  </div>
                ))}
              </div>
                
              {/* Indicador de tiempo actual */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-20 pointer-events-none"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute -top-6 -translate-x-1/2 px-2 py-1 rounded bg-orange-500 text-white text-xs">
                  {formatTimecode(currentTime)}
                </div>
              </div>
                
              {/* Indicador de tiempo hover */}
              {isWaveformHovered && hoveredTime !== null && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-r from-orange-400/60 to-orange-500/60 z-10 rounded-full backdrop-blur-sm"
                  style={{
                    left: `${(hoveredTime / duration) * 100}%`,
                    pointerEvents: 'none'
                  }}
                >
                  <div className="absolute -top-6 -translate-x-1/2 px-2 py-1 rounded bg-orange-500 text-white text-xs">
                    {formatTimecode(hoveredTime)}
                  </div>
                </div>
              )}
              
              {/* Regiones para visualizar clips */}
              <div className="absolute top-0 left-0 right-0 h-20 z-10 pointer-events-none">
                {clips.map((clip) => (
                  <div
                    key={`region-${clip.id}`}
                    className={cn(
                      "absolute h-full border-l-2 border-r-2 border-orange-500/60 rounded",
                      selectedClip === clip.id ? 
                        "bg-gradient-to-br from-orange-500/30 to-orange-600/20 shadow-md shadow-orange-500/10" : 
                        "bg-gradient-to-br from-orange-400/15 to-orange-500/10"
                    )}
                    style={{
                      left: `${(clip.start / duration) * 100}%`,
                      width: `${(clip.duration / duration) * 100}%`,
                      transition: "background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease",
                      transform: selectedClip === clip.id ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    {/* Barra superior con título y tipo de clip */}
                    <div 
                      className={cn(
                        "absolute top-0 left-0 w-full text-center text-xs font-medium truncate px-1.5 py-0.5 rounded-t",
                        selectedClip === clip.id ? 
                          "bg-orange-500 text-white" : 
                          "bg-white/80 dark:bg-black/60 text-orange-600"
                      )}
                    >
                      {clip.title || `Clip ${clip.id}`}
                    </div>
                    
                    {/* Miniatura de forma de onda si está disponible */}
                    {waveformData.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-10 px-1 flex items-center">
                        <div className="w-full h-8 flex items-center">
                          {clip.effectType && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[10px] text-orange-700/50 whitespace-nowrap font-medium">
                              {clip.effectType === 'blur' && 'Desenfoque'}
                              {clip.effectType === 'glow' && 'Resplandor'}
                              {clip.effectType === 'sepia' && 'Sepia'}
                              {clip.effectType === 'grayscale' && 'Gris'}
                              {clip.effectType === 'saturation' && 'Saturación'}
                              {clip.effectType === 'custom' && 'Efecto'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Indicador de transición */}
                    {clip.transitionType && (
                      <div className="absolute bottom-1 right-1 bg-orange-500/80 rounded-full p-0.5 shadow-sm">
                        <div className="w-3 h-3 flex items-center justify-center">
                          {clip.transitionType === 'crossfade' && <Layers className="w-2 h-2 text-white" />}
                          {clip.transitionType === 'wipe' && <ArrowRightIcon className="w-2 h-2 text-white" />}
                          {clip.transitionType === 'fade' && <Film className="w-2 h-2 text-white" />}
                          {clip.transitionType === 'slide' && <ArrowLeftRight className="w-2 h-2 text-white" />}
                          {clip.transitionType === 'zoom' && <ZoomIn className="w-2 h-2 text-white" />}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Versión alternativa de forma de onda para respaldo */}
            {waveformData.length > 0 && !audioBuffer && (
              <div
                className="absolute left-0 right-0 h-24 mt-8"
                onMouseEnter={() => setIsWaveformHovered(true)}
                onMouseLeave={() => {
                  setIsWaveformHovered(false);
                  setHoveredTime(null);
                }}
                onMouseMove={handleWaveformMouseMove}
              >
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/10" />
                  <svg
                    width="100%"
                    height="100%"
                    preserveAspectRatio="none"
                    className="relative z-10"
                  >
                    <defs>
                      <linearGradient id="waveformGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>

                    <path
                      d={`M 0 ${48} ${waveformData.map((value, i) =>
                        `L ${(i / waveformData.length) * timelineWidth} ${48 - value.max * 48}`
                      ).join(' ')}`}
                      stroke="url(#waveformGradient)"
                      strokeWidth="2"
                      fill="none"
                    />

                    <path
                      d={`M 0 ${48} ${waveformData.map((value, i) =>
                        `L ${(i / waveformData.length) * timelineWidth} ${48 + value.min * 48}`
                      ).join(' ')}`}
                      stroke="url(#waveformGradient)"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>

                  {isWaveformHovered && hoveredTime !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-r from-orange-400/60 to-orange-500/60 z-10 rounded-full backdrop-blur-sm"
                      style={{
                        left: `${timeToPixels(hoveredTime)}px`,
                        pointerEvents: 'none'
                      }}
                    >
                      <div className="absolute -top-6 -translate-x-1/2 px-2 py-1 rounded bg-orange-500 text-white text-xs">
                        {formatTimecode(hoveredTime)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Clips de la línea de tiempo */}
            <div className="mt-36">
              <AnimatePresence>
                {clips.map((clip) => (
                  <motion.div
                    key={clip.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      "absolute h-32 rounded-md overflow-hidden border cursor-move",
                      selectedClip === clip.id ? "ring-2 ring-orange-500" : "",
                      isDragging && selectedClip === clip.id ? "opacity-70" : ""
                    )}
                    style={{
                      left: `${timeToPixels(clip.start)}px`,
                      width: `${timeToPixels(clip.duration)}px`,
                      top: '8px'
                    }}
                    onMouseDown={(e) => handleClipDragStart(clip.id, e)}
                    onDoubleClick={() => handleClipDoubleClick(clip)}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-orange-500/20 z-10"
                      onMouseDown={(e) => handleResizeStart(clip.id, 'start', e)}
                    />
                    <div
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-orange-500/20 z-10"
                      onMouseDown={(e) => handleResizeStart(clip.id, 'end', e)}
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-500/10" />

                    {clip.thumbnail && (
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-70 hover:opacity-90 transition-opacity"
                      />
                    )}

                    <div className="absolute inset-0 p-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-black/40 backdrop-blur-sm p-1 rounded flex items-center gap-1">
                              <ImageIcon className="h-3 w-3 text-white" />
                              <span className="text-[10px] font-medium text-white">
                                {clip.shotType || 'Sin tipo'}
                              </span>
                            </div>
                            {clip.lipsyncApplied && (
                              <div className="bg-blue-500/70 backdrop-blur-sm p-1 rounded flex items-center gap-1">
                                <span className="text-[10px] font-medium text-white">LipSync</span>
                              </div>
                            )}
                          </div>
                          {onRegenerateImage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRegenerateImage(clip.id);
                              }}
                            >
                              <RefreshCw className="h-3 w-3 text-white" />
                            </Button>
                          )}
                        </div>
                        <div className="bg-black/40 backdrop-blur-sm p-1 rounded max-w-full">
                          <p className="text-[10px] text-white/90 line-clamp-2">
                            {clip.imagePrompt || clip.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white bg-black/40 backdrop-blur-sm p-1 rounded">
                          {formatTimecode(clip.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClipDoubleClick(clip);
                          }}
                        >
                          <PictureInPicture className="h-3 w-3 text-white" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Cabeza de reproducción estilo CapCut profesional */}
            <motion.div
              animate={playheadAnimation}
              className="absolute top-0 bottom-0 w-[3px] bg-gradient-to-r from-orange-600 to-orange-400 shadow-lg shadow-orange-500/30 z-50 rounded-full backdrop-blur-[1px]"
              initial={{ x: 0 }}
              transition={{ 
                type: "spring", 
                damping: 20, 
                stiffness: 100, 
                mass: 0.5 
              }}
            >
              {/* Marcador superior con efecto de pulso y glow mejorado */}
              <div className="absolute -top-1 -left-[5px] w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/50 border-2 border-orange-600/80 animate-pulse"></div>
              <div className="absolute -top-[5px] -left-[8px] w-5 h-5 bg-orange-400/20 rounded-full blur-[2px] animate-ping"></div>
              
              {/* Línea de tiempo actual con formato profesional */}
              <div className="absolute -top-10 -translate-x-1/2 px-2 py-1 rounded bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-medium min-w-[70px] text-center shadow-md">
                {formatTimecode(currentTime)}
              </div>
              
              {/* Punteros de inicio y fin */}
              <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full" />
              <div className="absolute bottom-0 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full" />
            </motion.div>
          </div>
        )}
      </ScrollArea>

      {/* Diálogo de vista previa de imagen */}
      <Dialog open={selectedImagePreview !== null} onOpenChange={() => setSelectedImagePreview(null)}>
        <DialogContent className="sm:max-w-[90vw] sm:h-[90vh] flex flex-col p-0">
          <DialogTitle className="sr-only">Vista previa de imagen</DialogTitle>
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setSelectedImagePreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative w-full h-full flex items-center justify-center bg-black/50 p-4">
              {selectedImagePreview?.thumbnail ? (
                <img
                  src={selectedImagePreview.thumbnail}
                  alt={selectedImagePreview.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                  <p className="mt-2">No hay imagen disponible</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">{selectedImagePreview?.shotType}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedImagePreview?.imagePrompt || selectedImagePreview?.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  {onRegenerateImage && selectedImagePreview && (
                    <Button
                      variant="default"
                      onClick={() => {
                        onRegenerateImage(selectedImagePreview.id);
                        setSelectedImagePreview(null);
                      }}
                      className="shrink-0 bg-orange-500 hover:bg-orange-600"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerar Imagen
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedImagePreview?.thumbnail) {
                        const link = document.createElement("a");
                        link.href = selectedImagePreview.thumbnail;
                        link.download = `${selectedImagePreview.shotType || 'imagen'}-${selectedImagePreview.id}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    className="shrink-0"
                    disabled={!selectedImagePreview?.thumbnail}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Imagen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function formatTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // Asumiendo 30fps
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}