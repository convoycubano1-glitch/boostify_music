import { Music2, Wand2 } from "lucide-react";
import { BaseAgent, type AgentAction } from "./base-agent";

export function ComposerAgent() {
  const actions: AgentAction[] = [
    {
      name: "Generar composición musical",
      description: "Crear una nueva composición basada en parámetros específicos",
      parameters: [
        {
          name: "genre",
          type: "select",
          label: "Género Musical",
          description: "Selecciona el género musical base para la composición",
          options: [
            { value: "pop", label: "Pop" },
            { value: "rock", label: "Rock" },
            { value: "hiphop", label: "Hip Hop" },
            { value: "electronic", label: "Electrónica" },
            { value: "classical", label: "Clásica" },
            { value: "jazz", label: "Jazz" },
          ],
          defaultValue: "pop"
        },
        {
          name: "tempo",
          type: "number",
          label: "Tempo (BPM)",
          description: "Velocidad de la composición en beats por minuto",
          defaultValue: "120"
        },
        {
          name: "mood",
          type: "select",
          label: "Estado de Ánimo",
          description: "Define el carácter emocional de la composición",
          options: [
            { value: "happy", label: "Alegre" },
            { value: "sad", label: "Melancólico" },
            { value: "energetic", label: "Enérgico" },
            { value: "calm", label: "Tranquilo" },
            { value: "dark", label: "Oscuro" },
          ],
          defaultValue: "energetic"
        },
        {
          name: "duration",
          type: "select",
          label: "Duración",
          description: "Duración aproximada de la composición",
          options: [
            { value: "short", label: "Corta (2-3 min)" },
            { value: "medium", label: "Media (3-4 min)" },
            { value: "long", label: "Larga (4-5 min)" },
          ],
          defaultValue: "medium"
        }
      ],
      action: async (params) => {
        // Aquí iría la lógica de integración con la API de generación de música
        console.log("Generando composición con parámetros:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Analizar estructura musical",
      description: "Analizar la estructura y elementos de una composición",
      parameters: [
        {
          name: "audioFile",
          type: "text",
          label: "URL del Audio",
          description: "URL del archivo de audio a analizar",
        }
      ],
      action: async (params) => {
        console.log("Analizando audio:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    },
    {
      name: "Sugerir arreglos",
      description: "Proponer mejoras y variaciones para una composición",
      parameters: [
        {
          name: "style",
          type: "select",
          label: "Estilo de Arreglo",
          description: "Estilo musical para las sugerencias de arreglo",
          options: [
            { value: "minimal", label: "Minimalista" },
            { value: "orchestral", label: "Orquestal" },
            { value: "electronic", label: "Electrónico" },
            { value: "acoustic", label: "Acústico" },
          ],
          defaultValue: "minimal"
        }
      ],
      action: async (params) => {
        console.log("Generando sugerencias de arreglos:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }
  ];

  return (
    <BaseAgent
      name="Agente Compositor"
      description="Asistente de composición musical potenciado por IA"
      icon={Music2}
      actions={actions}
      helpText="Este agente te ayuda a crear composiciones musicales originales, analizar estructuras musicales existentes y sugerir arreglos creativos utilizando inteligencia artificial."
    />
  );
}