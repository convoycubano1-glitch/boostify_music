/**
 * Enhanced Timeline Editor for Music Videos
 * Professional-grade multi-track editor with advanced features:
 * - Synchronized video preview viewer
 * - Multiple tool modes (Select, Razor, Trim, Hand)
 * - Undo/Redo history system
 * - Snap-to-grid and marker snapping
 * - Auto-scroll following playhead
 * - Comprehensive keyboard shortcuts
 * - Mobile-responsive with touch support
 * - Multi-layer editing (Audio, Video, Text, Effects, AI)
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { 
  Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut,
  Music, Layers, Lock, Eye, Trash, Plus, Undo, Redo,
  ChevronLeft, ChevronRight, EyeOff, LockOpen, Unlock, 
  Image as ImageIcon, RefreshCw, Video, Wand2, Text, 
  Sparkles as SparklesIcon, Star, Hand, Scissors, Move, 
  Maximize2, Save, FolderOpen
} from 'lucide-react';
import { TimelineClip } from '../timeline/TimelineClip';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Slider } from '../../components/ui/slider';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { ensureCompatibleClip } from '../timeline/TimelineClipUnified';

// ===== Type Definitions =====

/**
 * Timeline clip interface with multi-layer support
 * Professional structure inspired by editors like CapCut and Premiere
 */
export interface TimelineClip {
  id: number;
  start: number;
  duration: number;
  type: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text';
  layer: number; // 0=audio, 1=video/image, 2=text, 3=effects, 7=AI-generated
  thumbnail?: string;
  title: string;
  description?: string;
  waveform?: number[];
  imagePrompt?: string;
  shotType?: string;
  visible?: boolean;
  locked?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  movementUrl?: string;
  audioUrl?: string;
  lipsyncApplied?: boolean;
  lipsyncVideoUrl?: string;
  lipsyncProgress?: number;
  metadata?: {
    section?: string;
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    faceSwapApplied?: boolean;
    musicianIntegrated?: boolean;
    sourceIndex?: number;
    isGeneratedImage?: boolean;
    lipsync?: {
      applied: boolean;
      videoUrl?: string;
      progress?: number;
      timestamp?: string;
    };
  };
}

export interface BeatData {
  time: number;
  timecode: string;
  energy: number;
  intensity: number;
  type: string;
  isDownbeat: boolean;
}

export interface BeatMapMetadata {
  songTitle?: string;
  artist?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  complexity?: string;
  generatedAt?: string;
  beatAnalysis?: {
    totalBeats?: number;
    beatTypes?: {
      downbeats?: number;
      accents?: number;
      regularBeats?: number;
    };
    averageInterval?: number;
    patternComplexity?: string;
  };
}

export interface BeatMap {
  metadata: BeatMapMetadata;
  beats: BeatData[];
}

type ToolMode = 'select' | 'razor' | 'trim' | 'hand';
type HistoryState = { clips: TimelineClip[]; selectedId: number | null };

interface TimelineEditorProps {
  clips?: TimelineClip[];
  currentTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
  onTimeUpdate: (time: number) => void;
  onClipUpdate?: (clipId: number, updates: Partial<TimelineClip>) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  onSceneSelect?: (clipId: number | null) => void;
  onRegenerateImage?: (clipId: number) => void;
  onGenerateVideo?: (clipId: number) => void;
  onSplitClip?: (clipId: number, splitTime: number) => void;
  beatsData?: BeatMap;
  videoUrl?: string; // Optional: for video preview
  onSaveProject?: () => void;
  onLoadProject?: () => void;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  isSavingProject?: boolean;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
}

// ===== Constants =====
const PIXELS_PER_SECOND_BASE = 100;
const SNAP_TOLERANCE = 0.05; // 50ms snap tolerance for precision
const HISTORY_LIMIT = 50;
const MAX_CLIP_DURATION = 6; // Maximum clip duration in seconds (matching 3-6s range)

