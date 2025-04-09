import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
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
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "../../hooks/use-toast";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Progress } from "../ui/progress";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";
import { auth } from "../../lib/firebase"; //Import auth


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

interface PriceEstimate {
  basicPackage: {
    price: number;
    description: string;
    features: string[];
  };
  standardPackage: {
    price: number;
    description: string;
    features: string[];
  };
  premiumPackage: {
    price: number;
    description: string;
    features: string[];
  };
}

interface SubmissionProgressProps {
  currentStep: number;
  isComplete: boolean;
}

interface MusicVideoRequest {
  id: string;
  directorId: string;
  directorName: string;
  userId: string;
  visualTheme: string;
  mood: string;
  visualStyle: string;
  budget: string;
  timeline: string;
  status: string;
  createdAt: any;
  submittedAt: string;
  requestType: string;
  projectStatus: string;
  priceEstimate?: {
    basicPackage: {
      price: number;
      description: string;
      features: string[];
    };
    standardPackage: {
      price: number;
      description: string;
      features: string[];
    };
    premiumPackage: {
      price: number;
      description: string;
      features: string[];
    };
  };
  conceptImages?: string[];
}

fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

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
  const totalSteps = 5;
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [conceptImages, setConceptImages] = useState<string[]>([]);
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [requests, setRequests] = useState<MusicVideoRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);

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
        // Verificar primero si hay un usuario autenticado
        const user = auth.currentUser;
        console.log("Firebase Auth:", user ? `Usuario autenticado: ${user.uid}` : "No hay usuario autenticado");
        
        // Cargar directores desde Firestore
        const querySnapshot = await getDocs(collection(db, "directors"));
        const directorsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Director[];
        setDirectors(directorsData);
      } catch (error) {
        console.error("Error loading directors:", error);
        
        // Si es un error de permisos, cargamos directores de muestra para evitar pantalla en blanco
        if (error instanceof Error && error.name === "FirebaseError" && error.toString().includes("permission-denied")) {
          console.log("Permiso denegado para acceder a la colección 'directors'");
          // No mostramos toast para este error específico para evitar una mala experiencia
          
          // Cargar directores de respaldo para permitir que la interfaz funcione
          const sampleDirectors: Director[] = [
            {
              id: "sample-1",
              name: "Sofia Ramirez",
              specialty: "Urban & Hip-Hop Visuals",
              experience: "10+ years directing music videos for top urban artists",
              style: "Dynamic street cinematography with bold color grading",
              rating: 4.8
            },
            {
              id: "sample-2",
              name: "Marcus Chen",
              specialty: "Alternative & Indie Rock",
              experience: "Award-winning director with 15+ years in music video production",
              style: "Surrealist narratives with experimental techniques",
              rating: 4.9
            },
            {
              id: "sample-3",
              name: "Isabella Moretti",
              specialty: "Pop & Contemporary",
              experience: "Former MTV director with global brand collaborations",
              style: "High-fashion aesthetic with cutting-edge visual effects",
              rating: 4.7
            }
          ];
          setDirectors(sampleDirectors);
        } else {
          // Para otros errores, mostrar un toast
          toast({
            title: "Error",
            description: "Failed to load directors. Please try again later.",
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchRequests = async () => {
      try {
        // Verificar si hay un usuario autenticado
        const user = auth.currentUser;
        
        // Cargar solicitudes desde Firestore
        const requestsRef = collection(db, "music-video-request");
        const q = query(requestsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const requestsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MusicVideoRequest[];
        setRequests(requestsData);
      } catch (error) {
        console.error("Error fetching requests:", error);
        // Si es un error de permisos, no mostrar toast para evitar spam
        if (!(error instanceof Error && error.name === "FirebaseError" && error.toString().includes("permission-denied"))) {
          toast({
            title: "Error",
            description: "Failed to load requests. Please try again later.",
            variant: "destructive",
          });
        }
        
        // Establecer un array vacío como fallback
        setRequests([]);
      }
    };

    fetchDirectors();
    fetchRequests();
  }, [toast]);

  const simulateSubmissionProcess = async () => {
    setIsSubmitting(true);
    console.log("Starting submission animation process...");
    const steps = [
      { step: 0, delay: 1000, message: "Processing your request..." },
      { step: 1, delay: 2000, message: "Connecting with director..." },
      { step: 2, delay: 2000, message: "Preparing project details..." },
      { step: 3, delay: 1500, message: "Finalizing submission..." },
      { step: 4, delay: 1000, message: "Complete!" },
    ];

    for (const { step, delay, message } of steps) {
      console.log(`Step ${step}: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      setSubmissionStep(step);
    }

    setIsSubmissionComplete(true);
    console.log("Submission animation complete");
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const generatePriceEstimate = async (formData: z.infer<typeof hireFormSchema>) => {
    setIsGeneratingEstimate(true);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional music video production expert that provides detailed price estimates. You must respond with a valid JSON object that has the following structure, no other text allowed: { basicPackage: { price: number, description: string, features: string[] }, standardPackage: { price: number, description: string, features: string[] }, premiumPackage: { price: number, description: string, features: string[] } }"
          },
          {
            role: "user",
            content: `Generate a detailed price estimate with 3 package options based on these requirements:
            - Visual Theme: ${formData.visualTheme}
            - Mood: ${formData.mood}
            - Style: ${formData.visualStyle}
            - Resolution: ${formData.resolution}
            - Aspect Ratio: ${formData.aspectRatio}
            - Special Effects: ${formData.specialEffects.join(", ")}
            - Timeline: ${formData.timeline}

            For each package (Basic, Standard, Premium):
            1. Set price between $1,500 and $9,500
            2. Include a short description
            3. List 4-6 key features or services included`
          }
        ]
      });

      try {
        const content = response.choices[0].message.content || '{}';
        const estimate = JSON.parse(content);
        setPriceEstimate(estimate);
      } catch (parseError) {
        console.error("Error parsing price estimate:", parseError);
        toast({
          title: "Error",
          description: "Failed to parse price estimate. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating price estimate:", error);
      toast({
        title: "Error",
        description: "Failed to generate price estimate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEstimate(false);
    }
  };

  const generateConceptImages = async (formData: z.infer<typeof hireFormSchema>) => {
    setIsGeneratingImages(true);
    try {
      const prompt = `Create a cinematic still for a music video with these characteristics:
      Theme: ${formData.visualTheme}
      Mood: ${formData.mood}
      Style: ${formData.visualStyle}
      Make it highly detailed and professional looking.`;

      const images = [];
      for (let i = 0; i < 4; i++) {
        const result = await fal.subscribe("fal-ai/fast-sdxl", {
          input: {
            prompt,
            image_size: "square_hd",
          },
        });

        if (typeof result === 'object' && result !== null && 'images' in result &&
            Array.isArray(result.images) && result.images[0]?.url) {
          images.push(result.images[0].url);
        }
      }
      setConceptImages(images);
    } catch (error) {
      console.error("Error generating concept images:", error);
      toast({
        title: "Error",
        description: "Failed to generate concept images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof hireFormSchema>) => {
    if (!selectedDirector) {
      toast({
        title: "Error",
        description: "No director selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Starting submission with values:", values);

      // Create request data
      const requestData = {
        directorId: selectedDirector.id,
        directorName: selectedDirector.name,
        userId: auth.currentUser?.uid,
        visualTheme: values.visualTheme,
        mood: values.mood,
        visualStyle: values.visualStyle,
        budget: values.budget,
        timeline: values.timeline,
        status: "pending",
        createdAt: serverTimestamp(),
        submittedAt: new Date().toISOString(),
        requestType: "music_video",
        projectStatus: "awaiting_review",
        resolution: values.resolution,
        aspectRatio: values.aspectRatio,
        specialEffects: values.specialEffects,
        additionalNotes: values.additionalNotes || "",
      };

      console.log("Attempting to save request data:", requestData);

      // Save to Firestore
      const requestRef = collection(db, "music-video-request");
      const docRef = await addDoc(requestRef, requestData);

      console.log("Successfully saved document with ID:", docRef.id);

      toast({
        title: "Success!",
        description: "Your music video request has been submitted.",
      });

      // Reset form and close dialog
      form.reset();
      setShowHireForm(false);
      setCurrentStep(1);

    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHireClick = (director: Director) => {
    setSelectedDirector(director);
    setShowHireForm(true);
    setCurrentStep(1);
  };

  const nextStep = async () => {
    const currentValues = form.getValues();
    setIsGeneratingEstimate(false);
    setIsGeneratingImages(false);

    try {
      if (currentStep === 1) {
        setIsGeneratingEstimate(true);
        await generatePriceEstimate(currentValues);
      } else if (currentStep === 2) {
        setIsGeneratingImages(true);
        await generateConceptImages(currentValues);
      }

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error("Error in next step:", error);
      toast({
        title: "Error",
        description: "Failed to process this step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEstimate(false);
      setIsGeneratingImages(false);
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
            {isGeneratingEstimate && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p>Generating price estimate...</p>
              </div>
            )}
            {priceEstimate && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Price Estimates</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(priceEstimate).map(([key, pkg]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">
                        {key.replace("Package", "")} Package
                      </h4>
                      <p className="text-2xl font-bold text-orange-500 mb-2">
                        ${pkg.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {pkg.description}
                      </p>
                      <ul className="text-sm space-y-2">
                        {pkg.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-orange-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div>
            {isGeneratingImages && (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                <p>Generating concept images...</p>
              </div>
            )}
            {conceptImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Visual Concepts</h3>
                <div className="grid grid-cols-2 gap-4">
                  {conceptImages.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Concept ${index + 1}`}
                      className="w-full rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div>
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
      <div className="space-y-4">
        <Card className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
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
            <Button
              variant="outline"
              onClick={() => setShowRequests(!showRequests)}
              className="transition-all duration-200"
            >
              {showRequests ? "Show Directors" : "View Requests"}
            </Button>
          </div>

          {showRequests ? (
            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{request.directorName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Theme</Label>
                        <p>{request.visualTheme}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Mood</Label>
                        <p>{request.mood}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Style</Label>
                        <p>{request.visualStyle}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Budget</Label>
                        <p>${request.budget}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Clock className="h-4 w-4" />
                      <span>Timeline: {request.timeline}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {directors.map((director) => (
                <motion.div
                  key={director.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="h-32 w-32 rounded-lg overflow-hidden bg-orange-500/10 flex-shrink-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold truncate">{director.name}</h3>
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
                        className="mt-4 w-full transition-all duration-200"
                        onClick={() => handleHireClick(director)}
                      >
                        Hire Director
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={showHireForm} onOpenChange={setShowHireForm}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Hire {selectedDirector?.name}
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to submit your music video project request.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Form submitted");
                form.handleSubmit(onSubmit)(e);
              }} 
              className="space-y-6"
            >
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-2 md:space-x-4">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className={`
                          h-8 w-8 rounded-full flex items-center justify-center border-2 
                          transition-colors duration-200
                          ${
                            currentStep >= index + 1
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
                            w-8 md:w-12 h-0.5 ml-2
                            transition-colors duration-200
                            ${currentStep > index + 1 ? "bg-orange-500" : "bg-orange-200"}
                          `}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pb-6">
                {renderFormStep()}
              </div>

              <DialogFooter>
                <div className="flex justify-between w-full">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  )}

                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      className="ml-auto"
                      onClick={nextStep}
                      disabled={isGeneratingEstimate || isGeneratingImages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="ml-auto"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}