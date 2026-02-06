/**
 * Motion Control & Video Generation Panel
 * 
 * Professional UI to configure motion parameters and generate videos
 * from timeline image clips using Grok Imagine Video or Kling Video.
 * 
 * Derives "scenes" directly from the timeline's image/video clips (layer 1),
 * allowing the user to pick one or batch-generate, tune performance/emotion
 * sliders, select AI model, and kick off the generation with real API calls.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2, Play, Settings, AlertCircle, Loader2, X,
  Video, Image, Zap, Sparkles, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Film, RefreshCw, Layers
} from "lucide-react";
import { logger } from "@/lib/logger";
import type { TimelineClip } from "@/interfaces/timeline";

// ─── Types ─────────────────────────────────────────────────────────────────

type PerformanceType = "singing" | "dancing" | "talking" | "reacting" | "instrumental" | "ambient";
type MotionComplexity = "minimal" | "moderate" | "high" | "cinematic";
type CameraStyle = "static" | "pan" | "dolly" | "tracking" | "crane" | "handheld" | "drone" | "zoom";
type VideoModel = "grok" | "kling-o1-pro" | "kling-o1-standard" | "kling-v2.1-pro" | "kling-v2.1-standard";

interface GenerationJob {
  clipId: number;
  status: "queued" | "generating" | "completed" | "error";
  progress: number;
  videoUrl?: string;
  error?: string;
  startedAt?: number;
}

export interface MotionControlPanelProps {
  open: boolean;
  onClose: () => void;
  clips: TimelineClip[];
  onUpdateClip?: (clipId: number, updates: Partial<TimelineClip>) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const MODEL_INFO: Record<VideoModel, { label: string; icon: string; speed: string; quality: string; maxDuration: number }> = {
  "grok": { label: "Grok Imagine Video (xAI)", icon: "⚡", speed: "~30s", quality: "High", maxDuration: 6 },
  "kling-o1-pro": { label: "Kling O1 Pro", icon: "🎬", speed: "~90s", quality: "Ultra", maxDuration: 10 },
  "kling-o1-standard": { label: "Kling O1 Standard", icon: "🎥", speed: "~60s", quality: "High", maxDuration: 10 },
  "kling-v2.1-pro": { label: "Kling v2.1 Pro", icon: "🔥", speed: "~60s", quality: "Very High", maxDuration: 10 },
  "kling-v2.1-standard": { label: "Kling v2.1 Standard", icon: "✨", speed: "~45s", quality: "Good", maxDuration: 10 },
};

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function MotionControlPanel({ open, onClose, clips, onUpdateClip }: MotionControlPanelProps) {
  const { toast } = useToast();

  // Filter only image clips on layer 1 (potential scenes for video generation)
  const imageClips = clips.filter(c =>
    c.layerId === 1 && (c.type === "IMAGE" || c.type === "GENERATED_IMAGE" || c.type === "VIDEO") && (c.imageUrl || c.url)
  );

  // ── Selection & Parameters ────────────────────────────────────────────
  const [selectedClipId, setSelectedClipId] = useState<number | null>(imageClips[0]?.id ?? null);
  const [selectAll, setSelectAll] = useState(false);
  const [movementIntensity, setMovementIntensity] = useState(0.5);
  const [emotionIntensity, setEmotionIntensity] = useState(0.5);
  const [performanceType, setPerformanceType] = useState<PerformanceType>("singing");
  const [motionComplexity, setMotionComplexity] = useState<MotionComplexity>("moderate");
  const [cameraStyle, setCameraStyle] = useState<CameraStyle>("dolly");
  const [videoModel, setVideoModel] = useState<VideoModel>("grok");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cfgScale, setCfgScale] = useState(0.5);
  const [negativePrompt, setNegativePrompt] = useState("blurry, jittery, distorted faces, artifacts, low quality");

  // ── Generation State ──────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Map<number, GenerationJob>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const pollingRef = useRef<Map<number, ReturnType<typeof setInterval>>>(new Map());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Sync selectedClipId when imageClips change
  useEffect(() => {
    if (imageClips.length > 0 && selectedClipId === null) {
      setSelectedClipId(imageClips[0].id);
    }
  }, [imageClips.length]);

  // Timer for elapsed display
  useEffect(() => {
    if (isGenerating) {
      const start = Date.now();
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - start), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedMs(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isGenerating]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current.forEach(t => clearInterval(t));
      pollingRef.current.clear();
    };
  }, []);

  const selectedClip = imageClips.find(c => c.id === selectedClipId) ?? null;
  const targetClips = selectAll ? imageClips : (selectedClip ? [selectedClip] : []);
  const completedCount = Array.from(jobs.values()).filter(j => j.status === "completed").length;
  const errorCount = Array.from(jobs.values()).filter(j => j.status === "error").length;

  // ── Build enhanced motion prompt ──────────────────────────────────────
  const buildMotionPrompt = useCallback((clip: TimelineClip): string => {
    const base = clip.metadata?.imagePrompt || clip.title || "cinematic scene, professional music video";
    const performanceMap: Record<PerformanceType, string> = {
      singing: "vocal performance, singing with emotion",
      dancing: "choreographed dance movement, rhythmic body motion",
      talking: "natural speaking gestures, conversational movement",
      reacting: "emotional facial expressions, reactive body language",
      instrumental: "playing instrument with passion, rhythmic hand movement",
      ambient: "atmospheric scene, environmental movement",
    };
    const complexityMap: Record<MotionComplexity, string> = {
      minimal: "subtle minimal movement",
      moderate: "natural flowing movement",
      high: "dynamic energetic movement",
      cinematic: "complex cinematic motion with depth",
    };
    const cameraMap: Record<CameraStyle, string> = {
      static: "stable locked-off camera",
      pan: "smooth horizontal pan",
      dolly: "dolly push with depth",
      tracking: "tracking shot following subject",
      crane: "vertical crane movement",
      handheld: "subtle handheld shake for authenticity",
      drone: "aerial drone movement",
      zoom: "slow cinematic zoom",
    };
    const intensityDesc = movementIntensity < 0.3 ? "gentle" : movementIntensity < 0.6 ? "moderate" : movementIntensity < 0.8 ? "strong" : "explosive";
    const emotionDesc = emotionIntensity < 0.3 ? "subtle emotion" : emotionIntensity < 0.6 ? "visible emotion" : emotionIntensity < 0.8 ? "intense emotion" : "raw passionate emotion";

    return [
      base,
      performanceMap[performanceType],
      complexityMap[motionComplexity],
      cameraMap[cameraStyle],
      `${intensityDesc} body movement`,
      emotionDesc,
      "professional music video quality, cinematic lighting"
    ].join(", ");
  }, [movementIntensity, emotionIntensity, performanceType, motionComplexity, cameraStyle]);

  // ── Generate Video for a single clip ──────────────────────────────────
  const generateForClip = useCallback(async (clip: TimelineClip) => {
    const clipId = clip.id;
    const imageUrl = clip.imageUrl || clip.url;
    if (!imageUrl) return;

    setJobs(prev => {
      const next = new Map(prev);
      next.set(clipId, { clipId, status: "generating", progress: 10, startedAt: Date.now() });
      return next;
    });

    const prompt = buildMotionPrompt(clip);
    const modelInfo = MODEL_INFO[videoModel];
    logger.info(`🎬 [Motion] Generating video for clip ${clipId} with ${videoModel}`);
    logger.info(`🎬 [Motion] Prompt: ${prompt}`);

    try {
      if (videoModel === "grok") {
        // ── Grok: synchronous response ──
        setJobs(prev => {
          const next = new Map(prev);
          const job = next.get(clipId);
          if (job) next.set(clipId, { ...job, progress: 30 });
          return next;
        });

        const res = await fetch("/api/fal/grok-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            prompt,
            duration: Math.min(clip.duration || 6, modelInfo.maxDuration),
            resolution: "720p",
            aspectRatio: "16:9",
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Grok video generation failed");
        }

        const data = await res.json();
        if (!data.videoUrl) throw new Error("No video URL returned");

        // Success
        setJobs(prev => {
          const next = new Map(prev);
          next.set(clipId, { clipId, status: "completed", progress: 100, videoUrl: data.videoUrl });
          return next;
        });

        onUpdateClip?.(clipId, {
          videoUrl: data.videoUrl,
          metadata: {
            ...clip.metadata,
            videoUrl: data.videoUrl,
            videoGeneratedAt: new Date().toISOString(),
            hasVideo: true,
            generatedWith: "grok-imagine-video",
            motionPrompt: prompt,
            videoDuration: data.duration,
            videoWidth: data.width,
            videoHeight: data.height,
          },
        });

        logger.info(`✅ [Motion] Grok video completed for clip ${clipId}`);
      } else {
        // ── Kling: async queue with polling ──
        const modelMap: Record<string, string> = {
          "kling-o1-pro": "o1-pro-i2v",
          "kling-o1-standard": "o1-standard-i2v",
          "kling-v2.1-pro": "v2.1-pro-i2v",
          "kling-v2.1-standard": "v2.1-standard-i2v",
        };

        setJobs(prev => {
          const next = new Map(prev);
          const job = next.get(clipId);
          if (job) next.set(clipId, { ...job, progress: 15 });
          return next;
        });

        const res = await fetch("/api/fal/kling-video/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            prompt,
            duration: Math.min(clip.duration || 5, modelInfo.maxDuration) <= 5 ? "5" : "10",
            aspectRatio: "16:9",
            model: modelMap[videoModel],
            cfgScale,
            negativePrompt,
            motionInstructions: {
              cameraMovement: cameraStyle,
              movementSpeed: movementIntensity < 0.3 ? "slow" : movementIntensity < 0.7 ? "medium" : "fast",
              audioEnergy: emotionIntensity < 0.3 ? "low" : emotionIntensity < 0.7 ? "medium" : "high",
              emotion: performanceType,
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Kling video generation failed");
        }

        const data = await res.json();

        if (data.videoUrl) {
          // Immediate result
          setJobs(prev => {
            const next = new Map(prev);
            next.set(clipId, { clipId, status: "completed", progress: 100, videoUrl: data.videoUrl });
            return next;
          });
          onUpdateClip?.(clipId, {
            videoUrl: data.videoUrl,
            metadata: { ...clip.metadata, videoUrl: data.videoUrl, hasVideo: true, videoGeneratedAt: new Date().toISOString(), generatedWith: videoModel, motionPrompt: prompt },
          });
        } else if (data.requestId) {
          // Start polling
          setJobs(prev => {
            const next = new Map(prev);
            next.set(clipId, { clipId, status: "generating", progress: 25 });
            return next;
          });

          let attempts = 0;
          const maxAttempts = 120;
          const pollInterval = setInterval(async () => {
            attempts++;
            try {
              const pollRes = await fetch(`/api/fal/kling-video/${data.requestId}?model=${modelMap[videoModel]}`);
              const pollData = await pollRes.json();

              const pct = Math.min(25 + Math.round((attempts / maxAttempts) * 70), 95);
              setJobs(prev => {
                const next = new Map(prev);
                const job = next.get(clipId);
                if (job && job.status === "generating") next.set(clipId, { ...job, progress: pct });
                return next;
              });

              if (pollData.status === "completed" && pollData.videoUrl) {
                clearInterval(pollInterval);
                pollingRef.current.delete(clipId);
                setJobs(prev => {
                  const next = new Map(prev);
                  next.set(clipId, { clipId, status: "completed", progress: 100, videoUrl: pollData.videoUrl });
                  return next;
                });
                onUpdateClip?.(clipId, {
                  videoUrl: pollData.videoUrl,
                  metadata: { ...clip.metadata, videoUrl: pollData.videoUrl, hasVideo: true, videoGeneratedAt: new Date().toISOString(), generatedWith: videoModel, motionPrompt: prompt },
                });
                logger.info(`✅ [Motion] Kling video completed for clip ${clipId}`);
              } else if (pollData.status === "failed" || attempts >= maxAttempts) {
                clearInterval(pollInterval);
                pollingRef.current.delete(clipId);
                setJobs(prev => {
                  const next = new Map(prev);
                  next.set(clipId, { clipId, status: "error", progress: 0, error: pollData.error || "Timeout" });
                  return next;
                });
              }
            } catch {
              // continue polling
            }
          }, 5000);
          pollingRef.current.set(clipId, pollInterval);
        } else {
          throw new Error("No videoUrl or requestId returned");
        }
      }
    } catch (err: any) {
      logger.error(`❌ [Motion] Error clip ${clipId}:`, err);
      setJobs(prev => {
        const next = new Map(prev);
        next.set(clipId, { clipId, status: "error", progress: 0, error: err.message });
        return next;
      });
    }
  }, [videoModel, buildMotionPrompt, cfgScale, negativePrompt, cameraStyle, movementIntensity, emotionIntensity, performanceType, onUpdateClip]);

  // ── Generate for all target clips ─────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (targetClips.length === 0) {
      toast({ title: "Sin clips", description: "No hay clips de imagen seleccionados para generar video", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setJobs(new Map());

    toast({
      title: `🎬 Generando ${targetClips.length} video(s)`,
      description: `Modelo: ${MODEL_INFO[videoModel].label}`,
    });

    // Generate sequentially to avoid rate limits
    for (const clip of targetClips) {
      await generateForClip(clip);
    }

    setIsGenerating(false);
    toast({
      title: "✅ Generación completada",
      description: `${targetClips.length} video(s) procesados`,
    });
  }, [targetClips, generateForClip, videoModel, toast]);

  // ─── If not open, render nothing ──────────────────────────────────────
  if (!open) return null;

  // ─── RENDER: Full-screen overlay panel ────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-3xl max-h-[92vh] mx-4 rounded-xl bg-neutral-950 border border-white/10 shadow-2xl flex flex-col overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-neutral-950 via-neutral-900 to-orange-950/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Wand2 className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Motion Control & Video Generation</h2>
              <p className="text-xs text-white/50">
                Ajusta movimiento, emoción y genera videos desde tus clips de imagen
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "#3f3f46 #18181b" }}>

          {/* No clips warning */}
          {imageClips.length === 0 && (
            <Card className="p-6 bg-yellow-500/10 border-yellow-500/30 text-center">
              <AlertCircle className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">Sin clips de imagen en el timeline</h3>
              <p className="text-sm text-white/60">
                Importa imágenes o genera escenas primero. Los clips de imagen en la capa "Video/Imágenes" aparecerán aquí.
              </p>
            </Card>
          )}

          {imageClips.length > 0 && (
            <>
              {/* ── Scene Selection ─────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white">Seleccionar Escena</label>
                  <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => setSelectAll(e.target.checked)}
                      className="rounded border-white/30 bg-white/10 text-orange-500 focus:ring-orange-500"
                    />
                    Generar todas ({imageClips.length})
                  </label>
                </div>

                {!selectAll && (
                  <Select
                    value={selectedClipId !== null ? String(selectedClipId) : ""}
                    onValueChange={(val) => setSelectedClipId(Number(val))}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Selecciona un clip..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10">
                      {imageClips.map((clip, idx) => (
                        <SelectItem key={clip.id} value={String(clip.id)} className="text-white focus:bg-orange-500/20">
                          <span className="flex items-center gap-2">
                            <Image className="h-3.5 w-3.5 text-orange-400" />
                            Escena {idx + 1} — {clip.title || `Clip ${clip.id}`}
                            <span className="text-white/40 ml-1">({clip.duration.toFixed(1)}s @ {clip.start.toFixed(1)}s)</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Thumbnail preview strip */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
                  {imageClips.map((clip, idx) => {
                    const isSelected = selectAll || clip.id === selectedClipId;
                    const job = jobs.get(clip.id);
                    return (
                      <button
                        key={clip.id}
                        onClick={() => { setSelectAll(false); setSelectedClipId(clip.id); }}
                        className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected ? "border-orange-500 ring-1 ring-orange-500/40" : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <img
                          src={clip.imageUrl || clip.url}
                          alt={clip.title || `Scene ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] text-white text-center py-0.5 font-mono">
                          {clip.duration.toFixed(1)}s
                        </div>
                        {job?.status === "completed" && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          </div>
                        )}
                        {job?.status === "generating" && (
                          <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-orange-400 animate-spin" />
                          </div>
                        )}
                        {job?.status === "error" && (
                          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Selected Scene Info ─────────────────────────────── */}
              {selectedClip && !selectAll && (
                <Card className="p-3 bg-white/5 border-white/10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-white/40 mb-0.5">Tipo</p>
                      <Badge variant="outline" className="text-orange-300 border-orange-500/30">{selectedClip.type}</Badge>
                    </div>
                    <div>
                      <p className="text-white/40 mb-0.5">Duración</p>
                      <p className="font-semibold text-white">{selectedClip.duration.toFixed(1)}s</p>
                    </div>
                    <div>
                      <p className="text-white/40 mb-0.5">Inicio</p>
                      <p className="font-semibold text-white">{selectedClip.start.toFixed(1)}s</p>
                    </div>
                    <div>
                      <p className="text-white/40 mb-0.5">Fuente</p>
                      <p className="font-semibold text-white truncate max-w-[100px]" title={selectedClip.title || "—"}>
                        {selectedClip.title || "—"}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* ── AI Model Selection ──────────────────────────────── */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  Modelo de IA
                </label>
                <Select value={videoModel} onValueChange={(val) => setVideoModel(val as VideoModel)}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-white/10">
                    {Object.entries(MODEL_INFO).map(([key, info]) => (
                      <SelectItem key={key} value={key} className="text-white focus:bg-orange-500/20">
                        <span className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span>{info.label}</span>
                          <Badge variant="secondary" className="ml-1 text-[9px] py-0 px-1">{info.speed}</Badge>
                          <Badge variant="outline" className="text-[9px] py-0 px-1">{info.quality}</Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ── Performance Type ────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Tipo de Performance</label>
                  <Select value={performanceType} onValueChange={(val) => setPerformanceType(val as PerformanceType)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10">
                      <SelectItem value="singing" className="text-white focus:bg-orange-500/20">🎤 Cantando</SelectItem>
                      <SelectItem value="dancing" className="text-white focus:bg-orange-500/20">💃 Bailando</SelectItem>
                      <SelectItem value="talking" className="text-white focus:bg-orange-500/20">🗣️ Hablando</SelectItem>
                      <SelectItem value="reacting" className="text-white focus:bg-orange-500/20">😊 Reaccionando</SelectItem>
                      <SelectItem value="instrumental" className="text-white focus:bg-orange-500/20">🎸 Instrumental</SelectItem>
                      <SelectItem value="ambient" className="text-white focus:bg-orange-500/20">🌫️ Ambiental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Complejidad de Movimiento</label>
                  <Select value={motionComplexity} onValueChange={(val) => setMotionComplexity(val as MotionComplexity)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10">
                      <SelectItem value="minimal" className="text-white focus:bg-orange-500/20">⚪ Minimal — Sutil</SelectItem>
                      <SelectItem value="moderate" className="text-white focus:bg-orange-500/20">🟡 Moderado — Natural</SelectItem>
                      <SelectItem value="high" className="text-white focus:bg-orange-500/20">🔴 Alto — Dinámico</SelectItem>
                      <SelectItem value="cinematic" className="text-white focus:bg-orange-500/20">🎬 Cinemático — Complejo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ── Camera Style ────────────────────────────────────── */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <Film className="h-4 w-4 text-blue-400" />
                  Movimiento de Cámara
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([
                    { value: "static" as CameraStyle, label: "Estática", icon: "⏸️" },
                    { value: "pan" as CameraStyle, label: "Pan", icon: "↔️" },
                    { value: "dolly" as CameraStyle, label: "Dolly", icon: "🎥" },
                    { value: "tracking" as CameraStyle, label: "Tracking", icon: "🏃" },
                    { value: "crane" as CameraStyle, label: "Crane", icon: "🏗️" },
                    { value: "handheld" as CameraStyle, label: "Handheld", icon: "✋" },
                    { value: "drone" as CameraStyle, label: "Drone", icon: "🚁" },
                    { value: "zoom" as CameraStyle, label: "Zoom", icon: "🔍" },
                  ]).map(cam => (
                    <button
                      key={cam.value}
                      onClick={() => setCameraStyle(cam.value)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-lg text-xs transition-all ${
                        cameraStyle === cam.value
                          ? "bg-orange-500/20 border border-orange-500/50 text-orange-300"
                          : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{cam.icon}</span>
                      <span className="font-medium">{cam.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Sliders ────────────────────────────────────────── */}
              <div className="space-y-4">
                {/* Movement Intensity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white">Intensidad de Movimiento</label>
                    <Badge className="bg-orange-500 text-white text-xs">{Math.round(movementIntensity * 100)}%</Badge>
                  </div>
                  <Slider
                    value={[movementIntensity]}
                    onValueChange={(val) => setMovementIntensity(val[0])}
                    min={0} max={1} step={0.05}
                    className="w-full"
                  />
                  <p className="text-[10px] text-white/40">
                    {movementIntensity < 0.3 ? "Sutil — movimiento mínimo del cuerpo"
                      : movementIntensity < 0.6 ? "Moderado — movimiento natural y fluido"
                      : movementIntensity < 0.8 ? "Dinámico — movimientos energéticos"
                      : "Explosivo — intensidad cinematográfica"}
                  </p>
                </div>

                {/* Emotion Intensity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white">Intensidad Emocional</label>
                    <Badge className="bg-purple-500 text-white text-xs">{Math.round(emotionIntensity * 100)}%</Badge>
                  </div>
                  <Slider
                    value={[emotionIntensity]}
                    onValueChange={(val) => setEmotionIntensity(val[0])}
                    min={0} max={1} step={0.05}
                    className="w-full"
                  />
                  <p className="text-[10px] text-white/40">
                    {emotionIntensity < 0.3 ? "Sutil — emoción contenida"
                      : emotionIntensity < 0.6 ? "Visible — expresión natural"
                      : emotionIntensity < 0.8 ? "Intensa — emoción fuerte"
                      : "Pasional — expresión cruda e intensa"}
                  </p>
                </div>
              </div>

              {/* ── Advanced Options (collapsible) ──────────────────── */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors w-full"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Opciones Avanzadas</span>
                {showAdvanced ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
              </button>

              {showAdvanced && (
                <Card className="p-4 bg-white/5 border-white/10 space-y-4">
                  {/* CFG Scale */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-white">CFG Scale (Adherencia al prompt)</label>
                      <span className="text-xs text-white/50">{cfgScale.toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[cfgScale]}
                      onValueChange={(val) => setCfgScale(val[0])}
                      min={0} max={1} step={0.05}
                      className="w-full"
                    />
                  </div>

                  {/* Negative Prompt */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white">Prompt Negativo</label>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Qué evitar en el video..."
                    />
                  </div>

                  {/* Generated Prompt Preview */}
                  {selectedClip && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-white/60">Prompt generado (preview)</label>
                      <div className="bg-black/40 rounded-lg p-2 text-[10px] text-white/50 font-mono leading-relaxed max-h-20 overflow-y-auto">
                        {buildMotionPrompt(selectedClip)}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* ── Generation Progress ────────────────────────────── */}
              {jobs.size > 0 && (
                <Card className="p-4 bg-white/5 border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-orange-400" />
                      Progreso de Generación
                    </h4>
                    {isGenerating && (
                      <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatElapsed(elapsedMs)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> {completedCount} completados</span>
                    {errorCount > 0 && <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-400" /> {errorCount} errores</span>}
                    <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5 text-orange-400" /> {jobs.size} total</span>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                    {Array.from(jobs.entries()).map(([clipId, job]) => {
                      const clip = imageClips.find(c => c.id === clipId);
                      return (
                        <div key={clipId} className="flex items-center gap-2">
                          <div className="w-8 h-6 rounded overflow-hidden flex-shrink-0 bg-white/10">
                            {clip && <img src={clip.imageUrl || clip.url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[10px] text-white/60 truncate">{clip?.title || `Clip ${clipId}`}</span>
                              <span className="text-[10px] text-white/40">
                                {job.status === "completed" ? "✅" : job.status === "error" ? "❌" : job.status === "generating" ? "⏳" : "⏸️"}
                              </span>
                            </div>
                            <Progress value={job.progress} className="h-1.5" />
                            {job.error && <p className="text-[9px] text-red-400 mt-0.5 truncate">{job.error}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* ── Info Card ──────────────────────────────────────── */}
              <Card className="p-3 bg-blue-500/10 border-blue-500/20 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-white/60">
                  <p className="font-semibold text-white/80 mb-0.5">Generación de Video con IA</p>
                  <p>
                    Los parámetros de movimiento y emoción se envían a {MODEL_INFO[videoModel].label} para
                    generar video animado desde la imagen del clip. El video reemplazará la imagen estática en el timeline.
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* ── Footer / Action Buttons ────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-neutral-950 flex-shrink-0">
          <div className="text-xs text-white/40">
            {targetClips.length > 0 ? (
              <span>{selectAll ? "Todas las escenas" : "1 escena"} · {MODEL_INFO[videoModel].label}</span>
            ) : (
              <span>Selecciona al menos una escena</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="border-white/10 text-white/70 hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={targetClips.length === 0 || isGenerating}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 min-w-[180px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando {completedCount}/{targetClips.length}...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Generar Video{targetClips.length > 1 ? `s (${targetClips.length})` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
