/**
 * TimelineEditor with CapCut-inspired layout
 * Full-screen video editing with large preview + horizontal timeline
 */
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, ZoomIn, ZoomOut, 
  Download, Settings, Undo2, Redo2, Trash2, Copy, X,
  Music, Wand2, Scissors, Hand
} from 'lucide-react';
import { TimelineLayers } from './TimelineLayers';
import { Button } from '@/components/ui/button';
import type { TimelineClip, TimelineMarker } from '@/interfaces/timeline';

interface TimelineEditorCapCutProps {
  initialClips: TimelineClip[];
  duration: number;
  scenes?: Array<{ id: string; imageUrl: string; timestamp: number; description: string }>;
  videoPreviewUrl?: string;
  audioPreviewUrl?: string;
  onChange?: (clips: TimelineClip[]) => void;
}

export const TimelineEditorCapCut: React.FC<TimelineEditorCapCutProps> = ({
  initialClips,
  duration,
  scenes = [],
  videoPreviewUrl,
  audioPreviewUrl,
  onChange
}) => {
  const [clips, setClips] = useState<TimelineClip[]>(initialClips);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'cut' | 'hand'>('select');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playingRaf = useRef<number | null>(null);

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

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-zinc-900 to-black border-b border-orange-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">Video Editor</h1>
          <span className="text-xs text-zinc-400">{formatTime(duration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-400/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="text-zinc-400">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tools & Layers */}
        {sidebarOpen && (
          <div className="w-48 bg-zinc-950 border-r border-orange-500/10 overflow-y-auto p-3 space-y-4">
            {/* Tool Selection */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">Tools</p>
              <div className="space-y-1">
                {[
                  { id: 'select', label: 'Select', icon: Hand },
                  { id: 'cut', label: 'Scissors', icon: Scissors },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id as 'select' | 'cut' | 'hand')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      tool === t.id
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layers Info */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">Layers</p>
              <div className="text-xs text-zinc-400">
                <p>Video: {clips.filter(c => c.type === 'video').length}</p>
                <p>Audio: {clips.filter(c => c.type === 'audio').length}</p>
                <p>Text: {clips.filter(c => c.type === 'text').length}</p>
              </div>
            </div>

            {/* AI Editor Button */}
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all">
              <Wand2 className="w-4 h-4" />
              AI Editor
            </button>
          </div>
        )}

        {/* Center - Video Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Large Preview */}
          <div className="flex-1 bg-black relative group overflow-hidden flex items-center justify-center">
            {videoPreviewUrl ? (
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                className="w-full h-full object-contain"
              />
            ) : scenes.length > 0 ? (
              <div className="relative w-full h-full">
                <img
                  src={scenes[Math.floor((currentTime / duration) * scenes.length)]?.imageUrl || scenes[0]?.imageUrl}
                  alt="Current scene"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <Music className="w-12 h-12 mb-4 opacity-50" />
                <p>No content yet</p>
              </div>
            )}

            {/* Play Button Overlay */}
            {!isPlaying && (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group-hover:opacity-100 opacity-0"
              >
                <Play className="w-16 h-16 text-white fill-white" />
              </button>
            )}

            {/* Playhead Time Display */}
            <div className="absolute top-4 right-4 bg-black/70 px-3 py-2 rounded text-white text-sm font-mono">
              {formatTime(currentTime)}
            </div>

            {/* Seekbar */}
            <div className="absolute bottom-0 w-full h-1 bg-zinc-800 cursor-pointer group hover:h-2 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                setCurrentTime(percent * duration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          {/* Timeline Tracks - Horizontal */}
          <div className="bg-zinc-950 border-t border-orange-500/10">
            {/* Transport Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:bg-orange-500/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="text-sm text-zinc-300 font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="text-zinc-400"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-zinc-400 w-8 text-center">{zoom}%</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="text-zinc-400"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-zinc-700" />

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-zinc-400"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
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
                  className="w-20 h-2 bg-zinc-700 rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Scene Thumbnail Strip */}
            <div className="flex overflow-x-auto gap-2 p-3 bg-black/30 border-b border-zinc-800">
              {scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => setCurrentTime(scene.timestamp)}
                  className={`flex-shrink-0 relative group cursor-pointer rounded overflow-hidden border-2 transition-all ${
                    Math.abs(currentTime - scene.timestamp) < 0.5
                      ? 'border-orange-500'
                      : 'border-zinc-700 hover:border-orange-500/50'
                  }`}
                  title={scene.description}
                >
                  <img
                    src={scene.imageUrl}
                    alt={`Scene ${idx + 1}`}
                    className="w-32 h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/70 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100">
                    {formatTime(scene.timestamp)}
                  </div>
                </button>
              ))}
            </div>

            {/* Layers Panel */}
            <div className="max-h-40 overflow-y-auto bg-black/50">
              <TimelineLayers
                clips={clips}
                currentTime={currentTime}
                zoom={zoom}
                duration={duration}
                onClipSelect={handleClipSelect}
                onClipDelete={handleDeleteClip}
                selectedClipId={selectedClipId}
              />
            </div>
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
