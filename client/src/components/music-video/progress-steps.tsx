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
  const { state, setCurrentStep, markStepAsCompleted, updateWorkflowData } = useEditor();
  const { project } = state;
  
  // Utilizamos la nueva estructura workflowData si está disponible
  // Si no, utilizamos los campos clásicos para retrocompatibilidad
  
  let currentStepId;
  let completedStepIds: string[] = [];
  
  // Primero intentamos obtener los datos del nuevo flujo de trabajo
  if (project?.workflowData?.steps) {
    const workflowSteps = project.workflowData.steps;
    
    // El paso activo es el que tiene status 'in-progress'
    const activeStep = workflowSteps.find(s => s.status === 'in-progress');
    if (activeStep) {
      currentStepId = activeStep.id;
    }
    
    // Los pasos completados son los que tienen status 'completed'
    completedStepIds = workflowSteps
      .filter(s => s.status === 'completed')
      .map(s => s.id);
  } 
  // Como fallback, utilizamos la estructura antigua
  else {
    currentStepId = propCurrentStep || 
      (project && project.currentStep !== undefined ? steps[project.currentStep]?.id : steps[0].id);
      
    completedStepIds = propCompletedSteps || 
      (project && project.completedSteps ? project.completedSteps.map(index => steps[index]?.id).filter(Boolean) : []);
  }
  
  // Manejador de clic en un paso
  const handleStepClick = (stepId: string) => {
    // Encontramos el índice del paso
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      // Si tenemos la nueva estructura de datos, actualizamos workflowData
      if (project?.workflowData) {
        // Creamos un array de pasos actualizado para el workflowData
        const updatedSteps = steps.map(step => {
          const isTarget = step.id === stepId;
          const isCompleted = completedStepIds.includes(step.id);
          
          // Si el paso ya estaba completado, mantener 'completed'
          // Si es el paso seleccionado, marcar como 'in-progress'
          // Sino, mantener como 'pending'
          let status: 'pending' | 'in-progress' | 'completed' | 'skipped';
          
          if (isCompleted) {
            status = 'completed';
          } else if (isTarget) {
            status = 'in-progress';
          } else {
            status = 'pending';
          }
          
          return {
            id: step.id,
            status,
            timestamp: isCompleted ? new Date() : undefined
          };
        });
        
        // Actualizar workflowData con los nuevos pasos
        updateWorkflowData({ steps: updatedSteps });
      } 
      // Como fallback, usar el método clásico
      else {
        setCurrentStep(stepIndex);
      }
      
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
          const isActive = step.id === currentStepId;
          const isCompleted = completedStepIds.includes(step.id);
          
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
        {steps.find(step => step.id === currentStepId)?.description || ''}
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