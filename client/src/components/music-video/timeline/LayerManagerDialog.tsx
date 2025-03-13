import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Switch } from '../../../components/ui/switch';
import { Slider } from '../../../components/ui/slider';
import { Label } from '../../../components/ui/label';
import { 
  Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2, 
  Music, Video, Image, Text, Sparkles, MoveVertical,
  ChevronUp, ChevronDown, ArrowUpDown, Settings
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LayerConfig } from '../../../hooks/timeline/useTimelineLayers';
import { LayerType } from '../../../constants/timeline-constants';
import interact from 'interactjs';

interface LayerManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layers: LayerConfig[];
  visibleLayers: string[];
  lockedLayers: string[];
  onAddLayer: (config: Partial<LayerConfig>) => void;
  onRemoveLayer: (layerId: string) => void;
  onUpdateLayer: (layerId: string, updates: Partial<LayerConfig>) => void;
  onMoveLayerUp: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
  onToggleLayerVisibility: (layerId: string) => void;
  onToggleLayerLock: (layerId: string) => void;
}

/**
 * Diálogo avanzado para la gestión de capas del timeline
 * Soporta funcionalidades como:
 * - Agrupación de capas por tipo
 * - Reordenamiento con arrastrar y soltar
 * - Configuración específica por tipo de capa
 * - Visibilidad y bloqueo de capas
 */
