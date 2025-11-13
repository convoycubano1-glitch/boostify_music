import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Film, Sparkles, ChevronRight, Check, Star, Loader2, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DIRECTORS } from "@/data/directors";

interface Director {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  style: string;
  rating: number;
  imageUrl?: string;
}

interface DirectorSelectionModalProps {
  open: boolean;
  onSelect: (director: Director, style: string) => void;
  preSelectedDirector?: Director | null;
}

const VISUAL_STYLES = [
  { id: "cinematic", name: "Cinematic", description: "Movie-quality aesthetics with professional lighting and composition", icon: "🎬" },
  { id: "vibrant", name: "Vibrant", description: "Bold colors, high energy, and dynamic visuals", icon: "🌈" },
  { id: "minimalist", name: "Minimalist", description: "Clean, simple, and focused on essential elements", icon: "⚪" },
  { id: "retro", name: "Retro", description: "Vintage vibes with nostalgic color grading", icon: "📼" },
  { id: "experimental", name: "Experimental", description: "Avant-garde and unconventional visual approaches", icon: "🎨" },
  { id: "natural", name: "Natural", description: "Organic, authentic, and documentary-style", icon: "🌿" }
];

export function DirectorSelectionModal({ open, onSelect, preSelectedDirector }: DirectorSelectionModalProps) {
  const { toast } = useToast();
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(preSelectedDirector || null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>("cinematic");
  
  // Usar directores directamente de JSON (ya incluyen toda la información)
  const directors = DIRECTORS.map(d => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    experience: d.experience || "Professional Director",
    style: d.visual_style?.description || "Cinematic",
    rating: d.rating,
    imageUrl: d.firestore_image_url || undefined
  }));

  // Pre-seleccionar director si viene desde DirectorsList
  useEffect(() => {
    if (preSelectedDirector && open) {
      setSelectedDirector(preSelectedDirector);
      console.log(`✅ Director pre-seleccionado en modal: ${preSelectedDirector.name}`);
    }
  }, [preSelectedDirector, open]);

  const handleContinue = () => {
    if (selectedDirector && selectedStyle) {
      onSelect(selectedDirector, selectedStyle);
    }
  };


  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-background via-background to-orange-950/20" data-testid="modal-director-selection">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Film className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
            Selecciona tu Director y Estilo Visual
          </DialogTitle>
        </DialogHeader>

        {/* Mensaje de director pre-seleccionado */}
        {selectedDirector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 rounded-full p-2">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Tu director seleccionado es</p>
                <p className="text-lg font-bold text-orange-500">{selectedDirector.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDirector.specialty}</p>
              </div>
              <Badge className="bg-orange-500">
                <Star className="h-4 w-4 mr-1" />
                {selectedDirector.rating}
              </Badge>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Directores */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-semibold">Directores Disponibles</h3>
              <Badge variant={selectedDirector ? "default" : "outline"} className="bg-orange-500">
                {selectedDirector ? "✓ Seleccionado" : "Selecciona uno"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {directors.map((director, index) => (
                <motion.div
                  key={director.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-lg hover:scale-[1.02]",
                      selectedDirector?.id === director.id && "border-2 border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                    )}
                    onClick={() => setSelectedDirector(director)}
                    data-testid={`director-${director.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar con imagen profesional desde Firestore */}
                      <div className={cn(
                        "w-20 h-20 rounded-lg flex-shrink-0 overflow-hidden bg-orange-500/10 flex items-center justify-center transition-all",
                        selectedDirector?.id === director.id && "ring-4 ring-orange-500/50"
                      )}>
                        {director.imageUrl ? (
                          <img
                            src={director.imageUrl}
                            alt={`${director.name} - ${director.specialty}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(director.name);
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Award className="h-8 w-8 text-orange-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-base md:text-lg">{director.name}</h4>
                          {selectedDirector?.id === director.id && (
                            <Check className="h-5 w-5 text-orange-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-orange-500 mb-1">
                          {director.specialty}
                        </p>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                          <span className="text-sm font-medium">{director.rating || 4.5}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {director.experience}
                        </p>
                        
                        <p className="text-sm text-muted-foreground">
                          Style: {director.style}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Estilos Visuales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg md:text-xl font-semibold">Estilo Visual</h3>
              <Badge variant={selectedStyle ? "default" : "outline"} className="bg-orange-500">
                {selectedStyle ? "✓ Seleccionado" : "Selecciona uno"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {VISUAL_STYLES.map((style, index) => (
                <motion.div
                  key={style.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={cn(
                      "p-4 cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-lg hover:scale-[1.02]",
                      selectedStyle === style.id && "border-2 border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                    )}
                    onClick={() => setSelectedStyle(style.id)}
                    data-testid={`style-${style.id}`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-4xl mx-auto">
                        {style.icon}
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <h4 className="font-bold text-sm md:text-base">{style.name}</h4>
                          {selectedStyle === style.id && (
                            <Check className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {style.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t">
          <div className="text-sm text-center sm:text-left text-muted-foreground">
            {selectedDirector && selectedStyle ? (
              <span className="text-green-500 flex items-center gap-2 font-semibold">
                <Check className="h-4 w-4" />
                Listo para continuar con {selectedDirector.name}
              </span>
            ) : (
              <span>
                Selecciona un director y un estilo para continuar
              </span>
            )}
          </div>
          
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedDirector || !selectedStyle}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 w-full sm:w-auto"
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
