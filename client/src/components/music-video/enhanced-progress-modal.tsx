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
  Clock,
  Zap,
  Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProgressStage {
  id: string;
  title: string;
  description: string;
  tips: string[];
  icon: JSX.Element;
  color: string;
  gradient: string;
  estimatedTime: string;
}

interface EnhancedProgressModalProps {
  currentStage: string;
  progress: number;
  customMessage?: string;
  estimatedTimeRemaining?: string;
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
    icon: <Music2 className="h-6 w-6" />,
    color: "text-blue-500",
    gradient: "from-blue-500 via-cyan-500 to-blue-600",
    estimatedTime: "30-45 segundos"
  },
  {
    id: "concepts",
    title: "Generando Conceptos Creativos",
    description: "Creando 3 propuestas visuales únicas con portadas de álbum",
    tips: [
      "Analizando el mensaje emocional de la letra",
      "Generando 3 conceptos visuales únicos",
      "Creando paletas de colores cinematográficas",
      "Generando portadas de álbum personalizadas con tu rostro"
    ],
    icon: <Lightbulb className="h-6 w-6" />,
    color: "text-purple-500",
    gradient: "from-purple-500 via-pink-500 to-purple-600",
    estimatedTime: "45-60 segundos"
  },
  {
    id: "script",
    title: "Generando Guión Cinematográfico",
    description: "Creando el guión completo del video basado en el concepto elegido",
    tips: [
      "Desarrollando narrativa visual detallada",
      "Sincronizando escenas con la música",
      "Diseñando transiciones cinematográficas",
      "Preparando prompts para cada escena"
    ],
    icon: <FileText className="h-6 w-6" />,
    color: "text-indigo-500",
    gradient: "from-indigo-500 via-purple-500 to-indigo-600",
    estimatedTime: "40-50 segundos"
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
    icon: <Film className="h-6 w-6" />,
    color: "text-green-500",
    gradient: "from-green-500 via-emerald-500 to-green-600",
    estimatedTime: "10-15 segundos"
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
    icon: <ImageIcon className="h-6 w-6" />,
    color: "text-orange-500",
    gradient: "from-orange-500 via-red-500 to-orange-600",
    estimatedTime: "2-3 minutos"
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
    icon: <Sparkles className="h-6 w-6" />,
    color: "text-yellow-500",
    gradient: "from-yellow-500 via-orange-500 to-yellow-600",
    estimatedTime: "3-5 minutos"
  }
];

export default function EnhancedProgressModal({
  currentStage,
  progress,
  customMessage,
  estimatedTimeRemaining,
  onComplete
}: EnhancedProgressModalProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const stage = STAGES.find(s => s.id === currentStage) || STAGES[0];
  const stageIndex = STAGES.findIndex(s => s.id === currentStage);

  // Animar el progreso suavemente
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Rotar tips cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % stage.tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [stage.tips.length]);

  // Generar partículas cuando el progreso avanza
  useEffect(() => {
    if (progress > 0 && progress < 100) {
      const newParticles = Array.from({ length: 3 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100
      }));
      setParticles(prev => [...prev, ...newParticles].slice(-15));
    }
  }, [progress]);

  // Completar cuando llegue a 100%
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="relative w-full max-w-2xl bg-gradient-to-br from-background via-background to-orange-950/10 border-2 border-orange-500/20 shadow-2xl overflow-hidden">
        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${stage.gradient} opacity-40`}
              initial={{ x: `${particle.x}%`, y: `${particle.y}%`, scale: 0 }}
              animate={{ 
                y: [null, '-100%'],
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0]
              }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          ))}
        </div>

        <div className="relative space-y-6 p-8">
          {/* Cabecera con icono animado */}
          <motion.div
            className="text-center space-y-4"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center">
              <motion.div
                className={`p-4 rounded-2xl bg-gradient-to-r ${stage.gradient} shadow-lg`}
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: "easeInOut"
                }}
              >
                <div className="text-white">
                  {stage.icon}
                </div>
              </motion.div>
            </div>

            <div>
              <h3 className={`text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r ${stage.gradient}`}>
                {stage.title}
              </h3>
              <p className="text-base text-muted-foreground">
                {customMessage || stage.description}
              </p>
            </div>
          </motion.div>

          {/* Barra de progreso mejorada con glassmorphism */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className={`h-4 w-4 animate-spin ${stage.color}`} />
                <span className="text-sm font-medium text-muted-foreground">Progreso</span>
              </div>
              <motion.div
                className="flex items-center gap-3"
                key={displayProgress}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
              >
                <Badge className={`bg-gradient-to-r ${stage.gradient} text-white border-0 px-3 py-1`}>
                  {Math.round(displayProgress)}%
                </Badge>
              </motion.div>
            </div>

            {/* Barra de progreso con efectos */}
            <div className="relative h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${stage.gradient} rounded-full shadow-lg`}
                initial={{ width: 0 }}
                animate={{ width: `${displayProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {/* Efecto de brillo animado */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "linear"
                  }}
                />
              </motion.div>

              {/* Indicador de posición */}
              {displayProgress > 2 && displayProgress < 100 && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white shadow-lg border-4"
                  style={{ 
                    left: `calc(${displayProgress}% - 12px)`,
                    borderColor: `var(--${stage.color})`
                  }}
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5 
                  }}
                >
                  <motion.div
                    className={`absolute inset-1 rounded-full bg-gradient-to-r ${stage.gradient}`}
                    animate={{ 
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5 
                    }}
                  />
                </motion.div>
              )}
            </div>

            {/* Tiempo estimado */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Tiempo estimado: {estimatedTimeRemaining || stage.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-orange-500" />
                <span>Etapa {stageIndex + 1} de {STAGES.length}</span>
              </div>
            </div>
          </div>

          {/* Tips rotativos con mejor diseño */}
          <motion.div
            className="bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 dark:from-orange-950/30 dark:via-yellow-950/30 dark:to-orange-950/30 rounded-xl p-5 border-2 border-orange-200/50 dark:border-orange-800/50 shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-3">
              <motion.div
                className="p-2 bg-orange-500/20 rounded-lg"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: "easeInOut"
                }}
              >
                <Lightbulb className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </motion.div>
              <div className="flex-1 min-h-[60px]">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Lo que está pasando ahora:
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentTipIndex}
                    className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {stage.tips[currentTipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Indicador de pasos */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {STAGES.map((s, index) => (
              <motion.div
                key={s.id}
                className={`h-2 rounded-full transition-all ${
                  index < stageIndex 
                    ? `w-8 bg-gradient-to-r ${s.gradient}` 
                    : index === stageIndex 
                    ? `w-12 bg-gradient-to-r ${s.gradient}` 
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {index < stageIndex && (
                  <motion.div
                    className="h-full w-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
