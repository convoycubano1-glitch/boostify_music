import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

export const Toolbar: React.FC<ToolbarProps> = ({
  onToolSelect,
  activeToolId,
  showLabels = false,
  orientation = 'horizontal',
  position = 'bottom',
  language = 'es'
}) => {
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

  // El estilo Adobe Premiere usa una barra con grupos de herramientas
  const containerClasses = orientation === 'horizontal'
    ? 'flex overflow-x-auto pb-1 hide-scrollbar'
    : 'flex flex-col space-y-2';

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
  
  return (
    <div className={mainContainerClasses}>
      {groupOrder.map((groupName, groupIndex) => {
        const groupTools = groupedTools[groupName] || [];
        if (groupTools.length === 0) return null;
        
        return (
          <React.Fragment key={groupName}>
            {groupIndex > 0 && <div className={separatorClasses} />}
            <div className={groupClasses}>
              {/* Etiqueta de grupo - más destacada en vertical para Adobe Premiere */}
              {(showLabels || orientation === 'vertical') && (
                <div className={verticalGroupLabelClasses}>
                  {groupNames[groupName]}
                </div>
              )}
              
              {/* Herramientas del grupo */}
              {groupTools.map((tool) => (
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
                  {showLabels && (
                    <div className="text-xs mt-1 text-center text-zinc-400 w-full">
                      {tool.label}
                    </div>
                  )}
                </TooltipProvider>
              ))}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Toolbar;