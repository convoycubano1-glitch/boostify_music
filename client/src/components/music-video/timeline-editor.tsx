import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Music, Image as ImageIcon, Video, Edit, RefreshCw, X, 
  PictureInPicture, MoreHorizontal, Save, Maximize2, Minimize2,
  Scissors, ArrowLeftRight, Film, Wand2, Layers, Plus, 
  CornerUpLeft, CornerUpRight, ArrowUpDown, Sparkles,
  ArrowRight, Sunset, MoveHorizontal, ArrowRight as ArrowRightIcon,
  Text, Type, BringToFront, SendToBack, Lock, Unlock, AudioLines,
  LineChart, BarChart4, Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import WaveSurfer from 'wavesurfer.js';
import interact from 'interactjs';

/**
 * Interfaz para clips de línea de tiempo con soporte para múltiples capas
 * Estructura profesional inspirada en editores como CapCut y Premiere
 */
export interface TimelineClip {
  id: number;
  start: number;
  duration: number;
  // Tipo de clip con soporte para múltiples formatos
  type: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text';
  // Layer al que pertenece: 0=audio, 1=video/imagen, 2=texto, 3=efectos
  layer: number;
  // Propiedades visuales
  thumbnail?: string;
  title: string;
  description?: string;
  waveform?: number[];
  imagePrompt?: string;
  shotType?: string;
  // Propiedades de visibilidad y bloqueo
  visible?: boolean;
  locked?: boolean;
  // Nuevas propiedades para sistema de placeholders
  isPlaceholder?: boolean;
  pendingGeneration?: boolean;
  placeholderType?: 'image' | 'video' | 'audio' | 'text';
  // Límite de duración (importante para clips AI, 5 segundos máximo)
  maxDuration?: number;
  // Indicador para capas aisladas (como audio)
  isIsolated?: boolean;
  generationPrompt?: string;
  // Propiedades para capas aisladas (audio debe estar aislado)
  isIsolated?: boolean;
  maxDuration?: number; // Para limitar clips a máximo 5 segundos
  // URLs de recursos
  imageUrl?: string;
  videoUrl?: string;
  movementUrl?: string;
  audioUrl?: string;
  // DEPRECADO: Estas propiedades están siendo migradas a metadata.lipsync
  // Mantener por retrocompatibilidad, pero usar metadata.lipsync en su lugar
  lipsyncApplied?: boolean; 
  lipsyncVideoUrl?: string;
  lipsyncProgress?: number;
  // Propiedades de transición
  transitionType?: 'crossfade' | 'wipe' | 'fade' | 'slide' | 'zoom';
  transitionDuration?: number;
  // Propiedades de efecto
  effectType?: 'blur' | 'glow' | 'sepia' | 'grayscale' | 'saturation' | 'custom';
  effectIntensity?: number;
  // Propiedades de texto
  textContent?: string;
  textStyle?: 'normal' | 'bold' | 'italic' | 'title' | 'subtitle' | 'caption';
  textColor?: string;
  // Metadatos adicionales
  metadata?: {
    section?: string;    // Sección musical (coro, verso, etc.)
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    faceSwapApplied?: boolean;
    musicianIntegrated?: boolean;
    sourceIndex?: number; // Índice en el guion original
    // Propiedades de sincronización de labios en metadata
    lipsync?: {
      applied: boolean;
      videoUrl?: string;
      progress?: number;
      timestamp?: string;
    };
  };
}

// Interfaz para los datos de beat detectados
export interface BeatData {
  time: number;      // Tiempo en segundos
  timecode: string;  // Timecode formateado
  energy: number;    // Nivel de energía
  intensity: number; // Intensidad normalizada (0-1)
  type: string;      // Tipo de beat (downbeat, accent, beat)
  isDownbeat: boolean; // Si es un beat principal o secundario
}

// Interfaz para metadata de beatMap
export interface BeatMapMetadata {
  songTitle?: string;
  artist?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  complexity?: string;
  generatedAt?: string;
  beatAnalysis?: {
    totalBeats?: number;
    beatTypes?: {
      downbeats?: number;
      accents?: number;
      regularBeats?: number;
    };
    averageInterval?: number;
    patternComplexity?: string;
  };
}

// Interfaz para el mapa completo de beats
export interface BeatMap {
  metadata: BeatMapMetadata;
  beats: BeatData[];
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
  beatsData?: BeatMap; // Datos de beats para visualización avanzada
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
  onSplitClip,
  beatsData
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
  
  // Estados para gestión de capas
  const [visibleLayers, setVisibleLayers] = useState<number[]>([0, 1, 2, 3]); // Todas las capas visibles por defecto
  const [lockedLayers, setLockedLayers] = useState<number[]>([]); // Ninguna capa bloqueada por defecto
  const [layerManagerOpen, setLayerManagerOpen] = useState(false);
  
