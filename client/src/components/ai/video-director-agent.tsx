import { Video, Film } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function VideoDirectorAgent() {
  const theme: AgentTheme = {
    gradient: "from-blue-500 to-indigo-600",
    iconColor: "text-white",
    accentColor: "#3B82F6",
    personality: "🎬 Visionary Director"
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
          defaultValue: "narrative"
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
          defaultValue: "dramatic"
        }
      ],
      action: async (params) => {
        console.log("Generating script with parameters:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
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
          defaultValue: "240"
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
          defaultValue: "urban"
        }
      ],
      action: async (params) => {
        console.log("Planning sequences:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
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
          defaultValue: "moderate"
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
          defaultValue: "cinematic"
        }
      ],
      action: async (params) => {
        console.log("Generating effects suggestions:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Video Director AI"
      description="Your assistant for music video direction and production"
      icon={Video}
      actions={actions}
      theme={theme}
      helpText="As your Visionary Director, I'll help you create compelling scripts, plan dynamic sequences, and select stunning visual effects for your music videos. Let's bring your visual storytelling to life with cutting-edge creativity!"
    />
  );
}