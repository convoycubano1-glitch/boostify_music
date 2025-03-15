import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

// Componente para sistema de partículas
export interface ParticleSystemProps {
  count?: number;
  colors?: string[];
  size?: number;
  speed?: number;
  className?: string;
  duration?: number;
  activated?: boolean;
}

export function ParticleSystem({
  count = 50,
  colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F97316'],
  size = 6,
  speed = 2,
  className,
  duration = 10,
  activated = false
}: ParticleSystemProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    speed: number;
    angle: number;
  }>>([]);

  useEffect(() => {
    if (!activated) return;
    
    // Crear partículas
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // porcentaje de la pantalla
      y: Math.random() * 100,
      size: Math.random() * size + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * speed + 0.5,
      angle: Math.random() * 360
    }));
    
    setParticles(newParticles);
    
    // Limpiar partículas después de la duración
    if (duration) {
      const timer = setTimeout(() => {
        setParticles([]);
      }, duration * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [activated, count, colors, size, speed, duration]);
  
  return (
    <div className={cn(
      "fixed inset-0 pointer-events-none z-10 overflow-hidden",
      className
    )}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              left: `${particle.x}%`, 
              top: `${particle.y}%`, 
              opacity: 0,
              scale: 0 
            }}
            animate={{ 
              left: `${particle.x + Math.cos(particle.angle) * 20}%`,
              top: `${particle.y + Math.sin(particle.angle) * 20}%`,
              opacity: 1,
              scale: 1
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: particle.speed * 2,
              ease: "easeInOut"
            }}
            style={{
              position: "absolute",
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: particle.color
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Componente para gradiente animado
export interface AnimatedGradientProps {
  colors?: string[];
  speed?: number;
  className?: string;
}

export function AnimatedGradient({
  colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F97316'],
  speed = 10,
  className
}: AnimatedGradientProps) {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 1000 / speed);
    
    return () => clearInterval(interval);
  }, [speed]);
  
  return (
    <div className={cn(
      "absolute inset-0 overflow-hidden rounded-lg",
      className
    )}>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(${rotation}deg, ${colors.join(', ')})`,
          transform: `scale(1.2)`,
          transition: 'background 0.5s ease'
        }}
      />
    </div>
  );
}

// Componente para efecto de brillo
export interface GlowEffectProps {
  color?: string;
  size?: number;
  x?: number;
  y?: number;
  className?: string;
  pulsate?: boolean;
}

export function GlowEffect({
  color = '#4F46E5',
  size = 200,
  x = 50,
  y = 50,
  className,
  pulsate = true
}: GlowEffectProps) {
  return (
    <div className={cn(
      "absolute pointer-events-none overflow-hidden",
      className
    )}>
      <motion.div
        animate={pulsate ? {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: "absolute",
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
          filter: "blur(20px)"
        }}
      />
    </div>
  );
}

// Componente para efecto de confeti
export interface ConfettiEffectProps {
  count?: number;
  duration?: number;
  activated?: boolean;
}

export function ConfettiEffect({
  count = 100,
  duration = 5,
  activated = false
}: ConfettiEffectProps) {
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    size: number;
    shape: 'square' | 'circle' | 'triangle';
  }>>([]);
  
  const colors = [
    '#FF3D00', '#2979FF', '#00E676', '#FFEB3B', 
    '#651FFF', '#FF4081', '#00BCD4', '#FFC107'
  ];
  
  const shapes = ['square', 'circle', 'triangle'] as const;
  
  useEffect(() => {
    if (!activated) return;
    
    const newConfetti = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10, // Comenzar arriba de la pantalla
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      shape: shapes[Math.floor(Math.random() * shapes.length)]
    }));
    
    setConfetti(newConfetti);
    
    const timer = setTimeout(() => {
      setConfetti([]);
    }, duration * 1000);
    
    return () => clearTimeout(timer);
  }, [activated, count, duration]);
  
  function getShapeStyle(shape: 'square' | 'circle' | 'triangle', size: number, color: string) {
    if (shape === 'square') {
      return {
        width: size,
        height: size,
        backgroundColor: color
      };
    } else if (shape === 'circle') {
      return {
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color
      };
    } else { // triangle
      return {
        width: 0,
        height: 0,
        borderLeft: `${size/2}px solid transparent`,
        borderRight: `${size/2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`
      };
    }
  }
  
  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ 
              left: `${piece.x}%`, 
              top: `${piece.y}%`, 
              opacity: 1,
              rotate: 0
            }}
            animate={{ 
              left: [`${piece.x}%`, `${piece.x + (Math.random() * 20 - 10)}%`],
              top: '110%',
              opacity: [1, 1, 0],
              rotate: [0, piece.rotation]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 2 + Math.random() * 3,
              ease: "easeOut"
            }}
            style={{
              position: "absolute",
              ...getShapeStyle(piece.shape, piece.size, piece.color)
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Componente para efectos de audio
export interface AudioVisualizerProps {
  audioData?: Uint8Array;
  className?: string;
  color?: string;
}

export function AudioVisualizer({
  audioData,
  className,
  color = '#4F46E5'
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !audioData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar visualización
    const barWidth = canvas.width / audioData.length;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = color;
    
    for (let i = 0; i < audioData.length; i++) {
      const barHeight = (audioData[i] / 255) * canvas.height / 2;
      
      // Dibujar barras simétricas desde el centro
      ctx.fillRect(
        i * barWidth, 
        centerY - barHeight / 2, 
        barWidth - 1, 
        barHeight
      );
    }
  }, [audioData, color]);
  
  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "w-full h-24 bg-black/5 rounded-md",
        className
      )}
      width={1000}
      height={100}
    />
  );
}