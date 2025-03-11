import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export type StepStatus = 'pending' | 'current' | 'completed';

export interface Step {
  title: string;
  description: string;
  status: StepStatus;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="bg-gradient-to-r from-orange-600 to-pink-600 p-4 text-white">
      <div className="container">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Creador de Videos Musicales</h2>
            <div className="text-sm py-1 px-3 bg-white/20 rounded-full">
              Paso {currentStep} de {steps.length}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-x-2 gap-y-4">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-start relative group",
                  index < steps.length - 1 && "md:after:content-[''] md:after:absolute md:after:top-3.5 md:after:left-[calc(100%_-_10px)] md:after:h-0.5 md:after:w-[calc(100%_-_15px)] md:after:bg-white/30",
                  step.status === 'completed' && "md:after:bg-white"
                )}
              >
                <div className="flex flex-col items-start flex-grow">
                  <div className="flex items-center">
                    <div className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-full mr-3 flex-shrink-0 transition-colors",
                      step.status === 'pending' && "border border-white/40 text-white/40",
                      step.status === 'current' && "bg-white text-orange-600",
                      step.status === 'completed' && "bg-white text-green-600"
                    )}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : step.status === 'current' ? (
                        <ArrowRight className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium text-sm transition-colors",
                        step.status === 'pending' && "text-white/70",
                        step.status === 'current' && "text-white font-semibold",
                        step.status === 'completed' && "text-white"
                      )}>
                        {step.title}
                      </p>
                      <p className={cn(
                        "text-xs transition-colors hidden md:block",
                        step.status === 'pending' && "text-white/50",
                        step.status === 'current' && "text-white/90",
                        step.status === 'completed' && "text-white/80"
                      )}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}