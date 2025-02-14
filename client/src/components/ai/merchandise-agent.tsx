import { ShoppingBag } from "lucide-react";
import { BaseAgent, type AgentAction, type AgentTheme } from "./base-agent";

export function MerchandiseAgent() {
  const theme: AgentTheme = {
    gradient: "from-amber-500 to-yellow-600",
    iconColor: "text-white",
    accentColor: "#F59E0B",
    personality: "🛍️ Creative Designer"
  };

  const actions: AgentAction[] = [
    {
      name: "Design products",
      description: "Generate designs for merchandise",
      parameters: [
        {
          name: "productType",
          type: "select",
          label: "Product Type",
          description: "Select the type of product to design",
          options: [
            { value: "tshirt", label: "T-Shirts" },
            { value: "hoodie", label: "Hoodies" },
            { value: "accessories", label: "Accessories" },
            { value: "prints", label: "Prints/Posters" },
          ],
          defaultValue: "tshirt"
        },
        {
          name: "style",
          type: "select",
          label: "Design Style",
          description: "Visual style for merchandise",
          options: [
            { value: "minimal", label: "Minimalist" },
            { value: "artistic", label: "Artistic" },
            { value: "urban", label: "Urban" },
            { value: "vintage", label: "Vintage" },
          ],
          defaultValue: "minimal"
        }
      ],
      action: async (params) => {
        console.log("Designing products:", params);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    },
    {
      name: "Analyze trends",
      description: "Identify trends in music merchandise",
      parameters: [
        {
          name: "market",
          type: "select",
          label: "Target Market",
          description: "Main market to analyze",
          options: [
            { value: "global", label: "Global" },
            { value: "local", label: "Local" },
            { value: "regional", label: "Regional" },
          ],
          defaultValue: "global"
        }
      ],
      action: async (params) => {
        console.log("Analyzing trends:", params);
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    },
    {
      name: "Optimize pricing",
      description: "Suggest competitive pricing strategies",
      parameters: [
        {
          name: "priceRange",
          type: "select",
          label: "Price Range",
          description: "Target price range",
          options: [
            { value: "budget", label: "Budget" },
            { value: "mid", label: "Mid-range" },
            { value: "premium", label: "Premium" },
          ],
          defaultValue: "mid"
        }
      ],
      action: async (params) => {
        console.log("Optimizing prices:", params);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  ];

  return (
    <BaseAgent
      name="Merchandise Designer AI"
      description="Your expert in merchandise design and management"
      icon={ShoppingBag}
      actions={actions}
      theme={theme}
      helpText="Hey there! I'm your Creative Designer for merchandise. I specialize in creating unique products that connect with your fans and reflect your artistic identity. Together, we'll create merch your followers will love! 🎨"
    />
  );
}