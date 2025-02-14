import { Video, Film } from "lucide-react";
import { BaseAgent, type AgentAction } from "./base-agent";

export function VideoDirectorAgent() {
  const actions: AgentAction[] = [
    {
      name: "Generar guión de video musical",
      description: "Crear un guión detallado basado en la letra y el género musical",
      parameters: [
        {
          name: "lyrics",
          type: "text",
          label: "Letra de la Canción",
          description: "Letra completa de la canción para el video",
        },
        {
          name: "style",
          type: "select",
          label: "Estilo Visual",
          description: "Estilo visual principal para el video",
          options: [
            { value: "narrative", label: "Narrativo" },
            { value: "abstract", label: "Abstracto" },
            { value: "performance", label: "Performance" },
            { value: "experimental", label: "Experimental" },
            { value: "animation", label: "Animación" },
          ],
          defaultValue: "narrative"
        },
        {
          name: "mood",
          type: "select",
          label: "Atmósfera",
          description: "Ambiente y tono emocional del video",
          options: [
            { value: "dramatic", label: "Dramático" },
            { value: "upbeat", label: "Alegre" },
            { value: "melancholic", label: "Melancólico" },
            { value: "energetic", label: "Enérgico" },
            { value: "mysterious", label: "Misterioso" },
          ],
          defaultValue: "dramatic"
        }
      ],
      action: async (params) => {
        console.log("Generando guión con parámetros:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Planificar secuencias",
      description: "Crear un storyboard y planificación de escenas",
      parameters: [
        {
          name: "duration",
          type: "number",
          label: "Duración (segundos)",
          description: "Duración total del video en segundos",
          defaultValue: "240"
        },
        {
          name: "locations",
          type: "select",
          label: "Tipo de Locación",
          description: "Ambiente principal para las escenas",
          options: [
            { value: "urban", label: "Urbano" },
            { value: "nature", label: "Naturaleza" },
            { value: "studio", label: "Estudio" },
            { value: "mixed", label: "Mixto" },
          ],
          defaultValue: "urban"
        }
      ],
      action: async (params) => {
        console.log("Planificando secuencias:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Sugerir efectos visuales",
      description: "Recomendar efectos visuales y transiciones",
      parameters: [
        {
          name: "complexity",
          type: "select",
          label: "Complejidad",
          description: "Nivel de complejidad de los efectos",
          options: [
            { value: "simple", label: "Simple" },
            { value: "moderate", label: "Moderado" },
            { value: "complex", label: "Complejo" },
            { value: "experimental", label: "Experimental" },
          ],
          defaultValue: "moderate"
        },
        {
          name: "style",
          type: "select",
          label: "Estilo de Efectos",
          description: "Estilo principal de los efectos visuales",
          options: [
            { value: "cinematic", label: "Cinematográfico" },
            { value: "glitch", label: "Glitch" },
            { value: "retro", label: "Retro" },
            { value: "minimal", label: "Minimalista" },
          ],
          defaultValue: "cinematic"
        }
      ],
      action: async (params) => {
        console.log("Generando sugerencias de efectos:", params);
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
      helpText="Este agente te ayuda a crear guiones, planificar secuencias y seleccionar efectos visuales para tus videos musicales, optimizando el proceso creativo y la producción."
    />
  );
}