import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ChevronRight, Check, Film, Music, Palette, MapPin, Shirt, Clock, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ConceptSelectionModalProps {
  open: boolean;
  concepts: any[];
  directorName: string;
  onSelect: (concept: any) => void;
}

export function ConceptSelectionModal({ 
  open, 
  concepts, 
  directorName,
  onSelect 
}: ConceptSelectionModalProps) {
  const [selectedConcept, setSelectedConcept] = useState<any | null>(null);

  const handleContinue = () => {
    if (selectedConcept) {
      onSelect(selectedConcept);
    }
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col bg-gradient-to-br from-background via-background to-orange-950/20 p-0 gap-0" data-testid="modal-concept-selection">
        <DialogHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-2 sm:gap-3">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-orange-500" />
            <span className="line-clamp-1">{directorName} te propone 3 conceptos</span>
          </DialogTitle>
          <p className="text-center text-xs sm:text-sm md:text-base text-muted-foreground mt-1 sm:mt-2">
            Selecciona el concepto que mejor capture la esencia de tu música
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto px-4 sm:px-6 py-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {concepts.map((concept, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card
                  className={cn(
                    "p-5 md:p-6 cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-xl h-full flex flex-col",
                    selectedConcept === concept && "border-2 border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                  )}
                  onClick={() => setSelectedConcept(concept)}
                  data-testid={`concept-${index}`}
                >
                  {/* Cover Image */}
                  {concept.coverImage && (
                    <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden group">
                      <img 
                        src={concept.coverImage} 
                        alt={concept.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                        <p className="text-white font-bold text-lg md:text-xl mb-1">{concept.artistName || 'Artist Name'}</p>
                        <p className="text-white/90 text-sm md:text-base">{concept.songTitle || 'Song Title'}</p>
                      </div>
                      {selectedConcept === concept && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-orange-500 text-white rounded-full p-2 shadow-lg">
                            <Check className="h-5 w-5" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold transition-all shadow-lg",
                      selectedConcept === concept ? "bg-orange-500 text-white ring-4 ring-orange-500/30" : "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800"
                    )}>
                      {selectedConcept === concept ? (
                        <Check className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        <span>#{index + 1}</span>
                      )}
                    </div>
                    
                    {selectedConcept === concept && (
                      <Badge className="bg-orange-500 text-white">
                        ✓ Seleccionado
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  {concept.title && (
                    <h3 className="text-lg md:text-xl font-bold mb-3 text-foreground">
                      {concept.title}
                    </h3>
                  )}

                  {/* Story Concept - Main Description */}
                  {concept.story_concept && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                        {concept.story_concept}
                      </p>
                    </div>
                  )}

                  <Separator className="my-3" />

                  {/* Visual Theme */}
                  {concept.visual_theme && (
                    <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">Tema Visual</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {concept.visual_theme}
                      </p>
                    </div>
                  )}

                  {/* Mood Progression */}
                  {concept.mood_progression && (
                    <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">Progresión Emocional</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {concept.mood_progression}
                      </p>
                    </div>
                  )}

                  {/* Wardrobe */}
                  {concept.main_wardrobe && (
                    <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Shirt className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">Vestuario</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {concept.main_wardrobe.outfit_description}
                      </p>
                      {concept.main_wardrobe.colors && concept.main_wardrobe.colors.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {concept.main_wardrobe.colors.map((color: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Locations */}
                  {concept.locations && concept.locations.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">Locaciones</span>
                      </div>
                      <div className="space-y-2">
                        {concept.locations.slice(0, 2).map((location: any, i: number) => (
                          <div key={i} className="pl-3 border-l-2 border-orange-500/50">
                            <p className="text-xs font-semibold text-foreground">{location.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{location.description}</p>
                          </div>
                        ))}
                        {concept.locations.length > 2 && (
                          <p className="text-xs text-muted-foreground italic pl-3">
                            +{concept.locations.length - 2} locaciones más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Color Palette */}
                  {concept.color_palette && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">Paleta de Colores</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const colors = concept.color_palette.primary_colors || [];
                          return colors.slice(0, 4).map((color: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5">
                              {color}
                            </Badge>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Key Narrative Moments */}
                  {concept.key_narrative_moments && concept.key_narrative_moments.length > 0 && (
                    <div className="mt-auto pt-3 border-t border-muted">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wide text-foreground">Momentos Clave</span>
                      </div>
                      <div className="space-y-1.5">
                        {concept.key_narrative_moments.slice(0, 2).map((moment: any, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                              {moment.timestamp}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex-1 line-clamp-2">
                              {moment.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Continue Button - FIXED AT BOTTOM - ALWAYS VISIBLE */}
        <div className="shrink-0 flex flex-col gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background shadow-lg">
          {/* Mobile: Stack vertically */}
          <div className="flex sm:hidden flex-col gap-3 w-full">
            {selectedConcept && (
              <div className="text-center">
                <p className="text-sm text-green-500 flex items-center justify-center gap-2 font-semibold">
                  <Check className="h-4 w-4" />
                  {selectedConcept.title}
                </p>
              </div>
            )}
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedConcept}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shadow-lg hover:shadow-xl transition-all w-full min-h-[52px] text-base font-semibold"
              data-testid="button-continue-concept"
            >
              <Sparkles className="h-5 w-5" />
              {selectedConcept ? 'Generar Video Musical' : 'Selecciona un Concepto'}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden sm:flex flex-row justify-between items-center gap-4 w-full">
            <div className="text-sm text-left">
              {selectedConcept ? (
                <div className="space-y-1">
                  <p className="text-green-500 flex items-center gap-2 font-semibold">
                    <Check className="h-4 w-4" />
                    Concepto seleccionado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConcept.title}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Selecciona un concepto
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Elige la propuesta que mejor se adapte a tu visión
                  </p>
                </div>
              )}
            </div>
            
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedConcept}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
              data-testid="button-continue-concept"
            >
              <Sparkles className="h-5 w-5" />
              Generar Video Musical
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
