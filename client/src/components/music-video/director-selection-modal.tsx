import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Film, Sparkles, ChevronRight, Check, Star, Loader2, Award, Camera, Zap, Lightbulb, Video, Glasses, Clapperboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DIRECTORS } from "@/data/directors";
import { OPTIMAL_DIRECTOR_DP_PAIRINGS, getCinematographerById } from "@/data/cinematographers";

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

// Director image mapping - using public URLs (matches generated director images)
const DIRECTOR_IMAGE_MAP: { [key: string]: string } = {
  "sofia-ramirez": "/assets/generated_images/sofia_ramirez_director_headshot_portrait.png",
  "david-kim": "/assets/generated_images/david_kim_director_professional_headshot.png",
  "james-wilson": "/assets/generated_images/james_wilson_director_headshot_portrait.png",
  "isabella-moretti": "/assets/generated_images/isabella_moretti_director_professional_portrait.png",
  "marcus-chen": "/assets/generated_images/marcus_chen_director_professional_headshot.png",
  "elena-rodriguez": "/assets/generated_images/elena_rodriguez_director_professional_portrait.png",
  "carlos-rodriguez": "/assets/generated_images/carlos_rodriguez_director_headshot_portrait.png",
  "nina-patel": "/assets/generated_images/nina_patel_director_professional_portrait.png",
  "david-oconnor": "/assets/generated_images/david_oconnor_director_professional_headshot.png",
  "elena-petrov": "/assets/generated_images/elena_petrov_director_professional_portrait.png",
  "yuki-tanaka": "/assets/generated_images/yuki_tanaka_director_professional_headshot.png",
  "amara-johnson": "/assets/generated_images/amara_johnson_director_professional_portrait.png",
  "michael-brooks": "/assets/generated_images/michael_brooks_director_professional_headshot.png",
  "alex-thompson": "/assets/generated_images/alex_thompson_director_professional_portrait.png",
};

