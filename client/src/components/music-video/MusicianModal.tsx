import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Music, Guitar, Piano, Mic, Drum, Upload, Sparkles, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  onMusicianCreated: (musicianData: any) => void;
}

export function MusicianModal({
  open,
  onClose,
  timelineItem,
  scriptContext,
  director,
  concept,
  onMusicianCreated,
}: MusicianModalProps) {
  const { toast } = useToast();
  const [selectedInstrument, setSelectedInstrument] = useState<string>("");
  const [generatedDescription, setGeneratedDescription] = useState<string>("");
  const [faceReferenceFile, setFaceReferenceFile] = useState<File | null>(null);
  const [faceReferenceUrl, setFaceReferenceUrl] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"generate" | "photo">("generate");

  const generateDescriptionMutation = useMutation({
    mutationFn: async (instrument: string) => {
      const response = await apiRequest("/api/musician-clips/generate-description", {
        method: "POST",
        body: JSON.stringify({
          instrument,
          scriptContext,
          timestamp: timelineItem.timestamp,
          director,
          concept,
        }),
      });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedDescription(data.description);
      toast({
        title: "Description Generated",
        description: "Musician character description created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate description",
        variant: "destructive",
      });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async ({
      description,
      faceRef,
    }: {
      description: string;
      faceRef?: string;
    }) => {
      const response = await apiRequest("/api/musician-clips/generate-image", {
        method: "POST",
        body: JSON.stringify({
          description,
          faceReferenceUrl: faceRef,
        }),
      });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      toast({
        title: "Musician Generated",
        description: "Character image created successfully",
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
      const response = await apiRequest("/api/musician-clips/save", {
        method: "POST",
        body: JSON.stringify(musicianData),
      });
      return response;
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
    generateDescriptionMutation.mutate(instrumentId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaceReferenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaceReferenceUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = () => {
    if (!generatedDescription) {
      toast({
        title: "No Description",
        description: "Please generate a character description first",
        variant: "destructive",
      });
      return;
    }

    generateImageMutation.mutate({
      description: generatedDescription,
      faceRef: activeTab === "photo" ? faceReferenceUrl : undefined,
    });
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
      timelineItemId: timelineItem.id,
      musicianType: selectedInstrument,
      characterDescription: generatedDescription,
      faceReferenceUrl: activeTab === "photo" ? faceReferenceUrl : null,
      generatedImageUrl,
      scriptContext,
      cutTimestamp: timelineItem.timestamp,
    });
  };

  const handleClose = () => {
    setSelectedInstrument("");
    setGeneratedDescription("");
    setFaceReferenceFile(null);
    setFaceReferenceUrl("");
    setGeneratedImageUrl("");
    setActiveTab("generate");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Add Musician to Timeline
          </DialogTitle>
          <DialogDescription>
            Add a musician character at {timelineItem.timestamp.toFixed(2)}s
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instrument Selector */}
          <div className="space-y-3">
            <Label>Select Instrument</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {INSTRUMENTS.map((instrument) => {
                const Icon = instrument.icon;
                return (
                  <Card
                    key={instrument.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedInstrument === instrument.id
                        ? "border-primary border-2 bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleInstrumentSelect(instrument.id)}
                    data-testid={`instrument-${instrument.id}`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{instrument.emoji}</div>
                      <div className="text-sm font-medium">{instrument.name}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Tabs for Generation Method */}
          {selectedInstrument && (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="generate" data-testid="tab-generate">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate New
                </TabsTrigger>
                <TabsTrigger value="photo" data-testid="tab-photo">
                  <Upload className="w-4 h-4 mr-2" />
                  Use Photo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-4">
                <div className="space-y-2">
                  <Label>Character Description</Label>
                  <Textarea
                    value={generatedDescription}
                    onChange={(e) => setGeneratedDescription(e.target.value)}
                    rows={6}
                    placeholder="Character description will appear here..."
                    disabled={generateDescriptionMutation.isPending}
                    data-testid="textarea-description"
                  />
                  {generateDescriptionMutation.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating description with AI...
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="photo" className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Face Reference</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="face-upload"
                      data-testid="input-face-upload"
                    />
                    <label
                      htmlFor="face-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {faceReferenceUrl ? (
                        <img
                          src={faceReferenceUrl}
                          alt="Face reference"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload your photo
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Character Body/Outfit Description</Label>
                  <Textarea
                    value={generatedDescription}
                    onChange={(e) => setGeneratedDescription(e.target.value)}
                    rows={6}
                    placeholder="Describe the outfit, pose, and setting for the musician..."
                    data-testid="textarea-body-description"
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Generated Image Preview */}
          {generatedImageUrl && (
            <div className="space-y-2">
              <Label>Generated Musician</Label>
              <div className="rounded-lg overflow-hidden border">
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
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            {generatedDescription && !generatedImageUrl && (
              <Button
                onClick={handleGenerateImage}
                disabled={generateImageMutation.isPending}
                data-testid="button-generate-image"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
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
              >
                {saveMusicianMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
