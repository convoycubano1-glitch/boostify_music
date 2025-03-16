import * as React from "react";
import { cn } from "../../lib/utils";

export interface CircularProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
}

export const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(
  (
    {
      value = 0,
      max = 100,
      size = 44,
      thickness = 3.6,
      color,
      trackColor = "rgba(0, 0, 0, 0.1)",
      className,
      ...props
    },
    ref
  ) => {
    const circumference = 2 * Math.PI * ((size - thickness) / 2);
    const progressValue = Math.min(100, Math.max(0, (value / max) * 100));
    const strokeDashoffset = circumference - (progressValue / 100) * circumference;

    return (
      <div
        className={cn("relative inline-flex shrink-0", className)}
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        ref={ref}
        {...props}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full"
          viewBox={`${size / 2} ${size / 2} ${size} ${size}`}
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
          }}
        >
          {/* Track Circle */}
          <circle
            className="transition-all duration-300 ease-in-out"
            cx={size}
            cy={size}
            r={(size - thickness) / 2}
            fill="none"
            strokeWidth={thickness}
            stroke={trackColor}
          />
          {/* Progress Circle */}
          <circle
            className={cn(
              "transition-all duration-300 ease-in-out",
              color ? "" : "stroke-primary"
            )}
            cx={size}
            cy={size}
            r={(size - thickness) / 2}
            fill="none"
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ stroke: color }}
          />
        </svg>
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";