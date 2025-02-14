import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateMusic } from "@/lib/api/zuno-ai";

export function MusicAIGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please provide a description for your music",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const result = await generateMusic({
        prompt,
        modelName: "chirp-v3.5",
        title: "Generated Music",
        tags: "ai generated"
      });

      toast({
        title: "Success",
        description: "Music generation started successfully"
      });

    } catch (error) {
      console.error("Error generating music:", error);
      toast({
        title: "Error",
        description: "Failed to generate music. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Describe the music you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <Button 
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Music className="mr-2 h-4 w-4" />
            Generate Music
          </>
        )}
      </Button>
    </div>
  );
}
