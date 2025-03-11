import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Button, 
  buttonVariants
} from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Music, 
  Video, 
  Image as ImageIcon, 
  Upload, 
  Wand2, 
  Film, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Pause, 
  ChevronRight, 
  Save, 
  Clapperboard, 
  Scissors,
  Loader2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VideoGenerator, VideoGenerationSettings } from './video-generator';
import { TimelineClip } from './timeline-editor';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface MusicVideoWorkflowProps {
  onComplete?: (result: {
    videoUrl?: string;
    clips?: TimelineClip[];
    duration?: number;
  }) => void;
}

/**
 * Componente de flujo de trabajo para creación de videos musicales
 * 
 * Este componente implementa un flujo completo para:
 * 1. Subir audio (canción)
 * 2. Subir imágenes/videos (clips principales)
 * 3. Subir B-roll (opcional)
 * 4. Generar análisis y transcripción
 * 5. Crear una línea de tiempo con sincronización
 * 6. Generar el video final
 */
export function MusicVideoWorkflow({ onComplete }: MusicVideoWorkflowProps) {
  // Estado de archivos
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [bRollFiles, setBRollFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  
  // Estado de análisis
  const [timelineData, setTimelineData] = useState<TimelineClip[]>([]);
  const [transcription, setTranscription] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  
  // Estado de procesamiento y UI
  const [activeStep, setActiveStep] = useState<string>('upload');
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>('');
  const [currentView, setCurrentView] = useState<'clips' | 'timeline' | 'preview'>('clips');
  
  // Manejar la subida del audio (canción)
  const handleAudioUpload = (file: File) => {
    setAudioFile(file);
    toast({
      title: "Audio cargado",
      description: `Archivo: ${file.name}`,
    });
  };

  // Manejar la subida de imágenes principales
  const handleImagesUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    setImageFiles((prev) => [...prev, ...newFiles]);
    
    toast({
      title: `${newFiles.length} imágenes cargadas`,
      description: "Las imágenes se usarán como clips principales",
    });
  };

  // Manejar la subida de videos
  const handleVideoUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    setVideoFiles((prev) => [...prev, ...newFiles]);
    
    toast({
      title: `${newFiles.length} videos cargados`,
      description: "Los videos se usarán como clips principales",
    });
  };

  // Manejar la subida de b-roll
  const handleBRollUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    setBRollFiles((prev) => [...prev, ...newFiles]);
    
    toast({
      title: `${newFiles.length} archivos B-roll cargados`,
      description: "Los archivos B-roll se usarán como material adicional",
    });
  };

  // Función simulada para transcribir el audio
  const transcribeAudio = useCallback(async (audioFile: File): Promise<string> => {
    return new Promise((resolve) => {
      // En una implementación real, se invocaría un servicio de reconocimiento de voz
      setTimeout(() => {
        resolve("Esta es una transcripción simulada de la letra de la canción, donde se identifican momentos clave como el estribillo y versos.");
      }, 2000);
    });
  }, []);

  // Función para extraer una etiqueta del nombre de archivo
  const extractLabel = (fileName: string): string => {
    const lower = fileName.toLowerCase();
    if (lower.includes('closeup')) return 'Primer Plano';
    if (lower.includes('medio') || lower.includes('medium')) return 'Plano Medio';
    if (lower.includes('aerial') || lower.includes('aereo')) return 'Plano Aéreo';
    return 'Plano General';
  };

  // Función para generar clips de línea de tiempo a partir de los archivos
  const generateEditingTimeline = useCallback(async () => {
    if (!audioFile) return [];
    
    // Se asume una duración base para el audio (en un caso real se detectaría)
    const audioDuration = audioFile.size > 1000000 ? 180 : 120; // Aproximación según tamaño
    setDuration(audioDuration);
    
    // Combinar archivos de imagen y video como clips principales
    const mediaFiles = [...imageFiles, ...videoFiles];
    
    if (mediaFiles.length === 0) {
      toast({
        title: "No hay suficientes archivos",
        description: "Se necesitan imágenes o videos para generar la línea de tiempo",
        variant: "destructive"
      });
      return [];
    }
    
    // Determinar la duración de cada segmento
    const segmentDuration = audioDuration / mediaFiles.length;
    
    // Crear clips para los archivos principales
    const mainClips: TimelineClip[] = mediaFiles.map((file, index) => {
      const start = Math.floor(index * segmentDuration);
      const duration = Math.floor(segmentDuration);
      const isVideo = file.type.includes('video');
      
      return {
        id: index + 1,
        start,
        duration,
        type: isVideo ? 'video' : 'image',
        layer: 1, // Capa de video/imagen
        title: extractLabel(file.name),
        thumbnail: URL.createObjectURL(file),
        imageUrl: !isVideo ? URL.createObjectURL(file) : undefined,
        videoUrl: isVideo ? URL.createObjectURL(file) : undefined,
        metadata: {
          section: index % 2 === 0 ? 'Verso' : 'Coro',
          sourceIndex: index
        }
      };
    });
    
    // Crear clip para el audio
    const audioClip: TimelineClip = {
      id: mainClips.length + 1,
      start: 0,
      duration: audioDuration,
      type: 'audio',
      layer: 0, // Capa de audio
      title: audioFile.name.replace(/\.[^/.]+$/, ""),
      audioUrl: URL.createObjectURL(audioFile),
    };
    
    // Crear clips para B-roll si existen
    const bRollClips: TimelineClip[] = [];
    if (bRollFiles.length > 0) {
      const interval = Math.floor(audioDuration / (bRollFiles.length + 1));
      
      bRollFiles.forEach((file, index) => {
        const start = (index + 1) * interval;
        const isVideo = file.type.includes('video');
        
        bRollClips.push({
          id: mainClips.length + 2 + index,
          start,
          duration: 5, // Duración fija para B-roll
          type: isVideo ? 'video' : 'image',
          layer: 1, // Capa de video/imagen
          title: `B-Roll ${index + 1}`,
          thumbnail: URL.createObjectURL(file),
          imageUrl: !isVideo ? URL.createObjectURL(file) : undefined,
          videoUrl: isVideo ? URL.createObjectURL(file) : undefined,
          metadata: {
            section: 'B-Roll'
          }
        });
      });
    }
    
    // Combinar todos los clips
    const allClips = [audioClip, ...mainClips, ...bRollClips];
    
    // Si la transcripción contiene "estribillo", marcar un clip central como estribillo
    if (transcription.toLowerCase().includes('estribillo')) {
      const midIndex = Math.floor(mainClips.length / 2);
      if (mainClips[midIndex]) {
        mainClips[midIndex].title += ' (Estribillo)';
        if (mainClips[midIndex].metadata) {
          mainClips[midIndex].metadata.section = 'Estribillo';
        }
      }
    }
    
    return allClips;
  }, [audioFile, imageFiles, videoFiles, bRollFiles, transcription]);

  // Iniciar análisis y generación de la línea de tiempo
  const handleStartAnalysis = async () => {
    if (!audioFile || (imageFiles.length === 0 && videoFiles.length === 0)) {
      toast({
        title: "Archivos insuficientes",
        description: "Por favor, sube al menos un audio y una imagen o video",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // Generar transcripción
      const transcript = await transcribeAudio(audioFile);
      setTranscription(transcript);
      
      // Simular progreso del análisis
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Una vez completado el análisis, generar la línea de tiempo
          generateEditingTimeline().then(clips => {
            setTimelineData(clips);
            setAnalysisComplete(true);
            setIsAnalyzing(false);
            setActiveStep('timeline');
            
            toast({
              title: "Análisis completado",
              description: "La línea de tiempo ha sido generada con éxito",
            });
          });
        }
      }, 500);
    } catch (error) {
      setIsAnalyzing(false);
      toast({
        title: "Error en el análisis",
        description: "Ocurrió un error al analizar los archivos",
        variant: "destructive"
      });
    }
  };

  // Manejar la generación del video final
  const handleGenerateVideo = async (settings: VideoGenerationSettings) => {
    if (timelineData.length === 0) {
      toast({
        title: "No hay línea de tiempo",
        description: "Primero debes crear una línea de tiempo",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Simulación de progreso de generación de video
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          
          // Simular URL del video generado
          setTimeout(() => {
            // En un caso real, esta URL vendría del servidor
            setGeneratedVideoUrl('/assets/Standard_Mode_Generated_Video (2).mp4');
            setIsGenerating(false);
            setActiveStep('preview');
            
            toast({
              title: "Video generado",
              description: "Tu video musical ha sido creado con éxito",
            });
            
            // Notificar al componente padre si existe callback
            if (onComplete) {
              onComplete({
                videoUrl: '/assets/Standard_Mode_Generated_Video (2).mp4',
                clips: timelineData,
                duration: duration
              });
            }
          }, 1000);
          
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  // Renderizado del componente
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Flujo de Trabajo para Video Musical</CardTitle>
            <CardDescription>Crea videos musicales sincronizados con ritmo y letra</CardDescription>
          </div>
          
          {/* Indicador de progreso de flujo */}
          <div className="flex items-center gap-2">
            {['upload', 'timeline', 'generate', 'preview'].map((step, index) => (
              <React.Fragment key={step}>
                {index > 0 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Badge variant={activeStep === step ? "default" : "outline"}>
                  {step === 'upload' && 'Subir'}
                  {step === 'timeline' && 'Timeline'}
                  {step === 'generate' && 'Generar'}
                  {step === 'preview' && 'Preview'}
                </Badge>
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Paso 1: Subir archivos */}
        {activeStep === 'upload' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Canción (Audio)</Label>
                <div className="border border-dashed rounded-md p-4">
                  <div className="flex flex-col gap-2">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => e.target.files && e.target.files[0] && handleAudioUpload(e.target.files[0])}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Sube un archivo de audio (MP3, WAV, etc.)</p>
                  </div>
                  
                  {audioFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Music className="h-4 w-4 text-orange-500" />
                      <span>{audioFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="mb-2 block">Clips Principales (Imágenes/Videos)</Label>
                <div className="border border-dashed rounded-md p-4">
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleImagesUpload(e.target.files)}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Ejemplos de nombre: closeup, plano medio, aerial</p>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => e.target.files && handleVideoUpload(e.target.files)}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Clips de video existentes</p>
                    </div>
                  </div>
                  
                  {(imageFiles.length > 0 || videoFiles.length > 0) && (
                    <div className="mt-2 text-sm">
                      {imageFiles.length > 0 && (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                          <span>{imageFiles.length} imágenes</span>
                        </div>
                      )}
                      {videoFiles.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-indigo-500" />
                          <span>{videoFiles.length} videos</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <Label className="mb-2 block">Material B-Roll (opcional)</Label>
              <div className="border border-dashed rounded-md p-4">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => e.target.files && handleBRollUpload(e.target.files)}
                  className="text-sm"
                />
                
                {bRollFiles.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Film className="h-4 w-4 text-purple-500" />
                    <span>{bRollFiles.length} archivos B-roll</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="default" 
                onClick={handleStartAnalysis}
                disabled={!audioFile || (imageFiles.length === 0 && videoFiles.length === 0) || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Analizar y Crear Timeline
                  </>
                )}
              </Button>
            </div>
            
            {isAnalyzing && (
              <Progress value={generationProgress} className="h-2" />
            )}
          </div>
        )}
        
        {/* Paso 2: Visualización de línea de tiempo */}
        {activeStep === 'timeline' && (
          <div className="space-y-4">
            <Tabs defaultValue="clips" value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
              <TabsList>
                <TabsTrigger value="clips">
                  <Film className="h-4 w-4 mr-2" />
                  Clips
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Clock className="h-4 w-4 mr-2" />
                  Línea de Tiempo
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="clips" className="space-y-4 mt-4">
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {timelineData
                      .filter(clip => clip.type !== 'audio')
                      .map(clip => (
                        <Card key={clip.id} className="overflow-hidden">
                          <div className="relative aspect-video bg-muted">
                            {clip.thumbnail && (
                              <img
                                src={clip.thumbnail}
                                alt={clip.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                              {Math.floor(clip.start)}s - {Math.floor(clip.start + clip.duration)}s
                            </div>
                          </div>
                          <CardContent className="p-2">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium truncate">{clip.title}</div>
                              <Badge variant="outline" className="text-xs">
                                {clip.metadata?.section || clip.type}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveStep('upload')}>
                    Volver
                  </Button>
                  <Button onClick={() => setActiveStep('generate')}>
                    <Clapperboard className="h-4 w-4 mr-2" />
                    Continuar a Generación
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4 mt-4">
                <div className="bg-muted rounded-md p-4 h-[400px] overflow-auto">
                  <div className="text-center text-muted-foreground mb-4">
                    Aquí se mostraría una vista completa de la línea de tiempo
                  </div>
                  
                  {/* Simulación visual de la línea de tiempo */}
                  <div className="space-y-4">
                    {/* Capa de Audio */}
                    <div className="relative h-16 bg-black/5 rounded-md">
                      <div className="absolute left-0 top-0 h-full bg-orange-500/20 rounded-l-md" style={{ width: '100%' }}>
                        <div className="flex items-center h-full px-2">
                          <Music className="h-4 w-4 text-orange-500 mr-2" />
                          <span className="text-xs font-medium">
                            {timelineData.find(clip => clip.type === 'audio')?.title || 'Audio Track'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Capa de Video/Imágenes */}
                    <div className="relative h-16 bg-black/5 rounded-md flex items-center">
                      <div className="absolute top-0 left-0 h-full w-full">
                        {timelineData
                          .filter(clip => clip.type !== 'audio')
                          .map(clip => (
                            <div
                              key={clip.id}
                              className="absolute top-0 h-full bg-blue-500/30 rounded-md border border-blue-500/50"
                              style={{
                                left: `${(clip.start / duration) * 100}%`,
                                width: `${(clip.duration / duration) * 100}%`
                              }}
                            >
                              <div className="flex items-center h-full px-2 overflow-hidden">
                                <span className="text-xs font-medium whitespace-nowrap">
                                  {clip.title}
                                </span>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Escala de tiempo */}
                    <div className="relative h-8 mt-2">
                      {Array.from({ length: Math.ceil(duration / 30) + 1 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute top-0 -translate-x-1/2"
                          style={{ left: `${(i * 30 / duration) * 100}%` }}
                        >
                          <div className="h-3 w-0.5 bg-gray-300"></div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {i * 30}s
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveStep('upload')}>
                    Volver
                  </Button>
                  <Button onClick={() => setActiveStep('generate')}>
                    <Clapperboard className="h-4 w-4 mr-2" />
                    Continuar a Generación
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Paso 3: Generación de video */}
        {activeStep === 'generate' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <VideoGenerator 
                  onGenerateVideo={handleGenerateVideo}
                  isLoading={isGenerating}
                  scenesCount={timelineData.filter(clip => clip.type !== 'audio').length}
                  duration={duration}
                  clips={timelineData}
                />
                
                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generando video...</span>
                      <span>{Math.round(generationProgress)}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveStep('timeline')}>
                Volver
              </Button>
            </div>
          </div>
        )}
        
        {/* Paso 4: Vista previa del video */}
        {activeStep === 'preview' && generatedVideoUrl && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                  <video 
                    src={generatedVideoUrl} 
                    controls 
                    className="w-full h-full"
                    poster="/assets/thumbnail-video.jpg"
                  />
                </div>
                
                <div className="flex justify-between mt-4">
                  <div>
                    <h3 className="text-lg font-semibold">Video Musical Generado</h3>
                    <p className="text-sm text-muted-foreground">
                      {timelineData.filter(clip => clip.type !== 'audio').length} clips | {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} min
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                    <Button variant="default">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Compartir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActiveStep('generate')}>
                Volver
              </Button>
              <Button variant="default" onClick={() => setActiveStep('upload')}>
                Nuevo Proyecto
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MusicVideoWorkflow;