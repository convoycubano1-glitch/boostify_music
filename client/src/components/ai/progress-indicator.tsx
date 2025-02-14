import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";

interface ProgressStep {
  message: string;
  timestamp: Date;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  progress: number;
  isComplete?: boolean;
}

export function ProgressIndicator({ steps, progress, isComplete = false }: ProgressIndicatorProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Progress value={progress} className="w-full" />
      <ScrollArea className="h-32 rounded-md border">
        <div className="p-4 space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-14 flex-shrink-0 text-xs text-muted-foreground">
                {step.timestamp.toLocaleTimeString()}
              </div>
              <div className="flex-1 text-sm">
                {step.message}
              </div>
            </div>
          ))}
          {isComplete && (
            <div className="flex items-start space-x-2 text-green-500">
              <div className="w-14 flex-shrink-0 text-xs">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="flex-1 text-sm font-medium">
                Proceso completado
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
