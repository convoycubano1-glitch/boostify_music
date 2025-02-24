import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

export function BudgetSection() {
  return (
    <Card className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-orange-500/10 rounded-lg">
          <DollarSign className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold">Production Budget</h3>
          <p className="text-muted-foreground mt-1">
            Manage and track production expenses
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-8">
        <div className="space-y-6">
          <h4 className="text-xl font-medium">Equipment & Technical</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span>Sound System</span>
              <span className="text-orange-500 font-medium">$2,000</span>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span>Lighting</span>
              <span className="text-orange-500 font-medium">$1,500</span>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span>Stage Setup</span>
              <span className="text-orange-500 font-medium">$1,000</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xl font-medium">Staff & Services</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span>Technical Staff</span>
              <span className="text-orange-500 font-medium">$1,200</span>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span>Security</span>
              <span className="text-orange-500 font-medium">$800</span>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span>Catering</span>
              <span className="text-orange-500 font-medium">$600</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-orange-500/5 rounded-lg mb-8">
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold">Total Budget</span>
          <span className="text-3xl font-bold text-orange-500">$7,100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
          Create Budget
        </Button>
        <Button size="lg" variant="outline">
          Export Report
        </Button>
      </div>
    </Card>
  );
}
