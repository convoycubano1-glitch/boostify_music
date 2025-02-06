import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Timeline from "react-calendar-timeline";
import {
  Video,
  Upload,
  Loader2,
  Music2,
  FileText,
  Clock,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Initialize Fal.ai
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

interface TimelineItem {
  id: number;
  group: number;
  title: string;
  start_time: number;
  end_time: number;
  description: string;
  shotType: string;
  imagePrompt?: string;
  generatedImage?: string;
}

interface ShotDescription {
  time: string;
  description: string;
  shotType: string;
  imagePrompt: string;
}

export function MusicVideoAI() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingShots, setIsGeneratingShots] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [shotSequence, setShotSequence] = useState<ShotDescription[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Error",
          description: "Please upload a valid audio file (MP3)",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setTranscription("");
      setGeneratedScript("");
      setShotSequence([]);
      setTimelineItems([]);
    }
  };

  const transcribeAudio = async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    try {
      // Convert audio file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const base64Audio = (e.target.result as string).split(",")[1];

          const result = await fal.subscribe("fal-ai/whisper", {
            input: {
              audio: base64Audio,
              model_size: "base",
            },
          });

          if (result && typeof result === 'object' && 'text' in result) {
            const text = result.text;
            setTranscription(text);
            generateVideoScript(text);
          } else {
            throw new Error("Invalid response format from Whisper API");
          }
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateVideoScript = async (lyrics: string) => {
    setIsGeneratingScript(true);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a professional music video director. Create a detailed video script based on song lyrics. Include specific shot types (wide, medium, close-up), camera movements, and visual metaphors. Structure the output as a JSON array with each object containing 'time' (in seconds from start), 'description', 'shotType', and 'imagePrompt' for AI image generation.`
          },
          {
            role: "user",
            content: `Create a music video script for these lyrics, with shots approximately every 5 seconds:\n\n${lyrics}`
          }
        ],
        response_format: { type: "json_object" }
      });

      if (response.choices[0].message.content) {
        const scriptResult = JSON.parse(response.choices[0].message.content);
        if (scriptResult.shots && Array.isArray(scriptResult.shots)) {
          setShotSequence(scriptResult.shots);
          generateTimelineItems(scriptResult.shots);
        }
      }

      setGeneratedScript(response.choices[0].message.content || "");
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Error",
        description: "Failed to generate video script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateTimelineItems = (shots: ShotDescription[]) => {
    const items = shots.map((shot, index) => ({
      id: index + 1,
      group: 1,
      title: shot.shotType,
      start_time: parseInt(shot.time) * 1000, // Convert to milliseconds
      end_time: (parseInt(shot.time) + 5) * 1000, // Each shot is 5 seconds
      description: shot.description,
      shotType: shot.shotType,
      imagePrompt: shot.imagePrompt
    }));
    setTimelineItems(items);
  };

  const generateShotImages = async () => {
    setIsGeneratingShots(true);
    try {
      const updatedItems = [...timelineItems];
      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        if (!item.generatedImage && item.imagePrompt) {
          const result = await fal.subscribe("fal-ai/stable-diffusion-xl-v1", {
            input: {
              prompt: `Create a professional cinematic shot for a music video: ${item.imagePrompt}. Style: ${item.shotType}. Professional, high quality, cinematic lighting, film grain.`,
              negative_prompt: "low quality, blurry, distorted, deformed, unrealistic, cartoon, anime, illustration",
              image_size: "landscape_16_9"
            },
          });

          if (result.images?.[0]?.url) {
            updatedItems[i] = {
              ...item,
              generatedImage: result.images[0].url
            };
            setTimelineItems([...updatedItems]); // Force re-render with spread operator
          }

          // Add a small delay between generations to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("Error generating shot images:", error);
      toast({
        title: "Error",
        description: "Failed to generate some shot images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShots(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Video className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">AI Music Video Creator</h2>
          <p className="text-sm text-muted-foreground">
            Generate video concepts from your music
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Label>Upload Song (MP3)</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="file"
              accept="audio/mpeg"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={transcribeAudio}
              disabled={!selectedFile || isTranscribing}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Music2 className="mr-2 h-4 w-4" />
                  Process Audio
                </>
              )}
            </Button>
          </div>
        </div>

        {transcription && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Music2 className="h-4 w-4 text-orange-500" />
              Transcribed Lyrics
            </h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <p className="text-sm whitespace-pre-wrap">{transcription}</p>
            </ScrollArea>
          </div>
        )}

        {shotSequence.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Shot Sequence
              </h3>
              <Button
                onClick={generateShotImages}
                disabled={isGeneratingShots}
                variant="outline"
                size="sm"
              >
                {isGeneratingShots ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Images...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Shot Images
                  </>
                )}
              </Button>
            </div>
            <div className="border rounded-lg p-4">
              <Timeline
                groups={[{ id: 1, title: 'Shots' }]}
                items={timelineItems}
                defaultTimeStart={timelineItems[0]?.start_time || 0}
                defaultTimeEnd={timelineItems[timelineItems.length - 1]?.end_time || 60000}
                canMove={false}
                canResize={false}
                itemRenderer={({ item }) => (
                  <div className="relative h-full">
                    <div className="absolute inset-0 bg-orange-500/10 rounded flex items-center justify-center text-xs p-1">
                      {item.title}
                      {item.generatedImage && (
                        <img 
                          src={item.generatedImage} 
                          alt={item.description}
                          className="absolute inset-0 w-full h-full object-cover rounded opacity-50 hover:opacity-100 transition-opacity"
                        />
                      )}
                    </div>
                  </div>
                )}
              />
            </div>
          </div>
        )}

        {isGeneratingScript && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        )}
      </div>
    </Card>
  );
}