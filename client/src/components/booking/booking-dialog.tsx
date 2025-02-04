import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MusicianBookingForm } from "./musician-booking-form";
import type { MusicianService } from "@/pages/producer-tools";

interface BookingDialogProps {
  musician: MusicianService;
  trigger?: React.ReactNode;
}

export function BookingDialog({ musician, trigger }: BookingDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-orange-500 hover:bg-orange-600">
            Book Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <MusicianBookingForm
          musician={musician}
          onClose={() => {
            const closeButton = document.querySelector('[aria-label="Close"]');
            if (closeButton instanceof HTMLElement) {
              closeButton.click();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
