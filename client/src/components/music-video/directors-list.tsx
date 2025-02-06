import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Video,
  Award,
  Star,
  Upload,
  DollarSign,
  Calendar,
  Music2,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";

// Constants for form options
const VISUAL_THEMES = [
  "Cinematic",
  "Minimalist",
  "Abstract",
  "Urban",
  "Nature",
  "Futuristic",
  "Retro",
  "Surreal",
  "Documentary",
  "Performance",
] as const;

const MOODS = [
  "Energetic",
  "Melancholic",
  "Dreamy",
  "Dark",
  "Uplifting",
  "Mysterious",
  "Romantic",
  "Aggressive",
  "Peaceful",
  "Dramatic",
] as const;

const VISUAL_STYLES = [
  "Narrative",
  "Performance-based",
  "Experimental",
  "Animation",
  "Mixed-media",
  "One-shot",
  "Slow-motion",
  "Time-lapse",
  "Split-screen",
  "VFX-heavy",
] as const;

const RESOLUTIONS = [
  "4K (3840x2160)",
  "2K (2048x1080)",
  "1080p (1920x1080)",
  "720p (1280x720)",
] as const;

const ASPECT_RATIOS = [
  "16:9 (Standard Widescreen)",
  "2.39:1 (Anamorphic)",
  "1:1 (Square)",
  "9:16 (Vertical)",
  "21:9 (Ultrawide)",
] as const;

const SPECIAL_EFFECTS = [
  "CGI Integration",
  "Color Grading",
  "Green Screen",
  "Practical Effects",
  "Motion Graphics",
  "3D Elements",
  "Particle Systems",
  "Light Effects",
  "Slow Motion",
  "Time Manipulation",
] as const;

const hireFormSchema = z.object({
  budget: z.string().min(1, "Budget is required").regex(/^\d+$/, "Please enter a valid number"),
  timeline: z.string().min(1, "Timeline is required"),
  songFile: z.any(),
  songUrl: z.string().url("Please enter a valid song URL").optional(),
  visualTheme: z.enum(VISUAL_THEMES, {
    required_error: "Please select a visual theme",
  }),
  mood: z.enum(MOODS, {
    required_error: "Please select a mood",
  }),
  visualStyle: z.enum(VISUAL_STYLES, {
    required_error: "Please select a visual style",
  }),
  resolution: z.enum(RESOLUTIONS, {
    required_error: "Please select a resolution",
  }),
  aspectRatio: z.enum(ASPECT_RATIOS, {
    required_error: "Please select an aspect ratio",
  }),
  specialEffects: z.array(z.enum(SPECIAL_EFFECTS)).min(1, "Select at least one special effect"),
  additionalNotes: z.string().optional(),
});

interface Director {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  style: string;
  rating: number;
  imageUrl?: string;
}

interface SubmissionProgressProps {
  currentStep: number;
  isComplete: boolean;
}

