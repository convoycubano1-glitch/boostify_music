/**
 * Componente para gestionar las capas en el editor de línea de tiempo
 * Permite crear, editar, eliminar y configurar capas
 */

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { Trash2, Lock, Unlock, Eye, EyeOff, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  LayerType,
  DEFAULT_LAYERS,
  AI_PLACEHOLDER_RESTRICTIONS,
} from '../../constants/timeline-constants';
import { type LayerConfig } from '../../hooks/useTimelineLayers';
import { TimelineClip } from '../../hooks/useIsolatedLayers';

interface LayerManagerProps {
  layers: LayerConfig[];
  clips: TimelineClip[];
  visibleLayers: Record<number, boolean>;
  lockedLayers: Record<number, boolean>;
  selectedLayerId: number | null;
  onAddLayer: (type: LayerType) => void;
  onRemoveLayer: (id: number) => void;
  onUpdateLayer: (id: number, updates: Partial<LayerConfig>) => void;
  onToggleLayerVisibility: (id: number) => void;
  onToggleLayerLock: (id: number) => void;
  onSelectLayer: (id: number | null) => void;
}

export default function LayerManager({
  layers,
  clips,
  visibleLayers,
  lockedLayers,
  selectedLayerId,
  onAddLayer,
  onRemoveLayer,
  onUpdateLayer,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onSelectLayer,
}: LayerManagerProps) {
  const [newLayerType, setNewLayerType] = useState<LayerType>(LayerType.IMAGE);

  // Verificar si una capa tiene clips
  const layerHasClips = (layerId: number) => {
    return clips.some(clip => clip.layer === layerId);
  };

  // Verificar si una capa puede ser eliminada
  const canDeleteLayer = (layer: LayerConfig) => {
    // No permitir eliminar la capa de audio principal
    if (layer.type === LayerType.AUDIO && layer.id === 0) return false;

    // No permitir eliminar capas con clips
    if (layerHasClips(layer.id)) return false;

    return true;
  };

  return (
    <div className="layer-manager p-2 bg-background border rounded-md">
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <h3 className="text-lg font-semibold">Capas</h3>
        <div className="flex space-x-2">
          <Select
            value={newLayerType}
            onValueChange={(value) => setNewLayerType(value as LayerType)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Tipo de capa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LayerType.IMAGE}>Imagen</SelectItem>
              <SelectItem value={LayerType.TEXT}>Texto</SelectItem>
              <SelectItem value={LayerType.EFFECT}>Efecto</SelectItem>
              <SelectItem value={LayerType.AUDIO}>Audio</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => onAddLayer(newLayerType)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Añadir
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`
              flex items-center p-2 border rounded-md cursor-pointer transition-colors
              ${selectedLayerId === layer.id ? 'bg-accent/30' : 'hover:bg-accent/10'}
            `}
            onClick={() => onSelectLayer(layer.id)}
            style={{ borderLeftColor: layer.color, borderLeftWidth: '4px' }}
          >
            <div className="flex-1 mr-2">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: layer.color }}
                />
                <span className="font-semibold">{layer.name}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {layer.type.toString()} {layer.isIsolated ? '(aislada)' : ''}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLayerVisibility(layer.id);
                }}
                title={visibleLayers[layer.id] ? 'Ocultar capa' : 'Mostrar capa'}
              >
                {visibleLayers[layer.id] ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLayerLock(layer.id);
                }}
                title={lockedLayers[layer.id] ? 'Desbloquear capa' : 'Bloquear capa'}
              >
                {lockedLayers[layer.id] ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>

              {canDeleteLayer(layer) && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLayer(layer.id);
                  }}
                  title="Eliminar capa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {layers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No hay capas definidas. Agrega una nueva capa para comenzar.
          </div>
        )}
      </div>

      {selectedLayerId !== null && (
        <div className="mt-4 pt-3 border-t">
          <h4 className="font-medium mb-2">Editar capa seleccionada</h4>
          {layers.find(l => l.id === selectedLayerId) && (
            <div className="space-y-3">
              <div className="flex flex-col space-y-1">
                <label className="text-sm">Nombre</label>
                <Input
                  value={layers.find(l => l.id === selectedLayerId)?.name || ''}
                  onChange={(e) => 
                    onUpdateLayer(selectedLayerId, { name: e.target.value })
                  }
                  className="h-8"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Capa aislada</label>
                <Switch
                  checked={layers.find(l => l.id === selectedLayerId)?.isIsolated || false}
                  onCheckedChange={(isIsolated) => 
                    onUpdateLayer(selectedLayerId, { isIsolated })
                  }
                  disabled={layers.find(l => l.id === selectedLayerId)?.type === LayerType.AUDIO}
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-sm">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={layers.find(l => l.id === selectedLayerId)?.color || '#cccccc'}
                    onChange={(e) => 
                      onUpdateLayer(selectedLayerId, { color: e.target.value })
                    }
                    className="w-10 h-8 rounded border p-0"
                  />
                  <Input
                    value={layers.find(l => l.id === selectedLayerId)?.color || '#cccccc'}
                    onChange={(e) => 
                      onUpdateLayer(selectedLayerId, { color: e.target.value })
                    }
                    className="h-8 flex-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}