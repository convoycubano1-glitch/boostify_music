import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ProgressIndicator } from "./progress-indicator";
import { useToast } from "@/hooks/use-toast";

export interface AgentAction {
  name: string;
  description: string;
  action: () => Promise<void>;
}

interface BaseAgentProps {
  name: string;
  description: string;
  icon: React.ElementType;
  actions: AgentAction[];
}

interface ProgressStep {
  message: string;
  timestamp: Date;
}

export function BaseAgent({ name, description, icon: Icon, actions }: BaseAgentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const addStep = (message: string) => {
    setSteps(prev => [...prev, { message, timestamp: new Date() }]);
  };

  const handleAction = async (action: AgentAction) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setSteps([]);
      setIsComplete(false);

      addStep(`Iniciando ${action.name}...`);
      setProgress(10);

      await action.action();

      setProgress(100);
      setIsComplete(true);
      addStep(`${action.name} completado con éxito`);

      toast({
        title: "Acción completada",
        description: `${action.name} se ha completado correctamente.`,
      });
    } catch (error) {
      console.error(`Error in ${action.name}:`, error);
      toast({
        title: "Error",
        description: `Error al ejecutar ${action.name}. Por favor, intente nuevamente.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {actions.map((action) => (
          <Button
            key={action.name}
            onClick={() => handleAction(action)}
            disabled={isProcessing}
            className="w-full justify-start gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {action.name}
          </Button>
        ))}
      </div>

      {(isProcessing || steps.length > 0) && (
        <ProgressIndicator
          steps={steps}
          progress={progress}
          isComplete={isComplete}
        />
      )}
    </Card>
  );
}