export function LayerManagerDialog({
  open,
  onOpenChange,
  layers,
  visibleLayers,
  lockedLayers,
  onAddLayer,
  onRemoveLayer,
  onUpdateLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onToggleLayerVisibility,
  onToggleLayerLock
}: LayerManagerDialogProps) {
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Estado para la capa seleccionada
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  
  // Estado para el nuevo nombre de capa
  const [newLayerName, setNewLayerName] = useState<string>('');
  const [newLayerType, setNewLayerType] = useState<LayerType>(LayerType.VIDEO);
  
  // Referencia para los elementos de capa arrastrables
  const layerItemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Agrupar capas por tipo
  const layersByType = {
    audio: layers.filter(layer => layer.type === LayerType.AUDIO),
    video: layers.filter(layer => layer.type === LayerType.VIDEO),
    text: layers.filter(layer => layer.type === LayerType.TEXT),
    effects: layers.filter(layer => layer.type === LayerType.EFFECTS),
  };
  
  // Inicializar interactjs para arrastrar y soltar
  useEffect(() => {
    if (open) {
      const draggableItems = document.querySelectorAll('.layer-item');
      
      draggableItems.forEach(item => {
        interact(item as HTMLElement)
          .draggable({
            inertia: true,
            modifiers: [
              interact.modifiers.restrictRect({
                restriction: 'parent',
                endOnly: true
              })
            ],
            autoScroll: true,
            listeners: {
              move: dragMoveListener,
              end: event => {
                const layerId = (event.target as HTMLElement).getAttribute('data-layer-id');
                const targetIndex = Array.from(draggableItems).indexOf(event.target);
                
                // Aquí implementaríamos la lógica para reordenar las capas basadas en la nueva posición
                // Por ahora, simplemente reseteamos la posición
                (event.target as HTMLElement).style.transform = 'translate(0px, 0px)';
                (event.target as HTMLElement).setAttribute('data-x', '0');
                (event.target as HTMLElement).setAttribute('data-y', '0');
              }
            }
          });
      });
    }
    
    function dragMoveListener(event: any) {
      const target = event.target;
      // Mantener la posición x fija (solo mover verticalmente)
      const x = 0;
      const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
      
      // Actualizar posición del elemento
      target.style.transform = `translate(${x}px, ${y}px)`;
      
      // Actualizar atributos de posición
      target.setAttribute('data-x', x);
      target.setAttribute('data-y', y);
    }
    
    return () => {
      // Limpiar interactjs al desmontar
      draggableItems.forEach(item => {
        interact(item as HTMLElement).unset();
      });
    };
  }, [open, layers]);
  
  // Manejador para añadir una nueva capa
  const handleAddLayer = () => {
    const name = newLayerName.trim() || `Layer ${layers.length + 1}`;
    
    onAddLayer({
      name,
      type: newLayerType,
      visible: true,
      locked: false,
      height: 50, // Altura predeterminada
    });
    
    // Limpiar formulario
    setNewLayerName('');
    setNewLayerType(LayerType.VIDEO);
  };
  
  // Renderizar ícono según tipo de capa
  const renderLayerTypeIcon = (type: LayerType) => {
    switch (type) {
      case LayerType.AUDIO:
        return <Music size={16} className="text-blue-500" />;
      case LayerType.VIDEO:
        return <Video size={16} className="text-purple-500" />;
      case LayerType.TEXT:
        return <Text size={16} className="text-amber-500" />;
      case LayerType.EFFECTS:
        return <Sparkles size={16} className="text-pink-500" />;
      default:
        return <Layers size={16} />;
    }
  };
  
  // Renderizar elemento de capa
  const renderLayerItem = (layer: LayerConfig) => {
    const isVisible = visibleLayers.includes(layer.id.toString());
    const isLocked = lockedLayers.includes(layer.id.toString());
    
    return (
      <div
        key={layer.id}
        ref={el => layerItemsRef.current[layer.id.toString()] = el}
        data-layer-id={layer.id}
        className={cn(
          "layer-item flex items-center p-3 border rounded-md mb-2 transition-colors cursor-move",
          "hover:bg-muted/60",
          selectedLayer === layer.id.toString() ? "bg-muted/70 border-primary/50" : "bg-muted/30",
          isLocked ? "border-red-200" : ""
        )}
        onClick={() => setSelectedLayer(layer.id.toString())}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1 rounded bg-muted">
            {renderLayerTypeIcon(layer.type)}
          </div>
          <div>
            <div className="font-medium text-sm">{layer.name}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {layer.type === LayerType.AUDIO ? 'Audio' : 
               layer.type === LayerType.VIDEO ? 'Video/Image' : 
               layer.type === LayerType.TEXT ? 'Text' : 'Effects'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLayerVisibility(layer.id.toString());
            }}
          >
            {isVisible ? <Eye size={16} /> : <EyeOff size={16} className="text-muted-foreground" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLayerLock(layer.id.toString());
            }}
          >
            {isLocked ? <Lock size={16} className="text-red-500" /> : <Unlock size={16} />}
          </Button>
          
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onMoveLayerUp(layer.id.toString());
              }}
            >
              <ChevronUp size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onMoveLayerDown(layer.id.toString());
              }}
            >
              <ChevronDown size={14} />
            </Button>
          </div>
          
          {/* Mostrar botón de eliminar solo para capas personalizadas */}
          {layer.id !== LayerType.AUDIO && layer.id !== LayerType.VIDEO && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100/20"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveLayer(layer.id.toString());
              }}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Renderizar controles de configuración para la capa seleccionada
  const renderLayerSettings = () => {
    if (!selectedLayer) {
      return (
        <div className="text-center text-muted-foreground p-4">
          Selecciona una capa para ver su configuración
        </div>
      );
    }
    
    const layer = layers.find(l => l.id.toString() === selectedLayer);
    if (!layer) return null;
    
    return (
      <div className="space-y-4 p-2">
        <div className="space-y-2">
          <Label htmlFor="layer-name">Nombre de la capa</Label>
          <Input
            id="layer-name"
            value={layer.name}
            onChange={(e) => onUpdateLayer(selectedLayer, { name: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Altura (px)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[layer.height]}
              min={30}
              max={100}
              step={1}
              className="flex-1"
              onValueChange={(value) => onUpdateLayer(selectedLayer, { height: value[0] })}
            />
            <span className="w-10 text-sm text-center">{layer.height}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Visibilidad</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={visibleLayers.includes(selectedLayer)}
              onCheckedChange={(checked) => {
                if (checked !== visibleLayers.includes(selectedLayer)) {
                  onToggleLayerVisibility(selectedLayer);
                }
              }}
            />
            <span className="text-sm">
              {visibleLayers.includes(selectedLayer) ? 'Visible' : 'Oculto'}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Bloqueo</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={lockedLayers.includes(selectedLayer)}
              onCheckedChange={(checked) => {
                if (checked !== lockedLayers.includes(selectedLayer)) {
                  onToggleLayerLock(selectedLayer);
                }
              }}
            />
            <span className="text-sm">
              {lockedLayers.includes(selectedLayer) ? 'Bloqueado' : 'Desbloqueado'}
            </span>
          </div>
        </div>
        
        {/* Configuración específica para cada tipo de capa */}
        {layer.type === LayerType.AUDIO && (
          <div className="space-y-2 border-t pt-2">
            <Label>Configuración de Audio</Label>
            <div className="space-y-2">
              <Label htmlFor="audio-volume" className="text-xs">Volumen</Label>
              <Slider
                id="audio-volume"
                value={[layer.metadata?.volume || 100]}
                min={0}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={(value) => onUpdateLayer(selectedLayer, { 
                  metadata: { ...layer.metadata, volume: value[0] } 
                })}
              />
            </div>
          </div>
        )}
        
        {layer.type === LayerType.VIDEO && (
          <div className="space-y-2 border-t pt-2">
            <Label>Configuración de Video</Label>
            <div className="space-y-2">
              <Label htmlFor="video-opacity" className="text-xs">Opacidad</Label>
              <Slider
                id="video-opacity"
                value={[layer.metadata?.opacity || 100]}
                min={0}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={(value) => onUpdateLayer(selectedLayer, { 
                  metadata: { ...layer.metadata, opacity: value[0] } 
                })}
              />
            </div>
          </div>
        )}
        
        {layer.type === LayerType.TEXT && (
          <div className="space-y-2 border-t pt-2">
            <Label>Configuración de Texto</Label>
            <div className="space-y-2">
              <Label htmlFor="text-size" className="text-xs">Tamaño del texto</Label>
              <Select
                value={layer.metadata?.fontSize || 'medium'}
                onValueChange={(value) => onUpdateLayer(selectedLayer, { 
                  metadata: { ...layer.metadata, fontSize: value } 
                })}
              >
                <SelectTrigger id="text-size">
                  <SelectValue placeholder="Tamaño del texto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeño</SelectItem>
                  <SelectItem value="medium">Mediano</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {layer.type === LayerType.EFFECTS && (
          <div className="space-y-2 border-t pt-2">
            <Label>Configuración de Efectos</Label>
            <div className="space-y-2">
              <Label htmlFor="effect-intensity" className="text-xs">Intensidad</Label>
              <Slider
                id="effect-intensity"
                value={[layer.metadata?.intensity || 50]}
                min={0}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={(value) => onUpdateLayer(selectedLayer, { 
                  metadata: { ...layer.metadata, intensity: value[0] } 
                })}
              />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Administrador de Capas
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Panel izquierdo: Lista de capas */}
          <div className="col-span-2 border rounded-md bg-card">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="p-3 border-b flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="all" className="flex items-center gap-1">
                    <Layers size={14} />
                    <span>Todas</span>
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="flex items-center gap-1">
                    <Music size={14} />
                    <span>Audio</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center gap-1">
                    <Video size={14} />
                    <span>Video</span>
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-1">
                    <Text size={14} />
                    <span>Texto</span>
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="flex items-center gap-1">
                    <Sparkles size={14} />
                    <span>Efectos</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => {
                      // Reset de selección de capa
                      setSelectedLayer(null);
                    }}
                  >
                    <ArrowUpDown size={14} className="mr-1" />
                    Reordenar
                  </Button>
                </div>
              </div>
              
              <div className="p-3">
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Nombre de la capa"
                    value={newLayerName}
                    onChange={(e) => setNewLayerName(e.target.value)}
                    className="flex-1"
                  />
                  <Select 
                    value={newLayerType.toString()} 
                    onValueChange={(value) => setNewLayerType(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LayerType.AUDIO.toString()}>Audio</SelectItem>
                      <SelectItem value={LayerType.VIDEO.toString()}>Video</SelectItem>
                      <SelectItem value={LayerType.TEXT.toString()}>Texto</SelectItem>
                      <SelectItem value={LayerType.EFFECTS.toString()}>Efectos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="default" onClick={handleAddLayer}>
                    <Plus size={14} className="mr-1" />
                    Añadir
                  </Button>
                </div>
                
                <ScrollArea className="h-[calc(70vh-12rem)]">
                  <TabsContent value="all" className="mt-0 space-y-1">
                    {layers.length === 0 ? (
                      <div className="text-center text-muted-foreground p-4">
                        No hay capas disponibles. Añade una para comenzar.
                      </div>
                    ) : (
                      layers.map(renderLayerItem)
                    )}
                  </TabsContent>
                  
                  <TabsContent value="audio" className="mt-0 space-y-1">
                    {layersByType.audio.length === 0 ? (
                      <div className="text-center text-muted-foreground p-4">
                        No hay capas de audio disponibles.
                      </div>
                    ) : (
                      layersByType.audio.map(renderLayerItem)
                    )}
                  </TabsContent>
                  
                  <TabsContent value="video" className="mt-0 space-y-1">
                    {layersByType.video.length === 0 ? (
                      <div className="text-center text-muted-foreground p-4">
                        No hay capas de video disponibles.
                      </div>
                    ) : (
                      layersByType.video.map(renderLayerItem)
                    )}
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-0 space-y-1">
                    {layersByType.text.length === 0 ? (
                      <div className="text-center text-muted-foreground p-4">
                        No hay capas de texto disponibles.
                      </div>
                    ) : (
                      layersByType.text.map(renderLayerItem)
                    )}
                  </TabsContent>
                  
                  <TabsContent value="effects" className="mt-0 space-y-1">
                    {layersByType.effects.length === 0 ? (
                      <div className="text-center text-muted-foreground p-4">
                        No hay capas de efectos disponibles.
                      </div>
                    ) : (
                      layersByType.effects.map(renderLayerItem)
                    )}
                  </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </div>
          
          {/* Panel derecho: Configuración de capa seleccionada */}
          <div className="border rounded-md bg-card">
            <div className="p-3 border-b flex items-center">
              <Settings size={14} className="mr-2" />
              <h3 className="text-sm font-medium">Configuración de Capa</h3>
            </div>
            <ScrollArea className="h-[calc(70vh-8rem)]">
              {renderLayerSettings()}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}