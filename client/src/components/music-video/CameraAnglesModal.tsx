import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logger } from "../../lib/logger";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, Check, Camera, RefreshCw, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TimelineClip {
  id: number;
  prompt?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  url?: string;
  generatedImage?: string;
  image_url?: string;
  publicUrl?: string;
  firebaseUrl?: string;
  [key: string]: any;
}

interface CameraAngleConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  prompt: string;
}

interface GeneratedVariation {
  angle: string;
  name: string;
  emoji: string;
  success: boolean;
  imageUrl: string | null;
  error?: string;
  isGenerating?: boolean;
}

interface CameraAnglesModalProps {
  open: boolean;
  onClose: () => void;
  clip: TimelineClip | null;
  onSelectAngle: (imageUrl: string, angleName: string) => void;
}

// Ángulos de cámara disponibles
const CAMERA_ANGLES: CameraAngleConfig[] = [
  {
    id: 'close-up',
    name: 'Close-Up',
    emoji: '🔍',
    description: 'Plano cerrado íntimo',
    prompt: 'Transform this image to an extreme close-up shot, intimate detail, shallow depth of field, focus on the main subject, dramatic and cinematic framing'
  },
  {
    id: 'wide',
    name: 'Wide Shot',
    emoji: '🌐',
    description: 'Plano general abierto',
    prompt: 'Transform this image to a wide establishing shot, show the full environment, distant perspective, cinematic landscape composition'
  },
  {
    id: 'low-angle',
    name: 'Low Angle',
    emoji: '⬆️',
    description: 'Contrapicado heroico',
    prompt: 'Transform this image to a dramatic low angle shot, camera looking up from below, heroic and powerful perspective, epic cinematic framing'
  },
  {
    id: 'high-angle',
    name: 'High Angle',
    emoji: '⬇️',
    description: 'Picado desde arriba',
    prompt: 'Transform this image to a high angle shot, camera looking down, birds eye perspective, dramatic overhead cinematic view'
  },
  {
    id: 'dutch',
    name: 'Dutch Angle',
    emoji: '📐',
    description: 'Ángulo inclinado dramático',
    prompt: 'Transform this image with a Dutch angle/tilted camera, dynamic diagonal composition, edgy and stylized cinematic look'
  },
  {
    id: 'over-shoulder',
    name: 'Over Shoulder',
    emoji: '👤',
    description: 'Por encima del hombro',
    prompt: 'Transform this image to an over-the-shoulder shot, create depth with foreground blur, intimate conversation framing, cinematic perspective'
  }
];

/**
 * Obtiene la URL de imagen del clip buscando en todos los campos posibles
 */
const getClipImageUrl = (clip: TimelineClip | null): string | null => {
  if (!clip) return null;
  return clip.imageUrl || clip.thumbnailUrl || clip.url || 
         (typeof clip.generatedImage === 'string' ? clip.generatedImage : null) ||
         clip.image_url || clip.publicUrl || clip.firebaseUrl || null;
};

