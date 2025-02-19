import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface ProductionPhase {
  name: string;
  status: "completed" | "in-progress" | "pending" | "delayed";
  progress: number;
  eta?: string;
}

const productionPhases: ProductionPhase[] = [
  {
    name: "Pre-production",
    status: "completed",
    progress: 100,
  },
  {
    name: "Recording",
    status: "in-progress",
    progress: 65,
    eta: "2 days"
  },
  {
    name: "Editing",
    status: "pending",
    progress: 0,
    eta: "5 days"
  },
  {
    name: "Mixing",
    status: "pending",
    progress: 0,
    eta: "7 days"
  },
  {
    name: "Mastering",
    status: "pending",
    progress: 0,
    eta: "9 days"
  }
];

export function ProductionProgress() {
  const getStatusIcon = (status: ProductionPhase["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "delayed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: ProductionPhase["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-orange-500";
      case "delayed":
        return "bg-red-500";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Production Progress</h3>
        <p className="text-sm text-muted-foreground">
          Track your creative process and production timeline
        </p>
      </div>

      <div className="space-y-6">
        {productionPhases.map((phase, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(phase.status)}
                <span className="text-sm font-medium">{phase.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {phase.eta && (
                  <span className="text-xs text-muted-foreground">
                    ETA: {phase.eta}
                  </span>
                )}
                <span className="text-xs font-medium">
                  {phase.progress}%
                </span>
              </div>
            </div>
            <Progress 
              value={phase.progress} 
              className={`h-1.5 ${getStatusColor(phase.status)}`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}