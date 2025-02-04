import { useState, useRef } from "react";
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
import { generateAudioWithFal } from "@/lib/api/fal-ai";
import { PlayCircle, PauseCircle, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { MusicianService } from "@/pages/producer-tools";
import { createPaymentSession } from "@/lib/api/stripe-service";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface BookingFormProps {
  musician: MusicianService;
  onClose: () => void;
}

export function MusicianBookingForm({ musician, onClose }: BookingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [formData, setFormData] = useState({
    tempo: "",
    key: "",
    style: "",
    additionalNotes: "",
    projectDeadline: "",
  });

  const generateDemo = async () => {
    if (!formData.style || !formData.tempo || !formData.key) {
      toast({
        title: "Missing Information",
        description: "Please fill in the style, tempo, and key before generating a demo",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDemo(true);
    try {
      const prompt = `Create a ${formData.style} music piece at ${formData.tempo} BPM in the key of ${formData.key}. 
        Style should match a professional ${musician.category.toLowerCase()} musician ${
        musician.title ? `like ${musician.title}` : ""
      }. 
        Include typical ${musician.category.toLowerCase()} elements and techniques.
        ${formData.additionalNotes ? `Additional notes: ${formData.additionalNotes}` : ""}`;

      const response = await generateAudioWithFal({
        prompt,
        duration_seconds: 30
      });

      if (response.data?.audio_file?.url) {
        setAudioUrl(response.data.audio_file.url);
        toast({
          title: "Demo Generated",
          description: "Your music demo has been generated successfully",
        });
      } else {
        throw new Error("No audio URL in response");
      }
    } catch (error) {
      console.error("Error generating demo:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate audio demo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const deleteDemo = () => {
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    toast({
      title: "Demo Deleted",
      description: "The audio demo has been removed",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First create a payment intent
      const clientSecret = await createPaymentSession({
        musicianId: musician.id,
        price: musician.price,
        currency: 'usd',
      });

      // Confirm the payment with Stripe
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not initialized');

      const { error } = await stripe.confirmPayment({
        elements: stripe.elements({
          clientSecret,
          appearance: { theme: 'stripe' }
        }),
        confirmParams: {
          return_url: `${window.location.origin}/booking-confirmation`,
        },
      });

      if (error) {
        throw error;
      }

      // If payment is successful, create the booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          musicianId: musician.id,
          audioUrl,
          price: musician.price,
          currency: 'usd',
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
      console.error('Error in booking process:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit booking. Please try again.",
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

        {/* Demo Generation Section */}
        <div className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              onClick={generateDemo}
              disabled={isGeneratingDemo || !formData.style || !formData.tempo || !formData.key}
              variant="secondary"
              className="gap-2"
            >
              {isGeneratingDemo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Demo...
                </>
              ) : audioUrl ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Demo
                </>
              ) : (
                "Generate Demo"
              )}
            </Button>
          </div>

          {audioUrl && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <PauseCircle className="h-6 w-6" />
                ) : (
                  <PlayCircle className="h-6 w-6" />
                )}
              </Button>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <span className="flex-grow text-sm">Preview your demo</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={deleteDemo}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary">
          {isSubmitting ? "Processing Payment..." : `Book Session ($${musician.price})`}
        </Button>
      </div>
    </form>
  );
}