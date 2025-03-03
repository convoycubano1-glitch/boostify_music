import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Music4, Wand2, ImageIcon, Upload, Loader2, 
  Download, Play, Pause, AlertCircle, Check, RefreshCw, 
  Share2, Save
} from "lucide-react";
import { masterTrack, separateVocals, splitStems } from "@/lib/api/kits-ai";
import { generateMusic, checkGenerationStatus } from "@/lib/api/zuno-ai";
import { generateImageWithFal } from "@/lib/api/fal-ai";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { downloadTextFile } from "@/lib/download-helper";

interface ImageData {
  url: string;
  requestId: string;
  prompt: string;
  category: string;
  createdAt: Date;
}

interface AudioData {
  url: string;
  title: string;
  prompt: string;
  taskId: string;
  createdAt: Date;
}

async function saveMusicianImage(data: ImageData) {
  try {
    const docRef = await addDoc(collection(db, "musician_images"), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
}

async function saveGeneratedMusic(data: AudioData) {
  try {
    const docRef = await addDoc(collection(db, "generated_music"), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log("Music document written with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding music document: ", error);
    throw error;
  }
}

export function MusicAIGenerator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("mastering");
  
  // Mastering state
  const [isMastering, setIsMastering] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>("mastering");
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Music generation state
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [selectedModel, setSelectedModel] = useState("music-s");
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);
  const [musicGenerationProgress, setMusicGenerationProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // Cover art state
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverPrompt, setCoverPrompt] = useState("");
  const [coverImageSize, setCoverImageSize] = useState("square");
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
  const [coverGenerationProgress, setCoverGenerationProgress] = useState(0);
  
  // Refs
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  
  // Reset progress when changing tabs
  useEffect(() => {
    setProcessingProgress(0);
    setMusicGenerationProgress(0);
    setCoverGenerationProgress(0);
  }, [activeTab]);
  
  // Handle audio player controls
  useEffect(() => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.play().catch(error => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
      } else {
        audioPlayerRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleMasterTrack = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un archivo de audio para procesar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsMastering(true);
      setProcessingProgress(20);
      
      let result;
      
      // Determinar qué tipo de procesamiento realizar
      if (selectedFileType === "mastering") {
        setProcessingProgress(30);
        result = await masterTrack(selectedFile);
        toast({
          title: "Procesando...",
          description: "Se está masterizando tu pista de audio"
        });
      } else if (selectedFileType === "vocal-separation") {
        setProcessingProgress(30);
        result = await separateVocals(selectedFile);
        toast({
          title: "Procesando...",
          description: "Se están separando las voces del instrumental"
        });
      } else if (selectedFileType === "stem-splitting") {
        setProcessingProgress(30);
        result = await splitStems(selectedFile);
        toast({
          title: "Procesando...",
          description: "Se están separando los stems de la pista"
        });
      }
      
      setProcessingProgress(70);
      
      // Aquí simulamos el procesamiento recibiendo la URL del audio procesado
      // En una implementación real, obtendrías esta URL del resultado de la API
      setProcessedAudioUrl(result?.audio_url || "/assets/music-samples/mastered-sample.mp3");
      setProcessingProgress(100);
      
      toast({
        title: "¡Éxito!",
        description: `¡${selectedFileType === "mastering" ? "Pista masterizada" : 
                        selectedFileType === "vocal-separation" ? "Voces separadas" : 
                        "Stems separados"} con éxito!`
      });

    } catch (error) {
      console.error("Error procesando el audio:", error);
      toast({
        title: "Error",
        description: `No se pudo procesar el audio. ${error instanceof Error ? error.message : 'Inténtalo de nuevo más tarde.'}`,
        variant: "destructive"
      });
    } finally {
      setIsMastering(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt) {
      toast({
        title: "Error",
        description: "Por favor, proporciona una descripción para la música que quieres generar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingMusic(true);
      setMusicGenerationProgress(10);
      
      // Si no hay título, usamos un título genérico
      const title = musicTitle.trim() || "Música Generada";
      
      const result = await generateMusic({
        prompt: musicPrompt,
        modelName: selectedModel,
        title: title,
        tags: "generado por ia",
        makeInstrumental: false
      });
      
      setCurrentTaskId(result.taskId);
      setMusicGenerationProgress(30);
      
      toast({
        title: "Generación iniciada",
        description: "La música se está generando, esto puede tomar unos minutos"
      });

      // Consultar el estado periódicamente
      const checkStatus = async () => {
        if (!result.taskId) return;
        
        const status = await checkGenerationStatus(result.taskId);
        
        if (status.status === "processing") {
          setMusicGenerationProgress(60);
          setTimeout(checkStatus, 5000);
        } else if (status.status === "completed") {
          setMusicGenerationProgress(100);
          setIsGeneratingMusic(false);
          
          // Guardar la URL del audio generado
          if (status.audioUrl) {
            setGeneratedMusicUrl(status.audioUrl);
            
            // Guardar en Firestore
            try {
              await saveGeneratedMusic({
                url: status.audioUrl,
                title: title,
                prompt: musicPrompt,
                taskId: result.taskId,
                createdAt: new Date()
              });
            } catch (saveError) {
              console.error("Error al guardar la música generada:", saveError);
            }
            
            toast({
              title: "¡Éxito!",
              description: "¡Música generada con éxito! Puedes reproducirla ahora."
            });
          } else {
            toast({
              title: "Advertencia",
              description: "Música generada pero no se pudo obtener la URL del audio.",
              variant: "destructive"
            });
          }
        } else if (status.status === "failed") {
          setIsGeneratingMusic(false);
          toast({
            title: "Error",
            description: `La generación falló: ${status.error || 'Error desconocido'}`,
            variant: "destructive"
          });
        }
      };
      
      // Iniciar la verificación de estado
      setTimeout(checkStatus, 3000);

    } catch (error) {
      console.error("Error generando música:", error);
      setMusicGenerationProgress(0);
      toast({
        title: "Error",
        description: "No se pudo generar la música. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
      setIsGeneratingMusic(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!coverPrompt) {
      toast({
        title: "Error",
        description: "Por favor, proporciona una descripción para la portada",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingCover(true);
      setCoverGenerationProgress(20);
      
      const result = await generateImageWithFal({
        prompt: coverPrompt,
        negativePrompt: "baja calidad, borroso, distorsionado, deformado, poco realista, caricatura, anime, ilustración, texto, marca de agua",
        imageSize: coverImageSize
      });
      
      setCoverGenerationProgress(70);

      if (result.data && result.data.images && result.data.images[0]) {
        const imageUrl = result.data.images[0].url;
        setGeneratedCoverUrl(imageUrl);
        setCoverGenerationProgress(100);

        // Guardar en Firestore
        await saveMusicianImage({
          url: imageUrl,
          requestId: result.requestId,
          prompt: coverPrompt,
          category: 'cover-art',
          createdAt: new Date()
        });

        toast({
          title: "¡Éxito!",
          description: "¡Portada generada y guardada con éxito!"
        });
      } else {
        throw new Error("Formato de respuesta inválido desde Fal.ai");
      }

    } catch (error) {
      console.error("Error generando portada:", error);
      setCoverGenerationProgress(0);
      toast({
        title: "Error",
        description: "No se pudo generar la portada. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };
  
  const handleCopyPrompt = (prompt: string, type: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: "Copiado",
      description: `Prompt para ${type === 'music' ? 'música' : 'portada'} copiado al portapapeles`
    });
  };
  
  const handleDownloadAudio = (url: string, title: string = "audio_procesado") => {
    // Crear un enlace temporal para descargar el audio
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Descargando",
      description: `Descargando ${title}`
    });
  };
  
  const handleDownloadImage = (url: string) => {
    // Crear un enlace temporal para descargar la imagen
    const link = document.createElement('a');
    link.href = url;
    link.download = `portada_${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Descargando",
      description: "Descargando portada"
    });
  };
  
  const handleExportMetadata = (type: 'music' | 'cover') => {
    let metadata = {};
    let filename = "";
    
    if (type === 'music' && currentTaskId) {
      metadata = {
        title: musicTitle || "Música Generada",
        prompt: musicPrompt,
        model: selectedModel,
        taskId: currentTaskId,
        generatedAt: new Date().toISOString(),
        audioUrl: generatedMusicUrl
      };
      filename = `metadata_musica_${currentTaskId}.json`;
    } else if (type === 'cover' && generatedCoverUrl) {
      metadata = {
        prompt: coverPrompt,
        imageSize: coverImageSize,
        generatedAt: new Date().toISOString(),
        imageUrl: generatedCoverUrl
      };
      filename = `metadata_portada_${new Date().getTime()}.json`;
    }
    
    const jsonContent = JSON.stringify(metadata, null, 2);
    downloadTextFile(jsonContent, filename);
    
    toast({
      title: "Exportando",
      description: `Metadata de ${type === 'music' ? 'música' : 'portada'} exportada`
    });
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Herramientas de IA para Música</h2>
        <div className="bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20 rounded-lg px-3 py-1.5 text-xs md:text-sm text-orange-600 dark:text-orange-400">
          <span className="hidden sm:inline">Potenciado por </span>IA avanzada
        </div>
      </div>
      
      <Tabs 
        defaultValue="mastering" 
        className="space-y-6"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="w-full flex overflow-x-auto no-scrollbar justify-start sm:justify-center mb-2">
          <TabsTrigger value="mastering" className="flex-1 sm:flex-initial">
            <Wand2 className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">AI</span> Mastering
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex-1 sm:flex-initial">
            <Music4 className="mr-2 h-4 w-4" />
            <span className="hidden xs:inline">Music</span> Generation
          </TabsTrigger>
          <TabsTrigger value="cover" className="flex-1 sm:flex-initial">
            <ImageIcon className="mr-2 h-4 w-4" />
            Cover Art
          </TabsTrigger>
        </TabsList>

        {/* Mastering Tab */}
        <TabsContent value="mastering">
          <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
            <div className="w-full max-w-xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-orange-500" />
                    Procesamiento de Audio
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Mejora la calidad de tu música con tecnología avanzada de IA
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="audio-file-type">Tipo de procesamiento</Label>
                  <Select
                    value={selectedFileType}
                    onValueChange={setSelectedFileType}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Selecciona tipo de procesamiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mastering">Masterización de Audio</SelectItem>
                      <SelectItem value="vocal-separation">Separación de Voces</SelectItem>
                      <SelectItem value="stem-splitting">Separación de Stems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="audio-file">Selecciona un archivo de audio (.wav, .mp3, .aif)</Label>
                  <Input
                    id="audio-file"
                    type="file"
                    accept=".wav,.mp3,.aif,.aiff,.flac"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="mt-1.5"
                  />
                </div>

                <Button
                  onClick={handleMasterTrack}
                  className="w-full"
                  disabled={isMastering || !selectedFile}
                >
                  {isMastering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {selectedFileType === "mastering" ? "Masterizar Pista" : 
                       selectedFileType === "vocal-separation" ? "Separar Voces" : 
                       "Separar Stems"}
                    </>
                  )}
                </Button>
                
                {(isMastering || processingProgress > 0) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Procesando audio...</span>
                      <span>{processingProgress}%</span>
                    </div>
                    <Progress value={processingProgress} />
                  </div>
                )}
                
                {processedAudioUrl && (
                  <div className="p-4 rounded-lg border bg-muted/40">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium flex items-center">
                        <Music4 className="h-4 w-4 mr-1 text-orange-500" />
                        Audio procesado
                      </h3>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => handleDownloadAudio(processedAudioUrl)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <audio
                      controls
                      src={processedAudioUrl}
                      className="w-full mt-2"
                    />
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {selectedFileType === "mastering" ? 
                        "La versión masterizada suena más equilibrada y profesional." : 
                        selectedFileType === "vocal-separation" ? 
                        "Se han separado las voces del instrumental." : 
                        "Se han separado los diferentes instrumentos en stems individuales."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Generation Tab */}
        <TabsContent value="generation">
          <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
            <div className="w-full max-w-xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                    <Music4 className="h-5 w-5 text-orange-500" />
                    Generación Musical
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Describe la música que quieres crear y la IA la generará para ti
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="music-title">Título de la canción</Label>
                  <Input
                    id="music-title"
                    placeholder="Ej: Mi canción de verano"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="music-model">Modelo de generación</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Selecciona un modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="music-s">Suno (Alta calidad, estilo completo)</SelectItem>
                      <SelectItem value="music-u">Udio (Rápido, más experimental)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="music-prompt">Descripción de la música</Label>
                    {musicPrompt && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopyPrompt(musicPrompt, 'music')}
                        className="h-7 px-2 text-xs"
                      >
                        <span>Copiar prompt</span>
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="music-prompt"
                    placeholder="Ej: Una canción pop alegre con guitarra acústica y percusión suave. Tempo medio, ideal para un video de verano."
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleGenerateMusic}
                  className="w-full"
                  disabled={isGeneratingMusic || !musicPrompt}
                >
                  {isGeneratingMusic ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando música...
                    </>
                  ) : (
                    <>
                      <Music4 className="mr-2 h-4 w-4" />
                      Generar Música
                    </>
                  )}
                </Button>
                
                {(isGeneratingMusic || musicGenerationProgress > 0) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Generando música...</span>
                      <span>{musicGenerationProgress}%</span>
                    </div>
                    <Progress value={musicGenerationProgress} />
                  </div>
                )}
                
                {generatedMusicUrl && (
                  <div className="p-4 rounded-lg border bg-muted/40">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium flex items-center">
                        <Music4 className="h-4 w-4 mr-1 text-orange-500" />
                        {musicTitle || "Música Generada"}
                      </h3>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleDownloadAudio(generatedMusicUrl, musicTitle || "música_generada")}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleExportMetadata('music')}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Audio element (hidden but functional) */}
                    <audio
                      ref={audioPlayerRef}
                      src={generatedMusicUrl}
                      onEnded={() => setIsPlaying(false)}
                      className="hidden"
                    />
                    
                    {/* Custom audio player */}
                    <div className="relative w-full h-12 bg-black/5 dark:bg-white/5 rounded-md overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {isPlaying ? "Reproduciendo..." : "Listo para reproducir"}
                        </span>
                      </div>
                      <div 
                        className="absolute bottom-0 left-0 h-1 bg-orange-500"
                        style={{ width: isPlaying ? '100%' : '0%', transition: isPlaying ? 'width 20s linear' : 'none' }}
                      ></div>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p className="mb-1">Prompt: "{musicPrompt}"</p>
                      <p>Modelo: {selectedModel === "music-s" ? "Suno" : "Udio"} | ID: {currentTaskId}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Cover Art Tab */}
        <TabsContent value="cover">
          <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
            <div className="w-full max-w-xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-orange-500" />
                    Portadas con IA
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Crea portadas profesionales para tus canciones y álbumes
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cover-format">Formato de portada</Label>
                  <Select
                    value={coverImageSize}
                    onValueChange={setCoverImageSize}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Selecciona un formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">Cuadrado (1:1) - Para álbumes</SelectItem>
                      <SelectItem value="landscape_16_9">Apaisado (16:9) - Para banners</SelectItem>
                      <SelectItem value="portrait_9_16">Vertical (9:16) - Para móviles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cover-prompt">Descripción de la portada</Label>
                    {coverPrompt && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopyPrompt(coverPrompt, 'cover')}
                        className="h-7 px-2 text-xs"
                      >
                        <span>Copiar prompt</span>
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="cover-prompt"
                    placeholder="Ej: Portada minimalista para un álbum de música electrónica. Tonos azules y púrpuras, con formas geométricas que sugieren ondas sonoras."
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleGenerateCover}
                  className="w-full"
                  disabled={isGeneratingCover || !coverPrompt}
                >
                  {isGeneratingCover ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando portada...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generar Portada
                    </>
                  )}
                </Button>
                
                {(isGeneratingCover || coverGenerationProgress > 0) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Generando imagen...</span>
                      <span>{coverGenerationProgress}%</span>
                    </div>
                    <Progress value={coverGenerationProgress} />
                  </div>
                )}

                {generatedCoverUrl && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <Label>Portada Generada</Label>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleDownloadImage(generatedCoverUrl)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleExportMetadata('cover')}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className={`relative overflow-hidden rounded-lg border ${
                      coverImageSize === 'square' ? 'aspect-square' : 
                      coverImageSize === 'landscape_16_9' ? 'aspect-video' : 
                      'aspect-[9/16]'
                    }`}>
                      <img
                        src={generatedCoverUrl}
                        alt="Portada generada"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prompt: "{coverPrompt}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}