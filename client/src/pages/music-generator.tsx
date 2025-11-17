import { useState, useEffect } from "react";
import { MusicGenerationSection } from "../components/music/genre-templates/music-generation-section";
import { MusicGenerationAdvancedParams } from "../components/music/genre-templates/advanced-music-params";
import { 
  musicGenreTemplates, 
  getGenreTemplateById, 
  getDetailedPrompt,
  MusicGenreTemplate
} from "../components/music/genre-templates/genre-data";
import { generateMusic, checkGenerationStatus, getRecentGenerations, saveGeneratedSongToProfile, generateMusicWithFAL, checkFALMusicStatus, generateMusicWithStableAudio, checkStableAudioStatus } from "../lib/api/music-generator-service";
import { useToast } from "../hooks/use-toast";
import { Header } from "../components/layout/header";
import { motion } from "framer-motion";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

import {
  Music,
  Play,
  Pause,
  Download,
  Clock,
  Trash2,
  History,
  Disc3,
  Music2,
  MusicIcon,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Wand2,
  Headphones,
  Share2,
  Zap,
  Star,
  Sparkles,
} from "lucide-react";

/**
 * Main page of the AI Music Generator
 * 
 * This page allows:
 * - Generate music with different models and genres
 * - Customize generation parameters
 * - View generation history
 * - Play and download generations
 */
