import { Share2 } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function SocialMediaAgent() {
  const theme: AgentTheme = {
    gradient: "from-pink-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "#EC4899",
    personality: "📱 Digital Influencer"
  };

  const actions: AgentAction[] = [
    {
      name: "Plan content",
      description: "Create social media content calendar",
      parameters: [
        {
          name: "platforms",
          type: "select",
          label: "Platforms",
          description: "Main platforms for content",
          options: [
            { value: "instagram", label: "Instagram" },
            { value: "tiktok", label: "TikTok" },
            { value: "youtube", label: "YouTube" },
            { value: "all", label: "All platforms" },
          ],
          defaultValue: "all"
        },
        {
          name: "frequency",
          type: "select",
          label: "Frequency",
          description: "Posting frequency",
          options: [
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "biweekly", label: "Bi-weekly" },
            { value: "monthly", label: "Monthly" },
          ],
          defaultValue: "weekly"
        }
      ],
      action: async (params) => {
        console.log("Planning content:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Analyze engagement",
      description: "Analyze engagement metrics and suggest improvements",
      parameters: [
        {
          name: "period",
          type: "select",
          label: "Analysis Period",
          description: "Time period to analyze",
          options: [
            { value: "week", label: "Last week" },
            { value: "month", label: "Last month" },
            { value: "quarter", label: "Last quarter" },
            { value: "year", label: "Last year" },
          ],
          defaultValue: "month"
        }
      ],
      action: async (params) => {
        console.log("Analyzing engagement:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Generate hashtags",
      description: "Suggest relevant hashtags for better reach",
      parameters: [
        {
          name: "genre",
          type: "select",
          label: "Music Genre",
          description: "Main genre of your music",
          options: [
            { value: "pop", label: "Pop" },
            { value: "rock", label: "Rock" },
            { value: "hiphop", label: "Hip Hop" },
            { value: "electronic", label: "Electronic" },
            { value: "latin", label: "Latin" },
          ],
          defaultValue: "pop"
        }
      ],
      action: async (params) => {
        console.log("Generating hashtags:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Social Media AI"
      description="Your social media strategy expert"
      icon={Share2}
      actions={actions}
      theme={theme}
      helpText="Hey! I'm your Digital Influencer. I specialize in keeping your social media active and engaging, creating content that resonates with your audience and increases your visibility in the digital world. Let's make your music go viral! 🚀"
    />
  );
}