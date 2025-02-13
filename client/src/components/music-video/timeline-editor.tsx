import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Music, Image as ImageIcon, Edit, RefreshCw, X
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface TimelineClip {
  id: number;
  start: number;
  duration: number;
  type: 'video' | 'image' | 'transition' | 'audio';
  thumbnail?: string;
  title: string;
  description?: string;
  waveform?: number[];
  imagePrompt?: string;
  shotType?: string;
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
  onRegenerateImage?: (clipId: number) => void;
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
  isPlaying,
  onRegenerateImage
}: TimelineEditorProps) {
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [waveformData, setWaveformData] = useState<Array<{ max: number; min: number; }>>([]);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [isWaveformHovered, setIsWaveformHovered] = useState(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [clipStartTime, setClipStartTime] = useState<number>(0);
  const [resizingSide, setResizingSide] = useState<'start' | 'end' | null>(null);
  const playheadAnimation = useAnimation();
  const [selectedImagePreview, setSelectedImagePreview] = useState<TimelineClip | null>(null);

  const timelineWidth = duration * zoom;
  const timeToPixels = (time: number) => time * zoom;
  const pixelsToTime = (pixels: number) => pixels / zoom;

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1));

  useEffect(() => {
    if (isPlaying) {
      playheadAnimation.start({
        x: timeToPixels(currentTime),
        transition: {
          duration: 0.1,
          ease: "linear"
        }
      });
    } else {
      playheadAnimation.set({ x: timeToPixels(currentTime) });
    }
  }, [currentTime, isPlaying, timeToPixels, playheadAnimation]);

  useEffect(() => {
    if (!audioBuffer) return;

    const channelData = audioBuffer.getChannelData(0);
    const samples = 2000;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let max = 0;
      let min = 0;

      for (let j = 0; j < blockSize; j++) {
        const value = channelData[start + j];
        max = Math.max(max, value);
        min = Math.min(min, value);
      }

      waveform.push({ max, min });
    }

    setWaveformData(waveform);
  }, [audioBuffer]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    const newTime = pixelsToTime(x);
    onTimeUpdate(Math.max(0, Math.min(newTime, duration)));
  };

  const handleWaveformMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollPosition;
    setHoveredTime(pixelsToTime(x));
  };

  const handleClipDragStart = (clipId: number, e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', '');
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setIsDragging(true);
      setSelectedClip(clipId);
      setDragStartX(e.clientX);
      setClipStartTime(clip.start);
    }
  };

  const handleClipDragEnd = (e: React.DragEvent) => {
    if (selectedClip !== null) {
      const deltaX = e.clientX - dragStartX;
      const deltaTime = pixelsToTime(deltaX);
      const newStartTime = Math.max(0, clipStartTime + deltaTime);

      onClipUpdate(selectedClip, {
        start: newStartTime
      });
    }

    setIsDragging(false);
    setSelectedClip(null);
  };

  const handleResizeStart = (clipId: number, side: 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClip(clipId);
    setResizingSide(side);
    setDragStartX(e.clientX);
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setClipStartTime(clip.start);
    }
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!selectedClip || !resizingSide) return;

    const clip = clips.find(c => c.id === selectedClip);
    if (!clip) return;

    const deltaX = e.clientX - dragStartX;
    const deltaTime = pixelsToTime(deltaX);

    if (resizingSide === 'start') {
      const newStart = Math.max(0, clipStartTime + deltaTime);
      const newDuration = clip.start + clip.duration - newStart;
      if (newDuration >= 0.5) {
        onClipUpdate(selectedClip, {
          start: newStart,
          duration: newDuration
        });
      }
    } else {
      const newDuration = Math.max(0.5, clip.duration + deltaTime);
      onClipUpdate(selectedClip, {
        duration: newDuration
      });
    }
  };

  const handleResizeEnd = () => {
    setResizingSide(null);
    setSelectedClip(null);
  };

  const handleClipDoubleClick = (clip: TimelineClip) => {
    setSelectedImagePreview(clip);
  };

  return (
    <Card className="p-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
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

        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-black/10 px-3 py-1.5 rounded-md font-mono text-sm">
            {formatTimecode(currentTime)}
          </div>

          <div className="flex items-center">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-video bg-black/10 rounded-lg overflow-hidden mb-4">
        {selectedClip && clips.find(c => c.id === selectedClip)?.thumbnail ? (
          <img
            src={clips.find(c => c.id === selectedClip)?.thumbnail}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/25" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/10">
          <div
            className="absolute h-full bg-primary transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>

      <ScrollArea
        className="h-[300px] sm:h-[400px] border rounded-lg"
        onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
      >
        <div
          ref={timelineRef}
          className="relative"
          style={{ width: `${timelineWidth}px`, minHeight: "300px" }}
          onClick={handleTimelineClick}
          onMouseMove={resizingSide ? handleResizeMove : undefined}
          onMouseUp={resizingSide ? handleResizeEnd : undefined}
          onMouseLeave={resizingSide ? handleResizeEnd : undefined}
        >
          <div className="absolute top-0 left-0 right-0 h-6 border-b flex">
            {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
              <div
                key={i}
                className="border-l h-full flex items-center justify-center text-xs text-muted-foreground"
                style={{ width: `${timeToPixels(1)}px` }}
              >
                {formatTimecode(i)}
              </div>
            ))}
          </div>

          {waveformData.length > 0 && (
            <div
              className="absolute left-0 right-0 h-24 mt-8"
              onMouseEnter={() => setIsWaveformHovered(true)}
              onMouseLeave={() => {
                setIsWaveformHovered(false);
                setHoveredTime(null);
              }}
              onMouseMove={handleWaveformMouseMove}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-orange-500/10" />
                <svg
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                  className="relative z-10"
                >
                  <defs>
                    <linearGradient id="waveformGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>

                  <path
                    d={`M 0 ${48} ${waveformData.map((value, i) =>
                      `L ${(i / waveformData.length) * timelineWidth} ${48 - value.max * 48}`
                    ).join(' ')}`}
                    stroke="url(#waveformGradient)"
                    strokeWidth="2"
                    fill="none"
                  />

                  <path
                    d={`M 0 ${48} ${waveformData.map((value, i) =>
                      `L ${(i / waveformData.length) * timelineWidth} ${48 + value.min * 48}`
                    ).join(' ')}`}
                    stroke="url(#waveformGradient)"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>

                {isWaveformHovered && hoveredTime !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-orange-500/50"
                    style={{
                      left: `${timeToPixels(hoveredTime)}px`,
                      pointerEvents: 'none'
                    }}
                  >
                    <div className="absolute -top-6 -translate-x-1/2 px-2 py-1 rounded bg-orange-500 text-white text-xs">
                      {formatTimecode(hoveredTime)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-36">
            <AnimatePresence>
              {clips.map((clip) => (
                <motion.div
                  key={clip.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "absolute h-32 rounded-md overflow-hidden border cursor-pointer group",
                    selectedClip === clip.id ? "ring-2 ring-primary" : "",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  )}
                  style={{
                    left: `${timeToPixels(clip.start)}px`,
                    width: `${timeToPixels(clip.duration)}px`,
                    top: '8px'
                  }}
                  draggable
                  onDragStart={(e) => handleClipDragStart(clip.id, e)}
                  onDragEnd={handleClipDragEnd}
                  onDoubleClick={() => handleClipDoubleClick(clip)}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/20"
                    onMouseDown={(e) => handleResizeStart(clip.id, 'start', e)}
                  />
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/20"
                    onMouseDown={(e) => handleResizeStart(clip.id, 'end', e)}
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10" />

                  {clip.thumbnail && (
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-opacity"
                    />
                  )}

                  <div className="absolute inset-0 p-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {clip.shotType || 'Sin tipo de plano'}
                          </span>
                        </div>
                        {onRegenerateImage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRegenerateImage(clip.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-white/90 line-clamp-2">
                        {clip.imagePrompt || clip.description || 'Sin descripción'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTimecode(clip.duration)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.div
            animate={playheadAnimation}
            className="absolute top-0 bottom-0 w-px bg-primary z-50"
            initial={{ x: 0 }}
          >
            <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
            <div className="absolute bottom-0 -translate-x-1/2 w-2 h-2 bg-primary rounded-full" />
          </motion.div>
        </div>
      </ScrollArea>

      <Dialog open={selectedImagePreview !== null} onOpenChange={() => setSelectedImagePreview(null)}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setSelectedImagePreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative w-full h-full flex items-center justify-center bg-black/50 p-4">
              {selectedImagePreview?.thumbnail ? (
                <img
                  src={selectedImagePreview.thumbnail}
                  alt={selectedImagePreview.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12" />
                  <p className="mt-2">No hay imagen disponible</p>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">{selectedImagePreview?.shotType}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedImagePreview?.imagePrompt || selectedImagePreview?.description}
                  </p>
                </div>
                {onRegenerateImage && selectedImagePreview && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      onRegenerateImage(selectedImagePreview.id);
                      setSelectedImagePreview(null);
                    }}
                    className="shrink-0"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerar Imagen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

function formatTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // Asumiendo 30fps
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}