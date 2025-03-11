/**
 * Componente ProgressSteps
 * 
 * Este componente muestra un indicador visual de progreso para el flujo de trabajo de 9 pasos
 * utilizado en la creación de videos musicales profesionales. Permite visualizar
 * el estado actual de progreso, los pasos completados y los pendientes.
 * 
 * Características:
 * - Muestra los 9 pasos del flujo de trabajo con diseño responsivo
 * - Marca pasos como activos o completados con iconos y colores distintivos
 * - Adapta su visualización a diferentes tamaños de pantalla
 * - Se integra con EditorContext para acceder al estado global del proyecto
 */
import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditor } from '@/lib/context/editor-context';

export interface Step {
  id: string;
  title: string;
  description: string;
}

export interface ProgressStepsProps {
  steps: Step[];
  currentStep?: string;
  completedSteps?: string[];
  onChange?: (stepId: string) => void;
  onComplete?: (stepId: string) => void;
}

export function ProgressSteps({
  steps,
  currentStep: propCurrentStep,
  completedSteps: propCompletedSteps,
  onChange,
  onComplete
}: ProgressStepsProps) {
  // Integración con el contexto del editor
  const { project, setCurrentStep, markStepAsCompleted } = useEditor();
  
  // Utilizamos los valores del contexto o los props, priorizando los props para compatibilidad
  const currentStep = propCurrentStep || 
    (project.currentStep !== undefined ? steps[project.currentStep]?.id : steps[0].id);
  
  // Construimos un array de IDs de pasos completados a partir de los índices almacenados
  const completedSteps = propCompletedSteps || 
    project.completedSteps.map(index => steps[index]?.id).filter(Boolean);
  
  // Manejador de clic en un paso
  const handleStepClick = (stepId: string) => {
    // Encontramos el índice del paso
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      // Actualizamos el estado a través del contexto
      setCurrentStep(stepIndex);
      
      // Llamamos al callback si existe
      if (onChange) {
        onChange(stepId);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-4 md:space-y-0 md:flex md:items-start md:gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps?.includes?.(step.id) || false;
          
          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div className="hidden md:flex md:items-center md:self-stretch">
                  <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              <div 
                className={cn(
                  "relative flex items-start group cursor-pointer",
                  "md:flex-col md:items-center md:flex-1",
                  isActive && "text-primary",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
                onClick={() => handleStepClick(step.id)}
              >
                <div 
                  className={cn(
                    "flex h-8 w-8 mr-3 flex-shrink-0 items-center justify-center rounded-full border-2",
                    "md:mb-2 md:mr-0",
                    isActive && "border-primary bg-primary/10",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    !isActive && !isCompleted && "border-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                
                <div className="md:text-center">
                  <div className="text-sm font-semibold">{step.title}</div>
                  <p className="text-xs md:hidden">{step.description}</p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="hidden md:block mt-1 text-center text-xs text-muted-foreground">
        {steps.find(step => step.id === currentStep)?.description || ''}
      </div>
    </div>
  );
}

// Definición de los pasos del flujo de trabajo para creación de videos musicales
// Nota: Definido como constante (no export) para evitar problemas de Fast Refresh de React
// Re-exportamos para uso en MusicVideoWorkflow
export const musicVideoWorkflowSteps: Step[] = [
  {
    id: 'transcription',
    title: 'Transcripción de Audio',
    description: 'Analizando y transcribiendo la letra de tu canción'
  },
  {
    id: 'script',
    title: 'Generación de Guion',
    description: 'Creando un guion visual basado en tu música'
  },
  {
    id: 'sync',
    title: 'Sincronización',
    description: 'Sincronizando el video con el ritmo de la música'
  },
  {
    id: 'scenes',
    title: 'Generación de Escenas',
    description: 'Creando las escenas del video musical'
  },
  {
    id: 'customization',
    title: 'Personalización',
    description: 'Ajustando el estilo visual a tus preferencias'
  },
  {
    id: 'movement',
    title: 'Integración de Movimiento',
    description: 'Añadiendo coreografías y dinámicas visuales'
  },
  {
    id: 'lipsync',
    title: 'Sincronización de Labios',
    description: 'Sincronizando labios con la letra de la canción'
  },
  {
    id: 'generation',
    title: 'Generación de Video',
    description: 'Creando videos con IA a partir de tus escenas'
  },
  {
    id: 'rendering',
    title: 'Renderizado Final',
    description: 'Combinando todo en tu video musical'
  }
];