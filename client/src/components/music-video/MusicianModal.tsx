import { useState, useEffect, useCallback, useMemo } from "react";
import { logger } from "../../lib/logger";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Music, Guitar, Piano, Mic, Drum, Loader2,
  X, Clock, RefreshCw, Check, ChevronRight, Wand2,
  Image as ImageIcon, Zap, Eye, Save,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

// ── Instrument Definitions ──────────────────────────────────────
const INSTRUMENTS = [
  { id: "guitar",    name: "Guitarra",  icon: Guitar, emoji: "🎸", color: "#f97316" },
  { id: "piano",     name: "Piano",     icon: Piano,  emoji: "🎹", color: "#8b5cf6" },
  { id: "bass",      name: "Bajo",      icon: Music,  emoji: "🎸", color: "#06b6d4" },
  { id: "drums",     name: "Batería",   icon: Drum,   emoji: "🥁", color: "#ef4444" },
  { id: "vocals",    name: "Voz",       icon: Mic,    emoji: "🎤", color: "#ec4899" },
  { id: "saxophone", name: "Saxofón",   icon: Music,  emoji: "🎷", color: "#f59e0b" },
  { id: "trumpet",   name: "Trompeta",  icon: Music,  emoji: "🎺", color: "#10b981" },
  { id: "violin",    name: "Violín",    icon: Music,  emoji: "🎻", color: "#6366f1" },
] as const;

// ── Style Presets ───────────────────────────────────────────────
const STYLE_PRESETS = [
  { id: "rock",      label: "🤘 Rock",       desc: "leather jacket, tattoos, edgy stage presence, electric energy" },
  { id: "jazz",      label: "🎩 Jazz",       desc: "elegant suit, dim club lighting, smooth sophisticated vibe" },
  { id: "classical", label: "🎼 Clásico",    desc: "formal attire, concert hall, refined and poised" },
  { id: "hiphop",    label: "🔥 Hip-Hop",    desc: "urban streetwear, chains, confident stance, neon lights" },
  { id: "latin",     label: "💃 Latino",     desc: "vibrant colors, tropical setting, passionate energy" },
  { id: "indie",     label: "🌙 Indie",      desc: "vintage clothes, soft golden hour light, dreamy atmosphere" },
  { id: "electronic",label: "⚡ Electrónica", desc: "futuristic outfit, LED lights, neon glow, cyberpunk" },
  { id: "folk",      label: "🌿 Folk",       desc: "acoustic, rustic setting, warm earth tones, natural light" },
] as const;

// ── Types ───────────────────────────────────────────────────────
interface MusicianModalProps {
  open: boolean;
  onClose: () => void;
  timelineItem: {
    id: string;
    timestamp: number;
    imageUrl?: string;
  };
  scriptContext: string;
  director?: {
    name: string;
    style: string;
  };
  concept?: string;
  narrativeSummary?: string;
  projectId?: number;
  onMusicianCreated: (musicianData: any) => void;
}

