import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { 
  Music2, 
  FileText, 
  ImageIcon, 
  Film, 
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Zap
} from "lucide-react";

interface ProgressStage {
  id: string;
  title: string;
  description: string;
  tips: string[];
  icon: JSX.Element;
  color: string;
}

interface DynamicProgressTrackerProps {
  currentStage: string;
  progress: number;
  customMessage?: string;
  onComplete?: () => void;
}

const STAGES: ProgressStage[] = [
  {
    id: "transcription",
    title: "Transcribiendo Audio",
    description: "La IA está identificando las palabras y su timing exacto",
    tips: [
      "Analizando frecuencias de audio para detectar palabras",
      "Identificando pausas y ritmo de la canción",
      "Sincronizando letras con timestamps precisos",
      "Detectando emociones en la voz del artista"
    ],
    icon: <Music2 className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "script",
    title: "Generando Guión Creativo",
    description: "Analizando la narrativa de la letra para crear escenas cinematográficas",
    tips: [
      "Identificando temas principales de la letra",
      "Creando arcos narrativos coherentes",
      "Seleccionando el mejor estilo visual para cada escena",
      "Diseñando transiciones cinematográficas fluidas"
    ],
    icon: <FileText className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "timeline-prep",
    title: "Preparando Timeline",
    description: "Organizando todas las escenas en la línea de tiempo",
    tips: [
      "Sincronizando escenas con el audio",
      "Calculando duración óptima de cada escena",
      "Preparando estructura de timeline",
      "Validando coherencia narrativa completa"
    ],
    icon: <Film className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500"
  },
  {
    id: "images",
    title: "Generando Imágenes con IA",
    description: "Creando visuales únicos basados en tu estilo seleccionado",
    tips: [
      "Generando arte conceptual para cada escena",
      "Aplicando tu paleta de colores personalizada",
      "Ajustando composición y encuadre cinematográfico",
      "Refinando detalles para máxima calidad visual"
    ],
    icon: <ImageIcon className="h-5 w-5" />,
    color: "from-orange-500 to-red-500"
  },
  {
    id: "video",
    title: "Generando Video Final",
    description: "Renderizando tu video musical con el modelo de IA seleccionado",
    tips: [
      "Aplicando efectos de movimiento cinematográfico",
      "Renderizando con tu modelo de IA preferido",
      "Optimizando calidad y fluidez del video",
      "Preparando el video para descarga y compartir"
    ],
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-yellow-500 to-orange-500"
  }
];

export default function DynamicProgressTracker({
  currentStage,
  progress,
  customMessage,
  onComplete
}: DynamicProgressTrackerProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  const stage = STAGES.find(s => s.id === currentStage) || STAGES[0];
  const stageIndex = STAGES.findIndex(s => s.id === currentStage);

  // Animar el progreso suavemente
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Rotar tips cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % stage.tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [stage.tips.length]);

  // Completar cuando llegue a 100%
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      className="space-y-4 sm:space-y-5 md:space-y-6 bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Cabecera con título animado - Responsive */}
      <motion.div
        className="text-center space-y-2 sm:space-y-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <motion.div
            className={`p-2 sm:p-3 rounded-full bg-gradient-to-r ${stage.color} bg-opacity-10`}
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            {stage.icon}
          </motion.div>
          <h3 className={`text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stage.color}`}>
            {stage.title}
          </h3>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          {customMessage || stage.description}
        </p>
      </motion.div>

      {/* Barra de progreso mejorada - Responsive */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <motion.span 
            className={`font-bold bg-clip-text text-transparent bg-gradient-to-r ${stage.color} text-base sm:text-lg`}
            key={displayProgress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {Math.round(displayProgress)}%
          </motion.span>
        </div>
        <div className="relative">
          <Progress 
            value={displayProgress} 
            className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-800"
          />
          <motion.div
            className={`absolute top-0 left-0 h-2 sm:h-3 rounded-full bg-gradient-to-r ${stage.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          {displayProgress > 5 && (
            <motion.div
              className="absolute -top-0.5 sm:-top-1 h-3 w-3 sm:h-5 sm:w-5 rounded-full bg-white shadow-lg border-2 border-orange-500"
              style={{ 
                left: `calc(${displayProgress}% - ${displayProgress > 5 ? '6px' : '10px'})`
              }}
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5 
              }}
            />
          )}
        </div>
      </div>

      {/* Tips rotativos con animación - Responsive */}
      <motion.div
        className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg p-3 sm:p-4 border border-orange-200/50 dark:border-orange-800/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          </motion.div>
          <div className="flex-1 min-h-[40px] sm:min-h-[48px]">
            <p className="text-xs sm:text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
              💡 Lo que está pasando ahora:
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTipIndex}
                className="text-xs sm:text-sm text-orange-700 dark:text-orange-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                {stage.tips[currentTipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Indicador simple de progreso de etapa - Responsive */}
      <div className="flex items-center justify-center gap-2">
        <motion.div
          className="text-center text-xs sm:text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Etapa {stageIndex + 1} de {STAGES.length}
        </motion.div>
      </div>
    </motion.div>
  );
}
