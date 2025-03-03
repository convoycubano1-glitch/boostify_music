import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Music, Play, Pause, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  generateMusicWithUdio, 
  generateMusicWithSuno, 
  checkMusicGenerationStatus,
  type MusicModel,
  type LyricsType
} from "@/lib/api/piapi-music";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function MusicAIGenerator() {
  // Estado para configuración general
  const [description, setDescription] = useState("");
  const [currentModel, setCurrentModel] = useState<MusicModel>("music-u");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estado para la gestión de tareas
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  
  // Estado para el audio generado
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Configuración específica de Udio
  const [udioLyricsType, setUdioLyricsType] = useState<LyricsType>("generate");
  const [udioLyrics, setUdioLyrics] = useState("");
  const [udioSeed, setUdioSeed] = useState(-1);
  
  // Configuración específica de Suno
  const [sunoTitle, setSunoTitle] = useState("");
  const [sunoTags, setSunoTags] = useState("");
  const [sunoIsInstrumental, setSunoIsInstrumental] = useState(false);
  
  // Estado para la continuación de canciones
  const [continueMode, setContinueMode] = useState(false);
  const [continueClipId, setContinueClipId] = useState("");
  const [continueAt, setContinueAt] = useState(0);
  
  const { toast } = useToast();

  // Función para gestionar la generación de música
  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Por favor, proporciona una descripción para tu música",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      setTaskId(null);
      setTaskStatus(null);
      setAudioUrl(null);
      
      let result;
      
      if (currentModel === "music-u") {
        // Generar con Udio
        result = await generateMusicWithUdio({
          model: "music-u",
          description,
          lyricsType: udioLyricsType,
          lyrics: udioLyricsType === "user" ? udioLyrics : undefined,
          seed: udioSeed,
          continueClipId: continueMode ? continueClipId : undefined,
          continueAt: continueMode ? continueAt : undefined
        });
      } else {
        // Generar con Suno
        result = await generateMusicWithSuno({
          model: "music-s",
          description,
          title: sunoTitle,
          tags: sunoTags,
          makeInstrumental: sunoIsInstrumental,
          continueClipId: continueMode ? continueClipId : undefined,
          continueAt: continueMode ? continueAt : undefined
        });
      }
      
      setTaskId(result.taskId);
      setTaskStatus("pending");
      
      toast({
        title: "Generación iniciada",
        description: `Tu música se está generando utilizando ${currentModel === "music-u" ? "Udio" : "Suno"}`,
      });

    } catch (error) {
      console.error("Error generating music:", error);
      toast({
        title: "Error",
        description: "No se pudo generar la música. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Verificar estado de la tarea periódicamente
  useEffect(() => {
    let intervalId: number;
    
    if (taskId && (taskStatus === "pending" || taskStatus === "processing")) {
      intervalId = window.setInterval(async () => {
        try {
          const status = await checkMusicGenerationStatus(taskId);
          setTaskStatus(status.status);
          
          if (status.status === "completed" && status.audioUrl) {
            setAudioUrl(status.audioUrl);
            clearInterval(intervalId);
            
            toast({
              title: "¡Música generada!",
              description: "Tu música ha sido generada exitosamente"
            });
          } else if (status.status === "failed") {
            clearInterval(intervalId);
            
            toast({
              title: "Error",
              description: status.error || "Error al generar la música",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Error checking music generation status:", error);
        }
      }, 3000); // Verificar cada 3 segundos
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [taskId, taskStatus, toast]);
  
  // Inicializar o actualizar el elemento de audio cuando cambia la URL
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
      
      return () => {
        audio.pause();
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [audioUrl]);
  
  // Gestionar reproducción de audio
  const togglePlayback = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Descargar la música generada
  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `music-${currentModel}-${new Date().getTime()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">Generador de Música con IA</h2>
      
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="generator">Generador</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generator" className="space-y-6">
          <div className="space-y-3">
            <Label>Modelo de IA</Label>
            <Select 
              value={currentModel}
              onValueChange={(value) => setCurrentModel(value as MusicModel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="music-u">Udio - AI Music Generation</SelectItem>
                <SelectItem value="music-s">Suno - AI Music Generation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label>Descripción de la música</Label>
            <Textarea
              placeholder="Describe la música que quieres generar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {/* Configuración específica de Udio */}
            {currentModel === "music-u" && (
              <AccordionItem value="udio-options">
                <AccordionTrigger>Opciones de Udio</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Tipo de letra</Label>
                    <Select 
                      value={udioLyricsType}
                      onValueChange={(value) => setUdioLyricsType(value as LyricsType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de letra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generate">Generar automáticamente</SelectItem>
                        <SelectItem value="user">Usar letra personalizada</SelectItem>
                        <SelectItem value="instrumental">Instrumental (sin letra)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {udioLyricsType === "user" && (
                    <div className="space-y-3">
                      <Label>Letra personalizada</Label>
                      <Textarea
                        placeholder="Ingresa tu letra personalizada..."
                        value={udioLyrics}
                        onChange={(e) => setUdioLyrics(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Label>Semilla (opcional)</Label>
                    <Input 
                      type="number" 
                      value={udioSeed === -1 ? "" : udioSeed} 
                      onChange={(e) => setUdioSeed(e.target.value ? parseInt(e.target.value) : -1)}
                      placeholder="Dejar en blanco para aleatorio"
                    />
                    <p className="text-xs text-muted-foreground">
                      Una semilla permite obtener resultados consistentes. Deja en blanco para resultados aleatorios.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* Configuración específica de Suno */}
            {currentModel === "music-s" && (
              <AccordionItem value="suno-options">
                <AccordionTrigger>Opciones de Suno</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Título (opcional)</Label>
                    <Input 
                      value={sunoTitle} 
                      onChange={(e) => setSunoTitle(e.target.value)}
                      placeholder="Título de la canción"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Etiquetas (opcional)</Label>
                    <Input 
                      value={sunoTags} 
                      onChange={(e) => setSunoTags(e.target.value)}
                      placeholder="rock, piano, jazz, etc. (separadas por comas)"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={sunoIsInstrumental}
                      onCheckedChange={setSunoIsInstrumental}
                    />
                    <Label>Generar instrumental (sin letra)</Label>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {/* Modo de continuación para ambos modelos */}
            <AccordionItem value="continue-options">
              <AccordionTrigger>Continuar canción existente</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={continueMode}
                    onCheckedChange={setContinueMode}
                  />
                  <Label>Continuar a partir de un clip existente</Label>
                </div>
                
                {continueMode && (
                  <>
                    <div className="space-y-3">
                      <Label>ID del clip a continuar</Label>
                      <Input 
                        value={continueClipId} 
                        onChange={(e) => setContinueClipId(e.target.value)}
                        placeholder="Ej: 1307fd94-adbc-4787-b8e3-2e89f84ef22b"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Continuar desde (segundos)</Label>
                      <Input 
                        type="number" 
                        value={continueAt}
                        onChange={(e) => setContinueAt(parseInt(e.target.value) || 0)}
                        placeholder="0 para reiniciar desde el principio"
                      />
                      <p className="text-xs text-muted-foreground">
                        Utiliza 0 para reiniciar desde el principio o especifica los segundos exactos.
                      </p>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || (taskStatus === "pending" || taskStatus === "processing")}
            className="w-full"
          >
            {isGenerating || (taskStatus === "pending" || taskStatus === "processing") ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isGenerating ? "Iniciando generación..." : "Generando música..."}
              </>
            ) : (
              <>
                <Music className="mr-2 h-4 w-4" />
                Generar Música con {currentModel === "music-u" ? "Udio" : "Suno"}
              </>
            )}
          </Button>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          {taskId ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-muted">
                <p className="font-medium">ID de tarea: {taskId}</p>
                <p>Estado: {taskStatus || "Desconocido"}</p>
              </div>
              
              {audioUrl && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Música generada</h3>
                  <div className="flex gap-2">
                    <Button onClick={togglePlayback} variant="outline">
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Reproducir
                        </>
                      )}
                    </Button>
                    <Button onClick={handleDownload} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                  <audio controls src={audioUrl} className="w-full" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-muted-foreground">Aún no has generado ninguna música.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
