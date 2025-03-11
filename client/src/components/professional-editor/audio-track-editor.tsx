import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Volume2,
  VolumeX,
  Music,
  Scissors,
  Tag,
  Waves // Usamos Waves en lugar de Waveform
} from 'lucide-react';

interface AudioTrackEditorProps {
  audioData: {
    waveform: number[];
    peaks: Array<{
      time: number;
      label: string;
      type: string;
    }>;
  };
  currentTime: number;
  duration: number;
}

export function AudioTrackEditor({
  audioData,
  currentTime,
  duration
}: AudioTrackEditorProps) {
  // Calcular posición en el componente basado en tiempo
  const timeToPosition = (time: number) => {
    return (time / duration) * 100;
  };
  
  // Renderizar forma de onda
  const renderWaveform = () => {
    const samples = audioData.waveform;
    
    return (
      <div className="h-16 w-full flex items-center justify-between">
        {samples.map((sample, index) => {
          // Solo mostrar una fracción de las muestras por rendimiento
          if (index % 5 !== 0) return null;
          
          const height = Math.max(2, sample * 16);
          
          return (
            <div
              key={`sample-${index}`}
              className="w-0.5 bg-orange-500/80 mx-[0.5px]"
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Waves className="h-4 w-4 mr-1.5 text-orange-500" />
          <h3 className="text-sm font-semibold">Editor de Audio</h3>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2">
            <VolumeX className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Silenciar</span>
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2">
            <Scissors className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Cortar</span>
          </Button>
        </div>
      </div>
      
      {/* Vista principal del audio */}
      <Card className="p-2 relative">
        <ScrollArea className="h-[120px]">
          <div className="relative px-1 pt-1">
            {/* Marcadores de secciones */}
            <div className="h-5 mb-1 relative">
              {audioData.peaks.map((peak, index) => (
                <div
                  key={`peak-${index}`}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ 
                    left: `${timeToPosition(peak.time)}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="h-4 w-0.5 bg-gray-400"></div>
                  <span className="text-[10px] whitespace-nowrap">
                    {peak.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Forma de onda */}
            <div className="relative">
              {renderWaveform()}
              
              {/* Indicador de tiempo actual */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ 
                  left: `${timeToPosition(currentTime)}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="h-2 w-2 rounded-full bg-red-500 -ml-[3px] -mt-1"></div>
              </div>
            </div>
            
            {/* Escala de tiempo */}
            <div className="h-4 mt-1 relative border-t text-[10px] text-muted-foreground">
              {Array.from({ length: Math.ceil(duration / 10) + 1 }).map((_, i) => (
                <div
                  key={`time-${i}`}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ 
                    left: `${(i * 10 / duration) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="h-1.5 w-0.5 bg-gray-300 mb-0.5"></div>
                  <span>{i * 10}s</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </Card>
      
      {/* Controles adicionales */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1 flex items-center">
            <Volume2 className="h-3.5 w-3.5 mr-1" /> Volumen
          </label>
          <Slider defaultValue={[75]} max={100} step={1} className="mt-1" />
        </div>
        
        <div>
          <label className="text-xs text-muted-foreground block mb-1 flex items-center">
            <Music className="h-3.5 w-3.5 mr-1" /> Tono
          </label>
          <Slider defaultValue={[50]} max={100} step={1} className="mt-1" />
        </div>
      </div>
    </div>
  );
}