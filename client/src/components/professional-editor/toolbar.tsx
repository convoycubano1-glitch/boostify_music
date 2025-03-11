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
  Camera as CameraIcon
} from 'lucide-react';

export interface ToolbarProps {
  onToolSelect: (tool: string) => void;
  activeToolId?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  position?: 'top' | 'bottom' | 'left' | 'right';
  language?: 'es' | 'en';
}

const TOOLS = {
  es: [
    { id: 'cut', icon: <Scissors className="h-5 w-5" />, label: 'Cortar' },
    { id: 'audio', icon: <Music className="h-5 w-5" />, label: 'Audio' },
    { id: 'text', icon: <Type className="h-5 w-5" />, label: 'Texto' },
    { id: 'effects', icon: <Wand2 className="h-5 w-5" />, label: 'Efectos' },
    { id: 'transitions', icon: <Layers className="h-5 w-5" />, label: 'Transiciones' },
    { id: 'stickers', icon: <Image className="h-5 w-5" />, label: 'Stickers' },
    { id: 'templates', icon: <LayoutGrid className="h-5 w-5" />, label: 'Plantillas' },
    { id: 'camera', icon: <CameraIcon className="h-5 w-5" />, label: 'Cámara' },
    { id: 'speed', icon: <Clock className="h-5 w-5" />, label: 'Velocidad' },
    { id: 'volume', icon: <Volume2 className="h-5 w-5" />, label: 'Volumen' },
    { id: 'settings', icon: <SlidersHorizontal className="h-5 w-5" />, label: 'Ajustes' }
  ],
  en: [
    { id: 'cut', icon: <Scissors className="h-5 w-5" />, label: 'Cut' },
    { id: 'audio', icon: <Music className="h-5 w-5" />, label: 'Audio' },
    { id: 'text', icon: <Type className="h-5 w-5" />, label: 'Text' },
    { id: 'effects', icon: <Wand2 className="h-5 w-5" />, label: 'Effects' },
    { id: 'transitions', icon: <Layers className="h-5 w-5" />, label: 'Transitions' },
    { id: 'stickers', icon: <Image className="h-5 w-5" />, label: 'Stickers' },
    { id: 'templates', icon: <LayoutGrid className="h-5 w-5" />, label: 'Templates' },
    { id: 'camera', icon: <CameraIcon className="h-5 w-5" />, label: 'Camera' },
    { id: 'speed', icon: <Clock className="h-5 w-5" />, label: 'Speed' },
    { id: 'volume', icon: <Volume2 className="h-5 w-5" />, label: 'Volume' },
    { id: 'settings', icon: <SlidersHorizontal className="h-5 w-5" />, label: 'Settings' }
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

  // El estilo CapCut usa una barra con scroll horizontal en dispositivos móviles
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

  // Estilo CapCut/TikTok: Botones circulares con íconos centrados
  const buttonClasses = 'rounded-full flex items-center justify-center';
  const activeToolClasses = 'bg-orange-500 text-white';
  const inactiveToolClasses = 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white';

  return (
    <div className={`toolbar ${containerClasses} ${positionClasses} p-2 bg-zinc-900 shadow-md`}>
      {tools.map((tool) => (
        <TooltipProvider key={tool.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToolSelect(tool.id)}
                className={`${buttonClasses} ${activeToolId === tool.id ? activeToolClasses : inactiveToolClasses} ${orientation === 'horizontal' ? 'mr-2' : ''
                  } h-12 w-12`}
                aria-label={tool.label}
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={orientation === 'horizontal' ? 'top' : 'right'}>
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
          {showLabels && (
            <div className="text-xs mt-1 text-center text-zinc-400">{tool.label}</div>
          )}
        </TooltipProvider>
      ))}
    </div>
  );
};

export default Toolbar;