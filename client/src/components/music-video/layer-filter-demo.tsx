import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Button } from '../ui/button';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Film, 
  AudioLines, 
  Type, 
  Sparkles 
} from 'lucide-react';

// Interface para clips simplificada para la demostración
interface SimpleClip {
  id: number;
  title: string;
  layer: number; // 0=audio, 1=video/imagen, 2=texto, 3=efectos
  color: string;
}

export function LayerFilterDemo() {
  // Estado para las capas visibles y bloqueadas
  const [visibleLayers, setVisibleLayers] = useState<number[]>([0, 1, 2, 3]);
  const [lockedLayers, setLockedLayers] = useState<number[]>([]);
  
  // Clips de prueba
  const sampleClips: SimpleClip[] = [
    { id: 1, title: 'Pista de audio principal', layer: 0, color: 'bg-blue-500' },
    { id: 2, title: 'Efecto de sonido', layer: 0, color: 'bg-blue-400' },
    { id: 3, title: 'Video de fondo', layer: 1, color: 'bg-purple-500' },
    { id: 4, title: 'Imagen superpuesta', layer: 1, color: 'bg-purple-400' },
    { id: 5, title: 'Título principal', layer: 2, color: 'bg-amber-500' },
    { id: 6, title: 'Subtítulos', layer: 2, color: 'bg-amber-400' },
    { id: 7, title: 'Efecto de brillo', layer: 3, color: 'bg-pink-500' },
    { id: 8, title: 'Transición', layer: 3, color: 'bg-pink-400' },
  ];
  
  // Filtrar clips por capas visibles
  const visibleClips = sampleClips.filter(clip => visibleLayers.includes(clip.layer));
  
  // Función para cambiar visibilidad de capa
  const toggleLayerVisibility = (layer: number) => {
    if (visibleLayers.includes(layer)) {
      setVisibleLayers(visibleLayers.filter(l => l !== layer));
    } else {
      setVisibleLayers([...visibleLayers, layer]);
    }
  };
  
  // Función para cambiar bloqueo de capa
  const toggleLayerLock = (layer: number) => {
    if (lockedLayers.includes(layer)) {
      setLockedLayers(lockedLayers.filter(l => l !== layer));
    } else {
      setLockedLayers([...lockedLayers, layer]);
    }
  };
  
  // Mapeo de iconos por tipo de capa
  const layerIcons = {
    0: <AudioLines className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
    1: <Film className="h-5 w-5 text-purple-600 dark:text-purple-300" />,
    2: <Type className="h-5 w-5 text-amber-600 dark:text-amber-300" />,
    3: <Sparkles className="h-5 w-5 text-pink-600 dark:text-pink-300" />,
  };
  
  // Nombres de las capas
  const layerNames = {
    0: 'Audio',
    1: 'Video/Imagen',
    2: 'Texto',
    3: 'Efectos',
  };
  
  return (
    <div className="p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Demostración de Filtrado de Capas</CardTitle>
          <CardDescription>Activa/desactiva la visibilidad de las capas para ver el efecto en los clips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Controles de capas */}
            {[0, 1, 2, 3].map(layer => (
              <div key={layer} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    {layerIcons[layer as keyof typeof layerIcons]}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Capa de {layerNames[layer as keyof typeof layerNames]}</h4>
                    <p className="text-xs text-muted-foreground">
                      {visibleLayers.includes(layer) ? 'Visible' : 'Oculta'} · 
                      {lockedLayers.includes(layer) ? ' Bloqueada' : ' Desbloqueada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className={visibleLayers.includes(layer) ? "bg-primary/10" : ""}
                    onClick={() => toggleLayerVisibility(layer)}
                  >
                    {visibleLayers.includes(layer) ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={lockedLayers.includes(layer) ? "bg-primary/10" : ""}
                    onClick={() => toggleLayerLock(layer)}
                  >
                    {lockedLayers.includes(layer) ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Lista de clips visibles */}
          <div>
            <h3 className="text-lg font-medium mb-3">Clips Visibles ({visibleClips.length} de {sampleClips.length})</h3>
            <div className="space-y-2">
              {visibleClips.map(clip => (
                <div 
                  key={clip.id} 
                  className={`${clip.color} p-3 rounded-lg text-white flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2">
                    {layerIcons[clip.layer as keyof typeof layerIcons]}
                    <span>{clip.title}</span>
                  </div>
                  <span className="text-xs bg-black/20 px-2 py-1 rounded">
                    Capa: {layerNames[clip.layer as keyof typeof layerNames]}
                  </span>
                </div>
              ))}
              
              {visibleClips.length === 0 && (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p>No hay clips visibles. Activa alguna capa para ver sus clips.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setVisibleLayers([0, 1, 2, 3])}
          >
            Mostrar Todas
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setVisibleLayers([])}
          >
            Ocultar Todas
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}