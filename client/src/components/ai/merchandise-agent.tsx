import { ShoppingBag } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function MerchandiseAgent() {
  const theme: AgentTheme = {
    gradient: "from-amber-500 to-yellow-600",
    iconColor: "text-white",
    accentColor: "#F59E0B",
    personality: "🛍️ Diseñador Creativo"
  };

  const actions: AgentAction[] = [
    {
      name: "Diseñar productos",
      description: "Generar diseños para merchandising",
      parameters: [
        {
          name: "productType",
          type: "select",
          label: "Tipo de Producto",
          description: "Selecciona el tipo de producto a diseñar",
          options: [
            { value: "tshirt", label: "Camisetas" },
            { value: "hoodie", label: "Sudaderas" },
            { value: "accessories", label: "Accesorios" },
            { value: "prints", label: "Prints/Posters" },
          ],
          defaultValue: "tshirt"
        },
        {
          name: "style",
          type: "select",
          label: "Estilo de Diseño",
          description: "Estilo visual para el merchandising",
          options: [
            { value: "minimal", label: "Minimalista" },
            { value: "artistic", label: "Artístico" },
            { value: "urban", label: "Urbano" },
            { value: "vintage", label: "Vintage" },
          ],
          defaultValue: "minimal"
        }
      ],
      action: async (params) => {
        console.log("Diseñando productos:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Analizar tendencias",
      description: "Identificar tendencias en merchandising musical",
      parameters: [
        {
          name: "market",
          type: "select",
          label: "Mercado Objetivo",
          description: "Mercado principal a analizar",
          options: [
            { value: "global", label: "Global" },
            { value: "local", label: "Local" },
            { value: "regional", label: "Regional" },
          ],
          defaultValue: "global"
        }
      ],
      action: async (params) => {
        console.log("Analizando tendencias:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Optimizar precios",
      description: "Sugerir estrategias de precios competitivos",
      parameters: [
        {
          name: "priceRange",
          type: "select",
          label: "Rango de Precios",
          description: "Rango de precios objetivo",
          options: [
            { value: "budget", label: "Económico" },
            { value: "mid", label: "Medio" },
            { value: "premium", label: "Premium" },
          ],
          defaultValue: "mid"
        }
      ],
      action: async (params) => {
        console.log("Optimizando precios:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Merchandise Designer AI"
      description="Tu experto en diseño y gestión de merchandising"
      icon={ShoppingBag}
      actions={actions}
      theme={theme}
      helpText="¡Hey! Soy tu Diseñador Creativo de merchandising. Me especializo en crear productos únicos que conectan con tus fans y reflejan tu identidad artística. ¡Juntos crearemos merch que tus seguidores amarán! 🎨"
    />
  );
}