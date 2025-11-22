/**
 * Editor Agent Recommendations Panel
 * Muestra recomendaciones de edición inteligentes del Editor Agent
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Wand2, Loader2, AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger";
import { generateTimelineEditPlan, type TimelineEditPlan } from "@/lib/api/timeline-editor-agent";
import type { TimelineItem } from "@/components/timeline/TimelineClipUnified";

interface EditorAgentPanelProps {
  timeline: TimelineItem[];
  audioBuffer?: AudioBuffer;
  genreHint?: string;
  onApplySuggestions?: (plan: TimelineEditPlan) => void;
}

export const EditorAgentPanel: React.FC<EditorAgentPanelProps> = ({
  timeline,
  audioBuffer,
  genreHint,
  onApplySuggestions,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editPlan, setEditPlan] = useState<TimelineEditPlan | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeTimeline = async () => {
    if (timeline.length === 0) {
      setError("Timeline vacío. Agrega clips antes.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info("🎬 [UI] Generando plan de edición...");
      const plan = await generateTimelineEditPlan(timeline, audioBuffer, genreHint);
      setEditPlan(plan);
      
      // Pre-seleccionar todas las sugerencias
      const allIds = new Set(plan.suggestions.map((_, i) => `suggestion-${i}`));
      setSelectedSuggestions(allIds);
      
      logger.info(`✅ [UI] Plan generado: ${plan.suggestions.length} sugerencias`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      logger.error("❌ [UI] Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestion = (idx: number) => {
    const newSet = new Set(selectedSuggestions);
    const id = `suggestion-${idx}`;
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSuggestions(newSet);
  };

  const handleApplyChanges = () => {
    if (editPlan && onApplySuggestions) {
      const selectedPlan = {
        ...editPlan,
        suggestions: editPlan.suggestions.filter((_, i) => 
          selectedSuggestions.has(`suggestion-${i}`)
        ),
      };
      
      onApplySuggestions(selectedPlan);
      setIsOpen(false);
      logger.info(`✅ [UI] Aplicadas ${selectedPlan.suggestions.length} sugerencias`);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        variant="default"
      >
        <Wand2 className="w-4 h-4" />
        AI Editor Agent
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editor Agent - Timeline Analysis</DialogTitle>
          </DialogHeader>

          {!editPlan ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                El Editor Agent analizará tu timeline, detectará el género y el ritmo,
                y recomendará cambios de edición profesionales.
              </p>

              <Button
                onClick={handleAnalyzeTimeline}
                disabled={isLoading}
                className="w-full gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Analizando..." : "Analizar Timeline"}
              </Button>

              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Editor Info */}
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Recommended Editor</h3>
                <p className="text-lg font-bold">{editPlan.editor.name}</p>
                <p className="text-sm text-gray-600 mt-2">{editPlan.editor.signature_style.description}</p>
                
                <div className="mt-3 flex gap-2">
                  <Badge variant="secondary">
                    Pace: {editPlan.editor.signature_style.pace}
                  </Badge>
                  <Badge variant="secondary">
                    BPM: {Math.round(editPlan.editor.signature_style.description.charCodeAt(0) || 120)}
                  </Badge>
                </div>
              </Card>

              {/* Confidence Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Confidence Score</label>
                  <span className="text-sm font-semibold">
                    {(editPlan.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={editPlan.confidence_score * 100} />
              </div>

              {/* Overall Approach */}
              <Card className="p-4 bg-blue-50">
                <h4 className="font-semibold text-sm mb-2">Editing Approach</h4>
                <p className="text-sm">{editPlan.overall_approach}</p>
              </Card>

              {/* Expected Impact */}
              <Card className="p-4 bg-green-50">
                <h4 className="font-semibold text-sm mb-2">Expected Impact</h4>
                <p className="text-sm">{editPlan.expected_impact}</p>
              </Card>

              {/* Suggestions */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Editing Suggestions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {editPlan.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => toggleSuggestion(idx)}
                    >
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(`suggestion-${idx}`)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">Scene {idx + 1}</p>
                          <p className="text-gray-600">{suggestion.reason}</p>
                          {suggestion.micro_edits.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              {suggestion.micro_edits.length} micro-edits
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleApplyChanges}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply Selected ({selectedSuggestions.size})
                </Button>
                <Button
                  onClick={() => setEditPlan(null)}
                  variant="outline"
                  className="flex-1"
                >
                  New Analysis
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