// ===== Main Component =====
export function TimelineEditor({
  clips = [],
  currentTime,
  duration,
  audioBuffer,
  onTimeUpdate,
  onClipUpdate,
  onPlay,
  onPause,
  isPlaying,
  onSceneSelect,
  onRegenerateImage,
  onGenerateVideo,
  onSplitClip,
  beatsData,
  videoUrl,
  onSaveProject,
  onLoadProject,
  projectName = '',
  onProjectNameChange,
  isSavingProject = false,
  lastSavedAt = null,
  hasUnsavedChanges = false
}: TimelineEditorProps) {
  const { toast } = useToast();

  // ===== State =====
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<ToolMode>('select');
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  
  // Notify parent when selection changes
  useEffect(() => {
    onSceneSelect?.(selectedClip);
  }, [selectedClip, onSceneSelect]);
  const [showWaveform, setShowWaveform] = useState<boolean>(true);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Drag/Resize state
  const [draggingClip, setDraggingClip] = useState<number | null>(null);
  const [resizingSide, setResizingSide] = useState<'start' | 'end' | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [clipStartPosition, setClipStartPosition] = useState<number>(0);
  
  // Hand tool panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartScrollLeft, setPanStartScrollLeft] = useState(0);
  
  // History for undo/redo
  const [history, setHistory] = useState<{ past: HistoryState[]; future: HistoryState[] }>({ 
    past: [], 
    future: [] 
  });

  // ===== Refs =====
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafIdRef = useRef<number | null>(null);

  // ===== Computed Values =====
  const scaledPixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
  const timeToPixels = useCallback((time: number) => time * scaledPixelsPerSecond, [scaledPixelsPerSecond]);
  const pixelsToTime = useCallback((pixels: number) => pixels / scaledPixelsPerSecond, [scaledPixelsPerSecond]);
  
  // Snap candidates from beat markers
  const snapCandidates = useMemo(() => {
    const beats = beatsData?.beats?.map(b => b.time) ?? [];
    return [...beats, 0, duration];
  }, [beatsData, duration]);

  const snapTo = useCallback((t: number) => {
    const step = zoom >= 1.4 ? 0.1 : zoom >= 0.8 ? 0.25 : 0.5;
    const grid = [...snapCandidates, Math.round(t / step) * step];
    const nearest = grid.reduce((a, b) => Math.abs(b - t) < Math.abs(a - t) ? b : a, t);
    return Math.abs(nearest - t) <= SNAP_TOLERANCE ? nearest : t;
  }, [snapCandidates, zoom]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // ===== History Management =====
  const pushHistory = useCallback(() => {
    const snapshot: HistoryState = {
      clips: structuredClone?.(clips) ?? clips.map(c => ({ ...c })),
      selectedId: selectedClip
    };
    setHistory(prev => {
      const nextPast = [...prev.past, snapshot].slice(-HISTORY_LIMIT);
      return { past: nextPast, future: [] };
    });
  }, [clips, selectedClip]);

  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    const newPast = [...history.past];
    const prev = newPast.pop()!;
    
    const currentState: HistoryState = {
      clips: structuredClone?.(clips) ?? clips.map(c => ({ ...c })),
      selectedId: selectedClip
    };
    
    setHistory({ past: newPast, future: [currentState, ...history.future] });
    setSelectedClip(prev.selectedId);
    
    // Update clips
    prev.clips.forEach(clip => {
      if (onClipUpdate) {
        const original = clips.find(c => c.id === clip.id);
        if (original) {
          onClipUpdate(clip.id, clip);
        }
      }
    });
    
    toast({
      title: "Undo",
      description: "Reverted last change",
      variant: "default",
    });
  }, [history, clips, selectedClip, onClipUpdate, toast]);

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    const newFuture = [...history.future];
    const next = newFuture.shift()!;
    
    const currentState: HistoryState = {
      clips: structuredClone?.(clips) ?? clips.map(c => ({ ...c })),
      selectedId: selectedClip
    };
    
    setHistory({ past: [...history.past, currentState], future: newFuture });
    setSelectedClip(next.selectedId);
    
    // Update clips
    next.clips.forEach(clip => {
      if (onClipUpdate) {
        const original = clips.find(c => c.id === clip.id);
        if (original) {
          onClipUpdate(clip.id, clip);
        }
      }
    });
    
    toast({
      title: "Redo",
      description: "Reapplied change",
      variant: "default",
    });
  }, [history, clips, selectedClip, onClipUpdate, toast]);

  // ===== Auto-scroll Effect =====
  useEffect(() => {
    if (!autoScroll || !timelineRef.current) return;
    const container = timelineRef.current;
    const playheadX = timeToPixels(currentTime);
    const pad = 60;
    
    if (playheadX < container.scrollLeft + pad || playheadX > container.scrollLeft + container.clientWidth - pad) {
      container.scrollTo({ 
        left: Math.max(0, playheadX - container.clientWidth / 3), 
        behavior: 'smooth' 
      });
    }
  }, [currentTime, timeToPixels, autoScroll]);

  // ===== Video Preview Sync =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    
    try {
      video.currentTime = currentTime;
      if (isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    } catch (e) {
      // Silently handle video sync errors
    }
  }, [currentTime, isPlaying, videoUrl]);

  // ===== Waveform Drawing =====
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || !audioBuffer || !showWaveform) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = timeToPixels(duration);
    canvas.width = width;
    canvas.height = 80;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = canvas.height / 2;

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j] || 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }, [audioBuffer, duration, zoom, showWaveform, timeToPixels]);

  // ===== Clip Operations =====
  const handleSelectClip = useCallback((id: number) => {
    setSelectedClip(id);
  }, []);

  const handleClipUpdate = useCallback((id: number, updates: Partial<TimelineClip>) => {
    if (onClipUpdate) {
      onClipUpdate(id, updates);
    }
  }, [onClipUpdate]);

  const handleClipMouseDown = useCallback((e: React.MouseEvent, clipId: number, handle?: 'start' | 'end' | 'body') => {
    if (tool === 'hand') return;
    
    e.stopPropagation();
    e.preventDefault(); // Prevenir selección de texto
    
    setSelectedClip(clipId);
    
    const clip = clips.find(c => c.id === clipId);
    if (!clip || clip.locked) return;
    
    if (tool === 'razor') {
      // Split clip at EXACT click position (not playhead)
      if (onSplitClip && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const scrollLeft = timelineRef.current.scrollLeft || 0;
        const offsetX = e.clientX - rect.left + scrollLeft;
        const clickTime = pixelsToTime(offsetX);
        
        console.log('🔪 Razor Tool:', {
          clientX: e.clientX,
          rectLeft: rect.left,
          scrollLeft,
          offsetX,
          clickTime,
          clipStart: clip.start,
          clipEnd: clip.start + clip.duration
        });
        
        // Only split if click is within clip boundaries (with small margin)
        const margin = 0.05; // 50ms margin
        if (clickTime >= clip.start + margin && clickTime <= clip.start + clip.duration - margin) {
          pushHistory();
          onSplitClip(clipId, clickTime);
          
          toast({
            title: "✂️ Clip dividido",
            description: `Cortado en ${formatTime(clickTime)}`,
            variant: "default",
          });
        } else {
          toast({
            title: "⚠️ No se puede cortar aquí",
            description: "Haz clic dentro del clip para dividirlo",
            variant: "destructive",
          });
        }
      }
      return;
    }
    
    // Select tool: Solo permite mover el cuerpo del clip
    if (tool === 'select' && handle === 'body') {
      pushHistory();
      setDraggingClip(clipId);
      setDragStartX(e.clientX);
      setClipStartPosition(clip.start);
      document.body.style.cursor = 'grabbing';
    } 
    // Trim tool: Permite redimensionar desde cualquier handle (start, end, o body como fallback)
    else if (tool === 'trim') {
      pushHistory();
      if (handle === 'start' || handle === 'end') {
        setResizingSide(handle);
      } else {
        // Si hacen clic en el body con trim tool, detectar qué lado está más cerca
        const rect = timelineRef.current?.getBoundingClientRect();
        if (rect) {
          const scrollLeft = timelineRef.current?.scrollLeft || 0;
          const offsetX = e.clientX - rect.left + scrollLeft;
          const clickTime = pixelsToTime(offsetX);
          const clipMidpoint = clip.start + (clip.duration / 2);
          
          // Si está más cerca del inicio, redimensionar desde el inicio
          setResizingSide(clickTime < clipMidpoint ? 'start' : 'end');
        }
      }
      setDragStartX(e.clientX);
      setClipStartPosition(clip.start);
      document.body.style.cursor = 'ew-resize';
    }
  }, [tool, clips, pixelsToTime, pushHistory, onSplitClip, toast, timelineRef]);

  // Mouse move handler for drag/resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingClip && !resizingSide) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaTime = pixelsToTime(deltaX);
    
    const clip = clips.find(c => c.id === (draggingClip || selectedClip));
    if (!clip) return;
    
    const otherClipsInLayer = clips.filter(c => c.layer === clip.layer && c.id !== clip.id);
    
    if (draggingClip) {
      let newStart = Math.max(0, clipStartPosition + deltaTime);
      newStart = snapTo(newStart);
      
      const wouldCollide = otherClipsInLayer.some(otherClip => {
        const clipEnd = newStart + clip.duration;
        return (newStart < otherClip.start + otherClip.duration && clipEnd > otherClip.start);
      });
      
      if (!wouldCollide && newStart + clip.duration <= duration) {
        handleClipUpdate(clip.id, { start: newStart });
      }
    } else if (resizingSide === 'start') {
      const maxNewStart = clipStartPosition + clip.duration - 0.1;
      let newStart = Math.min(maxNewStart, Math.max(0, clipStartPosition + deltaTime));
      newStart = snapTo(newStart);
      const newDuration = Math.min(MAX_CLIP_DURATION, clip.duration - (newStart - clipStartPosition));
      
      if (newDuration >= 0.1) {
        handleClipUpdate(clip.id, { start: newStart, duration: newDuration });
      }
    } else if (resizingSide === 'end') {
      let newDuration = Math.min(MAX_CLIP_DURATION, Math.max(0.1, clip.duration + deltaTime));
      const endTime = snapTo(clip.start + newDuration);
      newDuration = clamp(endTime - clip.start, 0.1, MAX_CLIP_DURATION);
      
      if (clip.start + newDuration <= duration) {
        handleClipUpdate(clip.id, { duration: newDuration });
      }
    }
  }, [draggingClip, resizingSide, dragStartX, clipStartPosition, selectedClip, clips, pixelsToTime, snapTo, duration, handleClipUpdate]);

  const handleMouseUp = useCallback(() => {
    setDraggingClip(null);
    setResizingSide(null);
    setIsPanning(false);
    document.body.style.cursor = '';
  }, []);

  // Hand tool panning handlers
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool !== 'hand') return;
    
    e.preventDefault();
    setIsPanning(true);
    setPanStartX(e.clientX);
    setPanStartScrollLeft(timelineRef.current?.scrollLeft || 0);
    document.body.style.cursor = 'grabbing';
  }, [tool]);

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning || !timelineRef.current) return;
    
    const deltaX = e.clientX - panStartX;
    timelineRef.current.scrollLeft = panStartScrollLeft - deltaX;
  }, [isPanning, panStartX, panStartScrollLeft]);

  // Setup/cleanup mouse event listeners
  useEffect(() => {
    if (draggingClip || resizingSide) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingClip, resizingSide, handleMouseMove, handleMouseUp]);

  // Hand tool panning listeners
  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handlePanMove, handleMouseUp]);

  // ===== Touch Support for Mobile =====
  const handleTouchStart = useCallback((e: React.TouchEvent, clipId: number, handle?: 'start' | 'end' | 'body') => {
    if (tool === 'hand' || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true
    }) as unknown as React.MouseEvent;
    
    handleClipMouseDown(mouseEvent, clipId, handle);
  }, [tool, handleClipMouseDown]);

  // ===== Keyboard Shortcuts =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? onPause() : onPlay();
      } else if (e.key.toLowerCase() === 'v') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'c') {
        setTool('razor');
      } else if (e.key.toLowerCase() === 't') {
        setTool('trim');
      } else if (e.key.toLowerCase() === 'h') {
        setTool('hand');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (e.shiftKey && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        setZoom(z => Math.min(10, z * 1.4));
      } else if (e.shiftKey && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        setZoom(z => Math.max(0.1, z / 1.4));
      } else if (e.shiftKey && e.key === '0') {
        e.preventDefault();
        setZoom(1);
      } else if (e.key === 'Delete' && selectedClip !== null) {
        pushHistory();
        // Delete selected clip - implement deletion logic
      }
    };
    
    containerRef.current?.addEventListener('keydown', handleKeyDown);
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, onPlay, onPause, handleUndo, handleRedo, selectedClip, pushHistory]);

  // ===== Timeline Click Handler =====
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (tool === 'hand' || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const clickedTime = pixelsToTime(offsetX);
    
    if (clickedTime >= 0 && clickedTime <= duration) {
      onTimeUpdate(clickedTime);
    }
  }, [tool, pixelsToTime, duration, onTimeUpdate]);

  // ===== Render Time Markers =====
  const renderTimeMarkers = useCallback(() => {
    const markers = [];
    const majorStep = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 1 : 0.5;
    const minorStep = majorStep / 5;
    
    for (let i = 0; i <= Math.ceil(duration); i += minorStep) {
      const position = timeToPixels(i);
      const isMajor = Math.abs(i % majorStep) < 0.001;
      const isHalfSecond = Math.abs(i % 0.5) < 0.001;
      
      markers.push(
        <div 
          key={`marker-${i}`}
          className={cn(
            "absolute",
            isMajor ? "border-l border-gray-500 h-12" : 
            isHalfSecond ? "border-l border-gray-700 h-8" : 
            "border-l border-gray-800 h-4"
          )}
          style={{ left: `${position}px` }}
        >
          {isMajor && (
            <div className="text-xs text-gray-400 font-medium ml-1">
              {formatTime(i)}
            </div>
          )}
        </div>
      );
    }
    
    return markers;
  }, [duration, zoom, timeToPixels]);

  // ===== Render Playhead =====
  const renderPlayhead = useCallback(() => {
    return (
      <div 
        className="absolute top-0 h-full border-l-2 border-primary z-30 pointer-events-none"
        style={{ 
          left: `${timeToPixels(currentTime)}px`,
          transition: isPlaying ? 'none' : 'left 0.1s ease',
          filter: "drop-shadow(0 0 3px rgba(255,255,255,0.3))"
        }}
      >
        <div className="absolute -left-[18px] -top-2 flex flex-col items-center">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg">
            {isPlaying ? 
              <Pause className="h-4 w-4 text-white" /> : 
              <Play className="h-4 w-4 text-white" />
            }
          </div>
          <div className="text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded mt-1 whitespace-nowrap">
            {formatTime(currentTime)}
          </div>
        </div>
        <div className="absolute -left-1 bottom-0 w-2 h-4 bg-primary rounded-t-sm" />
      </div>
    );
  }, [currentTime, isPlaying, timeToPixels]);

  // ===== Format Time Utility =====
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
  };

  // ===== Group clips by layer =====
  const clipsByLayer = useMemo(() => {
    return clips.reduce((grouped, clip) => {
      const layer = clip.layer || 0;
      if (!grouped[layer]) grouped[layer] = [];
      grouped[layer].push(clip);
      return grouped;
    }, {} as Record<number, TimelineClip[]>);
  }, [clips]);

  // ===== Layer Colors =====
  const getLayerColor = (layer: number) => {
    const colors = [
      { bg: '#3730a3', text: 'white' },  // 0: Audio
      { bg: '#0369a1', text: 'white' },  // 1: Video
      { bg: '#15803d', text: 'white' },  // 2: Text
      { bg: '#9f1239', text: 'white' },  // 3: Effects
      { bg: '#7e22ce', text: 'white' },  // 4: Reserved
      { bg: '#b91c1c', text: 'white' },  // 5: Reserved
      { bg: '#854d0e', text: 'white' },  // 6: Reserved
      { bg: '#f97316', text: 'white' }   // 7: AI Generated
    ];
    return colors[layer % colors.length];
  };

  const getLayerName = (layerId: number) => {
    const names: Record<number, string> = {
      0: 'Audio',
      1: 'Video/Image',
      2: 'Text',
      3: 'Effects',
      7: 'AI Generated'
    };
    return names[layerId] || `Layer ${layerId}`;
  };

  const getLayerIcon = (layerId: number) => {
    const icons: Record<number, JSX.Element> = {
      0: <Music className="h-3 w-3 mr-1" />,
      1: <Video className="h-3 w-3 mr-1" />,
      2: <Text className="h-3 w-3 mr-1" />,
      3: <Wand2 className="h-3 w-3 mr-1" />,
      7: <ImageIcon className="h-3 w-3 mr-1" />
    };
    return icons[layerId] || <Layers className="h-3 w-3 mr-1" />;
  };

  // ===== Main Render =====
  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      className="flex flex-col h-full border rounded-md bg-gray-900 text-white overflow-hidden"
      style={{ outline: 'none' }}
    >
      {/* Video Preview Panel */}
      {videoUrl && (
        <div className="preview-panel relative bg-black border-b border-gray-700">
          <div className="relative mx-auto max-w-4xl aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              playsInline
              className="h-full w-full object-contain"
              style={{ 
                transform: `scale(${previewZoom})`, 
                transformOrigin: 'center' 
              }}
            />
            {/* Timecode overlay */}
            <div className="absolute top-2 left-2 text-xs px-2 py-1 bg-black/60 text-white rounded">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            {/* Safe areas */}
            {showSafeAreas && (
              <div className="pointer-events-none absolute inset-0 border-2 border-white/30" />
            )}
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-800">
            <Button size="sm" variant="outline" onClick={() => setPreviewZoom(1)}>
              1x
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreviewZoom(z => Math.min(2, z + 0.25))}>
              +
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.25))}>
              -
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSafeAreas(v => !v)}>
              {showSafeAreas ? 'Hide Safe Areas' : 'Show Safe Areas'}
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar - Responsive */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 flex-wrap gap-1 md:gap-2">
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Playback controls */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 1))}
            title="Rewind 1s"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <SkipBack className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="default" 
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? "Pause" : "Play"}
            data-testid="button-playback-toggle"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            {isPlaying ? <Pause className="h-3 w-3 md:h-4 md:w-4" /> : <Play className="h-3 w-3 md:h-4 md:w-4" />}
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onTimeUpdate(Math.min(duration, currentTime + 1))}
            title="Forward 1s"
            className="h-8 w-8 md:h-10 md:w-10"
          >
            <SkipForward className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 md:h-8 mx-1 md:mx-2" />
          
          {/* Tool modes - Responsive */}
          <Button 
            size="sm" 
            variant={tool === 'select' ? 'default' : 'ghost'}
            onClick={() => setTool('select')}
            title="Select Tool (V)"
            data-testid="button-tool-select"
            className="px-2 md:px-3 h-7 md:h-9"
          >
            <Move className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden md:inline ml-1">Select</span>
          </Button>
          
          <Button 
            size="sm" 
            variant={tool === 'razor' ? 'default' : 'ghost'}
            onClick={() => setTool('razor')}
            title="Razor Tool (C)"
            data-testid="button-tool-razor"
            className="px-2 md:px-3 h-7 md:h-9"
          >
            <Scissors className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden md:inline ml-1">Razor</span>
          </Button>
          
          <Button 
            size="sm" 
            variant={tool === 'trim' ? 'default' : 'ghost'}
            onClick={() => setTool('trim')}
            title="Trim Tool (T)"
            data-testid="button-tool-trim"
            className="px-2 md:px-3 h-7 md:h-9"
          >
            <Maximize2 className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden md:inline ml-1">Trim</span>
          </Button>
          
          <Button 
            size="sm" 
            variant={tool === 'hand' ? 'default' : 'ghost'}
            onClick={() => setTool('hand')}
            title="Hand Tool (H)"
            data-testid="button-tool-hand"
            className="px-2 md:px-3 h-7 md:h-9"
          >
            <Hand className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden md:inline ml-1">Hand</span>
          </Button>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Project save/load controls - Responsive */}
          {onSaveProject && (
            <>
              {onProjectNameChange && (
                <Input
                  type="text"
                  placeholder="Project name..."
                  value={projectName}
                  onChange={(e) => onProjectNameChange(e.target.value)}
                  className="w-24 md:w-32 h-7 md:h-8 text-[10px] md:text-xs"
                  data-testid="input-project-name"
                />
              )}
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onSaveProject}
                disabled={isSavingProject || !projectName.trim()}
                title="Save Project (Ctrl+S)"
                data-testid="button-save-project"
                className="px-2 md:px-3 h-7 md:h-9 text-xs"
              >
                <Save className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                <span className="hidden sm:inline ml-1">{isSavingProject ? 'Saving...' : 'Save'}</span>
              </Button>
              
              {/* Indicador de guardado */}
              {lastSavedAt && (
                <div className="hidden md:flex items-center gap-1 px-2 text-[10px] text-muted-foreground">
                  {hasUnsavedChanges ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <span>No guardado</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>
                        {(() => {
                          const now = new Date();
                          const diff = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000);
                          if (diff < 60) return 'Guardado ahora';
                          if (diff < 3600) return `Guardado hace ${Math.floor(diff / 60)}m`;
                          return `Guardado hace ${Math.floor(diff / 3600)}h`;
                        })()}
                      </span>
                    </>
                  )}
                </div>
              )}
              
              {onLoadProject && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onLoadProject}
                  title="Load Project"
                  data-testid="button-load-project"
                  className="px-2 md:px-3 h-7 md:h-9 text-xs"
                >
                  <FolderOpen className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden sm:inline ml-1">Load</span>
                </Button>
              )}
              
              <Separator orientation="vertical" className="h-6 md:h-8 mx-1 md:mx-2" />
            </>
          )}
          
          {/* Zoom controls - Enhanced and Responsive */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setZoom(Math.max(0.1, zoom / 1.4))}
            title="Zoom Out (Shift + -)"
            data-testid="button-zoom-out"
            className="h-7 w-7 md:h-9 md:w-9"
          >
            <ZoomOut className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setZoom(Math.min(10, zoom * 1.4))}
            title="Zoom In (Shift + +)"
            data-testid="button-zoom-in"
            className="h-7 w-7 md:h-9 md:w-9"
          >
            <ZoomIn className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setZoom(1)}
            title="Reset Zoom (Shift + 0)"
            className="text-[10px] md:text-xs px-1 md:px-2 h-7 md:h-9 hidden sm:flex"
          >
            Reset
          </Button>
          
          <Badge variant="outline" className="text-[10px] md:text-xs font-mono px-1 md:px-2">
            {zoom.toFixed(1)}x
          </Badge>
          
          <Separator orientation="vertical" className="h-6 md:h-8 mx-1 md:mx-2" />
          
          {/* Undo/Redo - Responsive */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleUndo}
            disabled={history.past.length === 0}
            title="Undo (Ctrl+Z)"
            data-testid="button-undo"
            className="h-7 w-7 md:h-9 md:w-9"
          >
            <Undo className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={handleRedo}
            disabled={history.future.length === 0}
            title="Redo (Ctrl+Y)"
            data-testid="button-redo"
            className="h-7 w-7 md:h-9 md:w-9"
          >
            <Redo className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 md:h-8 mx-1 md:mx-2 hidden lg:block" />
          
          {/* Time display - Responsive */}
          <div className="text-[10px] md:text-sm font-medium bg-gray-800 px-1 md:px-2 py-0.5 md:py-1 rounded font-mono hidden md:flex" data-testid="text-timecode">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Main timeline area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Layer panel - Responsive */}
        <div className="w-32 min-w-32 md:w-40 md:min-w-40 border-r border-gray-700 bg-gray-800 overflow-hidden">
          <div className="bg-gray-900 p-2 border-b border-gray-700 text-xs font-semibold flex items-center justify-between">
            <span>Layers</span>
            <Badge variant="outline" className="text-[9px] bg-gray-800">
              {Object.keys(clipsByLayer).length}
            </Badge>
          </div>
          
          <div className="space-y-1 p-1 max-h-full overflow-y-auto">
            {Object.keys(clipsByLayer).length > 0 ? (
              Object.keys(clipsByLayer)
                .map(Number)
                .sort((a, b) => a - b)
                .map(layerId => {
                  const layerColor = getLayerColor(layerId);
                  const layerName = getLayerName(layerId);
                  const layerIcon = getLayerIcon(layerId);
                  
                  return (
                    <div
                      key={layerId}
                      className="flex items-center justify-between p-2 rounded text-xs"
                      style={{ 
                        backgroundColor: layerColor.bg,
                        color: layerColor.text
                      }}
                    >
                      <div className="flex items-center">
                        {layerIcon}
                        <span className="font-medium">{layerName}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] ml-1">
                        {clipsByLayer[layerId]?.length || 0}
                      </Badge>
                    </div>
                  );
                })
            ) : (
              <div className="text-xs text-gray-500 p-2 text-center">
                No clips
              </div>
            )}
          </div>
        </div>

        {/* Timeline scroll area */}
        <div className="flex-1 overflow-auto" ref={timelineRef}>
          <div 
            className={cn(
              "relative min-h-full",
              tool === 'hand' ? 'cursor-grab' : tool === 'razor' ? 'cursor-crosshair' : 'cursor-default',
              isPanning ? 'cursor-grabbing' : ''
            )}
            style={{ width: `${timeToPixels(duration)}px`, minWidth: '100%' }}
            onClick={handleTimelineClick}
            onMouseDown={handleTimelineMouseDown}
          >
            {/* Time rulers */}
            <div className="sticky top-0 h-12 bg-gray-800 border-b border-gray-700 z-20">
              {renderTimeMarkers()}
            </div>
            
            {/* Waveform */}
            {showWaveform && audioBuffer && (
              <div className="sticky top-12 h-20 bg-gray-900/50 border-b border-gray-700 overflow-hidden">
                <canvas ref={waveformRef} className="w-full h-full" />
              </div>
            )}
            
            {/* Clips by layer */}
            <div className="relative" style={{ minHeight: '300px' }}>
              {Object.keys(clipsByLayer)
                .map(Number)
                .sort((a, b) => a - b)
                .map((layerId, index) => (
                  <div 
                    key={layerId}
                    className="relative h-24 border-b border-gray-700"
                    style={{ top: `${index * 96}px` }}
                  >
                    {clipsByLayer[layerId]?.map(clip => {
                      const clipLeft = timeToPixels(clip.start);
                      const clipWidth = timeToPixels(clip.duration);
                      const isSelected = clip.id === selectedClip;
                      const layerColor = getLayerColor(clip.layer);
                      
                      return (
                        <div
                          key={clip.id}
                          className={cn(
                            "absolute h-20 rounded cursor-pointer transition-all overflow-hidden",
                            isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-gray-900" : "",
                            clip.locked ? "opacity-50 cursor-not-allowed" : ""
                          )}
                          style={{
                            left: `${clipLeft}px`,
                            width: `${clipWidth}px`,
                            backgroundColor: layerColor.bg,
                            top: '8px',
                            backgroundImage: clip.imageUrl || clip.thumbnail 
                              ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${clip.imageUrl || clip.thumbnail})`
                              : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}
                          onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'body')}
                          onTouchStart={(e) => handleTouchStart(e, clip.id, 'body')}
                          data-testid={`clip-${clip.id}`}
                        >
                          {/* Clip content */}
                          <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                            <div className="text-xs font-semibold truncate text-white drop-shadow-lg">
                              {clip.title}
                            </div>
                            {clip.imagePrompt && (
                              <div className="text-[10px] text-white/90 truncate drop-shadow">
                                {clip.imagePrompt}
                              </div>
                            )}
                            <div className="text-[9px] text-white/70 drop-shadow">
                              {formatTime(clip.duration)}
                            </div>
                          </div>
                          
                          {/* Action buttons for images */}
                          {(clip.imageUrl || clip.metadata?.isGeneratedImage) && (
                            <div className="absolute top-1 right-1 flex gap-1 opacity-80 hover:opacity-100 transition-opacity">
                              {onRegenerateImage && (
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7 bg-purple-600 hover:bg-purple-700 text-white shadow-lg border border-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRegenerateImage(clip.id);
                                  }}
                                  title="Regenerar Imagen"
                                  data-testid={`button-regenerate-${clip.id}`}
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {onGenerateVideo && (
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7 bg-blue-600 hover:bg-blue-700 text-white shadow-lg border border-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onGenerateVideo(clip.id);
                                  }}
                                  title="Generar Video"
                                  data-testid={`button-generate-video-${clip.id}`}
                                >
                                  <Video className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {/* Resize handles */}
                          {!clip.locked && tool === 'trim' && (
                            <>
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2 bg-white/30 cursor-ew-resize hover:bg-white/50"
                                onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'start')}
                                onTouchStart={(e) => handleTouchStart(e, clip.id, 'start')}
                              />
                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 bg-white/30 cursor-ew-resize hover:bg-white/50"
                                onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'end')}
                                onTouchStart={(e) => handleTouchStart(e, clip.id, 'end')}
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
            
            {/* Playhead */}
            {renderPlayhead()}
          </div>
        </div>
      </div>
      
      {/* Footer info - Responsive */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-2 border-t border-gray-700 text-[10px] md:text-xs bg-gray-800 gap-2">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <span className="flex items-center gap-1">Tool: <strong className="text-primary">{tool}</strong></span>
          <span className="flex items-center gap-1">Clips: <strong>{clips.length}</strong></span>
          {selectedClip && (
            <span className="flex items-center gap-1">Selected: <strong className="text-primary">Clip #{selectedClip}</strong></span>
          )}
          <span className="flex items-center gap-1 md:hidden">Zoom: <strong>{zoom.toFixed(1)}x</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 overflow-x-auto">
          <span className="whitespace-nowrap">Shortcuts: <strong className="text-gray-300">V</strong>=Select, <strong className="text-gray-300">C</strong>=Razor, <strong className="text-gray-300">T</strong>=Trim, <strong className="text-gray-300">H</strong>=Hand, <strong className="text-gray-300">Space</strong>=Play/Pause</span>
        </div>
      </div>
    </div>
  );
}
