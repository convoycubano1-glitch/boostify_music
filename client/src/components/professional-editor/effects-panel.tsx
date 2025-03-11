import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Wand2, 
  ArrowLeftRight
} from 'lucide-react';

interface EffectsPanelProps {
  selectedClipId: number | null;
  effects: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  onApplyEffect: (effectType: string) => void;
}

export function EffectsPanel({
  selectedClipId,
  effects,
  onApplyEffect
}: EffectsPanelProps) {
  // Función para renderizar un icono basado en su tipo
  const renderEffectIcon = (iconType: string) => {
    switch (iconType) {
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
      case 'blur':
        return <div className="h-6 w-12 bg-gray-400 filter blur-[2px] rounded"></div>;
      case 'b&w':
        return <div className="h-6 w-12 bg-gray-500 rounded"></div>;
      case 'sepia':
        return <div className="h-6 w-12 bg-yellow-700/50 rounded"></div>;
      case 'vignette':
        return <div className="h-6 w-12 bg-gradient-to-r from-gray-800 via-gray-400 to-gray-800 rounded"></div>;
      default:
        return <Sparkles className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Panel de Transiciones */}
      <Card className="p-3">
        <div className="flex items-center mb-2">
          <ArrowLeftRight className="h-4 w-4 mr-1.5 text-blue-500" />
          <h3 className="text-sm font-semibold">Transiciones</h3>
        </div>
        
        <ScrollArea className="h-[120px]">
          <div className="grid grid-cols-2 gap-2">
            {effects
              .filter(effect => ['fade', 'dissolve', 'wipe', 'zoom'].includes(effect.id))
              .map(effect => (
                <Button 
                  key={`transition-${effect.id}`}
                  variant="outline"
                  className="h-auto py-2 justify-start"
                  disabled={selectedClipId === null}
                  onClick={() => onApplyEffect(`transition-${effect.id}`)}
                >
                  <div className="mr-2">
                    {renderEffectIcon(effect.icon)}
                  </div>
                  <span className="text-xs">{effect.name}</span>
                </Button>
              ))}
          </div>
        </ScrollArea>
      </Card>
      
      {/* Panel de Efectos Visuales */}
      <Card className="p-3">
        <div className="flex items-center mb-2">
          <Wand2 className="h-4 w-4 mr-1.5 text-purple-500" />
          <h3 className="text-sm font-semibold">Efectos Visuales</h3>
        </div>
        
        <ScrollArea className="h-[120px]">
          <div className="grid grid-cols-2 gap-2">
            {effects
              .filter(effect => ['blur', 'b&w', 'sepia', 'vignette'].includes(effect.id))
              .map(effect => (
                <Button 
                  key={`effect-${effect.id}`}
                  variant="outline"
                  className="h-auto py-2 justify-start"
                  disabled={selectedClipId === null}
                  onClick={() => onApplyEffect(`effect-${effect.id}`)}
                >
                  <div className="mr-2">
                    {renderEffectIcon(effect.icon)}
                  </div>
                  <span className="text-xs">{effect.name}</span>
                </Button>
              ))}
          </div>
        </ScrollArea>
      </Card>
      
      {/* Información y ajustes para el clip seleccionado */}
      <Card className="p-3 md:col-span-2">
        <h3 className="text-sm font-semibold mb-2">Ajustes de Efecto</h3>
        
        {selectedClipId === null ? (
          <p className="text-sm text-muted-foreground">
            Selecciona un clip para ver y editar sus efectos
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Intensidad
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="50"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Duración
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                defaultValue="50"
                className="w-full"
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}