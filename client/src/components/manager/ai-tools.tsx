import { Card } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIToolsSection() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-orange-500/10 rounded-lg">
          <Brain className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">AI Tools</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered management assistance
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-4 hover:bg-orange-500/5">
          <h4 className="font-medium mb-2">Schedule Optimization</h4>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered schedule analysis and optimization
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Optimize Schedule
          </Button>
        </Card>

        <Card className="p-4 hover:bg-orange-500/5">
          <h4 className="font-medium mb-2">Budget Analysis</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Smart budget recommendations and insights
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Analyze Budget
          </Button>
        </Card>

        <Card className="p-4 hover:bg-orange-500/5">
          <h4 className="font-medium mb-2">Resource Allocation</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Intelligent resource management suggestions
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Optimize Resources
          </Button>
        </Card>
      </div>
    </Card>
  );
}