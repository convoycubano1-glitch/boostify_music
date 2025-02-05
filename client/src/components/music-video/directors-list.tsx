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
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const hireFormSchema = z.object({
  budget: z.string().min(1, "Budget is required").regex(/^\d+$/, "Please enter a valid number"),
  timeline: z.string().min(1, "Timeline is required")
    .refine(value => ["1 week", "2 weeks", "1 month", "2 months", "3+ months"].includes(value), {
      message: "Please select a valid timeline",
    }),
  description: z.string().min(50, "Please provide at least 50 characters describing your vision"),
  songUrl: z.string().url("Please enter a valid song URL"),
  requirements: z.string().min(30, "Please provide at least 30 characters of specific requirements"),
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
  const totalSteps = 3;

  const form = useForm<z.infer<typeof hireFormSchema>>({
    resolver: zodResolver(hireFormSchema),
    defaultValues: {
      budget: "",
      timeline: "",
      description: "",
      songUrl: "",
      requirements: "",
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

  const onSubmit = async (values: z.infer<typeof hireFormSchema>) => {
    if (!selectedDirector) return;

    try {
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
        description: "Your project request has been submitted successfully.",
      });

      setShowHireForm(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting project:", error);
      toast({
        title: "Error",
        description: "Failed to submit project. Please try again.",
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
                  <FormControl>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      {...field}
                    >
                      <option value="">Select timeline</option>
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="2 months">2 months</option>
                      <option value="3+ months">3+ months</option>
                    </select>
                  </FormControl>
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
            <FormField
              control={form.control}
              name="songUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Song URL</FormLabel>
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
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technical Requirements</FormLabel>
                  <FormControl>
                    <textarea
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                      placeholder="List any specific technical requirements or preferences"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include details about resolution, aspect ratio, special effects, or equipment requirements
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
                <div className="h-32 w-32 rounded-lg overflow-hidden">
                  {director.imageUrl ? (
                    <img
                      src={director.imageUrl}
                      alt={director.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-orange-500/10 flex items-center justify-center">
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