import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface AudioVisualizerProps {
  audioUrl?: string;
  title?: string;
  artist?: string;
  coverImage?: string;
  autoPlay?: boolean;
  theme?: "default" | "premium" | "minimal";
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function AudioVisualizer({
  audioUrl,
  title = "Audio Track",
  artist = "Unknown Artist",
  coverImage,
  autoPlay = false,
  theme = "default",
  className,
  onPlay,
  onPause,
  onEnded
}: AudioVisualizerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  
  // Generamos datos visuales falsos para la visualización
  const visualizerBars = 30;
  const [visualData, setVisualData] = useState<number[]>(Array(visualizerBars).fill(0));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Formatear tiempo en formato mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };
  
  // Efecto para inicializar el audio
  useEffect(() => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });
    
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
      updateVisualizer();
    });
    
    audio.addEventListener("ended", () => {
      setPlaying(false);
      if (onEnded) onEnded();
    });
    
    audio.volume = volume;
    if (autoPlay) {
      audio.play().catch(e => console.log("Autoplay prevented:", e));
      setPlaying(true);
    }
    
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [audioUrl, autoPlay, onEnded]);
  
  // Efecto para actualizar el volumen
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);
  
  // Función para actualizar el visualizador con datos simulados
  const updateVisualizer = () => {
    if (!audioRef.current || !playing) {
      // Si no está reproduciendo, reducir gradualmente las barras
      setVisualData(prev => prev.map(v => Math.max(0, v * 0.95)));
      return;
    }
    
    // Generar datos visuales aleatorios que parezcan una visualización de audio real
    // Las barras del centro suelen ser más altas que los extremos
    const newData = Array(visualizerBars).fill(0).map((_, i) => {
      const centerPosition = visualizerBars / 2;
      const distanceFromCenter = Math.abs(i - centerPosition) / centerPosition;
      const baseFactor = 1 - distanceFromCenter * 0.7; // Las barras centrales son más altas
      
      // Añadir variabilidad y aleatorización para simular reacción al audio
      const randomVariation = Math.random() * 0.5 + 0.5;
      return Math.min(1, Math.max(0.1, baseFactor * randomVariation * (playing ? 0.7 : 0.1)));
    });
    
    setVisualData(newData);
  };
  
  // Control de reproducción
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      if (onPause) onPause();
    } else {
      audioRef.current.play().catch(e => console.log("Play prevented:", e));
      setPlaying(true);
      if (onPlay) onPlay();
    }
  };
  
  // Control de volumen
  const toggleMute = () => {
    setMuted(!muted);
  };
  
  // Navegación del audio
  const handleProgressChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = (value[0] / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    if (muted) setMuted(false);
  };
  
  const premiumGradientBg = theme === "premium" 
    ? "bg-gradient-to-r from-black via-orange-950/30 to-black border-orange-500/20" 
    : theme === "minimal" 
      ? "bg-black/40 backdrop-blur-sm border-orange-500/20" 
      : "bg-card border-border";
  
  const premiumControlsClass = theme === "premium" 
    ? "text-orange-400 hover:text-orange-300" 
    : "text-primary";

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 w-full max-w-md transition-all duration-300",
        premiumGradientBg,
        className
      )}
    >
      {/* Control bar */}
      <div className="flex flex-col gap-4">
        {/* Cover image and metadata */}
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-md overflow-hidden">
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={title} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <Volume2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            
            {/* Glow effect on play for premium theme */}
            {theme === "premium" && playing && (
              <motion.div 
                className="absolute inset-0 bg-orange-500/30 rounded-md"
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </div>
          
          <div className="flex flex-col">
            <p className={cn(
              "font-medium truncate",
              theme === "premium" ? "text-white" : "text-foreground"
            )}>
              {title}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {artist}
            </p>
          </div>
        </div>
        
        {/* Visualizer */}
        <div className="h-10 flex items-end justify-between gap-[2px] px-1 mt-1">
          {visualData.map((value, index) => (
            <motion.div
              key={index}
              className={cn(
                "w-full rounded-t",
                theme === "premium" 
                  ? "bg-gradient-to-t from-orange-600 to-orange-400" 
                  : "bg-primary"
              )}
              style={{ 
                height: `${value * 100}%`,
                opacity: playing ? 0.7 + (value * 0.3) : 0.5
              }}
              animate={{
                height: `${value * 100}%`,
                opacity: playing ? 0.7 + (value * 0.3) : 0.5
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
        
        {/* Seek bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime / duration * 100 || 0]}
            min={0}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className={cn(
              theme === "premium" ? "bg-orange-950/40" : "",
            )}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.max(0, currentTime - 10);
                }
              }}
              className={premiumControlsClass}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button 
              size="icon"
              onClick={togglePlay}
              className={cn(
                "h-10 w-10 rounded-full",
                theme === "premium" 
                  ? "bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white" 
                  : "bg-primary text-primary-foreground"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={playing ? "pause" : "play"}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {playing ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </motion.div>
              </AnimatePresence>
            </Button>
            
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = Math.min(duration, currentTime + 10);
                }
              }}
              className={premiumControlsClass}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-1/4 min-w-[80px]">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={toggleMute}
              className={premiumControlsClass}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
            
            <Slider
              value={[muted ? 0 : volume * 100]}
              min={0}
              max={100}
              onValueChange={handleVolumeChange}
              className={cn(
                "w-full",
                theme === "premium" ? "bg-orange-950/40" : ""
              )}
            />
          </div>
        </div>
      </div>
      
      {/* Premium effects */}
      {theme === "premium" && (
        <>
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-orange-500/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-orange-500/5 blur-3xl" />
        </>
      )}
    </div>
  );
}