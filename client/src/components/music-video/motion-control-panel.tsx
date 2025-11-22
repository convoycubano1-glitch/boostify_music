/**
 * Motion Control Panel
 * UI para ajustar intensidad de movimiento y parámetros de video generation
 * Integración con Motion Descriptor Engine para control fino
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Play, Settings, AlertCircle, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import type { MusicVideoScene } from "@/types/music-video-scene";

interface MotionControlPanelProps {
  open: boolean;
  onClose: () => void;
  scenes: MusicVideoScene[];
  onApplyMotion?: (updatedScenes: MusicVideoScene[]) => void;
}

export function MotionControlPanel({ open, onClose, scenes, onApplyMotion }: MotionControlPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(scenes[0]?.scene_id || null);
  const [movementIntensity, setMovementIntensity] = useState(0.5);
  const [emotionIntensity, setEmotionIntensity] = useState(0.5);
  const [performanceType, setPerformanceType] = useState<"singing" | "dancing" | "talking" | "reacting" | "ambient">("singing");
  const [motionComplexity, setMotionComplexity] = useState<"minimal" | "moderate" | "high" | "cinematic">("moderate");

  const selectedScene = scenes.find(s => s.scene_id === selectedSceneId);

  const handleApplyMotion = async () => {
    if (!selectedScene) return;

    setIsGenerating(true);
    logger.info(`🎬 [Motion] Aplicando parámetros a escena ${selectedSceneId}`);

    try {
      // Update scene with new motion parameters
      const updatedScenes = scenes.map(scene => {
        if (scene.scene_id === selectedSceneId && scene.motion_descriptor) {
          return {
            ...scene,
            motion_descriptor: {
              ...scene.motion_descriptor,
              movement_intensity: movementIntensity,
              emotion_intensity: emotionIntensity,
              performance_type: performanceType,
              motion_complexity: motionComplexity
            },
            emotion_intensity: emotionIntensity
          };
        }
        return scene;
      });

      logger.info(`✅ [Motion] Parámetros aplicados exitosamente`);
      onApplyMotion?.(updatedScenes);

      // Close after brief delay
      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 1000);
    } catch (error) {
      logger.error(`❌ [Motion] Error aplicando movimiento:`, error);
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-background via-background to-orange-950/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wand2 className="h-6 w-6 text-orange-500" />
            Motion Control & Video Generation
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Fine-tune movement, emotion, and performance parameters for video generation
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scene Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Select Scene</label>
            <Select value={selectedSceneId || ""} onValueChange={setSelectedSceneId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a scene" />
              </SelectTrigger>
              <SelectContent>
                {scenes.map((scene, idx) => (
                  <SelectItem key={scene.scene_id} value={scene.scene_id}>
                    Scene {idx + 1} - {scene.shot_type} ({scene.duration}s)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedScene && (
            <>
              {/* Current Scene Info */}
              <Card className="p-4 bg-white/5 border-orange-500/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Role</p>
                    <Badge variant="outline">{selectedScene.role}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Duration</p>
                    <p className="font-semibold">{selectedScene.duration}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Emotion</p>
                    <p className="font-semibold capitalize">{selectedScene.emotion || "Neutral"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Camera</p>
                    <p className="font-semibold">{selectedScene.camera_movement}</p>
                  </div>
                </div>
              </Card>

              {/* Performance Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Performance Type</label>
                <Select value={performanceType} onValueChange={(val: any) => setPerformanceType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singing">🎤 Singing (Vocal Performance)</SelectItem>
                    <SelectItem value="dancing">💃 Dancing (Choreographed Movement)</SelectItem>
                    <SelectItem value="talking">🗣️ Talking (Speech)</SelectItem>
                    <SelectItem value="reacting">😊 Reacting (Emotional Reaction)</SelectItem>
                    <SelectItem value="ambient">🌫️ Ambient (Environmental)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Motion Complexity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Motion Complexity</label>
                <Select value={motionComplexity} onValueChange={(val: any) => setMotionComplexity(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">⚪ Minimal (Still, Subtle)</SelectItem>
                    <SelectItem value="moderate">🟡 Moderate (Natural, Flowing)</SelectItem>
                    <SelectItem value="high">🔴 High (Dynamic, Energetic)</SelectItem>
                    <SelectItem value="cinematic">🎬 Cinematic (Complex, Professional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Movement Intensity Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Movement Intensity</label>
                  <Badge className="bg-orange-500">
                    {Math.round(movementIntensity * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[movementIntensity]}
                  onValueChange={(val) => setMovementIntensity(val[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {movementIntensity < 0.3
                    ? "Subtle, minimal body movement"
                    : movementIntensity < 0.6
                    ? "Moderate, natural flowing movement"
                    : movementIntensity < 0.8
                    ? "Dynamic, energetic movements"
                    : "Explosive, cinematic intensity"}
                </p>
              </div>

              {/* Emotion Intensity Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">Emotional Intensity</label>
                  <Badge className="bg-orange-500">
                    {Math.round(emotionIntensity * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[emotionIntensity]}
                  onValueChange={(val) => setEmotionIntensity(val[0])}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {emotionIntensity < 0.3
                    ? "Subtle, understated emotion"
                    : emotionIntensity < 0.6
                    ? "Moderate emotional expression"
                    : emotionIntensity < 0.8
                    ? "Strong, visible emotion"
                    : "Intense, passionate expression"}
                </p>
              </div>

              {/* Info Alert */}
              <Card className="p-3 bg-blue-500/10 border-blue-500/20 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Video Generation Ready</p>
                  <p>
                    These parameters will be sent to FAL AI for video generation with lip-sync and natural movement matching your audio.
                  </p>
                </div>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2"
              onClick={handleApplyMotion}
              disabled={!selectedScene || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Generate Video with FAL
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
