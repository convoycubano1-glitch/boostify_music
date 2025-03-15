import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Check, ChevronRight, CircleDot } from 'lucide-react';

export interface Step {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'error';
}

export interface EnhancedProgressStepsProps {
  steps: Step[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function EnhancedProgressSteps({
  steps,
  currentStepId,
  onStepClick,
  className
}: EnhancedProgressStepsProps) {
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null);
  
  // Calcular el progreso general (porcentaje de pasos completados)
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalProgress = Math.round((completedSteps / steps.length) * 100);
  
  // Encontrar el índice del paso actual
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  
  return (
    <div className={cn(
      "rounded-lg border bg-card shadow p-4 space-y-4",
      className
    )}>
      {/* Barra de progreso general */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Progreso general</span>
          <span className="text-sm text-muted-foreground">{totalProgress}%</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      
      {/* Pasos del proceso */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const isPending = step.status === 'pending';
          const isError = step.status === 'error';
          const isHovered = hoveredStepId === step.id;
          const isClickable = isCompleted || (index > 0 && steps[index - 1].status === 'completed');
          
          return (
            <motion.div
              key={step.id}
              className={cn(
                "relative border rounded-md p-4 transition-colors",
                isActive && "border-primary bg-primary/5",
                isCompleted && "border-green-300 bg-green-50/50",
                isPending && "border-gray-200 bg-gray-50/50",
                isError && "border-red-300 bg-red-50/50",
                isClickable && "cursor-pointer hover:border-primary/50",
                !isClickable && "opacity-80"
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => isClickable && onStepClick && onStepClick(step.id)}
              onMouseEnter={() => setHoveredStepId(step.id)}
              onMouseLeave={() => setHoveredStepId(null)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-white",
                    isCompleted && "bg-green-500",
                    isActive && "bg-primary",
                    isPending && "bg-gray-400",
                    isError && "bg-red-500"
                  )}>
                    {isCompleted && <Check className="h-4 w-4" />}
                    {isActive && <CircleDot className="h-4 w-4" />}
                    {(isPending || isError) && (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={cn(
                      "font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-green-700",
                      isError && "text-red-700"
                    )}>
                      {step.name}
                    </h4>
                    
                    {isClickable && (
                      <div className={cn(
                        "opacity-0 transition-opacity",
                        isHovered && "opacity-100"
                      )}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  
                  {/* Indicadores visuales adicionales */}
                  {isActive && (
                    <motion.div
                      className="h-1 mt-2 bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  )}
                </div>
              </div>
              
              {/* Línea conector entre pasos */}
              {index < steps.length - 1 && (
                <div className="absolute left-7 top-10 bottom-0 w-px bg-gray-200 -mb-4" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}