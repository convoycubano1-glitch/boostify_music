import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Scissors,
  Music,
  Image,
  Type,
  Film,
  Wand2,
  Layers,
  LayoutGrid,
  Camera,
  Volume2,
  Clock,
  SlidersHorizontal,
  Camera as CameraIcon,
  Crop,
  Sparkles,
  Palette,
  Split,
  SplitSquareHorizontal,
  RotateCw,
  FileVideo,
  MoveHorizontal,
  Play,
  Save,
  FileText,
  ArrowUpRight,
  SquareStack,
  Workflow,
  Hand,
  PanelLeft,
  Paintbrush,
  Tags,
  Folder,
} from 'lucide-react';

export interface ToolbarProps {
  onToolSelect: (tool: string) => void;
  activeToolId?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  position?: 'top' | 'bottom' | 'left' | 'right';
  language?: 'es' | 'en';
  isCollapsible?: boolean;
}

// Función para renderizar iconos con estilo para que se vean más profesionales
const renderIcon = (IconComponent: React.ElementType) => {
  return (
    <div className="flex items-center justify-center">
      <IconComponent className="h-5 w-5" strokeWidth={1.5} />
    </div>
  );
};

// Definimos las herramientas en grupos al estilo Adobe Premiere Pro
const TOOLS = {
  es: [
    // Grupo de selección y posicionamiento
    { id: 'selection', icon: renderIcon(MoveHorizontal), label: 'Selección', group: 'select', tooltip: 'Herramienta de selección para mover clips' },
    { id: 'hand', icon: renderIcon(Hand), label: 'Mano', group: 'select', tooltip: 'Desplazar el lienzo' },
    
    // Grupo de edición básica
    { id: 'cut', icon: renderIcon(Scissors), label: 'Cortar', group: 'edit', tooltip: 'Cortar clip en la posición actual' },
    { id: 'split', icon: renderIcon(Split), label: 'Dividir', group: 'edit', tooltip: 'Dividir clip en múltiples partes' },
    { id: 'crop', icon: renderIcon(Crop), label: 'Recortar', group: 'edit', tooltip: 'Recortar área visible del clip' },
    { id: 'rotate', icon: renderIcon(RotateCw), label: 'Rotar', group: 'edit', tooltip: 'Rotar clips seleccionados' },
    
    // Grupo de medios
    { id: 'video', icon: renderIcon(FileVideo), label: 'Video', group: 'media', tooltip: 'Agregar clip de video' },
    { id: 'audio', icon: renderIcon(Music), label: 'Audio', group: 'media', tooltip: 'Agregar pista de audio' },
    { id: 'image', icon: renderIcon(Image), label: 'Imagen', group: 'media', tooltip: 'Agregar imagen o foto' },
    { id: 'folder', icon: renderIcon(Folder), label: 'Importar', group: 'media', tooltip: 'Importar multimedia' },
    
    // Grupo de efectos y gráficos
    { id: 'text', icon: renderIcon(Type), label: 'Texto', group: 'effects', tooltip: 'Agregar texto y títulos' },
    { id: 'effects', icon: renderIcon(Sparkles), label: 'Efectos', group: 'effects', tooltip: 'Aplicar efectos visuales' },
    { id: 'transitions', icon: renderIcon(Layers), label: 'Transiciones', group: 'effects', tooltip: 'Aplicar transiciones entre clips' },
    { id: 'color', icon: renderIcon(Palette), label: 'Color', group: 'effects', tooltip: 'Ajustes de color y gradación' },
    { id: 'paintbrush', icon: renderIcon(Paintbrush), label: 'Pincel', group: 'effects', tooltip: 'Herramientas de pintura y máscaras' },
    
    // Grupo de cámara y animación
    { id: 'camera', icon: renderIcon(CameraIcon), label: 'Cámara', group: 'camera', tooltip: 'Movimientos de cámara' },
    { id: 'speed', icon: renderIcon(Clock), label: 'Velocidad', group: 'camera', tooltip: 'Ajustes de velocidad y tiempo' },
    { id: 'workflow', icon: renderIcon(Workflow), label: 'Animación', group: 'camera', tooltip: 'Editor de animación keyframe' },
    
    // Grupo de análisis
    { id: 'beat', icon: renderIcon(SplitSquareHorizontal), label: 'Beats', group: 'analysis', tooltip: 'Análisis de beats musicales' },
    { id: 'transcription', icon: renderIcon(FileText), label: 'Transcripción', group: 'analysis', tooltip: 'Transcripción y subtítulos' },
    { id: 'tags', icon: renderIcon(Tags), label: 'Marcadores', group: 'analysis', tooltip: 'Añadir marcadores y etiquetas' },
    
    // Grupo de utilidades
    { id: 'volume', icon: renderIcon(Volume2), label: 'Volumen', group: 'utility', tooltip: 'Ajustes de audio y volumen' },
    { id: 'settings', icon: renderIcon(SlidersHorizontal), label: 'Ajustes', group: 'utility', tooltip: 'Configuración del proyecto' },
    { id: 'projects', icon: renderIcon(SquareStack), label: 'Proyectos', group: 'utility', tooltip: 'Gestión de proyectos' },
    { id: 'export', icon: renderIcon(ArrowUpRight), label: 'Exportar', group: 'utility', tooltip: 'Exportar video' },
    { id: 'save', icon: renderIcon(Save), label: 'Guardar', group: 'utility', tooltip: 'Guardar proyecto' }
  ],
  en: [
    // Selection and positioning group
    { id: 'selection', icon: renderIcon(MoveHorizontal), label: 'Selection', group: 'select', tooltip: 'Selection tool for moving clips' },
    { id: 'hand', icon: renderIcon(Hand), label: 'Hand', group: 'select', tooltip: 'Pan the canvas' },
    
    // Basic editing group
    { id: 'cut', icon: renderIcon(Scissors), label: 'Cut', group: 'edit', tooltip: 'Cut clip at current position' },
    { id: 'split', icon: renderIcon(Split), label: 'Split', group: 'edit', tooltip: 'Split clip into multiple parts' },
    { id: 'crop', icon: renderIcon(Crop), label: 'Crop', group: 'edit', tooltip: 'Crop visible area of clip' },
    { id: 'rotate', icon: renderIcon(RotateCw), label: 'Rotate', group: 'edit', tooltip: 'Rotate selected clips' },
    
    // Media group
    { id: 'video', icon: renderIcon(FileVideo), label: 'Video', group: 'media', tooltip: 'Add video clip' },
    { id: 'audio', icon: renderIcon(Music), label: 'Audio', group: 'media', tooltip: 'Add audio track' },
    { id: 'image', icon: renderIcon(Image), label: 'Image', group: 'media', tooltip: 'Add image or photo' },
    { id: 'folder', icon: renderIcon(Folder), label: 'Import', group: 'media', tooltip: 'Import media' },
    
    // Effects and graphics group
    { id: 'text', icon: renderIcon(Type), label: 'Text', group: 'effects', tooltip: 'Add text and titles' },
    { id: 'effects', icon: renderIcon(Sparkles), label: 'Effects', group: 'effects', tooltip: 'Apply visual effects' },
    { id: 'transitions', icon: renderIcon(Layers), label: 'Transitions', group: 'effects', tooltip: 'Apply transitions between clips' },
    { id: 'color', icon: renderIcon(Palette), label: 'Color', group: 'effects', tooltip: 'Color adjustment and grading' },
    { id: 'paintbrush', icon: renderIcon(Paintbrush), label: 'Brush', group: 'effects', tooltip: 'Painting tools and masks' },
    
    // Camera and animation group
    { id: 'camera', icon: renderIcon(CameraIcon), label: 'Camera', group: 'camera', tooltip: 'Camera movements' },
    { id: 'speed', icon: renderIcon(Clock), label: 'Speed', group: 'camera', tooltip: 'Speed and time adjustments' },
    { id: 'workflow', icon: renderIcon(Workflow), label: 'Animation', group: 'camera', tooltip: 'Keyframe animation editor' },
    
    // Analysis group
    { id: 'beat', icon: renderIcon(SplitSquareHorizontal), label: 'Beats', group: 'analysis', tooltip: 'Music beat analysis' },
    { id: 'transcription', icon: renderIcon(FileText), label: 'Transcription', group: 'analysis', tooltip: 'Transcription and subtitles' },
    { id: 'tags', icon: renderIcon(Tags), label: 'Markers', group: 'analysis', tooltip: 'Add markers and tags' },
    
    // Utility group
    { id: 'volume', icon: renderIcon(Volume2), label: 'Volume', group: 'utility', tooltip: 'Audio and volume adjustments' },
    { id: 'settings', icon: renderIcon(SlidersHorizontal), label: 'Settings', group: 'utility', tooltip: 'Project settings' },
    { id: 'projects', icon: renderIcon(SquareStack), label: 'Projects', group: 'utility', tooltip: 'Project management' },
    { id: 'export', icon: renderIcon(ArrowUpRight), label: 'Export', group: 'utility', tooltip: 'Export video' },
    { id: 'save', icon: renderIcon(Save), label: 'Save', group: 'utility', tooltip: 'Save project' }
  ]
};

