import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Film, Sparkles, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getAllDirectors, type DirectorProfile } from "@/data/directors";
import { cn } from "@/lib/utils";

interface DirectorSelectionModalProps {
  open: boolean;
  onSelect: (director: DirectorProfile, style: string) => void;
}

const VISUAL_STYLES = [
  { id: "cinematic", name: "Cinematic", description: "Movie-quality aesthetics with professional lighting and composition", icon: "🎬" },
  { id: "vibrant", name: "Vibrant", description: "Bold colors, high energy, and dynamic visuals", icon: "🌈" },
  { id: "minimalist", name: "Minimalist", description: "Clean, simple, and focused on essential elements", icon: "⚪" },
  { id: "retro", name: "Retro", description: "Vintage vibes with nostalgic color grading", icon: "📼" },
  { id: "experimental", name: "Experimental", description: "Avant-garde and unconventional visual approaches", icon: "🎨" },
  { id: "natural", name: "Natural", description: "Organic, authentic, and documentary-style", icon: "🌿" }
];

export function DirectorSelectionModal({ open, onSelect }: DirectorSelectionModalProps) {
  const [selectedDirector, setSelectedDirector] = useState<DirectorProfile | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const directors = getAllDirectors();

  const handleContinue = () => {
    if (selectedDirector && selectedStyle) {
      onSelect(selectedDirector, selectedStyle);
    }
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-background via-background to-orange-950/20" data-testid="modal-director-selection">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Film className="h-8 w-8 text-orange-500" />
            Selecciona tu Director y Estilo Visual
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Directores */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Directores</h3>
              <Badge variant={selectedDirector ? "default" : "outline"}>
                {selectedDirector ? "1 seleccionado" : "Selecciona uno"}
              </Badge>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {directors.map((director) => (
                  <motion.div
                    key={director.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: directors.indexOf(director) * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-lg",
                        selectedDirector?.id === director.id && "border-orange-500 bg-orange-500/10 shadow-orange-500/20"
                      )}
                      onClick={() => setSelectedDirector(director)}
                      data-testid={`director-${director.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 transition-all",
                          selectedDirector?.id === director.id ? "bg-orange-500 text-white" : "bg-muted"
                        )}>
                          {selectedDirector?.id === director.id ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Film className="h-5 w-5" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg mb-1">{director.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {director.specialty}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {director.visual_style?.signature_techniques?.slice(0, 3).map((spec: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Estilos Visuales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Estilo Visual</h3>
              <Badge variant={selectedStyle ? "default" : "outline"}>
                {selectedStyle ? "1 seleccionado" : "Selecciona uno"}
              </Badge>
            </div>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {VISUAL_STYLES.map((style, index) => (
                  <motion.div
                    key={style.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-lg",
                        selectedStyle === style.id && "border-orange-500 bg-orange-500/10 shadow-orange-500/20"
                      )}
                      onClick={() => setSelectedStyle(style.id)}
                      data-testid={`style-${style.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl flex-shrink-0">
                          {style.icon}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-lg">{style.name}</h4>
                            {selectedStyle === style.id && (
                              <Check className="h-5 w-5 text-orange-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedDirector && selectedStyle ? (
              <span className="text-green-500 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Listo para continuar
              </span>
            ) : (
              <span>
                Selecciona un director y un estilo visual para continuar
              </span>
            )}
          </div>
          
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedDirector || !selectedStyle}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            data-testid="button-continue-director"
          >
            Continuar
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
