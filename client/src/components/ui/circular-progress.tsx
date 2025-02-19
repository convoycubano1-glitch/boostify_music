import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  strokeWidth = 8,
  children,
  className,
  ...props
}: CircularProgressProps) {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} {...props}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-orange-500/20"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="none"
          r={radius}
          cx="50"
          cy="50"
        />
        <circle
          className="text-orange-500 transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="none"
          r={radius}
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
