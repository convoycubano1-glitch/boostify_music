import { Megaphone } from "lucide-react";
import { BaseAgent, type AgentAction } from "./base-agent";

export function MarketingAgent() {
  const actions: AgentAction[] = [
    {
      name: "Generar plan de marketing",
      description: "Crear estrategia de marketing musical personalizada",
      parameters: [
        {
          name: "target",
          type: "select",
          label: "Audiencia Objetivo",
          description: "Selecciona el tipo de audiencia principal para la campaña",
          options: [
            { value: "gen-z", label: "Generación Z (13-25)" },
            { value: "millennials", label: "Millennials (26-40)" },
            { value: "gen-x", label: "Generación X (41-55)" },
            { value: "broad", label: "Audiencia General" },
          ],
          defaultValue: "millennials"
        },
        {
          name: "budget",
          type: "number",
          label: "Presupuesto ($)",
          description: "Presupuesto mensual para la campaña de marketing",
          defaultValue: "1000"
        },
        {
          name: "platform",
          type: "select",
          label: "Plataforma Principal",
          description: "Plataforma principal para la campaña",
          options: [
            { value: "instagram", label: "Instagram" },
            { value: "tiktok", label: "TikTok" },
            { value: "youtube", label: "YouTube" },
            { value: "spotify", label: "Spotify" },
            { value: "all", label: "Todas las plataformas" },
          ],
          defaultValue: "instagram"
        },
        {
          name: "duration",
          type: "select",
          label: "Duración de Campaña",
          description: "Duración planificada de la campaña",
          options: [
            { value: "1month", label: "1 mes" },
            { value: "3months", label: "3 meses" },
            { value: "6months", label: "6 meses" },
            { value: "12months", label: "12 meses" },
          ],
          defaultValue: "3months"
        }
      ],
      action: async (params) => {
        console.log("Generando plan de marketing:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Programar contenido",
      description: "Planificar y programar publicaciones automáticamente",
      parameters: [
        {
          name: "contentType",
          type: "select",
          label: "Tipo de Contenido",
          description: "Tipo principal de contenido a programar",
          options: [
            { value: "posts", label: "Posts Regulares" },
            { value: "stories", label: "Stories" },
            { value: "reels", label: "Reels/Videos Cortos" },
            { value: "mixed", label: "Contenido Mixto" },
          ],
          defaultValue: "mixed"
        },
        {
          name: "frequency",
          type: "select",
          label: "Frecuencia",
          description: "Frecuencia de publicación",
          options: [
            { value: "daily", label: "Diaria" },
            { value: "3times", label: "3 veces por semana" },
            { value: "weekly", label: "Semanal" },
            { value: "custom", label: "Personalizada" },
          ],
          defaultValue: "3times"
        }
      ],
      action: async (params) => {
        console.log("Programando contenido:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Analizar resultados",
      description: "Analizar métricas y generar informes de rendimiento",
      parameters: [
        {
          name: "metrics",
          type: "select",
          label: "Métricas Principales",
          description: "Métricas clave a analizar",
          options: [
            { value: "engagement", label: "Engagement" },
            { value: "growth", label: "Crecimiento" },
            { value: "conversion", label: "Conversión" },
            { value: "all", label: "Todas las métricas" },
          ],
          defaultValue: "all"
        },
        {
          name: "timeframe",
          type: "select",
          label: "Período de Análisis",
          description: "Período de tiempo a analizar",
          options: [
            { value: "7days", label: "Últimos 7 días" },
            { value: "30days", label: "Últimos 30 días" },
            { value: "90days", label: "Últimos 90 días" },
            { value: "custom", label: "Personalizado" },
          ],
          defaultValue: "30days"
        }
      ],
      action: async (params) => {
        console.log("Analizando resultados:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Agente de Marketing"
      description="Automatización y gestión integral de marketing musical"
      icon={Megaphone}
      actions={actions}
      helpText="Este agente te ayuda a automatizar tus campañas de marketing musical, programar contenido y analizar resultados utilizando inteligencia artificial para optimizar tu alcance y engagement."
    />
  );
}