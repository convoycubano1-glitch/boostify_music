import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// EFECTOS DE PARTÍCULAS Y ANIMACIONES
// Este archivo contiene componentes reutilizables para efectos visuales
// que pueden ser utilizados en cualquier parte de la aplicación

/**
 * Define las propiedades de una única partícula
 */
interface ParticleProps {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
  scale?: number;
  rotation?: number;
}

/**
 * Componente de partícula simple con movimiento aleatorio
 */
export const Particle = ({ 
  delay = 0, 
  color = "orange", 
  size = 1, 
  speed = 1 
}: { 
  delay?: number, 
  color?: string, 
  size?: number,
  speed?: number 
}) => {
  // Colores disponibles para las partículas
  const colors: Record<string, string> = {
    orange: "bg-orange-400",
    purple: "bg-purple-400",
    blue: "bg-blue-400",
    teal: "bg-teal-400",
    pink: "bg-pink-400",
    green: "bg-green-400",
    yellow: "bg-yellow-400",
    red: "bg-red-400"
  };
  
  // Establecer la clase de color o usar el valor directo si no está en el mapa
  const colorClass = colors[color] || color;
  
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${colorClass}`}
      initial={{ 
        scale: 0, 
        x: "50%", 
        y: "120%", 
        opacity: 0.1
      }}
      animate={{ 
        scale: size, 
        x: ["50%", `${50 + (Math.random() * 40 - 20)}%`], 
        y: ["120%", "-20%"], 
        opacity: [0.1, 0.7, 0.1] 
      }}
      transition={{ 
        duration: 3 / speed,
        ease: "easeOut",
        delay: delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2
      }}
      style={{
        width: "10px",
        height: "10px"
      }}
    />
  );
};

/**
 * Sistema completo de partículas con configuraciones personalizables
 */
export const ParticleSystem = ({ 
  count = 20, 
  theme = "default",
  active = true,
  density = "normal",
  className = "",
}: { 
  count?: number;
  theme?: 'default' | 'cool' | 'warm' | 'rainbow' | 'primary' | string;
  active?: boolean;
  density?: 'sparse' | 'normal' | 'dense';
  className?: string;
}) => {
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  
  // Diferentes temas de colores
  const themes: Record<string, string[]> = {
    default: ['#f97316', '#8b5cf6', '#3b82f6'],
    cool: ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1'],
    warm: ['#f97316', '#f43f5e', '#ec4899', '#eab308'],
    rainbow: ['#ef4444', '#f97316', '#eab308', '#16a34a', '#3b82f6', '#8b5cf6', '#ec4899'],
    primary: ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)'],
  };
  
  // Ajustar la cantidad de partículas según la densidad
  const particleMultiplier = density === 'sparse' ? 0.5 : density === 'dense' ? 2 : 1;
  const adjustedCount = Math.floor(count * particleMultiplier);
  
  // Obtener los colores para el tema seleccionado
  const colors = themes[theme] || themes.default;
  
  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    
    // Generar nuevas partículas
    const newParticles = Array.from({ length: adjustedCount }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 0.5 + 0.1,
      opacity: Math.random() * 0.7 + 0.3,
      scale: Math.random() * 0.5 + 0.5,
      rotation: Math.random() * 360
    }));
    
    setParticles(newParticles);
    
    // Animar las partículas
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: (p.y - p.speed) % 100,
        x: p.x + (Math.random() - 0.5) * p.speed,
        opacity: Math.max(0.2, Math.min(1, p.opacity + (Math.random() - 0.5) * 0.1)),
        rotation: (p.rotation || 0) + (Math.random() - 0.5) * 5
      })));
    }, 50);
    
    return () => clearInterval(interval);
  }, [adjustedCount, colors, active, theme, density]);
  
  if (!active || particles.length === 0) {
    return null;
  }
  
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`
          }}
          initial={{ scale: 0 }}
          animate={{ scale: p.scale }}
          transition={{ 
            duration: 0.5, 
            delay: i * 0.02,
            ease: "easeOut" 
          }}
        />
      ))}
    </div>
  );
};

/**
 * Efecto de brillo pulsante
 */
