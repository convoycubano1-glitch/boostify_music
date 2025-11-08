import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { generateAudioWithFal } from "../../lib/api/fal-ai";
import { PlayCircle, PauseCircle, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { MusicianService } from "../../pages/producer-tools";
import { createCheckoutSession } from "../../lib/api/stripe-service";
import { auth } from "../../lib/firebase";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!auth.currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a session",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Starting booking process with data:', {
        musicianId: musician.id,
        price: musician.price,
        formData
      });

      // Comprobar si el usuario es administrador (convoycubano@gmail.com)
      if (auth.currentUser.email === 'convoycubano@gmail.com') {
        // Proceso especial para administrador (sin pago)
        toast({
          title: "Booking Confirmed",
          description: "As an administrator, your booking has been confirmed without payment.",
          variant: "default",
        });
        
        // Cerrar el modal después de confirmar
        setTimeout(() => {
          onClose();
        }, 2000);
        
        return;
      }

      // Obtener token del usuario autenticado
      const token = await auth.currentUser?.getIdToken();
      
      if (!token) {
        throw new Error("Could not get authentication token");
      }
      
      // Crear booking de músico con el nuevo endpoint
      const response = await fetch('/api/stripe/create-musician-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          musicianId: musician.id,
          musicianName: musician.title,
          price: musician.price,
          tempo: formData.tempo || null,
          musicalKey: formData.key || null,
          style: formData.style || null,
          projectDeadline: formData.projectDeadline || null,
          additionalNotes: formData.additionalNotes || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create booking');
      }

      if (data.success && data.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error) {
      console.error('Error in booking process:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Book Session with {musician.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
          Please provide details about your musical requirements
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tempo" className="text-sm">Tempo (BPM)</Label>
          <Input
            id="tempo"
            type="number"
            min="40"
            max="240"
            placeholder="120"
            className="text-sm"
            onChange={(e) => handleChange("tempo", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="key" className="text-sm">Musical Key</Label>
          <Select onValueChange={(value) => handleChange("key", value)}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {musicalKeys.map((key) => (
                <SelectItem key={key} value={key} className="text-sm">
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="style" className="text-sm">Style/Genre</Label>
          <Input
            id="style"
            placeholder="e.g., Rock, Jazz, Pop"
            className="text-sm"
            onChange={(e) => handleChange("style", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="projectDeadline" className="text-sm">Project Deadline</Label>
          <Input
            id="projectDeadline"
            type="date"
            className="text-sm"
            onChange={(e) => handleChange("projectDeadline", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="additionalNotes" className="text-sm">Additional Notes</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Describe any specific requirements or preferences..."
            className="text-sm min-h-[80px] sm:min-h-[100px]"
            onChange={(e) => handleChange("additionalNotes", e.target.value)}
          />
        </div>

        {/* Demo Generation Section */}
        <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
          <div className="flex justify-between items-center">
            <Button
              type="button"
              onClick={generateDemo}
              disabled={isGeneratingDemo || !formData.style || !formData.tempo || !formData.key}
              variant="secondary"
              className="gap-2 text-xs sm:text-sm h-9 sm:h-10"
              size="sm"
            >
              {isGeneratingDemo ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden xs:inline">Generating...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : audioUrl ? (
                <>
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Regenerate Demo</span>
                  <span className="xs:hidden">Regenerate</span>
                </>
              ) : (
                <>
                  <span className="hidden xs:inline">Generate Demo</span>
                  <span className="xs:hidden">Demo</span>
                </>
              )}
            </Button>
          </div>

          {audioUrl && (
            <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-muted rounded-lg">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                {isPlaying ? (
                  <PauseCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <PlayCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </Button>
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <span className="flex-grow text-xs sm:text-sm">Preview your demo</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={deleteDemo}
                className="text-destructive hover:text-destructive h-8 w-8 sm:h-10 sm:w-10"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="w-full sm:w-auto text-sm h-10"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="bg-primary w-full sm:w-auto text-sm h-10"
        >
          {isSubmitting ? "Processing..." : `Book ($${musician.price})`}
        </Button>
      </div>
    </form>
  );
}