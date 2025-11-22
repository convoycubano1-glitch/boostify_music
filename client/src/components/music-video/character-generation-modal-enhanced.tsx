import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logger } from "../../lib/logger";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, CheckCircle2, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MasterCharacterMultiAngle, CharacterPortrait, CastingMember } from "../../lib/api/master-character-generator";
import { Badge } from "@/components/ui/badge";

interface CharacterGenerationModalEnhancedProps {
  open: boolean;
  stage: string;
  progress: number;
  character?: MasterCharacterMultiAngle | null;
  onContinue?: () => void;
}

import { Button } from "@/components/ui/button";

export function CharacterGenerationModalEnhanced({
  open,
  stage,
  progress,
  character,
  onContinue
}: CharacterGenerationModalEnhancedProps) {
  const stages = [
    { name: "Analyzing facial features...", icon: User, min: 0, max: 20 },
    { name: "Generating frontal angle...", icon: Sparkles, min: 20, max: 35 },
    { name: "Creating profile angles...", icon: Sparkles, min: 35, max: 60 },
    { name: "Generating three-quarter view...", icon: Sparkles, min: 60, max: 75 },
    { name: "Creating casting profiles...", icon: Users, min: 75, max: 95 },
    { name: "Finalizing...", icon: CheckCircle2, min: 95, max: 100 }
  ];

  const currentStage = stages.find(s => progress >= s.min && progress <= s.max) || stages[0];
  const StageIcon = currentStage.icon;

  const angleLabels: Record<string, string> = {
    'frontal': 'Frontal View',
    'left-profile': 'Left Profile',
    'right-profile': 'Right Profile',
    'three-quarter': 'Three-Quarter'
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30">
              <User className="h-6 w-6 text-orange-500" />
            </div>
            Generating Character Profiles & Casting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <StageIcon className={cn(
                  "h-5 w-5",
                  progress < 100 ? "text-orange-500 animate-pulse" : "text-emerald-500"
                )} />
                <span className="font-medium text-slate-300">{stage || currentStage.name}</span>
              </div>
              <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                {Math.round(progress)}%
              </Badge>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Character Angles Grid */}
          {character?.mainCharacter.angles && character.mainCharacter.angles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-red-500 rounded" />
                Character Angle Variations
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {character.mainCharacter.angles.map((angle: CharacterPortrait, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative rounded-lg overflow-hidden border border-orange-500/30 aspect-square"
                  >
                    <img
                      src={angle.imageUrl}
                      alt={angleLabels[angle.angle]}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-xs font-semibold text-orange-400">
                      {angleLabels[angle.angle]}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Casting Members Grid */}
          {character?.casting && character.casting.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Cast Members ({character.casting.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {character.casting.map((member: CastingMember, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="relative rounded-lg overflow-hidden border border-purple-500/30 aspect-square">
                      <img
                        src={member.imageUrl}
                        alt={member.characterName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-purple-300 truncate">{member.role}</p>
                      <p className="text-xs text-slate-400">{member.characterName}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {!character?.mainCharacter.imageUrl && progress < 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative h-40 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-lg border-2 border-dashed border-slate-600/50 flex items-center justify-center"
            >
              <div className="text-center space-y-3">
                <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
                <p className="text-sm text-slate-300">
                  Creating professional studio photography style character profiles...
                </p>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {character && progress >= 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Character generation complete!</p>
                <p className="text-xs text-emerald-200/80 mt-1">
                  {character.mainCharacter.angles.length} angle variations + {character.casting.length} cast members ready for your music video
                </p>
              </div>
            </motion.div>
          )}

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-medium text-blue-300">Professional Studio Photography</p>
                <p className="text-blue-200/80">
                  Creating cinematic-quality character portraits with multiple camera angles and casting options
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button - Only show when complete */}
          {progress >= 100 && character && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 pt-4 border-t border-slate-700"
            >
              <Button
                onClick={onContinue}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold h-11"
              >
                Continue to Next Step
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