export default function MusicGeneratorPage() {
  // Hooks and services
  const { toast } = useToast();
  
  // Music generator state
  const [musicPrompt, setMusicPrompt] = useState<string>("");
  const [musicTitle, setMusicTitle] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("music-fal");
  const [selectedGenreTemplate, setSelectedGenreTemplate] = useState<string>("pop");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [musicGenerationProgress, setMusicGenerationProgress] = useState<number>(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showAdvancedParams, setShowAdvancedParams] = useState<boolean>(false);
  const [advancedModeType, setAdvancedModeType] = useState<'standard' | 'continuation' | 'lyrics' | 'upload'>('standard');
  
  // Audio player state
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  
  // Generation history state
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  
  // Advanced parameters state
  const [advancedParams, setAdvancedParams] = useState<MusicGenerationAdvancedParams>({
    makeInstrumental: false,
    negativeTags: "",
    tags: "",
    lyricsType: "auto",
    customLyrics: "",
    seed: -1,
    continueClipId: "",
    continueAt: 30,
    gptDescriptionPrompt: "",
    prompt: "",
    title: "",
    serviceMode: "music-s",
    generateLyrics: true,
    uploadAudio: false,
    audioUrl: "",
    tempo: 120,
    keySignature: "C Major",
    mainInstruments: ["synth", "drums", "piano", "vocals"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: true,
      outro: true
    },
    musicTemplate: "pop"
  });
  
  // Load recent generations when component mounts
  useEffect(() => {
    loadRecentGenerations();
  }, []);
  
  // Check status of generation in progress
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isGeneratingMusic && currentTaskId) {
      intervalId = setInterval(async () => {
        try {
          // Use appropriate status check based on model
          let status;
          if (selectedModel === 'music-stable') {
            status = await checkStableAudioStatus(currentTaskId);
          } else if (selectedModel === 'music-fal') {
            status = await checkFALMusicStatus(currentTaskId);
          } else {
            status = await checkGenerationStatus(currentTaskId);
          }
          
          // Update progress based on status
          if (status.status === 'pending') {
            setMusicGenerationProgress(10);
          } else if (status.status === 'processing') {
            setMusicGenerationProgress(prev => Math.min(prev + 2, 90));
          } else if (status.status === 'completed') {
            setMusicGenerationProgress(100);
            setIsGeneratingMusic(false);
            clearInterval(intervalId);
            
            // Add completed generation to history
            if (status.audioUrl) {
              const newGeneration = {
                id: `local_gen_${Date.now()}`,
                taskId: currentTaskId,
                title: musicTitle || 'Untitled Generation',
                model: selectedModel,
                prompt: musicPrompt,
                audioUrl: status.audioUrl,
                createdAt: new Date().toISOString(),
                status: 'completed'
              };
              
              setRecentGenerations(prev => [newGeneration, ...prev]);
              
              // Save to artist profile (PostgreSQL)
              try {
                await saveGeneratedSongToProfile({
                  title: musicTitle || 'Untitled Generation',
                  audioUrl: status.audioUrl,
                  prompt: musicPrompt,
                  genre: selectedGenreTemplate,
                });
                
                toast({
                  title: "Música guardada en tu perfil",
                  description: "La canción generada se agregó a tu perfil de artista",
                });
              } catch (profileError) {
                console.error('Error guardando en perfil:', profileError);
                // No bloqueamos la UI si falla, solo registramos
              }
            }
          } else if (status.status === 'failed') {
            setGenerationError(status.message);
            setIsGeneratingMusic(false);
            setMusicGenerationProgress(0);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Error checking generation status:', error);
          setGenerationError('Error checking generation status');
          setIsGeneratingMusic(false);
          setMusicGenerationProgress(0);
          clearInterval(intervalId);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isGeneratingMusic, currentTaskId, selectedModel]);
  
  // Manage audio playback
  useEffect(() => {
    // Clean up player when unmounting
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    };
  }, []);
  
  /**
   * Load recent music generations
   */
  const loadRecentGenerations = async () => {
    setIsLoadingHistory(true);
    try {
      const generations = await getRecentGenerations();
      setRecentGenerations(generations);
      // If we get here, the auth token was valid
    } catch (error) {
      console.error('Error loading recent generations:', error);
      // If there's a 401 (Unauthorized) error, show appropriate message
      if (error instanceof Error && error.message.includes('401')) {
        toast({
          title: "Sign in to view your history",
          description: "You need to sign in to see your previous music generations.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  /**
   * Handle audio playback
   */
  const handlePlay = (audioUrl: string, id: string) => {
    // If there's already audio playing, stop it
    if (currentAudio) {
      currentAudio.pause();
      if (id === currentPlayingId) {
        setIsPlaying(false);
        setCurrentPlayingId(null);
        return;
      }
    }
    
    // Create new audio player
    const audio = new Audio(audioUrl);
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentPlayingId(null);
    };
    
    audio.onpause = () => {
      setIsPlaying(false);
    };
    
    audio.onplay = () => {
      setIsPlaying(true);
    };
    
    audio.onerror = () => {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      console.error('Error playing audio:', audioUrl);
    };
    
    // Play audio
    audio.play()
      .then(() => {
        setCurrentAudio(audio);
        setIsPlaying(true);
        setCurrentPlayingId(id);
      })
      .catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        setCurrentPlayingId(null);
      });
  };
  
  /**
   * Handle deletion of a generation from history
   */
  const handleDeleteGeneration = (id: string) => {
    // If this generation is playing, stop it
    if (id === currentPlayingId && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
    
    // Remove from list
    setRecentGenerations(prev => prev.filter(gen => gen.id !== id));
  };
  
  /**
   * Handle audio download
   */
  const handleDownload = (audioUrl: string, title: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  /**
   * Start the music generation process
   */
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    
    setGenerationError(null);
    setIsGeneratingMusic(true);
    setMusicGenerationProgress(0);
    
    try {
      let result: { taskId?: string; requestId?: string };
      
      // Use FAL AI Stable Audio 2.5 if model is music-stable
      if (selectedModel === 'music-stable') {
        result = await generateMusicWithStableAudio({
          prompt: musicPrompt,
          duration: 180  // 3 minutos
        });
        setCurrentTaskId(result.requestId || '');
      }
      // Use FAL AI Minimax if model is music-fal
      else if (selectedModel === 'music-fal') {
        result = await generateMusicWithFAL({
          prompt: musicPrompt,
          duration: 30
        });
        setCurrentTaskId(result.requestId || '');
      } else {
        // Use PiAPI (Suno/Udio) for other models
        // Prepare generation data based on mode
        let generationData: any = {
          prompt: musicPrompt,
          title: musicTitle || undefined,
          model: selectedModel,
          makeInstrumental: advancedParams.makeInstrumental,
          negativeTags: advancedParams.negativeTags,
          tags: advancedParams.tags,
          seed: advancedParams.seed,
          tempo: advancedParams.tempo,
          keySignature: advancedParams.keySignature,
        };
        
        // Add mode-specific data
        if (advancedModeType === 'continuation') {
          generationData.continueClipId = advancedParams.continueClipId;
          generationData.continueAt = advancedParams.continueAt;
        } else if (advancedModeType === 'lyrics') {
          generationData.customLyrics = advancedParams.customLyrics;
          generationData.generateLyrics = advancedParams.generateLyrics;
        } else if (advancedModeType === 'upload') {
          generationData.audioUrl = advancedParams.audioUrl;
          generationData.uploadAudio = true;
        }
        
        // Start generation
        result = await generateMusic(generationData);
        setCurrentTaskId(result.taskId || '');
      }
    } catch (error) {
      console.error('Error generating music:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('401')) {
        setGenerationError('You need to sign in to generate music');
        toast({
          title: "Authentication required",
          description: "Sign in to create music with AI.",
          variant: "destructive",
        });
      } else {
        setGenerationError('Error starting music generation');
      }
      
      setIsGeneratingMusic(false);
      setMusicGenerationProgress(0);
    }
  };
  
  /**
   * Apply a genre template to the interface
   */
  const applyMusicTemplate = (templateId: string) => {
    const template = getGenreTemplateById(templateId);
    
    // Only proceed if we have a valid template
    if (!template) {
      console.error(`Template with ID ${templateId} not found`);
      return;
    }
    
    // Apply template parameters
    setAdvancedParams(prev => ({
      ...prev,
      tempo: template.tempo,
      keySignature: template.keySignature,
      structure: { ...template.structure },
      mainInstruments: [...template.mainInstruments],
      musicTemplate: templateId,
    }));
    
    // If prompt is empty or is the default from another template,
    // set the default prompt for this template
    if (!musicPrompt.trim() || 
        musicGenreTemplates.some(t => t.id !== templateId && musicPrompt === t.defaultPrompt)) {
      setMusicPrompt(template.defaultPrompt);
    }
  };
  
  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Features data for feature section
  const featuresData = [
    {
      icon: Wand2,
      title: "Advanced AI Models",
      description: "Create studio-quality music using state-of-the-art AI models",
    },
    {
      icon: Music,
      title: "Genre Templates",
      description: "Quickly start with optimized settings for different music genres",
    },
    {
      icon: Headphones,
      title: "High-Quality Output",
      description: "Generate professional-sounding tracks with vocals and instruments",
    },
  ];
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="relative w-full min-h-[40vh] sm:min-h-[50vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          >
            <source src="/assets/Standard_Mode_Generated_Video (9).mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-background" />
          <div className="relative z-10 container mx-auto h-full flex flex-col justify-center items-center px-4 py-8 sm:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/40 backdrop-blur-sm rounded-lg p-4 sm:p-6 w-full max-w-[95%] sm:max-w-2xl text-center"
            >
              <motion.h1
                className="text-xl sm:text-3xl md:text-5xl font-bold text-primary mb-2 sm:mb-4"
                style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8)' }}
              >
                AI Music Generator
              </motion.h1>
              <motion.p
                transition={{ delay: 0.2 }}
                className="text-xs sm:text-base md:text-lg text-white/90 mb-4 sm:mb-6"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                Create original, high-quality music in seconds with advanced AI technology
              </motion.p>
            </motion.div>
            
            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-8 w-full max-w-[95%] sm:max-w-[90%] mx-auto">
              {featuresData.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-black/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col items-center text-center">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2 sm:mb-3" />
                    <h3 className="text-sm sm:text-base font-semibold text-white mb-1 sm:mb-2">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-white/90">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">4 Modelos de IA Disponibles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Crea Tu Propia Música con IA
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mb-2 px-2 sm:px-4">
              Usa nuestros modelos avanzados de IA para crear música original en cualquier estilo. 
              Desde demos ultra-rápidas hasta canciones completas de calidad profesional.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-primary" />
                <span>Minimax 30s</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-primary" />
                <span>Stable 2.5 3min</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Music className="h-3 w-3 text-primary" />
                <span>Suno + Udio</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto mb-8">
            {/* Video explanation */}
            <div className="lg:col-span-1 rounded-lg overflow-hidden shadow-lg">
              <div className="aspect-video relative overflow-hidden">
                <video 
                  className="w-full h-full object-cover" 
                  controls
                  poster="/assets/music-generator-poster.jpg"
                >
                  <source src="/assets/indications/Welcome to Boostify Music 1.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="p-4 bg-card">
                <h3 className="text-lg font-medium mb-2">How It Works</h3>
                <p className="text-sm text-muted-foreground">
                  Watch this quick tutorial to learn how to create amazing music in just a few clicks using our AI generator.
                </p>
              </div>
            </div>
            
            {/* How it works */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium mb-2">1. Describe Your Idea</h3>
                <p className="text-sm text-muted-foreground">
                  Describe the music you want to create or choose from our genre templates.
                </p>
              </Card>
              
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Wand2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium mb-2">2. Generate</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI creates complete songs with vocals, instruments, and structure in seconds.
                </p>
              </Card>
              
              <Card className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium mb-2">3. Use & Share</h3>
                <p className="text-sm text-muted-foreground">
                  Download your track for personal projects, inspiration, or share with others.
                </p>
              </Card>
            </div>
          </div>
          
          {/* Generator Tabs */}
          <Tabs defaultValue="generator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <MusicIcon className="h-4 w-4" /> Generate Music
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" /> History
              </TabsTrigger>
            </TabsList>
            
            {/* Generation Tab */}
            <TabsContent value="generator" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Generation Panel */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md">
                        <Disc3 className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">
                          Generador de Música IA
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Describe la música que quieres crear o selecciona una plantilla
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Main Generation Component */}
                    <MusicGenerationSection 
                      musicGenreTemplates={musicGenreTemplates}
                      selectedGenreTemplate={selectedGenreTemplate}
                      setSelectedGenreTemplate={setSelectedGenreTemplate}
                      isGeneratingMusic={isGeneratingMusic}
                      musicGenerationProgress={musicGenerationProgress}
                      handleGenerateMusic={handleGenerateMusic}
                      musicPrompt={musicPrompt}
                      setMusicPrompt={setMusicPrompt}
                      musicTitle={musicTitle}
                      setMusicTitle={setMusicTitle}
                      selectedModel={selectedModel}
                      setSelectedModel={setSelectedModel}
                      showAdvancedParams={showAdvancedParams}
                      setShowAdvancedParams={setShowAdvancedParams}
                      advancedModeType={advancedModeType}
                      setAdvancedModeType={setAdvancedModeType}
                      advancedParams={advancedParams}
                      setAdvancedParams={setAdvancedParams}
                      applyMusicTemplate={applyMusicTemplate}
                    />
                  </CardContent>
                </Card>
                
                {/* Errors */}
                {generationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Generation Error</AlertTitle>
                    <AlertDescription>
                      {generationError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="border-2">
                <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <History className="h-5 w-5 text-primary" />
                        </div>
                        Tus Generaciones Recientes
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Escucha y descarga tus creaciones anteriores
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadRecentGenerations}
                      disabled={isLoadingHistory}
                      className="gap-2"
                    >
                      <Loader2 className={`h-3.5 w-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                      Actualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[calc(100vh-28rem)] md:pr-4">
                    {isLoadingHistory ? (
                      // Skeleton loader for history
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recentGenerations.length === 0 ? (
                      // Message when no generations
                      <div className="text-center py-12">
                        <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                          <Music2 className="h-10 w-10 text-primary/50" />
                        </div>
                        <h3 className="font-medium mb-2">
                          No tienes generaciones aún
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Crea tu primera composición en la pestaña Generar
                        </p>
                        <Button variant="outline" onClick={() => {
                          const tabs = document.querySelector('[value="generator"]');
                          if (tabs instanceof HTMLElement) tabs.click();
                        }}>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Ir a Generar
                        </Button>
                      </div>
                    ) : (
                      // List of generations
                      <div className="space-y-3">
                        {recentGenerations.map((generation) => (
                          <Card key={generation.id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-primary/50">
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                      <Music className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold truncate mb-1">
                                        {generation.title}
                                      </h3>
                                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                                        {generation.prompt}
                                      </p>
                                      <div className="flex flex-wrap items-center mt-2 gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {generation.model === 'music-fal' ? '⚡ Minimax' :
                                           generation.model === 'music-stable' ? '🌟 Stable 2.5' :
                                           generation.model === 'music-s' ? '🎵 Suno' : '🎤 Udio'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" /> 
                                          {formatDate(generation.createdAt)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handlePlay(generation.audioUrl, generation.id)}
                                  >
                                    {currentPlayingId === generation.id && isPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleDownload(generation.audioUrl, generation.title)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteGeneration(generation.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {/* Simple audio player */}
                              {generation.audioUrl && (
                                <div className="mt-4">
                                  <audio 
                                    controls 
                                    src={generation.audioUrl} 
                                    className="w-full h-8"
                                  />
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}