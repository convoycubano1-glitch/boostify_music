import { Megaphone } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { useToast } from "@/hooks/use-toast";

export function MarketingAgent() {
  const { toast } = useToast();

  const theme: AgentTheme = {
    gradient: "from-green-500 to-emerald-700",
    iconColor: "text-white",
    accentColor: "#10B981",
    personality: "💼 Digital Strategist"
  };

  const actions: AgentAction[] = [
    {
      name: "Generate marketing plan",
      description: "Create personalized music marketing strategy",
      parameters: [
        {
          name: "target",
          type: "select",
          label: "Target Audience",
          description: "Select the main target audience for the campaign",
          options: [
            { value: "gen-z", label: "Generation Z (13-25)" },
            { value: "millennials", label: "Millennials (26-40)" },
            { value: "gen-x", label: "Generation X (41-55)" },
            { value: "broad", label: "General Audience" },
          ],
          defaultValue: "millennials"
        },
        {
          name: "budget",
          type: "number",
          label: "Budget ($)",
          description: "Monthly budget for the marketing campaign",
          defaultValue: "1000"
        },
        {
          name: "platform",
          type: "select",
          label: "Main Platform",
          description: "Primary platform for the campaign",
          options: [
            { value: "instagram", label: "Instagram" },
            { value: "tiktok", label: "TikTok" },
            { value: "youtube", label: "YouTube" },
            { value: "spotify", label: "Spotify" },
            { value: "all", label: "All platforms" },
          ],
          defaultValue: "instagram"
        },
        {
          name: "duration",
          type: "select",
          label: "Campaign Duration",
          description: "Planned duration of the campaign",
          options: [
            { value: "1month", label: "1 month" },
            { value: "3months", label: "3 months" },
            { value: "6months", label: "6 months" },
            { value: "12months", label: "12 months" },
          ],
          defaultValue: "3months"
        }
      ],
      action: async (params) => {
        try {
          const response = await fetch('/api/ai/campaign-suggestion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: "Music Marketing Campaign",
              description: `Target: ${params.target}, Platform: ${params.platform}, Duration: ${params.duration}`,
              platform: params.platform,
              budget: params.budget
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate marketing plan');
          }

          const data = await response.json();
          toast({
            title: "Marketing Plan Generated",
            description: "Check your dashboard for the detailed strategy.",
          });

          return data;
        } catch (error) {
          console.error("Error generating marketing plan:", error);
          toast({
            title: "Error",
            description: "Failed to generate marketing plan. Please try again.",
            variant: "destructive",
          });
        }
      }
    },
    {
      name: "Schedule content",
      description: "Plan and schedule posts automatically",
      parameters: [
        {
          name: "contentType",
          type: "select",
          label: "Content Type",
          description: "Main type of content to schedule",
          options: [
            { value: "posts", label: "Regular Posts" },
            { value: "stories", label: "Stories" },
            { value: "reels", label: "Reels/Short Videos" },
            { value: "mixed", label: "Mixed Content" },
          ],
          defaultValue: "mixed"
        },
        {
          name: "frequency",
          type: "select",
          label: "Frequency",
          description: "Posting frequency",
          options: [
            { value: "daily", label: "Daily" },
            { value: "3times", label: "3 times per week" },
            { value: "weekly", label: "Weekly" },
            { value: "custom", label: "Custom" },
          ],
          defaultValue: "3times"
        }
      ],
      action: async (params) => {
        try {
          const response = await fetch('/api/generate-strategy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
          });

          if (!response.ok) {
            throw new Error('Failed to generate content schedule');
          }

          const data = await response.json();
          toast({
            title: "Content Schedule Created",
            description: "Your content calendar has been updated.",
          });

          return data;
        } catch (error) {
          console.error("Error scheduling content:", error);
          toast({
            title: "Error",
            description: "Failed to create content schedule. Please try again.",
            variant: "destructive",
          });
        }
      }
    },
    {
      name: "Analyze results",
      description: "Analyze metrics and generate performance reports",
      parameters: [
        {
          name: "metrics",
          type: "select",
          label: "Key Metrics",
          description: "Key metrics to analyze",
          options: [
            { value: "engagement", label: "Engagement" },
            { value: "growth", label: "Growth" },
            { value: "conversion", label: "Conversion" },
            { value: "all", label: "All metrics" },
          ],
          defaultValue: "all"
        },
        {
          name: "timeframe",
          type: "select",
          label: "Analysis Period",
          description: "Time period to analyze",
          options: [
            { value: "7days", label: "Last 7 days" },
            { value: "30days", label: "Last 30 days" },
            { value: "90days", label: "Last 90 days" },
            { value: "custom", label: "Custom" },
          ],
          defaultValue: "30days"
        }
      ],
      action: async (params) => {
        try {
          // Here we would integrate with actual analytics APIs
          // For now, we'll simulate the analysis
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast({
            title: "Analysis Complete",
            description: "Your performance report is ready to view.",
          });
        } catch (error) {
          console.error("Error analyzing results:", error);
          toast({
            title: "Error",
            description: "Failed to generate analysis. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  ];

  return (
    <BaseAgent
      name="Strategic Marketing AI"
      description="Your expert in digital strategies and growth"
      icon={Megaphone}
      actions={actions}
      theme={theme}
      helpText="As your Digital Strategist, I specialize in creating and executing effective marketing strategies to maximize your online presence and reach your ideal audience. I'll use advanced data and analytics to optimize every campaign."
    />
  );
}