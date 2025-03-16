import React from "react";
import { cn } from "../../lib/utils";

interface ProgressCircularProps {
  value?: number;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "destructive";
  className?: string;
  thickness?: number;
  showValue?: boolean;
}

export const ProgressCircular = ({
  value,
  size = "default",
  variant = "default",
  className,
  thickness = 4,
  showValue = false,
}: ProgressCircularProps) => {
  // Si no hay valor, mostrar un spinner de carga indeterminado
  const indeterminate = value === undefined;
  
  // Normalizar valor entre 0 y 100
  const normalizedValue = Math.min(Math.max(value || 0, 0), 100);
  
  // Calcular el tamaño según la prop size
  const sizeMap = {
    sm: 20,
    default: 40,
    lg: 64,
  };
  const pixelSize = sizeMap[size];
  
  // Radio del círculo (menos la mitad del espesor para centrar el trazo)
  const radius = (pixelSize / 2) - (thickness / 2);
  
  // Circunferencia del círculo
  const circumference = 2 * Math.PI * radius;
  
  // Valor del trazo
  const strokeDashoffset = indeterminate 
    ? 0 
    : circumference - (normalizedValue / 100) * circumference;
  
  // Clase de variante
  const variantClasses = {
    default: "stroke-primary",
    secondary: "stroke-secondary",
    destructive: "stroke-destructive",
  };
  
  // Animación para progreso indeterminado
  const indeterminateAnimation = indeterminate 
    ? "animate-progress-circular" 
    : "";
  
  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center", 
        className
      )}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Círculo de fondo */}
      <svg 
        className="absolute inset-0"
        width={pixelSize} 
        height={pixelSize}
        viewBox={`0 0 ${pixelSize} ${pixelSize}`}
      >
        <circle
          className="stroke-gray-200 dark:stroke-gray-800 fill-none"
          cx={pixelSize / 2}
          cy={pixelSize / 2}
          r={radius}
          strokeWidth={thickness}
        />
      </svg>
      
      {/* Círculo de progreso */}
      <svg 
        className={`absolute inset-0 ${indeterminateAnimation} transform -rotate-90`}
        width={pixelSize} 
        height={pixelSize}
        viewBox={`0 0 ${pixelSize} ${pixelSize}`}
      >
        <circle
          className={`${variantClasses[variant]} fill-none transition-all duration-200 ease-in-out`}
          cx={pixelSize / 2}
          cy={pixelSize / 2}
          r={radius}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.8 : strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Mostrar valor numérico si showValue es true */}
      {showValue && !indeterminate && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center text-center font-medium",
          size === "sm" ? "text-xs" : (size === "lg" ? "text-lg" : "text-sm")
        )}>
          {Math.round(normalizedValue)}%
        </div>
      )}
    </div>
  );
};

// Para que funcione la animación, añadir esto a globals.css o tailwind.config.ts:
// .animate-progress-circular {
//   animation: progress-circular 1.4s linear infinite;
// }
// @keyframes progress-circular {
//   0% {
//     transform: rotate(-90deg);
//   }
//   100% {
//     transform: rotate(270deg);
//   }
// }