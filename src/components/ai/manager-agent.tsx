// src/components/ai/manager-agent.tsx

import { UserCog } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";
import { useState } from "react";
import { ProgressIndicator } from "./progress-indicator";
import { openRouterService } from "../../lib/api/openrouteraiagents";
import { useAuth } from "../../hooks/use-auth";
import { useToast } from "../../hooks/use-toast";

interface Step {
  message: string;
  timestamp: Date;
}

export function ManagerAgent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<{ id?: string; response: string; timestamp?: Date } | null>(null);

  const theme: AgentTheme = {
    gradient: "from-red-500 to-orange-600",
    iconColor: "text-white",
    accentColor: "#EF4444",
    personality: "👔 Executive Manager",
  };

  const simulateThinking = async () => {
    setIsThinking(true);
    setProgress(0);
    setSteps([]);

    const simulatedSteps = [
      "Initializing analysis engine...",
      "Loading historical data...",
      "Processing market trends...",
      "Generating strategic insights...",
      "Optimizing recommendations...",
    ];

    for (let i = 0; i < simulatedSteps.length; i++) {
      setSteps((prev) => [...prev, { message: simulatedSteps[i], timestamp: new Date() }]);
      setProgress((i + 1) * 20);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  };

  const actions: AgentAction[] = [
    {
      name: "Analyze performance",
      description: "Evaluate artist performance metrics",
      parameters: [
        {
          name: "metrics",
          type: "select",
          label: "Metrics Type",
          description: "Main metrics to analyze",
          options: [
            { value: "streaming", label: "Streaming" },
            { value: "social", label: "Social Media" },
            { value: "live", label: "Live Events" },
            { value: "all", label: "All metrics" },
          ],
          defaultValue: "all",
        },
        {
          name: "timeframe",
          type: "select",
          label: "Time Period",
          description: "Time period to analyze",
          options: [
            { value: "month", label: "Last month" },
            { value: "quarter", label: "Last quarter" },
            { value: "year", label: "Last year" },
          ],
          defaultValue: "quarter",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Manager AI.",
            variant: "destructive",
          });
          return;
        }

        try {
          await simulateThinking();

          const prompt = `Analyze artist performance with the following parameters:
          Metrics Type: ${params.metrics}
          Time Period: ${params.timeframe}

          Please provide:
          1. Performance analysis
          2. Key metrics evaluation
          3. Trend identification
          4. Strategic recommendations`;

          const response = await openRouterService.chatWithAgent(
            prompt,
            "manager",
            user.uid,
            "You are an experienced music industry executive with expertise in artist management and business strategy."
          );

          setResult(response);
          toast({
            title: "Analysis Complete",
            description: "Your performance analysis is ready.",
          });

          return response;
        } catch (error: any) {
          const errorMessage = error?.message || "Failed to complete analysis. Please try again.";
          const errorStack = error?.stack || "No stack trace";
          
          console.error("Detailed error analyzing performance:", {
            message: errorMessage,
            stack: errorStack,
          });
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        } finally {
          setIsThinking(false);
        }
      },
    },
    {
      name: "Plan strategy",
      description: "Develop career strategic plan",
      parameters: [
        {
          name: "focus",
          type: "select",
          label: "Main Focus",
          description: "Main strategic focus area",
          options: [
            { value: "growth", label: "Audience Growth" },
            { value: "revenue", label: "Revenue Generation" },
            { value: "branding", label: "Brand Development" },
            { value: "touring", label: "Tours and Events" },
          ],
          defaultValue: "growth",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Manager AI.",
            variant: "destructive",
          });
          return;
        }
        try {
          await simulateThinking();
          const prompt = `Develop a career strategic plan focusing on ${params.focus}.
          Please provide a detailed plan including actionable steps and timelines.`;
          const response = await openRouterService.chatWithAgent(
            prompt,
            "manager",
            user.uid,
            "You are an experienced music industry executive with expertise in artist management and business strategy."
          );
          setResult(response);
          toast({
            title: "Plan Complete",
            description: "Your strategic plan is ready.",
          });
          return response;
        } catch (error: any) {
          const errorMessage = error?.message || "Failed to complete plan. Please try again.";
          const errorStack = error?.stack || "No stack trace";
          
          console.error("Detailed error planning strategy:", {
            message: errorMessage,
            stack: errorStack,
          });
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        } finally {
          setIsThinking(false);
        }
      },
    },
    {
      name: "Coordinate activities",
      description: "Suggest and coordinate promotional activities",
      parameters: [
        {
          name: "activityType",
          type: "select",
          label: "Activity Type",
          description: "Main type of promotional activity",
          options: [
            { value: "press", label: "Press and Media" },
            { value: "events", label: "Events" },
            { value: "collabs", label: "Collaborations" },
            { value: "digital", label: "Digital Campaigns" },
          ],
          defaultValue: "press",
        },
      ],
      action: async (params) => {
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the Manager AI.",
            variant: "destructive",
          });
          return;
        }
        try {
          await simulateThinking();
          const prompt = `Suggest and coordinate promotional activities of type ${params.activityType}.
          Please provide a detailed plan including specific activities, timelines, and potential collaborators.`;
          const response = await openRouterService.chatWithAgent(
            prompt,
            "manager",
            user.uid,
            "You are an experienced music industry executive with expertise in artist management and business strategy."
          );
          setResult(response);
          toast({
            title: "Coordination Complete",
            description: "Your activity plan is ready.",
          });
          return response;
        } catch (error: any) {
          const errorMessage = error?.message || "Failed to coordinate activities. Please try again.";
          const errorStack = error?.stack || "No stack trace";
          
          console.error("Detailed error coordinating activities:", {
            message: errorMessage,
            stack: errorStack,
          });
          
          toast({
            title: "Error",
            description: errorMessage,
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
      name="Manager AI"
      description="Your executive assistant for artist management"
      icon={UserCog}
      actions={actions}
      theme={theme}
      helpText="As your Executive Manager, I handle optimizing every aspect of your music career. With my expertise in data analysis and strategic planning, I'll help you make informed decisions and achieve your professional goals. Let's take your career to the next level! 📈"
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
          <pre className="whitespace-pre-wrap text-sm">{result.response}</pre>
        </div>
      )}
    </BaseAgent>
  );
}