export default function CameraAnglesModal({ open, onClose, clip, onSelectAngle }: CameraAnglesModalProps) {
  const [variations, setVariations] = useState<GeneratedVariation[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const { toast } = useToast();

  const sourceImageUrl = getClipImageUrl(clip);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setVariations([]);
      setSelectedAngle(null);
      setIsGeneratingAll(false);
    }
  }, [open]);

  // Generar una variación individual usando Nano Banana Edit
  const generateVariation = async (angle: CameraAngleConfig): Promise<GeneratedVariation> => {
    if (!sourceImageUrl) {
      return {
        angle: angle.id,
        name: angle.name,
        emoji: angle.emoji,
        success: false,
        imageUrl: null,
        error: 'No hay imagen de origen'
      };
    }

    try {
      const response = await fetch('/api/fal/nano-banana/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: sourceImageUrl,
          prompt: angle.prompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al generar variación');
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        return {
          angle: angle.id,
          name: angle.name,
          emoji: angle.emoji,
          success: true,
          imageUrl: data.imageUrl
        };
      } else {
        throw new Error('No se generó la imagen');
      }
    } catch (error: any) {
      logger.error(`Error generando ${angle.name}:`, error);
      return {
        angle: angle.id,
        name: angle.name,
        emoji: angle.emoji,
        success: false,
        imageUrl: null,
        error: error.message || 'Error desconocido'
      };
    }
  };

  // Generar todas las variaciones
  const generateAllVariations = async () => {
    if (!sourceImageUrl) {
      toast({
        title: "Error",
        description: "No hay imagen disponible para generar variaciones",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAll(true);
    setSelectedAngle(null);

    // Inicializar con estado "generando"
    const initialVariations: GeneratedVariation[] = CAMERA_ANGLES.map(angle => ({
      angle: angle.id,
      name: angle.name,
      emoji: angle.emoji,
      success: false,
      imageUrl: null,
      isGenerating: true
    }));
    setVariations(initialVariations);

    toast({
      title: "Generando ángulos...",
      description: "Esto puede tomar unos segundos por cada ángulo",
    });

    // Generar de 2 en 2 para no sobrecargar el servidor
    const batchSize = 2;
    const results: GeneratedVariation[] = [];

    for (let i = 0; i < CAMERA_ANGLES.length; i += batchSize) {
      const batch = CAMERA_ANGLES.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(angle => generateVariation(angle))
      );
      results.push(...batchResults);

      // Actualizar UI con resultados parciales
      setVariations(prev => {
        const updated = [...prev];
        batchResults.forEach((result, idx) => {
          const globalIdx = i + idx;
          if (updated[globalIdx]) {
            updated[globalIdx] = { ...result, isGenerating: false };
          }
        });
        return updated;
      });
    }

    setIsGeneratingAll(false);

    const successCount = results.filter(v => v.success).length;
    if (successCount === 0) {
      toast({
        title: "Error",
        description: "No se pudieron generar las variaciones. Intenta de nuevo.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Listo!",
        description: `Se generaron ${successCount} de ${CAMERA_ANGLES.length} ángulos`,
      });
    }
  };

  // Regenerar un ángulo específico
  const regenerateAngle = async (angleId: string) => {
    const angle = CAMERA_ANGLES.find(a => a.id === angleId);
    if (!angle) return;

    // Marcar como generando
    setVariations(prev => prev.map(v => 
      v.angle === angleId ? { ...v, isGenerating: true, error: undefined } : v
    ));

    const result = await generateVariation(angle);

    setVariations(prev => prev.map(v => 
      v.angle === angleId ? { ...result, isGenerating: false } : v
    ));

    if (result.success) {
      toast({
        title: "Regenerado",
        description: `${angle.name} regenerado exitosamente`,
      });
    }
  };

  const handleSelectAngle = (variation: GeneratedVariation) => {
    if (!variation.success || !variation.imageUrl || variation.isGenerating) return;
    setSelectedAngle(variation.angle);
  };

  const handleApply = () => {
    if (!selectedAngle) return;

    const selectedVariation = variations.find(v => v.angle === selectedAngle);
    if (selectedVariation && selectedVariation.imageUrl) {
      onSelectAngle(selectedVariation.imageUrl, selectedVariation.name);
      toast({
        title: "Ángulo aplicado",
        description: `El clip ahora tiene el ángulo "${selectedVariation.name}"`,
      });
      onClose();
    }
  };

  const handleClose = () => {
    setVariations([]);
    setSelectedAngle(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header - Fixed */}
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            <span>Ángulos de Cámara</span>
            <Badge variant="outline" className="ml-2 text-[10px] sm:text-xs bg-orange-500/10 border-orange-500/30 text-orange-400">
              <Sparkles className="h-3 w-3 mr-1" />
              Nano Banana AI
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {/* Source Image Preview */}
          {sourceImageUrl && (
            <div className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-white/60 mb-2">Imagen de referencia:</p>
              <div className="relative w-full max-w-[200px] sm:max-w-[280px] mx-auto">
                <img 
                  src={sourceImageUrl} 
                  alt="Imagen original" 
                  className="w-full aspect-video object-cover rounded-lg border border-white/10"
                />
                <Badge className="absolute top-2 left-2 text-[9px] sm:text-[10px] bg-black/60">
                  Original
                </Badge>
              </div>
            </div>
          )}

          {/* Generate Button (when no variations) */}
          {variations.length === 0 && (
            <div className="text-center py-6 sm:py-10">
              <Camera className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-orange-500/40" />
              <p className="text-white/60 mb-4 text-sm sm:text-base">
                Genera variaciones con diferentes ángulos de cámara
              </p>
              <Button
                onClick={generateAllVariations}
                disabled={!sourceImageUrl}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generar {CAMERA_ANGLES.length} Ángulos
              </Button>
              {!sourceImageUrl && (
                <p className="text-red-400 text-xs mt-2">
                  Este clip no tiene imagen disponible
                </p>
              )}
            </div>
          )}

          {/* Variations Grid */}
          {variations.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {variations.map((variation) => (
                <div
                  key={variation.angle}
                  className={`relative group rounded-lg overflow-hidden transition-all cursor-pointer
                    ${selectedAngle === variation.angle
                      ? 'ring-2 sm:ring-4 ring-green-500 scale-[0.98]'
                      : variation.success && !variation.isGenerating
                      ? 'hover:ring-2 hover:ring-orange-500/50'
                      : ''
                    }
                    ${variation.isGenerating ? 'pointer-events-none' : ''}
                  `}
                  onClick={() => handleSelectAngle(variation)}
                >
                  {/* Image or Loading/Error State */}
                  <div className="aspect-video relative bg-neutral-900">
                    {variation.isGenerating ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-orange-500 mb-2" />
                        <span className="text-[10px] sm:text-xs text-white/40">Generando...</span>
                      </div>
                    ) : variation.success && variation.imageUrl ? (
                      <>
                        <img
                          src={variation.imageUrl}
                          alt={variation.name}
                          className="w-full h-full object-cover"
                        />
                        {selectedAngle === variation.angle && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <div className="bg-green-500 text-white rounded-full p-1.5 sm:p-2">
                              <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                            </div>
                          </div>
                        )}
                        {/* Regenerate button on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            regenerateAngle(variation.angle);
                          }}
                          className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-full bg-black/60 
                            opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                          title="Regenerar"
                        >
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                        <span className="text-2xl sm:text-3xl mb-1">{variation.emoji}</span>
                        <span className="text-[10px] sm:text-xs text-red-400 text-center line-clamp-2">
                          {variation.error || 'Error'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 h-6 text-[10px] sm:text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            regenerateAngle(variation.angle);
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Reintentar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 sm:p-2">
                    <div className="flex items-center gap-1">
                      <span className="text-sm sm:text-base">{variation.emoji}</span>
                      <span className="text-[10px] sm:text-xs font-medium text-white truncate">
                        {variation.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        {variations.length > 0 && (
          <div className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-white/10 bg-neutral-950">
            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full sm:w-auto"
                disabled={isGeneratingAll}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={generateAllVariations}
                  disabled={isGeneratingAll}
                  className="flex-1 sm:flex-none"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingAll ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Regenerar todos</span>
                  <span className="sm:hidden">Regenerar</span>
                </Button>
                
                <Button
                  onClick={handleApply}
                  disabled={!selectedAngle || isGeneratingAll}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Aplicar Ángulo</span>
                  <span className="sm:hidden">Aplicar</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
