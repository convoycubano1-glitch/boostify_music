import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  Upload,
  Loader2,
  Music2,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as fal from "@fal-ai/serverless-client";

fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

export function MusicVideoAI() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<string>("");
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

          if (typeof result === 'object' && result !== null && 'text' in result) {
            const text = (result as { text: string }).text;
            setTranscription(text);
            generateVideoScript(text);
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
      const result = await fal.subscribe("fal-ai/llama-2-70b-chat", {
        input: {
          prompt: `As a creative music video director, create a detailed video script based on these song lyrics. Include visual scenes, transitions, and artistic direction:

Lyrics:
${lyrics}

Create a professional music video script that captures the essence and emotion of the song.`,
        },
      });

      if (typeof result === 'object' && result !== null && 'text' in result) {
        setGeneratedScript((result as { text: string }).text);
      }
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

        {generatedScript && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" />
              Generated Video Script
            </h3>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="text-sm whitespace-pre-wrap">{generatedScript}</div>
            </ScrollArea>
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