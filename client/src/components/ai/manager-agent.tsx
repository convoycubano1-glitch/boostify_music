import { UserCog } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function ManagerAgent() {
  const theme: AgentTheme = {
    gradient: "from-red-500 to-orange-600",
    iconColor: "text-white",
    accentColor: "#EF4444",
    personality: "👔 Executive Manager"
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
          defaultValue: "all"
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
          defaultValue: "quarter"
        }
      ],
      action: async (params) => {
        console.log("Analyzing performance:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
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
          defaultValue: "growth"
        }
      ],
      action: async (params) => {
        console.log("Planning strategy:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
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
          defaultValue: "press"
        }
      ],
      action: async (params) => {
        console.log("Coordinating activities:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Manager AI"
      description="Your executive assistant for artist management"
      icon={UserCog}
      actions={actions}
      theme={theme}
      helpText="As your Executive Manager, I handle optimizing every aspect of your music career. With my expertise in data analysis and strategic planning, I'll help you make informed decisions and achieve your professional goals. Let's take your career to the next level! 📈"
    />
  );
}