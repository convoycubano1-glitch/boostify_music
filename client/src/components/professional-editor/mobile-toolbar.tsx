import React from 'react';
import { Button } from '../../components/ui/button';
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Save,
  Settings,
  Download,
  Upload,
  Text,
  Music,
  Video,
  Image,
  Layers,
  SlidersHorizontal,
  Sparkles,
  Layout
} from 'lucide-react';

interface MobileToolbarProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
  onConfigurePanels: () => void;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  activeTool,
  onToolSelect,
  isPlaying,
  onPlay,
  onPause,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onImport,
  onReset,
  onConfigurePanels
}) => {
  // Herramientas principales optimizadas para móvil
  const tools = [
    { id: 'cut', icon: <Scissors className="h-5 w-5" />, tooltip: 'Cortar' },
    { id: 'text', icon: <Text className="h-5 w-5" />, tooltip: 'Texto' },
    { id: 'audio', icon: <Music className="h-5 w-5" />, tooltip: 'Audio' },
    { id: 'transitions', icon: <Layers className="h-5 w-5" />, tooltip: 'Transiciones' },
    { id: 'effects', icon: <Sparkles className="h-5 w-5" />, tooltip: 'Efectos' }
  ];

  // Herramientas secundarias
  const secondaryTools = [
    { id: 'import', icon: <Upload className="h-5 w-5" />, tooltip: 'Importar', action: onImport },
    { id: 'export', icon: <Download className="h-5 w-5" />, tooltip: 'Exportar', action: onExport },
    { id: 'save', icon: <Save className="h-5 w-5" />, tooltip: 'Guardar', action: onSave },
    { id: 'reset', icon: <RotateCcw className="h-5 w-5" />, tooltip: 'Restablecer', action: onReset },
    { id: 'layout', icon: <Layout className="h-5 w-5" />, tooltip: 'Layout', action: onConfigurePanels }
  ];

  return (
    <div className="flex flex-col w-full bg-zinc-900 border-t border-zinc-800 py-1">
      {/* Botones de reproducción centralizados */}
      <div className="flex justify-center mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={isPlaying ? onPause : onPlay}
          className="h-10 w-10 rounded-full"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
      </div>

      {/* Herramientas principales en una fila */}
      <div className="grid grid-cols-5 gap-1 px-1 pb-1">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToolSelect(tool.id)}
            aria-label={tool.tooltip}
            className="h-10 flex flex-col items-center justify-center py-1 px-2"
          >
            <span className="sr-only">{tool.tooltip}</span>
            {tool.icon}
            <span className="text-[10px] mt-1">{tool.tooltip}</span>
          </Button>
        ))}
      </div>

      {/* Herramientas secundarias en una segunda fila */}
      <div className="grid grid-cols-5 gap-1 px-1">
        {secondaryTools.map((tool) => (
          <Button
            key={tool.id}
            variant="ghost"
            size="sm"
            onClick={tool.action}
            aria-label={tool.tooltip}
            className="h-10 flex flex-col items-center justify-center py-1 px-2"
          >
            <span className="sr-only">{tool.tooltip}</span>
            {tool.icon}
            <span className="text-[10px] mt-1">{tool.tooltip}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MobileToolbar;