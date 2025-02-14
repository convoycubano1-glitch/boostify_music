import { ShoppingBag } from "lucide-react";
import { BaseAgent, type AgentAction } from "./base-agent";

export function MerchandiseAgent() {
  const actions: AgentAction[] = [
    {
      name: "Diseñar productos",
      description: "Generar diseños para merchandising",
      action: async () => {
        // Here would go the merchandise design logic
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Analizar tendencias",
      description: "Identificar tendencias en merchandising musical",
      action: async () => {
        // Here would go the trend analysis logic
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Optimizar precios",
      description: "Sugerir estrategias de precios competitivos",
      action: async () => {
        // Here would go the pricing strategy logic
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Agente de Merchandise"
      description="Gestor de merchandising y productos"
      icon={ShoppingBag}
      actions={actions}
    />
  );
}
