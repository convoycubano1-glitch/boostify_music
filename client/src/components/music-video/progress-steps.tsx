import { motion } from "framer-motion";
import { Music2, FileText, Video, Image as ImageIcon, Film, CheckCircle2, User, Palette, Download } from "lucide-react";
import { cn } from "@/lib/utils";

import { LucideIcon } from "lucide-react";

export interface ProgressStepsProps {
  currentStep: number;
  steps?: {
    title: string;
    description: string;
    status: "completed" | "current" | "pending";
    icon?: LucideIcon;
  }[];
  totalSteps?: number;
  includeFaceSwap?: boolean;
  includeMusician?: boolean;
}

// Definimos el tipo para un paso predeterminado
export type Step = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status?: "completed" | "current" | "pending";
};

// Pasos base del proceso
export const baseSteps: Step[] = [
  {
    id: "transcription",
    title: "Transcripción de Audio",
    description: "Analizando y transcribiendo la letra de tu canción",
    icon: Music2,
  },
  {
    id: "script",
    title: "Generación de Guion",
    description: "Creando un guion visual basado en tu música",
    icon: FileText,
  },
  {
    id: "sync",
    title: "Sincronización",
    description: "Sincronizando el video con el ritmo de la música",
    icon: Video,
  },
  {
    id: "scenes",
    title: "Generación de Escenas",
    description: "Creando las escenas del video musical",
    icon: ImageIcon,
  },
  {
    id: "render",
    title: "Renderizado",
    description: "Combinando todo en tu video musical",
    icon: Film,
  },
];

// Pasos opcionales que pueden ser agregados
export const optionalSteps: Record<string, Step> = {
  faceSwap: {
    id: "faceSwap",
    title: "Face Swap",
    description: "Personalizando escenas con tu imagen",
    icon: User,
  },
  musician: {
    id: "musician",
    title: "Integración de Músicos",
    description: "Añadiendo músicos virtuales a tu video",
    icon: Music2,
  },
  style: {
    id: "style",
    title: "Estilo Visual",
    description: "Aplicando estilo visual a tu video",
    icon: Palette,
  },
  export: {
    id: "export",
    title: "Exportar",
    description: "Exportando el video final en alta calidad",
    icon: Download,
  }
};

// Función para obtener los pasos específicos
export function getSteps(options: { 
  includeFaceSwap?: boolean,
  includeMusician?: boolean 
} = {}): Step[] {
  const allSteps = [...baseSteps];
  
  // Agregar Face Swap si se solicita
  if (options.includeFaceSwap) {
    allSteps.push(optionalSteps.faceSwap);
  }
  
  // Agregar Integración de Músicos si se solicita
  if (options.includeMusician) {
    allSteps.push(optionalSteps.musician);
  }
  
  return allSteps;
}

export function ProgressSteps({ 
  currentStep, 
  includeFaceSwap = true,
  includeMusician = true,
  totalSteps,
  steps
}: ProgressStepsProps) {
  // Obtener los pasos según las opciones
  const allSteps = steps || getSteps({ 
    includeFaceSwap, 
    includeMusician 
  }).map((step, index) => ({
    ...step,
    // Modificado para manejar valores decimales como 1.5
    status: index + 1 < Math.floor(currentStep) ? "completed" : 
            index + 1 === Math.floor(currentStep) ? "current" : 
            "pending"
  })) as ProgressStepsProps['steps'];
  
  // Si no se proporciona totalSteps, usar la longitud de los pasos
  const effectiveTotalSteps = totalSteps || (allSteps?.length || 6);
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Barra de Progreso Principal */}
      <div className="relative mb-12">
        <div className="h-2 bg-orange-100 rounded-full">
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: "0%" }}
            // Manejo especial para pasos intermedios como 1.5
            animate={{ width: `${((currentStep - 1) / (effectiveTotalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        {/* Pasos */}
        <div className="absolute top-0 w-full flex justify-between transform -translate-y-1/2">
          {allSteps?.map((step, index) => {
            const Icon = step.icon || CheckCircle2;
            return (
              <div key={step.title} className="relative flex flex-col items-center group">
                {/* Círculo del Paso */}
                <motion.div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "transition-colors duration-200",
                    step.status === "completed" ? "bg-orange-500" :
                    step.status === "current" ? "bg-orange-400" :
                    "bg-orange-100"
                  )}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: step.status === "current" ? 1.2 : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      step.status === "completed" || step.status === "current"
                        ? "text-white"
                        : "text-orange-300"
                    )}
                  />
                </motion.div>

                {/* Información del Paso */}
                <div className="absolute top-10 -left-1/2 w-32 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white p-2 rounded-lg shadow-lg text-center">
                    <p className="text-sm font-semibold text-orange-500">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paso Actual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        key={currentStep}
        className="text-center"
      >
        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
          {allSteps?.[Math.floor(currentStep) - 1]?.title}
        </h3>
        <p className="text-muted-foreground mt-2">
          {allSteps?.[Math.floor(currentStep) - 1]?.description}
        </p>
      </motion.div>
    </div>
  );
}
