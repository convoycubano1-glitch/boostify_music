// src/components/ai/video-director-agent.tsx

import { Video } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { useState } from "react";
import { ProgressIndicator } from "./progress-indicator";
import { openRouterService } from "@/lib/api/openrouteraiagents";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Step {
  message: string;
  timestamp: Date;
}

export function VideoDirectorAgent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const theme: AgentTheme = {
    gradient: "from-blue-500 to-indigo-600",
    iconColor: "text-white",
    accentColor: "#3B82F6",
    personality: "🎬 Visionary Director",
  };

  const simulateThinking = async () => {
    setIsThinking(true);
    setProgress(0);
    setSteps([]);

    const simulatedSteps = [
      "Analyzing creative brief...",
      "Developing visual concepts...",
      "Planning shot sequences...",
      "Designing visual effects...",
      "Finalizing creative direction...",
    ];

    for (let i = 0; i < simulatedSteps.length; i++) {
      setSteps((prev) => [...prev, { message: simulatedSteps[i], timestamp: new Date() }]);
      setProgress((i + 1) * 20);
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  };

  const actions: AgentAction[] = [
    {
      name: "Generate music video script",
      description: "Create a detailed script based on lyrics and music genre",
      parameters: [
        {
          name: "lyrics",
          type: "text",
          label: "Song Lyrics",
          description: "Complete lyrics for the video",
        },
        {
          name: "style",
          type: "select",
          label: "Visual Style",
          description: "Main visual style for the video",
          options: [
            { value: "narrative", label: "Narrative" },
            { value: "abstract", label: "Abstract" },
            { value: "performance", label: "Performance" },
            { value: "experimental", label: "Experimental" },
            { value: "animation", label: "Animation" },
          ],
          defaultValue: "narrative",
        },
        {
          name: "mood",
          type: "select",
          label: "Atmosphere",
          description: "Emotional tone and atmosphere of the video",
          options: [
            { value: "dramatic", label: "Dramatic" },
            { value: "upbeat", label: "Upbeat" },
            { value: "melancholic", label: "Melancholic" },
            { value: "energetic", label: "Energetic" },
            { value: "mysterious", label: "Mysterious" },
          ],
          defaultValue: "dramatic",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Video Director AI.",
            variant: "destructive",
          });
          return;
        }

        try {
          await simulateThinking();

          const prompt = `Create a detailed music video script with the following parameters:
          Lyrics: ${params.lyrics}
          Visual Style: ${params.style}
          Mood: ${params.mood}

          Please provide:
          1. Scene-by-scene breakdown
          2. Visual direction
          3. Camera movements
          4. Special effects suggestions
          5. Narrative elements`;

          console.log("Generating script with prompt:", prompt);

          const response = await openRouterService.chatWithAgent(
            prompt,
            "videoDirector",
            user.uid,
            "You are an experienced music video director with expertise in visual storytelling and cinematography."
          );

          setResult(response);
          toast({
            title: "Script Generated",
            description: "Your music video script has been created successfully.",
          });

          return response;
        } catch (error) {
          console.error("Detailed error generating script:", {
            message: error.message,
            stack: error.stack,
          });
          toast({
            title: "Error",
            description: error.message || "Failed to generate script. Please try again.",
            variant: "destructive",
          });
          throw error;
        } finally {
          setIsThinking(false);
        }
      },
    },
    {
      name: "Plan sequences",
      description: "Create storyboard and scene planning",
      parameters: [
        {
          name: "duration",
          type: "number",
          label: "Duration (seconds)",
          description: "Total video duration in seconds",
          defaultValue: "240",
        },
        {
          name: "locations",
          type: "select",
          label: "Location Type",
          description: "Main environment for scenes",
          options: [
            { value: "urban", label: "Urban" },
            { value: "nature", label: "Nature" },
            { value: "studio", label: "Studio" },
            { value: "mixed", label: "Mixed" },
          ],
          defaultValue: "urban",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Video Director AI.",
            variant: "destructive",
          });
          return;
        }
        try {
          await simulateThinking();
          const prompt = `Plan sequences for a music video with the following parameters:
          Duration: ${params.duration} seconds
          Location Type: ${params.locations}

          Please provide a detailed storyboard and scene breakdown.`;
          const response = await openRouterService.chatWithAgent(
            prompt,
            "videoDirector",
            user.uid,
            "You are an experienced music video director with expertise in visual storytelling and cinematography."
          );
          setResult(response);
          toast({
            title: "Sequences Planned",
            description: "Your music video sequences have been planned successfully.",
          });
          return response;
        } catch (error) {
          console.error("Detailed error planning sequences:", {
            message: error.message,
            stack: error.stack,
          });
          toast({
            title: "Error",
            description: error.message || "Failed to plan sequences. Please try again.",
            variant: "destructive",
          });
          throw error;
        } finally {
          setIsThinking(false);
        }
      },
    },
    {
      name: "Suggest visual effects",
      description: "Recommend visual effects and transitions",
      parameters: [
        {
          name: "complexity",
          type: "select",
          label: "Complexity",
          description: "Level of effects complexity",
          options: [
            { value: "simple", label: "Simple" },
            { value: "moderate", label: "Moderate" },
            { value: "complex", label: "Complex" },
            { value: "experimental", label: "Experimental" },
          ],
          defaultValue: "moderate",
        },
        {
          name: "style",
          type: "select",
          label: "Effects Style",
          description: "Main style of visual effects",
          options: [
            { value: "cinematic", label: "Cinematic" },
            { value: "glitch", label: "Glitch" },
            { value: "retro", label: "Retro" },
            { value: "minimal", label: "Minimalist" },
          ],
          defaultValue: "cinematic",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Video Director AI.",
            variant: "destructive",
          });
          return;
        }
        try {
          await simulateThinking();
          const prompt = `Suggest visual effects and transitions for a music video with the following parameters:
          Complexity: ${params.complexity}
          Style: ${params.style}

          Please provide a list of suitable effects and transitions.`;
          const response = await openRouterService.chatWithAgent(
            prompt,
            "videoDirector",
            user.uid,
            "You are an experienced music video director with expertise in visual storytelling and cinematography."
          );
          setResult(response);
          toast({
            title: "Effects Suggested",
            description: "Visual effects suggestions have been generated successfully.",
          });
          return response;
        } catch (error) {
          console.error("Detailed error suggesting effects:", {
            message: error.message,
            stack: error.stack,
          });
          toast({
            title: "Error",
            description: error.message || "Failed to suggest effects. Please try again.",
            variant: "destructive",
          });
          throw error;
        } finally {
          setIsThinking(false);
        }
      },
    },
  ];

  return (
    <BaseAgent
      name="Video Director AI"
      description="Your assistant for music video direction and production"
      icon={Video}
      actions={actions}
      theme={theme}
      helpText="As your Visionary Director, I'll help you create compelling scripts, plan dynamic sequences, and select stunning visual effects for your music videos. Let's bring your visual storytelling to life with cutting-edge creativity!"
    >
      {(isThinking || steps.length > 0) && (
        <ProgressIndicator
          steps={steps}
          progress={progress}
          isThinking={isThinking}
          isComplete={progress === 100}
        />
      )}
      {result && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Generated Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </BaseAgent>
  );
}