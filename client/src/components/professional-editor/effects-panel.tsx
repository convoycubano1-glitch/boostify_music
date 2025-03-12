import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Button,
  Switch,
  Label,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Input
} from '@/components/ui';
import {
  Sliders,
  PanelTop,
  Sparkles,
  Palette,
  Type,
  Wand2,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Move,
  RotateCw,
  Maximize,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Effect } from '@/lib/professional-editor-types';
import { useDroppable } from '@/hooks/use-droppable';

interface EffectsPanelProps {
  /** Efectos seleccionados actualmente */
  effects: Effect[];
  
  /** Efecto seleccionado para editar */
  selectedEffectId?: string;
  
  /** Función que se dispara cuando se selecciona un efecto */
  onSelectEffect?: (id: string) => void;
  
  /** Función para añadir un nuevo efecto */
  onAddEffect?: (effect: Omit<Effect, 'id'>) => void;
  
  /** Función para actualizar un efecto existente */
  onUpdateEffect?: (id: string, updates: Partial<Effect>) => void;
  
  /** Función para eliminar un efecto */
  onRemoveEffect?: (id: string) => void;
  
  /** Tiempo actual de reproducción (para efectos con tiempo) */
  currentTime: number;
  
  /** Duración total del proyecto */
  duration: number;
  
  /** ID del clip seleccionado actualmente */
  selectedClipId?: string;
}

/**
 * Panel de efectos para el editor profesional
 * Permite gestionar, añadir y configurar efectos visuales
 */
