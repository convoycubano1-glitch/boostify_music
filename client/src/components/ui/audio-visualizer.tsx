import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioVisualizerProps {
  playing?: boolean;
  color?: string;
  barCount?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
  smooth?: boolean;
}

/**
 * Componente AudioVisualizer que muestra una animación reactiva al ritmo musical
 * Este visualizador simula una respuesta a la música con barras animadas
 */
export function AudioVisualizer({ 
  playing = false, 
  color = "rgba(249, 115, 22, 0.7)",
  barCount = 14,
  height = 40,
  barWidth = 3,
  barGap = 2,
  className = "",
  minHeight = 5,
  maxHeight = 40,
  smooth = true
}: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>([]);
  const requestRef = useRef<number | null>(null);
  
  // Genera alturas aleatorias para las barras con una transición suave
  const generateBars = () => {
    return Array.from({ length: barCount }, (_, i) => {
      const prevHeight = bars[i] || minHeight;
      
      if (!playing) {
        return minHeight;
      }
      
      // Cuando está sonando, crear una animación orgánica con variación
      let newHeight: number;
      
      if (smooth) {
        // Movimiento suave: solo cambia un poco desde la posición anterior
        const changeAmount = Math.random() * 15 - 7.5; // -7.5 a 7.5
        newHeight = prevHeight + changeAmount;
      } else {
        // Movimiento más aleatorio
        newHeight = Math.random() * (maxHeight - minHeight) + minHeight;
      }
      
      // Asegurar que siempre está dentro de los límites
      return Math.max(minHeight, Math.min(maxHeight, newHeight));
    });
  };
  
  // Manejador para animar las barras
  const animate = () => {
    setBars(generateBars());
    requestRef.current = requestAnimationFrame(animate);
  };
  
  // Iniciar/detener la animación cuando cambia el estado de reproducción
  useEffect(() => {
    if (playing) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // Cuando se detiene, animar a una posición de reposo
      setBars(Array(barCount).fill(minHeight));
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [playing]);
  
  // Crea una variación más orgánica basada en una curva de distribución
  const getBarHeight = (index: number) => {
    if (!playing) return minHeight;
    
    // Para una apariencia más natural, las barras del centro son un poco más altas
    const centerIndex = barCount / 2;
    const distanceFromCenter = Math.abs(index - centerIndex);
    const centerBonus = 1 - (distanceFromCenter / centerIndex) * 0.5;
    
    return bars[index] * centerBonus;
  };
  
  return (
    <div className={`flex items-end justify-center ${className}`} style={{ height }}>
      <AnimatePresence>
        {Array.from({ length: barCount }).map((_, i) => (
          <motion.div
            key={i}
            className="rounded-t-sm"
            style={{
              width: barWidth,
              marginLeft: barGap / 2,
              marginRight: barGap / 2,
              backgroundColor: color,
            }}
            initial={{ height: minHeight }}
            animate={{ 
              height: getBarHeight(i),
              transition: { duration: 0.15 }
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}