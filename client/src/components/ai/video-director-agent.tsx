import { Video } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { useState } from "react";
import { ProgressIndicator } from "./progress-indicator";
import { openRouterService } from "@/lib/api/openrouteraiagents";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import html2pdf from 'html2pdf.js';

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

  const exportToPDF = () => {
    if (!result) return;

    const content = document.getElementById('video-script-content');
    if (!content) return;

    const opt = {
      margin: 1,
      filename: 'video_script.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(content).save();
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

  const generateScript = async (params: any) => {
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
      console.error("Error generating script:", error);
      toast({
        title: "Error",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsThinking(false);
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
      action: generateScript,
    },
  ];

  return (
    <BaseAgent
      name="Video Director AI"
      description="Your assistant for music video direction and production"
      icon={Video}
      actions={actions}
      theme={theme}
      helpText="As your Visionary Director, I'll help you create compelling scripts, plan dynamic sequences, and select stunning visual effects for your music videos. Let's bring your visual storytelling to life!"
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
        <div className="mt-4 space-y-4">
          <div id="video-script-content" className="p-6 bg-black/20 backdrop-blur rounded-lg border border-blue-500/20">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">Music Video Script</h3>
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-transparent">{result}</pre>
            </div>
          </div>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      )}
    </BaseAgent>
  );
}