import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  change: number;
}

export function StatsCard({ title, value, change }: StatsCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold">{value?.toLocaleString() ?? '-'}</p>
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm ${
              change > 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </Card>
  );
}
