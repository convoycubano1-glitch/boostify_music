import { useState, useEffect } from "react";
import { logger } from "../../lib/logger";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Music, Guitar, Piano, Mic, Drum, Sparkles, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

const INSTRUMENTS = [
  { id: "guitar", name: "Guitar", icon: Guitar, emoji: "🎸" },
  { id: "piano", name: "Piano", icon: Piano, emoji: "🎹" },
  { id: "bass", name: "Bass", icon: Music, emoji: "🎸" },
  { id: "drums", name: "Drums", icon: Drum, emoji: "🥁" },
  { id: "vocals", name: "Vocals", icon: Mic, emoji: "🎤" },
  { id: "saxophone", name: "Saxophone", icon: Music, emoji: "🎺" },
  { id: "trumpet", name: "Trumpet", icon: Music, emoji: "🎺" },
  { id: "violin", name: "Violin", icon: Music, emoji: "🎻" },
];

interface MusicianModalProps {
  open: boolean;
  onClose: () => void;
  timelineItem: {
    id: string;
    timestamp: number;
    imageUrl?: string;
  };
  scriptContext: string;
  director?: {
    name: string;
    style: string;
  };
  concept?: string;
  projectId?: number;
  onMusicianCreated: (musicianData: any) => void;
}

export function MusicianModal({
  open,
  onClose,
  timelineItem,
  scriptContext,
  director,
  concept,
  projectId,
  onMusicianCreated,
}: MusicianModalProps) {
  const { toast } = useToast();
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [musicianTypeDescription, setMusicianTypeDescription] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");

  // Load previous musician description for this instrument from this project
  const { data: previousMusicians } = useQuery({
    queryKey: ['/api/musician-clips/project', projectId],
    enabled: !!projectId && open,
  });

  // Auto-fill description when selecting instrument if it exists
  useEffect(() => {
    if (selectedInstrument && previousMusicians && Array.isArray(previousMusicians)) {
      const previousMusician = previousMusicians.find(
        (m: any) => m.musicianType === selectedInstrument && m.characterDescription
      );
      if (previousMusician) {
        setMusicianTypeDescription(previousMusician.characterDescription);
        logger.info(`✅ Loaded previous description for ${selectedInstrument}:`, previousMusician.characterDescription);
      }
    }
  }, [selectedInstrument, previousMusicians]);

  const generateImageMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await fetch("/api/musician-clips/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      toast({
        title: "Musician Generated",
        description: "Character image created successfully with Gemini nano banana",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    },
  });

  const saveMusicianMutation = useMutation({
    mutationFn: async (musicianData: any) => {
      const response = await fetch("/api/musician-clips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(musicianData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save musician");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Musician Saved",
        description: "Musician added to timeline successfully",
      });
      onMusicianCreated(data.musicianClip);
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save musician",
        variant: "destructive",
      });
    },
  });

  const handleInstrumentSelect = (instrumentId: string) => {
    setSelectedInstrument(instrumentId);
    // Reset description only if no previous musician exists
    if (!previousMusicians?.find((m: any) => m.musicianType === instrumentId)) {
      setMusicianTypeDescription("");
    }
  };

  const handleGenerateImage = () => {
    if (!selectedInstrument) {
      toast({
        title: "Missing Instrument",
        description: "Please select an instrument first",
        variant: "destructive",
      });
      return;
    }

    if (!musicianTypeDescription.trim()) {
      toast({
        title: "Missing Description",
        description: "Please describe what type of musician you want",
        variant: "destructive",
      });
      return;
    }

    // Create full cinematic prompt
    const instrument = INSTRUMENTS.find(i => i.id === selectedInstrument);
    const fullPrompt = `Cinematic ${instrument?.name} player: ${musicianTypeDescription}. ${director ? `Director style: ${director.style}. ` : ''}${concept ? `Video concept: ${concept}. ` : ''}Photorealistic, professional lighting, 8K resolution, cinematic composition.`;

    logger.info('🎸 Generating musician with prompt:', fullPrompt);
    generateImageMutation.mutate(fullPrompt);
  };

  const handleSave = () => {
    if (!generatedImageUrl || !selectedInstrument) {
      toast({
        title: "Incomplete",
        description: "Please generate a musician image before saving",
        variant: "destructive",
      });
      return;
    }

    saveMusicianMutation.mutate({
      projectId,
      timelineItemId: timelineItem.id,
      musicianType: selectedInstrument,
      characterDescription: musicianTypeDescription, // Save user's description for consistency
      generatedImageUrl,
      scriptContext,
      cutTimestamp: timelineItem.timestamp,
    });
  };

  const handleClose = () => {
    setSelectedInstrument("");
    setMusicianTypeDescription("");
    setGeneratedImageUrl("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-purple-950/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Music className="w-6 h-6 text-purple-500" />
            Add Musician to Timeline
          </DialogTitle>
          <DialogDescription className="text-base">
            Create a musician at {timelineItem.timestamp.toFixed(2)}s • Description saved for consistency
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instrument Selector */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold">Select Instrument</Label>
            <div className="grid grid-cols-4 gap-3">
              {INSTRUMENTS.map((instrument) => {
                return (
                  <Card
                    key={instrument.id}
                    className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                      selectedInstrument === instrument.id
                        ? "border-purple-500 border-2 bg-purple-500/10 shadow-md"
                        : "border-border hover:border-purple-300"
                    }`}
                    onClick={() => handleInstrumentSelect(instrument.id)}
                    data-testid={`instrument-${instrument.id}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-4xl mb-2">{instrument.emoji}</div>
                      <div className="text-sm font-medium">{instrument.name}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Musician Type Description Input */}
          {selectedInstrument && (
            <div className="space-y-3 p-5 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
              <Label htmlFor="musician-description" className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Describe Your Musician
              </Label>
              <Input
                id="musician-description"
                value={musicianTypeDescription}
                onChange={(e) => setMusicianTypeDescription(e.target.value)}
                placeholder="e.g., young rock guitarist with leather jacket, tattoos, playing electric guitar..."
                className="text-base h-12"
                data-testid="input-musician-description"
              />
              <p className="text-sm text-muted-foreground">
                💡 Be specific: age, gender, style, clothing, pose. This description will be reused for consistency.
              </p>
            </div>
          )}

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="space-y-3 p-4 rounded-lg border-2 border-green-500/30 bg-green-500/5">
              <Label className="text-lg font-semibold flex items-center gap-2">
                ✅ Generated Musician
              </Label>
              <div className="rounded-lg overflow-hidden border-2 border-green-500/30">
                <img
                  src={generatedImageUrl}
                  alt="Generated musician"
                  className="w-full object-cover"
                  data-testid="img-generated-musician"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel"
              className="h-11"
            >
              Cancel
            </Button>
            {musicianTypeDescription && !generatedImageUrl && (
              <Button
                onClick={handleGenerateImage}
                disabled={generateImageMutation.isPending}
                data-testid="button-generate-image"
                className="h-11 bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Musician
                  </>
                )}
              </Button>
            )}
            {generatedImageUrl && (
              <Button
                onClick={handleSave}
                disabled={saveMusicianMutation.isPending}
                data-testid="button-save-musician"
                className="h-11 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {saveMusicianMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Apply to Timeline"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
