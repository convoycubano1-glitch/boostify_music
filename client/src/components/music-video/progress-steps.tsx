import { motion } from "framer-motion";
import { Music2, FileText, Video, Image as ImageIcon, Film, CheckCircle, User, Palette, Download, Sparkles } from "lucide-react";
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
      {/* Barra de Progreso Principal - Con efecto de gradiente */}
      <div className="relative mb-12">
        <div className="h-3 bg-background border border-border rounded-full shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full shadow-md"
            initial={{ width: "0%" }}
            // Manejo especial para pasos intermedios como 1.5
            animate={{ width: `${((currentStep - 1) / (effectiveTotalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
              backgroundSize: "200% 100%",
              backgroundPosition: "left center"
            }}
          />
        </div>

        {/* Pasos con efectos de partículas y glow */}
        <div className="absolute top-0 w-full flex justify-between transform -translate-y-1/2">
          {allSteps?.map((step, index) => {
            const Icon = step.icon || CheckCircle;
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";
            
            return (
              <div key={step.title} className="relative flex flex-col items-center group">
                {/* Círculo del Paso con efecto de glow en el actual */}
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2",
                    "transition-all duration-300 shadow-lg",
                    isCompleted ? "bg-gradient-to-br from-orange-500 to-orange-600 border-orange-400" :
                    isCurrent ? "bg-gradient-to-br from-orange-400 to-orange-500 border-orange-300" :
                    "bg-background border-orange-200 dark:bg-gray-800"
                  )}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ 
                    scale: isCurrent ? 1.2 : 1,
                    opacity: 1,
                    boxShadow: isCurrent ? "0 0 15px rgba(249, 115, 22, 0.7)" : "none"
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isCompleted || isCurrent
                        ? "text-white"
                        : "text-orange-300"
                    )}
                  />
                  
                  {/* Efecto de partícula para el paso actual */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 0.2, 0],
                        borderWidth: ["2px", "1px", "0px"]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                      style={{
                        border: "2px solid rgba(249, 115, 22, 0.8)"
                      }}
                    />
                  )}
                </motion.div>

                {/* Información del Paso - Tooltip mejorado */}
                <div className="absolute top-12 -left-1/2 w-40 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <motion.div 
                    className="bg-card p-3 rounded-lg shadow-xl text-center border border-border"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paso Actual - Resaltado premium */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        key={currentStep}
        className="text-center relative"
      >
        {/* Decoración de partículas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-2 left-1/2 w-2 h-2 rounded-full bg-orange-500/40"
            animate={{
              y: [0, 15, 0],
              x: [-20, -15, -20],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute -top-1 left-1/2 w-1 h-1 rounded-full bg-orange-400/30"
            animate={{
              y: [0, 20, 0],
              x: [5, 15, 5],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.div 
            className="absolute top-6 left-1/2 w-3 h-3 rounded-full bg-orange-300/20"
            animate={{
              y: [0, 10, 0],
              x: [10, 20, 10],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </div>
        
        {/* Título con efecto de brillo */}
        <div className="relative">
          <motion.div
            className="absolute -inset-1 rounded-lg bg-gradient-to-r from-orange-500/10 via-orange-400/5 to-orange-600/10 blur-xl"
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600 relative">
            {allSteps?.[Math.floor(currentStep) - 1]?.title}
          </h3>
        </div>
        
        {/* Descripción con animación de aparición */}
        <motion.p 
          className="text-muted-foreground mt-3 max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {allSteps?.[Math.floor(currentStep) - 1]?.description}
        </motion.p>
        
        {/* Indicador de paso actual con ícono */}
        <motion.div 
          className="mt-4 inline-flex items-center justify-center px-4 py-1 rounded-full text-sm 
                    bg-gradient-to-r from-orange-600/10 to-orange-400/10 border border-orange-500/20"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.2 }}
        >
          <Sparkles className="w-3 h-3 text-orange-500 mr-2" />
          <span className="text-orange-500">Paso {Math.floor(currentStep)} de {effectiveTotalSteps}</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
