import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, Mic, Play, Pause, Radio, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BoostifyRadioProps {
  className?: string;
  onClose?: () => void;
}

export function BoostifyRadio({ className, onClose }: BoostifyRadioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([50]);
  const [isRecording, setIsRecording] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume[0] / 100;
    }
  };

  const toggleMicrophone = async () => {
    try {
      if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        setIsRecording(true);

        // Aquí se puede implementar la lógica para transmitir el audio
        mediaRecorderRef.current.ondataavailable = (event) => {
          // Implementar lógica para enviar los datos de audio al servidor
          console.log("Audio data available", event.data);
        };
      } else {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: window.innerWidth - 300, top: 0, bottom: window.innerHeight - 200 }}
      onDragEnd={(_, info) => {
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y
        });
      }}
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[300px]",
        className
      )}
      animate={{ x: position.x, y: position.y }}
    >
      <Card className="bg-black/80 backdrop-blur-lg border-none text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-orange-500" />
            <span className="font-semibold">Boostify Radio</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/60 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white/60 hover:text-white",
                isPlaying && "text-orange-500"
              )}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            <div className="flex items-center gap-2 flex-1">
              <Volume2 className="h-4 w-4 text-white/60" />
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white/60 hover:text-white",
                isRecording && "text-red-500 animate-pulse"
              )}
              onClick={toggleMicrophone}
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-sm text-white/60">
            {isPlaying ? "Now Playing: Live Stream" : "Radio Paused"}
          </div>
        </div>

        <audio
          ref={audioRef}
          src="/api/radio/stream"
          preload="none"
          onEnded={() => setIsPlaying(false)}
        />
      </Card>
    </motion.div>
  );
}
