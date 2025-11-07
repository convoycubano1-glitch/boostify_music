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
    id: "timeline",
    title: "Preparando Timeline",
    description: "Organizando todas las escenas en la línea de tiempo",
    tips: [
      "Sincronizando imágenes con el audio",
      "Calculando duración óptima de cada escena",
      "Preparando transiciones suaves entre clips",
      "Validando coherencia narrativa completa"
    ],
    icon: <Film className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500"
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
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Cabecera con título animado */}
      <motion.div
        className="text-center space-y-2"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-3">
          <motion.div
            className={`p-3 rounded-full bg-gradient-to-r ${stage.color} bg-opacity-10`}
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
          <h3 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${stage.color}`}>
            {stage.title}
          </h3>
        </div>
        <p className="text-muted-foreground">
          {customMessage || stage.description}
        </p>
      </motion.div>

      {/* Barra de progreso mejorada */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <motion.span 
            className={`font-bold bg-clip-text text-transparent bg-gradient-to-r ${stage.color}`}
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
            className="h-3 bg-gray-200 dark:bg-gray-800"
          />
          <motion.div
            className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${stage.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          {displayProgress > 5 && (
            <motion.div
              className="absolute -top-1 h-5 w-5 rounded-full bg-white shadow-lg border-2 border-orange-500"
              style={{ 
                left: `calc(${displayProgress}% - 10px)`
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

      {/* Tips rotativos con animación */}
      <motion.div
        className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg p-4 border border-orange-200/50 dark:border-orange-800/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start gap-3">
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
            <Lightbulb className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          </motion.div>
          <div className="flex-1 min-h-[48px]">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
              💡 Lo que está pasando ahora:
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTipIndex}
                className="text-sm text-orange-700 dark:text-orange-300"
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

      {/* Indicador de etapas completadas */}
      <div className="flex items-center justify-center gap-2">
        {STAGES.map((s, index) => (
          <motion.div
            key={s.id}
            className={`h-2 rounded-full transition-all ${
              index < stageIndex
                ? 'w-8 bg-green-500'
                : index === stageIndex
                ? `w-12 bg-gradient-to-r ${s.color}`
                : 'w-6 bg-gray-300 dark:bg-gray-700'
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>

      {/* Etapas en lista */}
      <div className="space-y-2">
        {STAGES.map((s, index) => {
          const isCompleted = index < stageIndex;
          const isCurrent = index === stageIndex;
          const isPending = index > stageIndex;

          return (
            <motion.div
              key={s.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isCurrent
                  ? 'bg-orange-500/10 border border-orange-500/20'
                  : isCompleted
                  ? 'bg-green-500/10 border border-green-500/20 opacity-70'
                  : 'opacity-40'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCurrent
                    ? 'bg-orange-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Zap className="h-4 w-4" />
                  </motion.div>
                ) : (
                  s.icon
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-orange-600 dark:text-orange-400' : 
                  isCompleted ? 'text-green-600 dark:text-green-400' : 
                  'text-muted-foreground'
                }`}>
                  {s.title}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
