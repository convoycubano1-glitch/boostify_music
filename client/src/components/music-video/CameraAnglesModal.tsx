import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logger } from "../../lib/logger";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2, Check, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimelineClip {
  id: number;
  prompt?: string;
  imageUrl?: string;
  [key: string]: any;
}

interface CameraAngle {
  angle: string;
  name: string;
  emoji: string;
  success: boolean;
  imageUrl: string | null;
  error?: string;
}

interface CameraAnglesModalProps {
  open: boolean;
  onClose: () => void;
  clip: TimelineClip | null;
  onSelectAngle: (imageUrl: string, angleName: string) => void;
}

export default function CameraAnglesModal({ open, onClose, clip, onSelectAngle }: CameraAnglesModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<CameraAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && clip) {
      generateVariations();
    }
  }, [open, clip]);

  const generateVariations = async () => {
    if (!clip || !clip.prompt) {
      toast({
        title: "Error",
        description: "Cannot generate camera angles without a prompt.",
        variant: "destructive",
      });
      onClose();
      return;
    }

    setIsGenerating(true);
    setVariations([]);
    setSelectedAngle(null);

    try {
      const response = await fetch('/api/clips/generate-camera-angles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalPrompt: clip.prompt,
          clipId: clip.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate camera angles');
      }

      const data = await response.json();

      if (data.success && data.variations) {
        setVariations(data.variations);
        
        const successCount = data.variations.filter((v: CameraAngle) => v.success).length;
        
        if (successCount === 0) {
          toast({
            title: "Generation Failed",
            description: "Failed to generate any camera angle variations. Please try again.",
            variant: "destructive",
          });
        } else if (successCount < 4) {
          toast({
            title: "Partial Success",
            description: `Generated ${successCount} out of 4 camera angles.`,
          });
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      logger.error('Error generating camera angles:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate camera angles. Please try again.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAngle = (variation: CameraAngle) => {
    if (!variation.success || !variation.imageUrl) return;
    
    setSelectedAngle(variation.angle);
  };

  const handleApply = () => {
    if (!selectedAngle) return;

    const selectedVariation = variations.find(v => v.angle === selectedAngle);
    if (selectedVariation && selectedVariation.imageUrl) {
      onSelectAngle(selectedVariation.imageUrl, selectedVariation.name);
      toast({
        title: "Camera Angle Applied",
        description: `Clip updated with ${selectedVariation.name} shot.`,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Choose Camera Angle
          </DialogTitle>
        </DialogHeader>

        {clip && clip.prompt && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Current Scene: <span className="font-medium text-foreground">{clip.prompt.substring(0, 100)}...</span>
            </p>
          </div>
        )}

        {isGenerating ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative aspect-square bg-muted rounded-lg animate-pulse flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {variations.map((variation) => (
                <div
                  key={variation.angle}
                  className={`relative group cursor-pointer transition-all ${
                    selectedAngle === variation.angle
                      ? 'ring-4 ring-green-500 rounded-lg'
                      : variation.success
                      ? 'hover:ring-2 hover:ring-primary rounded-lg'
                      : ''
                  }`}
                  onClick={() => handleSelectAngle(variation)}
                  data-testid={`camera-angle-${variation.angle}`}
                >
                  {variation.success && variation.imageUrl ? (
                    <>
                      <div className="relative aspect-square">
                        <img
                          src={variation.imageUrl}
                          alt={variation.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {selectedAngle === variation.angle && (
                          <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <div className="bg-green-500 text-white rounded-full p-2">
                              <Check className="h-6 w-6" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-medium text-sm">
                          {variation.emoji} {variation.name}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-4">
                      <div className="text-4xl mb-2">{variation.emoji}</div>
                      <div className="font-medium text-sm mb-1">{variation.name}</div>
                      <div className="text-xs text-destructive text-center">
                        {variation.error || 'Generation failed'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {variations.length > 0 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  data-testid="button-cancel-camera-angles"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={!selectedAngle}
                  data-testid="button-apply-camera-angle"
                >
                  Apply Selected Angle
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
