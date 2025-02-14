import { Share2 } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function SocialMediaAgent() {
  const theme: AgentTheme = {
    gradient: "from-pink-500 to-rose-600",
    iconColor: "text-white",
    accentColor: "#EC4899",
    personality: "📱 Influencer Digital"
  };

  const actions: AgentAction[] = [
    {
      name: "Planificar contenido",
      description: "Crear calendario de contenido para redes sociales",
      parameters: [
        {
          name: "platforms",
          type: "select",
          label: "Plataformas",
          description: "Plataformas principales para el contenido",
          options: [
            { value: "instagram", label: "Instagram" },
            { value: "tiktok", label: "TikTok" },
            { value: "youtube", label: "YouTube" },
            { value: "all", label: "Todas las plataformas" },
          ],
          defaultValue: "all"
        },
        {
          name: "frequency",
          type: "select",
          label: "Frecuencia",
          description: "Frecuencia de publicación",
          options: [
            { value: "daily", label: "Diario" },
            { value: "weekly", label: "Semanal" },
            { value: "biweekly", label: "Quincenal" },
            { value: "monthly", label: "Mensual" },
          ],
          defaultValue: "weekly"
        }
      ],
      action: async (params) => {
        console.log("Planificando contenido:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Analizar engagement",
      description: "Analizar métricas de engagement y sugerir mejoras",
      parameters: [
        {
          name: "period",
          type: "select",
          label: "Período de Análisis",
          description: "Período de tiempo a analizar",
          options: [
            { value: "week", label: "Última semana" },
            { value: "month", label: "Último mes" },
            { value: "quarter", label: "Último trimestre" },
            { value: "year", label: "Último año" },
          ],
          defaultValue: "month"
        }
      ],
      action: async (params) => {
        console.log("Analizando engagement:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Generar hashtags",
      description: "Sugerir hashtags relevantes para mayor alcance",
      parameters: [
        {
          name: "genre",
          type: "select",
          label: "Género Musical",
          description: "Género principal de tu música",
          options: [
            { value: "pop", label: "Pop" },
            { value: "rock", label: "Rock" },
            { value: "hiphop", label: "Hip Hop" },
            { value: "electronic", label: "Electrónica" },
            { value: "latin", label: "Latino" },
          ],
          defaultValue: "pop"
        }
      ],
      action: async (params) => {
        console.log("Generando hashtags:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Social Media AI"
      description="Tu estratega en redes sociales"
      icon={Share2}
      actions={actions}
      theme={theme}
      helpText="¡Hola! Soy tu Influencer Digital personal. Me especializo en mantener tus redes sociales activas y atractivas, creando contenido que resuena con tu audiencia y aumenta tu visibilidad en el mundo digital. ¡Hagamos que tu música sea viral! 🚀"
    />
  );
}