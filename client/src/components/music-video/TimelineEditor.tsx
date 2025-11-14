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
  Maximize2, Save, FolderOpen, Guitar, Camera, Split,
  Rewind, FastForward, Gauge, Flag, Copy, ArrowLeftRight,
  FlipHorizontal, RotateCw, Zap, Square, Pencil, X, Magnet, Link2
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
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { ensureCompatibleClip } from '../timeline/TimelineClipUnified';
import { EffectsPanel, ClipEffects } from '../timeline-effects/effects-panel';
import { MusicianModal } from './MusicianModal';
import CameraAnglesModal from './CameraAnglesModal';
import { ImageEditorModal } from './ImageEditorModal.js';

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
  prompt?: string;
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
    musicianData?: any;
    cameraAngle?: string;
    sourceIndex?: number;
    isGeneratedImage?: boolean;
    lipsync?: {
      applied: boolean;
      videoUrl?: string;
      progress?: number;
      timestamp?: string;
    };
    effects?: {
      blur?: number;
      brightness?: number;
      opacity?: number;
      flip?: { horizontal: boolean; vertical: boolean };
      radius?: number;
      shadow?: {
        x: number;
        y: number;
        blur: number;
        color: string;
      };
      transform?: {
        scale: number;
        x: number;
        y: number;
        rotation: number;
      };
      playbackRate?: number;
      volume?: number;
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

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface TransitionConfig {
  type: 'fade' | 'dissolve' | 'slide' | 'wipe' | 'none';
  duration: number;
}

type ToolMode = 'select' | 'razor' | 'trim' | 'hand';
type HistoryState = { clips: TimelineClip[]; selectedIds: number[]; markers: TimelineMarker[] };

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
  const [selectedClips, setSelectedClips] = useState<Set<number>>(new Set());
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMusicianModal, setShowMusicianModal] = useState(false);
  const [musicianModalClip, setMusicianModalClip] = useState<TimelineClip | null>(null);
  const [showCameraAnglesModal, setShowCameraAnglesModal] = useState(false);
  const [cameraAnglesModalClip, setCameraAnglesModalClip] = useState<TimelineClip | null>(null);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
  const [imageEditorModalClip, setImageEditorModalClip] = useState<TimelineClip | null>(null);
  const [ghostClip, setGhostClip] = useState<{ id: number; position: number } | null>(null);
  const [snapLine, setSnapLine] = useState<number | null>(null);
  const [clipTransitions, setClipTransitions] = useState<Map<number, TransitionConfig>>(new Map());
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Notify parent when selection changes
  useEffect(() => {
    onSceneSelect?.(selectedClip);
    setShowEffectsPanel(selectedClip !== null);
  }, [selectedClip, onSceneSelect]);
  const [showWaveform, setShowWaveform] = useState<boolean>(true);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Multi-selección con rectángulo
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectionStartPoint, setSelectionStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [rippleEditEnabled, setRippleEditEnabled] = useState(false);
  
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
  
  // Enhanced snap candidates: beats, clips, playhead, markers, and grid
  const snapCandidates = useMemo(() => {
    if (!snapEnabled) return [];
    
    const candidates: number[] = [];
    
    // Add beat markers
    const beats = beatsData?.beats?.map(b => b.time) ?? [];
    candidates.push(...beats);
    
    // Add clip boundaries (start and end of all clips except the one being dragged)
    clips
      .filter(c => c.visible !== false && c.id !== draggingClip)
      .forEach(clip => {
        candidates.push(clip.start);
        candidates.push(clip.start + clip.duration);
      });
    
    // Add playhead position
    candidates.push(currentTime);
    
    // Add user markers
    markers.forEach(marker => {
      candidates.push(marker.time);
    });
    
    // Add timeline boundaries
    candidates.push(0, duration);
    
    return candidates;
  }, [snapEnabled, beatsData, clips, draggingClip, currentTime, markers, duration]);

  const snapTo = useCallback((t: number) => {
    if (!snapEnabled) return t;
    
    const step = zoom >= 1.4 ? 0.1 : zoom >= 0.8 ? 0.25 : 0.5;
    const grid = [...snapCandidates, Math.round(t / step) * step];
    const nearest = grid.reduce((a, b) => Math.abs(b - t) < Math.abs(a - t) ? b : a, t);
    
    // Visual feedback: show snap line when snapping
    const isSnapping = Math.abs(nearest - t) <= SNAP_TOLERANCE;
    if (isSnapping && nearest !== t) {
      setSnapLine(nearest);
    } else {
      setSnapLine(null);
    }
    
    return isSnapping ? nearest : t;
  }, [snapEnabled, snapCandidates, zoom]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // Haptic feedback helper for mobile
  const triggerHaptic = useCallback((pattern: number | number[] = 10) => {
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [isMobile]);

  // ===== History Management =====
  const pushHistory = useCallback(() => {
    const snapshot: HistoryState = {
      clips: structuredClone?.(clips) ?? clips.map(c => ({ ...c })),
      selectedIds: Array.from(selectedClips),
      markers: structuredClone?.(markers) ?? [...markers]
    };
    setHistory(prev => {
      const nextPast = [...prev.past, snapshot].slice(-HISTORY_LIMIT);
      return { past: nextPast, future: [] };
    });
  }, [clips, selectedClips, markers]);

  const handleUndo = useCallback(() => {
    if (history.past.length === 0) return;
    const newPast = [...history.past];
    const prev = newPast.pop()!;
    
    const currentState: HistoryState = {
      clips: structuredClone?.(clips) ?? clips.map(c => ({ ...c })),
      selectedIds: Array.from(selectedClips),
      markers: structuredClone?.(markers) ?? [...markers]
    };
    
    setHistory({ past: newPast, future: [currentState, ...history.future] });
    setSelectedClips(new Set(prev.selectedIds));
    setMarkers(prev.markers);
    
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
  }, [history, clips, selectedClips, markers, onClipUpdate, toast]);

  const handleRedo = useCallback(() => {
    if (history.future.length === 0) return;
    const newFuture = [...history.future];
    const next = newFuture.shift()!;
    
    const currentState: HistoryState = {
      clips: structuredClone?.(clips) ?? clips.map(c => ({ ...c })),
      selectedIds: Array.from(selectedClips),
      markers: structuredClone?.(markers) ?? [...markers]
    };
    
    setHistory({ past: [...history.past, currentState], future: newFuture });
    setSelectedClips(new Set(next.selectedIds));
    setMarkers(next.markers);
    
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
  }, [history, clips, selectedClips, markers, onClipUpdate, toast]);

  // ===== Effects Handler =====
  const handleEffectsChange = useCallback((clipId: number, effects: ClipEffects) => {
    if (!onClipUpdate) return;
    
    pushHistory();
    onClipUpdate(clipId, {
      metadata: {
        ...clips.find(c => c.id === clipId)?.metadata,
        effects
      }
    });
    
    toast({
      title: "Effects Updated",
      description: "Clip effects have been updated",
      variant: "default",
    });
  }, [onClipUpdate, clips, pushHistory, toast]);

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

  // ===== Playback Loop at 24fps =====
  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }
    
    const FPS = 24;
    const frameTime = 1000 / FPS; // ~41.67ms per frame
    let lastTime = performance.now();
    
    const loop = (currentTimestamp: number) => {
      if (!isPlaying) return;
      
      const deltaTime = currentTimestamp - lastTime;
      
      if (deltaTime >= frameTime) {
        const newTime = currentTime + (deltaTime / 1000);
        
        if (newTime >= duration) {
          onPause?.();
          onTimeUpdate?.(duration);
        } else {
          onTimeUpdate?.(newTime);
        }
        
        lastTime = currentTimestamp;
      }
      
      rafIdRef.current = requestAnimationFrame(loop);
    };
    
    rafIdRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, currentTime, duration, onTimeUpdate, onPause]);

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

  // ===== Professional Waveform Drawing (CapCut Style) =====
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || !audioBuffer || !showWaveform) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = timeToPixels(duration);
    const height = 80;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw stereo waveform (both channels if available)
    const channelCount = audioBuffer.numberOfChannels;
    const channelHeight = channelCount > 1 ? height / 2 : height;
    
    for (let channel = 0; channel < Math.min(channelCount, 2); channel++) {
      const data = audioBuffer.getChannelData(channel);
      const step = Math.ceil(data.length / width);
      const yOffset = channel * channelHeight;
      const amp = channelHeight / 2;
      const centerY = yOffset + amp;

      // Draw waveform with gradient
      const gradient = ctx.createLinearGradient(0, yOffset, 0, yOffset + channelHeight);
      gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
      gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
      gradient.addColorStop(1, 'rgba(249, 115, 22, 0.3)');
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
      ctx.lineWidth = 1;

      // Draw as path for smoother visualization
      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < step; j++) {
          const datum = data[(i * step) + j] || 0;
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        
        const barHeight = (max - min) * amp;
        const barY = centerY + (min * amp);
        
        // Draw filled bars
        ctx.fillRect(i, barY, 1, Math.max(1, barHeight));
      }

      // Draw center line
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Draw channel separator (if stereo)
      if (channel === 0 && channelCount > 1) {
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, channelHeight);
        ctx.lineTo(width, channelHeight);
        ctx.stroke();
      }
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

  const handleAddMusician = useCallback((clip: TimelineClip) => {
    setMusicianModalClip(clip);
    setShowMusicianModal(true);
  }, []);

  const handleMusicianCreated = useCallback((musicianData: any) => {
    if (musicianModalClip) {
      handleClipUpdate(musicianModalClip.id, {
        metadata: {
          ...musicianModalClip.metadata,
          musicianIntegrated: true,
          musicianData,
        },
      });
      toast({
        title: "Musician Added",
        description: `${musicianData.musicianType} added to timeline`,
      });
    }
  }, [musicianModalClip, handleClipUpdate, toast]);

  const handleOpenCameraAngles = useCallback((clip: TimelineClip) => {
    setCameraAnglesModalClip(clip);
    setShowCameraAnglesModal(true);
  }, []);

  const handleEditImage = useCallback((clip: TimelineClip) => {
    setImageEditorModalClip(clip);
    setShowImageEditorModal(true);
  }, []);

  const handleImageEdited = useCallback((newImageUrl: string, newPrompt: string) => {
    if (imageEditorModalClip) {
      handleClipUpdate(imageEditorModalClip.id, {
        imageUrl: newImageUrl,
        imagePrompt: newPrompt,
        metadata: {
          ...imageEditorModalClip.metadata,
          isGeneratedImage: true
        }
      });
      toast({
        title: "Image edited successfully",
        description: "Your image has been updated with Nano Banana AI",
      });
    }
    setShowImageEditorModal(false);
    setImageEditorModalClip(null);
  }, [imageEditorModalClip, handleClipUpdate, toast]);

  const handleCameraAngleSelected = useCallback((imageUrl: string, angleName: string) => {
    if (cameraAnglesModalClip) {
      handleClipUpdate(cameraAnglesModalClip.id, {
        imageUrl,
        thumbnail: imageUrl,
        metadata: {
          ...cameraAnglesModalClip.metadata,
          cameraAngle: angleName,
        },
      });
    }
  }, [cameraAnglesModalClip, handleClipUpdate]);

  // ===== Advanced Timeline Tools =====
  
  // Split clip at playhead position
  const handleSplitAtPlayhead = useCallback(() => {
    const clipsAtPlayhead = clips.filter(clip => 
      currentTime > clip.start && currentTime < clip.start + clip.duration
    );
    
    if (clipsAtPlayhead.length === 0) {
      toast({
        title: "No clips to split",
        description: "Move playhead over a clip to split",
        variant: "destructive",
      });
      return;
    }
    
    pushHistory();
    clipsAtPlayhead.forEach(clip => {
      if (onSplitClip) {
        onSplitClip(clip.id, currentTime);
      }
    });
    
    toast({
      title: "Clips split",
      description: `Split ${clipsAtPlayhead.length} clip(s) at playhead`,
    });
  }, [clips, currentTime, onSplitClip, pushHistory, toast]);

  // Delete all clips left of playhead
  const handleDeleteLeft = useCallback(() => {
    const clipsToDelete = clips.filter(clip => clip.start + clip.duration <= currentTime);
    
    if (clipsToDelete.length === 0) {
      toast({
        title: "No clips to delete",
        description: "No clips found before playhead",
        variant: "destructive",
      });
      return;
    }
    
    pushHistory();
    clipsToDelete.forEach(clip => {
      handleClipUpdate(clip.id, { visible: false });
    });
    
    toast({
      title: "Deleted left",
      description: `Removed ${clipsToDelete.length} clip(s)`,
    });
  }, [clips, currentTime, handleClipUpdate, pushHistory, toast]);

  // Delete all clips right of playhead
  const handleDeleteRight = useCallback(() => {
    const clipsToDelete = clips.filter(clip => clip.start >= currentTime);
    
    if (clipsToDelete.length === 0) {
      toast({
        title: "No clips to delete",
        description: "No clips found after playhead",
        variant: "destructive",
      });
      return;
    }
    
    pushHistory();
    clipsToDelete.forEach(clip => {
      handleClipUpdate(clip.id, { visible: false });
    });
    
    toast({
      title: "Deleted right",
      description: `Removed ${clipsToDelete.length} clip(s)`,
    });
  }, [clips, currentTime, handleClipUpdate, pushHistory, toast]);

  // Add marker at playhead
  const handleAddMarker = useCallback(() => {
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      time: currentTime,
      label: `Marker ${markers.length + 1}`,
      color: '#f97316',
    };
    
    pushHistory();
    setMarkers(prev => [...prev, newMarker]);
    
    toast({
      title: "Marker added",
      description: `Added at ${formatTime(currentTime)}`,
    });
  }, [currentTime, markers.length, pushHistory, toast]);

  // Frame navigation (24fps standard)
  const FRAME_DURATION = 1 / 24; // ~0.0417 seconds per frame

  const handlePreviousFrame = useCallback(() => {
    const newTime = Math.max(0, currentTime - FRAME_DURATION);
    onTimeUpdate(newTime);
  }, [currentTime, onTimeUpdate]);

  const handleNextFrame = useCallback(() => {
    const newTime = Math.min(duration, currentTime + FRAME_DURATION);
    onTimeUpdate(newTime);
  }, [currentTime, duration, onTimeUpdate]);

  // Clip navigation
  const handlePreviousClip = useCallback(() => {
    const sortedClips = [...clips]
      .filter(c => c.visible !== false)
      .sort((a, b) => a.start - b.start);
    
    // Find the clip whose start is just before current time
    const previousClip = sortedClips
      .reverse()
      .find(clip => clip.start < currentTime - 0.01);
    
    if (previousClip) {
      onTimeUpdate(previousClip.start);
    } else {
      onTimeUpdate(0);
    }
  }, [clips, currentTime, onTimeUpdate]);

  const handleNextClip = useCallback(() => {
    const sortedClips = [...clips]
      .filter(c => c.visible !== false)
      .sort((a, b) => a.start - b.start);
    
    // Find the first clip that starts after current time
    const nextClip = sortedClips.find(clip => clip.start > currentTime + 0.01);
    
    if (nextClip) {
      onTimeUpdate(nextClip.start);
    } else if (sortedClips.length > 0) {
      const lastClip = sortedClips[sortedClips.length - 1];
      onTimeUpdate(lastClip.start + lastClip.duration);
    }
  }, [clips, currentTime, onTimeUpdate]);

  // Handle multi-select with Shift/Ctrl
  const handleMultiSelect = useCallback((clipId: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift: range select
      if (selectedClip !== null) {
        const startIdx = clips.findIndex(c => c.id === selectedClip);
        const endIdx = clips.findIndex(c => c.id === clipId);
        const [min, max] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
        const rangeIds = clips.slice(min, max + 1).map(c => c.id);
        setSelectedClips(new Set(rangeIds));
      } else {
        setSelectedClips(new Set([clipId]));
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd: toggle selection
      setSelectedClips(prev => {
        const next = new Set(prev);
        if (next.has(clipId)) {
          next.delete(clipId);
        } else {
          next.add(clipId);
        }
        return next;
      });
    } else {
      // Normal click: single select
      setSelectedClip(clipId);
      setSelectedClips(new Set([clipId]));
    }
  }, [clips, selectedClip]);

  // Ripple delete: delete clip and close gap
  const handleRippleDelete = useCallback((clipId: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    pushHistory();
    
    // Delete the clip
    handleClipUpdate(clipId, { visible: false });
    
    // Move all clips after this one to the left
    const clipsToShift = clips.filter(c => 
      c.layer === clip.layer && c.start > clip.start
    );
    
    clipsToShift.forEach(c => {
      handleClipUpdate(c.id, { start: c.start - clip.duration });
    });
    
    toast({
      title: "Ripple delete",
      description: `Deleted clip and closed gap`,
    });
  }, [clips, handleClipUpdate, pushHistory, toast]);

  // Change playback speed of clip
  const handleSpeedChange = useCallback((clipId: number, speed: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    pushHistory();
    handleClipUpdate(clipId, {
      duration: clip.duration * (1 / speed),
      metadata: {
        ...clip.metadata,
        effects: {
          ...clip.metadata?.effects,
          playbackRate: speed,
        },
      },
    });
    
    toast({
      title: "Speed changed",
      description: `Set to ${speed}x speed`,
    });
  }, [clips, handleClipUpdate, pushHistory, toast]);

  // Freeze frame at current position
  const handleFreezeFrame = useCallback((clipId: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    toast({
      title: "Freeze frame",
      description: "Feature coming soon",
      variant: "default",
    });
  }, [clips, toast]);

  // Reverse clip playback
  const handleReverseClip = useCallback((clipId: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    pushHistory();
    const isReversed = clip.metadata?.effects?.playbackRate === -1;
    
    handleClipUpdate(clipId, {
      metadata: {
        ...clip.metadata,
        effects: {
          ...clip.metadata?.effects,
          playbackRate: isReversed ? 1 : -1,
        },
      },
    });
    
    toast({
      title: isReversed ? "Normal playback" : "Reversed",
      description: isReversed ? "Clip playing forward" : "Clip playing backward",
    });
  }, [clips, handleClipUpdate, pushHistory, toast]);

  const handleClipMouseDown = useCallback((e: React.MouseEvent, clipId: number, handle?: 'start' | 'end' | 'body') => {
    if (tool === 'hand') return;
    
    e.stopPropagation();
    e.preventDefault(); // Prevenir selección de texto
    
    setSelectedClip(clipId);
    triggerHaptic(10); // Haptic feedback on selection
    
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
          triggerHaptic([10, 20, 10]); // Double haptic for split action
          
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
    
    // MEJORA: Permitir resize en modo Select cuando se arrastra desde las manijas (estilo CapCut)
    if (tool === 'select' && (handle === 'start' || handle === 'end')) {
      pushHistory();
      setResizingSide(handle);
      setDragStartX(e.clientX);
      setClipStartPosition(clip.start);
      document.body.style.cursor = 'ew-resize';
      triggerHaptic(5);
      return;
    }
    
    // Select tool: Mover el clip cuando se arrastra el cuerpo
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
      triggerHaptic(5); // Light haptic for trim
    }
  }, [tool, clips, pixelsToTime, pushHistory, onSplitClip, toast, timelineRef, triggerHaptic]);

  // Mouse/Touch move handler for drag/resize
  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingClip && !resizingSide && !isPanning && !selectionStartPoint) return;
    
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
    if (clientX === undefined) return;
    
    // Handle selection rectangle update
    if (selectionStartPoint && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY !== undefined ? clientY - rect.top : selectionStartPoint.y;
      
      const x = Math.min(selectionStartPoint.x, currentX);
      const y = Math.min(selectionStartPoint.y, currentY);
      const width = Math.abs(currentX - selectionStartPoint.x);
      const height = Math.abs(currentY - selectionStartPoint.y);
      
      setSelectionRect({ x, y, width, height });
      return;
    }
    
    // Handle panning if active
    if (isPanning && timelineRef.current) {
      const deltaX = clientX - panStartX;
      timelineRef.current.scrollLeft = panStartScrollLeft - deltaX;
      return;
    }
    
    const deltaX = clientX - dragStartX;
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
        
        // RIPPLE EDIT: Mover clips siguientes si está activo
        if (rippleEditEnabled) {
          const deltaInDuration = newDuration - clip.duration;
          const clipsToRipple = clips.filter(c => 
            c.layer === clip.layer && 
            c.id !== clip.id && 
            c.start >= clip.start + clip.duration // Clips que empiezan después del fin del clip actual
          );
          
          clipsToRipple.forEach(rippleClip => {
            handleClipUpdate(rippleClip.id, { start: rippleClip.start + deltaInDuration });
          });
        }
      }
    }
  }, [draggingClip, resizingSide, isPanning, selectionStartPoint, dragStartX, clipStartPosition, selectedClip, clips, pixelsToTime, snapTo, duration, handleClipUpdate, panStartX, panStartScrollLeft, rippleEditEnabled]);

  const handleMouseUp = useCallback(() => {
    if (draggingClip || resizingSide) {
      triggerHaptic(5); // Light haptic on release
    }
    
    // Finalizar selección por rectángulo
    if (selectionRect && selectionStartPoint && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft || 0;
      
      // Convertir coordenadas del rectángulo a tiempo
      const rectStartTime = pixelsToTime(selectionRect.x + scrollLeft);
      const rectEndTime = pixelsToTime(selectionRect.x + selectionRect.width + scrollLeft);
      
      // Seleccionar todos los clips que intersecten con el rectángulo
      const selectedIds = new Set<number>();
      clips.forEach(clip => {
        if (clip.visible === false) return;
        
        const clipStartX = timeToPixels(clip.start);
        const clipEndX = timeToPixels(clip.start + clip.duration);
        
        // Verificar intersección horizontal
        const intersectsHorizontally = 
          clipStartX < selectionRect.x + selectionRect.width + scrollLeft &&
          clipEndX > selectionRect.x + scrollLeft;
        
        if (intersectsHorizontally) {
          selectedIds.add(clip.id);
        }
      });
      
      setSelectedClips(selectedIds);
      if (selectedIds.size === 1) {
        setSelectedClip([...selectedIds][0]);
      } else if (selectedIds.size > 1) {
        setSelectedClip([...selectedIds][0]); // Seleccionar el primero como principal
      }
      
      setSelectionRect(null);
      setSelectionStartPoint(null);
    }
    
    setDraggingClip(null);
    setResizingSide(null);
    setIsPanning(false);
    document.body.style.cursor = '';
  }, [draggingClip, resizingSide, triggerHaptic, selectionRect, selectionStartPoint, clips, pixelsToTime, timeToPixels]);

  // Hand tool panning handlers (Mouse + Touch)
  const handleTimelineMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Hand tool panning
    if (tool === 'hand') {
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      
      setIsPanning(true);
      setPanStartX(clientX);
      setPanStartScrollLeft(timelineRef.current?.scrollLeft || 0);
      document.body.style.cursor = 'grabbing';
      triggerHaptic(5); // Light haptic for pan start
      return;
    }
    
    // Rectángulo de selección (solo con Select tool y en área vacía)
    if (tool === 'select' && (e.target as HTMLElement).classList.contains('timeline-background')) {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      setSelectionStartPoint({ x, y });
      setSelectionRect({ x, y, width: 0, height: 0 });
      document.body.style.cursor = 'crosshair';
    }
  }, [tool, triggerHaptic]);

  // Setup/cleanup mouse and touch event listeners
  useEffect(() => {
    if (draggingClip || resizingSide || isPanning || selectionStartPoint) {
      // Add both mouse and touch event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleMouseMove as any, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
      document.addEventListener('touchcancel', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchmove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleMouseUp);
        document.removeEventListener('touchcancel', handleMouseUp);
      };
    }
  }, [draggingClip, resizingSide, isPanning, selectionStartPoint, handleMouseMove, handleMouseUp]);

  // ===== Touch Support for Mobile =====
  const handleClipTouchStart = useCallback((e: React.TouchEvent, clipId: number, handle?: 'start' | 'end' | 'body') => {
    if (tool === 'hand' || e.touches.length !== 1) return;
    
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    
    // Convert touch event to mouse event format for handleClipMouseDown
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      stopPropagation: () => e.stopPropagation(),
      preventDefault: () => e.preventDefault(),
    } as React.MouseEvent;
    
    handleClipMouseDown(mouseEvent, clipId, handle);
  }, [tool, handleClipMouseDown]);

  // Get cursor style based on current tool and state
  const getClipCursor = useCallback(() => {
    if (tool === 'hand') return '';
    if (tool === 'razor') return 'crosshair';
    if (tool === 'trim') return 'ew-resize';
    if (tool === 'select') return draggingClip ? 'grabbing' : 'grab';
    return 'default';
  }, [tool, draggingClip]);

  // Get tool display name with keyboard shortcut
  const getToolLabel = useCallback(() => {
    const labels: Record<ToolMode, string> = {
      'select': 'Select (V)',
      'razor': 'Razor (C)',
      'trim': 'Trim (T)',
      'hand': 'Hand (H)'
    };
    return labels[tool];
  }, [tool]);

  // ===== Keyboard Shortcuts (Professional Video Editor Style) =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
      
      // Playback Controls
      if (e.code === 'Space') {
        e.preventDefault();
        isPlaying ? onPause() : onPlay();
      } else if (e.key.toLowerCase() === 'j') {
        // J: Rewind (professional editor standard)
        e.preventDefault();
        onTimeUpdate(Math.max(0, currentTime - 1));
      } else if (e.key.toLowerCase() === 'k') {
        // K: Pause (professional editor standard)
        e.preventDefault();
        onPause();
      } else if (e.key.toLowerCase() === 'l') {
        // L: Forward (professional editor standard)
        e.preventDefault();
        onTimeUpdate(Math.min(duration, currentTime + 1));
      }
      
      // Tool Selection
      else if (e.key.toLowerCase() === 'v') {
        setTool('select');
      } else if (e.key.toLowerCase() === 'c') {
        setTool('razor');
      } else if (e.key.toLowerCase() === 'h') {
        setTool('hand');
      }
      
      // Editing Tools
      else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSplitAtPlayhead();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleAddMarker();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (e.shiftKey) {
          handleDeleteLeft();
        } else if (e.ctrlKey || e.metaKey) {
          handleDeleteRight();
        } else if (selectedClip !== null) {
          pushHistory();
          handleClipUpdate(selectedClip, { visible: false });
        }
      }
      
      // History Controls
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      
      // Zoom Controls
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(4, z + 0.25));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(z => Math.max(0.25, z - 0.25));
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setZoom(1);
      }
      
      // Arrow Key Navigation
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Left: Jump to previous clip
          handlePreviousClip();
        } else {
          // Left: Previous frame
          handlePreviousFrame();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Right: Jump to next clip
          handleNextClip();
        } else {
          // Right: Next frame
          handleNextFrame();
        }
      }
    };
    
    containerRef.current?.addEventListener('keydown', handleKeyDown);
    return () => {
      containerRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isPlaying, onPlay, onPause, currentTime, duration, onTimeUpdate,
    handleUndo, handleRedo, handleSplitAtPlayhead, handleAddMarker,
    handleDeleteLeft, handleDeleteRight, selectedClip, pushHistory, handleClipUpdate,
    handlePreviousFrame, handleNextFrame, handlePreviousClip, handleNextClip
  ]);

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
          className="absolute"
          style={{ left: `${position}px` }}
        >
          {/* Tick mark */}
          <div 
            className={cn(
              "border-l",
              isMajor ? "border-gray-400 h-4" : 
              isHalfSecond ? "border-gray-600 h-3" : 
              "border-gray-700 h-2"
            )}
            style={{ width: '1px' }}
          />
          
          {/* Time label for major ticks */}
          {isMajor && (
            <div className="absolute -top-5 -left-4 text-[11px] text-gray-300 font-mono font-medium whitespace-nowrap bg-gray-900/80 px-1 rounded">
              {formatTime(i)}
            </div>
          )}
        </div>
      );
    }
    
    return markers;
  }, [duration, zoom, timeToPixels]);

  // ===== Render Playhead (Professional CapCut Style) =====
  const renderPlayhead = useCallback(() => {
    return (
      <div 
        className="absolute top-0 h-full z-30 pointer-events-none"
        style={{ 
          left: `${timeToPixels(currentTime)}px`,
          transition: isPlaying ? 'none' : 'left 0.1s ease',
        }}
      >
        {/* Playhead Handle - Triangle Top */}
        <div className="absolute -left-[6px] -top-[1px] flex flex-col items-center">
          {/* Triangle */}
          <div 
            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-orange-500"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
          />
          {/* Time Display */}
          <div className="text-[10px] font-mono font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap -mt-0.5">
            {formatTime(currentTime)}
          </div>
        </div>
        
        {/* Vertical Line */}
        <div 
          className="absolute top-0 w-0.5 h-full bg-orange-500"
          style={{ 
            left: '-1px',
            boxShadow: '0 0 8px rgba(249, 115, 22, 0.6), 0 0 4px rgba(249, 115, 22, 0.4)'
          }}
        />
        
        {/* Bottom Handle */}
        <div className="absolute -left-[4px] bottom-0 w-2 h-3 bg-orange-500 rounded-t shadow-md" />
      </div>
    );
  }, [currentTime, isPlaying, timeToPixels]);

  // ===== Render User Markers =====
  const renderUserMarkers = useCallback(() => {
    return markers.map(marker => (
      <div
        key={marker.id}
        className="absolute top-0 h-full z-20 cursor-pointer group"
        style={{ left: `${timeToPixels(marker.time)}px` }}
        onClick={() => onTimeUpdate(marker.time)}
      >
        <div className="absolute -left-1 top-0 w-0.5 h-full opacity-70 group-hover:opacity-100 transition-opacity"
             style={{ backgroundColor: marker.color }} />
        <div className="absolute -left-3 -top-2">
          <Flag 
            className="w-6 h-6 drop-shadow-md group-hover:scale-110 transition-transform"
            style={{ color: marker.color, fill: marker.color }}
          />
        </div>
        <div className="absolute -left-10 top-6 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {marker.label}
          <div className="text-[10px] text-gray-400">{formatTime(marker.time)}</div>
        </div>
      </div>
    ));
  }, [markers, timeToPixels, onTimeUpdate]);

  // ===== Format Time Utility =====
  // Format time as professional timecode (HH:MM:SS:FF)
  const formatTimecode = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 24); // 24fps
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

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

  // ===== Apply Visual Effects to Clip =====
  const getClipEffectStyles = (clip: TimelineClip): React.CSSProperties => {
    const effects = clip.metadata?.effects;
    if (!effects) return {};

    const styles: React.CSSProperties = {};
    const filters: string[] = [];
    const transforms: string[] = [];

    // Filter effects
    if (effects.blur && effects.blur > 0) {
      filters.push(`blur(${effects.blur / 10}px)`);
    }
    if (effects.brightness !== undefined && effects.brightness !== 50) {
      const brightnessPercent = (effects.brightness / 50) * 100;
      filters.push(`brightness(${brightnessPercent}%)`);
    }

    // Opacity
    if (effects.opacity !== undefined && effects.opacity !== 100) {
      styles.opacity = effects.opacity / 100;
    }

    // Flip transform
    if (effects.flip) {
      const scaleX = effects.flip.horizontal ? -1 : 1;
      const scaleY = effects.flip.vertical ? -1 : 1;
      if (scaleX !== 1 || scaleY !== 1) {
        transforms.push(`scale(${scaleX}, ${scaleY})`);
      }
    }

    // Custom transform (scale, position, rotation)
    if (effects.transform) {
      const t = effects.transform;
      if (t.scale !== undefined && t.scale !== 1) {
        transforms.push(`scale(${t.scale})`);
      }
      if (t.x !== undefined && t.x !== 0) {
        transforms.push(`translateX(${t.x}px)`);
      }
      if (t.y !== undefined && t.y !== 0) {
        transforms.push(`translateY(${t.y}px)`);
      }
      if (t.rotation !== undefined && t.rotation !== 0) {
        transforms.push(`rotate(${t.rotation}deg)`);
      }
    }

    // Border radius
    if (effects.radius && effects.radius > 0) {
      styles.borderRadius = `${effects.radius}px`;
    }

    // Box shadow
    if (effects.shadow) {
      const s = effects.shadow;
      styles.boxShadow = `${s.x}px ${s.y}px ${s.blur}px ${s.color}`;
    }

    // Apply combined filter
    if (filters.length > 0) {
      styles.filter = filters.join(' ');
    }

    // Apply combined transform
    if (transforms.length > 0) {
      styles.transform = transforms.join(' ');
    }

    return styles;
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

      {/* Toolbar - Reorganized into logical blocks like CapCut */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 flex-wrap gap-1 md:gap-2 bg-gray-900">
        <div className="flex items-center gap-1">
          {/* BLOCK 1: Transport Controls - Professional Layout */}
          <div className="flex items-center gap-0.5 md:gap-1 bg-gray-800/50 rounded-md p-1">
            {/* Jump to start */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onTimeUpdate(0)}
              title="Jump to Start"
              className="h-7 w-7 md:h-8 md:w-8"
              data-testid="button-jump-start"
            >
              <Rewind className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Previous clip */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handlePreviousClip}
              title="Previous Clip (Shift+←)"
              className="h-7 w-7 md:h-8 md:w-8"
              data-testid="button-previous-clip"
            >
              <SkipBack className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Previous frame */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handlePreviousFrame}
              title="Previous Frame (←)"
              className="h-7 w-7 md:h-8 md:w-8"
              data-testid="button-previous-frame"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            {/* Play/Pause - larger and highlighted */}
            <Button 
              size="icon" 
              variant="default" 
              onClick={isPlaying ? onPause : onPlay}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              data-testid="button-playback-toggle"
              className="h-8 w-8 md:h-10 md:w-10 bg-orange-500 hover:bg-orange-600"
            >
              {isPlaying ? <Pause className="h-4 w-4 md:h-5 md:w-5" /> : <Play className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>

            {/* Next frame */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleNextFrame}
              title="Next Frame (→)"
              className="h-7 w-7 md:h-8 md:w-8"
              data-testid="button-next-frame"
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Next clip */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={handleNextClip}
              title="Next Clip (Shift+→)"
              className="h-7 w-7 md:h-8 md:w-8"
              data-testid="button-next-clip"
            >
              <SkipForward className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Jump to end */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => onTimeUpdate(duration)}
              title="Jump to End"
              className="h-7 w-7 md:h-8 md:w-8"
              data-testid="button-jump-end"
            >
              <FastForward className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>

          {/* Timecode Display */}
          <div className="flex items-center gap-1 bg-gray-800/70 rounded-md px-2 md:px-3 h-7 md:h-8">
            <span className="text-[10px] md:text-xs font-mono text-orange-400 font-semibold tracking-wider">
              {formatTimecode(currentTime)}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500">/</span>
            <span className="text-[10px] md:text-xs font-mono text-gray-400">
              {formatTimecode(duration)}
            </span>
          </div>
          
          <Separator orientation="vertical" className="h-6 md:h-8" />
          
          {/* BLOCK 2: Tool Selection */}
          <div className="flex items-center gap-0.5 md:gap-1 bg-gray-800/50 rounded-md p-1">
            <Button 
              size="icon" 
              variant={tool === 'select' ? 'default' : 'ghost'}
              onClick={() => setTool('select')}
              title="Select Tool (V)"
              data-testid="button-tool-select"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <Move className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button 
              size="icon" 
              variant={tool === 'trim' ? 'default' : 'ghost'}
              onClick={() => setTool('trim')}
              title="Trim/Resize Tool (T) - Estirar clips"
              data-testid="button-tool-trim"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <ArrowLeftRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button 
              size="icon" 
              variant={tool === 'razor' ? 'default' : 'ghost'}
              onClick={() => setTool('razor')}
              title="Razor Tool (C)"
              data-testid="button-tool-razor"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <Scissors className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button 
              size="icon" 
              variant={tool === 'hand' ? 'default' : 'ghost'}
              onClick={() => setTool('hand')}
              title="Hand Tool (H)"
              data-testid="button-tool-hand"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <Hand className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6 md:h-8" />
          
          {/* BLOCK 3: Advanced Editing Tools */}
          <div className="flex items-center gap-0.5 md:gap-1 bg-gray-800/50 rounded-md p-1">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={handleSplitAtPlayhead}
              title="Split at Playhead (S)"
              data-testid="button-split-playhead"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <Split className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button 
              size="icon" 
              variant="ghost"
              onClick={handleDeleteLeft}
              title="Delete Left (Shift+Del)"
              data-testid="button-delete-left"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button 
              size="icon" 
              variant="ghost"
              onClick={handleDeleteRight}
              title="Delete Right (Ctrl+Del)"
              data-testid="button-delete-right"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button 
              size="icon" 
              variant="ghost"
              onClick={handleAddMarker}
              title="Add Marker (M)"
              data-testid="button-add-marker"
              className="h-7 w-7 md:h-9 md:w-9"
            >
              <Flag className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            {/* Snap Toggle */}
            <Button 
              size="icon" 
              variant={snapEnabled ? 'default' : 'ghost'}
              onClick={() => setSnapEnabled(!snapEnabled)}
              title={snapEnabled ? "Snap Enabled (clips, playhead, markers)" : "Snap Disabled"}
              data-testid="button-toggle-snap"
              className={cn(
                "h-7 w-7 md:h-9 md:w-9",
                snapEnabled && "bg-orange-500 hover:bg-orange-600"
              )}
            >
              <Magnet className="h-3 w-3 md:h-4 md:w-4" />
            </Button>

            {/* Ripple Edit Toggle */}
            <Button 
              size="icon" 
              variant={rippleEditEnabled ? 'default' : 'ghost'}
              onClick={() => setRippleEditEnabled(!rippleEditEnabled)}
              title={rippleEditEnabled ? "Ripple Edit ON - Clips move automatically" : "Ripple Edit OFF"}
              data-testid="button-toggle-ripple"
              className={cn(
                "h-7 w-7 md:h-9 md:w-9",
                rippleEditEnabled && "bg-blue-500 hover:bg-blue-600"
              )}
            >
              <Link2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
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

          {/* Waveform Toggle */}
          {audioBuffer && (
            <>
              <Separator orientation="vertical" className="h-6 md:h-8 mx-1 md:mx-2" />
              
              <Button 
                size="icon" 
                variant={showWaveform ? 'default' : 'ghost'}
                onClick={() => setShowWaveform(!showWaveform)}
                title={showWaveform ? "Hide Waveform" : "Show Waveform"}
                data-testid="button-toggle-waveform"
                className={cn(
                  "h-7 w-7 md:h-9 md:w-9",
                  showWaveform && "bg-orange-500 hover:bg-orange-600"
                )}
              >
                <Music className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </>
          )}
          
          <Separator orientation="vertical" className="h-6 md:h-8 mx-1 md:mx-2 hidden lg:block" />
          
          {/* Time display - Responsive */}
          <div className="text-[10px] md:text-sm font-medium bg-gray-800 px-1 md:px-2 py-0.5 md:py-1 rounded font-mono hidden md:flex" data-testid="text-timecode">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Minimap Timeline - Vista general del proyecto */}
      <div className="border-b border-gray-700 bg-gray-850 px-4 py-2">
        <div className="flex items-center gap-2 mb-1">
          <Maximize2 className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] text-gray-400 font-medium">MINIMAP</span>
        </div>
        <div 
          className="relative h-12 bg-gray-900 rounded border border-gray-700 cursor-pointer overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickRatio = clickX / rect.width;
            const newTime = clickRatio * duration;
            onTimeUpdate(newTime);
            
            // Scroll timeline to show clicked position
            if (timelineRef.current) {
              const timelineScrollWidth = timelineRef.current.scrollWidth;
              const timelineVisibleWidth = timelineRef.current.clientWidth;
              const targetScroll = (clickRatio * timelineScrollWidth) - (timelineVisibleWidth / 2);
              timelineRef.current.scrollLeft = Math.max(0, Math.min(targetScroll, timelineScrollWidth - timelineVisibleWidth));
            }
          }}
        >
          {/* Clips en miniatura */}
          {clips.filter(c => c.visible !== false).map(clip => {
            const left = (clip.start / duration) * 100;
            const width = (clip.duration / duration) * 100;
            const layerColors = {
              0: 'bg-rose-600', // Audio
              1: 'bg-blue-600', // Video
              2: 'bg-green-600', // Text
              3: 'bg-purple-600', // Effects
              7: 'bg-orange-600', // AI Generated
            };
            const color = layerColors[clip.layer as keyof typeof layerColors] || 'bg-gray-600';
            
            return (
              <div
                key={clip.id}
                className={cn(
                  "absolute h-2 rounded-sm opacity-70",
                  color
                )}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: `${(clip.layer / 8) * 100}%`
                }}
                title={clip.title}
              />
            );
          })}
          
          {/* Viewport indicator - Muestra qué parte del timeline estás viendo */}
          {timelineRef.current && (() => {
            const scrollLeft = timelineRef.current.scrollLeft;
            const scrollWidth = timelineRef.current.scrollWidth;
            const clientWidth = timelineRef.current.clientWidth;
            
            const viewportStart = (scrollLeft / scrollWidth) * 100;
            const viewportWidth = (clientWidth / scrollWidth) * 100;
            
            return (
              <div
                className="absolute top-0 bottom-0 border-2 border-yellow-400 bg-yellow-400/10 pointer-events-none rounded"
                style={{
                  left: `${viewportStart}%`,
                  width: `${viewportWidth}%`
                }}
              />
            );
          })()}
          
          {/* Playhead en minimap */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-orange-500 pointer-events-none"
            style={{
              left: `${(currentTime / duration) * 100}%`
            }}
          />
          
          {/* Marcadores en minimap */}
          {markers.map(marker => (
            <div
              key={marker.id}
              className="absolute top-0 bottom-0 w-px bg-blue-400/60 pointer-events-none"
              style={{
                left: `${(marker.time / duration) * 100}%`
              }}
              title={marker.name}
            />
          ))}
        </div>
      </div>

      {/* Main timeline area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Effects Panel - Responsive Side/Bottom Panel */}
        {showEffectsPanel && selectedClip !== null && !isMobile && (
          <div className="order-last w-full lg:w-80 lg:min-w-80 border-l border-gray-700 bg-gray-800 overflow-y-auto">
            <EffectsPanel
              clip={clips.find(c => c.id === selectedClip)!}
              onChange={handleEffectsChange}
              className="h-full"
            />
          </div>
        )}
        
        {/* Layer panel - Enhanced Width */}
        <div className="w-40 min-w-40 md:w-48 md:min-w-48 border-r-2 border-gray-700 bg-gradient-to-b from-gray-800 to-gray-850 overflow-hidden">
          <div className="bg-gray-900 p-3 border-b-2 border-gray-700 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Layers</span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-gray-800 border-gray-600">
              {Object.keys(clipsByLayer).length}
            </Badge>
          </div>
          
          <div className="space-y-1.5 p-2 max-h-full overflow-y-auto">
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
                      className="flex items-center justify-between p-2.5 rounded-lg text-sm shadow-sm hover:shadow-md transition-all cursor-pointer border"
                      style={{ 
                        backgroundColor: layerColor.bg,
                        color: layerColor.text,
                        borderColor: `${layerColor.bg}40`
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-base">
                          {layerIcon}
                        </div>
                        <span className="font-semibold">{layerName}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 font-bold bg-black/20 border-white/20">
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
              "relative min-h-full timeline-background",
              tool === 'hand' ? 'cursor-grab' : tool === 'razor' ? 'cursor-crosshair' : 'cursor-default',
              isPanning ? 'cursor-grabbing' : ''
            )}
            style={{ 
              width: `${timeToPixels(duration)}px`, 
              minWidth: '100%',
              touchAction: tool === 'hand' ? 'none' : 'auto' // Prevent default gestures for hand tool
            }}
            onClick={handleTimelineClick}
            onMouseDown={handleTimelineMouseDown}
            onTouchStart={handleTimelineMouseDown}
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
              {clips.length === 0 ? (
                /* Empty State - Helpful message when no clips */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-4 p-8 max-w-md">
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
                        <Video className="w-10 h-10 text-gray-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        No clips in timeline
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Start creating your music video by generating scenes with AI or importing media files.
                      </p>
                      <div className="text-xs text-gray-600 space-y-2 text-left bg-gray-800/50 rounded-lg p-4">
                        <p className="font-semibold text-gray-400">Quick Tips:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Generate a script using AI to create timeline clips</li>
                          <li>Import audio and sync it with your scenes</li>
                          <li>Use the toolbar tools once you have clips</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                Object.keys(clipsByLayer)
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
                      
                      const effectStyles = getClipEffectStyles(clip);
                      
                      return (
                        <div
                          key={clip.id}
                          className={cn(
                            "absolute h-20 rounded-md transition-all overflow-visible group border-2",
                            isSelected ? "ring-2 ring-orange-500 ring-offset-1 ring-offset-gray-900 border-orange-500" : "border-gray-600/50 hover:border-gray-400",
                            clip.locked ? "opacity-50 cursor-not-allowed" : ""  ,
                            clip.metadata?.lipsync?.applied ? "ring-1 ring-purple-500" : ""
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
                            backgroundRepeat: 'no-repeat',
                            cursor: clip.locked ? 'not-allowed' : getClipCursor(),
                            touchAction: tool === 'hand' ? 'none' : 'auto',
                            boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.2)',
                            ...effectStyles
                          }}
                          onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'body')}
                          onTouchStart={(e) => handleClipTouchStart(e, clip.id, 'body')}
                          data-testid={`clip-${clip.id}`}
                        >
                          {/* Clip content */}
                          <div className="p-2 h-full flex flex-col justify-between overflow-hidden">
                            <div className="flex items-center gap-1">
                              <div className="text-xs font-semibold truncate text-white drop-shadow-lg">
                                {clip.title}
                              </div>
                              {clip.metadata?.lipsync?.applied && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[8px] px-1 py-0 h-4 bg-purple-500/80 text-white border-purple-400"
                                  title="Clip con sincronización labial"
                                >
                                  🎤 SYNC
                                </Badge>
                              )}
                              {clip.metadata?.effects && Object.keys(clip.metadata.effects).length > 0 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[8px] px-1 py-0 h-4 bg-orange-500/80 text-white border-orange-400"
                                  title="Clip con efectos visuales aplicados"
                                >
                                  ✨ FX
                                </Badge>
                              )}
                              {clip.metadata?.musicianIntegrated && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[8px] px-1 py-0 h-4 bg-green-500/80 text-white border-green-400"
                                  title="Clip with musician character"
                                >
                                  🎸 MUSICIAN
                                </Badge>
                              )}
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
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-7 w-7 bg-orange-600 hover:bg-orange-700 text-white shadow-lg border border-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditImage(clip);
                                }}
                                title="Edit Image with Nano Banana AI"
                                data-testid={`button-edit-image-${clip.id}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white shadow-lg border border-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddMusician(clip);
                                }}
                                title="Add Musician"
                                data-testid={`button-add-musician-${clip.id}`}
                              >
                                <Guitar className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-7 w-7 bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg border border-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCameraAngles(clip);
                                }}
                                title="Camera Angles"
                                data-testid={`button-camera-angles-${clip.id}`}
                              >
                                <Camera className="h-3.5 w-3.5" />
                              </Button>
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
                          
                          {/* Resize handles - Professional style, visible on hover/select */}
                          {!clip.locked && (
                            <>
                              {/* Left handle */}
                              <div
                                className={cn(
                                  "absolute left-0 top-0 bottom-0 cursor-ew-resize transition-all",
                                  isMobile ? "w-11" : "w-3",
                                  tool === 'trim' || isSelected 
                                    ? "bg-orange-500/70 hover:bg-orange-500" 
                                    : "bg-transparent group-hover:bg-orange-500/40"
                                )}
                                style={{ 
                                  touchAction: 'none',
                                  minWidth: isMobile ? '44px' : undefined,
                                  borderLeft: (tool === 'trim' || isSelected) ? '2px solid rgb(249, 115, 22)' : 'none'
                                }}
                                onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'start')}
                                onTouchStart={(e) => handleClipTouchStart(e, clip.id, 'start')}
                              >
                                {(tool === 'trim' || isSelected) && (
                                  <div className="absolute inset-y-0 left-0 flex items-center justify-center w-full">
                                    <div className="w-0.5 h-8 bg-white rounded-full opacity-80" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Right handle */}
                              <div
                                className={cn(
                                  "absolute right-0 top-0 bottom-0 cursor-ew-resize transition-all",
                                  isMobile ? "w-11" : "w-3",
                                  tool === 'trim' || isSelected 
                                    ? "bg-orange-500/70 hover:bg-orange-500" 
                                    : "bg-transparent group-hover:bg-orange-500/40"
                                )}
                                style={{ 
                                  touchAction: 'none',
                                  minWidth: isMobile ? '44px' : undefined,
                                  borderRight: (tool === 'trim' || isSelected) ? '2px solid rgb(249, 115, 22)' : 'none'
                                }}
                                onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'end')}
                                onTouchStart={(e) => handleClipTouchStart(e, clip.id, 'end')}
                              >
                                {(tool === 'trim' || isSelected) && (
                                  <div className="absolute inset-y-0 right-0 flex items-center justify-center w-full">
                                    <div className="w-0.5 h-8 bg-white rounded-full opacity-80" />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            
            {/* User Markers */}
            {renderUserMarkers()}
            
            {/* Snap Line (visual guide during drag) */}
            {snapLine !== null && (
              <div 
                className="absolute top-0 h-full border-l-2 border-yellow-400 z-25 pointer-events-none opacity-70"
                style={{ left: `${timeToPixels(snapLine)}px` }}
              />
            )}
            
            {/* Selection Rectangle - Multi-select with drag */}
            {selectionRect && (
              <div
                className="absolute border-2 border-blue-400 bg-blue-400/10 z-30 pointer-events-none rounded"
                style={{
                  left: `${selectionRect.x}px`,
                  top: `${selectionRect.y}px`,
                  width: `${selectionRect.width}px`,
                  height: `${selectionRect.height}px`
                }}
              />
            )}
            
            {/* Ghost Clip (preview during drag) */}
            {ghostClip && (
              <div
                className="absolute h-12 bg-white/10 border-2 border-white/30 rounded z-15 pointer-events-none"
                style={{
                  left: `${timeToPixels(ghostClip.position)}px`,
                  width: `${timeToPixels(clips.find(c => c.id === ghostClip.id)?.duration || 1)}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )}
            
            {/* Playhead */}
            {renderPlayhead()}
          </div>
        </div>
      </div>
      
      {/* Footer info - Responsive */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-2 border-t border-gray-700 text-[10px] md:text-xs bg-gray-800 gap-2">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            Tool: <strong className="text-primary">{getToolLabel()}</strong>
          </span>
          <span className="flex items-center gap-1">Clips: <strong>{clips.length}</strong></span>
          {selectedClip && (
            <span className="flex items-center gap-1">Selected: <strong className="text-primary">Clip #{selectedClip}</strong></span>
          )}
          <span className="flex items-center gap-1 md:hidden">Zoom: <strong>{zoom.toFixed(1)}x</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 overflow-x-auto">
          <span className="whitespace-nowrap hidden lg:inline">
            Tools: <strong className="text-gray-300">V</strong>=Select, <strong className="text-gray-300">C</strong>=Razor, <strong className="text-gray-300">H</strong>=Hand | 
            Edit: <strong className="text-gray-300">S</strong>=Split, <strong className="text-gray-300">M</strong>=Marker | 
            Navigate: <strong className="text-gray-300">←→</strong>=Frame, <strong className="text-gray-300">Shift+←→</strong>=Clip | 
            Play: <strong className="text-gray-300">Space</strong>, <strong className="text-gray-300">J/K/L</strong>
          </span>
          <span className="whitespace-nowrap hidden md:inline lg:hidden">
            <strong className="text-gray-300">V/C/H</strong>=Tools, <strong className="text-gray-300">S</strong>=Split, <strong className="text-gray-300">M</strong>=Marker, <strong className="text-gray-300">Space</strong>=Play
          </span>
          <span className="whitespace-nowrap md:hidden">
            <strong className="text-gray-300">Space</strong>=Play, <strong className="text-gray-300">S</strong>=Split
          </span>
        </div>
      </div>

      {/* Musician Modal */}
      {musicianModalClip && (
        <MusicianModal
          open={showMusicianModal}
          onClose={() => {
            setShowMusicianModal(false);
            setMusicianModalClip(null);
          }}
          timelineItem={{
            id: musicianModalClip.id.toString(),
            timestamp: musicianModalClip.start,
            imageUrl: musicianModalClip.imageUrl,
          }}
          scriptContext={musicianModalClip.prompt || musicianModalClip.description || "Music video performance scene"} 
          director={{ name: "Modern", style: "Cinematic" }}
          concept="Music Video Performance"
          onMusicianCreated={handleMusicianCreated}
        />
      )}

      {/* Camera Angles Modal */}
      <CameraAnglesModal
        open={showCameraAnglesModal}
        onClose={() => {
          setShowCameraAnglesModal(false);
          setCameraAnglesModalClip(null);
        }}
        clip={cameraAnglesModalClip}
        onSelectAngle={handleCameraAngleSelected}
      />

      {/* Image Editor Modal */}
      {imageEditorModalClip && (
        <ImageEditorModal
          open={showImageEditorModal}
          onClose={() => {
            setShowImageEditorModal(false);
            setImageEditorModalClip(null);
          }}
          imageUrl={imageEditorModalClip.imageUrl}
          originalPrompt={imageEditorModalClip.imagePrompt}
          onImageEdited={handleImageEdited}
        />
      )}

      {/* Mobile Effects Panel - Drawer Style */}
      {isMobile && showEffectsPanel && selectedClip !== null && (
        <Dialog open={showEffectsPanel} onOpenChange={(open) => {
          if (!open) {
            setShowEffectsPanel(false);
            setSelectedClip(null);
          }
        }}>
          <DialogContent className="max-w-[95vw] w-full h-[80vh] max-h-[80vh] p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="text-lg font-semibold">Effects Editor</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEffectsPanel(false);
                  setSelectedClip(null);
                }}
                className="h-8 w-8 p-0"
                data-testid="button-close-effects-mobile"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              <EffectsPanel
                clip={clips.find(c => c.id === selectedClip)!}
                onChange={handleEffectsChange}
                className="h-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
