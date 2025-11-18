// src/components/ai/social-media-agent.tsx
import { logger } from "@/lib/logger";

import { Share2, Save, Download } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { useState } from "react";
import { geminiAgentsService } from "../../lib/api/gemini-agents-service";
import { aiAgentsFirestore } from "../../lib/services/ai-agents-firestore";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../ui/button";

export function SocialMediaAgent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState<string | null>(null);

  const theme: AgentTheme = {
    gradient: "from-pink-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "#EC4899",
    personality: "📱 Digital Influencer",
  };

  const saveToFirestore = async (data: {
    content: string;
    params: any;
  }) => {
    if (!user) return;

    try {
      await aiAgentsFirestore.saveSocialMediaContent(
        user.uid,
        data.content,
        {
          platform: data.params.platforms,
          contentType: "calendar",
          tone: data.params.frequency
        }
      );

      logger.info('✅ Social media content saved to Firestore with Gemini integration');
    } catch (error) {
      logger.error('Error saving to Firestore:', error);
      // Don't throw - continue even if save fails
    }
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
          defaultValue: "all",
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
          defaultValue: "weekly",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Social Media AI.",
            variant: "destructive",
          });
          return;
        }
        try {
          const content = await geminiAgentsService.generateSocialMediaContent({
            platform: params.platforms,
            contentType: "calendar",
            tone: params.frequency
          });

          setResult(content);
          
          // Guardar automáticamente en Firestore
          await saveToFirestore({
            content,
            params
          });

          toast({
            title: "Content Planned & Saved",
            description: "Your social media calendar has been created and saved successfully.",
          });
          return content;
        } catch (error) {
          logger.error("Detailed error planning content:", {
            message: error.message,
            stack: error.stack,
          });
          toast({
            title: "Error",
            description: error.message || "Failed to plan content. Please try again.",
            variant: "destructive",
          });
          throw error;
        }
      },
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
          defaultValue: "month",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Social Media AI.",
            variant: "destructive",
          });
          return;
        }
        try {
          const prompt = `Analyze engagement metrics for the following period: ${params.period}.
          Provide insights and suggestions for improvement.`;
          const response = await openRouterService.chatWithAgent(
            prompt,
            "socialMedia",
            user.uid,
            "You are a social media analyst with expertise in engagement metrics."
          );
          setResult(response);
          toast({
            title: "Engagement Analyzed",
            description: "Engagement analysis completed successfully.",
          });
          return response;
        } catch (error) {
          logger.error("Detailed error analyzing engagement:", {
            message: error.message,
            stack: error.stack,
          });
          toast({
            title: "Error",
            description: error.message || "Failed to analyze engagement. Please try again.",
            variant: "destructive",
          });
          throw error;
        }
      },
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
          defaultValue: "pop",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Social Media AI.",
            variant: "destructive",
          });
          return;
        }
        try {
          const prompt = `Generate relevant hashtags for a music project in the ${params.genre} genre.
          Provide a list of 10-15 hashtags optimized for reach.`;
          const response = await openRouterService.chatWithAgent(
            prompt,
            "socialMedia",
            user.uid,
            "You are a social media strategist specializing in hashtag optimization."
          );
          setResult(response);
          toast({
            title: "Hashtags Generated",
            description: "Your hashtags have been generated successfully.",
          });
          return response;
        } catch (error) {
          logger.error("Detailed error generating hashtags:", {
            message: error.message,
            stack: error.stack,
          });
          toast({
            title: "Error",
            description: error.message || "Failed to generate hashtags. Please try again.",
            variant: "destructive",
          });
          throw error;
        }
      },
    },
  ];

  return (
    <BaseAgent
      name="Social Media AI"
      description="Your social media strategy expert"
      icon={Share2}
      actions={actions}
      theme={theme}
      helpText="Hey! I'm your Digital Influencer. I specialize in keeping your social media active and engaging, creating content that resonates with your audience and increases your visibility in the digital world. Let's make your music go viral! 🚀"
    >
      {result && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Generated Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </BaseAgent>
  );
}