import { UserCog } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function ManagerAgent() {
  const theme: AgentTheme = {
    gradient: "from-red-500 to-orange-600",
    iconColor: "text-white",
    accentColor: "#EF4444",
    personality: "👔 Manager Ejecutivo"
  };

  const actions: AgentAction[] = [
    {
      name: "Analizar rendimiento",
      description: "Evaluar métricas de rendimiento del artista",
      parameters: [
        {
          name: "metrics",
          type: "select",
          label: "Tipo de Métricas",
          description: "Métricas principales a analizar",
          options: [
            { value: "streaming", label: "Streaming" },
            { value: "social", label: "Redes Sociales" },
            { value: "live", label: "Eventos en Vivo" },
            { value: "all", label: "Todas las métricas" },
          ],
          defaultValue: "all"
        },
        {
          name: "timeframe",
          type: "select",
          label: "Período",
          description: "Período de tiempo a analizar",
          options: [
            { value: "month", label: "Último mes" },
            { value: "quarter", label: "Último trimestre" },
            { value: "year", label: "Último año" },
          ],
          defaultValue: "quarter"
        }
      ],
      action: async (params) => {
        console.log("Analizando rendimiento:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Planificar estrategia",
      description: "Desarrollar plan estratégico de carrera",
      parameters: [
        {
          name: "focus",
          type: "select",
          label: "Enfoque Principal",
          description: "Área principal de enfoque estratégico",
          options: [
            { value: "growth", label: "Crecimiento de Audiencia" },
            { value: "revenue", label: "Generación de Ingresos" },
            { value: "branding", label: "Desarrollo de Marca" },
            { value: "touring", label: "Giras y Eventos" },
          ],
          defaultValue: "growth"
        }
      ],
      action: async (params) => {
        console.log("Planificando estrategia:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Coordinar actividades",
      description: "Sugerir y coordinar actividades promocionales",
      parameters: [
        {
          name: "activityType",
          type: "select",
          label: "Tipo de Actividad",
          description: "Tipo principal de actividad promocional",
          options: [
            { value: "press", label: "Prensa y Medios" },
            { value: "events", label: "Eventos" },
            { value: "collabs", label: "Colaboraciones" },
            { value: "digital", label: "Campañas Digitales" },
          ],
          defaultValue: "press"
        }
      ],
      action: async (params) => {
        console.log("Coordinando actividades:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Manager AI"
      description="Tu asistente ejecutivo para gestión artística"
      icon={UserCog}
      actions={actions}
      theme={theme}
      helpText="Como tu Manager Ejecutivo, me encargo de optimizar cada aspecto de tu carrera musical. Con mi experiencia en análisis de datos y planificación estratégica, te ayudaré a tomar decisiones informadas y alcanzar tus objetivos profesionales. ¡Llevemos tu carrera al siguiente nivel! 📈"
    />
  );
}