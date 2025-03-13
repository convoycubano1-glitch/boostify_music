import { useEffect, useState, useRef } from 'react';
import interact from 'interactjs';
import { TimelineClip } from '../../components/music-video/timeline-editor';
import { MAX_CLIP_DURATION, MIN_CLIP_DURATION, INTERACT_MIN_RESIZE_WIDTH } from '../../constants/timeline-constants';

interface UseClipInteractionsProps {
  clips: TimelineClip[];
  timelineRef: React.RefObject<HTMLDivElement>;
  onClipUpdate: (clipId: number, updates: Partial<TimelineClip>) => void;
  pixelsToTime: (pixels: number) => number;
}

interface UseClipInteractionsResult {
  selectedClip: number | null;
  setSelectedClip: React.Dispatch<React.SetStateAction<number | null>>;
  isDragging: boolean;
  resizingSide: 'start' | 'end' | null;
  clipStartTime: number;
  handleClipDragStart: (clipId: number, e: React.MouseEvent) => void;
  handleResizeStart: (clipId: number, side: 'start' | 'end', e: React.MouseEvent) => void;
}

/**
 * Hook personalizado para manejar las interacciones de clips (arrastrar y redimensionar)
 */
export function useClipInteractions({
  clips,
  timelineRef,
  onClipUpdate,
  pixelsToTime,
}: UseClipInteractionsProps): UseClipInteractionsResult {
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizingSide, setResizingSide] = useState<'start' | 'end' | null>(null);
  const [clipStartTime, setClipStartTime] = useState<number>(0);
  const [dragStartX, setDragStartX] = useState<number>(0);
  
  // Funciones para validaciones y restricciones
  
  /**
   * Valida que un clip no se superponga con clips anteriores
   */
  const getValidStartTime = (allClips: TimelineClip[], currentClipId: number, proposedStart: number): number => {
    // Evitar valores negativos
    const minStartTime = Math.max(0, proposedStart);
    
    // Buscar el clip anterior y asegurar que no haya solapamiento
    const currentClip = allClips.find(c => c.id === currentClipId);
    if (!currentClip) return minStartTime;
    
    const previousClips = allClips
      .filter(c => c.id !== currentClipId && c.layer === currentClip.layer)
      .filter(c => c.start < proposedStart)
      .sort((a, b) => b.start - a.start);
    
    const previousClip = previousClips[0];
    if (previousClip) {
      // "Snap to" al final del clip anterior
      const snapEndTime = previousClip.start + previousClip.duration;
      if (proposedStart < snapEndTime) {
        return snapEndTime;
      }
    }
    
    return minStartTime;
  };
  
  /**
   * Asegura que la duración no exceda los límites definidos
   */
  const getValidDuration = (duration: number): number => {
    return Math.min(MAX_CLIP_DURATION, Math.max(MIN_CLIP_DURATION, duration));
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
                const newStartTime = clipStartTime + deltaTime;
                
                // Validar la posición para evitar superposiciones
                const validStartTime = getValidStartTime(clips, selectedClip, newStartTime);
                
                onClipUpdate(selectedClip, {
                  start: validStartTime
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
                min: { width: INTERACT_MIN_RESIZE_WIDTH, height: 0 }
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
                
                if (resizingSide === 'start') {
                  // Redimensionar desde el inicio
                  const deltaWidth = event.deltaRect.left;
                  const deltaTime = pixelsToTime(deltaWidth);
                  const newStart = clip.start - deltaTime;
                  
                  // Calcular nueva duración
                  let newDuration = clip.duration + deltaTime;
                  
                  // Validar el inicio y la duración
                  const validStartTime = getValidStartTime(clips, selectedClip, newStart);
                  
                  // Ajustar la duración en función del inicio validado
                  newDuration = Math.max(MIN_CLIP_DURATION, 
                    clip.duration + (clip.start - validStartTime));
                  
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
                      start: validStartTime,
                      duration: newDuration
                    });
                  }
                } else {
                  // Redimensionar desde el final
                  const deltaWidth = event.deltaRect.right;
                  const deltaTime = pixelsToTime(deltaWidth);
                  
                  // Calcular nueva duración respetando el límite máximo
                  const newDuration = getValidDuration(clip.duration + deltaTime);
                  
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
  }, [clips, pixelsToTime, clipStartTime, isDragging, selectedClip, onClipUpdate]);
  
  // Handlers de respaldo para compatibilidad
  const handleClipDragStart = (clipId: number, e: React.MouseEvent) => {
    // Esta función sirve como fallback, principalmente gestionada por interactjs
    try {
      e.preventDefault();
      const clip = clips.find(c => c.id === clipId);
      if (clip) {
        setIsDragging(true);
        setSelectedClip(clipId);
        setDragStartX(e.clientX);
        setClipStartTime(clip.start);
        
        const handleMouseMove = (e: MouseEvent) => {
          if (isDragging && selectedClip !== null) {
            const deltaX = e.clientX - dragStartX;
            const deltaTime = pixelsToTime(deltaX);
            const newStartTime = Math.max(0, clipStartTime + deltaTime);
            
            // Validar para evitar superposiciones
            const validStartTime = getValidStartTime(clips, selectedClip, newStartTime);
            
            onClipUpdate(selectedClip, {
              start: validStartTime
            });
          }
        };
        
        const handleMouseUp = () => {
          setIsDragging(false);
          setClipStartTime(0);
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    } catch (error) {
      console.error("Error al iniciar arrastre del clip:", error);
    }
  };
  
  // Handler para iniciar el redimensionamiento como fallback
  const handleResizeStart = (clipId: number, side: 'start' | 'end', e: React.MouseEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      
      const clip = clips.find(c => c.id === clipId);
      if (!clip) return;
      
      setSelectedClip(clipId);
      setResizingSide(side);
      setDragStartX(e.clientX);
      
      const initialDuration = clip.duration;
      const initialStart = clip.start;
      
      const handleResizeMove = (e: MouseEvent) => {
        if (!resizingSide || selectedClip === null) return;
        
        const deltaX = e.clientX - dragStartX;
        const deltaTime = pixelsToTime(deltaX);
        
        if (resizingSide === 'start') {
          // Redimensionar desde el inicio
          const newStart = Math.max(0, initialStart - deltaTime);
          let newDuration = initialDuration + (initialStart - newStart);
          
          // Validar el inicio
          const validStartTime = getValidStartTime(clips, selectedClip, newStart);
          
          // Ajustar la duración basada en el inicio validado
          newDuration = initialDuration + (initialStart - validStartTime);
          
          // Validar la duración
          newDuration = getValidDuration(newDuration);
          
          onClipUpdate(selectedClip, {
            start: validStartTime,
            duration: newDuration
          });
        } else {
          // Redimensionar desde el final
          const newDuration = getValidDuration(initialDuration + deltaTime);
          
          onClipUpdate(selectedClip, {
            duration: newDuration
          });
        }
      };
      
      const handleResizeUp = () => {
        setResizingSide(null);
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeUp);
      };
      
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
    } catch (error) {
      console.error("Error al iniciar redimensionamiento del clip:", error);
    }
  };

  return {
    selectedClip,
    setSelectedClip,
    isDragging,
    resizingSide,
    clipStartTime,
    handleClipDragStart,
    handleResizeStart
  };
}