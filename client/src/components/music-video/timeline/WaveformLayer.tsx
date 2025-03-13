import React from 'react';
import { cn } from '../../../lib/utils';

// Definimos la interfaz WaveformData aquí, ya que no está exportada desde useWaveSurfer
export interface WaveformData {
  min: number;
  max: number;
  time?: number;
}

interface WaveformLayerProps {
  waveformData: WaveformData[];
  timeToPixels: (time: number) => number;
  waveformContainerRef: React.RefObject<HTMLDivElement>;
  duration: number;
}

/**
 * Componente para renderizar la capa de forma de onda
 */
export function WaveformLayer({
  waveformData,
  timeToPixels,
  waveformContainerRef,
  duration
}: WaveformLayerProps) {
  // Si no hay datos de forma de onda o los datos son undefined, renderizar un contenedor vacío
  if (!waveformData || waveformData.length === 0) {
    return (
      <div 
        ref={waveformContainerRef} 
        className="relative h-20 w-full bg-card/30"
      />
    );
  }
  
  // Renderizar la forma de onda como un SVG
  const svgHeight = 80;
  const svgWidth = timeToPixels(duration);
  const barWidth = Math.max(1, svgWidth / waveformData.length);
  
  return (
    <div ref={waveformContainerRef} className="relative h-20 w-full overflow-hidden">
      {/* WaveSurfer utilizará este contenedor de referencia */}
      
      {/* Forma de onda de respaldo usando SVG para casos donde WaveSurfer falla */}
      {waveformData.length > 0 && (
        <svg 
          className={cn(
            "absolute top-0 left-0 h-full w-full opacity-50",
            "pointer-events-none"
          )}
          height={svgHeight} 
          width={svgWidth}
          preserveAspectRatio="none"
        >
          {waveformData.map((point, i) => {
            const x = i * barWidth;
            const yMin = svgHeight / 2 * (1 + point.min);
            const yMax = svgHeight / 2 * (1 + point.max);
            return (
              <rect
                key={i}
                x={x}
                y={yMin}
                width={barWidth}
                height={yMax - yMin}
                fill="rgba(249, 115, 22, 0.4)"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}