export function DirectorSelectionModal({ open, onSelect, preSelectedDirector }: DirectorSelectionModalProps) {
  const { toast } = useToast();
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(preSelectedDirector || null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>("cinematic");
  
  const directors = DIRECTORS.map(d => ({
    id: d.id,
    name: d.name,
    specialty: d.specialty,
    experience: d.experience || "Professional Director",
    style: d.visual_style?.description || "Cinematic",
    rating: d.rating,
    imageUrl: DIRECTOR_IMAGE_MAP[d.id] || undefined
  }));

  useEffect(() => {
    if (preSelectedDirector && open) {
      setSelectedDirector(preSelectedDirector);
      logger.info(`✅ Director pre-selected in modal: ${preSelectedDirector.name}`);
    }
  }, [preSelectedDirector, open]);

  const handleContinue = () => {
    if (selectedDirector && selectedStyle) {
      onSelect(selectedDirector, selectedStyle);
    }
  };

  const getDirectorCinematographer = (directorId: string) => {
    const dpId = OPTIMAL_DIRECTOR_DP_PAIRINGS[directorId];
    if (dpId) {
      return getCinematographerById(dpId);
    }
    return null;
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-background via-background to-orange-950/20" data-testid="modal-director-selection">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3">
            <Film className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
            Select Your Director & Visual Style
          </DialogTitle>
          <p className="text-center text-xs sm:text-sm text-muted-foreground mt-2">
            Each director is paired with an Oscar-winning cinematographer for Hollywood-level production
          </p>
        </DialogHeader>

        {/* Pre-selected director message */}
        {selectedDirector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-lg p-4 mb-4"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="bg-orange-500 rounded-full p-2 flex-shrink-0">
                <Check className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Selected Director</p>
                <p className="text-lg font-bold text-orange-500">{selectedDirector.name}</p>
                <p className="text-sm text-muted-foreground">{selectedDirector.specialty}</p>
              </div>
              <Badge className="bg-orange-500 text-white flex-shrink-0">
                <Star className="h-4 w-4 mr-1" />
                {selectedDirector.rating}
              </Badge>
            </div>
          </motion.div>
        )}

        <ScrollArea className="h-auto">
          <div className="space-y-6 pr-4">
            {/* Directors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold">Available Directors</h3>
                <Badge variant={selectedDirector ? "default" : "outline"} className="bg-orange-500">
                  {selectedDirector ? "✓ Selected" : "Select one"}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {directors.map((director, index) => {
                  const pairedDP = getDirectorCinematographer(director.id);
                  return (
                    <motion.div
                      key={director.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={cn(
                          "p-5 cursor-pointer transition-all hover:border-orange-500/50 hover:shadow-2xl hover:scale-[1.03] relative overflow-hidden group bg-gradient-to-br from-background to-background/80",
                          selectedDirector?.id === director.id && "border-2 border-orange-500 bg-gradient-to-br from-orange-500/25 to-orange-600/15 shadow-2xl shadow-orange-500/40"
                        )}
                        onClick={() => setSelectedDirector(director)}
                        data-testid={`director-${director.id}`}
                      >
                        {/* Animated Background Accent */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-orange-600/0 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                        
                        <div className="flex flex-col gap-4 relative z-10">
                          {/* Avatar Section - ENHANCED */}
                          <div className={cn(
                            "w-full aspect-square rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-orange-500/30 to-orange-600/20 flex items-center justify-center transition-all border-3 border-orange-500/40 shadow-lg",
                            selectedDirector?.id === director.id && "ring-4 ring-orange-500/50 border-orange-500/70 shadow-xl shadow-orange-500/40"
                          )}>
                            {director.imageUrl ? (
                              <img
                                src={director.imageUrl}
                                alt={`${director.name} - ${director.specialty}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://api.dicebear.com/7.x/avatar/svg?seed=" + encodeURIComponent(director.name) + "&scale=80";
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-700 to-red-800">
                                <Clapperboard className="h-12 w-12 text-white/80" />
                              </div>
                            )}
                          </div>
                          
                          {/* Director Info Section */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg line-clamp-1">{director.name}</h4>
                                <p className="text-sm font-semibold text-orange-500 mb-1">
                                  {director.specialty}
                                </p>
                              </div>
                              {selectedDirector?.id === director.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-lg"
                                >
                                  <Check className="h-4 w-4" />
                                </motion.div>
                              )}
                            </div>
                            
                            {/* Rating Badge */}
                            <div className="flex items-center gap-2 bg-orange-500/15 px-3 py-2 rounded-lg border border-orange-500/30 w-fit">
                              <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{director.rating || 4.5}/5</span>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {director.experience}
                            </p>

                            {/* Paired Cinematographer with enhanced styling */}
                            {pairedDP && (
                              <div className="space-y-2 mt-2 pt-3 border-t border-orange-500/20">
                                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-orange-500/10 p-3 rounded-lg border border-orange-500/30">
                                  <Video className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground font-semibold">Cinematographer</p>
                                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400 line-clamp-1">
                                      {pairedDP.name}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Show camera/lens info */}
                                {pairedDP.camera_arsenal?.primary_cameras?.[0] && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 p-2 rounded border border-white/10">
                                    <Camera className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                      {pairedDP.camera_arsenal.primary_cameras[0].format || "Cinema Camera"}
                                    </span>
                                  </div>
                                )}
                                
                                {pairedDP.camera_arsenal?.lens_packages?.[0] && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 p-2 rounded border border-white/10">
                                    <Glasses className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                      {pairedDP.camera_arsenal.lens_packages[0].manufacturer} {pairedDP.camera_arsenal.lens_packages[0].series}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Visual Styles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg md:text-xl font-semibold">Visual Style</h3>
                <Badge variant={selectedStyle ? "default" : "outline"} className="bg-orange-500">
                  {selectedStyle ? "✓ Selected" : "Select one"}
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

            {/* Technical Details Section */}
            {selectedDirector && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <h4 className="font-bold text-base">Technical Production Details</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(() => {
                    const dp = getDirectorCinematographer(selectedDirector.id);
                    return (
                      <>
                        {selectedDirector.specialty && (
                          <div className="p-3 bg-white/5 rounded border border-white/10">
                            <p className="text-xs text-muted-foreground mb-1">Director Specialty</p>
                            <p className="font-semibold text-sm">{selectedDirector.specialty}</p>
                          </div>
                        )}
                        {selectedDirector.style && (
                          <div className="p-3 bg-white/5 rounded border border-white/10">
                            <p className="text-xs text-muted-foreground mb-1">Visual Style</p>
                            <p className="font-semibold text-sm">{selectedDirector.style}</p>
                          </div>
                        )}
                        {dp && (
                          <>
                            <div className="p-3 bg-white/5 rounded border border-white/10">
                              <p className="text-xs text-muted-foreground mb-1">Cinematographer</p>
                              <p className="font-semibold text-sm">{dp.name}</p>
                            </div>
                            {dp.camera_arsenal?.primary_cameras?.[0]?.format && (
                              <div className="p-3 bg-white/5 rounded border border-white/10">
                                <p className="text-xs text-muted-foreground mb-1">Camera Format</p>
                                <p className="font-semibold text-sm">{dp.camera_arsenal.primary_cameras[0].format}</p>
                              </div>
                            )}
                            {dp.camera_arsenal?.lens_packages?.[0]?.series && (
                              <div className="p-3 bg-white/5 rounded border border-white/10">
                                <p className="text-xs text-muted-foreground mb-1">Lens Package</p>
                                <p className="font-semibold text-sm">{dp.camera_arsenal.lens_packages[0].manufacturer} {dp.camera_arsenal.lens_packages[0].series}</p>
                              </div>
                            )}
                            {dp.camera_arsenal?.film_stock_emulation?.[0]?.name && (
                              <div className="p-3 bg-white/5 rounded border border-white/10">
                                <p className="text-xs text-muted-foreground mb-1">Film Stock</p>
                                <p className="font-semibold text-sm">{dp.camera_arsenal.film_stock_emulation[0].name}</p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Continue Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t">
          <div className="text-sm text-center sm:text-left text-muted-foreground">
            {selectedDirector && selectedStyle ? (
              <span className="text-green-500 flex items-center gap-2 font-semibold">
                <Check className="h-4 w-4" />
                Ready to begin with {selectedDirector.name}
              </span>
            ) : (
              <span>
                Select a director and visual style to continue
              </span>
            )}
          </div>
          
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedDirector || !selectedStyle}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white gap-2 w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
            data-testid="button-continue-director"
          >
            Continue
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
