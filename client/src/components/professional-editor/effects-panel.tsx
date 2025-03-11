import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Sparkles, 
  Wand2, 
  ArrowLeftRight,
  Paintbrush,
  SlidersHorizontal,
  Zap,
  Layers,
  History
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface EffectsPanelProps {
  selectedClipId: number | null;
  effects: Array<{
    id: string;
    name: string;
    icon: string;
    category?: string;
    min?: number;
    max?: number;
    default?: number;
    lutOptions?: Array<{id: string, name: string}>;
  }>;
  onApplyEffect: (effectType: string, parameters?: Record<string, any>) => void;
  // Clips actuales para poder modificar el seleccionado
  clips: Array<any>;
  // Función para actualizar un clip
  onClipUpdate?: (clipId: number, updates: any) => void;
}

export function EffectsPanel({
  selectedClipId,
  effects,
  onApplyEffect,
  clips,
  onClipUpdate
}: EffectsPanelProps) {
  const [activeTab, setActiveTab] = useState('transitions');
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [effectIntensity, setEffectIntensity] = useState(50);
  const [effectDuration, setEffectDuration] = useState(1.0);
  const [colorParams, setColorParams] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 1,
    hue: 0,
    temperature: 0
  });
  const [editHistory, setEditHistory] = useState<Array<{ timestamp: number, action: string }>>([]);
  const [selectedLut, setSelectedLut] = useState<string | null>(null);
  
  // Obtener el clip seleccionado, si existe
  const selectedClip = selectedClipId !== null 
    ? clips.find(clip => clip.id === selectedClipId) 
    : null;

  // Función para actualizar el historial de ediciones
  const addToHistory = (action: string) => {
    const newEntry = { timestamp: Date.now(), action };
    setEditHistory([newEntry, ...editHistory.slice(0, 19)]); // Limitar a 20 entradas
  };
  
  // Función para aplicar un efecto con parámetros
  const handleApplyEffect = (effectId: string, params?: Record<string, any>) => {
    if (!selectedClipId) return;
    
    // Crear un objeto de parámetros si no se proporcionó
    const parameters = params || { 
      intensity: effectIntensity / 100,
      duration: effectDuration
    };
    
    onApplyEffect(effectId, parameters);
    setSelectedEffect(effectId);
    addToHistory(`Aplicado efecto "${effects.find(e => e.id === effectId)?.name || effectId}"`);
    
    // Si tenemos onClipUpdate, actualizamos los efectos del clip
    if (onClipUpdate && selectedClip) {
      // Determinar la categoría del efecto
      const effectInfo = effects.find(e => e.id === effectId);
      const category = effectInfo?.category || 'visual';
      
      let clipEffects = selectedClip.effects || [];
      
      // Si es un efecto de color, lo agregamos a filters en lugar de effects
      if (category === 'color') {
        const clipFilters = selectedClip.filters || [];
        // Verificar si el filtro ya existe
        const existingFilterIndex = clipFilters.findIndex((f: any) => f.id === effectId);
        
        if (existingFilterIndex >= 0) {
          // Actualizar filtro existente
          const updatedFilters = [...clipFilters];
          updatedFilters[existingFilterIndex] = { 
            ...updatedFilters[existingFilterIndex], 
            ...parameters,
            enabled: true
          };
          onClipUpdate(selectedClipId, { filters: updatedFilters });
        } else {
          // Agregar nuevo filtro
          onClipUpdate(selectedClipId, { 
            filters: [...clipFilters, { id: effectId, ...parameters, enabled: true }] 
          });
        }
      } else {
        // Para efectos normales
        const newEffect = { 
          id: effectId, 
          ...parameters,
          appliedAt: new Date().toISOString()
        };
        
        onClipUpdate(selectedClipId, { effects: [...clipEffects, newEffect] });
      }
    }
  };
  
  // Función para deshacer la última edición
  const handleUndo = () => {
    if (editHistory.length === 0 || !selectedClipId || !onClipUpdate || !selectedClip) return;
    
    // Para simplificar, simplemente quitamos el último efecto aplicado
    if (selectedClip.effects && selectedClip.effects.length > 0) {
      const updatedEffects = [...selectedClip.effects];
      updatedEffects.pop(); // Eliminar el último efecto
      
      onClipUpdate(selectedClipId, { effects: updatedEffects });
      
      // Actualizar historial
      const newHistory = [...editHistory];
      newHistory.shift(); // Eliminar la entrada más reciente
      setEditHistory(newHistory);
      
      addToHistory('Deshacer última acción');
    }
  };
  
  // Función para aplicar corrección de color
  const handleColorCorrection = (type: keyof typeof colorParams, value: number) => {
    if (!selectedClipId || !onClipUpdate) return;
    
    // Actualizar estado local
    setColorParams(prev => ({ ...prev, [type]: value }));
    
    // Obtener los valores mínimo y máximo para este parámetro
    const effectInfo = effects.find(e => e.id === type);
    const min = effectInfo?.min || -1;
    const max = effectInfo?.max || 1;
    
    // Normalizar el valor entre 0 y 1 para la intensidad del efecto
    const normalizedValue = (value - min) / (max - min);
    
    // Aplicar corrección de color
    handleApplyEffect(type, { value, normalizedValue });
  };
  
  // Función para renderizar un icono basado en su tipo
  const renderEffectIcon = (iconType: string) => {
    switch (iconType) {
      // Transiciones
      case 'fade':
        return <div className="h-6 w-12 bg-gradient-to-r from-transparent to-gray-800 rounded" />;
      case 'dissolve':
        return <div className="h-6 w-12 bg-gray-400 opacity-50 rounded" />;
      case 'wipe':
        return <div className="h-6 w-12 relative overflow-hidden rounded">
          <div className="absolute inset-0 bg-gray-800"></div>
          <div className="absolute inset-0 bg-gray-400" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}></div>
        </div>;
      case 'zoom':
        return <div className="h-6 w-12 bg-gray-800 flex items-center justify-center">
          <div className="h-4 w-8 bg-gray-400 rounded-sm"></div>
        </div>;
      case 'slide':
        return <div className="h-6 w-12 relative overflow-hidden rounded">
          <div className="absolute inset-0 bg-gray-800"></div>
          <div className="absolute inset-0 top-0 bottom-0 w-1/2 bg-gray-400" 
               style={{ left: '25%' }}></div>
        </div>;
      case 'push':
        return <div className="h-6 w-12 relative overflow-hidden rounded">
          <div className="absolute inset-0 bg-gray-800"></div>
          <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gray-400"></div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-400"></div>
        </div>;
      case 'flip':
        return <div className="h-6 w-12 relative overflow-hidden rounded">
          <div className="absolute inset-0 bg-gray-800 transform rotate-180"></div>
          <div className="absolute inset-0 bg-gray-400" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}></div>
        </div>;
      case 'rotate':
        return <div className="h-6 w-12 relative overflow-hidden rounded">
          <div className="absolute inset-0 bg-gray-400 transform rotate-45"></div>
        </div>;
        
      // Efectos visuales
      case 'blur':
        return <div className="h-6 w-12 bg-gray-400 filter blur-[2px] rounded"></div>;
      case 'b&w':
        return <div className="h-6 w-12 bg-gray-500 rounded"></div>;
      case 'sepia':
        return <div className="h-6 w-12 bg-yellow-700/50 rounded"></div>;
      case 'vignette':
        return <div className="h-6 w-12 bg-gradient-to-r from-gray-800 via-gray-400 to-gray-800 rounded"></div>;
      case 'grainy':
        return <div className="h-6 w-12 bg-gray-400 rounded" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")' }}></div>;
      case 'mirror':
        return <div className="h-6 w-12 relative overflow-hidden rounded">
          <div className="absolute inset-0 bg-gray-400"></div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gray-400 transform scale-x-[-1]"></div>
        </div>;
      case 'pixelate':
        return <div className="h-6 w-12 relative overflow-hidden rounded">
          <div className="grid grid-cols-6 grid-rows-3 h-full w-full">
            {Array(18).fill(0).map((_, i) => (
              <div key={i} className="bg-gray-400 border border-gray-500"></div>
            ))}
          </div>
        </div>;
        
      // Corrección de color
      case 'brightness':
        return <div className="h-6 w-12 bg-white rounded"></div>;
      case 'contrast':
        return <div className="h-6 w-12 bg-gradient-to-r from-gray-500 to-white rounded"></div>;
      case 'saturation':
        return <div className="h-6 w-12 bg-gradient-to-r from-gray-400 to-blue-500 rounded"></div>;
      case 'hue':
        return <div className="h-6 w-12 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded"></div>;
      case 'temperature':
        return <div className="h-6 w-12 bg-gradient-to-r from-blue-500 to-yellow-500 rounded"></div>;
      
      // Mejoras
      case 'stabilize':
        return <div className="h-6 w-12 bg-blue-100 rounded flex items-center justify-center">
          <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
        </div>;
      case 'denoise':
        return <div className="h-6 w-12 bg-gradient-to-r from-gray-300 to-gray-100 rounded"></div>;
      case 'sharpen':
        return <div className="h-6 w-12 bg-white border-2 border-gray-800 rounded"></div>;
      
      default:
        return <Sparkles className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="transitions">
            <ArrowLeftRight className="h-4 w-4 mr-1.5" /> Transiciones
          </TabsTrigger>
          <TabsTrigger value="visual">
            <Wand2 className="h-4 w-4 mr-1.5" /> Efectos
          </TabsTrigger>
          <TabsTrigger value="color">
            <Paintbrush className="h-4 w-4 mr-1.5" /> Color
          </TabsTrigger>
          <TabsTrigger value="enhance">
            <Zap className="h-4 w-4 mr-1.5" /> Mejoras
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1.5" /> Historial
          </TabsTrigger>
        </TabsList>
        
        {/* Panel de Transiciones */}
        <TabsContent value="transitions" className="min-h-[200px]">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <ArrowLeftRight className="h-4 w-4 mr-1.5 text-blue-500" />
                <h3 className="text-sm font-semibold">Transiciones Dinámicas</h3>
              </div>
              
              <Select 
                value={selectedEffect || ''}
                onValueChange={(value) => setSelectedEffect(value === '' ? null : value)}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Tipo de transición" />
                </SelectTrigger>
                <SelectContent>
                  {effects
                    .filter(effect => effect.category === 'transition')
                    .map(effect => (
                      <SelectItem key={effect.id} value={effect.id}>
                        {effect.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="h-[150px] mb-3">
              <div className="grid grid-cols-3 gap-2">
                {effects
                  .filter(effect => effect.category === 'transition')
                  .map(effect => (
                    <Button 
                      key={`transition-${effect.id}`}
                      variant={selectedEffect === effect.id ? "default" : "outline"}
                      className="h-auto py-2 justify-start"
                      disabled={selectedClipId === null}
                      onClick={() => {
                        setSelectedEffect(effect.id);
                        handleApplyEffect(`transition-${effect.id}`);
                      }}
                    >
                      <div className="mr-2">
                        {renderEffectIcon(effect.icon)}
                      </div>
                      <span className="text-xs">{effect.name}</span>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
            
            {selectedEffect && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Intensidad
                  </label>
                  <Slider
                    value={[effectIntensity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => setEffectIntensity(values[0])}
                    onValueCommit={() => {
                      if (selectedEffect) {
                        handleApplyEffect(`transition-${selectedEffect}`, {
                          intensity: effectIntensity / 100,
                          duration: effectDuration
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Duración (segundos)
                  </label>
                  <Slider
                    value={[effectDuration * 10]}
                    min={1}
                    max={50}
                    step={1}
                    onValueChange={(values) => setEffectDuration(values[0] / 10)}
                    onValueCommit={() => {
                      if (selectedEffect) {
                        handleApplyEffect(`transition-${selectedEffect}`, {
                          intensity: effectIntensity / 100,
                          duration: effectDuration
                        });
                      }
                    }}
                  />
                  <p className="text-xs text-right mt-1">{effectDuration.toFixed(1)}s</p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        
        {/* Panel de Efectos Visuales */}
        <TabsContent value="visual" className="min-h-[200px]">
          <Card className="p-3">
            <div className="flex items-center mb-3">
              <Wand2 className="h-4 w-4 mr-1.5 text-purple-500" />
              <h3 className="text-sm font-semibold">Efectos Visuales</h3>
            </div>
            
            <ScrollArea className="h-[150px] mb-3">
              <div className="grid grid-cols-3 gap-2">
                {effects
                  .filter(effect => effect.category === 'visual')
                  .map(effect => (
                    <Button 
                      key={`effect-${effect.id}`}
                      variant={selectedEffect === effect.id ? "default" : "outline"}
                      className="h-auto py-2 justify-start"
                      disabled={selectedClipId === null}
                      onClick={() => {
                        setSelectedEffect(effect.id);
                        handleApplyEffect(`effect-${effect.id}`);
                      }}
                    >
                      <div className="mr-2">
                        {renderEffectIcon(effect.icon)}
                      </div>
                      <span className="text-xs">{effect.name}</span>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
            
            {selectedEffect && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Intensidad
                  </label>
                  <Slider
                    value={[effectIntensity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => setEffectIntensity(values[0])}
                    onValueCommit={() => {
                      if (selectedEffect) {
                        handleApplyEffect(`effect-${selectedEffect}`, {
                          intensity: effectIntensity / 100,
                          duration: effectDuration
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mt-4">
                    <Switch id="effect-enable" defaultChecked={true} />
                    <Label htmlFor="effect-enable">Efecto activo</Label>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        
        {/* Panel de Corrección de Color */}
        <TabsContent value="color" className="min-h-[200px]">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Paintbrush className="h-4 w-4 mr-1.5 text-orange-500" />
                <h3 className="text-sm font-semibold">Corrección de Color</h3>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (!selectedClipId || !onClipUpdate) return;
                  // Restablecer todos los valores de color
                  setColorParams({
                    brightness: 0,
                    contrast: 0,
                    saturation: 1,
                    hue: 0,
                    temperature: 0
                  });
                  
                  // Actualizar clip para eliminar todos los filtros
                  onClipUpdate(selectedClipId, { filters: [] });
                }}
              >
                Restablecer
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Brillo */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-medium">Brillo</label>
                  <span className="text-xs">{colorParams.brightness.toFixed(2)}</span>
                </div>
                <Slider
                  value={[colorParams.brightness * 100]}
                  min={-100}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleColorCorrection('brightness', values[0] / 100)}
                />
              </div>
              
              {/* Contraste */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-medium">Contraste</label>
                  <span className="text-xs">{colorParams.contrast.toFixed(2)}</span>
                </div>
                <Slider
                  value={[colorParams.contrast * 100]}
                  min={-100}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleColorCorrection('contrast', values[0] / 100)}
                />
              </div>
              
              {/* Saturación */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-medium">Saturación</label>
                  <span className="text-xs">{colorParams.saturation.toFixed(2)}</span>
                </div>
                <Slider
                  value={[colorParams.saturation * 50]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleColorCorrection('saturation', values[0] / 50)}
                />
              </div>
              
              {/* Tono */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-medium">Tono</label>
                  <span className="text-xs">{Math.round(colorParams.hue)}°</span>
                </div>
                <Slider
                  value={[colorParams.hue]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(values) => handleColorCorrection('hue', values[0])}
                />
              </div>
              
              {/* Temperatura */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-medium">Temperatura</label>
                  <span className="text-xs">{colorParams.temperature > 0 ? '+' : ''}{colorParams.temperature.toFixed(2)}</span>
                </div>
                <Slider
                  value={[colorParams.temperature * 100]}
                  min={-100}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleColorCorrection('temperature', values[0] / 100)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
        
        {/* Panel de Mejoras */}
        <TabsContent value="enhance" className="min-h-[200px]">
          <Card className="p-3">
            <div className="flex items-center mb-3">
              <Zap className="h-4 w-4 mr-1.5 text-yellow-500" />
              <h3 className="text-sm font-semibold">Mejoras con IA</h3>
            </div>
            
            <ScrollArea className="h-[150px] mb-3">
              <div className="grid grid-cols-2 gap-2">
                {effects
                  .filter(effect => effect.category === 'enhance')
                  .map(effect => (
                    <Button 
                      key={`enhance-${effect.id}`}
                      variant={selectedEffect === effect.id ? "default" : "outline"}
                      className="h-auto py-2 justify-start"
                      disabled={selectedClipId === null}
                      onClick={() => {
                        if (effect.id === 'lut') {
                          // Para LUTs, mostramos las opciones
                          setSelectedEffect(effect.id);
                        } else {
                          // Para otros efectos de mejora, aplicarlos directamente
                          setSelectedEffect(effect.id);
                          handleApplyEffect(`enhance-${effect.id}`);
                        }
                      }}
                    >
                      <div className="mr-2">
                        {renderEffectIcon(effect.icon)}
                      </div>
                      <span className="text-xs">{effect.name}</span>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
            
            {selectedEffect === 'lut' && (
              <div className="mt-3">
                <label className="text-xs text-muted-foreground block mb-2">
                  Seleccionar LUT (Look-Up Table)
                </label>
                <Select 
                  value={selectedLut || ''}
                  onValueChange={(value) => {
                    setSelectedLut(value);
                    if (value) {
                      handleApplyEffect('enhance-lut', { lutType: value });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {effects
                      .find(e => e.id === 'lut')?.lutOptions?.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground block mb-1">
                    Intensidad del LUT
                  </label>
                  <Slider
                    value={[effectIntensity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => setEffectIntensity(values[0])}
                    onValueCommit={() => {
                      if (selectedLut) {
                        handleApplyEffect('enhance-lut', {
                          lutType: selectedLut,
                          intensity: effectIntensity / 100
                        });
                      }
                    }}
                  />
                </div>
              </div>
            )}
            
            {selectedEffect === 'stabilize' && (
              <div className="mt-3">
                <p className="text-sm">La estabilización de video analiza y corrige automáticamente las vibraciones y movimientos no deseados.</p>
                <div className="mt-3">
                  <label className="text-xs text-muted-foreground block mb-1">
                    Nivel de estabilización
                  </label>
                  <Slider
                    value={[effectIntensity]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => setEffectIntensity(values[0])}
                    onValueCommit={() => {
                      handleApplyEffect('enhance-stabilize', {
                        intensity: effectIntensity / 100
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
        
        {/* Panel de Historial */}
        <TabsContent value="history" className="min-h-[200px]">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <History className="h-4 w-4 mr-1.5 text-gray-500" />
                <h3 className="text-sm font-semibold">Historial de Ediciones</h3>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUndo}
                disabled={editHistory.length === 0 || !selectedClipId}
              >
                Deshacer
              </Button>
            </div>
            
            <ScrollArea className="h-[180px]">
              {editHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay acciones en el historial
                </p>
              ) : (
                <ul className="space-y-2">
                  {editHistory.map((entry, index) => (
                    <li key={index} className="text-xs border-b pb-2">
                      <span className="font-medium">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      {' - '}
                      {entry.action}
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Acciones para el clip seleccionado */}
      <Card className="p-3">
        <h3 className="text-sm font-semibold mb-2">Clip Actual</h3>
        
        {selectedClipId === null ? (
          <p className="text-sm text-muted-foreground">
            Selecciona un clip para ver y editar sus efectos
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedClip?.title}</span>
              <span className="text-xs text-muted-foreground">
                {selectedClip?.effects?.length || 0} efectos · {selectedClip?.filters?.length || 0} filtros
              </span>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (!onClipUpdate || !selectedClipId) return;
                  // Resetear efectos
                  onClipUpdate(selectedClipId, { effects: [] });
                  addToHistory('Reiniciado efectos del clip');
                }}
              >
                Reiniciar efectos
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="flex-1"
                onClick={() => {
                  if (!selectedEffect) return;
                  handleApplyEffect(selectedEffect, {
                    intensity: effectIntensity / 100,
                    duration: effectDuration
                  });
                }}
              >
                Aplicar seleccionado
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}