// ── Helper: format seconds to mm:ss.d ───────────────────────────
function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const d = Math.floor((sec % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${d}`;
}

// ═══════════════════════════════════════════════════════════════
// 🎸 MusicianModal — Full-screen Cinematic Overlay
// ═══════════════════════════════════════════════════════════════
export function MusicianModal({
  open,
  onClose,
  timelineItem,
  scriptContext,
  director,
  concept,
  narrativeSummary,
  projectId,
  onMusicianCreated,
}: MusicianModalProps) {
  const { toast } = useToast();

  // ── State ─────────────────────────────────────────────────
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [musicianDescription, setMusicianDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [generationCount, setGenerationCount] = useState(0);

  // ── Queries ───────────────────────────────────────────────
  const { data: previousMusicians } = useQuery({
    queryKey: ["/api/musician-clips/project", projectId],
    enabled: !!projectId && open,
  });

  // Auto-fill description from previously saved musician of same instrument
  useEffect(() => {
    if (selectedInstrument && previousMusicians && Array.isArray(previousMusicians)) {
      const prev = previousMusicians.find(
        (m: any) => m.musicianType === selectedInstrument && m.characterDescription
      );
      if (prev) {
        setMusicianDescription(prev.characterDescription);
        logger.info(`✅ Loaded previous description for ${selectedInstrument}`);
      }
    }
  }, [selectedInstrument, previousMusicians]);

  // ── Current instrument object ─────────────────────────────
  const instrument = useMemo(
    () => INSTRUMENTS.find((i) => i.id === selectedInstrument),
    [selectedInstrument]
  );

  // ── Mutations ─────────────────────────────────────────────
  const generateImageMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch("/api/musician-clips/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate image");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      setGenerationCount((c) => c + 1);
      toast({ title: "🎸 Músico generado", description: "Imagen creada con IA exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error de generación", description: error.message, variant: "destructive" });
    },
  });

  const saveMusicianMutation = useMutation({
    mutationFn: async (musicianData: any) => {
      const res = await fetch("/api/musician-clips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(musicianData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save musician");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "✅ Músico guardado", description: "Añadido al timeline correctamente" });
      onMusicianCreated(data.musicianClip);
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    },
  });

  // ── Handlers ──────────────────────────────────────────────
  const handleInstrumentSelect = useCallback(
    (id: string) => {
      setSelectedInstrument(id);
      setGeneratedImageUrl("");
      setGenerationCount(0);
      // Only reset description if no saved musician exists for this instrument
      const hasSaved = previousMusicians?.find((m: any) => m.musicianType === id);
      if (!hasSaved) setMusicianDescription("");
      setSelectedPreset("");
    },
    [previousMusicians]
  );

  const handlePresetSelect = useCallback((presetId: string, presetDesc: string) => {
    setSelectedPreset(presetId);
    setMusicianDescription(presetDesc);
  }, []);

  const handleGenerate = useCallback(() => {
    if (!selectedInstrument) {
      toast({ title: "Selecciona instrumento", description: "Elige un instrumento primero", variant: "destructive" });
      return;
    }
    if (!musicianDescription.trim()) {
      toast({ title: "Falta descripción", description: "Describe cómo quieres que sea el músico", variant: "destructive" });
      return;
    }

    const fullPrompt = [
      `MUSIC VIDEO CONTEXT:`,
      narrativeSummary ? `Overall Story: ${narrativeSummary}` : null,
      concept ? `Visual Concept: ${concept}` : null,
      director ? `Director Style: ${director.name} - ${director.style}` : null,
      ``,
      `MUSICIAN CHARACTER:`,
      `Instrument: ${instrument?.name}`,
      `Description: ${musicianDescription}`,
      `Scene Context: ${scriptContext || "Performance scene"}`,
      `Timestamp: ${timelineItem.timestamp.toFixed(2)}s`,
      ``,
      `REQUIREMENTS:`,
      `- Professional ${instrument?.name} player in cinematic music video setting`,
      `- Must match the overall visual concept and director's style`,
      `- Character should feel integrated into the video's narrative world`,
      `- Photorealistic, professional lighting, 8K resolution`,
      `- Cinematic composition with depth and atmosphere`,
      `- Consistent with the music video's aesthetic`,
      ``,
      `Create a stunning, context-appropriate musician character.`,
    ]
      .filter(Boolean)
      .join("\n");

    logger.info("🎸 Generating musician:", fullPrompt);
    generateImageMutation.mutate(fullPrompt);
  }, [selectedInstrument, musicianDescription, instrument, narrativeSummary, concept, director, scriptContext, timelineItem, generateImageMutation, toast]);

  const handleSave = useCallback(() => {
    if (!generatedImageUrl || !selectedInstrument) {
      toast({ title: "Incompleto", description: "Genera una imagen antes de guardar", variant: "destructive" });
      return;
    }
    saveMusicianMutation.mutate({
      projectId,
      timelineItemId: timelineItem.id,
      musicianType: selectedInstrument,
      characterDescription: musicianDescription,
      generatedImageUrl,
      scriptContext,
      cutTimestamp: timelineItem.timestamp.toString(),
    });
  }, [generatedImageUrl, selectedInstrument, musicianDescription, projectId, timelineItem, scriptContext, saveMusicianMutation, toast]);

  const handleClose = useCallback(() => {
    setSelectedInstrument("");
    setMusicianDescription("");
    setGeneratedImageUrl("");
    setSelectedPreset("");
    setGenerationCount(0);
    onClose();
  }, [onClose]);

  // ── Don't render when closed ──────────────────────────────
  if (!open) return null;

  // ── Current workflow step ─────────────────────────────────
  const step = !selectedInstrument ? 1 : !generatedImageUrl ? 2 : 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Overlay container */}
      <div className="relative w-[96vw] max-w-5xl max-h-[92vh] rounded-xl border border-white/10 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 shadow-2xl overflow-hidden flex flex-col">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: instrument ? `${instrument.color}22` : "rgba(168,85,247,0.12)" }}
            >
              <Music className="w-5 h-5" style={{ color: instrument?.color || "#a855f7" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Añadir Músico al Timeline
              </h2>
              <p className="text-xs text-white/50 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Posición: {fmtTime(timelineItem.timestamp)}
                {instrument && (
                  <>
                    <span className="mx-1 text-white/20">•</span>
                    <span style={{ color: instrument.color }}>{instrument.emoji} {instrument.name}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mr-10">
            {[
              { n: 1, label: "Instrumento" },
              { n: 2, label: "Describir" },
              { n: 3, label: "Aplicar" },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                    step > s.n
                      ? "bg-green-500 text-white"
                      : step === s.n
                      ? "bg-orange-500 text-white ring-2 ring-orange-500/40"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {step > s.n ? <Check className="w-3 h-3" /> : s.n}
                </div>
                <span className={`text-[10px] hidden sm:inline ${step >= s.n ? "text-white/70" : "text-white/30"}`}>
                  {s.label}
                </span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-white/20" />}
              </div>
            ))}
          </div>

          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* ── Body — scrollable ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── STEP 1: Instrument Grid ──────────────────── */}
          <section>
            <Label className="text-sm font-semibold text-white/70 mb-2 block">
              1 · Selecciona instrumento
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {INSTRUMENTS.map((inst) => {
                const active = selectedInstrument === inst.id;
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleInstrumentSelect(inst.id)}
                    className={`relative group rounded-xl p-3 text-center transition-all duration-200 border ${
                      active
                        ? "border-2 scale-[1.04] shadow-lg"
                        : "border-white/8 hover:border-white/20 hover:bg-white/5"
                    }`}
                    style={
                      active
                        ? {
                            borderColor: inst.color,
                            background: `${inst.color}15`,
                            boxShadow: `0 0 20px ${inst.color}30`,
                          }
                        : undefined
                    }
                    data-testid={`instrument-${inst.id}`}
                  >
                    <div className="text-3xl mb-1 transition-transform group-hover:scale-110">
                      {inst.emoji}
                    </div>
                    <div
                      className={`text-[11px] font-medium transition-colors ${
                        active ? "text-white" : "text-white/50 group-hover:text-white/70"
                      }`}
                    >
                      {inst.name}
                    </div>
                    {active && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: inst.color }}
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── STEP 2: Description + Style + Scene Context ── */}
          {selectedInstrument && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Scene context row */}
              <div className="flex gap-3 items-start">
                {/* Scene thumbnail */}
                {timelineItem.imageUrl && (
                  <div className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden border border-white/10 relative">
                    <img
                      src={timelineItem.imageUrl}
                      alt="Escena"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-0.5">
                      <span className="text-[9px] text-white/80 font-mono">{fmtTime(timelineItem.timestamp)}</span>
                    </div>
                  </div>
                )}
                {/* Context info */}
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-semibold text-white/70 mb-1.5 block">
                    2 · Describe tu músico
                  </Label>
                  {scriptContext && (
                    <p className="text-[11px] text-white/40 line-clamp-2 mb-1.5">
                      <Eye className="w-3 h-3 inline mr-1 text-white/30" />
                      Contexto de escena: {scriptContext}
                    </p>
                  )}
                  {director && (
                    <p className="text-[11px] text-white/40">
                      🎬 Director: {director.name} — {director.style}
                    </p>
                  )}
                </div>
              </div>

              {/* Style presets */}
              <div>
                <Label className="text-xs text-white/40 mb-1.5 block">Estilos rápidos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset.id, preset.desc)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                        selectedPreset === preset.id
                          ? "bg-orange-500/20 border-orange-500/60 text-orange-300"
                          : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description textarea */}
              <div
                className="rounded-lg border-2 p-4 transition-colors"
                style={{
                  borderColor: instrument ? `${instrument.color}40` : "rgba(168,85,247,0.25)",
                  background: instrument ? `${instrument.color}08` : "rgba(168,85,247,0.03)",
                }}
              >
                <Textarea
                  value={musicianDescription}
                  onChange={(e) => setMusicianDescription(e.target.value)}
                  placeholder={`Describe al ${instrument?.name || "músico"}: edad, género, vestimenta, pose, ambiente...`}
                  className="bg-transparent border-0 resize-none text-sm text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[80px]"
                  data-testid="input-musician-description"
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <p className="text-[10px] text-white/30">
                    💡 Sé específico: edad, estilo, ropa, pose. Se reutilizará para consistencia.
                  </p>
                  <span className="text-[10px] text-white/20">{musicianDescription.length} chars</span>
                </div>
              </div>

              {/* Generate button */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={generateImageMutation.isPending || !musicianDescription.trim()}
                  className="h-10 px-5 rounded-lg font-semibold transition-all"
                  style={{
                    background: instrument
                      ? `linear-gradient(135deg, ${instrument.color}, ${instrument.color}cc)`
                      : "linear-gradient(135deg, #a855f7, #7c3aed)",
                    opacity: generateImageMutation.isPending || !musicianDescription.trim() ? 0.5 : 1,
                  }}
                  data-testid="button-generate-image"
                >
                  {generateImageMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando con IA...
                    </>
                  ) : generationCount > 0 ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerar
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generar Músico
                    </>
                  )}
                </Button>

                {generationCount > 0 && (
                  <span className="text-[10px] text-white/30">
                    Generación #{generationCount}
                  </span>
                )}
              </div>
            </section>
          )}

          {/* ── STEP 3: Preview + Apply ──────────────────── */}
          {generatedImageUrl && (
            <section className="animate-in fade-in slide-in-from-bottom-3 duration-400 space-y-3">
              <Label className="text-sm font-semibold text-white/70 block">
                3 · Resultado
              </Label>

              <div className="flex gap-4 items-start">
                {/* Generated image */}
                <div
                  className="relative flex-1 rounded-xl overflow-hidden border-2 shadow-lg"
                  style={{ borderColor: `${instrument?.color || "#a855f7"}50` }}
                >
                  <img
                    src={generatedImageUrl}
                    alt="Músico generado"
                    className="w-full object-cover max-h-[340px]"
                    data-testid="img-generated-musician"
                  />
                  {/* Overlay badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur px-2 py-1 rounded-md">
                    <span className="text-sm">{instrument?.emoji}</span>
                    <span className="text-[11px] text-white/80 font-medium">{instrument?.name}</span>
                  </div>
                  <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur px-2 py-0.5 rounded-md">
                    <span className="text-[10px] text-white font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> IA
                    </span>
                  </div>
                </div>

                {/* Scene context side panel (if scene image exists) */}
                {timelineItem.imageUrl && (
                  <div className="flex-shrink-0 w-36 space-y-2">
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Escena objetivo</p>
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={timelineItem.imageUrl}
                        alt="Escena"
                        className="w-full h-24 object-cover"
                      />
                    </div>
                    <div className="text-[10px] text-white/30 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtTime(timelineItem.timestamp)}
                      </div>
                      {director && (
                        <div>🎬 {director.name}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Info strip */}
              <div className="flex items-center gap-4 text-[10px] text-white/30 px-1">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Generada con Gemini
                </span>
                <span className="flex items-center gap-1">
                  <Music className="w-3 h-3" /> {instrument?.name}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtTime(timelineItem.timestamp)}
                </span>
              </div>
            </section>
          )}
        </div>

        {/* ── Footer actions ──────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-black/40 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-white/50 hover:text-white hover:bg-white/10 h-9"
            data-testid="button-cancel"
          >
            <X className="w-4 h-4 mr-1.5" />
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {generatedImageUrl && (
              <>
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={generateImageMutation.isPending}
                  className="h-9 border-white/15 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${generateImageMutation.isPending ? "animate-spin" : ""}`} />
                  Regenerar
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saveMusicianMutation.isPending}
                  className="h-9 px-5 bg-green-600 hover:bg-green-500 text-white font-semibold"
                  data-testid="button-save-musician"
                >
                  {saveMusicianMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" />
                      Aplicar al Timeline
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