export function EffectsPanel({
  effects = [],
  selectedEffectId,
  onSelectEffect,
  onAddEffect,
  onUpdateEffect,
  onRemoveEffect,
  currentTime,
  duration,
  selectedClipId
}: EffectsPanelProps) {
  // Estado local
  const [activeTab, setActiveTab] = useState<string>('filters');
  const [newEffectType, setNewEffectType] = useState<string>('filter');
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [effectTypeFilter, setEffectTypeFilter] = useState<string>('all');
  
  // Configurar área droppable para efectos
  const { droppableRef, droppableProps, isOver } = useDroppable({
    id: 'effects-panel',
    acceptTypes: ['effect:filter', 'effect:transform', 'effect:color', 'effect:text', 'effect:transition'],
    onDrop: (data, position) => {
      if (onAddEffect && data) {
        onAddEffect({
          name: data.name || 'Nuevo efecto',
          type: data.type as any,
          properties: data.properties || {},
          startTime: currentTime,
          endTime: Math.min(currentTime + 5, duration),
          clipId: selectedClipId
        });
      }
    }
  });
  
  // Actualizar el efecto seleccionado cuando cambia el ID
  useEffect(() => {
    if (selectedEffectId) {
      const effect = effects.find(e => e.id === selectedEffectId);
      if (effect) {
        setSelectedEffect(effect);
      }
    } else {
      setSelectedEffect(null);
    }
  }, [selectedEffectId, effects]);
  
  // Filtrar efectos por tipo
  const filteredEffects = effectTypeFilter === 'all' 
    ? effects 
    : effects.filter(effect => effect.type === effectTypeFilter);
  
  // Funciones para gestionar efectos
  const handleAddEffect = (type: string) => {
    if (!onAddEffect) return;
    
    const defaultProperties: Record<string, any> = {};
    
    // Propiedades por defecto según el tipo de efecto
    switch (type) {
      case 'filter':
        defaultProperties.filterType = 'blur';
        defaultProperties.amount = 5;
        defaultProperties.enabled = true;
        break;
      case 'transform':
        defaultProperties.scale = 1;
        defaultProperties.rotation = 0;
        defaultProperties.positionX = 0;
        defaultProperties.positionY = 0;
        defaultProperties.enabled = true;
        break;
      case 'color':
        defaultProperties.brightness = 0;
        defaultProperties.contrast = 0;
        defaultProperties.saturation = 0;
        defaultProperties.hue = 0;
        defaultProperties.enabled = true;
        break;
      case 'text':
        defaultProperties.text = 'Texto de ejemplo';
        defaultProperties.fontSize = 24;
        defaultProperties.fontFamily = 'Arial';
        defaultProperties.color = '#ffffff';
        defaultProperties.positionX = 50;
        defaultProperties.positionY = 50;
        defaultProperties.alignment = 'center';
        defaultProperties.enabled = true;
        break;
      case 'transition':
        defaultProperties.transitionType = 'fade';
        defaultProperties.duration = 1;
        defaultProperties.easing = 'ease-in-out';
        defaultProperties.enabled = true;
        break;
    }
    
    onAddEffect({
      name: `Nuevo ${getEffectTypeName(type)}`,
      type: type as any,
      properties: defaultProperties,
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration),
      clipId: selectedClipId
    });
  };
  
  const handleRemoveEffect = (id: string) => {
    if (onRemoveEffect) {
      onRemoveEffect(id);
      if (selectedEffectId === id) {
        setSelectedEffect(null);
      }
    }
  };
  
  const handleDuplicateEffect = (effect: Effect) => {
    if (onAddEffect) {
      onAddEffect({
        name: `${effect.name} (copia)`,
        type: effect.type,
        properties: { ...effect.properties },
        startTime: effect.startTime,
        endTime: effect.endTime,
        clipId: effect.clipId
      });
    }
  };
  
  const handleToggleEffectVisibility = (id: string, enabled: boolean) => {
    if (onUpdateEffect) {
      onUpdateEffect(id, {
        properties: {
          ...(selectedEffect?.properties || {}),
          enabled: !enabled
        }
      });
    }
  };
  
  const handlePropertyChange = (propertyName: string, value: any) => {
    if (!selectedEffect || !onUpdateEffect) return;
    
    onUpdateEffect(selectedEffect.id, {
      properties: {
        ...selectedEffect.properties,
        [propertyName]: value
      }
    });
  };
  
  const handleSetStartTime = () => {
    if (!selectedEffect || !onUpdateEffect) return;
    
    onUpdateEffect(selectedEffect.id, {
      startTime: currentTime
    });
  };
  
  const handleSetEndTime = () => {
    if (!selectedEffect || !onUpdateEffect) return;
    
    onUpdateEffect(selectedEffect.id, {
      endTime: currentTime
    });
  };
  
  // Obtener nombre legible para el tipo de efecto
  const getEffectTypeName = (type: string): string => {
    switch (type) {
      case 'filter': return 'Filtro';
      case 'transform': return 'Transformación';
      case 'color': return 'Color';
      case 'text': return 'Texto';
      case 'transition': return 'Transición';
      default: return 'Efecto';
    }
  };
  
  // Obtener icono para el tipo de efecto
  const getEffectIcon = (type: string) => {
    switch (type) {
      case 'filter': return <Sliders className="h-4 w-4" />;
      case 'transform': return <Move className="h-4 w-4" />;
      case 'color': return <Palette className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      case 'transition': return <Layers className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };
  
  // Formatear tiempo en MM:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Componentes de configuración específicos para cada tipo de efecto
  
  // Configuración de filtros
  const renderFilterConfig = () => {
    if (!selectedEffect) return null;
    
    const { filterType = 'blur', amount = 5, enabled = true } = selectedEffect.properties;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="filter-type">Tipo de filtro</Label>
          <Select
            value={filterType}
            onValueChange={value => handlePropertyChange('filterType', value)}
          >
            <SelectTrigger id="filter-type">
              <SelectValue placeholder="Seleccionar tipo de filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blur">Desenfoque (Blur)</SelectItem>
              <SelectItem value="sharpen">Afilado (Sharpen)</SelectItem>
              <SelectItem value="noise">Ruido</SelectItem>
              <SelectItem value="grain">Granulado</SelectItem>
              <SelectItem value="pixelate">Pixelado</SelectItem>
              <SelectItem value="vignette">Viñeta</SelectItem>
              <SelectItem value="sepia">Sepia</SelectItem>
              <SelectItem value="grayscale">Escala de grises</SelectItem>
              <SelectItem value="invert">Invertir</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="filter-amount">Intensidad</Label>
            <span className="text-sm text-zinc-400">{amount}</span>
          </div>
          <Slider
            id="filter-amount"
            min={0}
            max={100}
            step={1}
            value={[amount]}
            onValueChange={values => handlePropertyChange('amount', values[0])}
          />
        </div>
      </div>
    );
  };
  
  // Configuración de transformación
  const renderTransformConfig = () => {
    if (!selectedEffect) return null;
    
    const { 
      scale = 1, 
      rotation = 0, 
      positionX = 0, 
      positionY = 0, 
      enabled = true 
    } = selectedEffect.properties;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="transform-scale">Escala</Label>
            <span className="text-sm text-zinc-400">{scale.toFixed(2)}x</span>
          </div>
          <Slider
            id="transform-scale"
            min={0.1}
            max={3}
            step={0.01}
            value={[scale]}
            onValueChange={values => handlePropertyChange('scale', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="transform-rotation">Rotación</Label>
            <span className="text-sm text-zinc-400">{rotation}°</span>
          </div>
          <Slider
            id="transform-rotation"
            min={-180}
            max={180}
            step={1}
            value={[rotation]}
            onValueChange={values => handlePropertyChange('rotation', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="transform-position-x">Posición X</Label>
            <span className="text-sm text-zinc-400">{positionX}%</span>
          </div>
          <Slider
            id="transform-position-x"
            min={-100}
            max={100}
            step={1}
            value={[positionX]}
            onValueChange={values => handlePropertyChange('positionX', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="transform-position-y">Posición Y</Label>
            <span className="text-sm text-zinc-400">{positionY}%</span>
          </div>
          <Slider
            id="transform-position-y"
            min={-100}
            max={100}
            step={1}
            value={[positionY]}
            onValueChange={values => handlePropertyChange('positionY', values[0])}
          />
        </div>
      </div>
    );
  };
  
  // Configuración de color
  const renderColorConfig = () => {
    if (!selectedEffect) return null;
    
    const { 
      brightness = 0, 
      contrast = 0, 
      saturation = 0, 
      hue = 0, 
      enabled = true 
    } = selectedEffect.properties;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="color-brightness">Brillo</Label>
            <span className="text-sm text-zinc-400">{brightness}</span>
          </div>
          <Slider
            id="color-brightness"
            min={-100}
            max={100}
            step={1}
            value={[brightness]}
            onValueChange={values => handlePropertyChange('brightness', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="color-contrast">Contraste</Label>
            <span className="text-sm text-zinc-400">{contrast}</span>
          </div>
          <Slider
            id="color-contrast"
            min={-100}
            max={100}
            step={1}
            value={[contrast]}
            onValueChange={values => handlePropertyChange('contrast', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="color-saturation">Saturación</Label>
            <span className="text-sm text-zinc-400">{saturation}</span>
          </div>
          <Slider
            id="color-saturation"
            min={-100}
            max={100}
            step={1}
            value={[saturation]}
            onValueChange={values => handlePropertyChange('saturation', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="color-hue">Matiz</Label>
            <span className="text-sm text-zinc-400">{hue}°</span>
          </div>
          <Slider
            id="color-hue"
            min={-180}
            max={180}
            step={1}
            value={[hue]}
            onValueChange={values => handlePropertyChange('hue', values[0])}
          />
        </div>
      </div>
    );
  };
  
  // Configuración de texto
  const renderTextConfig = () => {
    if (!selectedEffect) return null;
    
    const { 
      text = 'Texto de ejemplo', 
      fontSize = 24, 
      fontFamily = 'Arial', 
      color = '#ffffff', 
      positionX = 50, 
      positionY = 50, 
      alignment = 'center',
      enabled = true
    } = selectedEffect.properties;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text-content">Texto</Label>
          <Input
            id="text-content"
            value={text}
            onChange={e => handlePropertyChange('text', e.target.value)}
            className="bg-zinc-800 border-zinc-700"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="text-font-family">Fuente</Label>
          <Select
            value={fontFamily}
            onValueChange={value => handlePropertyChange('fontFamily', value)}
          >
            <SelectTrigger id="text-font-family">
              <SelectValue placeholder="Seleccionar fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Courier New">Courier New</SelectItem>
              <SelectItem value="Verdana">Verdana</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Palatino">Palatino</SelectItem>
              <SelectItem value="Tahoma">Tahoma</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="text-font-size">Tamaño</Label>
            <span className="text-sm text-zinc-400">{fontSize}px</span>
          </div>
          <Slider
            id="text-font-size"
            min={8}
            max={72}
            step={1}
            value={[fontSize]}
            onValueChange={values => handlePropertyChange('fontSize', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="text-color">Color</Label>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-zinc-600"
              style={{ backgroundColor: color }}
            />
            <Input
              id="text-color"
              type="color"
              value={color}
              onChange={e => handlePropertyChange('color', e.target.value)}
              className="w-16 p-0 bg-zinc-800 border-zinc-700 h-8"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="text-alignment">Alineación</Label>
          <Select
            value={alignment}
            onValueChange={value => handlePropertyChange('alignment', value)}
          >
            <SelectTrigger id="text-alignment">
              <SelectValue placeholder="Seleccionar alineación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Izquierda</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Derecha</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="text-position-x">Posición X</Label>
            <span className="text-sm text-zinc-400">{positionX}%</span>
          </div>
          <Slider
            id="text-position-x"
            min={0}
            max={100}
            step={1}
            value={[positionX]}
            onValueChange={values => handlePropertyChange('positionX', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="text-position-y">Posición Y</Label>
            <span className="text-sm text-zinc-400">{positionY}%</span>
          </div>
          <Slider
            id="text-position-y"
            min={0}
            max={100}
            step={1}
            value={[positionY]}
            onValueChange={values => handlePropertyChange('positionY', values[0])}
          />
        </div>
      </div>
    );
  };
  
  // Configuración de transiciones
  const renderTransitionConfig = () => {
    if (!selectedEffect) return null;
    
    const { 
      transitionType = 'fade', 
      duration = 1, 
      easing = 'ease-in-out',
      enabled = true 
    } = selectedEffect.properties;
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="transition-type">Tipo de transición</Label>
          <Select
            value={transitionType}
            onValueChange={value => handlePropertyChange('transitionType', value)}
          >
            <SelectTrigger id="transition-type">
              <SelectValue placeholder="Seleccionar tipo de transición" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fade">Fundido (Fade)</SelectItem>
              <SelectItem value="wipe">Barrido (Wipe)</SelectItem>
              <SelectItem value="slide">Deslizar (Slide)</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
              <SelectItem value="crossfade">Fundido cruzado</SelectItem>
              <SelectItem value="dissolve">Disolver</SelectItem>
              <SelectItem value="push">Empujar</SelectItem>
              <SelectItem value="split">Dividir</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="transition-duration">Duración</Label>
            <span className="text-sm text-zinc-400">{duration.toFixed(1)}s</span>
          </div>
          <Slider
            id="transition-duration"
            min={0.1}
            max={10}
            step={0.1}
            value={[duration]}
            onValueChange={values => handlePropertyChange('duration', values[0])}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="transition-easing">Suavizado</Label>
          <Select
            value={easing}
            onValueChange={value => handlePropertyChange('easing', value)}
          >
            <SelectTrigger id="transition-easing">
              <SelectValue placeholder="Seleccionar suavizado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Lineal</SelectItem>
              <SelectItem value="ease">Suave</SelectItem>
              <SelectItem value="ease-in">Suave al inicio</SelectItem>
              <SelectItem value="ease-out">Suave al final</SelectItem>
              <SelectItem value="ease-in-out">Suave al inicio y al final</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="w-full bg-zinc-900 border-0 rounded-xl overflow-hidden shadow-xl">
      <CardHeader className="pb-2 border-b border-zinc-800">
        <CardTitle className="text-xl flex items-center text-white">
          <Wand2 className="h-5 w-5 mr-2 text-indigo-400" />
          Efectos
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="effects" className="w-full">
          <TabsList className="w-full bg-zinc-800 rounded-none mb-0 p-0 h-10">
            <TabsTrigger
              value="effects"
              className="flex-1 rounded-none data-[state=active]:bg-zinc-700"
            >
              Efectos aplicados
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="flex-1 rounded-none data-[state=active]:bg-zinc-700"
            >
              Biblioteca
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="effects" className="mt-0 border-0 p-0">
            <div className="p-3 border-b border-zinc-800 bg-zinc-800 flex items-center space-x-2">
              <span className="text-xs text-zinc-400">Filtrar por:</span>
              <Select
                value={effectTypeFilter}
                onValueChange={setEffectTypeFilter}
              >
                <SelectTrigger id="effect-type-filter" className="h-7 text-xs bg-zinc-700 border-zinc-600 min-w-[120px]">
                  <SelectValue placeholder="Tipo de efecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="filter">Filtros</SelectItem>
                  <SelectItem value="transform">Transformaciones</SelectItem>
                  <SelectItem value="color">Color</SelectItem>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="transition">Transiciones</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div
              ref={droppableRef}
              {...droppableProps}
              className={`p-4 overflow-y-auto max-h-96 ${isOver ? 'bg-indigo-900/20' : ''}`}
            >
              {filteredEffects.length > 0 ? (
                <ul className="space-y-2">
                  {filteredEffects.map(effect => (
                    <li
                      key={effect.id}
                      className={`p-2 rounded flex items-center justify-between cursor-pointer ${
                        selectedEffectId === effect.id ? 'bg-indigo-800/30 ring-1 ring-indigo-500' : 'bg-zinc-800 hover:bg-zinc-750'
                      }`}
                      onClick={() => onSelectEffect && onSelectEffect(effect.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {getEffectIcon(effect.type)}
                        <div>
                          <div className="text-sm font-medium">{effect.name}</div>
                          <div className="text-xs text-zinc-400">
                            {formatTime(effect.startTime)} - {formatTime(effect.endTime)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-zinc-700"
                          onClick={e => {
                            e.stopPropagation();
                            handleToggleEffectVisibility(effect.id, effect.properties.enabled);
                          }}
                        >
                          {effect.properties.enabled ? (
                            <Eye className="h-3.5 w-3.5 text-zinc-300" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-zinc-500" />
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-zinc-700"
                          onClick={e => {
                            e.stopPropagation();
                            handleDuplicateEffect(effect);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 text-zinc-300" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-zinc-700 hover:text-red-500"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveEffect(effect.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  {effects.length === 0 ? (
                    <p>No hay efectos aplicados. Añade un efecto desde la biblioteca.</p>
                  ) : (
                    <p>No hay efectos de este tipo. Cambia el filtro o añade uno nuevo.</p>
                  )}
                </div>
              )}
            </div>
            
            {selectedEffect && (
              <div className="p-4 bg-zinc-800 border-t border-zinc-700">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Ajustes de tiempo</h3>
                  <div className="flex items-center space-x-3 mb-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-zinc-700 border-zinc-600 flex-1"
                      onClick={handleSetStartTime}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Inicio = {formatTime(currentTime)}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-zinc-700 border-zinc-600 flex-1"
                      onClick={handleSetEndTime}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      Final = {formatTime(currentTime)}
                    </Button>
                  </div>
                  
                  <div className="flex items-center text-xs mb-2">
                    <div className="flex-1">
                      <span className="text-zinc-400 mr-1">Duración:</span>
                      <span>{formatTime(selectedEffect.endTime - selectedEffect.startTime)}</span>
                    </div>
                    
                    <div className="text-right flex-1">
                      <span className="text-zinc-400 mr-1">Estado:</span>
                      {currentTime >= selectedEffect.startTime && currentTime <= selectedEffect.endTime ? (
                        <span className="text-green-500 flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activo
                        </span>
                      ) : (
                        <span className="text-zinc-500 flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Configuración específica del efecto seleccionado */}
                <Accordion
                  type="single"
                  defaultValue="params"
                  collapsible
                  className="w-full"
                >
                  <AccordionItem value="params" className="border-none">
                    <AccordionTrigger className="py-2 px-3 hover:no-underline bg-zinc-750 rounded-t text-sm font-medium">
                      Parámetros de {selectedEffect.name}
                    </AccordionTrigger>
                    <AccordionContent className="px-3 py-2 bg-zinc-800 rounded-b border border-zinc-700">
                      {selectedEffect.type === 'filter' && renderFilterConfig()}
                      {selectedEffect.type === 'transform' && renderTransformConfig()}
                      {selectedEffect.type === 'color' && renderColorConfig()}
                      {selectedEffect.type === 'text' && renderTextConfig()}
                      {selectedEffect.type === 'transition' && renderTransitionConfig()}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="library" className="mt-0 border-0 p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Añadir nuevo efecto</h3>
              <div className="flex space-x-2">
                <Select
                  value={newEffectType}
                  onValueChange={setNewEffectType}
                  className="flex-1"
                >
                  <SelectTrigger id="new-effect-type" className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Tipo de efecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filter">Filtro</SelectItem>
                    <SelectItem value="transform">Transformación</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="transition">Transición</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline"
                  className="bg-indigo-700 border-indigo-600 hover:bg-indigo-600 hover:border-indigo-500"
                  onClick={() => handleAddEffect(newEffectType)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Biblioteca de efectos</h3>
              
              <Accordion
                type="multiple"
                className="w-full"
              >
                <AccordionItem value="filters" className="border-zinc-800">
                  <AccordionTrigger className="hover:no-underline text-sm py-2 px-3 hover:bg-zinc-800 rounded">
                    <div className="flex items-center">
                      <Sliders className="h-4 w-4 mr-2" />
                      Filtros
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {['blur', 'sharpen', 'noise', 'grain', 'pixelate', 'vignette', 'sepia', 'grayscale', 'invert'].map(filterType => (
                        <div
                          key={filterType}
                          className="bg-zinc-800 rounded p-2 cursor-pointer hover:bg-zinc-700 flex items-center"
                          onClick={() => {
                            if (onAddEffect) {
                              onAddEffect({
                                name: `Filtro ${filterType}`,
                                type: 'filter',
                                properties: {
                                  filterType,
                                  amount: 50,
                                  enabled: true
                                },
                                startTime: currentTime,
                                endTime: Math.min(currentTime + 5, duration),
                                clipId: selectedClipId
                              });
                            }
                          }}
                        >
                          <div className="bg-indigo-600 rounded-full h-7 w-7 mr-2 flex items-center justify-center">
                            <Sliders className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs capitalize">{filterType}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="transforms" className="border-zinc-800">
                  <AccordionTrigger className="hover:no-underline text-sm py-2 px-3 hover:bg-zinc-800 rounded">
                    <div className="flex items-center">
                      <Move className="h-4 w-4 mr-2" />
                      Transformaciones
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {[
                        { type: 'scale', name: 'Escala', icon: <Maximize className="h-3.5 w-3.5" /> },
                        { type: 'rotation', name: 'Rotación', icon: <RotateCw className="h-3.5 w-3.5" /> },
                        { type: 'position', name: 'Posición', icon: <Move className="h-3.5 w-3.5" /> }
                      ].map(({ type, name, icon }) => (
                        <div
                          key={type}
                          className="bg-zinc-800 rounded p-2 cursor-pointer hover:bg-zinc-700 flex items-center"
                          onClick={() => {
                            if (onAddEffect) {
                              onAddEffect({
                                name: `Transformación: ${name}`,
                                type: 'transform',
                                properties: {
                                  transformType: type,
                                  scale: type === 'scale' ? 1.2 : 1,
                                  rotation: type === 'rotation' ? 45 : 0,
                                  positionX: type === 'position' ? 10 : 0,
                                  positionY: type === 'position' ? 10 : 0,
                                  enabled: true
                                },
                                startTime: currentTime,
                                endTime: Math.min(currentTime + 5, duration),
                                clipId: selectedClipId
                              });
                            }
                          }}
                        >
                          <div className="bg-green-600 rounded-full h-7 w-7 mr-2 flex items-center justify-center">
                            {icon}
                          </div>
                          <span className="text-xs">{name}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="colors" className="border-zinc-800">
                  <AccordionTrigger className="hover:no-underline text-sm py-2 px-3 hover:bg-zinc-800 rounded">
                    <div className="flex items-center">
                      <Palette className="h-4 w-4 mr-2" />
                      Ajustes de color
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {['brightness', 'contrast', 'saturation', 'hue', 'temperature', 'tint'].map(colorType => (
                        <div
                          key={colorType}
                          className="bg-zinc-800 rounded p-2 cursor-pointer hover:bg-zinc-700 flex items-center"
                          onClick={() => {
                            if (onAddEffect) {
                              onAddEffect({
                                name: `Color: ${colorType}`,
                                type: 'color',
                                properties: {
                                  colorType,
                                  brightness: colorType === 'brightness' ? 20 : 0,
                                  contrast: colorType === 'contrast' ? 20 : 0,
                                  saturation: colorType === 'saturation' ? 20 : 0,
                                  hue: colorType === 'hue' ? 20 : 0,
                                  temperature: colorType === 'temperature' ? 20 : 0,
                                  tint: colorType === 'tint' ? 20 : 0,
                                  enabled: true
                                },
                                startTime: currentTime,
                                endTime: Math.min(currentTime + 5, duration),
                                clipId: selectedClipId
                              });
                            }
                          }}
                        >
                          <div className="bg-amber-600 rounded-full h-7 w-7 mr-2 flex items-center justify-center">
                            <Palette className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs capitalize">{colorType}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="transitions" className="border-zinc-800">
                  <AccordionTrigger className="hover:no-underline text-sm py-2 px-3 hover:bg-zinc-800 rounded">
                    <div className="flex items-center">
                      <Layers className="h-4 w-4 mr-2" />
                      Transiciones
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {['fade', 'wipe', 'slide', 'zoom', 'crossfade', 'dissolve', 'push', 'split'].map(transitionType => (
                        <div
                          key={transitionType}
                          className="bg-zinc-800 rounded p-2 cursor-pointer hover:bg-zinc-700 flex items-center"
                          onClick={() => {
                            if (onAddEffect) {
                              onAddEffect({
                                name: `Transición: ${transitionType}`,
                                type: 'transition',
                                properties: {
                                  transitionType,
                                  duration: 1,
                                  easing: 'ease-in-out',
                                  enabled: true
                                },
                                startTime: currentTime,
                                endTime: Math.min(currentTime + 1, duration),
                                clipId: selectedClipId
                              });
                            }
                          }}
                        >
                          <div className="bg-purple-600 rounded-full h-7 w-7 mr-2 flex items-center justify-center">
                            <Layers className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs capitalize">{transitionType}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="text" className="border-zinc-800">
                  <AccordionTrigger className="hover:no-underline text-sm py-2 px-3 hover:bg-zinc-800 rounded">
                    <div className="flex items-center">
                      <Type className="h-4 w-4 mr-2" />
                      Texto
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {[
                        { type: 'title', name: 'Título' },
                        { type: 'subtitle', name: 'Subtítulo' },
                        { type: 'caption', name: 'Leyenda' },
                        { type: 'lower-third', name: 'Lower Third' }
                      ].map(({ type, name }) => (
                        <div
                          key={type}
                          className="bg-zinc-800 rounded p-2 cursor-pointer hover:bg-zinc-700 flex items-center"
                          onClick={() => {
                            if (onAddEffect) {
                              onAddEffect({
                                name: `Texto: ${name}`,
                                type: 'text',
                                properties: {
                                  text: name,
                                  fontSize: type === 'title' ? 36 : type === 'subtitle' ? 24 : 18,
                                  fontFamily: 'Arial',
                                  color: '#ffffff',
                                  positionX: 50,
                                  positionY: type === 'lower-third' ? 80 : 50,
                                  alignment: 'center',
                                  enabled: true
                                },
                                startTime: currentTime,
                                endTime: Math.min(currentTime + 5, duration),
                                clipId: selectedClipId
                              });
                            }
                          }}
                        >
                          <div className="bg-blue-600 rounded-full h-7 w-7 mr-2 flex items-center justify-center">
                            <Type className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs">{name}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}