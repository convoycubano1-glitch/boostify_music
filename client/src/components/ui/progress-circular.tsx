import * as React from "react";
import { cn } from "../../lib/utils";

interface ProgressCircularProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  thickness?: number;
  indeterminate?: boolean;
  value?: number;
  color?: "primary" | "secondary" | "default";
}

/**
 * Componente de progreso circular
 * 
 * @example
 * // Indicador de carga indeterminado (spinner)
 * <ProgressCircular />
 * 
 * @example
 * // Indicador de progreso determinado (muestra el porcentaje)
 * <ProgressCircular value={75} />
 * 
 * @example
 * // Diferentes tamaños
 * <ProgressCircular size="sm" />
 * <ProgressCircular size="lg" />
 */
export function ProgressCircular({
  size = "md",
  thickness = 3.6,
  indeterminate = true,
  value = 0,
  color = "primary",
  className,
  ...props
}: ProgressCircularProps) {
  // Calcular tamaño del círculo según el prop size
  const sizeMap = {
    xs: 16,
    sm: 24,
    md: 40,
    lg: 56,
    xl: 72,
  };
  
  const diameter = sizeMap[size];
  const radius = diameter / 2;
  const circumference = 2 * Math.PI * (radius - thickness);
  const strokeDasharray = circumference.toFixed(3);
  const strokeDashoffset = indeterminate
    ? 0
    : ((100 - Math.min(100, Math.max(0, value))) / 100) * circumference;
  
  // Calcular estilos según tamaño
  const viewBox = `0 0 ${diameter} ${diameter}`;
  const centerPosition = `${radius}px`;
  const circleStyles = {
    cx: radius,
    cy: radius,
    r: radius - thickness,
    strokeWidth: thickness,
    strokeDasharray,
    strokeDashoffset: indeterminate ? undefined : strokeDashoffset,
  };
  
  // Seleccionar color
  const colorClasses = {
    primary: "stroke-primary",
    secondary: "stroke-secondary",
    default: "stroke-gray-400 dark:stroke-gray-500",
  };
  
  // Animación para progreso indeterminado
  const spinnerAnimation = indeterminate
    ? "animate-spin"
    : "";
  
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : value}
      className={cn("inline-block select-none", className)}
      {...props}
    >
      <svg
        className={cn(
          "transform -rotate-90",
          spinnerAnimation
        )}
        viewBox={viewBox}
        width={diameter}
        height={diameter}
        style={{
          width: diameter,
          height: diameter,
        }}
      >
        {/* Círculo de fondo */}
        <circle
          className="stroke-gray-200 dark:stroke-gray-800 fill-none"
          cx={circleStyles.cx}
          cy={circleStyles.cy}
          r={circleStyles.r}
          strokeWidth={circleStyles.strokeWidth}
        />
        
        {/* Círculo de progreso */}
        <circle
          className={cn(
            "transition-all duration-300 ease-in-out fill-none",
            colorClasses[color],
            indeterminate && "animate-progress-circular",
          )}
          cx={circleStyles.cx}
          cy={circleStyles.cy}
          r={circleStyles.r}
          strokeWidth={circleStyles.strokeWidth}
          strokeDasharray={circleStyles.strokeDasharray}
          strokeDashoffset={circleStyles.strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}