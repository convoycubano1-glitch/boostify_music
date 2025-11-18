/**
import { logger } from "../lib/logger";
 * Editor de timeline principal
 * Componente principal para la edición de videos con timeline multiples capas
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimelineLayers } from './TimelineLayers';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { 
  Play as PlayIcon, Pause as PauseIcon, 
  Scissors as ScissorIcon, Hand as HandIcon,
  Type as SelectIcon, MoveHorizontal as TrimIcon,
  ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon,
  Redo as RedoIcon, Undo as UndoIcon,
  Magnet as MagnetIcon, Trash as TrashIcon,
  Video as VideoIcon, Volume2 as VolumeIcon
} from 'lucide-react';

import { 
  TimelineClip, LayerConfig, ClipType, LayerType, TimelineMarker 
} from '../../../interfaces/timeline';

const LAYER_LABEL_WIDTH = 160;  // fallback local si no existe en constants
const PLAYHEAD_WIDTH = 2;

type Tool = 'select' | 'razor' | 'trim' | 'hand';

interface TimelineEditorProps {
  initialClips: TimelineClip[];
  duration: number;
  initialZoom?: number;     // px/seg
  markers?: TimelineMarker[];
  readOnly?: boolean;
  videoPreviewUrl?: string; // fuente del visor
  audioPreviewUrl?: string; // fuente del visor
  onChange?: (clips: TimelineClip[]) => void;
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
}) => {
  const [clips, setClips] = useState<TimelineClip[]>(() => normalizeClips(initialClips));
  const [zoom, setZoom] = useState(initialZoom);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [rippleEnabled, setRippleEnabled] = useState(false);

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
          if (e.shiftKey) redo();
          else undo();
        }
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      } else {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            togglePlay();
            break;
          case 'v':
          case 'V':
            setTool('select');
            break;
          case 'c':
          case 'C':
            setTool('razor');
            break;
          case 't':
          case 'T':
            setTool('trim');
            break;
          case 'h':
          case 'H':
            setTool('hand');
            break;
          case '+':
            setZoom(z => Math.min(z * 1.15, 800));
            break;
          case '-':
            setZoom(z => Math.max(z / 1.15, 20));
            break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Helpers — history
  const pushHistory = useCallback((prev: TimelineClip[]) => {
    setHistory(h => ({ past: [...h.past, prev], future: [] }));
  }, []);
  const undo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        future: [clips, ...h.future],
      };
    });
  }, [clips]);
  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      return {
        past: [...h.past, clips],
        future: h.future.slice(1),
      };
    });
  }, [clips]);

  // Apply undo/redo state to clips
  useEffect(() => {
    if (history.future.length > 0 && history.future[0] === clips) return;
    // If we just changed history via undo/redo, pick the top of stacks
    // We detect it by listening to history changes? Simpler: when undo/redo updates history,
    // we immediately set clips there. Implement via callback returns:
  }, [history]); // no-op here; we’ll set clips inside undo/redo actions:

  // Inject state change inside undo/redo
  useEffect(() => {
    // When history is updated by undo:
    // If the last action was undo: past popped, future got current
    // We need to set clips to the new top of past or to provided state.
    // Simpler: we override undo/redo to also set clips.
  }, []);

  // Replace undo/redo with versions that also set clips
  const doUndo = useCallback(() => {
    setHistory(h => {
      if (h.past.length === 0) return h;
      const prev = h.past[h.past.length - 1];
      setClips(prev);
      return { past: h.past.slice(0, -1), future: [clips, ...h.future] };
    });
  }, [clips]);
  const doRedo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      setClips(next);
      return { past: [...h.past, clips], future: h.future.slice(1) };
    });
  }, [clips]);

  // Controls
  const togglePlay = () => setIsPlaying(p => !p);
  const stop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Snapping
  const guides = useMemo(() => {
    const clipEdges = clips.flatMap(c => [c.start, c.start + c.duration]);
    return [...beatGuides, ...sectionGuides, ...clipEdges, 0, duration]
      .filter((v, i, arr) => arr.indexOf(v) === i) // unique
      .sort((a, b) => a - b);
  }, [clips, beatGuides, sectionGuides, duration]);

  const snap = useCallback((time: number, strength = 0.08) => {
    if (!snapEnabled) return time;
    let best = time;
    let bestDiff = strength;
    for (const g of guides) {
      const d = Math.abs(g - time);
      if (d < bestDiff) {
        best = g;
        bestDiff = d;
      }
    }
    // Snap también a múltiplos redondos (1s)
    const nearestSec = Math.round(time);
    if (Math.abs(nearestSec - time) < bestDiff) best = nearestSec;
    return best;
  }, [guides, snapEnabled]);

  // High-level ops
  const handleMoveClip = useCallback((clipId: number, newStartRaw: number, newLayerId: number) => {
    if (readOnly) return;
    const prev = clips;
    pushHistory(prev);
    const newStart = snap(newStartRaw);
    setClips(prev =>
      prev.map(c => c.id === clipId ? { ...c, start: clamp(newStart, 0, duration - 0.05), layerId: newLayerId } : c)
    );
  }, [clips, duration, pushHistory, snap, readOnly]);

  const handleResizeClip = useCallback((clipId: number, newStartRaw: number, newDurRaw: number, edge: 'start' | 'end') => {
    if (readOnly) return;
    const prev = clips;
    pushHistory(prev);

    let newStart = edge === 'start' ? snap(newStartRaw) : undefined;
    let newDur = edge === 'end' ? snap(newDurRaw) : newDurRaw;

    setClips(prev => prev.map(c => {
      if (c.id !== clipId) return c;
      let start = c.start;
      let durationLocal = c.duration;
      if (edge === 'start' && typeof newStart === 'number') {
        const maxStart = c.start + c.duration - 0.1;
        start = clamp(newStart, 0, maxStart);
        durationLocal = (c.start + c.duration) - start;
      } else if (edge === 'end') {
        const maxDur = Math.max(0.1, duration - c.start);
        durationLocal = clamp(newDur!, 0.1, maxDur);
      }
      return { ...c, start, duration: durationLocal };
    }));
  }, [clips, duration, pushHistory, snap, readOnly]);

  const handleSplitClip = useCallback((clipId: number, timeRaw: number) => {
    if (readOnly) return;
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    const splitTimeGlobal = clamp(snap(timeRaw), clip.start + 0.05, clip.start + clip.duration - 0.05);
    const prev = clips;
    pushHistory(prev);

    const leftDur = splitTimeGlobal - clip.start;
    const rightDur = clip.duration - leftDur;

    const nextId = Math.max(0, ...clips.map(c => c.id)) + 1;

    const left: TimelineClip = { ...clip, duration: leftDur };
    const right: TimelineClip = { ...clip, id: nextId, start: splitTimeGlobal, duration: rightDur };

    let newClips = prev.filter(c => c.id !== clip.id).concat(left, right);

    // Ripple: desplazar todo a la derecha del corte (misma capa) si está activo
    if (rippleEnabled) {
      const delta = 0; // split no cambia la suma, ripple útil cuando delete/cut remove
      // aquí no movemos nada; ripple lo usamos en delete
      // mantenemos hook para consistencia
    }

    setClips(newClips);
    setSelectedClipId(right.id);
  }, [clips, pushHistory, snap, rippleEnabled, readOnly]);

  const handleDeleteClip = useCallback((clipId: number) => {
    if (readOnly) return;
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    const prev = clips;
    pushHistory(prev);
    let newClips = prev.filter(c => c.id !== clipId);
    if (rippleEnabled) {
      const gap = clip.duration;
      newClips = newClips.map(c => {
        if (c.layerId === clip.layerId && c.start > clip.start) {
          return { ...c, start: Math.max(0, c.start - gap) };
        }
        return c;
      });
    }
    setClips(newClips);
    setSelectedClipId(null);
  }, [clips, pushHistory, rippleEnabled, readOnly]);

  const handleRazorClick = useCallback((clipId: number, timeAtClipGlobal: number) => {
    // Se invoca desde LayerRow cuando tool === 'razor' y clic en clip
    handleSplitClip(clipId, timeAtClipGlobal);
  }, [handleSplitClip]);

  const handleSelectClip = (id: number | null) => setSelectedClipId(id);

  const handleTimelineClick = (timeGlobal: number) => {
    setCurrentTime(clamp(timeGlobal, 0, duration));
  };

  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 800));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 20));

  return (
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
          onResizeClip={(id, newStart, newDur, edge) => handleResizeClip(id, newStart, newDur, edge)}
          onRazorClick={handleRazorClick}
          onTimelineClick={handleTimelineClick}
          onDeleteClip={handleDeleteClip}
        />
      </div>
    </div>
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