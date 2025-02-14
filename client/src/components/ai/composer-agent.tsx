import { Music2, Wand2 } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function ComposerAgent() {
  const theme: AgentTheme = {
    gradient: "from-purple-600 to-blue-600",
    iconColor: "text-white",
    accentColor: "#7C3AED",
    personality: "🎵 Maestro Creativo"
  };

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
      name="Compositor Musical AI"
      description="Tu compañero creativo para la composición musical"
      icon={Music2}
      actions={actions}
      theme={theme}
      helpText="Soy tu Maestro Creativo musical. Con años de experiencia en composición y arreglos, te ayudaré a dar vida a tus ideas musicales utilizando mi avanzada inteligencia artificial. ¡Juntos crearemos obras maestras!"
    />
  );
}