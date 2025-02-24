import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HiringSection() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-orange-500/10 rounded-lg">
          <Users className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Staff Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your production team
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-orange-500/5 rounded-lg">
            <div>
              <p className="font-medium">Technical Staff</p>
              <p className="text-sm text-muted-foreground">Sound and lighting technicians</p>
            </div>
            <Button variant="outline" size="sm">View Team</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-orange-500/5 rounded-lg">
            <div>
              <p className="font-medium">Stage Crew</p>
              <p className="text-sm text-muted-foreground">Setup and operations team</p>
            </div>
            <Button variant="outline" size="sm">View Team</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-orange-500/5 rounded-lg">
            <div>
              <p className="font-medium">Support Staff</p>
              <p className="text-sm text-muted-foreground">Security and logistics team</p>
            </div>
            <Button variant="outline" size="sm">View Team</Button>
          </div>
        </div>

        <Button className="w-full bg-orange-500 hover:bg-orange-600">
          Add New Staff Member
        </Button>
      </div>
    </Card>
  );
}