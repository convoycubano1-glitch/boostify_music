import React from "react";
import { cn } from "../../lib/utils";

export interface ProgressCircularProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | number;
  thickness?: number;
  value?: number;
  showValue?: boolean;
  indeterminate?: boolean;
  color?: string;
}

export function ProgressCircular({
  size = "md",
  thickness = 4,
  value = 0,
  showValue = false,
  indeterminate = true,
  color,
  className,
  ...props
}: ProgressCircularProps) {
  // Tamaños predefinidos
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 56,
  };

  // Calcular el tamaño final
  const finalSize = typeof size === "number" ? size : sizeMap[size];
  
  // Radio del círculo
  const radius = (finalSize - thickness) / 2;
  
  // Circunferencia del círculo
  const circumference = 2 * Math.PI * radius;
  
  // Calcular el valor para el círculo de progreso
  const progressValue = indeterminate ? 0 : Math.min(100, Math.max(0, value));
  
  // Calcular el stroke-dashoffset basado en el valor
  const strokeDashoffset = circumference - (progressValue / 100) * circumference;
  
  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center",
        className
      )}
      style={{ width: finalSize, height: finalSize }}
      {...props}
    >
      {/* Círculo base (fondo) */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${finalSize} ${finalSize}`}
        width={finalSize}
        height={finalSize}
      >
        <circle
          className="text-muted-foreground/20"
          cx={finalSize / 2}
          cy={finalSize / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          stroke="currentColor"
        />
      </svg>
      
      {/* Círculo de progreso */}
      <svg
        className={cn(
          "absolute inset-0 transform",
          indeterminate && "animate-spin-slow"
        )}
        viewBox={`0 0 ${finalSize} ${finalSize}`}
        width={finalSize}
        height={finalSize}
      >
        <circle
          className={color ? "" : "text-primary"}
          style={{ color }}
          cx={finalSize / 2}
          cy={finalSize / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${finalSize/2} ${finalSize/2})`}
        />
      </svg>
      
      {/* Valor de progreso (opcional) */}
      {showValue && !indeterminate && (
        <div className="text-xs font-medium">
          {Math.round(progressValue)}%
        </div>
      )}
    </div>
  );
}