export const GlowEffect = ({ 
  color = 'hsl(var(--primary))', 
  intensity = 20, 
  pulse = true,
  size = 250,
  position = 'center',
  className = ""
}: {
  color?: string;
  intensity?: number;
  pulse?: boolean;
  size?: number;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}) => {
  // Calcular la posición del efecto
  const positionStyles: Record<string, React.CSSProperties> = {
    center: { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' },
    top: { left: '50%', top: '0', transform: 'translate(-50%, -50%)' },
    bottom: { left: '50%', bottom: '0', transform: 'translate(-50%, 50%)' },
    left: { left: '0', top: '50%', transform: 'translate(-50%, -50%)' },
    right: { right: '0', top: '50%', transform: 'translate(50%, -50%)' },
    'top-left': { left: '0', top: '0', transform: 'translate(-50%, -50%)' },
    'top-right': { right: '0', top: '0', transform: 'translate(50%, -50%)' },
    'bottom-left': { left: '0', bottom: '0', transform: 'translate(-50%, 50%)' },
    'bottom-right': { right: '0', bottom: '0', transform: 'translate(50%, 50%)' },
  };
  
  const positionStyle = positionStyles[position] || positionStyles.center;
  
  return (
    <motion.div 
      className={`absolute rounded-full pointer-events-none z-0 ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 ${intensity}px ${intensity/2}px ${color}`,
        ...positionStyle
      }}
      animate={pulse ? {
        boxShadow: [
          `0 0 ${intensity}px ${intensity/2}px ${color}`,
          `0 0 ${intensity*1.5}px ${intensity}px ${color}`,
          `0 0 ${intensity}px ${intensity/2}px ${color}`
        ]
      } : undefined}
      transition={pulse ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      } : undefined}
    />
  );
};

/**
 * Componente para fondo de gradiente animado
 */
export const AnimatedGradient = ({
  colors = ['#f97316', '#8b5cf6', '#3b82f6', '#8b5cf6'],
  duration = 10,
  className = "",
  opacity = 0.3,
}: {
  colors?: string[];
  duration?: number;
  className?: string;
  opacity?: number;
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ opacity }}>
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `linear-gradient(60deg, ${colors.join(', ')})`,
          backgroundSize: '300% 300%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

/**
 * Efecto de ondas concéntricas
 */
export const RippleEffect = ({
  color = 'hsl(var(--primary) / 0.2)',
  size = 200,
  duration = 4,
  count = 3,
  className = ""
}: {
  color?: string;
  size?: number;
  duration?: number;
  count?: number;
  className?: string;
}) => {
  return (
    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 pointer-events-none"
          style={{
            borderColor: color,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ 
            width: size, 
            height: size, 
            opacity: 0 
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay: (duration / count) * i,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

/**
 * Efecto de flash para momentos importantes
 */
export const FlashEffect = ({
  active = false,
  color = 'white',
  duration = 0.5,
  onComplete
}: {
  active: boolean;
  color?: string;
  duration?: number;
  onComplete?: () => void;
}) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: duration / 2 }}
      style={{ backgroundColor: color }}
      onAnimationComplete={() => {
        if (active && onComplete) {
          setTimeout(onComplete, duration * 500);
        }
      }}
    />
  );
};

/**
 * Componente de fondo dinámico con todos los efectos combinados
 */
export const DynamicBackground = ({
  theme = 'default',
  intensity = 'medium',
  active = true,
  children
}: {
  theme?: 'default' | 'cool' | 'warm' | 'rainbow' | 'primary';
  intensity?: 'low' | 'medium' | 'high';
  active?: boolean;
  children?: React.ReactNode;
}) => {
  // Configurar colores según el tema
  const themes: Record<string, string[]> = {
    default: ['#f97316', '#8b5cf6', '#3b82f6', '#8b5cf6'],
    cool: ['#3b82f6', '#06b6d4', '#8b5cf6', '#6366f1'],
    warm: ['#f97316', '#f43f5e', '#ec4899', '#eab308'],
    rainbow: ['#ef4444', '#f97316', '#eab308', '#16a34a', '#3b82f6', '#8b5cf6', '#ec4899'],
    primary: ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)'],
  };
  
  const colors = themes[theme] || themes.default;
  const primaryColor = colors[0];
  
  // Ajustar valores según la intensidad
  const intensityValues = {
    low: { particles: 10, glow: 15, opacity: 0.2 },
    medium: { particles: 20, glow: 30, opacity: 0.3 },
    high: { particles: 35, glow: 45, opacity: 0.4 }
  };
  
  const { particles, glow, opacity } = intensityValues[intensity] || intensityValues.medium;
  
  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Fondo base */}
      <div className="absolute inset-0 bg-card/70 backdrop-blur-sm z-0"></div>
      
      {/* Gradiente animado */}
      {active && (
        <AnimatedGradient colors={colors} duration={10} opacity={opacity} />
      )}
      
      {/* Efecto de brillo */}
      {active && (
        <GlowEffect color={primaryColor} intensity={glow} size={300} />
      )}
      
      {/* Sistema de partículas */}
      {active && (
        <ParticleSystem 
          count={particles} 
          theme={theme} 
          active={active}
          className="opacity-60"
        />
      )}
      
      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default {
  Particle,
  ParticleSystem,
  GlowEffect,
  AnimatedGradient,
  RippleEffect,
  FlashEffect,
  DynamicBackground
};