import React from 'react';
import { Button } from '../../components/ui/button';
import {
  Film,
  Music,
  SlidersHorizontal,
  Type,
  FileAudio,
  Image,
  Camera,
  Clock,
  Volume2,
  Wand2,
  Activity,
  Settings,
  MoreHorizontal
} from 'lucide-react';

export interface MobileToolbarProps {
  activeTool: string;
  onToolSelect: (toolId: string) => void;
}

export function MobileToolbar({ activeTool, onToolSelect }: MobileToolbarProps) {
  // Definir las herramientas disponibles
  const tools = [
    { id: 'cut', icon: <SlidersHorizontal className="h-4 w-4" />, label: 'Cortar' },
    { id: 'transitions', icon: <Activity className="h-4 w-4" />, label: 'Trans.' },
    { id: 'effects', icon: <Wand2 className="h-4 w-4" />, label: 'Efectos' },
    { id: 'audio', icon: <FileAudio className="h-4 w-4" />, label: 'Audio' },
    { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Texto' },
    { id: 'stickers', icon: <Image className="h-4 w-4" />, label: 'Stickers' },
    { id: 'camera', icon: <Camera className="h-4 w-4" />, label: 'Cámara' },
    { id: 'speed', icon: <Clock className="h-4 w-4" />, label: 'Velocidad' },
    { id: 'volume', icon: <Volume2 className="h-4 w-4" />, label: 'Volumen' },
    { id: 'more', icon: <MoreHorizontal className="h-4 w-4" />, label: 'Más' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-10 sm:hidden">
      <div className="overflow-x-auto p-2">
        <div className="flex space-x-1 min-w-max">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "secondary" : "ghost"}
              size="sm"
              className="flex-col h-14 px-2 rounded-lg focus:ring-0"
              onClick={() => onToolSelect(tool.id)}
            >
              <div className="mb-1">{tool.icon}</div>
              <span className="text-[10px]">{tool.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}