import { Megaphone } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { useState } from "react";
import { ProgressIndicator } from "./progress-indicator";
import { openRouterService } from "@/lib/api/openrouter-service";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface Step {
  message: string;
  timestamp: Date;
}

export function MarketingAgent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);

  const theme: AgentTheme = {
    gradient: "from-green-500 to-emerald-700",
    iconColor: "text-white",
    accentColor: "#10B981",
    personality: "💼 Digital Strategist"
  };

  const simulateThinking = async () => {
    setIsThinking(true);
    setProgress(0);
    setSteps([]);

    const simulatedSteps = [
      "Analyzing target audience...",
      "Evaluating market trends...",
      "Developing strategy...",
      "Optimizing campaign parameters...",
      "Finalizing recommendations..."
    ];

    for (let i = 0; i < simulatedSteps.length; i++) {
      setSteps(prev => [...prev, {
        message: simulatedSteps[i],
        timestamp: new Date()
      }]);
      setProgress((i + 1) * 20);
      await new Promise(resolve => setTimeout(resolve, 1300));
    }

    setIsThinking(false);
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
        }
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Marketing AI.",
            variant: "destructive"
          });
          return;
        }

        try {
          await simulateThinking();

          const prompt = `Create a comprehensive marketing plan with the following parameters:
          Target Audience: ${params.target}
          Budget: $${params.budget}
          Main Platform: ${params.platform}

          Please provide:
          1. Campaign strategy
          2. Content calendar
          3. Budget allocation
          4. KPIs and metrics
          5. Growth projections`;

          const response = await openRouterService.chatWithAgent(
            prompt,
            'marketing',
            user.uid,
            "You are an experienced digital marketing strategist specializing in music industry promotion and audience growth."
          );

          toast({
            title: "Marketing Plan Generated",
            description: "Your marketing strategy has been created successfully.",
          });

          return response;
        } catch (error) {
          console.error("Error generating marketing plan:", error);
          toast({
            title: "Error",
            description: "Failed to generate marketing plan. Please try again.",
            variant: "destructive"
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
    >
      {(isThinking || steps.length > 0) && (
        <ProgressIndicator
          steps={steps}
          progress={progress}
          isThinking={isThinking}
          isComplete={progress === 100}
        />
      )}
    </BaseAgent>
  );
}