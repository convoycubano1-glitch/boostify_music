/**
 * Componente ClipItem para el editor de timeline
 * Representa un clip individual en la línea de tiempo
 * 
 * BOOSTIFY 2025 - Menú contextual de acciones (clic derecho):
 * - Edit Image (Nano Banana AI)
 * - Add Musician
 * - Camera Angles
 * - Regenerar Imagen
 * - Generar Video
 */
import React, { MouseEvent, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TimelineClip } from '../../../interfaces/timeline';
import { CLIP_COLORS } from '../../../constants/timeline-constants';
import { 
  Pencil, Guitar, Camera, RefreshCw, Video as VideoIcon, Sparkles, X
} from 'lucide-react';

// Props para acciones sobre el clip
interface ClipActionProps {
  onEditImage?: (clip: TimelineClip) => void;
  onAddMusician?: (clip: TimelineClip) => void;
  onCameraAngles?: (clip: TimelineClip) => void;
  onRegenerateImage?: (clip: TimelineClip) => void;
  onGenerateVideo?: (clip: TimelineClip) => void;
}

type Tool = 'select' | 'razor' | 'trim' | 'hand';

interface ClipItemProps extends ClipActionProps {
  clip: TimelineClip;
  timeScale: number;
  isSelected: boolean;
  tool?: Tool;
  onSelect: (clipId: number) => void;
  onMoveStart: (clipId: number, e: MouseEvent) => void;
  onResizeStart: (clipId: number, direction: 'start' | 'end', e: MouseEvent) => void;
  onRazorClick?: (clipId: number, time: number) => void;
  isDragging: boolean;
  isResizing: boolean;
}

/**
 * Obtiene la URL de imagen del clip buscando en todos los campos posibles
 */
const getClipImageUrl = (clip: TimelineClip): string | null => {
  return clip.imageUrl || clip.thumbnailUrl || clip.url || 
         (typeof clip.generatedImage === 'string' ? clip.generatedImage : null) ||
         clip.image_url || clip.publicUrl || clip.firebaseUrl || null;
};

/**
 * Clip individual en el timeline con botones de acción
 */