const SubmissionProgress = ({ currentStep, isComplete }: SubmissionProgressProps) => {
  const steps = [
    "Proposal Received",
    "Connecting with Director",
    "Adjusting Proposal",
    "Finalizing Details",
    "Complete",
  ];

  const progress = isComplete ? 100 : (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="w-full space-y-4">
      <Progress value={progress} className="h-2" />
      <div className="grid grid-cols-5 gap-2 text-xs text-center">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`${
              index <= currentStep
                ? "text-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            {index <= currentStep && (
              <Check className="h-4 w-4 mx-auto mb-1 text-primary" />
            )}
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export function DirectorsList() {
  const { toast } = useToast();
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);
  const [showHireForm, setShowHireForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(0);
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const totalSteps = 3;

  const form = useForm<z.infer<typeof hireFormSchema>>({
    resolver: zodResolver(hireFormSchema),
    defaultValues: {
      budget: "",
      timeline: "",
      songUrl: "",
      specialEffects: [],
      additionalNotes: "",
    },
  });

  useEffect(() => {
    const fetchDirectors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "directors"));
        const directorsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Director[];
        setDirectors(directorsData);
      } catch (error) {
        console.error("Error fetching directors:", error);
        toast({
          title: "Error",
          description: "Failed to load directors. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDirectors();
  }, [toast]);

  const simulateSubmissionProcess = async () => {
    const steps = [
      { step: 0, delay: 1000 }, // Proposal Received
      { step: 1, delay: 2000 }, // Connecting with Director
      { step: 2, delay: 2000 }, // Adjusting Proposal
      { step: 3, delay: 1500 }, // Finalizing Details
      { step: 4, delay: 1000 }, // Complete
    ];

    for (const { step, delay } of steps) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setSubmissionStep(step);
    }

    setIsSubmissionComplete(true);
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const onSubmit = async (values: z.infer<typeof hireFormSchema>) => {
    if (!selectedDirector) return;

    try {
      setIsSubmitting(true);

      // Start submission animation
      await simulateSubmissionProcess();

      const projectData = {
        ...values,
        directorId: selectedDirector.id,
        directorName: selectedDirector.name,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "projects"), projectData);

      toast({
        title: "Success",
        description: "Your project request has been submitted successfully. You will receive a demo and script within 24 hours.",
      });

      form.reset();
    } catch (error) {
      console.error("Error submitting project:", error);
      toast({
        title: "Error",
        description: "Failed to submit project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        setShowHireForm(false);
        setSubmissionStep(0);
        setIsSubmissionComplete(false);
      }, 2000);
    }
  };

  const handleHireClick = (director: Director) => {
    setSelectedDirector(director);
    setShowHireForm(true);
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Budget (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your budget"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your total budget for the music video production
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Timeline</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1 week">1 week</SelectItem>
                      <SelectItem value="2 weeks">2 weeks</SelectItem>
                      <SelectItem value="1 month">1 month</SelectItem>
                      <SelectItem value="2 months">2 months</SelectItem>
                      <SelectItem value="3+ months">3+ months</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Expected duration of the music video production
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <Label>Upload Song</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    form.setValue("songFile", file);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">
                Or provide a link to your song below
              </p>
              <FormField
                control={form.control}
                name="songUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SoundCloud, Spotify, or Dropbox link" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="visualTheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Theme</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visual theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VISUAL_THEMES.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOODS.map((mood) => (
                        <SelectItem key={mood} value={mood}>
                          {mood}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visualStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Style</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visual style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VISUAL_STYLES.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESOLUTIONS.map((resolution) => (
                        <SelectItem key={resolution} value={resolution}>
                          {resolution}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aspectRatio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aspect Ratio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>
                          {ratio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialEffects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Effects (Select multiple)</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {SPECIAL_EFFECTS.map((effect) => (
                      <label key={effect} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value?.includes(effect)}
                          onChange={(e) => {
                            const newValue = e.target.checked
                              ? [...(field.value || []), effect]
                              : field.value?.filter((v) => v !== effect);
                            field.onChange(newValue);
                          }}
                          className="form-checkbox h-4 w-4"
                        />
                        <span className="text-sm">{effect}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                      placeholder="Any additional requirements or preferences..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Video className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Featured Directors</h2>
            <p className="text-sm text-muted-foreground">
              Connect with talented music video directors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {directors.map((director) => (
            <motion.div
              key={director.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="h-32 w-32 rounded-lg overflow-hidden bg-orange-500/10">
                  {director.imageUrl ? (
                    <img
                      src={director.imageUrl}
                      alt={`${director.name} - ${director.specialty}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(director.name);
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Award className="h-8 w-8 text-orange-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{director.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="text-sm font-medium">{director.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-orange-500">
                    {director.specialty}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {director.experience}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Style: {director.style}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleHireClick(director)}
                  >
                    Hire Director
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      <Dialog open={showHireForm} onOpenChange={setShowHireForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Video className="h-5 w-5" />
              Hire {selectedDirector?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              Fill out the form below to submit your music video project request.
              Complete all {totalSteps} steps to ensure we capture all necessary details.
            </DialogDescription>
          </DialogHeader>

          {isSubmitting ? (
            <div className="py-6 space-y-6">
              <SubmissionProgress
                currentStep={submissionStep}
                isComplete={isSubmissionComplete}
              />
              {isSubmissionComplete && (
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Request Submitted Successfully!</h3>
                  <p className="text-muted-foreground">
                    You will receive a demo and script within 24 hours.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-4">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`
                          h-8 w-8 rounded-full flex items-center justify-center border-2 
                          ${currentStep >= index + 1
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "border-orange-200 text-orange-200"
                          }
                        `}
                      >
                        {index + 1}
                      </div>
                      {index < totalSteps - 1 && (
                        <div
                          className={`
                            w-12 h-0.5 ml-4
                            ${currentStep > index + 1 ? "bg-orange-500" : "bg-orange-200"}
                          `}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {renderFormStep()}
                  <DialogFooter className="flex justify-between gap-2">
                    {currentStep > 1 && (
                      <Button type="button" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous Step
                      </Button>
                    )}
                    {currentStep < totalSteps ? (
                      <Button type="button" onClick={nextStep}>
                        Next Step ({currentStep + 1}/{totalSteps})
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit">
                        <Send className="mr-2 h-4 w-4" />
                        Submit Request
                      </Button>
                    )}
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}