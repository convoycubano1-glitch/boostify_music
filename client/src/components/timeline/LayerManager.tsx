import React from 'react';
import { Button } from '../../components/ui/button';
import { Toggle } from '../../components/ui/toggle';
import { Lock, Unlock, Eye, EyeOff, Music, Video, Type, Wand2, PlusCircle, Settings } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { ScrollArea } from '../../components/ui/scroll-area';
import { cn } from '../../lib/utils';

interface LayerConfig {
  id: number;
  name: string;
  type: 'audio' | 'video' | 'image' | 'text' | 'effect';
  locked: boolean;
  visible: boolean;
  color?: string;
  isIsolated?: boolean;
  isPlaceholder?: boolean;
}

interface LayerManagerProps {
  layers: LayerConfig[];
  visibleLayers: number[];
  lockedLayers: number[];
  onToggleLayerVisibility: (layerId: number) => void;
  onToggleLayerLock: (layerId: number) => void;
  onAddLayer?: (type: string) => void;
  className?: string;
}

/**
 * Componente para gestionar las capas del editor de timeline
 * 
 * Permite:
 * - Visualizar todas las capas del proyecto
 * - Activar/desactivar visibilidad de cada capa
 * - Bloquear/desbloquear cada capa
 * - Resaltar capas aisladas (como la capa de audio)
 */
export function LayerManager({
  layers,
  visibleLayers,
  lockedLayers,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onAddLayer,
  className
}: LayerManagerProps) {
  // Función para obtener el icono correspondiente al tipo de capa
  const getLayerTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'video':
      case 'image':
        return <Video className="h-4 w-4" />;
      case 'text':
        return <Type className="h-4 w-4" />;
      case 'effect':
        return <Wand2 className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };
  
  // Función para obtener el color específico de cada tipo de capa
  const getLayerTypeColor = (type: string) => {
    switch (type) {
      case 'audio':
        return 'text-orange-500';
      case 'video':
        return 'text-indigo-500';
      case 'image':
        return 'text-blue-500';
      case 'text':
        return 'text-violet-500';
      case 'effect':
        return 'text-emerald-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div className={cn("border rounded-md overflow-hidden bg-background/80 backdrop-blur-sm", className)}>
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium">Capas</h3>
        {onAddLayer && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => onAddLayer('default')}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agregar nueva capa</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <ScrollArea className="h-[180px] md:h-[250px]">
        <div className="p-2 space-y-1.5">
          {layers.map((layer) => (
            <div 
              key={layer.id} 
              className={cn(
                "flex items-center justify-between p-1.5 rounded-md",
                layer.isIsolated && "bg-orange-500/10 border border-orange-500/30",
                layer.isPlaceholder && "bg-yellow-500/10 border border-yellow-500/30",
                !layer.isIsolated && !layer.isPlaceholder && "hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("flex items-center justify-center", getLayerTypeColor(layer.type))}>
                  {getLayerTypeIcon(layer.type)}
                </span>
                
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {layer.name}
                </span>
                
                {layer.isIsolated && (
                  <span className="inline-flex items-center rounded-full bg-orange-500/20 px-1 py-0.5 text-[10px] font-medium text-orange-500">
                    Aislada
                  </span>
                )}
                
                {layer.isPlaceholder && (
                  <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-1 py-0.5 text-[10px] font-medium text-yellow-500">
                    AI
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        size="sm"
                        className="h-7 w-7 p-0"
                        pressed={visibleLayers.includes(layer.id)}
                        onPressedChange={() => onToggleLayerVisibility(layer.id)}
                        aria-label={visibleLayers.includes(layer.id) ? "Ocultar capa" : "Mostrar capa"}
                      >
                        {visibleLayers.includes(layer.id) ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{visibleLayers.includes(layer.id) ? "Ocultar capa" : "Mostrar capa"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Toggle
                        size="sm"
                        className="h-7 w-7 p-0"
                        pressed={lockedLayers.includes(layer.id) || layer.isIsolated}
                        onPressedChange={() => !layer.isIsolated && onToggleLayerLock(layer.id)}
                        disabled={layer.isIsolated}
                        aria-label={lockedLayers.includes(layer.id) ? "Desbloquear capa" : "Bloquear capa"}
                      >
                        {lockedLayers.includes(layer.id) || layer.isIsolated ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : (
                          <Unlock className="h-3.5 w-3.5" />
                        )}
                      </Toggle>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {layer.isIsolated 
                          ? "Capa aislada (bloqueada por seguridad)" 
                          : (lockedLayers.includes(layer.id) ? "Desbloquear capa" : "Bloquear capa")
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default LayerManager;