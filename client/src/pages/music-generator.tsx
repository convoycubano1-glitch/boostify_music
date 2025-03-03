import { useState, useEffect } from "react";
import { MusicGenreTemplate } from "@/components/music/genre-templates/genre-template-selector";
import { MusicGenerationSection } from "@/components/music/genre-templates/music-generation-section";
import { MusicGenerationAdvancedParams } from "@/components/music/genre-templates/advanced-music-params";
import { musicGenreTemplates, getGenreTemplateById, getDetailedPrompt } from "@/components/music/genre-templates/genre-data";
import { generateMusic, checkGenerationStatus, getRecentGenerations } from "@/lib/api/zuno-ai";
import { useToast } from "@/hooks/use-toast";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
} from "lucide-react";

/**
 * Página principal del generador de música con IA
 * 
 * Esta página permite:
 * - Generar música con diferentes modelos y géneros
 * - Personalizar los parámetros de generación
 * - Ver el historial de generaciones
 * - Reproducir y descargar las generaciones
 */
export default function MusicGeneratorPage() {
  // Hooks y servicios
  const { toast } = useToast();
  
  // Estado para el generador de música
  const [musicPrompt, setMusicPrompt] = useState<string>("");
  const [musicTitle, setMusicTitle] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("music-s");
  const [selectedGenreTemplate, setSelectedGenreTemplate] = useState<string>("pop");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState<boolean>(false);
  const [musicGenerationProgress, setMusicGenerationProgress] = useState<number>(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showAdvancedParams, setShowAdvancedParams] = useState<boolean>(false);
  const [advancedModeType, setAdvancedModeType] = useState<'standard' | 'continuation' | 'lyrics' | 'upload'>('standard');
  
  // Estado para reproductor de audio
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  
  // Estado para historial de generaciones
  const [recentGenerations, setRecentGenerations] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  
  // Estado para parámetros avanzados
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
  
  // Cargar generaciones recientes al montar el componente
  useEffect(() => {
    loadRecentGenerations();
  }, []);
  
  // Verificar estado de generación en progreso
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isGeneratingMusic && currentTaskId) {
      intervalId = setInterval(async () => {
        try {
          const status = await checkGenerationStatus(currentTaskId);
          
          // Actualizar el progreso basado en el estado
          if (status.status === 'pending') {
            setMusicGenerationProgress(10);
          } else if (status.status === 'processing') {
            setMusicGenerationProgress(prev => Math.min(prev + 2, 90));
          } else if (status.status === 'completed') {
            setMusicGenerationProgress(100);
            setIsGeneratingMusic(false);
            clearInterval(intervalId);
            
            // Agregar la generación completada al historial
            if (status.audioUrl) {
              const newGeneration = {
                id: `local_gen_${Date.now()}`,
                taskId: currentTaskId,
                title: musicTitle || 'Generación sin título',
                model: selectedModel,
                prompt: musicPrompt,
                audioUrl: status.audioUrl,
                createdAt: new Date().toISOString(),
                status: 'completed'
              };
              
              setRecentGenerations(prev => [newGeneration, ...prev]);
            }
          } else if (status.status === 'failed') {
            setGenerationError(status.message);
            setIsGeneratingMusic(false);
            setMusicGenerationProgress(0);
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Error checking generation status:', error);
          setGenerationError('Error verificando el estado de la generación');
          setIsGeneratingMusic(false);
          setMusicGenerationProgress(0);
          clearInterval(intervalId);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isGeneratingMusic, currentTaskId]);
  
  // Gestionar reproducción de audio
  useEffect(() => {
    // Limpiar reproductor al desmontar
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    };
  }, []);
  
  /**
   * Carga las generaciones de música recientes
   */
  const loadRecentGenerations = async () => {
    setIsLoadingHistory(true);
    try {
      const generations = await getRecentGenerations();
      setRecentGenerations(generations);
      // Si llegamos hasta aquí, el token de autenticación fue válido
    } catch (error) {
      console.error('Error cargando generaciones recientes:', error);
      // Si hay un error 401 (Unauthorized), podemos mostrar un mensaje adecuado
      if (error instanceof Error && error.message.includes('401')) {
        toast({
          title: "Inicia sesión para ver tu historial",
          description: "Necesitas iniciar sesión para ver tus generaciones de música anteriores.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  /**
   * Maneja la reproducción de audio
   */
  const handlePlay = (audioUrl: string, id: string) => {
    // Si ya hay audio reproduciéndose, detenerlo
    if (currentAudio) {
      currentAudio.pause();
      if (id === currentPlayingId) {
        setIsPlaying(false);
        setCurrentPlayingId(null);
        return;
      }
    }
    
    // Crear nuevo reproductor de audio
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
      console.error('Error reproduciendo audio:', audioUrl);
    };
    
    // Reproducir audio
    audio.play()
      .then(() => {
        setCurrentAudio(audio);
        setIsPlaying(true);
        setCurrentPlayingId(id);
      })
      .catch(error => {
        console.error('Error reproduciendo audio:', error);
        setIsPlaying(false);
        setCurrentPlayingId(null);
      });
  };
  
  /**
   * Maneja la eliminación de una generación del historial
   */
  const handleDeleteGeneration = (id: string) => {
    // Si se está reproduciendo esta generación, detener
    if (id === currentPlayingId && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
    
    // Eliminar de la lista
    setRecentGenerations(prev => prev.filter(gen => gen.id !== id));
  };
  
  /**
   * Maneja la descarga de audio
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
   * Inicia el proceso de generación de música
   */
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    
    setGenerationError(null);
    setIsGeneratingMusic(true);
    setMusicGenerationProgress(0);
    
    try {
      // Preparar los datos de generación según el modo
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
      
      // Agregar datos específicos según el modo
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
      
      // Iniciar la generación
      const result = await generateMusic(generationData);
      
      setCurrentTaskId(result.taskId);
    } catch (error) {
      console.error('Error generando música:', error);
      
      // Comprobamos si es un error de autenticación
      if (error instanceof Error && error.message.includes('401')) {
        setGenerationError('Necesitas iniciar sesión para generar música');
        toast({
          title: "Autenticación requerida",
          description: "Inicia sesión para poder crear música con IA.",
          variant: "destructive",
        });
      } else {
        setGenerationError('Error iniciando la generación de música');
      }
      
      setIsGeneratingMusic(false);
      setMusicGenerationProgress(0);
    }
  };
  
  /**
   * Aplica una plantilla de género a la interfaz
   */
  const applyMusicTemplate = (templateId: string) => {
    const template = getGenreTemplateById(templateId);
    
    // Aplicar parámetros de plantilla
    setAdvancedParams(prev => ({
      ...prev,
      tempo: template.tempo,
      keySignature: template.keySignature,
      structure: { ...template.structure },
      mainInstruments: [...template.mainInstruments],
      musicTemplate: templateId,
    }));
    
    // Si el prompt está vacío o es el predeterminado de otra plantilla,
    // establecer el prompt predeterminado de esta plantilla
    if (!musicPrompt.trim() || 
        musicGenreTemplates.some(t => t.id !== templateId && musicPrompt === t.defaultPrompt)) {
      setMusicPrompt(template.defaultPrompt);
    }
  };
  
  /**
   * Formatea la fecha para mostrar
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold flex items-center">
          <Music2 className="h-8 w-8 mr-2" />
          Generador de Música AI
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Crea música original con IA avanzada. Usa plantillas por género o personaliza tu generación con parámetros específicos.
          La música generada puede utilizarse para proyectos personales, demos o inspiración.
        </p>
      </div>
      
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <MusicIcon className="h-4 w-4" /> Generar Música
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" /> Historial
          </TabsTrigger>
        </TabsList>
        
        {/* Tab de generación */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Panel de generación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Disc3 className="h-5 w-5 mr-2" />
                  Generación de Música
                </CardTitle>
                <CardDescription>
                  Describe la música que deseas generar o selecciona una plantilla de género
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Componente principal de generación */}
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
            
            {/* Errores */}
            {generationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de generación</AlertTitle>
                <AlertDescription>
                  {generationError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
        
        {/* Tab de historial */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Generaciones Recientes
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadRecentGenerations}
                  disabled={isLoadingHistory}
                >
                  {isLoadingHistory ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Music className="h-4 w-4 mr-2" />
                      Actualizar
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Historial de tus generaciones de música
              </CardDescription>
              <Separator className="mt-2" />
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {isLoadingHistory ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-60" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentGenerations.length === 0 ? (
                  <div className="p-6 text-center">
                    <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No tienes generaciones de música todavía.
                      <br />
                      Genera tu primera pieza musical para empezar.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentGenerations.map((gen) => (
                      <div key={gen.id} className="p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex justify-between mb-2">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <Music className="h-5 w-5" />
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{gen.title}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{gen.createdAt ? formatDate(gen.createdAt) : 'Desconocido'}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {gen.model === 'music-s' ? 'Suno' : 'Udio'}
                                </Badge>
                                {gen.status === 'completed' ? (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                    Completada
                                  </Badge>
                                ) : gen.status === 'failed' ? (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    <XCircle className="h-2.5 w-2.5 mr-1" />
                                    Fallida
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                                    Procesando
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {gen.status === 'completed' && gen.audioUrl && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handlePlay(gen.audioUrl, gen.id)}
                                >
                                  {isPlaying && currentPlayingId === gen.id ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDownload(gen.audioUrl, gen.title)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteGeneration(gen.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {gen.prompt && (
                          <p className="text-sm text-muted-foreground ml-13 mt-1">
                            {gen.prompt.length > 100 ? `${gen.prompt.slice(0, 100)}...` : gen.prompt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}