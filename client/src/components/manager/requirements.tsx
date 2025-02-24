import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, MapPin } from "lucide-react";

export function RequirementsSection() {
  return (
    <Card className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-orange-500/10 rounded-lg">
          <Coffee className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <h3 className="text-2xl font-semibold">Artist Requirements</h3>
          <p className="text-muted-foreground mt-1">
            Manage and track artist needs and preferences
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-8">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Coffee className="h-6 w-6 text-orange-500" />
            <h4 className="text-xl font-medium">Catering & Hospitality</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-lg">Dietary restrictions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-lg">Preferred meals</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-lg">Beverages</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="h-6 w-6 text-orange-500" />
            <h4 className="text-xl font-medium">Accommodation</h4>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-lg">Hotel preferences</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-lg">Room requirements</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-lg">Special requests</span>
            </div>
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600">
        Update Requirements
      </Button>
    </Card>
  );
}