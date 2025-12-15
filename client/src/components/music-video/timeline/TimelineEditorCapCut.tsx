/**
 * TimelineEditor with CapCut-inspired layout
 * Full-screen video editing with large preview + horizontal timeline
 * 
 * MOBILE-OPTIMIZED: Diseñado para iPhone/Android con controles táctiles
 * FASE 2: Lazy loading, transiciones, gestos touch
 * FASE 3: Pinch-to-zoom, double-tap, preload, animaciones
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, ZoomIn, ZoomOut, 
  Download, Settings, Undo2, Redo2, Trash2, Copy, X,
  Music, Wand2, Scissors, Hand, ChevronLeft, Menu, Layers,
  ChevronRight, SkipBack, SkipForward, Maximize2, Minimize2
} from 'lucide-react';
import { TimelineLayers } from './TimelineLayers';
import { Button } from '@/components/ui/button';
import type { TimelineClip, TimelineMarker } from '@/interfaces/timeline';

interface TimelineEditorCapCutProps {
  initialClips: TimelineClip[];
  duration: number;
  scenes?: Array<{ id: string; imageUrl: string; timestamp: number; description: string; lyricsSegment?: string }>;
  videoPreviewUrl?: string;
  audioPreviewUrl?: string;
  onChange?: (clips: TimelineClip[]) => void;
  onExport?: () => Promise<string | null>;
  onClose?: () => void;
  isExporting?: boolean;
  exportProgress?: number;
  exportStatus?: string;
}

// 🖼️ Lazy Image Component with placeholder, fade-in and preloading
const LazyImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  priority?: boolean; // If true, load immediately (no lazy)
}> = ({ src, alt, className = '', onLoad, priority = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {/* Placeholder skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
          <Music className="w-6 h-6 text-zinc-600" />
        </div>
      )}
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => setError(true)}
      />
    </div>
  );
};

// 🔍 Image preloader utility
const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
};

export const TimelineEditorCapCut: React.FC<TimelineEditorCapCutProps> = ({
  initialClips,
  duration,
  scenes = [],
  videoPreviewUrl,
  audioPreviewUrl,
  onChange,
  onExport,
  onClose,
  isExporting = false,
  exportProgress = 0,
  exportStatus = ''
}) => {
  const [clips, setClips] = useState<TimelineClip[]>(initialClips);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'cut' | 'hand'>('select');
  const [showLayers, setShowLayers] = useState(false);
  
  // 🎬 Scene transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousSceneUrl, setPreviousSceneUrl] = useState<string | null>(null);
  
  // � FASE 3: Pinch-to-zoom state
  const [previewScale, setPreviewScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const initialPinchDistance = useRef<number>(0);
  const initialScale = useRef<number>(1);
  
  // 👆 FASE 3: Double-tap state
  const lastTapTime = useRef<number>(0);
  const doubleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // 🎭 FASE 3: UI Animation state
  const [isEntering, setIsEntering] = useState(true);
  
  // 📱 Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 🎭 FASE 3: Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // 📱 Sidebar hidden by default on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // 👆 Touch/Swipe gesture refs
  const previewRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRaf = useRef<number | null>(null);
  
  // 🎬 Find current scene based on timestamp
  const currentScene = useMemo(() => {
    if (!scenes.length || duration <= 0) return null;
    // Find the scene that corresponds to current time
    let activeScene = scenes[0];
    for (const scene of scenes) {
      if (scene.timestamp <= currentTime) {
        activeScene = scene;
      } else {
        break;
      }
    }
    return activeScene;
  }, [scenes, currentTime, duration]);
  
  // Current scene index (1-based for display)
  const currentSceneIndex = useMemo(() => {
    if (!currentScene) return 0;
    return scenes.findIndex(s => s.id === currentScene.id) + 1;
  }, [currentScene, scenes]);
  
  // 🎬 Handle scene transition effect
  const prevSceneRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentScene && prevSceneRef.current !== currentScene.imageUrl) {
      if (prevSceneRef.current) {
        setPreviousSceneUrl(prevSceneRef.current);
        setIsTransitioning(true);
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousSceneUrl(null);
        }, 300);
      }
      prevSceneRef.current = currentScene.imageUrl;
    }
  }, [currentScene]);
  
  // 👆 Navigate to next/previous scene
  const goToNextScene = useCallback(() => {
    if (currentSceneIndex < scenes.length) {
      const nextScene = scenes[currentSceneIndex]; // currentSceneIndex is 1-based, so this gets the next
      if (nextScene) {
        setCurrentTime(nextScene.timestamp);
      }
    }
  }, [currentSceneIndex, scenes]);
  
  const goToPrevScene = useCallback(() => {
    if (currentSceneIndex > 1) {
      const prevScene = scenes[currentSceneIndex - 2]; // -2 because 1-based and we want previous
      if (prevScene) {
        setCurrentTime(prevScene.timestamp);
      }
    } else {
      setCurrentTime(0);
    }
  }, [currentSceneIndex, scenes]);
  
  // � FASE 3: Preload adjacent images when scene changes
  useEffect(() => {
    if (!currentScene || scenes.length === 0) return;
    
    const currentIdx = scenes.findIndex(s => s.id === currentScene.id);
    const urlsToPreload: string[] = [];
    
    // Preload next 2 scenes
    if (currentIdx + 1 < scenes.length) urlsToPreload.push(scenes[currentIdx + 1].imageUrl);
    if (currentIdx + 2 < scenes.length) urlsToPreload.push(scenes[currentIdx + 2].imageUrl);
    
    // Preload previous scene
    if (currentIdx - 1 >= 0) urlsToPreload.push(scenes[currentIdx - 1].imageUrl);
    
    preloadImages(urlsToPreload);
  }, [currentScene, scenes]);
  
  // 👆👆 FASE 3: Double-tap handler for play/pause
  const handleDoubleTap = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  // 🔍 FASE 3: Pinch-to-zoom handlers
  const handlePinchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistance.current = Math.sqrt(dx * dx + dy * dy);
      initialScale.current = previewScale;
    }
  }, [previewScale]);
  
  const handlePinchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const scale = (currentDistance / initialPinchDistance.current) * initialScale.current;
      
      // Clamp scale between 1 and 3
      const clampedScale = Math.max(1, Math.min(3, scale));
      setPreviewScale(clampedScale);
      setIsZoomed(clampedScale > 1.1);
    }
  }, []);
  
  const handlePinchEnd = useCallback(() => {
    initialPinchDistance.current = 0;
    // Snap back to 1 if close
    if (previewScale < 1.2) {
      setPreviewScale(1);
      setIsZoomed(false);
    }
  }, [previewScale]);
  
  // 🔍 FASE 3: Reset zoom
  const resetZoom = useCallback(() => {
    setPreviewScale(1);
    setIsZoomed(false);
  }, []);
  
  // 👆 Touch gesture handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Check for pinch (2 fingers)
    if (e.touches.length === 2) {
      handlePinchStart(e);
      return;
    }
    
    // Single touch - check for double tap
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      if (doubleTapTimeout.current) {
        clearTimeout(doubleTapTimeout.current);
        doubleTapTimeout.current = null;
      }
      handleDoubleTap();
      lastTapTime.current = 0;
      return;
    }
    
    lastTapTime.current = now;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, [handleDoubleTap, handlePinchStart]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Handle pinch zoom
    if (e.touches.length === 2) {
      handlePinchMove(e);
      return;
    }
    
    if (!touchStartX.current) return;
    
    // Don't swipe if zoomed
    if (isZoomed) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Check if horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      isSwiping.current = true;
    }
  }, [handlePinchMove, isZoomed]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Handle pinch end
    if (initialPinchDistance.current > 0) {
      handlePinchEnd();
      return;
    }
    
    if (!isSwiping.current) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Swipe right = previous scene
        goToPrevScene();
      } else {
        // Swipe left = next scene
        goToNextScene();
      }
    }
    
    touchStartX.current = 0;
    touchStartY.current = 0;
    isSwiping.current = false;
  }, [goToNextScene, goToPrevScene, handlePinchEnd]);

  // Play loop
  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (playingRaf.current) cancelAnimationFrame(playingRaf.current);
      return;
    }

    const tick = () => {
      setCurrentTime(prev => {
        const next = prev + 1 / 60;
        if (next >= duration) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
      playingRaf.current = requestAnimationFrame(tick);
    };
    playingRaf.current = requestAnimationFrame(tick);

    if (videoRef.current) videoRef.current.play().catch(() => {});
    if (audioRef.current) audioRef.current.play().catch(() => {});

    return () => {
      if (playingRaf.current) cancelAnimationFrame(playingRaf.current);
    };
  }, [isPlaying, duration]);

  // Sync media time
  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current) videoRef.current.currentTime = currentTime;
      if (audioRef.current) audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClipSelect = (clipId: string) => {
    setSelectedClipId(clipId);
  };

  const handleDeleteClip = (clipId: string) => {
    const updatedClips = clips.filter(c => c.id !== clipId);
    setClips(updatedClips);
    onChange?.(updatedClips);
  };
  
  // 📱 Handle close/back navigation
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`min-h-screen bg-black flex flex-col touch-manipulation transition-all duration-300 ${isEntering ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
      {/* Top Bar - Mobile Optimized */}
      <div className="bg-gradient-to-r from-zinc-900 to-black border-b border-orange-500/20 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between safe-area-inset-top">
        {/* Left: Back button + Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-white/10 p-2 min-w-[44px] min-h-[44px]"
            onClick={handleClose}
            aria-label="Cerrar editor"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-lg font-bold text-white">Video Editor</h1>
            <span className="text-[10px] sm:text-xs text-zinc-400">{formatTime(duration)} • {scenes.length} escenas</span>
          </div>
        </div>
        
        {/* Right: Export button */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Mobile: hamburger menu for sidebar */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-400 hover:bg-white/10 p-2 min-w-[44px] min-h-[44px]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Menú"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-50 min-h-[44px] px-3 sm:px-4"
            onClick={onExport}
            disabled={isExporting || !onExport}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 mr-1 sm:mr-2 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs sm:text-sm">{exportProgress > 0 ? `${exportProgress}%` : '...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Export Progress Bar */}
      {isExporting && (
        <div className="bg-black border-b border-orange-500/20 px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
            <span className="text-orange-400 truncate">{exportStatus || 'Exportando video...'}</span>
            <span className="text-zinc-400 ml-2">{exportProgress}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 📱 Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Left Sidebar - Tools & Layers (Hidden on mobile by default) */}
        {sidebarOpen && (
          <div className={`
            ${isMobile ? 'fixed left-0 top-0 bottom-0 z-50 w-64 animate-in slide-in-from-left' : 'w-48'}
            bg-zinc-950 border-r border-orange-500/10 overflow-y-auto p-3 space-y-4
          `}>
            {/* Mobile close button */}
            {isMobile && (
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="text-sm font-bold text-white">Herramientas</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-zinc-400 p-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
            
            {/* Tool Selection */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">Herramientas</p>
              <div className="space-y-1">
                {[
                  { id: 'select', label: 'Seleccionar', icon: Hand },
                  { id: 'cut', label: 'Cortar', icon: Scissors },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id as 'select' | 'cut' | 'hand')}
                    className={`w-full flex items-center gap-2 px-3 py-3 rounded text-sm transition-colors min-h-[44px] ${
                      tool === t.id
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-zinc-300 hover:bg-zinc-800 active:bg-zinc-700'
                    }`}
                  >
                    <t.icon className="w-5 h-5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layers Info */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">Contenido</p>
              <div className="text-sm text-zinc-300 space-y-1">
                <p className="flex justify-between"><span>🎬 Escenas:</span> <span className="text-orange-400 font-bold">{scenes.length}</span></p>
                <p className="flex justify-between"><span>🎵 Audio:</span> <span className="text-cyan-400">{clips.filter(c => c.type === 'audio').length}</span></p>
                <p className="flex justify-between"><span>📝 Texto:</span> <span>{clips.filter(c => c.type === 'text').length}</span></p>
              </div>
            </div>

            {/* AI Editor Button */}
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all min-h-[48px]">
              <Wand2 className="w-5 h-5" />
              AI Editor
            </button>
          </div>
        )}

        {/* Center - Video Preview Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Large Preview with touch gestures - 🔍 Phase 3: Pinch to Zoom */}
          <div 
            ref={previewRef}
            className="flex-1 bg-black relative group overflow-hidden flex items-center justify-center min-h-[200px]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 🔍 Zoomable container with scale transform */}
            <div 
              className="w-full h-full transition-transform duration-200 origin-center"
              style={{ transform: `scale(${previewScale})` }}
            >
              {videoPreviewUrl ? (
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  className="w-full h-full object-contain"
                />
              ) : scenes.length > 0 && currentScene ? (
                <div className="relative w-full h-full">
                  {/* 🎬 Previous scene (for crossfade transition) */}
                  {isTransitioning && previousSceneUrl && (
                    <img
                      src={previousSceneUrl}
                      alt="Previous scene"
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0"
                    />
                  )}
                  
                  {/* 🎬 Current scene image with fade transition */}
                  <LazyImage
                    src={currentScene.imageUrl}
                    alt={currentScene.description || `Escena ${currentSceneIndex}`}
                    className={`w-full h-full transition-opacity duration-300 ${isTransitioning ? 'opacity-100' : ''}`}
                    priority={true}
                  />
                  
                  {/* 👆 Swipe hint indicators (mobile) - hide when zoomed */}
                  {isMobile && !isPlaying && !isZoomed && (
                    <>
                      {/* Left arrow - previous scene */}
                      {currentSceneIndex > 1 && (
                        <button
                          onClick={goToPrevScene}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:bg-black/60"
                          aria-label="Escena anterior"
                        >
                          <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                      )}
                      {/* Right arrow - next scene */}
                      {currentSceneIndex < scenes.length && (
                        <button
                          onClick={goToNextScene}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:bg-black/60"
                          aria-label="Siguiente escena"
                        >
                          <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* 📝 Scene info overlay (bottom) - hide when zoomed */}
                  {!isZoomed && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4 pointer-events-none">
                      {/* Lyrics segment as subtitle */}
                      {currentScene.lyricsSegment && (
                        <p className="text-white text-center text-sm sm:text-lg font-medium mb-2 drop-shadow-lg line-clamp-2">
                          "{currentScene.lyricsSegment}"
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* 🔢 Scene counter (top left) */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full">
                    <span className="text-white text-xs sm:text-sm font-bold">
                      {currentSceneIndex} / {scenes.length}
                    </span>
                  </div>
                </div>
              ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500 p-8">
                <Music className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Sin contenido aún</p>
              </div>
            )}
            </div>{/* End zoomable container */}

            {/* 🔍 Zoom reset button (Phase 3) - shows when zoomed */}
            {isZoomed && (
              <button
                onClick={resetZoom}
                className="absolute top-3 right-14 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2 z-10 active:bg-black/90 transition-all animate-in fade-in duration-200"
                aria-label="Resetear zoom"
              >
                <Minimize2 className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-medium">{Math.round(previewScale * 100)}%</span>
              </button>
            )}

            {/* Play Button Overlay - Always visible on mobile */}
            {!isPlaying && !isZoomed && (
              <button
                onClick={() => setIsPlaying(true)}
                className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-colors 
                  ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  active:bg-black/60`}
                aria-label="Reproducir"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1" />
                </div>
              </button>
            )}
            
            {/* Tap to pause when playing */}
            {isPlaying && (
              <button
                onClick={() => setIsPlaying(false)}
                className="absolute inset-0"
                aria-label="Pausar"
              />
            )}

            {/* Playhead Time Display */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-2 rounded text-white text-xs sm:text-sm font-mono">
              {formatTime(currentTime)}
            </div>

            {/* 📱 Seekbar - Touch optimized (bigger hit area) */}
            <div 
              className="absolute bottom-0 w-full h-3 sm:h-2 bg-zinc-800/80 cursor-pointer touch-none"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                setCurrentTime(Math.max(0, Math.min(duration, percent * duration)));
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (touch.clientX - rect.left) / rect.width;
                setCurrentTime(Math.max(0, Math.min(duration, percent * duration)));
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 relative"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              >
                {/* Playhead indicator */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-lg transform translate-x-1/2" />
              </div>
            </div>
          </div>

          {/* Timeline Tracks - Horizontal */}
          <div className="bg-zinc-950 border-t border-orange-500/10">
            {/* Transport Controls - Mobile optimized */}
            <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-zinc-800">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Skip to previous scene */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={goToPrevScene}
                  className="text-zinc-400 hover:text-white hover:bg-orange-500/20 active:bg-orange-500/30 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-1.5 sm:p-2"
                  aria-label="Escena anterior"
                  disabled={currentSceneIndex <= 1}
                >
                  <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                {/* Play/Pause */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-orange-500/20 active:bg-orange-500/30 min-w-[44px] min-h-[44px] p-2"
                  aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                
                {/* Skip to next scene */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={goToNextScene}
                  className="text-zinc-400 hover:text-white hover:bg-orange-500/20 active:bg-orange-500/30 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-1.5 sm:p-2"
                  aria-label="Siguiente escena"
                  disabled={currentSceneIndex >= scenes.length}
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                
                <div className="text-xs sm:text-sm text-zinc-300 font-mono ml-1 sm:ml-2">
                  {formatTime(currentTime)} <span className="text-zinc-500 hidden sm:inline">/</span> <span className="hidden sm:inline">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-3">
                {/* Zoom controls - Hidden on very small screens */}
                <div className="hidden sm:flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="text-zinc-400 p-2"
                    aria-label="Reducir zoom"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-zinc-400 w-8 text-center">{zoom}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="text-zinc-400 p-2"
                    aria-label="Aumentar zoom"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <div className="w-px h-6 bg-zinc-700" />
                </div>

                {/* Volume control */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-zinc-400 min-w-[44px] min-h-[44px] p-2"
                  aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                
                {/* Volume slider - Hidden on mobile */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if (audioRef.current) audioRef.current.volume = parseFloat(e.target.value);
                  }}
                  className="hidden sm:block w-20 h-2 bg-zinc-700 rounded appearance-none cursor-pointer"
                />
                
                {/* Layers toggle button - Mobile only */}
                {isMobile && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowLayers(!showLayers)}
                    className={`min-w-[44px] min-h-[44px] p-2 ${showLayers ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-400'}`}
                    aria-label="Ver capas"
                  >
                    <Layers className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* 📱 Scene Thumbnail Strip - Responsive with Lazy Loading */}
            <div className="flex overflow-x-auto gap-2 sm:gap-3 p-2 sm:p-3 bg-black/30 border-b border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent snap-x snap-mandatory">
              {scenes.map((scene, idx) => {
                const isActive = currentScene?.id === scene.id;
                return (
                  <button
                    key={scene.id}
                    onClick={() => setCurrentTime(scene.timestamp)}
                    className={`flex-shrink-0 relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all transform snap-center ${
                      isActive
                        ? 'border-orange-500 scale-105 shadow-lg shadow-orange-500/30 ring-2 ring-orange-500/50'
                        : 'border-zinc-700/50 hover:border-orange-500/50 active:scale-95'
                    }`}
                    title={scene.description}
                    aria-label={`Ir a escena ${idx + 1}`}
                  >
                    {/* 📱 Responsive thumbnail sizes with LazyImage */}
                    <LazyImage
                      src={scene.imageUrl}
                      alt={`Escena ${idx + 1}`}
                      className="w-20 h-14 sm:w-28 sm:h-18 md:w-32 md:h-20"
                    />
                    
                    {/* Scene number badge */}
                    <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold ${
                      isActive ? 'bg-orange-500 text-white' : 'bg-black/60 text-zinc-300'
                    }`}>
                      {idx + 1}
                    </div>
                    
                    {/* Hover overlay with play icon - Desktop only */}
                    <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                    
                    {/* Timestamp on hover/active - Desktop */}
                    <div className={`absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white ${
                      isActive ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'
                    }`}>
                      {formatTime(scene.timestamp)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Layers Panel - Simplified on Mobile, Full on Desktop */}
            {(!isMobile || showLayers) && (
              <div className={`${isMobile ? 'max-h-32' : 'max-h-40'} overflow-y-auto bg-black/50`}>
                {isMobile ? (
                  // 📱 MOBILE: Simplified layer view - only show summary
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                      <span className="font-bold uppercase">Capas Activas</span>
                      <button 
                        onClick={() => setShowLayers(false)}
                        className="text-zinc-500 hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Scene Images Layer */}
                    {scenes.length > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <span className="text-sm text-white flex-1">🎬 Escenas IA</span>
                        <span className="text-xs text-zinc-400">{scenes.length}</span>
                      </div>
                    )}
                    
                    {/* Audio Layer */}
                    {(audioPreviewUrl || clips.filter(c => c.type === 'audio').length > 0) && (
                      <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-sm text-white flex-1">🎵 Audio</span>
                        <span className="text-xs text-zinc-400">
                          {formatTime(duration)}
                        </span>
                      </div>
                    )}
                    
                    {/* Text Layer */}
                    {clips.filter(c => c.type === 'text').length > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-sm text-white flex-1">📝 Texto</span>
                        <span className="text-xs text-zinc-400">{clips.filter(c => c.type === 'text').length}</span>
                      </div>
                    )}
                    
                    {/* Info hint */}
                    <p className="text-[10px] text-zinc-500 text-center mt-2">
                      Desliza ← → en las escenas para navegar
                    </p>
                  </div>
                ) : (
                  // 🖥️ DESKTOP: Full timeline layers
                  <TimelineLayers
                    clips={clips}
                    currentTime={currentTime}
                    zoom={zoom}
                    duration={duration}
                    onSelectClip={(id) => handleClipSelect(String(id))}
                    selectedClipId={selectedClipId ? parseInt(selectedClipId) : null}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Audio Reference */}
      {audioPreviewUrl && (
        <audio
          ref={audioRef}
          src={audioPreviewUrl}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              // Sync duration if needed
            }
          }}
        />
      )}
    </div>
  );
};