const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  timeScale,
  isSelected,
  tool = 'select',
  onSelect,
  onMoveStart,
  onResizeStart,
  onRazorClick,
  isDragging,
  isResizing,
  // Acciones
  onEditImage,
  onAddMusician,
  onCameraAngles,
  onRegenerateImage,
  onGenerateVideo,
}) => {
  // Estado para el menú contextual - usar coordenadas de pantalla
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number }>({
    visible: false,
    x: 0,
    y: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Detectar tipo de clip
  const isAudioClip = clip.type === 'AUDIO' || clip.layerId === 2;
  
  // Obtener URL de imagen si existe
  const imageUrl = getClipImageUrl(clip);
  // hasImage: verificar todos los tipos que pueden tener imagen
  const hasImage = !isAudioClip && !!imageUrl && (
    clip.type === 'IMAGE' || 
    clip.type === 'VIDEO' || 
    clip.type === 'GENERATED_IMAGE' ||
    clip.generatedImage ||
    clip.layerId === 1 // Capa 1 siempre son imágenes generadas
  );
  const isImageClip = clip.type === 'IMAGE' || clip.type === 'GENERATED_IMAGE' || hasImage;

  // Calcular ancho mínimo para mostrar botones
  const clipWidth = clip.duration * timeScale;
  
  // DEBUG: Log para ver qué está recibiendo el ClipItem (reducido para audio)
  if (!isAudioClip) {
    console.log(`🎬 [ClipItem] Clip ${clip.id}:`, {
      layerId: clip.layerId,
      type: clip.type,
      hasImage,
      start: clip.start,
      duration: clip.duration
    });
  }
  
  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };
    
    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu.visible]);
  
  // Handler para menú contextual (clic derecho)
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isImageClip) return; // Solo para clips de imagen
    
    // Usar coordenadas de pantalla directamente para posición fija
    // Ajustar para que no se salga de la pantalla
    const menuWidth = 220;
    const menuHeight = 280;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Ajustar si se sale por la derecha
    if (x + menuWidth > viewportWidth - 20) {
      x = viewportWidth - menuWidth - 20;
    }
    
    // Ajustar si se sale por abajo
    if (y + menuHeight > viewportHeight - 20) {
      y = viewportHeight - menuHeight - 20;
    }
    
    setContextMenu({ visible: true, x, y });
    onSelect(clip.id); // Seleccionar el clip
  };
  
  // Cerrar menú
  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  // Color específico para audio con patrón de onda
  const audioClipColor = '#3b82f6'; // Azul para audio
  
  // Determinar cursor basado en la herramienta seleccionada
  const getCursor = (): string => {
    if (isDragging) return 'grabbing';
    if (isResizing) return 'ew-resize';
    switch (tool) {
      case 'razor':
        return 'crosshair'; // Cursor de corte
      case 'trim':
        return 'ew-resize'; // Cursor de redimensión
      case 'hand':
        return 'grab'; // Cursor de mano para mover
      case 'select':
      default:
        return 'grab'; // Cambiado a grab para indicar que se puede arrastrar
    }
  };

  // Calcula el estilo del clip basado en su posición y duración
  const clipStyle: React.CSSProperties = {
    left: `${clip.start * timeScale}px`,
    width: `${clipWidth}px`,
    backgroundColor: isAudioClip 
      ? audioClipColor 
      : hasImage 
        ? 'transparent' 
        : (clip.color || CLIP_COLORS[clip.type] || CLIP_COLORS.default),
    opacity: clip.opacity !== undefined ? clip.opacity : 1,
    cursor: getCursor(),
    backgroundImage: hasImage ? `url(${imageUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  // Ref para el clip container
  const clipRef = useRef<HTMLDivElement>(null);

  // Handler para click según la herramienta activa
  const handleClipClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    console.log(`[ClipItem] Click detected - Tool: ${tool}, isDragging: ${isDragging}, isResizing: ${isResizing}`);
    
    // Si estamos arrastrando o redimensionando, ignorar
    if (isDragging || isResizing) {
      console.log('[ClipItem] Ignoring click - drag/resize in progress');
      return;
    }
    
    // Si es la herramienta cuchilla/razor
    if (tool === 'razor' && onRazorClick) {
      // Usar el ref del clip para obtener el rect correctamente
      const clipElement = clipRef.current;
      if (!clipElement) {
        console.error('[ClipItem] Razor click failed - no clipRef');
        return;
      }
      
      const rect = clipElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left; // Posición X relativa al clip
      const clickTime = clip.start + (clickX / timeScale); // Tiempo global donde se hizo click
      
      console.log('[ClipItem] ✂️ Razor click:', { 
        clickX: clickX.toFixed(2), 
        clickTime: clickTime.toFixed(2), 
        clipStart: clip.start.toFixed(2), 
        clipEnd: (clip.start + clip.duration).toFixed(2),
        clipId: clip.id 
      });
      
      // Verificar que el click está dentro del clip
      if (clickTime > clip.start && clickTime < clip.start + clip.duration) {
        console.log('[ClipItem] ✅ Calling onRazorClick');
        onRazorClick(clip.id, clickTime);
      } else {
        console.log('[ClipItem] ⚠️ Click outside clip bounds');
      }
      return;
    }
    
    // Para otras herramientas, solo seleccionar
    console.log(`[ClipItem] Selecting clip ${clip.id}`);
    onSelect(clip.id);
  };

  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();
    // Solo seleccionar si no estamos arrastrando
    if (!isDragging && !isResizing) {
      onSelect(clip.id);
    }
  };

  const handleMoveStart = (e: MouseEvent) => {
    // Solo bloquear propagación si vamos a iniciar un drag
    // No bloquear para herramientas que no hacen drag
    
    console.log(`🎬 [ClipItem] MoveStart - Tool: ${tool}, clipId: ${clip.id}, isAudio: ${isAudioClip}`);
    
    // Si es herramienta trim, no permitir mover (solo resize)
    if (tool === 'trim') {
      console.log('[ClipItem] 📏 Trim mode - blocking drag');
      return;
    }
    
    // Si es herramienta razor, NO iniciar movimiento
    if (tool === 'razor') {
      console.log('[ClipItem] ✂️ Razor mode - blocking drag for cut');
      return;
    }
    
    // Solo con select o hand: iniciar arrastre
    console.log(`[ClipItem] 🖐️ Starting drag for clip ${clip.id} - calling onMoveStart`);
    
    // IMPORTANTE: Bloquear propagación y prevenir default AQUÍ
    e.stopPropagation();
    e.preventDefault();
    
    // Primero seleccionar el clip
    onSelect(clip.id);
    // Luego iniciar el arrastre
    onMoveStart(clip.id, e);
  };

  const handleResizeStart = (direction: 'start' | 'end', e: MouseEvent) => {
    console.log(`[ClipItem] ResizeStart - Tool: ${tool}, direction: ${direction}, clipId: ${clip.id}`);
    
    // Si es herramienta razor, no permitir resize
    if (tool === 'razor') {
      console.log('[ClipItem] ✂️ Razor mode - blocking resize');
      e.stopPropagation();
      return;
    }
    
    console.log(`[ClipItem] 📐 Starting resize ${direction} for clip ${clip.id}`);
    e.stopPropagation();
    e.preventDefault();
    // Primero seleccionar el clip
    onSelect(clip.id);
    // Luego iniciar el resize
    onResizeStart(clip.id, direction, e);
  };

  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  // Handler para botones de acción
  const handleActionClick = (e: MouseEvent, action?: (clip: TimelineClip) => void) => {
    e.stopPropagation();
    e.preventDefault();
    closeContextMenu();
    if (action) action(clip);
  };

  return (
    <div
      ref={clipRef}
      data-clip-id={clip.id}
      className={`clip-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isAudioClip ? 'audio-clip' : ''} tool-${tool}`}
      style={clipStyle}
      onClick={handleClipClick}
      onMouseDown={tool !== 'razor' && tool !== 'trim' ? handleMoveStart : undefined}
      onContextMenu={handleContextMenu}
    >
      {/* Overlay oscuro para legibilidad del texto sobre imagen */}
      {hasImage && (
        <div className="clip-image-overlay" />
      )}
      
      {/* Waveform visual para clips de audio */}
      {isAudioClip && (
        <div className="audio-waveform" style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1px',
          padding: '0 4px',
          overflow: 'hidden',
          pointerEvents: 'none', // Permitir que los clicks pasen al clip-drag-zone
        }}>
          {/* Barras de waveform simuladas */}
          {Array.from({ length: Math.min(100, Math.floor(clipWidth / 3)) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: `${15 + Math.sin(i * 0.3) * 10 + Math.random() * 15}px`,
                backgroundColor: 'rgba(255,255,255,0.6)',
                borderRadius: '1px',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Manejador de redimensionamiento (inicio) - MEJORADO */}
      <div
        className="resize-handle left"
        onMouseDown={(e) => handleResizeStart('start', e)}
        title="Arrastrar para cambiar inicio"
      >
        <div className="resize-handle-indicator" />
      </div>

      {/* Zona central para arrastrar - más visible */}
      <div 
        className={`clip-drag-zone ${tool === 'razor' ? 'razor-mode' : ''}`}
        title={tool === 'razor' ? 'Click para cortar' : tool === 'trim' ? 'Usa los bordes para recortar' : 'Arrastrar para mover'}
        style={{ cursor: getCursor(), pointerEvents: 'none' }}
      >
        <div className="drag-indicator">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="5" r="1" fill="currentColor"/>
            <circle cx="9" cy="12" r="1" fill="currentColor"/>
            <circle cx="9" cy="19" r="1" fill="currentColor"/>
            <circle cx="15" cy="5" r="1" fill="currentColor"/>
            <circle cx="15" cy="12" r="1" fill="currentColor"/>
            <circle cx="15" cy="19" r="1" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Contenido del clip */}
      <div className="clip-content">
        <div className="clip-title" title={clip.title || (isAudioClip ? '🎵 Audio Track' : '')}>
          {isAudioClip ? '🎵 Audio' : clip.title}
        </div>
        <div className="clip-duration">
          {formatDuration(clip.duration)}
        </div>
        
        {/* Indicador de clip generado por IA */}
        {clip.generatedImage && (
          <div className="clip-ai-badge" title="Imagen generada por IA">
            <Sparkles size={8} /> IA
          </div>
        )}
        
        {/* Indicador de video generado */}
        {(clip.videoUrl || clip.metadata?.videoUrl || clip.metadata?.hasVideo) && (
          <div className="clip-video-badge" title="Video generado">
            <VideoIcon size={8} /> Video
          </div>
        )}
      </div>

      {/* ===== MENÚ CONTEXTUAL (PORTAL - CLIC DERECHO) ===== */}
      {isImageClip && contextMenu.visible && createPortal(
        <div
          ref={menuRef}
          className="boostify-context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 99999,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header del menú */}
          <div className="context-menu-header">
            <span className="context-menu-title">⚡ Acciones</span>
            <button className="context-menu-close" onClick={closeContextMenu}>
              <X size={12} />
            </button>
          </div>
          
          {/* Opciones del menú */}
          <div className="context-menu-options">
            {/* Edit Image - Nano Banana AI */}
            {onEditImage && (
              <button
                className="context-menu-item edit"
                onClick={(e) => handleActionClick(e, onEditImage)}
              >
                <Pencil size={14} />
                <span>Editar Imagen</span>
                <span className="shortcut">AI</span>
              </button>
            )}
            
            {/* Add Musician */}
            {onAddMusician && (
              <button
                className="context-menu-item musician"
                onClick={(e) => handleActionClick(e, onAddMusician)}
              >
                <Guitar size={14} />
                <span>Agregar Músico</span>
              </button>
            )}
            
            {/* Camera Angles */}
            {onCameraAngles && (
              <button
                className="context-menu-item camera"
                onClick={(e) => handleActionClick(e, onCameraAngles)}
              >
                <Camera size={14} />
                <span>Ángulos de Cámara</span>
              </button>
            )}
            
            <div className="context-menu-divider" />
            
            {/* Regenerar Imagen */}
            {onRegenerateImage && (
              <button
                className="context-menu-item regenerate"
                onClick={(e) => handleActionClick(e, onRegenerateImage)}
              >
                <RefreshCw size={14} />
                <span>Regenerar Imagen</span>
              </button>
            )}
            
            {/* Generar Video */}
            {onGenerateVideo && (
              <button
                className="context-menu-item video"
                onClick={(e) => handleActionClick(e, onGenerateVideo)}
              >
                <VideoIcon size={14} />
                <span>Generar Video</span>
                <span className="shortcut">5s</span>
              </button>
            )}
          </div>
          
          {/* Estilos inline del menú contextual */}
          <style>{`
            .boostify-context-menu {
              min-width: 200px;
              max-width: 240px;
              background: linear-gradient(145deg, rgba(28, 28, 30, 0.98), rgba(20, 20, 22, 0.98));
              border-radius: 12px;
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.15);
              box-shadow: 
                0 12px 40px rgba(0, 0, 0, 0.6),
                0 4px 12px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
              animation: contextMenuIn 0.12s cubic-bezier(0.16, 1, 0.3, 1);
              overflow: hidden;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            @keyframes contextMenuIn {
              from { 
                opacity: 0; 
                transform: scale(0.95) translateY(-6px); 
              }
              to { 
                opacity: 1; 
                transform: scale(1) translateY(0); 
              }
            }
            
            .boostify-context-menu .context-menu-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 12px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(255, 255, 255, 0.04);
            }
            
            .boostify-context-menu .context-menu-title {
              font-size: 12px;
              font-weight: 700;
              color: rgba(255, 255, 255, 0.9);
              letter-spacing: 0.02em;
            }
            
            .boostify-context-menu .context-menu-close {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              border: none;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 6px;
              color: rgba(255, 255, 255, 0.6);
              cursor: pointer;
              transition: all 0.15s ease;
            }
            
            .boostify-context-menu .context-menu-close:hover {
              background: rgba(239, 68, 68, 0.4);
              color: #ef4444;
            }
            
            .boostify-context-menu .context-menu-options {
              padding: 8px;
            }
            
            .boostify-context-menu .context-menu-divider {
              height: 1px;
              margin: 6px 8px;
              background: rgba(255, 255, 255, 0.1);
            }
            
            .boostify-context-menu .context-menu-item {
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              padding: 12px 14px;
              border: none;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.12s ease;
              color: rgba(255, 255, 255, 0.9);
              background: transparent;
              text-align: left;
            }
            
            .boostify-context-menu .context-menu-item span:first-of-type {
              flex: 1;
            }
            
            .boostify-context-menu .context-menu-item .shortcut {
              font-size: 10px;
              font-weight: 600;
              padding: 3px 8px;
              border-radius: 5px;
              background: rgba(255, 255, 255, 0.12);
              color: rgba(255, 255, 255, 0.6);
            }
            
            .boostify-context-menu .context-menu-item:hover {
              background: rgba(255, 255, 255, 0.1);
            }
            
            .boostify-context-menu .context-menu-item.edit:hover {
              background: rgba(249, 115, 22, 0.2);
              color: #fb923c;
            }
            .boostify-context-menu .context-menu-item.edit:hover .shortcut {
              background: rgba(249, 115, 22, 0.35);
              color: #fb923c;
            }
            
            .boostify-context-menu .context-menu-item.musician:hover {
              background: rgba(34, 197, 94, 0.2);
              color: #4ade80;
            }
            
            .boostify-context-menu .context-menu-item.camera:hover {
              background: rgba(234, 179, 8, 0.2);
              color: #facc15;
            }
            
            .boostify-context-menu .context-menu-item.regenerate:hover {
              background: rgba(168, 85, 247, 0.2);
              color: #c084fc;
            }
            
            .boostify-context-menu .context-menu-item.video:hover {
              background: rgba(59, 130, 246, 0.2);
              color: #60a5fa;
            }
            .boostify-context-menu .context-menu-item.video:hover .shortcut {
              background: rgba(59, 130, 246, 0.35);
              color: #60a5fa;
            }
          `}</style>
        </div>,
        document.body
      )}

      {/* Manejador de redimensionamiento (fin) - MEJORADO */}
      <div
        className="resize-handle right"
        onMouseDown={(e) => handleResizeStart('end', e)}
        title="Arrastrar para cambiar duración"
      >
        <div className="resize-handle-indicator" />
      </div>

      {/* Estilos del componente */}
      <style dangerouslySetInnerHTML={{ __html: `
        .clip-item {
          position: absolute;
          height: calc(100% - 4px);
          margin: 2px 0;
          border-radius: 6px;
          overflow: visible;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          user-select: none;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: stretch;
          color: white;
          font-size: 11px;
          transition: box-shadow 0.15s ease;
          border: 1px solid rgba(255,255,255,0.15);
          will-change: transform, width, left;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        
        @media (min-width: 640px) {
          .clip-item {
            font-size: 13px;
            border-radius: 8px;
          }
        }
        
        .clip-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom, 
            rgba(0,0,0,0.2) 0%, 
            rgba(0,0,0,0.1) 30%,
            rgba(0,0,0,0.5) 100%
          );
          pointer-events: none;
          z-index: 1;
          border-radius: inherit;
        }
        
        .clip-item.selected {
          box-shadow: 0 0 0 3px #f97316, 0 4px 16px rgba(249, 115, 22, 0.6);
          z-index: 10;
          border-color: #f97316;
        }
        
        .clip-item.dragging {
          opacity: 0.95;
          z-index: 100 !important;
          box-shadow: 0 0 0 3px #22c55e, 0 8px 24px rgba(34, 197, 94, 0.5);
          cursor: grabbing !important;
          /* Sin transición durante el drag para movimiento inmediato */
          transition: none !important;
        }
        
        .clip-item.resizing {
          z-index: 100 !important;
          box-shadow: 0 0 0 3px #3b82f6, 0 8px 24px rgba(59, 130, 246, 0.5);
          /* Sin transición durante el resize para movimiento inmediato */
          transition: none !important;
        }
        
        /* Zona de arrastre central */
        .clip-drag-zone {
          position: absolute;
          top: 0;
          left: 18px;
          right: 18px;
          height: 100%;
          cursor: grab;
          z-index: 15;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clip-drag-zone.razor-mode {
          cursor: crosshair;
        }
        
        .clip-item.dragging .clip-drag-zone {
          cursor: grabbing;
        }
        
        .drag-indicator {
          opacity: 0;
          color: rgba(255, 255, 255, 0.5);
          transition: opacity 0.2s ease;
          background: rgba(0, 0, 0, 0.5);
          padding: 4px;
          border-radius: 4px;
        }
        
        .clip-item:hover .drag-indicator {
          opacity: 0.7;
        }
        
        .clip-item.selected .drag-indicator {
          opacity: 0.9;
          color: rgba(249, 115, 22, 0.8);
        }
        
        .clip-content {
          flex: 1;
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          position: relative;
          z-index: 2;
          overflow: hidden;
          gap: 2px;
          pointer-events: none;
        }
        
        @media (min-width: 640px) {
          .clip-content {
            padding: 6px 10px;
            gap: 3px;
          }
          .clip-drag-zone {
            left: 24px;
            right: 24px;
          }
        }
        
        .clip-title {
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.9),
            0 0 8px rgba(0, 0, 0, 0.7);
          font-size: 11px;
          letter-spacing: 0.02em;
          line-height: 1.2;
        }
        
        @media (min-width: 640px) {
          .clip-title {
            font-size: 13px;
          }
        }
        
        .clip-duration {
          font-size: 10px;
          font-weight: 600;
          opacity: 0.95;
          text-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.8),
            0 0 6px rgba(0, 0, 0, 0.6);
          background: rgba(0, 0, 0, 0.4);
          padding: 1px 4px;
          border-radius: 3px;
          width: fit-content;
        }
        
        @media (min-width: 640px) {
          .clip-duration {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
          }
        }
        
        .resize-handle {
          position: absolute;
          top: 0;
          width: 16px;
          height: 100%;
          cursor: ew-resize;
          z-index: 25;
          background: transparent;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .resize-handle:hover,
        .resize-handle:active {
          background: rgba(249, 115, 22, 0.6);
        }
        
        .resize-handle-indicator {
          width: 4px;
          height: 40%;
          min-height: 16px;
          max-height: 40px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 2px;
          transition: all 0.15s ease;
        }
        
        .resize-handle:hover .resize-handle-indicator,
        .resize-handle:active .resize-handle-indicator {
          background: #fff;
          width: 5px;
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.8);
        }
        
        @media (min-width: 640px) {
          .resize-handle {
            width: 20px;
          }
          .resize-handle-indicator {
            width: 5px;
          }
        }
        
        .resize-handle.left {
          left: 0;
          border-radius: 6px 0 0 6px;
        }
        
        .resize-handle.right {
          right: 0;
          border-radius: 0 6px 6px 0;
        }
        
        /* Badges */
        .clip-ai-badge,
        .clip-video-badge {
          position: absolute;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 4px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 2px;
          z-index: 5;
          color: #fff;
        }
        
        .clip-ai-badge {
          top: 3px;
          right: 3px;
          background: linear-gradient(135deg, #f97316, #ea580c);
        }
        
        .clip-video-badge {
          top: 3px;
          left: 3px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        @media (min-width: 640px) {
          .clip-ai-badge,
          .clip-video-badge {
            font-size: 9px;
            padding: 3px 6px;
          }
          .clip-ai-badge { top: 4px; right: 4px; }
          .clip-video-badge { top: 4px; left: 4px; }
        }
      `}} />
    </div>
  );
};

export { ClipItem };
export default ClipItem;