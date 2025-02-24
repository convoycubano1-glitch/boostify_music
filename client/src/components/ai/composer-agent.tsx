import { Music2 } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { openRouterService } from "@/lib/api/openrouter-service";
import { sunoService } from "@/lib/api/suno-service";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ProgressIndicator } from "./progress-indicator";

interface Step {
  message: string;
  timestamp: Date;
}

export function ComposerAgent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);

  const theme: AgentTheme = {
    gradient: "from-purple-600 to-blue-600",
    iconColor: "text-white",
    accentColor: "#7C3AED",
    personality: "🎵 Creative Maestro"
  };

  const simulateThinking = async (customSteps?: string[]) => {
    setIsThinking(true);
    setProgress(0);
    setSteps([]);

    const simulatedSteps = customSteps || [
      "Analyzing musical parameters...",
      "Generating composition structure...",
      "Applying musical theory...",
      "Finalizing arrangement...",
      "Preparing response..."
    ];

    for (let i = 0; i < simulatedSteps.length; i++) {
      setSteps(prev => [...prev, {
        message: simulatedSteps[i],
        timestamp: new Date()
      }]);
      setProgress((i + 1) * (100 / simulatedSteps.length));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsThinking(false);
  };

  const actions: AgentAction[] = [
    {
      name: "Generate musical composition",
      description: "Create a new composition using Suno AI",
      parameters: [
        {
          name: "genre",
          type: "select",
          label: "Musical Genre",
          description: "Select the base musical genre for the composition",
          options: [
            { value: "pop", label: "Pop" },
            { value: "rock", label: "Rock" },
            { value: "hiphop", label: "Hip Hop" },
            { value: "electronic", label: "Electronic" },
            { value: "classical", label: "Classical" },
            { value: "jazz", label: "Jazz" },
          ],
          defaultValue: "pop"
        },
        {
          name: "tempo",
          type: "number",
          label: "Tempo (BPM)",
          description: "Speed of the composition in beats per minute",
          defaultValue: "120"
        },
        {
          name: "mood",
          type: "select",
          label: "Mood",
          description: "Define the emotional character of the composition",
          options: [
            { value: "happy", label: "Happy" },
            { value: "sad", label: "Melancholic" },
            { value: "energetic", label: "Energetic" },
            { value: "calm", label: "Calm" },
            { value: "dark", label: "Dark" },
          ],
          defaultValue: "energetic"
        }
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the AI Composer.",
            variant: "destructive"
          });
          return;
        }

        try {
          await simulateThinking([
            "Initializing Suno AI...",
            "Processing musical parameters...",
            "Generating composition...",
            "Applying audio effects...",
            "Finalizing music generation..."
          ]);

          const response = await sunoService.generateMusic(
            {
              genre: params.genre,
              tempo: parseInt(params.tempo),
              mood: params.mood
            },
            user.uid
          );

          setGeneratedMusicUrl(response.musicUrl);

          toast({
            title: "Music Generated",
            description: "Your musical composition has been created successfully.",
          });

          return response;
        } catch (error) {
          console.error("Error generating music:", error);
          toast({
            title: "Error",
            description: "Failed to generate music. Please try again.",
            variant: "destructive"
          });
        }
      }
    },
    {
      name: "Analyze musical structure",
      description: "Analyze the structure and elements of a composition",
      parameters: [
        {
          name: "audioFile",
          type: "text",
          label: "Audio URL",
          description: "URL of the audio file to analyze",
        }
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the AI Composer.",
            variant: "destructive"
          });
          return;
        }
        try {
          await simulateThinking();
          const response = await openRouterService.chatWithAgent(
            `Analyze the musical structure of the audio file at ${params.audioFile}`,
            'composer',
            user.uid,
            "You are an expert music composer with deep knowledge of musical theory and composition techniques."
          );
          toast({ title: "Analysis Complete", description: "Musical structure analysis is complete." });
          return response;
        } catch (error) {
          console.error("Error analyzing audio:", error);
          toast({
            title: "Error",
            description: "Failed to analyze audio. Please try again.",
            variant: "destructive"
          });
        }
      }
    },
    {
      name: "Suggest arrangements",
      description: "Propose improvements and variations for a composition",
      parameters: [
        {
          name: "style",
          type: "select",
          label: "Arrangement Style",
          description: "Musical style for arrangement suggestions",
          options: [
            { value: "minimal", label: "Minimalist" },
            { value: "orchestral", label: "Orchestral" },
            { value: "electronic", label: "Electronic" },
            { value: "acoustic", label: "Acoustic" },
          ],
          defaultValue: "minimal"
        }
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the AI Composer.",
            variant: "destructive"
          });
          return;
        }
        try {
          await simulateThinking();
          const response = await openRouterService.chatWithAgent(
            `Suggest arrangements for a composition in the style of ${params.style}`,
            'composer',
            user.uid,
            "You are an expert music composer with deep knowledge of musical theory and composition techniques."
          );
          toast({ title: "Suggestions Generated", description: "Arrangement suggestions have been generated." });
          return response;
        } catch (error) {
          console.error("Error generating suggestions:", error);
          toast({
            title: "Error",
            description: "Failed to generate suggestions. Please try again.",
            variant: "destructive"
          });
        }
      }
    }
  ];

  return (
    <BaseAgent
      name="AI Music Composer"
      description="Your creative companion for musical composition"
      icon={Music2}
      actions={actions}
      theme={theme}
      helpText="I'm your Creative Maestro. With years of experience in composition and arrangements, I'll help bring your musical ideas to life using my advanced artificial intelligence. Together, we'll create masterpieces!"
    >
      {(isThinking || steps.length > 0) && (
        <ProgressIndicator
          steps={steps}
          progress={progress}
          isThinking={isThinking}
          isComplete={progress === 100}
        />
      )}
      {generatedMusicUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Generated Music</h3>
          <audio controls src={generatedMusicUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </BaseAgent>
  );
}