const Toolbar: React.FC<ToolbarProps> = ({
  onToolSelect,
  activeToolId,
  showLabels = false,
  orientation = 'horizontal',
  position = 'bottom',
  language = 'es',
  isCollapsible = false
}) => {
  // Estados para el modo de colapso
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [mouseHoveringOnToolbar, setMouseHoveringOnToolbar] = useState(false);
  const [lastMouseMoveTime, setLastMouseMoveTime] = useState<number>(Date.now());
  const [mouseDistance, setMouseDistance] = useState<{x: number, y: number} | null>(null);
  const [mouseProximity, setMouseProximity] = useState<number>(100); // 0 = muy cerca, 100 = muy lejos
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  // Temporizadores para colapsar después de inactividad y para detectar movimiento del ratón
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mouseActivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine the tools array based on language
  const tools = TOOLS[language] || TOOLS.en;

  // Agrupar herramientas por tipo
  const groupedTools = tools.reduce((groups: Record<string, typeof tools>, tool) => {
    const group = tool.group || 'misc';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(tool);
    return groups;
  }, {});

  // Orden de los grupos en estilo Adobe Premiere Pro
  const groupOrder = ['select', 'edit', 'media', 'effects', 'camera', 'analysis', 'utility'];

  // Función para alternar el colapso de la barra de herramientas
  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
    setExpandedGroup(null);
  };
  
  // Función para expandir la barra de herramientas
  const expandToolbar = () => {
    if (isCollapsed && isCollapsible) {
      setIsCollapsed(false);
    }
  };

  // Función para expandir un grupo específico
  const toggleGroupExpansion = (groupName: string) => {
    if (expandedGroup === groupName) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupName);
    }
    resetCollapseTimer();
  };
  
  // Función para reiniciar el temporizador de colapso
  const resetCollapseTimer = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
    }
    
    if (isCollapsible && !isCollapsed) {
      collapseTimerRef.current = setTimeout(() => {
        if (!mouseHoveringOnToolbar) {
          setIsCollapsed(true);
          setExpandedGroup(null);
        }
      }, 3000); // 3 segundos de inactividad
    }
  };
  
  // Efecto para detectar clics fuera de la barra de herramientas y seguimiento del ratón
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node) && isCollapsible) {
        setIsCollapsed(true);
        setExpandedGroup(null);
      }
    };
    
    // Función para rastrear movimiento del ratón con detección avanzada de proximidad
    const handleMouseMove = (event: MouseEvent) => {
      const currentTime = Date.now();
      setLastMouseMoveTime(currentTime);
      
      // Guardar la posición del ratón para poder calcular la distancia y velocidad
      setMouseDistance({x: event.clientX, y: event.clientY});
      
      // Si la barra de herramientas está disponible, calcular la proximidad del ratón
      if (toolbarRef.current) {
        const rect = toolbarRef.current.getBoundingClientRect();
        const maxDistance = 150; // Distancia máxima para calcular proximidad (100%)
        const threshold = 50; // Distancia para activar la expansión
        
        let distance = 0;
        let shouldExpand = false;
        
        // Calcular la distancia real según orientación y posición
        if (orientation === 'vertical') {
          if (position === 'left') {
            // Distancia al borde derecho de la barra cuando está a la izquierda
            distance = Math.abs(event.clientX - rect.right);
          } else if (position === 'right') {
            // Distancia al borde izquierdo de la barra cuando está a la derecha
            distance = Math.abs(event.clientX - rect.left);
          }
        } else {
          if (position === 'top') {
            // Distancia al borde inferior de la barra cuando está arriba
            distance = Math.abs(event.clientY - rect.bottom);
          } else if (position === 'bottom') {
            // Distancia al borde superior de la barra cuando está abajo
            distance = Math.abs(event.clientY - rect.top);
          }
        }
        
        // Calcular proximidad como un valor entre 0 (muy cerca) y 100 (lejos)
        const proximity = Math.min(100, Math.round((distance / maxDistance) * 100));
        setMouseProximity(proximity);
        
        // Determinar si debemos expandir la barra basado en la proximidad
        shouldExpand = distance < threshold;
        
        // Expandir la barra si el ratón está lo suficientemente cerca y la barra está colapsada
        if (shouldExpand && isCollapsed && isCollapsible) {
          expandToolbar();
        }
      }
    };
    
    // Monitorear actividad del ratón para auto-colapso
    const checkMouseActivity = () => {
      const currentTime = Date.now();
      const timeSinceLastMove = currentTime - lastMouseMoveTime;
      
      // Si no hay movimiento del ratón durante el período especificado, colapsar la barra
      if (timeSinceLastMove > 3000 && !mouseHoveringOnToolbar && isCollapsible && !isCollapsed) {
        setIsCollapsed(true);
        setExpandedGroup(null);
      }
      
      // Continuar monitoreando (al estilo de Adobe Premiere)
      mouseActivityTimerRef.current = setTimeout(checkMouseActivity, 1000);
    };
    
    // Registrar eventos
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseMove);
    
    // Iniciar monitoreo de actividad
    if (isCollapsible) {
      mouseActivityTimerRef.current = setTimeout(checkMouseActivity, 1000);
    }
    
    // Limpiar eventos y temporizadores
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
      
      if (mouseActivityTimerRef.current) {
        clearTimeout(mouseActivityTimerRef.current);
      }
    };
  }, [isCollapsible, isCollapsed, orientation, position, lastMouseMoveTime, expandToolbar]);
  
  // Efecto para iniciar el temporizador de colapso
  useEffect(() => {
    resetCollapseTimer();
    
    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
      }
    };
  }, [isCollapsed, isCollapsible, mouseHoveringOnToolbar]);

  // El estilo Adobe Premiere usa una barra con grupos de herramientas
  const containerClasses = (() => {
    if (orientation === 'horizontal') {
      return isCollapsed 
        ? 'flex overflow-x-auto pb-1 hide-scrollbar transition-all duration-400 ease-in-out opacity-85 hover:opacity-100 transform hover:translate-y-0 translate-y-[2px]'
        : 'flex overflow-x-auto pb-1 hide-scrollbar transition-all duration-400 ease-in-out opacity-100 transform translate-y-0';
    } else {
      return isCollapsed 
        ? 'flex flex-col space-y-2 w-16 transition-all duration-400 ease-in-out opacity-85 hover:opacity-100 transform hover:translate-x-0'
        : 'flex flex-col space-y-2 w-64 transition-all duration-400 ease-in-out opacity-100 transform translate-x-0';
    }
  })();

  // En dispositivos móviles, ocupa todo el ancho de la pantalla
  const positionClasses = (() => {
    switch (position) {
      case 'top': return 'top-0 left-0 right-0';
      case 'bottom': return 'bottom-0 left-0 right-0';
      case 'left': return 'left-0 top-0 bottom-0';
      case 'right': return 'right-0 top-0 bottom-0';
      default: return '';
    }
  })();

  // Clases para botones y separadores al estilo Adobe Premiere Pro
  const buttonClasses = 'rounded-md flex items-center justify-center';
  const activeToolClasses = 'bg-orange-500 text-white shadow-md';
  const inactiveToolClasses = 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white hover:shadow-sm';
  
  // Clases específicas según la orientación
  const groupClasses = orientation === 'horizontal' 
    ? 'flex flex-wrap items-center px-1 py-1' 
    : 'flex flex-col items-center px-1 py-2';
    
  const separatorClasses = orientation === 'horizontal'
    ? 'h-full w-px bg-zinc-700 mx-2'
    : 'w-full h-px bg-zinc-700 my-2';

  // Nombres de grupos según el estilo de Adobe Premiere Pro
  const groupNames: Record<string, string> = {
    select: language === 'es' ? 'Selección' : 'Selection',
    edit: language === 'es' ? 'Edición' : 'Edit',
    media: language === 'es' ? 'Medios' : 'Media',
    effects: language === 'es' ? 'Efectos' : 'Effects',
    camera: language === 'es' ? 'Cámara' : 'Camera',
    analysis: language === 'es' ? 'Análisis' : 'Analysis',
    utility: language === 'es' ? 'Utilidades' : 'Utility'
  };

  // Estilos específicos para barras de herramientas verticales - estilo Adobe Premiere Pro
  const verticalToolbarClasses = orientation === 'vertical' 
    ? 'h-full py-4 flex-col bg-[#232323] border-r border-[#1a1a1a]' 
    : '';
    
  const verticalGroupLabelClasses = orientation === 'vertical'
    ? 'text-[10px] uppercase tracking-wider text-center text-zinc-400 font-semibold w-full py-1 mb-1 border-b border-zinc-800'
    : 'text-xs mb-1 text-center text-zinc-400 font-medium w-full';
  
  // Obtener clase para el contenedor principal
  const mainContainerClasses = `toolbar ${containerClasses} ${positionClasses} p-2 bg-zinc-900 shadow-md ${verticalToolbarClasses}`;
  
  // Renderizar el botón de colapso/expandir para la barra (estilo Adobe Premiere Pro)
  const renderCollapseButton = () => {
    if (!isCollapsible) return null;
    
    // Usamos chevrones dobles para un aspecto más profesional
    const CollapseIcon = isCollapsed
      ? (orientation === 'horizontal' ? ChevronDown : ChevronsRight)
      : (orientation === 'horizontal' ? ChevronUp : ChevronsLeft);
      
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleCollapse}
        title={isCollapsed ? 'Expandir barra de herramientas' : 'Contraer barra de herramientas'}
        className={`${buttonClasses} bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white hover:shadow-sm
          absolute ${orientation === 'horizontal' 
            ? 'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2' 
            : 'top-2 right-0 transform translate-x-1/2'} z-10 border border-zinc-700`}
      >
        <CollapseIcon className="h-4 w-4" />
      </Button>
    );
  };
  
  // Renderizar grupo colapsado o expandido
  const renderGroup = (groupName: string, groupIndex: number) => {
    const groupTools = groupedTools[groupName] || [];
    if (groupTools.length === 0) return null;
    
    const isGroupExpanded = expandedGroup === groupName;
    const shouldShowFullGroup = !isCollapsed || isGroupExpanded;
    
    // Para barras verticales colapsadas, solo mostrar el primer elemento como representante del grupo
    const displayedTools = (isCollapsed && orientation === 'vertical' && !isGroupExpanded) 
      ? [groupTools[0]] 
      : groupTools;
      
    // Clase para grupo expandido
    const expandedGroupClass = isGroupExpanded ? 'ring-1 ring-orange-500 bg-zinc-950 rounded-lg' : '';
    
    return (
      <React.Fragment key={groupName}>
        {groupIndex > 0 && <div className={separatorClasses} />}
        <div 
          className={`${groupClasses} ${expandedGroupClass} relative`}
          onClick={isCollapsed && orientation === 'vertical' ? () => toggleGroupExpansion(groupName) : undefined}
        >
          {/* Etiqueta de grupo */}
          {(showLabels || (orientation === 'vertical' && !isCollapsed)) && (
            <div className={verticalGroupLabelClasses}
                 onClick={() => isCollapsible ? toggleGroupExpansion(groupName) : undefined}
            >
              <div className="flex items-center justify-center">
                {groupNames[groupName]}
                {isCollapsible && orientation === 'vertical' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-1 p-0 h-4 w-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroupExpansion(groupName);
                    }}
                  >
                    {isGroupExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Herramientas del grupo */}
          <div className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'} items-center`}>
            {displayedTools.map((tool) => (
              <TooltipProvider key={tool.id}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToolSelect(tool.id)}
                      className={`${buttonClasses} ${activeToolId === tool.id ? activeToolClasses : inactiveToolClasses} 
                        ${orientation === 'horizontal' ? 'mr-1 mb-0' : 'mr-0 mb-1'} 
                        ${orientation === 'vertical' ? 'w-12 h-12' : 'h-10 w-10'}`}
                      aria-label={tool.label}
                    >
                      {tool.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side={orientation === 'horizontal' ? 'top' : 'right'}
                    className="bg-zinc-800 border border-zinc-700 text-xs p-2 max-w-xs"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-white">{tool.label}</p>
                      {tool.tooltip && (
                        <p className="text-zinc-300 text-[10px]">{tool.tooltip}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
                
                {/* Etiquetas de herramientas */}
                {(showLabels || (isGroupExpanded && orientation === 'vertical')) && (
                  <div className="text-xs mt-1 text-center text-zinc-400 w-full">
                    {tool.label}
                  </div>
                )}
              </TooltipProvider>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  };
  
  // Calcular estilos visuales basados en proximidad del ratón
  const proximityStyles = (() => {
    // Usamos mouseProximity para efectos visuales (0 = muy cerca, 100 = muy lejos)
    // Calculamos la opacidad (entre 0.7 y 1) según la proximidad
    const opacity = isCollapsed 
      ? 0.7 + ((100 - Math.min(mouseProximity, 100)) / 100) * 0.3
      : 1;
    
    // Intensidad de sombra basada en proximidad
    const shadowIntensity = isCollapsed
      ? Math.max(0, ((50 - Math.min(mouseProximity, 50)) / 50) * 0.15)
      : 0.3;
    
    // Radio de borde más suave cuando el ratón está cerca
    const borderRadius = isCollapsed
      ? 4 + ((100 - Math.min(mouseProximity, 100)) / 100) * 2
      : 6;
      
    // Escala sutilmente cuando el ratón está cerca
    const scale = isCollapsed && mouseProximity < 50
      ? 1 + ((50 - mouseProximity) / 50) * 0.02  // Escala entre 1 y 1.02
      : 1;
      
    // Desplazamiento de 1-2px que disminuye a medida que el ratón se acerca
    const translateY = isCollapsed && orientation === 'horizontal'
      ? Math.min(2, mouseProximity / 50)
      : 0;
      
    const translateX = isCollapsed && orientation === 'vertical'
      ? (position === 'left' ? -1 : 1) * Math.min(2, mouseProximity / 50)
      : 0;
      
    // Intensidad de resplandor que aumenta cuando el ratón está cerca
    const glowIntensity = isCollapsed
      ? Math.max(0, ((50 - Math.min(mouseProximity, 50)) / 50) * 6)
      : 0;
      
    return {
      opacity,
      boxShadow: `0 ${shadowIntensity * 16}px ${shadowIntensity * 40}px rgba(0, 0, 0, ${shadowIntensity})${
        glowIntensity > 0 ? `, 0 0 ${glowIntensity}px rgba(255, 120, 20, ${glowIntensity * 0.1})` : ''
      }`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderRadius: `${borderRadius}px`,
      border: isCollapsed 
        ? `1px solid rgba(60, 60, 60, ${0.3 + ((100 - Math.min(mouseProximity, 100)) / 100) * 0.2})`
        : '1px solid rgba(80, 80, 80, 0.4)',
      transform: `scale(${scale}) ${orientation === 'horizontal' ? `translateY(${translateY}px)` : `translateX(${translateX}px)`}`
    };
  })();

  return (
    <div 
      ref={toolbarRef}
      className={`${mainContainerClasses} relative transition-all duration-300 ease-in-out`}
      onMouseEnter={() => {
        setMouseHoveringOnToolbar(true);
        if (isCollapsed && isCollapsible) {
          expandToolbar(); // Usamos la nueva función para expandir
        }
      }}
      onMouseLeave={() => {
        setMouseHoveringOnToolbar(false);
        resetCollapseTimer();
      }}
      // Aplicamos los estilos calculados basados en la proximidad del ratón
      style={proximityStyles}
    >
      {groupOrder.map((groupName, groupIndex) => renderGroup(groupName, groupIndex))}
      {renderCollapseButton()}
    </div>
  );
};

export default Toolbar;