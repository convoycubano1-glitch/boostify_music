import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, ChevronRight, Check, Film, Music, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConceptSelectionModalProps {
  open: boolean;
  concepts: any[]; // Array of 3 concept proposals
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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-background via-background to-orange-950/20" data-testid="modal-concept-selection">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-orange-500" />
            {directorName} te propone 3 conceptos creativos
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            Selecciona el concepto que mejor se adapte a tu visión musical
          </p>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {concepts.map((concept, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card
                  className={cn(
                    "p-6 cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-xl h-full",
                    selectedConcept === concept && "border-orange-500 bg-orange-500/10 shadow-orange-500/20"
                  )}
                  onClick={() => setSelectedConcept(concept)}
                  data-testid={`concept-${index}`}
                >
                  {/* Header with number */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all",
                      selectedConcept === concept ? "bg-orange-500 text-white" : "bg-muted"
                    )}>
                      {selectedConcept === concept ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <span>#{index + 1}</span>
                      )}
                    </div>
                    
                    {selectedConcept === concept && (
                      <Badge className="bg-orange-500">
                        Seleccionado
                      </Badge>
                    )}
                  </div>

                  {/* Concept Title */}
                  {concept.title && (
                    <h3 className="text-xl font-bold mb-3">
                      {concept.title}
                    </h3>
                  )}

                  {/* Concept Description */}
                  {concept.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-4">
                      {concept.description}
                    </p>
                  )}

                  {/* Visual Style */}
                  {concept.visual_style && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-semibold uppercase">Estilo Visual</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {concept.visual_style}
                      </p>
                    </div>
                  )}

                  {/* Narrative Approach */}
                  {concept.narrative_approach && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Film className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-semibold uppercase">Narrativa</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {concept.narrative_approach}
                      </p>
                    </div>
                  )}

                  {/* Key Scenes */}
                  {concept.key_scenes && concept.key_scenes.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-semibold uppercase">Escenas Clave</span>
                      </div>
                      <div className="space-y-1">
                        {concept.key_scenes.slice(0, 3).map((scene: string, i: number) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="text-orange-500 font-bold">•</span>
                            <span className="line-clamp-2">{scene}</span>
                          </div>
                        ))}
                        {concept.key_scenes.length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{concept.key_scenes.length - 3} escenas más...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Color Palette */}
                  {concept.color_palette && (
                    <div className="mb-4">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Paleta de Colores</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(Array.isArray(concept.color_palette) 
                          ? concept.color_palette 
                          : typeof concept.color_palette === 'string' 
                            ? concept.color_palette.split(',') 
                            : []
                        ).slice(0, 4).map((color: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {typeof color === 'string' ? color.trim() : color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mood */}
                  {concept.mood && (
                    <div className="pt-4 border-t border-muted">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">Atmósfera</span>
                      <p className="text-sm font-medium text-orange-500 mt-1">
                        {concept.mood}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Continue Button */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedConcept ? (
              <span className="text-green-500 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Concepto seleccionado
              </span>
            ) : (
              <span>
                Selecciona uno de los 3 conceptos propuestos
              </span>
            )}
          </div>
          
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedConcept}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            data-testid="button-continue-concept"
          >
            Continuar al Timeline
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
