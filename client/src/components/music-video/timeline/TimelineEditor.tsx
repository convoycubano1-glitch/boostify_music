/**
import { logger } from "../../lib/logger";
 * Editor de timeline principal
 * Componente principal para la edición de videos con timeline multiples capas
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimelineLayers } from './TimelineLayers';
import { EditorAgentPanel } from '../editor-agent-panel';
import { MotionControlPanel } from '../motion-control-panel';
import { VideoPreviewModal } from '../video-preview-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play as PlayIcon, Pause as PauseIcon, 
  Scissors as ScissorIcon, Hand as HandIcon,
  Type as SelectIcon, MoveHorizontal as TrimIcon,
  ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon,
  Redo as RedoIcon, Undo as UndoIcon,
  Magnet as MagnetIcon, Trash as TrashIcon,
  Video as VideoIcon, Volume2 as VolumeIcon, Wand2 as MotionIcon
} from 'lucide-react';
import { logger } from '@/lib/logger';
import type { MusicVideoScene } from '@/types/music-video-scene';

import { 
  TimelineClip, LayerConfig, ClipType, LayerType, TimelineMarker 
} from '@/interfaces/timeline';

const LAYER_LABEL_WIDTH = 160;
const PLAYHEAD_WIDTH = 2;

type Tool = 'select' | 'razor' | 'trim' | 'hand';

interface TimelineEditorProps {
  initialClips: TimelineClip[];
  duration: number;
  initialZoom?: number;
  markers?: TimelineMarker[];
  readOnly?: boolean;
  videoPreviewUrl?: string;
  audioPreviewUrl?: string;
  onChange?: (clips: TimelineClip[]) => void;
  audioBuffer?: AudioBuffer;
  genreHint?: string;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  initialClips,
  duration,
  initialZoom = 120,
  markers = [],
  readOnly = false,
  videoPreviewUrl,
  audioPreviewUrl,
  onChange,
  audioBuffer,
  genreHint,
}) => {
  const [clips, setClips] = useState<TimelineClip[]>(() => normalizeClips(initialClips));
  const [zoom, setZoom] = useState(initialZoom);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [rippleEnabled, setRippleEnabled] = useState(false);
  
  // 🎬 Motion Control & Video Generation
  const [motionPanelOpen, setMotionPanelOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<MusicVideoScene | null>(null);

  // Undo/redo
  const [history, setHistory] = useState<{ past: TimelineClip[][]; future: TimelineClip[][] }>({
    past: [],
    future: [],
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRaf = useRef<number | null>(null);

  // Beats como array simple (segundos) y otras guías para snap
  const beatGuides = useMemo(() => markers.filter(m => m.type === 'beat').map(m => m.time), [markers]);
  const sectionGuides = useMemo(() => markers.filter(m => m.type === 'section').map(m => m.time), [markers]);

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
        const next = prev + 1 / 60; // ~60 FPS
        if (next >= duration) return 0;
        return next;
      });
      playingRaf.current = requestAnimationFrame(tick);
    };
    playingRaf.current = requestAnimationFrame(tick);
    // media play
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    return () => {
      if (playingRaf.current) cancelAnimationFrame(playingRaf.current);
    };
  }, [isPlaying, duration]);

  // Sync media time on currentTime change if paused
  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current) videoRef.current.currentTime = currentTime;
      if (audioRef.current) audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);

  // emit onChange
  useEffect(() => {
    onChange?.(clips);
  }, [clips, onChange]);

  // Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          doUndo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          doRedo();
        }
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
      if (e.code === 'KeyV') setTool('select');
      if (e.code === 'KeyC') setTool('razor');
      if (e.code === 'KeyT') setTool('trim');
      if (e.code === 'KeyH') setTool('hand');
      if (e.code === 'Equal' || e.code === 'Plus') {
        e.preventDefault();
        zoomIn();
      }
      if (e.code === 'Minus') {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pushHistory = useCallback((newClips: TimelineClip[]) => {
    setHistory(h => ({
      past: [...h.past, clips],
      future: [],
    }));
    setClips(newClips);
  }, [clips]);

  const doUndo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const newPast = h.past.slice(0, -1);
      const newFuture = [clips, ...h.future];
      const restored = h.past[h.past.length - 1];
      setClips(restored);
      return { past: newPast, future: newFuture };
    });
  }, [clips]);

  const doRedo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const newPast = [...h.past, clips];
      const newFuture = h.future.slice(1);
      const restored = h.future[0];
      setClips(restored);
      return { past: newPast, future: newFuture };
    });
  }, [clips]);

  const handleSelectClip = useCallback((id: number) => {
    setSelectedClipId(id);
  }, []);

  const handleDeleteClip = useCallback((id: number) => {
    if (readOnly) return;
    const newClips = clips.filter(c => c.id !== id);
    if (rippleEnabled) {
      const deletedClip = clips.find(c => c.id === id);
      if (deletedClip) {
        const shiftAmount = deletedClip.duration;
        const shifted = newClips.map(c => {
          if (c.start > deletedClip.start) {
            return { ...c, start: c.start - shiftAmount };
          }
          return c;
        });
        pushHistory(shifted);
        return;
      }
    }
    pushHistory(newClips);
  }, [clips, pushHistory, readOnly, rippleEnabled]);

  const handleMoveClip = useCallback((id: number, newStart: number) => {
    if (readOnly) return;
    const snap = (t: number) => {
      if (!snapEnabled) return t;
      const snapDist = 5 / zoom; // 5px
      const allGuides = [...beatGuides, ...sectionGuides, 0, duration];
      for (const guide of allGuides) {
        if (Math.abs(t - guide) < snapDist) return guide;
      }
      for (const clip of clips) {
        if (clip.id === id) continue;
        if (Math.abs(t - clip.start) < snapDist) return clip.start;
        if (Math.abs(t - (clip.start + clip.duration)) < snapDist) return clip.start + clip.duration;
      }
      return t;
    };
    const snappedStart = snap(newStart);
    const newClips = clips.map(c => c.id === id ? { ...c, start: Math.max(0, snappedStart) } : c);
    setClips(newClips);
  }, [clips, readOnly, snapEnabled, beatGuides, sectionGuides, duration, zoom]);

  const handleSplitClip = useCallback((id: number, timeAtClip: number) => {
    if (readOnly) return;
    const clip = clips.find(c => c.id === id);
    if (!clip) return;
    const relativeTime = timeAtClip - clip.start;
    if (relativeTime <= 0 || relativeTime >= clip.duration) return;
    const newClip: TimelineClip = {
      ...clip,
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      start: clip.start + relativeTime,
      duration: clip.duration - relativeTime,
      sourceStart: (clip.sourceStart || 0) + relativeTime,
    };
    const updated = clips.map(c =>
      c.id === id ? { ...c, duration: relativeTime } : c
    );
    pushHistory([...updated, newClip]);
  }, [clips, readOnly, pushHistory]);

  const handleResizeClip = useCallback((id: number, newStart: number, newDuration: number, edge?: string) => {
    if (readOnly) return;
    const clip = clips.find(c => c.id === id);
    if (!clip) return;
    const maxDuration = (clip.sourceStart || 0) + newDuration <= clip.duration ? newDuration : clip.duration - (clip.sourceStart || 0);
    const newClips = clips.map(c => {
      if (c.id === id) {
        return {
          ...c,
          start: Math.max(0, newStart),
          duration: Math.max(0.1, Math.min(maxDuration, newDuration)),
        };
      }
      return c;
    });
    setClips(newClips);
  }, [clips, readOnly]);

  const handleRazorClick = useCallback((clipId: number, timeAtClipGlobal: number) => {
    handleSplitClip(clipId, timeAtClipGlobal);
  }, [handleSplitClip]);

  const handleTimelineClick = (timeGlobal: number) => {
    setCurrentTime(clamp(timeGlobal, 0, duration));
  };

  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 800));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 20));

  return (
    <>
      <div className="flex flex-col bg-neutral-900 text-white rounded-md overflow-hidden h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-neutral-950">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setTool('select')} className={tool==='select'?'bg-white/10':''} title="Seleccionar (V)">
              <SelectIcon size={16} /> <span className="ml-1 hidden sm:inline">Select</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTool('razor')} className={tool==='razor'?'bg-white/10':''} title="Cuchilla (C)">
              <ScissorIcon size={16} /> <span className="ml-1 hidden sm:inline">Razor</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTool('trim')} className={tool==='trim'?'bg-white/10':''} title="Trim (T)">
              <TrimIcon size={16} /> <span className="ml-1 hidden sm:inline">Trim</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTool('hand')} className={tool==='hand'?'bg-white/10':''} title="Mano (H)">
              <HandIcon size={16} /> <span className="ml-1 hidden sm:inline">Hand</span>
            </Button>

            <div className="mx-2 h-5 w-px bg-white/10" />

            <Button size="sm" variant="ghost" onClick={() => setSnapEnabled(s => !s)} title="Snap (beats, edges, seconds)">
              <MagnetIcon size={16} className={snapEnabled ? 'text-orange-400' : ''} />
              <span className="ml-1 hidden sm:inline">{snapEnabled?'Snap ON':'Snap OFF'}</span>
            </Button>

            <Button size="sm" variant="ghost" onClick={() => setRippleEnabled(r => !r)} title="Ripple delete/cut">
              <TrashIcon size={16} className={rippleEnabled ? 'text-red-400' : ''} />
              <span className="ml-1 hidden sm:inline">{rippleEnabled?'Ripple ON':'Ripple OFF'}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsPlaying(p=>!p)} title="Reproducir/Pausar (Space)">
              {isPlaying ? <PauseIcon size={16}/> : <PlayIcon size={16}/>}
            </Button>
            <Badge variant="outline" className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</Badge>

            <div className="mx-2 h-5 w-px bg-white/10" />

            <Button size="sm" variant="ghost" onClick={zoomIn} title="Zoom In (+)"><ZoomInIcon size={16}/></Button>
            <Button size="sm" variant="ghost" onClick={zoomOut} title="Zoom Out (-)"><ZoomOutIcon size={16}/></Button>
            <Badge variant="outline">{Math.round(zoom)} px/s</Badge>

            <div className="mx-2 h-5 w-px bg-white/10" />

            <EditorAgentPanel 
              timeline={clips.map((c, i) => ({
                id: String(c.id),
                label: `Clip ${i + 1}`,
                start_time: c.start,
                duration: c.duration,
              }))}
              audioBuffer={audioBuffer}
              genreHint={genreHint}
            />

            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setMotionPanelOpen(true)}
              title="Motion Control & Video Generation"
              className="gap-1.5"
            >
              <MotionIcon size={16} />
              <span className="hidden sm:inline text-xs">Motion</span>
            </Button>

            <div className="mx-2 h-5 w-px bg-white/10" />

            <Button size="sm" variant="ghost" onClick={doUndo} disabled={history.past.length===0} title="Undo (⌘/Ctrl+Z)">
              <UndoIcon size={16}/>
            </Button>
            <Button size="sm" variant="ghost" onClick={doRedo} disabled={history.future.length===0} title="Redo (⌘/Ctrl+Y)">
              <RedoIcon size={16}/>
            </Button>
          </div>
        </div>

        {/* Visor */}
        <div className="flex items-center gap-4 px-3 py-3 border-b border-white/10 bg-neutral-950">
          <div className="relative w-full max-w-3xl aspect-video bg-black/70 rounded-sm overflow-hidden">
            {videoPreviewUrl ? (
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                playsInline
                muted
                controls={false}
                className="w-full h-full object-contain"
                onClick={() => setIsPlaying(p=>!p)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/60">
                <VideoIcon className="mr-2" /> Sin video de vista previa
              </div>
            )}
            {/* Barra de progreso */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div className="h-full bg-orange-500" style={{ width: `${(currentTime/duration)*100}%` }}/>
            </div>
          </div>
          {audioPreviewUrl && (
            <audio ref={audioRef} src={audioPreviewUrl} preload="auto" />
          )}
        </div>

        {/* Timeline */}
        <div className="relative flex-1 overflow-hidden">
          {/* Regla superior y playhead */}
          <div className="relative border-b border-white/10 bg-neutral-900" style={{ height: 28 }}>
            {/* Marcas simples cada segundo y cada 5s más fuertes */}
            <Ruler zoom={zoom} duration={duration} />
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 bg-red-500"
              style={{ left: LAYER_LABEL_WIDTH + currentTime * zoom, width: PLAYHEAD_WIDTH }}
            />
          </div>

          <TimelineLayers
            clips={clips}
            currentTime={currentTime}
            duration={duration}
            zoom={zoom}
            tool={tool}
            snapEnabled={snapEnabled}
            beatMarkers={beatGuides.map(time => ({ time }))}
            onSelectClip={handleSelectClip}
            selectedClipId={selectedClipId}
            onMoveClip={handleMoveClip}
            onResizeClip={handleResizeClip}
            onRazorClick={handleRazorClick}
            onTimelineClick={handleTimelineClick}
            onDeleteClip={handleDeleteClip}
          />
        </div>
      </div>

      {/* Motion Control Panel */}
      <MotionControlPanel
        open={motionPanelOpen}
        onClose={() => setMotionPanelOpen(false)}
        scenes={[]}
        onApplyMotion={(scenes) => {
          logger.info(`✅ [Timeline] Motion aplicado a ${scenes.length} escenas`);
          setMotionPanelOpen(false);
        }}
      />

      {/* Video Preview Modal */}
      <VideoPreviewModal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        scene={selectedScene}
        videoUrl={selectedScene?.video_url}
        isGenerating={selectedScene?.video_status === 'generating'}
        onApprove={(scene) => {
          logger.info(`✅ [Preview] Video aprobado para ${scene.scene_id}`);
          setPreviewModalOpen(false);
        }}
        onRegenerate={(scene) => {
          logger.info(`🔄 [Preview] Regenerando video para ${scene.scene_id}`);
        }}
      />
    </>
  );
};

/** ---------- Helpers ---------- */
function normalizeClips(clips: TimelineClip[]): TimelineClip[] {
  return clips.map(c => ({
    ...c,
    in: c.in ?? 0,
    out: c.out ?? c.duration,
    sourceStart: c.sourceStart ?? 0,
  }));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const d = Math.floor((sec % 1) * 10);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${d}`;
}

const Ruler: React.FC<{ zoom: number; duration: number }> = ({ zoom, duration }) => {
  const ticks = Math.ceil(duration);
  return (
    <div className="absolute inset-0 select-none">
      {[...Array(ticks + 1)].map((_, i) => {
        const x = i * zoom;
        const major = i % 5 === 0;
        return (
          <div key={i} className="absolute" style={{ left: x }}>
            <div className={major ? 'h-4 bg-white/30' : 'h-2 bg-white/10'} style={{ width: 1 }}/>
            {major && (
              <div className="text-[10px] text-white/70 absolute top-4 -translate-x-1/2">{i}s</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TimelineEditor;
