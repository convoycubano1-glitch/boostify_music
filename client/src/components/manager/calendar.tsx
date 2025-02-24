import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export function CalendarSection() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-orange-500/10 rounded-lg">
          <CalendarIcon className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Event Calendar</h3>
          <p className="text-sm text-muted-foreground">
            Manage your event schedule
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
        />

        <div className="space-y-2">
          <h4 className="font-medium">Upcoming Events</h4>
          <div className="space-y-2">
            <div className="p-2 bg-orange-500/5 rounded-lg">
              <p className="font-medium">Technical Setup</p>
              <p className="text-sm text-muted-foreground">Tomorrow, 9:00 AM</p>
            </div>
            <div className="p-2 bg-orange-500/5 rounded-lg">
              <p className="font-medium">Sound Check</p>
              <p className="text-sm text-muted-foreground">Tomorrow, 2:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}