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
  
  // Configuración específica de Udio (a través de PiAPI)
  const [udioLyricsType, setUdioLyricsType] = useState<LyricsType>("generate");
  const [udioLyrics, setUdioLyrics] = useState("");
  const [udioSeed, setUdioSeed] = useState(-1);
  
  // Configuración específica de Suno (a través de PiAPI)
  const [sunoTitle, setSunoTitle] = useState("");
  const [sunoTags, setSunoTags] = useState("");
  const [sunoIsInstrumental, setSunoIsInstrumental] = useState(false);
  
  // Estado para la continuación de canciones
  const [continueMode, setContinueMode] = useState(false);
  const [continueClipId, setContinueClipId] = useState("");
  const [continueAt, setContinueAt] = useState(0);
  
  const { toast } = useToast();

  // Función para gestionar la generación de música usando PiAPI
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
        // Generar con Udio a través de PiAPI
        console.log('💫 Iniciando generación con PiAPI (modelo Udio)');
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
        // Generar con Suno a través de PiAPI
        console.log('💫 Iniciando generación con PiAPI (modelo Suno)');
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
            <Label>Modelo de IA (vía PiAPI)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  currentModel === "music-u" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
                }`}
                onClick={() => setCurrentModel("music-u")}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full mr-2 ${
                    currentModel === "music-u" ? "bg-primary" : "bg-muted"
                  }`}></div>
                  <h3 className="font-medium">Modelo Udio</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Optimizado para instrumentos musicales reales y voces naturales.
                </p>
                <div className="absolute top-1 right-1 bg-blue-100 text-blue-800 text-xs px-1 rounded">
                  PiAPI
                </div>
              </div>
              
              <div 
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  currentModel === "music-s" 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50"
                }`}
                onClick={() => setCurrentModel("music-s")}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full mr-2 ${
                    currentModel === "music-s" ? "bg-primary" : "bg-muted"
                  }`}></div>
                  <h3 className="font-medium">Modelo Suno</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Excelente para música comercial y estilo de producción profesional.
                </p>
                <div className="absolute top-1 right-1 bg-blue-100 text-blue-800 text-xs px-1 rounded">
                  PiAPI
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Descripción de la música</Label>
              <span className="text-xs text-muted-foreground">
                {description.length}/500 caracteres
              </span>
            </div>
            <Textarea
              placeholder={currentModel === "music-u" ? 
                "Ej: Una balada pop con piano y voz femenina, inspirada en Adele, con un ritmo lento y letras emotivas sobre un amor perdido..." :
                "Ej: Una canción de rock alternativo con guitarra eléctrica distorsionada, batería energética y voz masculina con influencia de bandas como Foo Fighters..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Incluye detalles sobre: género musical, instrumentos, ritmo, tipo de voz, estado de ánimo, tema lírico y artistas de referencia.
            </p>
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
                Generar Música con PiAPI ({currentModel === "music-u" ? "Udio" : "Suno"})
              </>
            )}
          </Button>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-6">
          {taskId ? (
            <div className="space-y-6">
              <div className="p-4 rounded-md bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">Modelo: {currentModel === "music-u" ? "PiAPI - Udio" : "PiAPI - Suno"}</p>
                  <span 
                    className={`px-2 py-1 text-xs rounded-full ${
                      taskStatus === 'completed' 
                        ? 'bg-green-500/20 text-green-600' 
                        : taskStatus === 'failed' 
                          ? 'bg-red-500/20 text-red-600' 
                          : 'bg-amber-500/20 text-amber-600'
                    }`}
                  >
                    {taskStatus === 'completed' 
                      ? 'Completado' 
                      : taskStatus === 'failed' 
                        ? 'Error' 
                        : 'Procesando...'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">ID de tarea: {taskId}</p>
              </div>
              
              {taskStatus === 'pending' || taskStatus === 'processing' ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Generando tu música...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Este proceso puede tardar hasta 2 minutos dependiendo del modelo seleccionado.
                  </p>
                </div>
              ) : taskStatus === 'failed' ? (
                <div className="p-4 rounded-md bg-red-500/10 border border-red-200 text-center">
                  <p className="text-red-600 font-medium">Error en la generación</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Ha ocurrido un error al generar la música. Por favor, intenta con una descripción diferente.
                  </p>
                </div>
              ) : audioUrl ? (
                <div className="space-y-4">
                  <div className="bg-card border rounded-md overflow-hidden">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-medium">Música generada</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentModel === "music-u" 
                          ? "Generada con modelo Udio mediante PiAPI, optimizada para instrumentos musicales reales" 
                          : "Generada con modelo Suno mediante PiAPI, optimizada para producción musical profesional"}
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Button onClick={togglePlayback} variant={isPlaying ? "default" : "outline"} size="sm">
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
                        <Button onClick={handleDownload} variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Descargar MP3
                        </Button>
                      </div>
                      <audio 
                        controls 
                        src={audioUrl} 
                        className="w-full" 
                        style={{ 
                          borderRadius: '0.5rem',
                          backgroundColor: 'rgba(var(--muted), 0.2)',
                        }} 
                      />
                    </div>
                  </div>
                  
                  {description && (
                    <div className="bg-card border rounded-md p-4">
                      <h4 className="font-medium mb-2">Descripción utilizada</h4>
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-center mt-6">
                    <Button 
                      onClick={handleGenerate} 
                      variant="outline"
                      className="w-full max-w-xs"
                    >
                      <Music className="mr-2 h-4 w-4" />
                      Generar otra canción
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="h-16 w-16 text-muted mb-4" />
              <p className="text-lg text-muted-foreground mb-1">Aún no has generado ninguna música</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Selecciona un modelo de IA, escribe una descripción de la música que deseas 
                y presiona el botón "Generar Música".
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
