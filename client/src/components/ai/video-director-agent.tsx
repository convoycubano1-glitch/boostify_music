import { Video, Film } from "lucide-react";
import { BaseAgent, type AgentAction } from "./base-agent";

export function VideoDirectorAgent() {
  const actions: AgentAction[] = [
    {
      name: "Generar guión de video musical",
      description: "Crear un guión detallado basado en la letra y el género musical",
      action: async () => {
        // Aquí iría la lógica de generación de guiones
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Planificar secuencias",
      description: "Crear un storyboard y planificación de escenas",
      action: async () => {
        // Aquí iría la lógica de planificación de secuencias
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Sugerir efectos visuales",
      description: "Recomendar efectos visuales y transiciones",
      action: async () => {
        // Aquí iría la lógica de sugerencias de efectos
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Agente Director de Video"
      description="Asistente de dirección y producción de videos musicales"
      icon={Video}
      actions={actions}
    />
  );
}
