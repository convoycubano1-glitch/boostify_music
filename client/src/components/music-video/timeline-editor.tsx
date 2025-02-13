import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Music, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TimelineClip {
  id: number;
  start: number;
  duration: number;
  type: 'video' | 'image' | 'transition' | 'audio';
  thumbnail?: string;
  title: string;
  description?: string;
  waveform?: number[]; // Para visualización de audio
}

interface TimelineEditorProps {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
  onTimeUpdate: (time: number) => void;
  onClipUpdate: (clipId: number, updates: Partial<TimelineClip>) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
}

export function TimelineEditor({
  clips,
  currentTime,
  duration,
  audioBuffer,
  onTimeUpdate,
  onClipUpdate,
  onPlay,
  onPause,
  isPlaying
}: TimelineEditorProps) {
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Calcular el ancho total del timeline basado en la duración y el zoom
  const timelineWidth = duration * zoom;

  // Convertir tiempo a pixels y viceversa
  const timeToPixels = (time: number) => time * zoom;
  const pixelsToTime = (pixels: number) => pixels / zoom;

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  // Generar datos de forma de onda cuando el audioBuffer cambia
  useEffect(() => {
    if (audioBuffer) {
      const channelData = audioBuffer.getChannelData(0);
      const samples = 1000; // Número de muestras para visualización
      const blockSize = Math.floor(channelData.length / samples);
      const waveform = [];

      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[start + j]);
        }
        waveform.push(sum / blockSize);
      }

      setWaveformData(waveform);
    }
  }, [audioBuffer]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    const newTime = pixelsToTime(x);
    onTimeUpdate(Math.max(0, Math.min(newTime, duration)));
  };

  const handleClipDragStart = (clipId: number) => {
    setIsDragging(true);
    setSelectedClip(clipId);
  };

  const handleClipDragEnd = () => {
    setIsDragging(false);
    setSelectedClip(null);
  };

  return (
    <Card className="p-4 flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTimeUpdate(0)}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTimeUpdate(duration)}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea 
        className="h-[300px] border rounded-lg"
        onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
      >
        <div
          ref={timelineRef}
          className="relative"
          style={{ width: `${timelineWidth}px`, minHeight: "300px" }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b flex">
            {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
              <div
                key={i}
                className="border-l h-full flex items-center justify-center text-xs text-muted-foreground"
                style={{ width: `${timeToPixels(1)}px` }}
              >
                {formatTime(i)}
              </div>
            ))}
          </div>

          {/* Audio waveform */}
          {waveformData.length > 0 && (
            <div className="absolute left-0 right-0 h-20 mt-8 bg-black/5">
              <svg
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                className="opacity-50"
              >
                <path
                  d={`M 0 ${40} ${waveformData.map((value, i) => 
                    `L ${(i / waveformData.length) * timelineWidth} ${40 + value * 40}`
                  ).join(' ')}`}
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
            </div>
          )}

          {/* Clips */}
          <div className="mt-6">
            <AnimatePresence>
              {clips.map((clip) => (
                <motion.div
                  key={clip.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "absolute h-20 rounded-md overflow-hidden border cursor-pointer group",
                    selectedClip === clip.id ? "ring-2 ring-primary" : "",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{
                    left: `${timeToPixels(clip.start)}px`,
                    width: `${timeToPixels(clip.duration)}px`,
                    top: clip.type === 'transition' ? '88px' : '8px'
                  }}
                  draggable
                  onDragStart={() => handleClipDragStart(clip.id)}
                  onDragEnd={handleClipDragEnd}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10" />
                  {clip.thumbnail && (
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity"
                    />
                  )}
                  <div className="absolute inset-0 p-2 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      {clip.type === 'audio' ? (
                        <Music className="h-4 w-4" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium truncate">
                        {clip.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(clip.duration)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-primary"
            style={{ left: `${timeToPixels(currentTime)}px` }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}