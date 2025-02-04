import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { MusicianService } from "@/pages/producer-tools";

interface BookingFormProps {
  musician: MusicianService;
  onClose: () => void;
}

export function MusicianBookingForm({ musician, onClose }: BookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tempo: "",
    key: "",
    style: "",
    additionalNotes: "",
    projectDeadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          musicianId: musician.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit booking');
      }

      toast({
        title: "Booking Submitted",
        description: `Your booking request for ${musician.title} has been submitted successfully.`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const musicalKeys = [
    "C", "G", "D", "A", "E", "B", "F#",
    "F", "Bb", "Eb", "Ab", "Db", "Gb",
    "Am", "Em", "Bm", "F#m", "C#m", "G#m",
    "Dm", "Gm", "Cm", "Fm", "Bbm", "Ebm"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Book Session with {musician.title}</h3>
        <p className="text-muted-foreground mb-6">
          Please provide details about your musical requirements
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tempo">Tempo (BPM)</Label>
          <Input
            id="tempo"
            type="number"
            min="40"
            max="240"
            placeholder="120"
            onChange={(e) => handleChange("tempo", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="key">Musical Key</Label>
          <Select onValueChange={(value) => handleChange("key", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent>
              {musicalKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="style">Style/Genre</Label>
          <Input
            id="style"
            placeholder="e.g., Rock, Jazz, Pop"
            onChange={(e) => handleChange("style", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="projectDeadline">Project Deadline</Label>
          <Input
            id="projectDeadline"
            type="date"
            onChange={(e) => handleChange("projectDeadline", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="additionalNotes">Additional Notes</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Describe any specific requirements or preferences..."
            onChange={(e) => handleChange("additionalNotes", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Booking"}
        </Button>
      </div>
    </form>
  );
}
