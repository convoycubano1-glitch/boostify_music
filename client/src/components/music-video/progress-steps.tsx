import { motion } from "framer-motion";
import { Music2, FileText, Video, Image as ImageIcon, Film, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { LucideIcon } from "lucide-react";

interface ProgressStepsProps {
  currentStep: number;
  steps: {
    title: string;
    description: string;
    status: "completed" | "current" | "pending";
    icon?: LucideIcon;
  }[];
}

// Definimos el tipo para un paso predeterminado
type DefaultStep = {
  title: string;
  description: string;
  icon: LucideIcon;
  status?: "completed" | "current" | "pending";
};

const defaultSteps: DefaultStep[] = [
  {
    title: "Transcripción de Audio",
    description: "Analizando y transcribiendo la letra de tu canción",
    icon: Music2,
  },
  {
    title: "Generación de Guion",
    description: "Creando un guion visual basado en tu música",
    icon: FileText,
  },
  {
    title: "Sincronización",
    description: "Sincronizando el video con el ritmo de la música",
    icon: Video,
  },
  {
    title: "Generación de Escenas",
    description: "Creando las escenas del video musical",
    icon: ImageIcon,
  },
  {
    title: "Renderizado Final",
    description: "Combinando todo en tu video musical",
    icon: Film,
  },
];

export function ProgressSteps({ 
  currentStep, 
  steps = defaultSteps.map((step, index) => ({
    ...step,
    // Modificado para manejar valores decimales como 1.5
    status: index + 1 < Math.floor(currentStep) ? "completed" : 
            index + 1 === Math.floor(currentStep) ? "current" : 
            "pending"
  })) as ProgressStepsProps['steps'] 
}: ProgressStepsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Barra de Progreso Principal */}
      <div className="relative mb-12">
        <div className="h-2 bg-orange-100 rounded-full">
          <motion.div
            className="h-full bg-orange-500 rounded-full"
            initial={{ width: "0%" }}
            // Manejo especial para pasos intermedios como 1.5
            animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        {/* Pasos */}
        <div className="absolute top-0 w-full flex justify-between transform -translate-y-1/2">
          {steps.map((step, index) => {
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
          {steps[Math.floor(currentStep) - 1]?.title}
        </h3>
        <p className="text-muted-foreground mt-2">
          {steps[Math.floor(currentStep) - 1]?.description}
        </p>
      </motion.div>
    </div>
  );
}
