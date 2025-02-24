import { Card } from "@/components/ui/card";
import { Truck } from "lucide-react";

export function LogisticsSection() {
  return (
    <Card className="p-4 md:p-8">
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
          <Truck className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
        </div>
        <div>
          <h3 className="text-xl md:text-2xl font-semibold mb-1">Production Logistics</h3>
          <p className="text-sm md:text-base text-muted-foreground">
            Coordinate and manage production logistics
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-8">
          <div>
            <h4 className="text-lg md:text-xl font-medium mb-6">Transportation</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <span className="text-sm md:text-base">Equipment transport</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <span className="text-sm md:text-base">Artist transportation</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <span className="text-sm md:text-base">Crew movement</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-lg md:text-xl font-medium mb-6">Schedule</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <span className="text-sm md:text-base">Load-in times</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <span className="text-sm md:text-base">Setup schedule</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2" />
                <span className="text-sm md:text-base">Event timeline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
