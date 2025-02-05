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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Upload as UploadIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";

const visualStyles = [
  "Cinematic",
  "Urban/Street",
  "Minimalist",
  "Experimental",
  "Performance-focused",
  "Narrative-driven",
  "Abstract/Artistic",
  "Documentary-style",
  "High Fashion",
  "Retro/Vintage",
] as const;

const technicalRequirements = [
  "4K Resolution",
  "Drone Shots",
  "Slow Motion",
  "Steadicam",
  "Green Screen",
  "Special Effects (VFX)",
  "Color Grading",
  "Multiple Locations",
  "Night Shooting",
  "Studio Recording",
  "Live Performance",
  "Custom Animation",
] as const;

const budgetRanges = [
  { label: "$1,000", value: "1000" },
  { label: "$5,000", value: "5000" },
  { label: "$10,000", value: "10000" },
  { label: "$25,000", value: "25000" },
] as const;

const PROJECT_STATUSES = {
  RECEIVED: { status: 'received', progress: 20, message: 'Project request received' },
  REVIEW: { status: 'review', progress: 40, message: 'Director reviewing project' },
  IN_PROGRESS: { status: 'in_progress', progress: 60, message: 'Production in progress' },
  FINAL_REVIEW: { status: 'final_review', progress: 80, message: 'Final review phase' },
  COMPLETED: { status: 'completed', progress: 100, message: 'Project completed' },
} as const;

const hireFormSchema = z.object({
  budget: z.string().min(1, "Budget is required"),
  timeline: z.string().min(1, "Timeline is required")
    .refine(value => ["1 week", "2 weeks", "1 month", "2 months", "3+ months"].includes(value), {
      message: "Please select a valid timeline",
    }),
  visualStyle: z.array(z.string()).min(1, "Please select at least one visual style"),
  songFile: z.any().optional(),
  songUrl: z.string().url("Please enter a valid song URL").optional(),
  description: z.string().min(50, "Please provide at least 50 characters describing your vision"),
  technicalRequirements: z.array(z.string()).min(1, "Please select at least one technical requirement"),
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

export function DirectorsList() {
  const { toast } = useToast();
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDirector, setSelectedDirector] = useState<Director | null>(null);
  const [showHireForm, setShowHireForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const totalSteps = 3;

  const form = useForm<z.infer<typeof hireFormSchema>>({
    resolver: zodResolver(hireFormSchema),
    defaultValues: {
      budget: "",
      timeline: "",
      visualStyle: [],
      description: "",
      technicalRequirements: [],
      songUrl: "",
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

  const handleFileUpload = async (file: File): Promise<string> => {
    if (!file) return "";

    const storageRef = ref(storage, `songs/${Date.now()}_${file.name}`);

    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof hireFormSchema>) => {
    if (!selectedDirector) return;

    try {
      let songUrl = values.songUrl;
      if (values.songFile) {
        const storageRef = ref(storage, `songs/${Date.now()}_${values.songFile.name}`);
        const uploadResult = await uploadBytes(storageRef, values.songFile);
        songUrl = await getDownloadURL(uploadResult.ref);
      }

      const projectData = {
        ...values,
        songUrl,
        directorId: selectedDirector.id,
        directorName: selectedDirector.name,
        status: PROJECT_STATUSES.RECEIVED.status,
        statusProgress: PROJECT_STATUSES.RECEIVED.progress,
        createdAt: serverTimestamp(),
        timeline: [
          {
            status: PROJECT_STATUSES.RECEIVED.status,
            date: new Date().toISOString(),
            message: PROJECT_STATUSES.RECEIVED.message
          }
        ]
      };

      await addDoc(collection(db, "projects"), projectData);

      toast({
        title: "¡Éxito!",
        description: "Tu solicitud de proyecto ha sido enviada exitosamente.",
      });

      setShowHireForm(false);
      form.reset();
    } catch (error) {
      console.error("Error al enviar el proyecto:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el proyecto. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your budget" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {budgetRanges.map((budget) => (
                        <SelectItem key={budget.value} value={budget.value}>
                          {budget.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select your budget range for the music video production
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
                      {["1 week", "2 weeks", "1 month", "2 months", "3+ months"].map((timeline) => (
                        <SelectItem key={timeline} value={timeline}>
                          {timeline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Expected duration of the music video production
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="songUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. SoundCloud, Spotify, or Dropbox link" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a link where the director can listen to your song
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="songFile"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Or Upload Song File</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload your song file (MP3, WAV, etc.)
                    </FormDescription>
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
                    <div className="grid grid-cols-2 gap-2">
                      {visualStyles.map((style) => (
                        <label
                          key={style}
                          className={`
                            flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                            ${field.value.includes(style)
                              ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                              : 'hover:bg-muted'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={field.value.includes(style)}
                            onChange={(e) => {
                              const value = field.value || [];
                              if (e.target.checked) {
                                field.onChange([...value, style]);
                              } else {
                                field.onChange(value.filter((v) => v !== style));
                              }
                            }}
                          />
                          {style}
                        </label>
                      ))}
                    </div>
                    <FormDescription>
                      Select the visual styles that match your vision
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Vision</FormLabel>
                  <FormControl>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                      placeholder="Describe your vision for the music video in detail"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include themes, mood, style, and any specific visual elements you want
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="technicalRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technical Requirements</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {technicalRequirements.map((req) => (
                      <label
                        key={req}
                        className={`
                          flex items-center gap-2 p-3 rounded-lg border cursor-pointer
                          ${field.value.includes(req)
                            ? 'bg-orange-500/10 border-orange-500 text-orange-500'
                            : 'hover:bg-muted'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={field.value.includes(req)}
                          onChange={(e) => {
                            const value = field.value || [];
                            if (e.target.checked) {
                              field.onChange([...value, req]);
                            } else {
                              field.onChange(value.filter((v) => v !== req));
                            }
                          }}
                        />
                        {req}
                      </label>
                    ))}
                  </div>
                  <FormDescription>
                    Select the technical requirements for your video
                  </FormDescription>
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

  const renderProjectProgress = () => (
    <div className="mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Estado del Proyecto</span>
        <span className="text-sm text-muted-foreground">20%</span>
      </div>
      <Progress value={20} className="h-2" />
      <div className="grid grid-cols-5 mt-2 gap-1">
        {Object.values(PROJECT_STATUSES).map((status, index) => (
          <div key={status.status} className="text-center">
            <div
              className={`h-2 w-2 mx-auto mb-1 rounded-full ${
                20 >= status.progress ? 'bg-orange-500' : 'bg-muted'
              }`}
            />
            <span className="text-xs text-muted-foreground block">
              {status.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

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

          {renderProjectProgress()}

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
        </DialogContent>
      </Dialog>
    </>
  );
}