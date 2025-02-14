import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, HelpCircle } from "lucide-react";
import { ProgressIndicator } from "./progress-indicator";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AgentParameter {
  name: string;
  type: "text" | "select" | "number";
  label: string;
  description: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number;
}

export interface AgentAction {
  name: string;
  description: string;
  parameters?: AgentParameter[];
  action: (params: Record<string, any>) => Promise<void>;
}

interface BaseAgentProps {
  name: string;
  description: string;
  icon: React.ElementType;
  actions: AgentAction[];
  helpText?: string;
}

interface ProgressStep {
  message: string;
  timestamp: Date;
}

export function BaseAgent({ name, description, icon: Icon, actions, helpText }: BaseAgentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const addStep = (message: string) => {
    setSteps(prev => [...prev, { message, timestamp: new Date() }]);
  };

  const handleParameterChange = (actionName: string, paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [actionName]: {
        ...(prev[actionName] || {}),
        [paramName]: value
      }
    }));
  };

  const handleAction = async (action: AgentAction) => {
    try {
      setIsProcessing(true);
      setProgress(0);
      setSteps([]);
      setIsComplete(false);

      addStep(`Iniciando ${action.name}...`);
      setProgress(10);

      const actionParams = parameters[action.name] || {};
      await action.action(actionParams);

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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{name}</h3>
            {helpText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-6">
        {actions.map((action) => (
          <div key={action.name} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{action.name}</h4>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </div>

            {action.parameters && (
              <div className="grid gap-4">
                {action.parameters.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <Label htmlFor={`${action.name}-${param.name}`}>
                      {param.label}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1">
                              <HelpCircle className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{param.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>

                    {param.type === "select" && param.options ? (
                      <Select
                        disabled={isProcessing}
                        value={parameters[action.name]?.[param.name] || param.defaultValue}
                        onValueChange={(value) => handleParameterChange(action.name, param.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar opción" />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : param.type === "number" ? (
                      <Input
                        type="number"
                        id={`${action.name}-${param.name}`}
                        value={parameters[action.name]?.[param.name] || param.defaultValue}
                        onChange={(e) => handleParameterChange(action.name, param.name, e.target.value)}
                        disabled={isProcessing}
                      />
                    ) : (
                      <Input
                        type="text"
                        id={`${action.name}-${param.name}`}
                        value={parameters[action.name]?.[param.name] || param.defaultValue}
                        onChange={(e) => handleParameterChange(action.name, param.name, e.target.value)}
                        disabled={isProcessing}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={() => handleAction(action)}
              disabled={isProcessing}
              className="w-full justify-start gap-2"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Ejecutar {action.name}
            </Button>
          </div>
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