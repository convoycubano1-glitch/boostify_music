import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Clock,
  Hash,
  Music,
  Waves
} from 'lucide-react';

interface BeatData {
  time: number;
  type: string;
  intensity: number;
  energy: number;
  isDownbeat: boolean;
}

interface BeatMapMetadata {
  songTitle?: string;
  artist?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  complexity?: string;
  generatedAt?: string;
  beatAnalysis?: {
    totalBeats?: number;
    beatTypes?: {
      downbeats?: number;
      accents?: number;
      regularBeats?: number;
    };
    averageInterval?: number;
    patternComplexity?: string;
  };
}

interface BeatMap {
  metadata: BeatMapMetadata;
  beats: BeatData[];
}

interface BeatAnalyzerProps {
  beatsData: BeatMap;
  currentTime: number;
  duration: number;
}

export function BeatAnalyzer({
  beatsData,
  currentTime,
  duration
}: BeatAnalyzerProps) {
  // Calcular posición en el componente basado en tiempo
  const timeToPosition = (time: number) => {
    return (time / duration) * 100;
  };
  
  // Obtener información relevante de los beats
  const beatsByType = {
    downbeats: beatsData.beats.filter(beat => beat.type === 'downbeat').length,
    accents: beatsData.beats.filter(beat => beat.type === 'accent').length,
    regularBeats: beatsData.beats.filter(beat => 
      beat.type !== 'downbeat' && beat.type !== 'accent'
    ).length
  };
  
  // Obtener el beat actual basado en el tiempo
  const getCurrentBeat = () => {
    // Ordenar los beats por tiempo
    const sortedBeats = [...beatsData.beats].sort((a, b) => a.time - b.time);
    
    // Encontrar el beat más cercano al tiempo actual
    let closestBeat = sortedBeats[0];
    let minDistance = Math.abs(sortedBeats[0].time - currentTime);
    
    for (const beat of sortedBeats) {
      const distance = Math.abs(beat.time - currentTime);
      if (distance < minDistance) {
        minDistance = distance;
        closestBeat = beat;
      }
    }
    
    return closestBeat;
  };
  
  const currentBeat = getCurrentBeat();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <BarChart3 className="h-4 w-4 mr-1.5 text-orange-500" />
          <h3 className="text-sm font-semibold">Análisis de Beats</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-0.5 text-xs font-medium">
            {beatsData.metadata?.bpm || "--"} BPM
          </div>
          <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 text-xs font-medium">
            {beatsData.metadata?.key || "--"}
          </div>
        </div>
      </div>
      
      {/* Información de análisis general */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
        <div className="bg-muted/50 p-2 rounded">
          <div className="text-xs text-muted-foreground mb-1 flex items-center">
            <Hash className="h-3.5 w-3.5 mr-1" /> Distribución
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs">Downbeats: {beatsByType.downbeats}</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs">Acentos: {beatsByType.accents}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs">Beats: {beatsByType.regularBeats}</span>
          </div>
        </div>
        
        <div className="bg-muted/50 p-2 rounded">
          <div className="text-xs text-muted-foreground mb-1 flex items-center">
            <Music className="h-3.5 w-3.5 mr-1" /> Detalles rítmicos
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs">
              Compás: {beatsData.metadata?.timeSignature || "4/4"}
            </div>
            <div className={cn(
              "px-1.5 py-0.5 rounded text-xs", 
              (beatsData.metadata?.beatAnalysis?.patternComplexity === "Alta" || 
                beatsData.metadata?.complexity === "Alta") 
                ? "bg-red-50 text-red-700" :
              (beatsData.metadata?.beatAnalysis?.patternComplexity === "Media" || 
                beatsData.metadata?.complexity === "Media")
                ? "bg-yellow-50 text-yellow-700" :
                "bg-blue-50 text-blue-700"
            )}>
              {beatsData.metadata?.beatAnalysis?.patternComplexity || 
                beatsData.metadata?.complexity || "Normal"}
            </div>
          </div>
          <div className="text-xs mt-1">
            Intervalo: {beatsData.metadata?.beatAnalysis?.averageInterval 
              ? `${beatsData.metadata.beatAnalysis.averageInterval.toFixed(2)}s` 
              : "--"}
          </div>
        </div>
        
        <div className="bg-muted/50 p-2 rounded">
          <div className="text-xs text-muted-foreground mb-1 flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" /> Beat actual
          </div>
          <div className="flex items-center gap-2">
            <div 
              className={cn(
                "w-4 h-4 rounded-full",
                currentBeat.type === 'downbeat' 
                  ? "bg-red-500" 
                  : currentBeat.type === 'accent'
                    ? "bg-yellow-500"
                    : "bg-blue-500"
              )}
            ></div>
            <div>
              <div className="text-xs font-medium">
                Tipo: {currentBeat.type === 'downbeat' 
                  ? "Tiempo fuerte" 
                  : currentBeat.type === 'accent'
                    ? "Acento"
                    : "Tiempo débil"
                }
              </div>
              <div className="text-xs">
                Energía: {Math.round(currentBeat.energy * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visualización de beats */}
      <Card className="p-2 relative">
        <ScrollArea className="h-[120px]">
          <div className="relative w-full h-20">
            {/* Marcadores de tiempo */}
            <div className="absolute bottom-0 left-0 right-0 h-4 border-t text-[10px] text-muted-foreground">
              {Array.from({ length: Math.ceil(duration / 10) + 1 }).map((_, i) => (
                <div
                  key={`time-${i}`}
                  className="absolute bottom-0 flex flex-col items-center"
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
            
            {/* Representación visual de beats */}
            <div className="absolute top-0 left-0 right-0 bottom-4 flex items-end">
              {beatsData.beats.slice(0, 150).map((beat, index) => {
                const beatColor = beat.type === 'downbeat' 
                  ? 'bg-red-500' 
                  : beat.type === 'accent'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500';
                
                const intensity = beat.energy || beat.intensity || 0.5;
                const height = `${Math.max(15, Math.min(100, intensity * 100))}%`;
                
                return (
                  <div
                    key={`beat-${index}`}
                    className={cn(
                      "w-0.5 mx-[1px] opacity-70 transition-all duration-200 hover:opacity-100",
                      beatColor,
                      Math.abs(beat.time - currentTime) < 0.1 ? "opacity-100" : ""
                    )}
                    style={{
                      height,
                      position: 'absolute',
                      left: `${timeToPosition(beat.time)}%`,
                      zIndex: beat.isDownbeat ? 2 : 1
                    }}
                    title={`Beat ${index}: ${beat.type} - ${beat.time.toFixed(2)}s`}
                  />
                );
              })}
            </div>
            
            {/* Indicador de tiempo actual */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ 
                left: `${timeToPosition(currentTime)}%`
              }}
            >
              <div className="h-2 w-2 rounded-full bg-red-500 -ml-[3px] -mt-1"></div>
            </div>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}