import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { TimelineEditor } from "./TimelineEditor";
import type { TimelineClip } from "./TimelineEditor";
import { TimelineClipUnified, ensureCompatibleClip, TimelineItem } from "../timeline/TimelineClipUnified";
import { Slider } from "../ui/slider";
import { Card } from "../ui/card";
import Editor from "@monaco-editor/react";
import {
  Video, Loader2, Music2, Image as ImageIcon, Download, Play, Pause,
  ZoomIn, ZoomOut, SkipBack, FastForward, Rewind, Edit, RefreshCcw, Plus, RefreshCw,
  Film, CheckCircle2, Share, User, Upload, X, Check, Activity, ChevronUp, ChevronDown,
  Megaphone, Waves, HelpCircle, Sparkles
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import * as fal from "@fal-ai/serverless-client";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../lib/context/auth-context";
import { AnalyticsDashboard } from './analytics-dashboard';
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { VideoGenerator } from "./video-generator";
import { ArtistCustomization } from "./artist-customization";
import { MusicianIntegration } from "./musician-integration";
import { MovementIntegration } from "./movement-integration";
import { LipSyncIntegration } from "./lip-sync-integration";
import { FinalRendering, type UpscaleOptions } from "./final-rendering";
import { ProgressSteps } from "./progress-steps";
import { EnhancedProgressSteps, Step } from "./enhanced-progress-steps";
import { 
  ParticleSystem, 
  AnimatedGradient,
  GlowEffect
} from "./animation-effects";
import { 
  analyzeImage, 
  generateVideoPromptWithRetry, 
  generateMusicVideoScript,
  type VideoPromptParams 
} from "../../lib/api/openrouter";
import { upscaleVideo } from "../../lib/api/video-service";
import { generateVideoScript as generateVideoScriptAPI } from "../../lib/api/openrouter";
import { FileText } from "lucide-react";
import fluxService, { FluxModel, FluxTaskType } from "../../lib/api/flux/flux-service";
import { FalModelSelector } from "./fal-model-selector";
import { PaymentSection } from "./payment-section";
import { MyGeneratedVideos } from "./my-generated-videos";
import { generateMusicVideoPrompts } from "../../lib/api/music-video-generator";
import { FAL_VIDEO_MODELS, generateVideoWithFAL, generateMultipleVideos } from "../../lib/api/fal-video-service";
import DynamicProgressTracker from "./dynamic-progress-tracker";

// Fal.ai configuration
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

// Transcribe audio using backend API (secure)
async function transcribeAudio(file: File) {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    console.log('🌐 Fetching /api/audio/transcribe...');
    const response = await fetch('/api/audio/transcribe', {
      method: 'POST',
      body: formData
    });

    console.log('📊 Server response:', response.status, response.statusText);

    let data;
    try {
      data = await response.json();
      console.log('📦 Data received:', data);
    } catch (parseError) {
      console.error('❌ Error parsing response JSON:', parseError);
      throw new Error('Server response is not valid JSON');
    }

    if (!response.ok || !data.success) {
      const errorMsg = data.error || `Server error: ${response.status} ${response.statusText}`;
      console.error('❌ Error in server response:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!data.transcription || !data.transcription.text) {
      console.error('❌ Server response does not contain transcription');
      throw new Error('Transcription was not generated correctly');
    }

    return data.transcription.text;
  } catch (error) {
    console.error("❌ Error in transcribeAudio:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error transcribing audio');
  }
}

const videoStyles = {
  moods: [
    "Energetic", "Melancholic", "Romantic", "Dramatic",
    "Mysterious", "Cheerful", "Epic", "Minimalist"
  ],
  colorPalettes: [
    "Vibrant", "Monochromatic", "Pastel", "Dark and Contrasted",
    "Warm", "Cool", "Retro", "Neon"
  ],
  characterStyles: [
    "Realistic", "Stylized", "Artistic", "Abstract",
    "Cinematic", "Documentary", "Surrealist", "Vintage"
  ],
  cameraFormats: [
    {
      name: "35mm Standard",
      description: "The classic cinema format, offers a natural and cinematic image"
    },
    {
      name: "IMAX",
      description: "High detail and visual breadth, ideal for epic scenes"
    },
    {
      name: "Super 8mm",
      description: "Vintage and grainy look, perfect for nostalgic scenes"
    },
    {
      name: "Anamorphic",
      description: "Panoramic format with characteristic lens flares"
    },
    {
      name: "PANAVISION",
      description: "High-end cinematic with distinctive bokeh"
    },
    {
      name: "Digital RAW",
      description: "Modern and sharp look with high dynamic range"
    }
  ]
};

const editingStyles = [
  {
    id: "phrases",
    name: "Phrase-based Editing",
    description: "Cuts synchronized with musical phrases",
    duration: { min: 4, max: 8 }
  },
  {
    id: "random_bars",
    name: "Random Bars",
    description: "Varied cuts following the rhythm",
    duration: { min: 2, max: 6 }
  },
  {
    id: "dynamic",
    name: "Dynamic",
    description: "Fast cuts in intense moments, slower in soft parts",
    duration: { min: 1.5, max: 4 }
  },
  {
    id: "slow",
    name: "Slow",
    description: "Long cuts and smooth transitions",
    duration: { min: 5, max: 10 }
  },
  {
    id: "cinematic",
    name: "Cinematic",
    description: "Movie style with variety of durations",
    duration: { min: 3, max: 8 }
  },
  {
    id: "music_video",
    name: "Music Video",
    description: "MTV style with fast and dynamic cuts",
    duration: { min: 1, max: 3 }
  },
  {
    id: "narrative",
    name: "Narrative",
    description: "Cuts that follow the story of the lyrics",
    duration: { min: 4, max: 7 }
  },
  {
    id: "experimental",
    name: "Experimental",
    description: "Unconventional cut patterns",
    duration: { min: 1, max: 6 }
  },
  {
    id: "rhythmic",
    name: "Rhythmic",
    description: "Precise cuts on each beat",
    duration: { min: 1, max: 2 }
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Few cuts, smooth transitions",
    duration: { min: 6, max: 12 }
  }
];

// We use the TimelineItem interface imported previously
// No need to import it again

// We use the TimelineItem interface imported to maintain compatibility
// We define a specific type for our application based on TimelineItem
type MusicVideoTimelineItem = TimelineItem;

const groups = [
  { id: 1, title: "Video", stackItems: true },
  { id: 2, title: "Transitions", stackItems: false },
  { id: 3, title: "Audio", stackItems: false }
];

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";

interface Director {
  id: string;
  name: string;
  specialty: string;
  style: string;
  experience: string;
  rating: number;
  imageUrl?: string;
}

export function MusicVideoAI() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingShots, setIsGeneratingShots] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleTimeStart, setVisibleTimeStart] = useState<number>(0);
  const [visibleTimeEnd, setVisibleTimeEnd] = useState<number>(60000);
  const [hoveredShot, setHoveredShot] = useState<TimelineItem | null>(null);
  const [selectedShot, setSelectedShot] = useState<TimelineItem | null>(null);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [videoId, setVideoId] = useState<string>("");
  const [songTitle, setSongTitle] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
  const [scriptContent, setScriptContent] = useState<string>("");
  const playbackRef = useRef<NodeJS.Timeout | null>(null);
  const [videoStyle, setVideoStyle] = useState({
    mood: "",
    colorPalette: "",
    characterStyle: "",
    visualIntensity: 50,
    cameraFormat: "",
    narrativeIntensity: 50,
    referenceImage: null as string | null,
    styleDescription: "",
    styleReferenceUrl: "",
    selectedDirector: null as Director | null
  });
  const storage = getStorage();
  const [isSaving, setIsSaving] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptionWithTimestamps, setTranscriptionWithTimestamps] = useState<{
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  } | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioSource = useRef<AudioBufferSourceNode | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedEditingStyle, setSelectedEditingStyle] = useState<string>("dynamic");
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [upscaledVideoUrl, setUpscaledVideoUrl] = useState<string | null>(null);
  
  // Estado para las 3 imágenes de referencia del artista (para Nano Banana)
  const [artistReferenceImages, setArtistReferenceImages] = useState<string[]>([]);
  const [isUploadingReferences, setIsUploadingReferences] = useState(false);
  
  // Estados para sistema de pago y FAL
  const [isPaidVideo, setIsPaidVideo] = useState(false);
  const [selectedFalModel, setSelectedFalModel] = useState<string>(FAL_VIDEO_MODELS.KLING_2_1_PRO_I2V.id);
  const [isGeneratingFullVideo, setIsGeneratingFullVideo] = useState(false);
  const [showMyVideos, setShowMyVideos] = useState(false);

  // Estados para progreso dinámico
  const [showProgress, setShowProgress] = useState(false);
  const [currentProgressStage, setCurrentProgressStage] = useState<string>("transcription");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [progressMessage, setProgressMessage] = useState<string>("");

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File must be smaller than 50MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Error",
          description: "Please upload a valid audio file (MP3)",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setTranscription("");
      setTimelineItems([]);
      setCurrentTime(0);
      setIsPlaying(false);

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          if (!audioContext.current) {
            audioContext.current = new AudioContext();
          }
          const buffer = await audioContext.current.decodeAudioData(e.target.result);
          setAudioBuffer(buffer);

          // Use OpenAI for transcription
          console.log('🎤 Starting file transcription:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
          setIsTranscribing(true);
          setShowProgress(true);
          setCurrentProgressStage("transcription");
          setProgressPercentage(0);
          
          // Simular progreso mientras transcribe
          const progressInterval = setInterval(() => {
            setProgressPercentage(prev => {
              if (prev >= 90) return prev;
              return prev + Math.random() * 15;
            });
          }, 500);
          
          try {
            console.log('📤 Sending file to server for transcription...');
            const transcriptionText = await transcribeAudio(file);
            console.log('✅ Transcription completed, length:', transcriptionText.length, 'characters');
            setProgressPercentage(100);
            await new Promise(resolve => setTimeout(resolve, 500));
            setTranscription(transcriptionText);
            // Set step as completed to enable next button
            // but don't change the view (that's why we use 1.5 instead of 2)
            setCurrentStep(1.5);
            toast({
              title: "Success",
              description: `Audio transcribed correctly (${transcriptionText.length} characters). You can now generate the musical script.`,
            });
          } catch (err) {
            console.error("❌ Error transcribing audio:", err);
            toast({
              title: "Transcription error",
              description: err instanceof Error ? err.message : "Error transcribing audio. Please try again.",
              variant: "destructive",
            });
          } finally {
            clearInterval(progressInterval);
            console.log('🏁 Transcription process completed');
            setIsTranscribing(false);
            setShowProgress(false);
            setProgressPercentage(0);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [toast]);

  // Function to handle artist reference image upload
  const handleReferenceImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate that no more than 3 images are uploaded in total
    if (artistReferenceImages.length + files.length > 3) {
      toast({
        title: "Error",
        description: "You can only upload a maximum of 3 reference images",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingReferences(true);

    try {
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length && artistReferenceImages.length + newImages.length < 3; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Error",
            description: `${file.name} is not a valid image`,
            variant: "destructive",
          });
          continue;
        }

        // Validate size (maximum 5MB per image)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: `${file.name} exceeds the maximum size of 5MB`,
            variant: "destructive",
          });
          continue;
        }

        // Convert image to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newImages.push(base64);
      }

      setArtistReferenceImages([...artistReferenceImages, ...newImages]);
      
      toast({
        title: "Success",
        description: `${newImages.length} reference image(s) added (${artistReferenceImages.length + newImages.length}/3)`,
      });
    } catch (error) {
      console.error("Error loading reference images:", error);
      toast({
        title: "Error",
        description: "Error processing reference images",
        variant: "destructive",
      });
    } finally {
      setIsUploadingReferences(false);
    }
  }, [artistReferenceImages, toast]);

  // Function to remove a reference image
  const removeReferenceImage = useCallback((index: number) => {
    setArtistReferenceImages(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Image removed",
      description: `Reference image ${index + 1} removed`,
    });
  }, [toast]);

  const generateScriptFromTranscription = async () => {
    if (!transcription) {
      toast({
        title: "Error",
        description: "You need to transcribe the audio first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingScript(true);
    setShowProgress(true);
    setCurrentProgressStage("script");
    setProgressPercentage(0);
    
    // Simular progreso mientras genera el script
    const progressInterval = setInterval(() => {
      setProgressPercentage(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 12;
      });
    }, 600);
    
    try {
      // Call API to generate the script
      toast({
        title: "Processing",
        description: "Generating script based on song lyrics...",
      });

      // Pass director information if selected
      const directorInfo = videoStyle.selectedDirector ? {
        name: videoStyle.selectedDirector.name,
        specialty: videoStyle.selectedDirector.specialty,
        style: videoStyle.selectedDirector.style
      } : undefined;
      
      // Pass audio duration to generate scenes every ~4 seconds
      const audioDurationInSeconds = audioBuffer?.duration || undefined;
      
      const scriptResponse = await generateMusicVideoScript(
        transcription, 
        undefined, 
        directorInfo,
        audioDurationInSeconds
      );
      
      setProgressPercentage(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to format JSON for better visualization
      try {
        // Check if it's already a valid JSON string, and parse it to format it
        const parsed = JSON.parse(scriptResponse);
        setScriptContent(JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        // If it can't be parsed, use the response directly
        console.warn("Could not format script JSON, using direct response", parseError);
        setScriptContent(scriptResponse);
      }
      
      // Mark this step as completed
      setCurrentStep(3);
      
      toast({
        title: "Success",
        description: "Music video script generated correctly",
      });
    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error generating music video script",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsGeneratingScript(false);
      setShowProgress(false);
      setProgressPercentage(0);
    }
  };

  const syncAudioWithTimeline = async () => {
    if (!audioBuffer) return;

    if (!scriptContent) {
      toast({
        title: "Error",
        description: "You must first generate the music video script",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingShots(true);
    try {
      let segments: TimelineItem[] = [];
      
      // Create segments based on JSON script scenes
      try {
        const parsedScript = JSON.parse(scriptContent);
        
        // Verify script format and extract scenes
        let scenes = [];
        if (parsedScript.scenes && Array.isArray(parsedScript.scenes)) {
          // New format: { scenes: [...] }
          scenes = parsedScript.scenes;
        } else if (Array.isArray(parsedScript) && parsedScript.length > 0 && parsedScript[0].scene_id) {
          // Old format: direct array of scenes
          scenes = parsedScript;
        }
        
        // Check if we have valid scenes
        if (scenes.length > 0 && scenes[0].scene_id) {
          segments = createSegmentsFromScenes(scenes, audioBuffer.duration);
          toast({
            title: "Synchronizing",
            description: `Creating ${segments.length} scenes based on the cinematic script`,
          });
        } else {
          throw new Error("The script does not contain valid scenes");
        }
      } catch (e) {
        console.error("Error parsing script:", e);
        throw new Error("Could not process the script. Please, generate the script again.");
      }
      
      if (segments && segments.length > 0) {
        setTimelineItems(segments);
        setCurrentStep(4);

        toast({
          title: "Success",
          description: `${segments.length} scenes synchronized with music`,
        });
      } else {
        throw new Error("No segments detected in the script");
      }
    } catch (error) {
      console.error("Error synchronizing audio:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error synchronizing audio with timeline",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShots(false);
    }
  };

  // New function to create timeline segments based on JSON script scenes
  // Reads start_time and duration directly from the script JSON
  const createSegmentsFromScenes = (scenes: any[], totalDuration: number): TimelineItem[] => {
    const segments: TimelineItem[] = [];
    
    scenes.forEach((scene, index) => {
      // READ start_time and duration directly from the script JSON
      // DO NOT calculate equal durations - use the random values (3-4 sec) from JSON
      const startTime = (scene.start_time || 0) * 1000; // Convert seconds to milliseconds
      const duration = (scene.duration || 3.5) * 1000; // Duration in milliseconds (default 3.5s)
      const endTime = startTime + duration;
      
      console.log(`🎬 Creating clip ${scene.scene_id}: start=${scene.start_time}s, duration=${scene.duration}s`);
      
      segments.push({
        id: `scene-${scene.scene_id}`,
        type: 'image', // Image type for proper display
        group: 1,
        title: scene.title || `Scene ${scene.scene_id}`,
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        shotType: scene.shot_type || scene.camera?.lens || 'MS', // Shot type from JSON
        thumbnail: '', // Will be assigned when image is generated
        imageUrl: '', // Will be assigned when image is generated
        itemProps: {
          style: {
            background: `hsl(${(index * 30) % 360}, 70%, 50%)`,
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px',
            color: 'white'
          }
        },
        metadata: {
          scene_id: scene.scene_id,
          section: scene.section,
          shot_type: scene.shot_type || scene.camera?.lens,
          role: scene.role,
          camera: scene.camera,
          lighting: scene.lighting,
          environment: scene.environment,
          performance: scene.performance,
          sound: scene.sound,
          emotional_tone: scene.emotional_tone,
          transition: scene.transition,
          production_notes: scene.production_notes
        }
      });
    });
    
    console.log(`✅ ${segments.length} clips created from JSON with random durations`);
    return segments;
  };

  // New function: Generate full video with payment (30 scenes + FAL)
  const handleGenerateFullVideoWithPayment = async () => {
    if (!transcription || !audioBuffer || !user) {
      toast({
        title: "Error",
        description: "You need transcription, loaded audio and be authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingFullVideo(true);
    
    try {
      // Step 1: Generate script with 30 prompts
      toast({
        title: "Generating complete script",
        description: "Creating 30 cinematic scenes...",
      });
      
      const fullScript = await generateMusicVideoPrompts(
        transcription,
        audioBuffer.duration,
        true, // isPaid = true (30 scenes)
        videoStyle.selectedDirector ? {
          name: videoStyle.selectedDirector.name,
          specialty: videoStyle.selectedDirector.specialty,
          style: videoStyle.selectedDirector.style
        } : undefined
      );
      
      console.log(`✅ Script generated: ${fullScript.total_scenes} scenes`);
      
      // Step 2: Generate images for each scene using Gemini/Flux
      toast({
        title: "Generating images",
        description: `Generating ${fullScript.total_scenes} images with AI...`,
      });
      
      const imagePromises = fullScript.scenes.map(async (scene, index) => {
        try {
          // Use Flux to generate the image
          const result = await fluxService.generateImage({
            prompt: scene.prompt,
            width: 1280,
            height: 720,
            guidance_scale: 3.5,
            steps: 30
          });
          
          console.log(`✅ Image ${index + 1}/${fullScript.total_scenes} generated`);
          // FluxTaskResult.images is string[] not objects with url
          return result.images?.[0] || '';
        } catch (error) {
          console.error(`Error generating image ${index + 1}:`, error);
          throw error;
        }
      });
      
      const imageUrls = await Promise.all(imagePromises);
      
      toast({
        title: "Images generated",
        description: `${imageUrls.length} images successfully created`,
      });
      
      // Step 3: Generate videos with FAL
      toast({
        title: "Generating videos",
        description: `Converting ${imageUrls.length} images to video with ${selectedFalModel}...`,
      });
      
      const scenesWithImages = fullScript.scenes.map((scene, index) => ({
        prompt: scene.prompt,
        imageUrl: imageUrls[index]
      }));
      
      const videoResults = await generateMultipleVideos(
        selectedFalModel,
        scenesWithImages
      );
      
      const successCount = videoResults.filter(r => r.success).length;
      
      toast({
        title: "Videos generated",
        description: `${successCount}/${videoResults.length} videos successfully generated`,
      });
      
      // Step 4: Save to database
      const videoData = {
        user_id: user.uid,
        song_name: selectedFile?.name || "Music Video",
        video_url: null, // Will be updated when final video is compiled
        thumbnail_url: imageUrls[0],
        duration: audioBuffer.duration,
        is_paid: true,
        amount: 19900, // $199.00 in cents
        status: 'completed',
        metadata: {
          scenes: fullScript.total_scenes,
          model: selectedFalModel,
          video_urls: videoResults.map(r => r.videoUrl)
        }
      };
      
      const response = await fetch('/api/videos/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData)
      });
      
      if (!response.ok) {
        throw new Error('Error saving video to database');
      }
      
      const savedVideo = await response.json();
      
      toast({
        title: "Full video generated!",
        description: "Your music video has been saved to your account",
      });
      
      // Update states
      setIsPaidVideo(true);
      setShowMyVideos(true);
      
    } catch (error) {
      console.error('Error generating full video:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error generating full video",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingFullVideo(false);
    }
  };

  // Generate all images for timeline scenes using Gemini with facial references
  const generateAllSceneImages = async () => {
    if (!scriptContent) {
      toast({
        title: "Error",
        description: "You must first generate the script",
        variant: "destructive",
      });
      return;
    }

    if (artistReferenceImages.length === 0) {
      toast({
        title: "Warning",
        description: "No reference images. Images will be generated without facial consistency",
      });
    }

    setIsGeneratingImages(true);
    setShowProgress(true);
    setCurrentProgressStage("images");
    setProgressPercentage(0);
    
    try {
      const parsedScript = JSON.parse(scriptContent);
      
      // Extract scenes from correct format
      let scenes = [];
      if (parsedScript.scenes && Array.isArray(parsedScript.scenes)) {
        scenes = parsedScript.scenes;
      } else if (Array.isArray(parsedScript)) {
        scenes = parsedScript;
      }
      
      if (scenes.length === 0) {
        throw new Error("The script has no valid scenes");
      }

      toast({
        title: "Generating images",
        description: `Starting generation of ${scenes.length} scenes with Gemini 2.5 Flash Image...`,
      });
      
      // Actualizar progreso inicialmente
      setProgressPercentage(10);

      // Prepare scenes in the format expected by Gemini using the NEW schema
      const geminiScenes = scenes.map((scene: any) => {
        // Use fields from the new MusicVideoScene schema
        const shotType = scene.shot_type || "MS";
        const cameraMovement = scene.camera_movement || "static";
        const lens = scene.lens || "standard";
        const lighting = scene.lighting || "natural";
        const visualStyle = scene.visual_style || "cinematic";
        const description = scene.description || "";
        const location = scene.location || "performance space";
        const colorTemp = scene.color_temperature || "5000K";
        
        return {
          id: scene.scene_id || `scene-${Math.random()}`,
          scene: description, // Use complete description that already includes all details
          camera: `${lens} lens, ${shotType} shot, ${cameraMovement} movement`,
          lighting: `${lighting} lighting, ${colorTemp} color temperature`,
          style: `${visualStyle} style, ${location}`,
          movement: cameraMovement
        };
      });

      // Call Gemini endpoint with multiple facial references
      setProgressPercentage(30);
      const response = await fetch('/api/gemini-image/generate-batch-with-multiple-faces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenes: geminiScenes,
          referenceImagesBase64: artistReferenceImages
        }),
      });

      setProgressPercentage(70);
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      setProgressPercentage(90);
      
      if (!data.success || !data.results) {
        throw new Error(data.error || 'Error generating images');
      }

      // Update timeline items with generated images
      setTimelineItems(prevItems => {
        // Filter only image/scene clips (exclude audio, text, etc.)
        const sceneItems = prevItems.filter(item => 
          item.type === 'image' || item.id.toString().startsWith('scene-')
        );
        
        return prevItems.map(item => {
          // Only process image/scene clips
          if (item.type !== 'image' && !item.id.toString().startsWith('scene-')) {
            return item;
          }
          
          // Find the index of this scene in the filtered array
          const sceneIndex = sceneItems.findIndex(s => s.id === item.id);
          if (sceneIndex === -1) {
            console.warn(`⚠️ Scene index not found for ${item.id}`);
            return item;
          }
          
          // Backend returns results indexed from 0
          const imageResult = data.results[sceneIndex];
          
          console.log(`📍 Assigning image ${sceneIndex} to ${item.id}:`, imageResult?.success ? 'YES' : 'NO', imageResult?.imageUrl ? `URL: ${imageResult.imageUrl.substring(0, 50)}...` : '');
          
          if (imageResult && imageResult.success && imageResult.imageUrl) {
            return {
              ...item,
              imageUrl: imageResult.imageUrl,
              thumbnail: imageResult.imageUrl,
              url: imageResult.imageUrl, // Also assign to url for compatibility
              metadata: {
                ...item.metadata,
                isGeneratedImage: true,
                imageGeneratedAt: new Date().toISOString(),
                shot_type: item.shotType || item.metadata?.shot_type,
                role: item.metadata?.role || 'performance'
              }
            };
          }
          
          console.warn(`⚠️ Could not assign image to ${item.id}`);
          return item;
        });
      });

      setProgressPercentage(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Success!",
        description: `${parsedScript.length} images generated with Gemini Nano Banana`,
      });

      setCurrentStep(5);
    } catch (error) {
      console.error("Error generating images:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error generating images",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
      setShowProgress(false);
      setProgressPercentage(0);
    }
  };
  


  const generateVideoScriptFromAudio = async () => {
    if (!transcription || timelineItems.length === 0) return;

    setIsGeneratingScript(true);
    try {
      // Extraemos información de los cortes actuales en el timeline
      const timelineInfo = timelineItems.map((item, index) => ({
        id: item.id,
        start_time: item.start_time,
        end_time: item.end_time,
        duration: item.duration
      }));

      // Calculamos duración exacta y número total de segmentos
      const totalSegments = timelineItems.length;
      const totalDuration = audioBuffer?.duration || 0;

      const prompt = `As a professional music video director, I need you to analyze this song and create a detailed script, perfectly synchronized with the already identified musical cuts.

SONG LYRICS:
${transcription}

TOTAL DURATION: ${totalDuration.toFixed(2)} seconds

MUSICAL CUTS INFORMATION:
${JSON.stringify(timelineInfo, null, 2)}

STRICT SYNCHRONIZATION REQUIREMENTS:
1. You must create EXACTLY ${totalSegments} script segments, one for each predefined musical cut.
2. Each segment must correspond with a specific section of the lyrics that matches the exact time of the cut.
3. If a cut spans an instrumental period without lyrics, specify it is an instrumental moment and describe what should be shown.

SPECIFIC INSTRUCTIONS:
1. LYRICS AND MUSIC ANALYSIS:
   - For each cut, identify what exact part of the lyrics fits its duration
   - Describe the precise musical elements occurring during that cut
   - Point out any changes in rhythm, tone, or instrumentation

2. SYNCHRONIZED VISUAL SCRIPT CREATION:
   - For each segment, relate the scene exactly with the corresponding part of the lyrics
   - Each visual description must reflect the literal or metaphorical meaning of that specific part of the lyrics
   - The shot type and mood must be appropriate for the specific moment of the song

REQUIRED STRUCTURE (exact JSON):
{
  "segments": [
    {
      "id": number (must match the cut ID),
      "timeStart": number (start time in seconds, must match the cut),
      "timeEnd": number (end time in seconds, must match the cut),
      "lyrics": "EXACT part of the lyrics occurring during this time cut",
      "musical_elements": "precise description of musical elements during this cut",
      "description": "detailed visual description that faithfully represents this specific part of the lyrics",
      "imagePrompt": "detailed and specific prompt to generate an image capturing this scene",
      "shotType": "specific shot type (close-up, medium shot, wide shot, etc.)",
      "mood": "precise mood based on this specific part of the lyrics and music",
      "transition": "type of transition to the next segment"
    }
  ]
}

CRUCIAL:
- Each segment must have an ID that exactly matches the ID of the corresponding musical cut
- Start and end times must exactly match the provided musical cuts
- Image prompts must SPECIFICALLY reflect the lyrics content in that exact cut
- The description must explicitly explain how the scene relates to that specific part of the lyrics

COMPLETE SONG LYRICS:
${transcription}`;

      // Validate that the prompt is a text string
      if (typeof prompt !== 'string') {
        throw new Error("The prompt must be a text string");
      }
      
      // Call API to generate script with type validation
      const jsonContent: string = await generateVideoScriptAPI(prompt);

      try {
        // Validate and process response
        let scriptResult;
        try {
          if (typeof jsonContent === 'string') {
            scriptResult = JSON.parse(jsonContent);
          } else {
            throw new Error("The response is not a valid text string");
          }
        } catch (parseError) {
          // Try to extract valid JSON if it's within quotes, markdown, etc.
          const error = parseError as Error;
          console.error("Error parsing JSON:", error.message);
          
          // Verify jsonContent is a string before using regex
          if (typeof jsonContent === 'string') {
            // Extract a valid JSON object from the response
            try {
              const regex = /\{[\s\S]*"segments"[\s\S]*\}/;
              const match = jsonContent.match(regex);
              if (match && match[0]) {
                scriptResult = JSON.parse(match[0]);
              } else {
                throw new Error("Could not find valid JSON with segments");
              }
            } catch (regexError) {
              console.error("Error searching for JSON with regex:", regexError);
              throw new Error("Could not extract valid JSON from response");
            }
          } else {
            throw new Error("The response is not a valid text string");
          }
        }

        if (!scriptResult || !scriptResult.segments || !Array.isArray(scriptResult.segments)) {
          throw new Error("Invalid script format: segments array not found");
        }

        // Create a map to search segments by ID efficiently
        const segmentMap = new Map();
        scriptResult.segments.forEach((segment: { id?: number; }) => {
          if (segment && segment.id !== undefined) {
            segmentMap.set(segment.id, segment);
          }
        });

        // Update each timeline element with script information
        const updatedItems = timelineItems.map(item => {
          const scriptSegment = segmentMap.get(item.id);
          
          if (scriptSegment) {
            return {
              ...item,
              description: `Lyrics: "${scriptSegment.lyrics || 'Instrumental'}"\n\nMusic: ${scriptSegment.musical_elements || 'N/A'}\n\nScene: ${scriptSegment.description || 'N/A'}`,
              imagePrompt: `${scriptSegment.imagePrompt || ''} The scene represents these precise lyrics: "${scriptSegment.lyrics || 'Instrumental'}" with musical elements: ${scriptSegment.musical_elements || 'main rhythm'}`,
              shotType: scriptSegment.shotType || 'Medium shot',
              transition: scriptSegment.transition || 'Direct cut',
              mood: scriptSegment.mood || 'Neutral'
            };
          }
          return item;
        });

        setTimelineItems(updatedItems);
        setCurrentStep(4);

        // Save complete script for reference
        setScriptContent(JSON.stringify(scriptResult, null, 2));

        toast({
          title: "Success",
          description: "Synchronized script generated correctly with all musical cuts",
        });

      } catch (parseError) {
        const error = parseError as Error;
        console.error("Error parsing response:", error);
        console.error("Response content:", jsonContent);
        throw new Error("Error processing script response: " + error.message);
      }

    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Error generating script",
        description: error instanceof Error ? error.message : "Error generating synchronized video script",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  /**
   * Generates an image for a specific segment using FAL AI
   * @param item - The timeline segment for which the image will be generated
   * @returns Promise<string> URL of generated image or null in case of error
   */
  const generateImageForSegment = async (item: TimelineItem): Promise<string | null> => {
    if (!item.imagePrompt) {
      console.warn(`Segment ${item.id} has no prompt to generate image`);
      return null;
    }

    // Number of attempts for image generation
    const maxAttempts = 2;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      try {
        // Format the prompt to include style information
        const prompt = `${item.imagePrompt}. Style: ${videoStyle.mood}, ${videoStyle.colorPalette} color palette, ${videoStyle.characterStyle} character style, ${item.shotType} composition`;
        
        console.log(`Generating image for segment ${item.id}, attempt ${attempt + 1}/${maxAttempts}`);
        console.log(`Prompt: ${prompt.substring(0, 100)}...`);

        // Configure parameters for Flux API
        const params = {
          prompt: prompt,
          negativePrompt: "low quality, blurry, distorted, deformed, unrealistic, oversaturated, text, watermark",
          width: 1024,
          height: 576, // 16:9 aspect ratio
          guidance_scale: 2.5,
          model: FluxModel.FLUX1_DEV,
          taskType: FluxTaskType.TXT2IMG,
          // Use a specific seed for each segment, but consistent in regenerations
          seed: seed + (typeof item.id === 'string' ? parseInt(item.id, 10) || 0 : item.id)
        };

        // Start image generation with Flux API
        console.log('Starting generation with Flux API');
        const result = await fluxService.generateImage(params);

        if (!result.success || !result.taskId) {
          throw new Error(`Error starting image generation: ${result.error || 'Invalid response'}`);
        }

        console.log(`Generation task started with ID: ${result.taskId}`);
        
        // Wait for image to be generated (polling)
        const imageUrl = await waitForFluxImageGeneration(result.taskId);
        
        if (imageUrl) {
          console.log(`Image successfully generated for segment ${item.id}: ${imageUrl}`);
          return imageUrl;
        } else {
          throw new Error("No image URL received in response");
        }
      } catch (error) {
        console.error(`Error in attempt ${attempt + 1} for segment ${item.id}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If it's the last attempt, we don't wait
        if (attempt < maxAttempts - 1) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retrying in ${backoffTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        attempt++;
      }
    }

    console.error(`Could not generate image for segment ${item.id} after ${maxAttempts} attempts:`, lastError);
    return null;
  };

  /**
   * Waits for image generation to complete in Flux API via polling
   * @param taskId ID of the image generation task
   * @returns URL of generated image or null if it fails
   */
  const waitForFluxImageGeneration = async (taskId: string): Promise<string | null> => {
    const maxAttempts = 40; // Maximum number of attempts to check status
    const pollingInterval = 1500; // Interval between checks (1.5 seconds)
    let attempts = 0;

    // Function to make a single check attempt
    const checkStatus = async (): Promise<string | null> => {
      const statusResult = await fluxService.checkTaskStatus(taskId);
      
      console.log(`Task ${taskId} status:`, statusResult.status);
      
      if (statusResult.success && statusResult.status === 'completed' && statusResult.images && statusResult.images.length > 0) {
        return statusResult.images[0];
      } else if (!statusResult.success || statusResult.status === 'failed') {
        throw new Error(`Image generation failed: ${statusResult.error || 'Unknown error'}`);
      }
      
      return null; // Still processing
    };

    // Polling loop
    while (attempts < maxAttempts) {
      try {
        const result = await checkStatus();
        if (result) {
          return result; // Image successfully generated
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        attempts++;
      } catch (error) {
        console.error('Error checking generation status:', error);
        return null;
      }
    }

    console.error(`Timeout expired after ${attempts} attempts for task ${taskId}`);
    return null;
  };

  /**
   * Regenerates the image for a specific segment
   * @param item - The timeline segment whose image will be regenerated
   */
  const regenerateImage = async (item: TimelineItem) => {
    if (!item.imagePrompt) {
      toast({
        title: "Error",
        description: "This segment has no prompt to generate image",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageUrl = await generateImageForSegment(item);
      
      if (imageUrl) {
        const updatedItems = timelineItems.map(timelineItem =>
          timelineItem.id === item.id
            ? { ...timelineItem, generatedImage: imageUrl }
            : timelineItem
        );
        setTimelineItems(updatedItems);

        toast({
          title: "Image regenerated",
          description: "The image has been successfully regenerated",
        });
      } else {
        throw new Error("Could not generate image");
      }
    } catch (error) {
      console.error("Error regenerating image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error regenerating image",
        variant: "destructive",
      });
    }
  };

  const generateTimelineItems = useCallback((shots: { duration?: string; shotType: string; description: string; imagePrompt?: string; transition?: string }[]) => {
    const baseTime = Date.now();
    let currentTime = baseTime;

    const items = shots.map((shot, index) => {
      const duration = shot.duration ? parseFloat(shot.duration) * 1000 : Math.floor(Math.random() * (5000 - 1000) + 1000);
      const item: TimelineItem = {
        id: index + 1,
        group: 1,
        title: shot.shotType,
        start_time: currentTime,
        end_time: currentTime + duration,
        description: shot.description,
        shotType: shot.shotType,
        imagePrompt: shot.imagePrompt,
        generatedImage: undefined,
        duration: duration,
        transition: shot.transition || "cut",
        // Campos necesarios para compatibilidad con TimelineClip
        start: (currentTime - baseTime) / 1000,
        type: 'image',
        thumbnail: undefined,
        mood: 'neutral'
      };
      currentTime += duration;
      return item;
    });

    setTimelineItems(items);
    setVisibleTimeStart(baseTime);
    setVisibleTimeEnd(currentTime);
    setZoomLevel(1);
  }, []);

  const handleTimeChange = (visibleTimeStart: number, visibleTimeEnd: number) => {
    setVisibleTimeStart(visibleTimeStart);
    setVisibleTimeEnd(visibleTimeEnd);
  };

  const togglePlayback = useCallback(() => {
    if (!audioBuffer || !audioContext.current) return;

    if (isPlaying) {
      audioSource.current?.stop();
      setIsPlaying(false);
    } else {
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      source.start(0, currentTime / 1000);
      audioSource.current = source;
      setIsPlaying(true);
    }
  }, [isPlaying, audioBuffer, currentTime]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleReset = () => {
    if (timelineItems.length > 0) {
      setCurrentTime(timelineItems[0].start_time);
      setIsPlaying(false);
    }
  };

  const handleSkipForward = () => {
    if (timelineItems.length > 0) {
      const currentIndex = timelineItems.findIndex(item => item.start_time > currentTime);
      if (currentIndex !== -1) {
        setCurrentTime(timelineItems[currentIndex].start_time);
      }
    }
  };

  const handleSkipBackward = () => {
    if (timelineItems.length > 0) {
      const currentIndex = timelineItems.findIndex(item => item.end_time > currentTime) - 1;
      if (currentIndex >= 0) {
        setCurrentTime(timelineItems[currentIndex].start_time);
      } else {
        setCurrentTime(timelineItems[0].start_time);
      }
    }
  };

  const saveToFirebase = async (item: TimelineItem) => {
    if (!item.generatedImage) return null;

    try {
      // Make sure generatedImage is a valid URL (string)
      const imageUrl = typeof item.generatedImage === 'string' ? item.generatedImage : '';
      if (!imageUrl) return null;
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const storageRef = ref(storage, `videos/${Date.now()}_${item.id}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      return url;
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      return null;
    }
  };

  /**
   * Generates images for all segments that have prompts
   * Processes segments in parallel in batches to optimize time
   */
  const generateShotImages = async () => {
    if (timelineItems.length === 0) {
      toast({
        title: "Error",
        description: "No segments to generate images",
        variant: "destructive",
      });
      return;
    }

    // Verify there are generated prompts
    const itemsWithoutPrompts = timelineItems.filter(item => !item.imagePrompt).length;
    if (itemsWithoutPrompts === timelineItems.length) {
      toast({
        title: "Error",
        description: "Segments have no prompts to generate images",
        variant: "destructive",
      });
      return;
    }

    if (itemsWithoutPrompts > 0) {
      toast({
        title: "Warning",
        description: `${itemsWithoutPrompts} segments have no prompts and will be skipped`,
        variant: "default",
      });
    }

    setIsGeneratingShots(true);
    try {
      // Limit to maximum 10 images to avoid overload
      const items = timelineItems
        .filter(item => item.imagePrompt && !item.generatedImage) // Only process those with prompt but no image
        .slice(0, 10);

      if (items.length === 0) {
        toast({
          title: "Information",
          description: "All segments already have generated images",
        });
        setIsGeneratingShots(false);
        return;
      }

      toast({
        title: "Starting generation",
        description: `Generating ${items.length} images for the music video`,
      });

      let successCount = 0;
      let failCount = 0;

      // Process in batches of 2 to balance speed and stability
      const batchSize = 2;
      
      for (let i = 0; i < items.length; i += batchSize) {
        const currentBatch = items.slice(i, i + batchSize);
        
        try {
          // Show current batch
          console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(items.length/batchSize)}`);
          toast({
            title: "Progress",
            description: `Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(items.length/batchSize)}`,
          });

          // Generate images for current batch in parallel
          const results = await Promise.all(
            currentBatch.map(async (item) => {
              try {
                const imageUrl = await generateImageForSegment(item);
                return {
                  id: item.id,
                  success: true,
                  url: imageUrl
                };
              } catch (error) {
                console.error(`Error in generation for segment ${item.id}:`, error);
                return {
                  id: item.id,
                  success: false,
                  error: error instanceof Error ? error.message : "Unknown error"
                };
              }
            })
          );

          // Update timeline with generated images
          let updatedItems = [...timelineItems];
          
          for (const result of results) {
            if (result.success && result.url) {
              // Update corresponding item
              updatedItems = updatedItems.map(item => 
                item.id === result.id 
                  ? { ...item, generatedImage: result.url as string } 
                  : item
              );
              successCount++;
            } else {
              failCount++;
              console.error(`Failure in segment ${result.id}:`, result.error);
            }
          }
          
          // Update state only once for the entire batch
          setTimelineItems(updatedItems);

          // Wait between batches to avoid rate limits
          if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 4000));
          }
        } catch (batchError) {
          console.error(`Error processing batch ${Math.floor(i/batchSize) + 1}:`, batchError);
          toast({
            title: "Batch error",
            description: `Error in batch ${Math.floor(i/batchSize) + 1}, continuing with next...`,
            variant: "destructive",
          });
        }
      }

      // Mostrar resultado final
      if (successCount > 0) {
        toast({
          title: "Proceso completado",
          description: `Se generaron ${successCount} de ${items.length} imágenes ${failCount > 0 ? `(${failCount} fallaron)` : ''}`,
        });
        
        if (successCount >= 1) { // Mostrar vista previa incluso si solo se generó una imagen
          // Generar ID único para este video
          const videoId = `video_${Date.now()}`;
          
          // Guardar el videoId en el estado para usarlo en la generación del video
          setVideoId(videoId);
          
          // Calcular duración total en segundos
          const calculateTotalDuration = () => {
            if (timelineItems.length === 0) return 0;
            const lastItem = timelineItems[timelineItems.length - 1];
            return lastItem.end_time / 1000; // Convertir a segundos
          };
          
          // Extraer palabras clave del primer segmento o usar etiquetas predeterminadas
          const extractTags = () => {
            const firstSegment = timelineItems[0];
            if (firstSegment && firstSegment.description) {
              return firstSegment.description
                .split(' ')
                .filter(word => word.length > 5)
                .slice(0, 5);
            }
            return ['música', 'video', 'artista', 'canción', 'generado'];
          };
          
          // Crear un documento de video en Firestore para futuras referencias
          try {
            const videoRef = collection(db, 'videos');
            await addDoc(videoRef, {
              id: videoId,
              userId: user?.uid,
              title: songTitle || 'Video Musical Generado',
              status: 'preview', // Inicialmente solo vista previa
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              duration: duration || calculateTotalDuration(),
              thumbnailUrl: timelineItems.find(item => item.generatedImage)?.generatedImage || '',
              tags: extractTags(),
            });
          } catch (error) {
            console.error('Error guardando información del video:', error);
          }
          
          setCurrentStep(5); // Avanzar al siguiente paso
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar ninguna imagen",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error en el proceso de generación:", error);
      toast({
        title: "Error general",
        description: error instanceof Error ? error.message : "Error en el proceso de generación de imágenes",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShots(false);
    }
  };

  /**
   * Exporta el video generado basado en las imágenes y el audio
   * @returns Promise<string> URL del video generado
   */
  const handleExportVideo = async (): Promise<string | null> => {
    if (!timelineItems.length || !audioBuffer) {
      toast({
        title: "Error",
        description: "No hay suficientes elementos para exportar el video",
        variant: "destructive",
      });
      return null;
    }
    
    // Verificar que todos los segmentos tengan imágenes generadas
    const missingImages = timelineItems.filter(item => !item.generatedImage && !item.firebaseUrl).length;
    if (missingImages > 0) {
      toast({
        title: "Advertencia",
        description: `Faltan ${missingImages} imágenes por generar. El video puede estar incompleto.`,
        variant: "destructive",
      });
    }
    
    setIsExporting(true);
    try {
      // Primero, guardar todas las imágenes en Firebase para tener URLs estables
      const savePromises = timelineItems.map(async (item) => {
        if (item.generatedImage && !item.firebaseUrl) {
          const url = await saveToFirebase(item);
          if (url) {
            return {
              id: item.id,
              url
            };
          }
        }
        return {
          id: item.id,
          url: item.firebaseUrl || item.generatedImage
        };
      });
      
      const savedImages = await Promise.all(savePromises);
      
      // Simulamos el proceso de renderizado (en una implementación real, aquí iría la lógica de FFmpeg)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Crear un simulado video URL (en una implementación real, esto sería una URL de Firebase Storage)
      const mockVideoUrl = `https://storage.googleapis.com/music-video-generator/${Date.now()}_export.mp4`;
      
      toast({
        title: "Exportación completada",
        description: "Video disponible para descarga",
      });
      
      setCurrentStep(6); // Marcar como completado

      return mockVideoUrl;
    } catch (error) {
      console.error("Error exportando video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al exportar el video",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const handleScriptChange = (value: string | undefined) => {
    if (!value) return;
    setScriptContent(value);
    try {
      const scriptData = JSON.parse(value);
      
      // Extraer las escenas del formato correcto
      let scenesData = [];
      if (scriptData.scenes && Array.isArray(scriptData.scenes)) {
        // Nuevo formato: { scenes: [...] }
        scenesData = scriptData.scenes;
      } else if (scriptData.segments && Array.isArray(scriptData.segments)) {
        // Formato intermedio
        scenesData = scriptData.segments;
      } else if (scriptData.shots && Array.isArray(scriptData.shots)) {
        // Formato antiguo
        scenesData = scriptData.shots;
      }
      
      // Compatibilidad con diferentes formatos de script
      if (scriptData.shots && Array.isArray(scriptData.shots)) {
        // Formato anterior
        generateTimelineItems(scriptData.shots);
      } else if (scenesData.length > 0) {
        // Nuevo formato de script desde generateMusicVideoScript
        const shotItems = scenesData.map((segment: any) => ({
          shotType: segment.tipo_plano || segment.shotType || "Plano medio",
          description: segment.descripción_visual || segment.description || "",
          imagePrompt: segment.imagePrompt || "",
          transition: segment.transición || segment.transition || "corte directo",
          duration: typeof segment.duration === 'number' ? String(segment.duration) : "3"
        }));
        generateTimelineItems(shotItems);
      } else if (scriptData.segmentos && Array.isArray(scriptData.segmentos)) {
        // Formato en español
        const shotItems = scriptData.segmentos.map((segmento: any) => ({
          shotType: segmento.tipo_plano || "Plano medio",
          description: segmento.descripción_visual || "",
          imagePrompt: `Escena musical: ${segmento.descripción_visual || ""}. Estilo: ${segmento.mood || "neutral"}`,
          transition: segmento.transición || "corte directo",
          duration: typeof segmento.duration === 'number' ? String(segmento.duration) : "3"
        }));
        generateTimelineItems(shotItems);
      } else {
        console.warn("Formato de script no reconocido:", scriptData);
      }
    } catch (error) {
      console.error("Error parsing script:", error);
      toast({
        title: "Error de formato",
        description: "El script no tiene un formato JSON válido",
        variant: "destructive"
      });
    }
  };

  const itemRenderer = useCallback(({ item, itemContext, getItemProps }: any) => (
    <div
      {...getItemProps()}
      className="relative h-full cursor-pointer group"
      onMouseEnter={() => setHoveredShot(item)}
      onMouseLeave={() => setHoveredShot(null)}
      onClick={() => setSelectedShot(item)}
    >
      <div className={cn(
        "absolute inset-0 bg-card rounded-md border overflow-hidden",
        "transition-all duration-200 ease-in-out",
        currentTime >= item.start_time && currentTime < item.end_time ? "ring-2 ring-orange-500" : "",
        selectedShot?.id === item.id ? "ring-2 ring-blue-500" : "",
        "hover:scale-[1.02] hover:z-10"
      )}>
        <div className="absolute inset-0">
          <img
            src={item.generatedImage || item.firebaseUrl || fallbackImage}
            alt={item.description}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div>
              <p className="text-xs font-medium text-white truncate">
                {item.shotType}
              </p>
              <p className="text-xs text-white/80 truncate">
                {item.description}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{(item.duration / 1000).toFixed(1)}s</span>
              <span>{item.transition}</span>
            </div>
          </div>
        </div>

        {item.transition && item.transition !== "cut" && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500/20 rounded-full z-10">
            <div className="absolute inset-1 bg-orange-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  ), [currentTime, selectedShot]);

  // Calculamos un estimado de duración antes de generar los clips
  // para evitar la dependencia circular
  const estimatedDuration = useMemo(() => {
    // Si tenemos audioBuffer, usamos su duración como fuente principal
    if (audioBuffer) {
      return audioBuffer.duration;
    }
    
    // Si tenemos items de timeline, calculamos la duración en base a ellos
    if (timelineItems.length > 0) {
      const lastItem = timelineItems[timelineItems.length - 1];
      return (lastItem.end_time - timelineItems[0].start_time) / 1000; // Convertir a segundos
    }
    
    // Duración predeterminada si no hay otras fuentes
    return 180; // 3 minutos por defecto
  }, [audioBuffer, timelineItems]);

  // Mapa de clips organizados por capas para el editor profesional multicanal
  const clips: TimelineClip[] = useMemo(() => {
    console.log("🎬 Generando clips para timeline editor, items:", timelineItems.length);
    
    // Asegurar que siempre hay un clip de audio en la capa 0 si existe audioUrl
    const audioClips = audioUrl ? [
      ensureCompatibleClip({
        id: 9999, // ID especial para audio principal
        start: 0,
        duration: estimatedDuration, // Usamos la duración estimada
        type: 'audio' as const,
        layer: 0, // Capa de audio (0)
        title: 'Audio Principal',
        description: 'Pista de audio importada',
        audioUrl: audioUrl,
        visible: true,
        locked: false
      })
    ] : [];
    
    console.log("🔊 Audio importado:", audioUrl ? "SI" : "NO");
    
    // Mapear los items de timeline a clips visuales
    const visualClips = timelineItems.map(item => {
      // Determinar el tipo de clip basado en sus propiedades
      let clipType: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text' = 'image';
      let clipLayer = 1; // Por defecto, capa de imagen (1)
      
      // Si tiene audioUrl, es un clip de audio adicional
      if (item.audioUrl) {
        clipType = 'audio';
        clipLayer = 0; // Capa de audio (0)
      } 
      // Si tiene textContent, es un clip de texto
      else if (item.metadata?.textContent) {
        clipType = 'text';
        clipLayer = 2; // Capa de texto (2)
      }
      // Si tiene movementApplied, es un clip con efecto
      else if (item.metadata?.movementApplied) {
        clipType = 'effect';
        clipLayer = 3; // Capa de efectos (3)
      }
      // Si tiene videoUrl o lipsyncVideoUrl, es un clip de video
      else if (item.videoUrl || item.metadata?.lipsync?.videoUrl || item.lipsyncVideoUrl) {
        clipType = 'video';
        clipLayer = 1; // Capa de video/imagen (1)
      }
      // Si es una imagen generada por IA (tiene generatedImage)
      else if (item.generatedImage) {
        clipType = 'image';
        clipLayer = 7; // Colocar imágenes generadas en la capa 7
        console.log(`🎨 Imagen generada detectada: ${item.id} - Asignando a capa 7`);
      }
      
      // URL del recurso: priorizar video, luego imagen
      const url = item.videoUrl || 
                  item.metadata?.lipsync?.videoUrl || 
                  item.lipsyncVideoUrl || 
                  item.generatedImage || 
                  item.firebaseUrl || 
                  '';
      
      console.log(`📍 Clip ${item.id} - Tipo: ${clipType}, Capa: ${clipLayer}, URL: ${url ? "SI" : "NO"}`);
      
      // Create base object with all necessary properties
      const clipBase = {
        id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
        start: (item.start_time - (timelineItems[0]?.start_time || 0)) / 1000,
        duration: (item.duration || 0) / 1000,
        // Usar tipo determinado (video, imagen, audio, texto, efecto)
        type: clipType,
        // Usar capa determinada (0=audio, 1=video/imagen, 2=texto, 3=efectos)
        layer: clipLayer,
        thumbnail: typeof (item.generatedImage || item.firebaseUrl) === 'string' ? (item.generatedImage || item.firebaseUrl) : undefined,
        title: item.shotType || `Clip ${item.id}`,
        description: item.description || '',
        // Propiedades específicas por tipo
        imageUrl: (clipType === 'image') ? url : undefined,
        videoUrl: (clipType === 'video') ? url : undefined,
        audioUrl: (clipType === 'audio') ? item.audioUrl : undefined,
        textContent: (clipType === 'text') ? item.metadata?.textContent : undefined,
        // Estado de visibilidad y bloqueo
        visible: true,
        locked: false,
        // Metadatos para preservar el orden exacto del guion
        metadata: {
          sourceIndex: item.id,
          section: item.metadata?.section || 'default',
          movementApplied: !!item.metadata?.movementApplied,
          movementPattern: item.metadata?.movementPattern,
          movementIntensity: item.metadata?.movementIntensity,
          faceSwapApplied: !!item.metadata?.faceSwapApplied,
          // Preservar metadata de lipsync si existe
          lipsync: item.metadata?.lipsync
        }
      };
      
      // Usar ensureCompatibleClip para garantizar compatibilidad con la interfaz unificada
      return ensureCompatibleClip(clipBase);
    });
    
    // Combinar clips de audio con clips visuales
    return [...audioClips, ...visualClips];
  }, [timelineItems, audioUrl, estimatedDuration]);

  // Ahora podemos calcular la duración real basada en los clips
  const totalDuration = useMemo(() => {
    return clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);
  }, [clips]);

  const handleTimeUpdate = (time: number) => {
    const baseTime = timelineItems[0]?.start_time || 0;
    setCurrentTime(baseTime + time * 1000);
  };

  const handleClipUpdate = (clipId: number, updates: Partial<TimelineClip>) => {
    const updatedItems = timelineItems.map(item => {
      if (item.id === clipId) {
        // Crear objeto de actualización base
        const updatedItem = { ...item };
        
        // Si se actualizaron las propiedades de tiempo
        if (updates.start !== undefined) {
          updatedItem.start_time = timelineItems[0].start_time + updates.start * 1000;
        }
        
        if (updates.duration !== undefined) {
          updatedItem.duration = updates.duration * 1000;
        }
        
        // Manejar propiedades específicas de LipSync
        if (updates.lipsyncApplied !== undefined) {
          // Asegurarse de que el objeto metadata existe
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          
          // Actualizar el estado de lipsync en metadata
          updatedItem.metadata.lipsync = {
            ...(updatedItem.metadata.lipsync || {}),
            applied: updates.lipsyncApplied !== undefined ? updates.lipsyncApplied : false,
            timestamp: new Date().toISOString(),
          };
        }
        
        if (updates.lipsyncVideoUrl !== undefined) {
          // Asegurarse de que el objeto metadata existe
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          
          // Actualizar la URL del video en metadata
          updatedItem.metadata.lipsync = {
            ...(updatedItem.metadata.lipsync || {}),
            applied: true, // Cuando hay URL de video, siempre aplicamos lipsync
            videoUrl: updates.lipsyncVideoUrl,
            timestamp: new Date().toISOString(), // Añadir timestamp para seguimiento
          };
        }
        
        // Manejar el progreso de LipSync si está presente
        if (updates.lipsyncProgress !== undefined) {
          // Asegurarse de que el objeto metadata existe
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          
          // Actualizar el progreso en metadata
          updatedItem.metadata.lipsync = {
            ...(updatedItem.metadata.lipsync || {}),
            progress: updates.lipsyncProgress,
            applied: (updatedItem.metadata.lipsync?.applied === undefined) ? false : updatedItem.metadata.lipsync.applied,
          };
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setTimelineItems(updatedItems);
    
    // Depurar para verificar la actualización
    console.log(`Clip ${clipId} actualizado:`, updates);
  };
  
  // Función para manejar la división de clips en la línea de tiempo
  const handleSplitClip = (clipId: number, splitTime: number) => {
    // Encontrar el clip que se va a dividir
    const clipToSplit = timelineItems.find(item => item.id === clipId);
    if (!clipToSplit) return;
    
    // Calcular la posición absoluta del punto de división
    const absoluteSplitTime = timelineItems[0].start_time + splitTime * 1000;
    
    // Crear el nuevo clip para la segunda parte
    const newClipId = Math.max(...timelineItems.map(item => typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10))) + 1;
    const relativeStartInClip = splitTime - ((clipToSplit.start_time - timelineItems[0].start_time) / 1000);
    
    // Nuevo clip (segunda parte)
    // Creamos primero un objeto base TimelineItem
    const newClipBase: TimelineItem = {
      ...clipToSplit,
      id: newClipId,
      start_time: absoluteSplitTime,
      end_time: clipToSplit.end_time,
      start: (absoluteSplitTime - timelineItems[0].start_time) / 1000,
      duration: (clipToSplit.end_time - absoluteSplitTime) / 1000,
      // Conservar otros campos importantes
      title: `${clipToSplit.title} (parte 2)`,
    };
    
    // Aseguramos que el nuevo clip es compatible con TimelineClipUnified
    const newClip = ensureCompatibleClip(newClipBase);
    
    // Actualizar la lista de clips
    const updatedItems = timelineItems.map(item => {
      if (item.id === clipId) {
        // Actualizar el clip original (primera parte)
        const updatedItemBase = {
          ...item,
          duration: relativeStartInClip,
          end_time: absoluteSplitTime
        };
        // Asegurar que el clip original modificado también sea compatible con TimelineClipUnified
        return ensureCompatibleClip(updatedItemBase);
      }
      return item;
    });
    
    // Añadir el nuevo clip
    updatedItems.push(newClip);
    
    // Ordenar los clips por tiempo de inicio
    updatedItems.sort((a, b) => {
      // Compatibilidad con ambos formatos (TimelineItem y TimelineClipUnified)
      const aStart = 'start_time' in a ? a.start_time : a.start;
      const bStart = 'start_time' in b ? b.start_time : b.start;
      return aStart - bStart;
    });
    
    // Actualizar el estado
    setTimelineItems(updatedItems as TimelineItem[]);
    
    console.log(`Clip ${clipId} dividido en: ${clipId} y ${newClipId} en tiempo ${splitTime}s`);
  };

  /**
   * Aplica todas las restricciones requeridas a los clips del timeline:
   * 1. Duración máxima de clips (5 segundos)
   * 2. Imágenes generadas por IA solo en capa 7
   * 3. No solapamiento de imágenes en la misma capa
   * @param clips Lista de clips a verificar
   * @returns Lista de clips con restricciones aplicadas
   */
  const enforceAllConstraints = (clips: TimelineItem[]): TimelineItem[] => {
    if (!clips || !clips.length) return [];
    
    // Crear una copia de los clips para no modificar los originales
    const processedClips = [...clips];
    const MAX_CLIP_DURATION = 5 * 1000; // 5 segundos en milisegundos
    
    // Ordenamos los clips por tiempo de inicio para facilitar la detección de solapamientos
    processedClips.sort((a, b) => {
      // Garantizar que los clips tienen la propiedad start_time
      const aStart = a.start_time;
      const bStart = b.start_time;
      return aStart - bStart;
    });
    
    // Recorremos todos los clips
    for (let i = 0; i < processedClips.length; i++) {
      const currentClip = processedClips[i];
      
      // 1. Restricción de duración - limitar a 5 segundos máximo
      // Asegurar que la duración esté definida
      const clipDuration = currentClip.duration || (currentClip.end_time - currentClip.start_time);
      
      if (clipDuration > MAX_CLIP_DURATION) {
        console.log(`Ajustando clip ${currentClip.id} de ${clipDuration}ms a ${MAX_CLIP_DURATION}ms`);
        currentClip.duration = MAX_CLIP_DURATION;
        currentClip.end_time = currentClip.start_time + MAX_CLIP_DURATION;
      }
      
      // 2. Restricción de capa para imágenes generadas por IA - siempre en capa 7
      if (currentClip.generatedImage || (currentClip.metadata && currentClip.metadata.isGeneratedImage)) {
        if (currentClip.group !== 7) {
          console.log(`Moviendo clip de imagen generada ${currentClip.id} a capa 7`);
          currentClip.group = 7;
        }
      }
      
      // 3. Prevenir solapamiento de clips en la misma capa
      // Solo necesitamos verificar contra los clips que siguen, ya que estamos ordenados
      for (let j = i + 1; j < processedClips.length; j++) {
        const nextClip = processedClips[j];
        
        // Si están en la misma capa y hay solapamiento
        if (currentClip.group === nextClip.group && 
            currentClip.end_time > nextClip.start_time) {
          
          console.log(`Detectado solapamiento entre clips ${currentClip.id} y ${nextClip.id} en capa ${currentClip.group}`);
          
          // Ajustar la duración del clip actual para evitar el solapamiento
          const newEndTime = nextClip.start_time;
          const newDuration = newEndTime - currentClip.start_time;
          
          // Solo aplicar el cambio si la nueva duración es razonable (más de 0.1 segundos)
          if (newDuration >= 100) {
            console.log(`Ajustando fin de clip ${currentClip.id} de ${currentClip.end_time}ms a ${newEndTime}ms`);
            currentClip.end_time = newEndTime;
            currentClip.duration = newDuration;
          }
          // Si la duración resultante es demasiado pequeña, movemos el clip siguiente
          else if (newDuration < 100) {
            // Calculamos el nuevo start_time para el clip siguiente
            const newStartTime = currentClip.end_time;
            console.log(`Ajustando inicio de clip ${nextClip.id} de ${nextClip.start_time}ms a ${newStartTime}ms`);
            nextClip.start_time = newStartTime;
            nextClip.duration = nextClip.end_time - newStartTime;
          }
        }
      }
    }
    
    return processedClips;
  };

  /**
   * Generates a prompt for a specific timeline segment
   * Extracts the lyrics corresponding to the segment and generates a visual prompt
   * @param segment - The timeline segment for which the prompt will be generated
   * @returns A string with the generated prompt or an error message
   */
  const generatePromptForSegment = async (segment: TimelineItem): Promise<string> => {
    if (!segment || typeof segment.id !== 'number') {
      console.error("Invalid segment:", segment);
      return "Error: invalid segment";
    }
    
    const maxAttempts = 3;
    let attempt = 0;
    let lastError: Error | null = null;
    
    // Determine which part of the transcription corresponds to this segment
    const segmentStartTime = segment.start_time / 1000; // convert to seconds
    const segmentEndTime = segment.end_time / 1000;
    let relevantLyrics = "";
    
    try {
      console.log(`Generating prompt for segment ${segment.id} (${segmentStartTime.toFixed(2)}s - ${segmentEndTime.toFixed(2)}s)`);
      
      // STEP 1: RELEVANT LYRICS EXTRACTION
      // If we have transcription with timestamps (more precise)
      if (transcriptionWithTimestamps && Array.isArray(transcriptionWithTimestamps.segments)) {
        // Search for transcription segments that match this timeline segment
        const relevantSegments = transcriptionWithTimestamps.segments.filter(
          (s: {start: number, end: number}) => 
            (s.start >= segmentStartTime && s.start <= segmentEndTime) || 
            (s.end >= segmentStartTime && s.end <= segmentEndTime) ||
            (s.start <= segmentStartTime && s.end >= segmentEndTime)
        );
        
        if (relevantSegments.length > 0) {
          relevantLyrics = relevantSegments
            .map((s: {text: string}) => s.text || "")
            .filter(text => text.trim().length > 0)
            .join(" ");
          
          console.log(`Found ${relevantSegments.length} segments with timestamps for this fragment`);
        }
      }
      
      // If there are no specific lyrics, use general transcription
      if (!relevantLyrics && transcription) {
        // Divide total transcription proportionally
        const totalDuration = timelineItems.length > 0 ? 
          (timelineItems[timelineItems.length - 1].end_time / 1000) - (timelineItems[0].start_time / 1000) : 0;
          
        if (totalDuration > 0) {
          const segmentDuration = segmentEndTime - segmentStartTime;
          const segmentPercent = segmentDuration / totalDuration;
          const startPercent = (segmentStartTime - (timelineItems[0].start_time / 1000)) / totalDuration;
          
          // Estimate which part of the transcription corresponds to this segment
          const transcriptionWords = transcription.split(/\s+/);
          const startWordIndex = Math.floor(startPercent * transcriptionWords.length);
          const wordCount = Math.max(1, Math.floor(segmentPercent * transcriptionWords.length));
          
          if (startWordIndex >= 0 && wordCount > 0 && startWordIndex < transcriptionWords.length) {
            const endWordIndex = Math.min(startWordIndex + wordCount, transcriptionWords.length);
            relevantLyrics = transcriptionWords.slice(startWordIndex, endWordIndex).join(" ");
            console.log(`Using proportional transcription: words ${startWordIndex}-${endWordIndex} of ${transcriptionWords.length}`);
          }
        }
      }

      // If we still don't have lyrics, use contextual information based on segment
      if (!relevantLyrics || relevantLyrics.trim().length === 0) {
        // Determine context based on position in video and segment characteristics
        const isBeginningSong = timelineItems.indexOf(segment) < Math.min(3, timelineItems.length * 0.2);
        const isEndingSong = timelineItems.indexOf(segment) > timelineItems.length * 0.8;
        const isHighEnergy = segment.energy && segment.averageEnergy && segment.energy > segment.averageEnergy * 1.3;
        const isLowEnergy = segment.energy && segment.averageEnergy && segment.energy < segment.averageEnergy * 0.7;
        
        if (isHighEnergy) {
          relevantLyrics = isBeginningSong 
            ? "Energetic and intense introduction" 
            : isEndingSong 
              ? "Final climax with great energy" 
              : "Instrumental section with high intensity";
        } else if (isLowEnergy) {
          relevantLyrics = isBeginningSong 
            ? "Soft and atmospheric introduction" 
            : isEndingSong 
              ? "Melodic and reflective closure" 
              : "Quiet and contemplative interlude";
        } else {
          relevantLyrics = isBeginningSong 
            ? "Song introduction" 
            : isEndingSong 
              ? "Song conclusion" 
              : "Instrumental";
        }
        
        console.log(`No specific lyrics found, using context: "${relevantLyrics}"`);
      }

      // STEP 2: PROMPT GENERATION WITH MULTIPLE ATTEMPTS
      while (attempt < maxAttempts) {
        try {
          console.log(`Generating prompt for segment ${segment.id}, attempt ${attempt + 1}/${maxAttempts}`);
          
          // Validate video style parameters before creating prompt
          if (!videoStyle.cameraFormat || !videoStyle.mood || !videoStyle.characterStyle || 
              !videoStyle.colorPalette || videoStyle.visualIntensity === undefined || 
              videoStyle.narrativeIntensity === undefined) {
            console.error("Incomplete video styles:", videoStyle);
            throw new Error("Missing style parameters to generate prompt");
          }
          
          // Prepare parameters for prompt with typing
          const promptParams: VideoPromptParams = {
            shotType: segment.shotType || "medium shot",
            cameraFormat: videoStyle.cameraFormat,
            mood: segment.mood === 'intense' 
              ? 'Energetic' 
              : segment.mood === 'calm' 
                ? 'Calm' 
                : videoStyle.mood,
            visualStyle: videoStyle.characterStyle,
            visualIntensity: videoStyle.visualIntensity,
            narrativeIntensity: videoStyle.narrativeIntensity,
            colorPalette: videoStyle.colorPalette,
            duration: (segment.duration || 0) / 1000,
            directorStyle: videoStyle.selectedDirector?.style,
            specialty: videoStyle.selectedDirector?.specialty,
            styleReference: videoStyle.styleReferenceUrl || ""
          };

          // Add lyrics information to parameters
          const promptWithLyrics = `Music video scene representing these lyrics: "${relevantLyrics}". ${await generateVideoPromptWithRetry(promptParams)}`;

          if (promptWithLyrics && promptWithLyrics !== "Error generating prompt") {
            console.log(`Prompt successfully generated for segment ${segment.id}`);
            return promptWithLyrics;
          }

          console.warn(`Attempt ${attempt + 1} failed, retrying in ${2 * (attempt + 1)} seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          attempt++;

        } catch (error) {
          console.error(`Error in attempt ${attempt + 1}:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt === maxAttempts - 1) {
            toast({
              title: "Error",
              description: "Could not generate prompt after several attempts",
              variant: "destructive",
            });
            return segment.imagePrompt || "Error generating prompt";
          }

          // Exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retrying in ${backoffTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          attempt++;
        }
      }
    } catch (outerError) {
      console.error("General error in generatePromptForSegment:", outerError);
      lastError = outerError instanceof Error ? outerError : new Error(String(outerError));
    }

    // FALLBACK: If no attempt succeeded
    console.error(`Could not generate prompt for segment ${segment.id} after multiple attempts:`, lastError);
    
    // As a last resort, use a basic prompt based on shot type and mood
    const fallbackPrompt = `${segment.shotType || 'medium shot'} of a ${segment.mood || 'neutral'} scene with ${videoStyle.colorPalette || 'balanced'} colors. ${relevantLyrics}`;
    
    console.warn(`Using fallback prompt for segment ${segment.id}: ${fallbackPrompt}`);
    return fallbackPrompt;
  };

  const generatePromptsForSegments = async () => {
    if (timelineItems.length === 0) {
      toast({
        title: "Error",
        description: "You must first detect musical cuts",
        variant: "destructive",
      });
      return;
    }

    if (!videoStyle.mood || !videoStyle.colorPalette || !videoStyle.characterStyle) {
      toast({
        title: "Error",
        description: "You must configure all style aspects before generating prompts",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingScript(true);

    try {
      const updatedItems = [...timelineItems].slice(0, 10); // Limitar a 10 segmentos
      let hasError = false;
      let successCount = 0;

      // Procesar los segmentos en grupos de 3 para evitar sobrecargar la API
      for (let i = 0; i < updatedItems.length; i += 3) {
        const batch = updatedItems.slice(i, i + 3);

        try {
          const results = await Promise.all(
            batch.map(async (segment) => {
              const newPrompt = await generatePromptForSegment(segment);
              return {
                segment,
                prompt: newPrompt
              };
            })
          );

          results.forEach(({ segment, prompt }) => {
            if (prompt && prompt !== "Error generating prompt") {
              const index = updatedItems.findIndex(item => item.id === segment.id);
              if (index !== -1) {
                updatedItems[index] = {
                  ...updatedItems[index],
                  imagePrompt: prompt
                };
                successCount++;
              }
            } else {
              hasError = true;
            }
          });

          // Actualizar el estado después de cada batch
          setTimelineItems([...updatedItems]);

          toast({
            title: "Progreso",
            description: `Generados ${successCount} de ${updatedItems.length} prompts`,
          });

          // Esperar entre batches para evitar rate limits
          if (i + 3 < updatedItems.length) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (error) {
          console.error(`Error procesando batch ${i/3 + 1}:`, error);
          hasError = true;
        }
      }

      if (successCount === updatedItems.length) {
        toast({
          title: "Éxito",
          description: "Todos los prompts han sido generados",
        });
        setCurrentStep(5);
      } else {
        toast({
          title: "Completado con advertencias",
          description: `${successCount} de ${updatedItems.length} prompts generados exitosamente`,
          variant: hasError ? "destructive" : "default",
        });
      }

    } catch (error) {
      console.error("Error en la generación de prompts:", error);
      toast({
        title: "Error",
        description: "Error al generar los prompts",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateVideo = async (): Promise<string | null> => {
    if (!timelineItems.length || !audioBuffer) {
      toast({
        title: "Error",
        description: "No hay suficientes elementos para generar el video",
        variant: "destructive",
      });
      return null;
    }

    // Verificar si hay suficientes imágenes generadas
    const itemsWithImages = timelineItems.filter(item => item.generatedImage).length;
    if (itemsWithImages < timelineItems.length * 0.7) { // Al menos 70% de cobertura
      toast({
        title: "Atención",
        description: `Solo ${itemsWithImages} de ${timelineItems.length} segmentos tienen imágenes. Considera generar más imágenes primero.`,
        variant: "default",
      });
    }

    setIsGeneratingVideo(true);
    try {
      toast({
        title: "Iniciando proceso",
        description: "Preparando elementos para la generación del video...",
      });

      // Primero guardar todas las imágenes en Firebase
      const savePromises = timelineItems
        .filter(item => item.generatedImage && !item.firebaseUrl)
        .map(async (item) => {
          try {
            const url = await saveToFirebase(item);
            if (url) {
              // Actualizar el item con la URL de Firebase
              setTimelineItems(prev => prev.map(
                i => i.id === item.id ? { ...i, firebaseUrl: url } : i
              ));
            }
            return { id: item.id, success: !!url, url };
          } catch (error) {
            console.error(`Error guardando imagen para segmento ${item.id}:`, error);
            return { id: item.id, success: false };
          }
        });

      await Promise.all(savePromises);

      // Simulación del proceso de generación (en una implementación real, enviaríamos los elementos a un servicio)
      for (let i = 1; i <= 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Actualizar progreso
        toast({
          title: "Generando video",
          description: `Fase ${i} de 5: ${["Procesando audio", "Sincronizando elementos", "Renderizando escenas", "Aplicando efectos", "Finalizando"][i-1]}`,
          variant: "default",
        });
      }

      // Generar ID único para este video
      const videoId = `video_${Date.now()}`;
      setVideoId(videoId);

      // Crear un documento en Firestore para el video
      try {
        const videoRef = collection(db, 'videos');
        await addDoc(videoRef, {
          id: videoId,
          userId: user?.uid,
          title: songTitle || 'Video Musical Generado',
          status: 'preview', // Inicialmente solo vista previa
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          duration: audioBuffer.duration || 0,
          thumbnailUrl: timelineItems.find(item => item.firebaseUrl || item.generatedImage)?.firebaseUrl || 
                         timelineItems.find(item => item.firebaseUrl || item.generatedImage)?.generatedImage || '',
          tags: ['música', 'video', 'artista', 'canción', 'generado'],
        });
      } catch (error) {
        console.error("Error guardando información del video:", error);
      }

      // Marcar este paso como completado
      setCurrentStep(7);

      toast({
        title: "Video generado exitosamente",
        description: "Ya puedes previsualizar el video y/o comprarlo para acceso completo",
      });

      return videoId;
    } catch (error) {
      console.error("Error generando video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el video",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Función para descargar el video final
  const downloadVideo = () => {
    // Usar el video mejorado si está disponible, o el video generado original
    const videoToDownload = upscaledVideoUrl || generatedVideoUrl || "/assets/Standard_Mode_Generated_Video (2).mp4";
    const link = document.createElement('a');
    link.href = videoToDownload;
    link.download = `music-video-${videoId || 'final'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Descarga iniciada",
      description: "Tu video musical se está descargando ahora"
    });
  };
  
  // Función para compartir el video en redes sociales
  const shareMusicVideo = () => {
    // En una implementación real, aquí se abriría un modal con opciones
    // de compartir en diferentes redes sociales
    
    // Por ahora, simulamos compartir usando el navegador web API
    const videoToShare = upscaledVideoUrl || generatedVideoUrl || "/assets/Standard_Mode_Generated_Video (2).mp4";
    const shareData = {
      title: 'Mi Video Musical Generado con IA',
      text: '¡Mira este increíble video musical que he creado con IA!',
      url: window.location.origin + videoToShare
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => {
          toast({
            title: "Compartido con éxito",
            description: "Tu video ha sido compartido"
          });
        })
        .catch(error => {
          console.error('Error al compartir:', error);
          toast({
            title: "Error al compartir",
            description: "No se pudo compartir el video. Intenta otra opción."
          });
        });
    } else {
      // Fallback si Web Share API no está disponible
      toast({
        title: "Enlace copiado",
        description: "Enlace al video copiado al portapapeles. Ahora puedes compartirlo."
      });
    }
  };

  const analyzeReferenceImage = async (image: string) => {
    try {
      const analysis = await analyzeImage(image);

      setVideoStyle(prev => ({
        ...prev,
        styleDescription: analysis
      }));

      toast({
        title: "Análisis completado",
        description: "Estilo de referencia actualizado"
      });
    } catch (error) {
      console.error("Error analyzing reference image:", error);
      toast({
        title: "Error",
        description: "No se pudo analizar la imagen de referencia",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadDirectors = async () => {
      try {
        const directorsSnapshot = await getDocs(collection(db, "directors"));
        const directorsData = directorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Director[];
        setDirectors(directorsData);
      } catch (error) {
        console.error("Error loading directors:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los directores",
          variant: "destructive",
        });
      }
    };

    loadDirectors();
  }, []);

  // Convertir los pasos para el componente EnhancedProgressSteps
  // Definir los pasos del workflow con el tipo Step importado
  const workflowSteps: Step[] = [
    {
      id: "transcription",
      name: "Transcripción de Audio",
      description: "Analizando y transcribiendo la letra de tu canción",
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "in-progress" : "pending"
    },
    {
      id: "script",
      name: "Generación de Guion",
      description: "Creando un guion visual basado en la letra",
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "in-progress" : "pending"
    },
    {
      id: "sync",
      name: "Sincronización",
      description: "Alineando el contenido visual con el ritmo musical",
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "in-progress" : "pending"
    },
    {
      id: "scenes",
      name: "Generación de Escenas",
      description: "Creando escenas para cada sección",
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "in-progress" : "pending"
    },
    {
      id: "customization",
      name: "Personalización",
      description: "Ajustando el estilo visual a tus preferencias",
      status: currentStep > 5 ? "completed" : currentStep === 5 ? "in-progress" : "pending"
    },
    {
      id: "movement",
      name: "Integración de Movimiento",
      description: "Añadiendo dinámicas visuales y coreografías",
      status: currentStep > 6 ? "completed" : currentStep === 6 ? "in-progress" : "pending"
    },
    {
      id: "lipsync",
      name: "Sincronización de Labios",
      description: "Sincronizando labios con la letra",
      status: currentStep > 7 ? "completed" : currentStep === 7 ? "in-progress" : "pending"
    },
    {
      id: "generation",
      name: "Generación de Video",
      description: "Creando clips de video con IA",
      status: currentStep > 8 ? "completed" : currentStep === 8 ? "in-progress" : "pending"
    },
    {
      id: "rendering",
      name: "Renderizado Final",
      description: "Combinando todo en un video musical completo",
      status: currentStep > 9 ? "completed" : currentStep === 9 ? "in-progress" : "pending"
    }
  ];

  // Calcular el progreso para las animaciones
  const allStepsCompleted = workflowSteps.every(step => step.status === "completed");
  
  return (
    <div className="min-h-screen bg-black">
      {/* Overlay de progreso dinámico */}
      <AnimatePresence>
        {showProgress && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-w-2xl w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <DynamicProgressTracker
                currentStage={currentProgressStage}
                progress={progressPercentage}
                customMessage={progressMessage}
                onComplete={() => {
                  setShowProgress(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Efectos visuales para toda la aplicación */}
      {allStepsCompleted && <motion.div className="confetti-container" />}
      
      {/* Sistema de partículas dinámicas basadas en el paso actual - Ajustadas a naranja/negro */}
      {currentStep === 1 && (
        <ParticleSystem 
          count={30} 
          currentStep={1}
          active={true}
        />
      )}
      
      {currentStep === 2 && (
        <ParticleSystem 
          count={40} 
          currentStep={2}
          active={true}
        />
      )}
      
      {currentStep === 3 && (
        <ParticleSystem 
          count={50} 
          currentStep={3}
          active={true}
        />
      )}
      
      {currentStep === 4 && (
        <ParticleSystem 
          count={60} 
          currentStep={4}
          active={true}
        />
      )}
      
      {currentStep === 6 && (
        <ParticleSystem 
          count={80} 
          currentStep={6}
          active={true}
        />
      )}
      
      {currentStep >= 8 && currentStep < 9 && (
        <ParticleSystem 
          count={120}
          currentStep={8}
          active={true}
        />
      )}
      
      {/* Contenedor principal con posicionamiento relativo para los efectos */}
      <div className="relative">
        {/* Gradiente animado en el fondo - Usando solo naranja y negro */}
        <AnimatedGradient 
          colors={
            currentStep <= 2 ? ["#FF6B00", "#FF8800", "#FF4500", "#111111"] :
            currentStep <= 4 ? ["#FF4500", "#FF8800", "#111111", "#222222"] :
            currentStep <= 6 ? ["#FF7700", "#FF5500", "#111111", "#222222"] :
            currentStep <= 8 ? ["#FF6B00", "#111111", "#FF4500", "#000000"] :
            ["#FF8800", "#FF4500", "#111111", "#000000"]
          } 
          speed={currentStep <= 2 ? 5 : currentStep <= 5 ? 8 : 12} 
          className="opacity-20"
        />
        
        {/* Efectos de brillo según la etapa del proceso */}
        {currentStep >= 5 && currentStep < 7 && (
          <GlowEffect 
            color="purple" 
            size={300} 
            x={25} 
            y={30} 
            pulsate={true} 
            className="opacity-10"
          />
        )}
        
        {currentStep >= 7 && (
          <GlowEffect 
            color="orange" 
            size={350} 
            x={75} 
            y={40} 
            pulsate={true} 
            className="opacity-15"
          />
        )}
        
        {/* Componente de pasos mejorado con animaciones */}
        <EnhancedProgressSteps
          steps={workflowSteps}
          currentStep={workflowSteps.find(s => s.status === "in-progress")?.id || "transcription"}
          showDescriptions={true}
        />
        
        {/* Mantener el ProgressSteps original como fallback (escondido para compatibilidad) */}
        <div className="hidden">
          <ProgressSteps 
            currentStep={String(currentStep)} 
            steps={[
              {
                id: "transcription",
                name: "Transcripción de Audio",
                description: "Analizando y transcribiendo la letra de tu canción",
                status: currentStep > 1 ? "completed" : currentStep === 1 ? "in-progress" : "pending"
              },
              {
                id: "script",
                name: "Generación de Guion",
                description: "Creando un guion visual basado en tu música",
                status: currentStep > 2 ? "completed" : currentStep === 2 ? "in-progress" : "pending"
              },
              {
                id: "sync",
                name: "Sincronización",
                description: "Sincronizando el video con el ritmo de la música",
                status: currentStep > 3 ? "completed" : currentStep === 3 ? "in-progress" : "pending"
              },
              {
                id: "scenes",
                name: "Generación de Escenas",
                description: "Creando las escenas del video musical",
                status: currentStep > 4 ? "completed" : currentStep === 4 ? "in-progress" : "pending"
              },
              {
                id: "customization",
                name: "Personalización",
                description: "Ajustando el estilo visual a tus preferencias",
                status: currentStep > 5 ? "completed" : currentStep === 5 ? "in-progress" : "pending"
              },
              {
                id: "movement",
                name: "Integración de Movimiento",
                description: "Añadiendo coreografías y dinámicas visuales",
                status: currentStep > 6 ? "completed" : currentStep === 6 ? "in-progress" : "pending"
              },
              {
                id: "lipsync",
                name: "Sincronización de Labios",
                description: "Sincronizando labios con la letra de la canción",
                status: currentStep > 7 ? "completed" : currentStep === 7 ? "in-progress" : "pending"
              },
              {
                id: "generation",
                name: "Generación de Video",
                description: "Creando videos con IA a partir de tus escenas",
                status: currentStep > 8 ? "completed" : currentStep === 8 ? "in-progress" : "pending"
              },
              {
                id: "rendering",
                name: "Renderizado Final",
                description: "Combinando todo en tu video musical",
                status: currentStep > 9 ? "completed" : currentStep === 9 ? "in-progress" : "pending"
              }
            ]}
          />
        </div>
      </div> {/* Cierre del div className="relative" */}

      <motion.div 
        className="container py-6 space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1
          }}
        >
          <Card className="p-6 relative overflow-hidden shadow-lg border-none">
            {/* Efectos decorativos múltiples en la esquina */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-orange-400/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-radial from-purple-500/15 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            
            {/* Línea decorativa animada - versión mejorada */}
            <motion.div 
              className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 rounded-full"
              initial={{ width: "0%", opacity: 0.7 }}
              animate={{ 
                width: `${(currentStep / 9) * 100}%`,
                opacity: [0.7, 0.9, 0.7]
              }}
              transition={{ 
                width: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />
            
            {/* Borde brillante animado en la parte superior */}
            <motion.div 
              className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500/0 via-purple-500/30 to-orange-500/0"
              animate={{ 
                opacity: [0, 0.8, 0],
                left: ["-100%", "100%"]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut", 
                repeatDelay: 1
              }}
            />
            
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div 
                className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center border border-orange-500/20 shadow-sm"
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  boxShadow: ["0 0 0 rgba(249, 115, 22, 0)", "0 0 12px rgba(249, 115, 22, 0.3)", "0 0 0 rgba(249, 115, 22, 0)"] 
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } 
                }}
              >
                <Video className="h-7 w-7 text-orange-500" />
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  Creador de Videos Musicales AI
                </h2>
                <p className="text-sm text-muted-foreground/90 tracking-wide">
                  Transforma tu música en experiencias visuales cautivadoras
                </p>
              </div>
            </div>
            
            {/* Botón para mostrar Mis Videos */}
            <Button
              onClick={() => setShowMyVideos(!showMyVideos)}
              variant={showMyVideos ? "default" : "outline"}
              className={cn(
                "flex items-center gap-2",
                showMyVideos && "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              )}
              data-testid="button-toggle-my-videos"
            >
              <Film className="w-4 h-4" />
              {showMyVideos ? "Volver al Creador" : "Mis Videos"}
            </Button>
          </div>
          
          {/* Dashboard de Mis Videos */}
          {showMyVideos ? (
            <MyGeneratedVideos />
          ) : (
            <>

          {/* Sección de Pasos de Creación */}
          <div className="space-y-6">
            {/* Título de la sección */}
            <motion.div 
              className="border-b border-orange-500/20 pb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-orange-500" />
                Pasos de Creación
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sigue estos pasos para crear tu video musical con IA
              </p>
            </motion.div>

            <div className="space-y-6">
              <motion.div 
                className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  boxShadow: currentStep >= 2 ? "0 0 0 2px rgba(249, 115, 22, 0.2)" : "none"
                }}
                transition={{ duration: 0.5 }}
              >
                {/* Indicador de paso completado */}
                {currentStep >= 2 && (
                  <motion.div 
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </motion.div>
                )}
                
                {/* Título con icono animado */}
                <div className="flex items-center gap-3 mb-4">
                  <motion.div 
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                    whileHover={{ scale: 1.1 }}
                    animate={{ 
                      rotate: isTranscribing ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ 
                      rotate: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <Music2 className="h-4 w-4" />
                  </motion.div>
                  <Label className="text-lg font-semibold text-orange-500">1. Subir Audio</Label>
                </div>
                
                <div className="space-y-4">
                  <motion.div 
                    className="relative border-2 border-dashed border-orange-300 rounded-lg p-4 hover:border-orange-400 transition-colors bg-black/50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Input
                      type="file"
                      accept="audio/mpeg,audio/mp3,audio/mp4,audio/wav,audio/aac,audio/x-m4a,audio/ogg,audio/webm,audio/flac"
                      onChange={handleFileChange}
                      disabled={isTranscribing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Upload className="h-8 w-8 text-orange-400 mb-1" />
                      <p className="font-medium text-sm text-center">Arrastra tu archivo de audio o haz clic para seleccionar</p>
                      <p className="text-xs text-muted-foreground text-center">Soporta MP3, WAV, FLAC, OGG y otros formatos de audio</p>
                    </div>
                  </motion.div>
                  
                  {selectedFile && (
                    <motion.div 
                      className="flex items-center gap-3 text-sm p-3 bg-orange-50 rounded-md border border-orange-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-orange-100 rounded-full p-1.5">
                        <Music2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 truncate">
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </motion.div>
                  )}
                  
                  {isTranscribing && (
                    <motion.div 
                      className="flex items-center gap-3 text-sm p-3 bg-blue-50 rounded-md"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="bg-blue-100 rounded-full p-1.5 relative">
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        <motion.div 
                          className="absolute inset-0 rounded-full border-2 border-blue-300 border-t-blue-600"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <div>
                        <span className="font-medium">Transcribiendo audio...</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          Procesando datos de voz con IA
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <div className="space-y-6">
                <motion.div 
                  className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 3 ? "0 0 0 2px rgba(79, 70, 229, 0.2)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 3 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: isGeneratingScript ? [0, 10, -10, 0] : 0
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </motion.div>
                    <Label className="text-lg font-semibold text-orange-500">2. Transcripción</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <motion.div 
                      className="relative"
                      animate={{ opacity: 1 }}
                      initial={{ opacity: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ScrollArea className="h-[200px] w-full rounded-md border border-orange-500/20 bg-black/80 p-4 shadow-inner">
                        {transcription ? (
                          <motion.pre 
                            className="text-sm whitespace-pre-wrap font-normal text-slate-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            {transcription}
                          </motion.pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                            <FileText className="h-8 w-8 mb-2 text-slate-400" />
                            <p className="text-sm text-slate-500">Sube un archivo de audio para ver la transcripción</p>
                          </div>
                        )}
                      </ScrollArea>
                    </motion.div>
                    
                    {/* Mostrar botón de continuar cuando la transcripción se ha completado pero no se ha avanzado al paso 2 */}
                    {currentStep === 1.5 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        {/* Sección para subir imágenes de referencia del artista */}
                        <div className="border border-purple-500/30 rounded-lg p-4 bg-purple-950/20">
                          <div className="flex items-center gap-2 mb-3">
                            <ImageIcon className="h-5 w-5 text-purple-400" />
                            <Label className="text-base font-semibold text-purple-400">
                              Imágenes de Referencia del Artista (Opcional)
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            Sube hasta 3 fotos del artista para que Nano Banana las use como referencia al generar las escenas del video
                          </p>
                          
                          {/* Grid para mostrar las imágenes subidas */}
                          {artistReferenceImages.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {artistReferenceImages.map((img, index) => (
                                <div key={index} className="relative group">
                                  <img 
                                    src={img} 
                                    alt={`Referencia ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-md border border-purple-500/40"
                                  />
                                  <button
                                    onClick={() => removeReferenceImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-testid={`remove-reference-${index}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Botón para subir imágenes */}
                          {artistReferenceImages.length < 3 && (
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleReferenceImageUpload}
                                disabled={isUploadingReferences}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                data-testid="upload-reference-images"
                              />
                              <div className="border-2 border-dashed border-purple-400/40 rounded-lg p-3 hover:border-purple-400 transition-colors bg-purple-950/10 cursor-pointer">
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <Upload className="h-6 w-6 text-purple-400" />
                                  <p className="text-xs font-medium text-center text-purple-300">
                                    {isUploadingReferences ? "Cargando..." : `Subir imágenes (${artistReferenceImages.length}/3)`}
                                  </p>
                                  <p className="text-xs text-muted-foreground text-center">
                                    JPG, PNG o WEBP (máx. 5MB)
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => setCurrentStep(2)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
                          data-testid="continue-to-next-step"
                        >
                          <motion.div 
                            className="mr-2"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </motion.div>
                          Continuar al siguiente paso
                        </Button>
                      </motion.div>
                    )}
                    
                    <Button
                      onClick={generateScriptFromTranscription}
                      disabled={!transcription || isGeneratingScript || currentStep < 2}
                      className={cn(
                        "w-full group relative overflow-hidden transition-all",
                        transcription && !isGeneratingScript && currentStep >= 2 
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md" 
                          : ""
                      )}
                    >
                      {isGeneratingScript ? (
                        <motion.div className="flex items-center justify-center w-full">
                          <motion.div 
                            className="mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Loader2 className="h-4 w-4" />
                          </motion.div>
                          <span>Generando guion...</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="flex items-center justify-center w-full"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Generar Guion Musical</span>
                        </motion.div>
                      )}
                      
                      {/* Efecto de brillo al pasar el mouse */}
                      {transcription && !isGeneratingScript && currentStep >= 2 && (
                        <motion.div 
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                          animate={{ translateX: ["100%", "-100%"] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 0.5 }}
                        />
                      )}
                    </Button>
                  </div>
                </motion.div>

                <motion.div 
                  className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 4 ? "0 0 0 2px rgba(124, 58, 237, 0.2)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 4 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado y badge */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                        whileHover={{ scale: 1.1 }}
                        animate={scriptContent ? { 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0]
                        } : {}}
                        transition={{ 
                          repeat: scriptContent ? Infinity : 0,
                          repeatDelay: 3,
                          duration: 1
                        }}
                      >
                        <Film className="h-4 w-4" />
                      </motion.div>
                      <Label className="text-lg font-semibold text-orange-500">3. Guion Profesional</Label>
                    </div>
                    
                    {scriptContent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 hover:from-amber-100 hover:to-yellow-100 border-amber-200">
                          <Film className="h-3 w-3 mr-1" />
                          Análisis cinematográfico
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {!scriptContent ? (
                      <motion.div 
                        className="flex flex-col items-center justify-center py-8 text-center rounded-md bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 shadow-sm"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          animate={{ 
                            y: [0, -5, 0],
                            opacity: [0.5, 0.8, 0.5]
                          }}
                          transition={{ 
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut"
                          }}
                        >
                          <Film className="h-14 w-14 mb-3 text-orange-400" />
                        </motion.div>
                        <p className="max-w-md font-medium text-gray-600">El guion profesional se generará basado en la transcripción de la letra.</p>
                        <div className="mt-4 grid grid-cols-3 gap-3 max-w-lg">
                          <div className="flex flex-col items-center p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                            <span className="text-xs font-semibold text-orange-800 mb-1">Estilo</span>
                            <span className="text-[10px] text-center text-orange-600">Análisis de género y estética</span>
                          </div>
                          <div className="flex flex-col items-center p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                            <span className="text-xs font-semibold text-amber-800 mb-1">Arco</span>
                            <span className="text-[10px] text-center text-amber-600">Estructura narrativa</span>
                          </div>
                          <div className="flex flex-col items-center p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                            <span className="text-xs font-semibold text-orange-800 mb-1">Técnica</span>
                            <span className="text-[10px] text-center text-orange-600">Dirección escénica</span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div 
                          className="grid grid-cols-3 gap-2 text-xs mb-4"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.5,
                            staggerChildren: 0.1
                          }}
                        >
                          <motion.div 
                            className="bg-gradient-to-br from-zinc-900 to-black p-3 rounded-md border border-orange-800/30 shadow-sm"
                            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(251, 191, 36, 0.1)" }}
                            transition={{ duration: 0.2 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <span className="font-semibold block text-orange-400">Análisis Musical</span>
                            <span className="text-orange-300">Género y estructura</span>
                          </motion.div>
                          <motion.div 
                            className="bg-gradient-to-br from-zinc-900 to-black p-3 rounded-md border border-orange-800/30 shadow-sm"
                            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(249, 115, 22, 0.1)" }}
                            transition={{ duration: 0.2 }}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            
                          >
                            <span className="font-semibold block text-orange-400">Narrativa Visual</span>
                            <span className="text-orange-300">Arco emocional y mensajes</span>
                          </motion.div>
                          <motion.div 
                            className="bg-gradient-to-br from-zinc-900 to-black p-3 rounded-md border border-orange-800/30 shadow-sm"
                            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(249, 115, 22, 0.1)" }}
                            transition={{ duration: 0.2 }}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <span className="font-semibold block text-orange-400">Dirección Técnica</span>
                            <span className="text-orange-300">Planos, transiciones, mood</span>
                          </motion.div>
                        </motion.div>
                        
                        <motion.div
                          className="relative overflow-hidden rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          {/* Efecto de resplandor superior */}
                          <motion.div 
                            className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400/0 via-orange-500/50 to-orange-400/0 z-10"
                            animate={{ 
                              opacity: [0.3, 0.7, 0.3]
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          
                          <ScrollArea className="h-[300px] w-full rounded-md border border-zinc-800 p-4 bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 shadow-inner">
                            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{scriptContent}</pre>
                          </ScrollArea>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 5 ? "0 0 0 2px rgba(244, 63, 94, 0.2)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 5 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -5, 5, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 5, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">4. Estilo Visual</Label>
                      <p className="text-xs text-muted-foreground">Define la estética visual de tu video musical</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-5">
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-orange-900/80">Formato de Cámara</Label>
                        <motion.div 
                          className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"
                          whileHover={{ scale: 1.2, backgroundColor: "rgb(255 237 213 / 1)" }}
                          transition={{ duration: 0.2 }}
                        >
                          <Film className="h-3 w-3" />
                        </motion.div>
                      </div>
                      <Select
                        value={videoStyle.cameraFormat}
                        onValueChange={(value) => setVideoStyle(prev => ({ ...prev, cameraFormat: value }))}
                      >
                        <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
                          <SelectValue placeholder="Seleccionar formato de cámara" />
                        </SelectTrigger>
                        <SelectContent>
                          {videoStyles.cameraFormats.map((format) => (
                            <SelectItem key={format.name} value={format.name}>
                              <div className="grid gap-1">
                                <span>{format.name}</span>
                                <span className="text-xs text-muted-foreground">{format.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">Mood</Label>
                          <motion.div 
                            className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"
                            whileHover={{ scale: 1.2, backgroundColor: "rgb(255 237 213 / 1)" }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="text-xs font-semibold">M</span>
                          </motion.div>
                        </div>
                        <Select
                          value={videoStyle.mood}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, mood: value }))}
                        >
                          <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
                            <SelectValue placeholder="Seleccionar mood" />
                          </SelectTrigger>
                          <SelectContent>
                            {videoStyles.moods.map((mood) => (
                              <SelectItem key={mood} value={mood}>
                                {mood}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">Paleta de Colores</Label>
                          <div className="flex space-x-1">
                            <motion.div 
                              className="h-4 w-4 rounded-full bg-orange-400"
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.2 }}
                            />
                            <motion.div 
                              className="h-4 w-4 rounded-full bg-orange-600"
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.2 }}
                            />
                            <motion.div 
                              className="h-4 w-4 rounded-full bg-zinc-900"
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.2 }}
                            />
                          </div>
                        </div>
                        <Select
                          value={videoStyle.colorPalette}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, colorPalette: value }))}
                        >
                          <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
                            <SelectValue placeholder="Seleccionar paleta" />
                          </SelectTrigger>
                          <SelectContent>
                            {videoStyles.colorPalettes.map((palette) => (
                              <SelectItem key={palette} value={palette}>
                                {palette}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">Estilo de Personajes</Label>
                          <motion.div 
                            className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"
                            whileHover={{ scale: 1.2, backgroundColor: "rgb(255 237 213 / 1)" }}
                            transition={{ duration: 0.2 }}
                          >
                            <User className="h-3 w-3" />
                          </motion.div>
                        </div>
                        <Select
                          value={videoStyle.characterStyle}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, characterStyle: value }))}
                        >
                          <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
                            <SelectValue placeholder="Seleccionar estilo" />
                          </SelectTrigger>
                          <SelectContent>
                            {videoStyles.characterStyles.map((style) => (
                              <SelectItem key={style} value={style}>
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">
                            Intensidad Visual
                            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              {videoStyle.visualIntensity}%
                            </span>
                          </Label>
                        </div>
                        <div className="pt-2">
                          <Slider
                            value={[videoStyle.visualIntensity]}
                            onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, visualIntensity: value }))}
                            max={100}
                            step={1}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Sutil</span>
                            <span>Impactante</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div 
                      className="space-y-3 pt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-orange-900/80">
                          Intensidad Narrativa 
                          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            {videoStyle.narrativeIntensity}%
                          </span>
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajusta qué tan fielmente el video sigue la narrativa de la letra
                      </p>
                      <div className="pt-1">
                        <Slider
                          value={[videoStyle.narrativeIntensity]}
                          onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, narrativeIntensity: value }))}
                          max={100}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Abstracto</span>
                          <span>Literal</span>
                        </div>
                      </div>
                    </motion.div>

                    <div className="space-y-2">
                      <Label>Imagen de Referencia</Label>
                      <div className="grid gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (e) => {
                                const base64 = e.target?.result as string;
                                setVideoStyle(prev => ({
                                  ...prev,
                                  referenceImage: base64
                                }));
                                await analyzeReferenceImage(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {videoStyle.referenceImage && (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                            <img
                              src={videoStyle.referenceImage}
                              alt="Referencia de estilo"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        {videoStyle.styleDescription && (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm">{videoStyle.styleDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Director del Video</Label>
                      {directors.length > 0 ? (
                        <div className="grid gap-4">
                          <Select
                            value={videoStyle.selectedDirector?.id || ""}
                            onValueChange={(directorId) => {
                              const director = directors.find(d => d.id === directorId);
                              setVideoStyle(prev => ({
                                ...prev,
                                selectedDirector: director || null
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar director" />
                            </SelectTrigger>
                            <SelectContent>
                              {directors.map((director) => (
                                <SelectItem key={director.id} value={director.id}>
                                  <div className="flex items-center gap-2">
                                    {director.imageUrl && (
                                      <img
                                        src={director.imageUrl}
                                        alt={director.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    )}
                                    <div className="grid gap-0.5">
                                      <span className="font-medium">{director.name}</span>
                                      <span className="text-xs text-muted-foreground">{director.specialty}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {videoStyle.selectedDirector && (
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center gap-4">
                                {videoStyle.selectedDirector.imageUrl && (
                                  <img
                                    src={videoStyle.selectedDirector.imageUrl}
                                    alt={videoStyle.selectedDirector.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                  />
                                )}
                                <div className="space-y-1">
                                  <h4 className="font-semibold">{videoStyle.selectedDirector.name}</h4>
                                  <p className="text-sm text-muted-foreground">{videoStyle.selectedDirector.experience}</p>
                                  <p className="text-sm">{videoStyle.selectedDirector.style}</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-orange-500">★</span>
                                    <span className="text-sm">{videoStyle.selectedDirector.rating.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 border rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Cargando directores...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="border border-orange-500/30 rounded-lg overflow-hidden p-5 bg-gradient-to-br from-black to-black/70 shadow-sm relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 6 ? "0 0 0 2px rgba(255, 98, 0, 0.4)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 6 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-500"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -3, 3, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <Waves className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-300">5. Crear Timeline</Label>
                      <p className="text-xs text-white/70">Genera el timeline basado en el guión del video musical</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      onClick={syncAudioWithTimeline}
                      disabled={!audioBuffer || isGeneratingShots || currentStep < 3}
                      className="w-full mb-3 h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                    >
                      {isGeneratingShots ? (
                        <motion.div className="flex items-center justify-center gap-2" animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Creando timeline desde guión...</span>
                        </motion.div>
                      ) : (
                        <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          <span>Crear Timeline desde Guión</span>
                        </motion.div>
                      )}
                    </Button>
                    
                    {/* Botón para generar imágenes con Gemini */}
                    {timelineItems.length > 0 && scriptContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-3"
                      >
                        <Button
                          onClick={generateAllSceneImages}
                          disabled={isGeneratingImages || !scriptContent}
                          className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 border-0 shadow-md"
                        >
                          {isGeneratingImages ? (
                            <motion.div className="flex items-center justify-center gap-2" animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Generando imágenes con Gemini...</span>
                            </motion.div>
                          ) : (
                            <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              <span>Generar Imágenes ({artistReferenceImages.length > 0 ? `${artistReferenceImages.length} referencias` : 'sin referencias'})</span>
                            </motion.div>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                <div className="border rounded-lg p-4 mt-4">
                  <Label className="text-lg font-semibold mb-4">Estilo de Edición</Label>
                  <RadioGroup
                    value={selectedEditingStyle}
                    onValueChange={setSelectedEditingStyle}
                    className="grid grid-cols-2 gap-4"
                  >
                    {editingStyles.map((style) => (
                      <div key={style.id} className="flex items-start space-x-3">
                        <RadioGroupItem value={style.id} id={style.id} />
                        <div className="grid gap-1.5">
                          <Label htmlFor={style.id} className="font-medium">
                            {style.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <motion.div 
                  className="border border-orange-500/20 rounded-lg overflow-hidden p-5 bg-gradient-to-br from-black to-black/70 shadow-sm relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 7 ? "0 0 0 2px rgba(249, 115, 22, 0.3)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 7 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-900 text-orange-400 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-900 text-orange-400"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -3, 3, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <Megaphone className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold text-orange-500">6. Generar Prompts</Label>
                      <p className="text-xs text-white/70">Crea instrucciones de IA con el estilo definido</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <Button
                      onClick={generatePromptsForSegments}
                      disabled={
                        timelineItems.length === 0 ||
                        isGeneratingScript ||
                        currentStep < 4 ||
                        !videoStyle.mood ||
                        !videoStyle.colorPalette ||
                        !videoStyle.characterStyle
                      }
                      className="w-full h-12 mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                    >
                      {isGeneratingScript ? (
                        <motion.div className="flex items-center justify-center gap-2" animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Creando prompts artísticos...</span>
                        </motion.div>
                      ) : (
                        <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Generar Prompts con Estilo</span>
                        </motion.div>
                      )}
                    </Button>
                    
                    {/* Fondo decorativo para el botón */}
                    {!isGeneratingScript && (
                      <motion.div 
                        className="absolute -bottom-2 -right-2 -left-2 h-8 rounded-b-lg opacity-30 bg-gradient-to-t from-orange-900/40 to-transparent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    )}
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="border border-orange-500/20 rounded-lg overflow-hidden p-5 bg-gradient-to-br from-black to-black/70 shadow-sm relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 8 ? "0 0 0 2px rgba(249, 115, 22, 0.3)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 8 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-900 text-orange-400 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-900 text-orange-400"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -3, 3, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold text-orange-500">7. Generar Imágenes</Label>
                      <p className="text-xs text-white/70">Crea visuales impactantes para cada segmento</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative mt-4"
                  >
                    <Button
                      onClick={generateShotImages}
                      disabled={
                        !timelineItems.length ||
                        isGeneratingShots ||
                        currentStep < 5
                      }
                      className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                    >
                      {isGeneratingShots ? (
                        <motion.div className="flex items-center justify-center gap-2" animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Generando escenas visuales...</span>
                        </motion.div>
                      ) : (
                        <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          <span>Generar Imágenes para Escenas</span>
                        </motion.div>
                      )}
                    </Button>
                    
                    {/* Decoración visual */}
                    {!isGeneratingShots && (
                      <motion.div 
                        className="absolute -bottom-2 -right-2 -left-2 h-8 rounded-b-lg opacity-30 bg-gradient-to-t from-orange-900/40 to-transparent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    )}
                  </motion.div>
                  
                  {/* Información de ayuda */}
                  <motion.div 
                    className="mt-5 bg-black/50 rounded-lg p-3 text-xs text-orange-400 border border-orange-500/20 flex items-start gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    <HelpCircle className="h-4 w-4 text-orange-400/70 mt-0.5 flex-shrink-0" />
                    <div className="text-white/80">
                      Este paso utilizará los prompts generados para crear imágenes para cada segmento del video. 
                      Las imágenes generadas se adaptarán al estilo visual que has definido anteriormente.
                    </div>
                  </motion.div>
                </motion.div>

                {/* Componente de Generación de Video (Paso 8) */}
                {currentStep === 8 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">8. Generación de Video</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Genera un video a partir de tus escenas sincronizadas. Este paso utiliza IA para convertir
                        tus imágenes en secuencias de video fluidas con efectos profesionales.
                      </p>
                      <VideoGenerator
                        onGenerateVideo={async (settings) => {
                          console.log("Configuración para generar video:", settings);
                          toast({
                            title: "Generación iniciada",
                            description: `Generando video con modelo ${settings.model}, calidad ${settings.quality}`
                          });
                          await generateVideo();
                        }}
                        isLoading={isGeneratingVideo}
                        scenesCount={timelineItems.length}
                        clips={timelineItems.map(item => ({
                          id: typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10),
                          start: (item.start_time - (timelineItems[0]?.start_time || 0)) / 1000,
                          duration: (item.duration || 0) / 1000,
                          type: 'image' as const,
                          layer: 1, // Añadimos layer=1 para video/imagen
                          thumbnail: typeof (item.generatedImage || item.firebaseUrl) === 'string' ? (item.generatedImage || item.firebaseUrl) : undefined,
                          title: item.shotType || 'Escena',
                          description: item.description || '',
                          imageUrl: item.generatedImage || item.firebaseUrl,
                          imagePrompt: item.imagePrompt,
                          metadata: {
                            section: item.metadata?.section || 'default',
                            movementApplied: item.metadata?.movementApplied,
                            movementPattern: item.metadata?.movementPattern,
                            movementIntensity: item.metadata?.movementIntensity,
                            faceSwapApplied: item.metadata?.faceSwapApplied,
                            musicianIntegrated: item.metadata?.musicianIntegrated
                          }
                        }))}
                        duration={audioBuffer?.duration || 0}
                        isGenerating={isGeneratingVideo}
                        onGenerate={async () => { await generateVideo(); return; }}
                      />
                      {videoId && (
                        <Button 
                          className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                          onClick={() => setCurrentStep(9)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Continuar a Renderizado Final
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Personalización de Artista (Paso 5) */}
                {currentStep === 5 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">5. Personalización de Estilo</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Personaliza tus escenas ajustando el estilo visual y los elementos de identidad del artista.
                      </p>
                      <ArtistCustomization
                        clips={clips}
                        onUpdateClip={handleClipUpdate}
                      />
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                        onClick={() => setCurrentStep(6)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continuar a Integración de Movimiento
                      </Button>
                    </div>
                  </div>
                )}

                {/* Integración de Movimiento (Paso 6) */}
                {currentStep === 6 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">6. Integración de Movimiento</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Añade efectos de movimiento y coreografías a tus escenas para crear secuencias más dinámicas.
                      </p>
                      <MovementIntegration
                        onApplyMovements={(movementSettings) => {
                          console.log("Aplicando configuración de movimientos:", movementSettings);
                          // Aquí implementarías la lógica real para aplicar los movimientos
                          toast({
                            title: "Movimientos aplicados",
                            description: `Estilo: ${movementSettings.style}, Intensidad: ${movementSettings.intensity}%`
                          });
                        }}
                        isLoading={false}
                      />
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                        onClick={() => setCurrentStep(7)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continuar a Sincronización de Labios
                      </Button>
                    </div>
                  </div>
                )}

                {/* Música e Integraciones Opcionales (fuera del flujo principal) */}
                {false && (
                  <MusicianIntegration
                    clips={clips}
                    audioBuffer={audioBuffer}
                    onUpdateClip={handleClipUpdate}
                  />
                )}

                {/* Sincronización de Labios (Paso 7) */}
                {currentStep === 7 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">7. Sincronización de Labios</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sincroniza los movimientos labiales con la letra de la canción para dar mayor realismo al video.
                      </p>
                      <LipSyncIntegration
                        onApplyLipSync={(lipSyncSettings) => {
                          console.log("Aplicando configuración de sincronización de labios:", lipSyncSettings);
                          // Aquí implementarías la lógica real para aplicar la sincronización
                          toast({
                            title: "Sincronización aplicada",
                            description: `Tipo: ${lipSyncSettings.sourceType}, ${lipSyncSettings.sourceType === 'text' ? 'Texto configurado' : 'Audio cargado'}`
                          });
                        }}
                        isLoading={false}
                      />
                      <Button 
                        className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                        onClick={() => setCurrentStep(8)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continuar a Generación de Video
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 8: Generación de Video */}
                {currentStep === 8 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">8. Generación de Video</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Genera videos dinámicos a partir de tus escenas utilizando inteligencia artificial avanzada.
                      </p>
                      <VideoGenerator
                        scenesCount={timelineItems.length}
                        isLoading={isGeneratingVideo}
                        onGenerateVideo={async (settings) => {
                          console.log("Configuración para generar video:", settings);
                          toast({
                            title: "Generación iniciada",
                            description: `Generando video con modelo ${settings.model}, calidad ${settings.quality}`
                          });
                          
                          try {
                            await generateVideo();
                            setCurrentStep(9);
                          } catch (error) {
                            console.error("Error generando video:", error);
                            toast({
                              title: "Error",
                              description: "No se pudo generar el video. Intenta de nuevo.",
                              variant: "destructive"
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Paso 9: Renderizado Final con Upscaling */}
                {currentStep === 9 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">9. Renderizado Final</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        El proceso de creación ha terminado. Ahora puedes mejorar la calidad de tu video musical con Qubico Video Toolkit antes de exportarlo.
                      </p>
                      
                      <FinalRendering
                        timelineClips={timelineItems.map(item => ({
                          id: typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10),
                          start: (item.start_time - (timelineItems[0]?.start_time || 0)) / 1000,
                          duration: (item.duration || 0) / 1000,
                          title: item.shotType || 'Escena',
                          type: 'video' as const,
                          layer: 1, // Añadimos layer=1 para video/imagen
                          thumbnail: item.generatedImage || fallbackImage
                        }))}
                        videoUrl={generatedVideoUrl || '/assets/Standard_Mode_Generated_Video (2).mp4'}
                        onUpscaleVideo={async (options) => {
                          try {
                            setIsUpscaling(true);
                            // Llamar al servicio real de upscaling
                            const result = await upscaleVideo(
                              generatedVideoUrl || '/assets/Standard_Mode_Generated_Video (2).mp4', 
                              options
                            );
                            
                            if (result.success && result.url) {
                              setUpscaledVideoUrl(result.url);
                              return result.url;
                            } else {
                              throw new Error(result.error || 'Error al mejorar el video');
                            }
                          } catch (error) {
                            console.error('Error en upscaling:', error);
                            throw error;
                          } finally {
                            setIsUpscaling(false);
                          }
                        }}
                        onDownloadVideo={downloadVideo}
                        onShareVideo={shareMusicVideo}
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Separador visual entre creación y edición avanzada */}
            <motion.div 
              className="my-12 py-8 border-t border-orange-500/30"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div 
                className="border-l-4 border-purple-500 pl-4 mb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 flex items-center gap-3">
                  <Film className="h-7 w-7 text-purple-500" />
                  Editor de Timeline
                </h3>
                <p className="text-muted-foreground mt-3 text-base">
                  Edita y ajusta las escenas de tu video en el timeline. Perfecciona cada detalle antes de la generación final.
                </p>
              </motion.div>
            </motion.div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-4">
                  {/* Visor de Imágenes Generadas */}
                  {timelineItems.some(item => item.imageUrl || item.thumbnail) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/40 backdrop-blur-lg border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="h-5 w-5 text-purple-400" />
                        <h3 className="text-sm font-semibold text-white">Escenas Generadas</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {timelineItems.filter(item => item.imageUrl || item.thumbnail).length} / {timelineItems.length}
                        </Badge>
                      </div>
                      
                      <ScrollArea className="h-[200px]">
                        <div className="grid grid-cols-3 gap-2">
                          {timelineItems.map((item, index) => {
                            const hasImage = item.imageUrl || item.thumbnail;
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative group cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                              >
                                <div className="aspect-video rounded overflow-hidden bg-black/60 border border-white/10">
                                  {hasImage ? (
                                    <img
                                      src={item.imageUrl || item.thumbnail}
                                      alt={item.title || `Scene ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <ImageIcon className="h-6 w-6 text-white/20" />
                                    </div>
                                  )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                  <p className="text-[10px] text-white/80 font-medium truncate">
                                    {item.title || `Escena ${index + 1}`}
                                  </p>
                                </div>
                                {hasImage && (
                                  <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                  
                  {/* Preview Player - Muestra la imagen actual basada en currentTime */}
                  {/* SIEMPRE visible si hay timeline items, muestra placeholder si falta la imagen */}
                  {timelineItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-lg p-4 mb-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Play className="h-5 w-5 text-green-400" />
                        <h3 className="text-sm font-semibold text-white">Preview en Vivo</h3>
                        <Badge variant="secondary" className="ml-auto">
                          {(currentTime / 1000).toFixed(2)}s / {totalDuration.toFixed(2)}s
                        </Badge>
                      </div>
                      
                      {(() => {
                        // Encontrar la imagen actual basada en currentTime
                        const currentScene = timelineItems.find(item => {
                          const itemStart = item.start_time || 0;
                          const itemEnd = (item.start_time || 0) + (item.duration || 0);
                          return currentTime >= itemStart && currentTime < itemEnd;
                        });
                        
                        const currentImage = currentScene?.imageUrl || currentScene?.thumbnail;
                        
                        return (
                          <div className="relative">
                            {/* Preview de imagen actual */}
                            <div className="aspect-video rounded-lg overflow-hidden bg-black/80 border border-white/20 relative">
                              {currentImage ? (
                                <>
                                  <img
                                    src={currentImage}
                                    alt={currentScene?.title || "Vista previa"}
                                    className="w-full h-full object-contain"
                                  />
                                  {/* Información de la escena actual */}
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-white font-semibold text-sm mb-1">
                                          {currentScene?.title || "Escena actual"}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs">
                                          {currentScene?.shotType && (
                                            <Badge className="bg-purple-500/80 border-purple-400 text-white font-mono text-[10px] px-1.5 py-0.5">
                                              {currentScene.shotType}
                                            </Badge>
                                          )}
                                          {currentScene?.metadata?.role && (
                                            <Badge className="bg-blue-500/80 border-blue-400 text-white text-[10px] px-1.5 py-0.5">
                                              {currentScene.metadata.role}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {isPlaying && (
                                        <div className="flex items-center gap-1.5 text-green-400">
                                          <Activity className="h-4 w-4 animate-pulse" />
                                          <span className="text-[10px] font-semibold">EN VIVO</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                  <ImageIcon className="h-12 w-12 text-white/20" />
                                  <p className="text-white/40 text-sm">
                                    {currentScene ? "Imagen aún no generada" : "Ninguna escena activa"}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Indicador de progreso */}
                            {currentScene && (
                              <div className="mt-2 bg-white/10 rounded-full h-1 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-100"
                                  style={{
                                    width: `${((currentTime - (currentScene.start_time || 0)) / (currentScene.duration || 1)) * 100}%`
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                  
                  <TimelineEditor
                    clips={clips}
                    currentTime={(currentTime - (timelineItems[0]?.start_time || 0)) / 1000}
                    duration={totalDuration}
                    audioBuffer={audioBuffer}
                    onTimeUpdate={handleTimeUpdate}
                    onClipUpdate={handleClipUpdate}
                    onSplitClip={handleSplitClip}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    isPlaying={isPlaying}
                    onRegenerateImage={(clipId) => {
                      const item = timelineItems.find(item => item.id === clipId);
                      if (item) {
                        regenerateImage(item);
                      }
                    }}
                  />

                  <AnalyticsDashboard
                    clips={clips}
                    audioBuffer={audioBuffer}
                    duration={totalDuration}
                  />
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}