  // Configuración de posicionamiento de capas para evitar superposición
  const layerConfig = {
    0: { 
      name: 'Audio', 
      color: 'bg-orange-500/20', 
      top: 'top-4', 
      height: 'h-16', 
      border: 'border-orange-400',
      isLocked: true, // Audio siempre bloqueado por defecto
      isIsolated: true // Capa aislada para evitar modificaciones accidentales
    },
    1: { 
      name: 'Imágenes', 
      color: 'bg-blue-500/20', 
      top: 'top-24', 
      height: 'h-20', 
      border: 'border-blue-400',
      isPlaceholder: true // Indicar que esta capa contendrá placeholders para generación de AI
    },
    2: { 
      name: 'Texto', 
      color: 'bg-violet-500/20', 
      top: 'top-48', 
      height: 'h-14', 
      border: 'border-violet-400' 
    },
    3: { 
      name: 'Efectos', 
      color: 'bg-emerald-500/20', 
      top: 'top-66', 
      height: 'h-14', 
      border: 'border-emerald-400' 
    }
  };

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

  // Efecto para la animación del cursor de reproducción (mejorado para fluidez profesional)
  useEffect(() => {
    const playheadPosition = timeToPixels(currentTime);
    
    // Usar requestAnimationFrame para animaciones más suaves y eficientes
    const animatePlayhead = () => {
      if (isPlaying) {
        // Usar animación de framer-motion con valores optimizados
        playheadAnimation.start({
          x: playheadPosition,
          transition: {
            duration: 0.05, // Reducido para mayor precisión
            ease: "linear", // Movimiento constante para reproducción fluida
            type: "tween"
          }
        });
        
        // Auto-scroll optimizado con debounce implícito
        if (scrollAreaRef.current) {
          const scrollLeft = scrollAreaRef.current.scrollLeft;
          const clientWidth = scrollAreaRef.current.clientWidth;
          const threshold = clientWidth * 0.25; // Umbral ampliado para anticipar mejor
          
          // Scroll profesional estilo CapCut/Premiere
          if (playheadPosition > scrollLeft + clientWidth - threshold) {
            // Borde derecho - scroll anticipado
            const targetScroll = playheadPosition - (clientWidth * 0.6);
            scrollAreaRef.current.scrollTo({
              left: targetScroll,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
          } else if (playheadPosition < scrollLeft + threshold && scrollLeft > 0) {
            // Borde izquierdo - scroll anticipado
            const targetScroll = Math.max(0, playheadPosition - (clientWidth * 0.4));
            scrollAreaRef.current.scrollTo({
              left: targetScroll,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
          }
        }
      } else {
        // Posicionamiento instantáneo cuando no está reproduciendo
        playheadAnimation.set({ x: playheadPosition });
      }
    };
    
    // Ejecutar la animación
    animatePlayhead();
    
  }, [currentTime, isPlaying, playheadAnimation, timeToPixels, scrollPosition]);

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
    
    // Limpiar instancia anterior de WaveSurfer si existe con manejo de errores mejorado
    if (wavesurferRef.current) {
      try {
        // Verificamos si la instancia actual está lista antes de intentar destruirla
        const currentInstance = wavesurferRef.current;
        
        // Primero desregistramos todos los event listeners para evitar fugas de memoria
        if (typeof currentInstance.unAll === 'function') {
          currentInstance.unAll();
        }
        
        // Usamos un pequeño timeout para asegurar que cualquier operación pendiente se complete
        setTimeout(() => {
          try {
            // Verificamos de nuevo que la instancia exista antes de destruirla
            if (currentInstance && typeof currentInstance.destroy === 'function') {
              currentInstance.destroy();
            }
          } catch (destroyErr) {
            console.warn("Error al destruir WaveSurfer:", destroyErr);
          }
        }, 0);
      } catch (err) {
        console.warn("Error al limpiar instancia WaveSurfer previa:", err);
      }
      
      // Marcamos la referencia como null inmediatamente para evitar accesos adicionales
      wavesurferRef.current = null;
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
          // Guardamos una referencia local para evitar problemas de ciclo de vida
          const currentInstance = wavesurferRef.current;
          
          // Verificamos que los métodos estén disponibles antes de llamarlos
          if (typeof currentInstance.unAll === 'function') {
            currentInstance.unAll();
          }
          
          // Usamos un timeout para asegurar que cualquier operación pendiente se complete
          setTimeout(() => {
            try {
              if (currentInstance && typeof currentInstance.destroy === 'function') {
                currentInstance.destroy();
              }
            } catch (destroyErr) {
              console.warn("Error en cleanup de WaveSurfer:", destroyErr);
            }
          }, 0);
          
          // Marcamos la referencia como null inmediatamente
          wavesurferRef.current = null;
        }
      } catch (err) {
        console.warn("Error en limpieza segura de WaveSurfer:", err);
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

  // Configuración de interactjs para arrastrar y soltar clips
  useEffect(() => {
    // Verificamos que el DOM esté listo
    if (!timelineRef.current) return;

    // Función para configurar las interacciones
    const setupInteractions = () => {
      // Verificar que interactjs esté disponible
      if (typeof interact === 'undefined') {
        console.warn('Interact.js no está disponible');
        return;
      }

      try {
        // Primero limpiamos cualquier configuración previa
        interact('.timeline-clip').unset();
      } catch (error) {
        console.warn('Error al limpiar interacciones anteriores:', error);
      }

      try {
        // Configurar interactjs para arrastrar clips
        interact('.timeline-clip')
          .draggable({
            inertia: false,
            modifiers: [
              interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
              })
            ],
            listeners: {
              start: (event) => {
                const clipId = Number(event.target.getAttribute('data-clip-id'));
                const clip = clips.find((c) => c.id === clipId);
                if (clip) {
                  setIsDragging(true);
                  setSelectedClip(clipId);
                  setClipStartTime(clip.start);
                  event.target.classList.add('dragging');
                }
              },
              move: (event) => {
                if (!isDragging || selectedClip === null) return;
                
                const deltaPixels = event.dx;
                const deltaTime = pixelsToTime(deltaPixels);
                const newStartTime = Math.max(0, clipStartTime + deltaTime);
                
                // Asegurar que los clips no se superpongan inadecuadamente
                const selectedClipObj = clips.find(c => c.id === selectedClip);
                if (selectedClipObj) {
                  // Buscar el clip anterior y asegurar que no haya solapamiento
                  const previousClips = clips
                    .filter(c => c.id !== selectedClip)
                    .filter(c => c.start < newStartTime)
                    .sort((a, b) => b.start - a.start);
                  
                  const previousClip = previousClips[0];
                  if (previousClip) {
                    const minStartTime = previousClip.start + previousClip.duration;
                    if (newStartTime < minStartTime) {
                      // Snap to previous clip end
                      onClipUpdate(selectedClip, {
                        start: minStartTime
                      });
                      return;
                    }
                  }
                }
                
                onClipUpdate(selectedClip, {
                  start: newStartTime
                });
              },
              end: (event) => {
                event.target.classList.remove('dragging');
                setIsDragging(false);
                setClipStartTime(0);
              }
            }
          })
          .resizable({
            edges: { left: true, right: true, bottom: false, top: false },
            inertia: false,
            modifiers: [
              interact.modifiers.restrictSize({
                min: { width: 10, height: 0 }
              })
            ],
            listeners: {
              start: (event) => {
                const clipId = Number(event.target.getAttribute('data-clip-id'));
                const clip = clips.find((c) => c.id === clipId);
                if (clip) {
                  setSelectedClip(clipId);
                  const resizeEdge = event.edges.left ? 'start' : 'end';
                  setResizingSide(resizeEdge);
                  setClipStartTime(clip.start);
                  event.target.classList.add('resizing');
                }
              },
              move: (event) => {
                if (selectedClip === null || !resizingSide) return;
                
                const clip = clips.find((c) => c.id === selectedClip);
                if (!clip) return;
                
                // Máxima duración permitida para un clip (5 segundos)
                const MAX_CLIP_DURATION = 5.0;
                
                if (resizingSide === 'start') {
                  // Redimensionar desde el inicio
                  const deltaWidth = event.deltaRect.left;
                  const deltaTime = pixelsToTime(deltaWidth);
                  const newStart = Math.max(0, clip.start - deltaTime);
                  
                  // Calcular nueva duración
                  let newDuration = clip.duration + (clip.start - newStart);
                  
                  // Si excede el límite, ajustar el tiempo de inicio para mantener la duración máxima
                  if (newDuration > MAX_CLIP_DURATION) {
                    // Calcular nuevo tiempo de inicio para respetar el límite
                    const adjustedStart = (clip.start + clip.duration) - MAX_CLIP_DURATION;
                    newDuration = MAX_CLIP_DURATION;
                    
                    onClipUpdate(selectedClip, {
                      start: Math.max(0, adjustedStart),
                      duration: newDuration
                    });
                  } else {
                    // Actualizar normalmente si no excede el límite
                    onClipUpdate(selectedClip, {
                      start: newStart,
                      duration: Math.max(0.5, newDuration)
                    });
                  }
                } else {
                  // Redimensionar desde el final
                  const deltaWidth = event.deltaRect.right;
                  const deltaTime = pixelsToTime(deltaWidth);
                  
                  // Calcular nueva duración respetando el límite máximo
                  const newDuration = Math.min(
                    MAX_CLIP_DURATION,
                    Math.max(0.5, clip.duration + deltaTime)
                  );
                  
                  onClipUpdate(selectedClip, {
                    duration: newDuration
                  });
                }
              },
              end: (event) => {
                event.target.classList.remove('resizing');
                setResizingSide(null);
              }
            }
          });
      } catch (error) {
        console.error('Error al configurar interacciones con interact.js:', error);
      }
    };

    // Configurar las interacciones
    setupInteractions();
    
    // Limpiar al desmontar
    return () => {
      if (typeof interact !== 'undefined') {
        try {
          interact('.timeline-clip').unset();
        } catch (error) {
          console.warn('Error al limpiar interacciones:', error);
        }
      }
    };
  }, [clips, zoom, pixelsToTime, clipStartTime, onClipUpdate]);
  
  // Mantener funciones de fallback por compatibilidad
  const handleClipDragStart = (clipId: number, e: React.MouseEvent) => {
    // Esta función ahora es solo un fallback, principalmente gestionada por interactjs
    try {
      // Eliminamos la verificación problemática de interact.isSet
      e.preventDefault();
      const clip = clips.find(c => c.id === clipId);
      if (clip) {
        setIsDragging(true);
        setSelectedClip(clipId);
        setDragStartX(e.clientX);
        setClipStartTime(clip.start);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    } catch (error) {
      console.error("Error al iniciar arrastre del clip:", error);
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

    // Máxima duración permitida para un clip (5 segundos)
    const MAX_CLIP_DURATION = 5.0;
    
    const deltaX = e.clientX - dragStartX;
    const deltaTime = pixelsToTime(deltaX);

    if (resizingSide === 'start') {
      const newStart = Math.max(0, clipStartTime + deltaTime);
      
      // Calcular nueva duración
      let newDuration = (clip.start + clip.duration) - newStart;
      
      // Si excede el límite, ajustar el tiempo de inicio para mantener la duración máxima
      if (newDuration > MAX_CLIP_DURATION) {
        // Calcular nuevo tiempo de inicio para respetar el límite
        const adjustedStart = (clip.start + clip.duration) - MAX_CLIP_DURATION;
        
        onClipUpdate(selectedClip, {
          start: Math.max(0, adjustedStart),
          duration: MAX_CLIP_DURATION
        });
      } else {
        // Actualizar normalmente si no excede el límite
        onClipUpdate(selectedClip, {
          start: newStart,
          duration: Math.max(0.5, newDuration)
        });
      }
    } else {
      // Calcular nueva duración respetando el límite máximo
      const newDuration = Math.min(
        MAX_CLIP_DURATION,
        Math.max(0.5, clip.duration + deltaTime)
      );
      
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
      {/* Panel de Análisis de Patrones Rítmicos - Versión Simplificada */}
      {beatsData && beatsData.beats && beatsData.beats.length > 0 && (
        <div className="bg-background/80 backdrop-blur-sm rounded-lg border p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center">
              <BarChart4 className="h-4 w-4 mr-1.5 text-orange-500" />
              Análisis de Patrones Rítmicos
            </h3>
            <div className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-medium">
              {beatsData.metadata?.bpm || "--"} BPM
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
            <div className="bg-muted/50 p-2 rounded">
              <div className="text-xs text-muted-foreground mb-1">Distribución de Beats</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs">Downbeat</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">Accent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs">Beat</span>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-2 rounded">
              <div className="text-xs text-muted-foreground mb-1">Complejidad</div>
              <div className="flex items-center justify-between">
                <div className={cn(
                  "px-2 py-0.5 rounded text-xs", 
                  (beatsData.metadata?.beatAnalysis?.patternComplexity === "Alta" || 
                   beatsData.metadata?.complexity === "Alta") 
                    ? "bg-red-50 text-red-700" :
                  (beatsData.metadata?.beatAnalysis?.patternComplexity === "Media" || 
                   beatsData.metadata?.complexity === "Media")
                    ? "bg-yellow-50 text-yellow-700" :
                    "bg-blue-50 text-blue-700"
                )}>
                  {beatsData.metadata?.beatAnalysis?.patternComplexity || 
                   beatsData.metadata?.complexity || "Normal"}
                </div>
                <span className="text-xs text-muted-foreground">
                  {beatsData.beats.length} beats detectados
                </span>
              </div>
            </div>
            
            <div className="bg-muted/50 p-2 rounded">
              <div className="text-xs text-muted-foreground mb-1">Compás y Timing</div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium">
                  {beatsData.metadata?.timeSignature || "4/4"}
                </div>
                <div className="text-xs">
                  {beatsData.metadata?.beatAnalysis?.averageInterval 
                    ? `Intervalo: ${beatsData.metadata.beatAnalysis.averageInterval.toFixed(2)}s` 
                    : "Intervalo: --"}
                </div>
              </div>
            </div>
          </div>
          
          {/* Gráfico simplificado de intensidad de beats - mostrando solo una muestra limitada para mejor rendimiento */}
          <div className="h-8 w-full bg-muted/30 rounded-md overflow-hidden relative">
            <div className="absolute inset-0 flex items-end">
              {beatsData.beats.slice(0, 100).map((beat, idx) => {
                const intensity = beat.energy || beat.intensity || 0.5;
                const height = `${Math.max(20, Math.min(100, intensity * 100))}%`;
                const beatColor = beat.type === 'downbeat' 
                  ? 'bg-red-500' 
                  : beat.type === 'accent'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500';
                
                return (
                  <div 
                    key={`graph-beat-${idx}`}
                    className={`${beatColor} w-1 mx-[1px] opacity-80`}
                    style={{ height }}
                  />
                );
              })}
            </div>
            <div className="absolute inset-0 border-t border-dashed border-muted-foreground/20 top-1/2"></div>
          </div>
        </div>
      )}
      
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
                    onClick={() => setLayerManagerOpen(true)}
                    className="border-orange-500/30"
                  >
                    <Layers className="h-4 w-4 text-orange-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gestionar capas</p>
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
            {/* Sistema de capas para editor profesional multitrack */}
            <div className="flex flex-col">
              {/* Cabeceras de capas */}
              <div className="flex h-6 border-b items-center bg-background/95 sticky top-0 z-30 backdrop-blur-sm">
                <div className="flex-shrink-0 w-40 pl-3 border-r h-full flex items-center">
                  <span className="text-xs font-medium">Capas</span>
                </div>
                {/* Escala de tiempo */}
                <div className="flex-1 flex">
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
              </div>
              
              {/* Capa de Audio */}
              <div className="flex border-b">
                <div className="flex-shrink-0 w-40 pl-3 py-1 border-r h-24 flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded bg-orange-100 dark:bg-orange-950/60">
                      <AudioLines className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-xs font-medium">Audio Principal</span>
                  </div>
                </div>
                
                {/* Área de la forma de onda para audio */}
                <div
                  className="flex-1 relative h-24"
                  onMouseEnter={() => setIsWaveformHovered(true)}
                  onMouseLeave={() => {
                    setIsWaveformHovered(false);
                    setHoveredTime(null);
                  }}
                  onMouseMove={handleWaveformMouseMove}
                  onClick={handleTimelineClick}
                >
                  {/* Fondo de capa con patrón sutil */}
                  <div className="absolute inset-0 bg-orange-50/50 dark:bg-orange-950/10 bg-[radial-gradient(#f97316_0.5px,transparent_0.5px)] [background-size:10px_10px]"></div>
                  
                  {/* Contenedor para WaveSurfer */}
                  <div 
                    ref={waveformContainerRef}
                    className="relative w-full h-20 bg-transparent rounded-md overflow-hidden mt-2"
                  />
                  
                  {/* Visualización de Beats mejorada - Estilo profesional de edición de video */}
                  {beatsData && beatsData.beats && beatsData.beats.length > 0 && (
                    <>
                      {/* Beat visualization in timeline - Inspirado en editores profesionales */}
                      <div className="absolute top-0 left-0 w-full h-10 pointer-events-none">
                        {beatsData.beats.map((beat, index) => {
                          // Determinar colores según tipo de beat (estilo profesional)
                          const beatColor = beat.type === 'downbeat' 
                            ? 'bg-red-500 dark:bg-red-600' 
                            : beat.type === 'accent'
                              ? 'bg-yellow-500 dark:bg-yellow-600'
                              : 'bg-blue-500 dark:bg-blue-600';
                          
                          // Altura basada en intensidad (0-1) con escala profesional
                          const heightPercentage = Math.max(20, Math.min(100, beat.intensity * 100));
                          const height = `${heightPercentage}%`;
                          
                          // Ancho variable basado en tipo de beat (estilo profesional)
                          const width = beat.type === 'downbeat' ? 2 : 1;
                          
                          // Calcular si este beat coincide con un clip (para sugerir edición basada en beats)
                          const clipStartsAtBeat = clips.find(clip => 
                            Math.abs(clip.start - beat.time) < 0.05
                          );
                          
                          const clipEndsAtBeat = clips.find(clip => 
                            Math.abs((clip.start + clip.duration) - beat.time) < 0.05
                          );
                          
                          // Destacar visuales para beats que son puntos de corte potenciales
                          const isCutPoint = beat.type === 'downbeat' || (beat.type === 'accent' && beat.intensity > 0.65);
                          const isBeatFourCount = (index % 4 === 0); // Destacar cada 4 beats (estructura musical común)
                          
                          // Highlight especial para cambios de sección musical (estilo profesional)
                          const isDownbeatHighlight = beat.type === 'downbeat' && beat.intensity > 0.8;
                          
                          return (
                            <div 
                              key={`beat-${index}`} 
                              className={`absolute bottom-0 ${beatColor} opacity-90 hover:opacity-100 rounded-t shadow-sm 
                                         ${isCutPoint ? 'border-t border-white/30' : ''} 
                                         ${isDownbeatHighlight ? 'animate-pulse' : ''}
                                         ${clipStartsAtBeat ? 'ring-1 ring-white' : ''}
                                         ${clipEndsAtBeat ? 'ring-1 ring-green-300' : ''}
                                         transition-all duration-75 hover:scale-110`}
                              style={{
                                height,
                                width: `${width}px`,
                                left: `${timeToPixels(beat.time)}px`,
                                transform: 'translateX(-50%)',
                                zIndex: beat.type === 'downbeat' ? 3 : beat.type === 'accent' ? 2 : 1
                              }}
                              title={`${beat.type} - ${beat.timecode} - Energía: ${beat.energy.toFixed(2)}${
                                isCutPoint ? ' - Punto de corte recomendado' : ''
                              }${
                                isBeatFourCount ? ' - Beat estructural' : ''
                              }${
                                clipStartsAtBeat ? ' - Inicio de clip' : ''
                              }${
                                clipEndsAtBeat ? ' - Fin de clip' : ''
                              }`}
                            >
                              {/* Indicador numérico para beats importantes (editores profesionales) */}
                              {(isBeatFourCount || beat.type === 'downbeat') && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[8px] font-mono 
                                              bg-background/70 rounded px-1 whitespace-nowrap">
                                  {(index + 1).toString().padStart(2, '0')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Líneas de grid para estructura musical (estilo profesional) */}
                        {beatsData.metadata?.bpm && beatsData.beats.length > 8 && (
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Crear líneas de grid cada 4 beats para estructura musical */}
                            {beatsData.beats
                              .filter((_, i) => i % 16 === 0) // Cada 16 beats = típicamente 4 compases en 4/4
                              .map((beat, i) => (
                                <div
                                  key={`grid-${i}`}
                                  className="absolute top-0 bottom-0 border-l border-dashed border-orange-500/30 dark:border-orange-400/20"
                                  style={{
                                    left: `${timeToPixels(beat.time)}px`,
                                  }}
                                />
                              ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Leyenda de tipos de beat - Mejorada con información musical */}
                      <div className="absolute top-1 right-3 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1.5 z-10 border shadow-sm">
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                              <span className="text-xs">Downbeat</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground">Cortes principales</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                              <span className="text-xs">Accent</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground">Transiciones</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                              <span className="text-xs">Beat</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground">Sincronización</span>
                          </div>
                          {beatsData.metadata?.bpm && (
                            <div className="flex flex-col items-center border-l pl-2">
                              <span className="font-medium text-xs">{beatsData.metadata.bpm} BPM</span>
                              <span className="text-[9px] text-muted-foreground">
                                {beatsData.metadata.timeSignature || "4/4"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Clips de audio en esta capa */}
                  <div className="absolute inset-0">
                    {clips
                      .filter(clip => clip.layer === 0 && visibleLayers.includes(0)) // Mostrar solo clips de la capa de audio visible
                      .map((clip) => (
                        <div
                          key={`audio-clip-${clip.id}`}
                          className={cn(
                            `absolute ${layerConfig[0].height} ${layerConfig[0].top} border rounded-sm overflow-hidden`,
                            selectedClip === clip.id ? "ring-2 ring-orange-500 border-orange-400" : "border-orange-300 dark:border-orange-700",
                            "bg-gradient-to-r from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20",
                            "cursor-move timeline-clip"
                          )}
                          style={{
                            left: `${timeToPixels(clip.start)}px`,
                            width: `${timeToPixels(clip.duration)}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClip(clip.id);
                          }}
                          onMouseDown={(e) => handleClipDragStart(clip.id, e)}
                        >
                          <div className="p-1 text-[10px] flex items-center justify-between">
                            <span className="font-medium truncate">{clip.title}</span>
                            <span className="text-muted-foreground">{formatTimecode(clip.duration)}</span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Capa de Imágenes */}
              <div className="flex border-b">
                <div className="flex-shrink-0 w-40 pl-3 py-1 border-r h-24 flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded bg-blue-100 dark:bg-blue-950/60">
                      <ImageIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium">Imágenes</span>
                  </div>
                </div>
                
                {/* Área de clips de imágenes */}
                <div className="flex-1 relative h-24">
                  {/* Fondo de capa con patrón sutil */}
                  <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-950/10 bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:10px_10px]"></div>
                  
                  {/* Clips de imágenes en esta capa */}
                  <div className="absolute inset-0">
                    {clips
                      .filter(clip => clip.layer === 1 && visibleLayers.includes(1)) // Mostrar solo clips de la capa de imágenes visible
                      .map((clip, idx, filteredClips) => {
                        // Identificar si es el primer o último clip para resaltar visualmente
                        const isFirstClip = idx === 0;
                        const isLastClip = idx === filteredClips.length - 1;
                        
                        // Detectar si este clip está sincronizado con un beat (para estilo profesional)
                        const isSyncedWithBeat = beatsData?.beats?.some(beat => 
                          Math.abs(clip.start - beat.time) < 0.05 && beat.type === 'downbeat'
                        );
                        
                        // Determinar si hay un clip adyacente para transiciones
                        const hasNextClip = idx < filteredClips.length - 1;
                        const nextClip = hasNextClip ? filteredClips[idx + 1] : null;
                        const isConnectedToNext = hasNextClip && 
                          Math.abs((clip.start + clip.duration) - nextClip.start) < 0.05;
                        
                        // Determinar estilo de borde según posición y contexto
                        const borderStyle = isConnectedToNext 
                          ? "border-r-0" // Sin borde derecho si hay clip conectado
                          : "";
                        
                        // Determinar el tipo de clip basado en sus propiedades
                        const clipStyle = clip.shotType || (clip.metadata?.shotType || "normal");
                        
                        // Variable para guardar clases adicionales según el tipo de plano
                        let shotTypeClasses = "";
                        let shotTypeLabel = "";
                        
                        switch (clipStyle) {
                          case "close-up":
                            shotTypeClasses = "border-t-indigo-500";
                            shotTypeLabel = "Primer plano";
                            break;
                          case "medium":
                            shotTypeClasses = "border-t-green-500";
                            shotTypeLabel = "Plano medio";
                            break;
                          case "wide":
                            shotTypeClasses = "border-t-amber-500";
                            shotTypeLabel = "Plano general";
                            break;
                          case "transition":
                            shotTypeClasses = "border-t-pink-500 bg-gradient-to-r from-pink-100/30 to-blue-100/30";
                            shotTypeLabel = "Transición";
                            break;
                          default:
                            shotTypeClasses = "border-t-blue-500";
                            shotTypeLabel = "Normal";
                        }
                        
                        return (
                          <div
                            key={`image-clip-${clip.id}`}
                            className={cn(
                              `absolute ${layerConfig[1].height} ${layerConfig[1].top} border border-t-2 rounded-sm overflow-hidden`,
                              borderStyle,
                              shotTypeClasses,
                              selectedClip === clip.id 
                                ? "ring-2 ring-blue-500 border-blue-400 shadow-md" 
                                : "border-blue-300 dark:border-blue-700",
                              isSyncedWithBeat 
                                ? "border-l-red-500 border-l-2" 
                                : "",
                              "bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20",
                              "cursor-move hover:shadow-lg transition-shadow duration-150"
                            )}
                            style={{
                              left: `${timeToPixels(clip.start)}px`,
                              width: `${timeToPixels(clip.duration)}px`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClip(clip.id);
                            }}
                            onMouseDown={(e) => handleClipDragStart(clip.id, e)}
                          >
                            {/* Fondo del clip con efecto profesional */}
                            <div 
                              className="absolute inset-0 group-hover:scale-105 transition-transform duration-200"
                              style={{
                                backgroundImage: clip.thumbnail ? `url(${clip.thumbnail})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: 0.8
                              }}
                            />
                            
                            {/* Capa de gradiente para mejorar legibilidad */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60" />
                            
                            {/* Barra superior de información */}
                            <div className="absolute top-0 left-0 right-0 p-1 text-[10px] bg-black/60 text-white flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="font-medium truncate">
                                  {clip.title || `Clip ${clip.id}`}
                                </span>
                                {clip.lipsyncApplied && (
                                  <div className="ml-1 flex items-center bg-blue-500/70 px-1 rounded text-[8px]">
                                    LIPSYNC
                                  </div>
                                )}
                              </div>
                              <span>{formatTimecode(clip.duration)}</span>
                            </div>
                            
                            {/* Tipo de plano (información profesional) */}
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 rounded">
                              {shotTypeLabel}
                            </div>
                            
                            {/* Íconos indicadores de propiedades especiales */}
                            <div className="absolute bottom-1 right-1 flex space-x-1">
                              {clip.transitionType && (
                                <div className="bg-pink-500/80 rounded p-0.5 shadow-sm" title={`Transición: ${clip.transitionType}`}>
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    {clip.transitionType === 'crossfade' && <Layers className="w-2 h-2 text-white" />}
                                    {clip.transitionType === 'wipe' && <ArrowRightIcon className="w-2 h-2 text-white" />}
                                    {clip.transitionType === 'fade' && <Film className="w-2 h-2 text-white" />}
                                    {clip.transitionType === 'slide' && <ArrowLeftRight className="w-2 h-2 text-white" />}
                                    {clip.transitionType === 'zoom' && <ZoomIn className="w-2 h-2 text-white" />}
                                  </div>
                                </div>
                              )}
                              {clip.metadata?.movementApplied && (
                                <div className="bg-orange-500/80 rounded p-0.5 shadow-sm" title={`Movimiento: ${clip.metadata.movementPattern || 'Personalizado'}`}>
                                  <MoveHorizontal className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {isSyncedWithBeat && (
                                <div className="bg-green-500/80 rounded p-0.5 shadow-sm" title="Sincronizado con beat">
                                  <Music2 className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            
                            {/* Indicadores de posición en la secuencia */}
                            {isFirstClip && (
                              <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 h-4 w-1 bg-blue-500 rounded-l" />
                            )}
                            {isLastClip && (
                              <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 h-4 w-1 bg-blue-500 rounded-r" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
              
              {/* Capa de Texto */}
              <div className="flex border-b">
                <div className="flex-shrink-0 w-40 pl-3 py-1 border-r h-16 flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded bg-violet-100 dark:bg-violet-950/60">
                      <Type className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="text-xs font-medium">Texto</span>
                  </div>
                </div>
                
                {/* Área de clips de texto */}
                <div className="flex-1 relative h-16">
                  {/* Fondo de capa con patrón sutil */}
                  <div className="absolute inset-0 bg-violet-50/50 dark:bg-violet-950/10 bg-[radial-gradient(#8b5cf6_0.5px,transparent_0.5px)] [background-size:10px_10px]"></div>
                  
                  {/* Clips de texto en esta capa */}
                  <div className="absolute inset-0">
                    {clips
                      .filter(clip => clip.layer === 2 && visibleLayers.includes(2)) // Mostrar solo clips de la capa de texto visible
                      .map((clip) => (
                        <div
                          key={`text-clip-${clip.id}`}
                          className={cn(
                            `absolute ${layerConfig[2].height} ${layerConfig[2].top} border rounded-sm overflow-hidden`,
                            selectedClip === clip.id ? "ring-2 ring-violet-500 border-violet-400" : "border-violet-300 dark:border-violet-700",
                            "bg-gradient-to-r from-violet-100 to-violet-50 dark:from-violet-900/30 dark:to-violet-800/20",
                            "cursor-move timeline-clip"
                          )}
                          style={{
                            left: `${timeToPixels(clip.start)}px`,
                            width: `${timeToPixels(clip.duration)}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClip(clip.id);
                          }}
                          onMouseDown={(e) => handleClipDragStart(clip.id, e)}
                        >
                          <div className="p-1 text-[10px] flex items-center justify-between">
                            <span className="font-medium truncate">{clip.textContent || "Sin texto"}</span>
                            <span className="text-muted-foreground">{formatTimecode(clip.duration)}</span>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Marcadores de tiempo para móvil */}
              <div className="sm:hidden relative w-full h-4 flex items-center justify-between mt-1 px-4">
                {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                  <div key={i} className="absolute text-xs text-muted-foreground" style={{ left: `${(i / duration) * 100}%` }}>
                    {formatTime(i)}
                  </div>
                ))}
              </div>
              
              {/* Indicador de capa de audio con ícono */}
              <div className="absolute left-0 top-0 transform -translate-y-8 flex items-center bg-orange-100 dark:bg-orange-950/30 px-2 py-1 rounded-t-md">
                <AudioLines className="h-4 w-4 mr-1 text-orange-500" />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Audio</span>
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
                {clips.filter(clip => visibleLayers.includes(clip.layer)).map((clip) => (
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
                {clips.filter(clip => visibleLayers.includes(clip.layer)).map((clip) => (
                  <motion.div
                    key={clip.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                      "timeline-clip absolute h-32 rounded-md overflow-hidden border cursor-move",
                      selectedClip === clip.id ? "ring-2 ring-orange-500" : "",
                      isDragging && selectedClip === clip.id ? "opacity-70" : ""
                    )}
                    style={{
                      left: `${timeToPixels(clip.start)}px`,
                      width: `${timeToPixels(clip.duration)}px`,
                      top: '8px'
                    }}
                    data-clip-id={clip.id}
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
                            {(clip.metadata?.lipsync?.applied || clip.lipsyncApplied) && (
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

      {/* Diálogo de gestión de capas */}
      <Dialog open={layerManagerOpen} onOpenChange={setLayerManagerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Gestión de Capas</DialogTitle>
          
          <div className="grid gap-4 py-4">
            {/* Capa de Audio */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
                  <AudioLines className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Capas de Audio</h4>
                  <p className="text-xs text-muted-foreground">Pistas de audio, música y efectos sonoros</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={visibleLayers.includes(0) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (visibleLayers.includes(0)) {
                      setVisibleLayers(visibleLayers.filter(l => l !== 0));
                    } else {
                      setVisibleLayers([...visibleLayers, 0]);
                    }
                  }}
                >
                  {visibleLayers.includes(0) ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={lockedLayers.includes(0) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (lockedLayers.includes(0)) {
                      setLockedLayers(lockedLayers.filter(l => l !== 0));
                    } else {
                      setLockedLayers([...lockedLayers, 0]);
                    }
                  }}
                >
                  {lockedLayers.includes(0) ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Capa de Video/Imagen */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900">
                  <Film className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Capas de Video e Imagen</h4>
                  <p className="text-xs text-muted-foreground">Clips de video, imágenes y fondos</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={visibleLayers.includes(1) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (visibleLayers.includes(1)) {
                      setVisibleLayers(visibleLayers.filter(l => l !== 1));
                    } else {
                      setVisibleLayers([...visibleLayers, 1]);
                    }
                  }}
                >
                  {visibleLayers.includes(1) ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={lockedLayers.includes(1) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (lockedLayers.includes(1)) {
                      setLockedLayers(lockedLayers.filter(l => l !== 1));
                    } else {
                      setLockedLayers([...lockedLayers, 1]);
                    }
                  }}
                >
                  {lockedLayers.includes(1) ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Capa de Texto */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900">
                  <Type className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Capas de Texto</h4>
                  <p className="text-xs text-muted-foreground">Títulos, subtítulos y textos complementarios</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={visibleLayers.includes(2) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (visibleLayers.includes(2)) {
                      setVisibleLayers(visibleLayers.filter(l => l !== 2));
                    } else {
                      setVisibleLayers([...visibleLayers, 2]);
                    }
                  }}
                >
                  {visibleLayers.includes(2) ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={lockedLayers.includes(2) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (lockedLayers.includes(2)) {
                      setLockedLayers(lockedLayers.filter(l => l !== 2));
                    } else {
                      setLockedLayers([...lockedLayers, 2]);
                    }
                  }}
                >
                  {lockedLayers.includes(2) ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Capa de Efectos */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pink-100 dark:bg-pink-900">
                  <Sparkles className="h-4 w-4 text-pink-600 dark:text-pink-300" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">Capas de Efectos</h4>
                  <p className="text-xs text-muted-foreground">Efectos visuales, transiciones y animaciones</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={visibleLayers.includes(3) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (visibleLayers.includes(3)) {
                      setVisibleLayers(visibleLayers.filter(l => l !== 3));
                    } else {
                      setVisibleLayers([...visibleLayers, 3]);
                    }
                  }}
                >
                  {visibleLayers.includes(3) ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={lockedLayers.includes(3) ? "bg-primary/10" : ""}
                  onClick={() => {
                    if (lockedLayers.includes(3)) {
                      setLockedLayers(lockedLayers.filter(l => l !== 3));
                    } else {
                      setLockedLayers([...lockedLayers, 3]);
                    }
                  }}
                >
                  {lockedLayers.includes(3) ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => {
                setVisibleLayers([0, 1, 2, 3]);
                setLockedLayers([]);
              }}
            >
              Restablecer
            </Button>
            <Button onClick={() => setLayerManagerOpen(false)}>Cerrar</Button>
          </DialogFooter>
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