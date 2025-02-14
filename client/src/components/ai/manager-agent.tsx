import { UserCog } from "lucide-react";
import { BaseAgent, type AgentAction } from "./base-agent";

export function ManagerAgent() {
  const actions: AgentAction[] = [
    {
      name: "Analizar rendimiento",
      description: "Evaluar métricas de rendimiento del artista",
      action: async () => {
        // Here would go the performance analysis logic
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Planificar estrategia",
      description: "Desarrollar plan estratégico de carrera",
      action: async () => {
        // Here would go the strategy planning logic
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Coordinar actividades",
      description: "Sugerir y coordinar actividades promocionales",
      action: async () => {
        // Here would go the activity coordination logic
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Agente Manager"
      description="Asistente de gestión y coordinación artística"
      icon={UserCog}
      actions={actions}
    />
  );
}
