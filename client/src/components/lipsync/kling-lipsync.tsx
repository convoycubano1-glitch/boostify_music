import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Mic, Music, PlayCircle } from 'lucide-react';
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KlingLipsyncProps {
  className?: string;
}

// Lista de timbres de voz disponibles
const voiceOptions = [
  { value: "Rock", label: "Rock" },
  { value: "Ben", label: "Ben - Masculino (EN)" },
  { value: "Sam", label: "Sam - Masculino (EN)" },
  { value: "Carl", label: "Carl - Masculino (EN)" },
  { value: "Chris", label: "Chris - Masculino (EN)" },
  { value: "Sophie", label: "Sophie - Femenino (EN)" },
  { value: "Lily", label: "Lily - Femenino (EN)" },
  { value: "Emma", label: "Emma - Femenino (EN)" },
];

export function KlingLipsync({ className }: KlingLipsyncProps) {
  const [videoTaskId, setVideoTaskId] = useState<string>('');
  const [audioMethod, setAudioMethod] = useState<'text' | 'audio'>('text');
  const [audioText, setAudioText] = useState<string>('');
  const [audioVoice, setAudioVoice] = useState<string>('Rock');
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("setup");
  const { toast } = useToast();

  const audioInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para manejar la subida de audio
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea un audio
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor, sube solo archivos de audio (MP3, WAV, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Leer el archivo como base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAudioUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Función para manejar la entrada de URL externa de audio
  const handleAudioUrlInput = (url: string) => {
    if (!url) return;
    
    // Validación simple de URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast({
        title: "URL inválida",
        description: "Por favor, introduce una URL válida que comience con http:// o https://",
        variant: "destructive",
      });
      return;
    }
    
    setAudioUrl(url);
  };

  // Función para iniciar el proceso de Lipsync
  const startLipsync = async () => {
    if (!videoTaskId) {
      toast({
        title: "ID del video requerido",
        description: "Por favor, proporciona el ID de un video generado previamente",
        variant: "destructive",
      });
      return;
    }

    if (audioMethod === 'text' && !audioText) {
      toast({
        title: "Texto requerido",
        description: "Por favor, introduce el texto que deseas que diga el video",
        variant: "destructive",
      });
      return;
    }

    if (audioMethod === 'audio' && !audioUrl) {
      toast({
        title: "Audio requerido",
        description: "Por favor, sube un archivo de audio o proporciona una URL",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Preparar los datos según el método seleccionado
      const requestData: any = {
        origin_task_id: videoTaskId
      };

      if (audioMethod === 'text') {
        requestData.tts_text = audioText;
        requestData.tts_timbre = audioVoice;
        requestData.tts_speed = audioSpeed;
      } else {
        requestData.local_dubbing_url = audioUrl;
      }

      // Enviar la solicitud al servidor
      const response = await axios.post('/proxy/kling/lipsync/start', requestData);

      if (response.data.success && response.data.taskId) {
        setTaskId(response.data.taskId);
        
        // Iniciar polling para verificar el estado
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(checkLipsyncStatus, 3000);
        toast({
          title: "Procesando",
          description: "Hemos comenzado a procesar tu solicitud de Lipsync",
        });
      } else {
        throw new Error(response.data.error || "Error al iniciar el Lipsync");
      }
    } catch (error: any) {
      console.error("Error al iniciar Lipsync:", error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al iniciar el proceso",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Función para verificar el estado del proceso
  const checkLipsyncStatus = async () => {
    if (!taskId) return;

    try {
      const response = await axios.get(`/proxy/kling/lipsync/status?taskId=${taskId}`);
      
      if (response.data.status === 'completed' && response.data.success) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setResultVideo(response.data.videoUrl);
        setIsProcessing(false);
        setProgress(100);
        
        toast({
          title: "¡Completado!",
          description: "El proceso de Lipsync ha finalizado con éxito",
        });
        
        // Cambiar a la pestaña de resultados
        setActiveTab("result");
      } else if (response.data.status === 'failed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setIsProcessing(false);
        
        toast({
          title: "Error",
          description: response.data.errorMessage || "El proceso falló",
          variant: "destructive",
        });
      } else if (response.data.status === 'processing') {
        // Actualizar el progreso
        setProgress(response.data.progress || 50);
      }
    } catch (error: any) {
      console.error("Error al verificar estado:", error);
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      setIsProcessing(false);
      
      toast({
        title: "Error",
        description: "Ocurrió un error al verificar el estado del proceso",
        variant: "destructive",
      });
    }
  };

  // Limpiar el intervalo al desmontar el componente
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const resetForm = () => {
    setVideoTaskId('');
    setAudioMethod('text');
    setAudioText('');
    setAudioVoice('Rock');
    setAudioSpeed(1);
    setAudioUrl('');
    setResultVideo(null);
    setTaskId(null);
    setProgress(0);
    setActiveTab("setup");
    
    // Limpiar el input
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  return (
    <div className={`container mx-auto py-6 ${className}`}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Kling Lipsync</CardTitle>
          <CardDescription>
            Sincroniza los labios de un video con texto o audio usando IA
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup">Configuración</TabsTrigger>
              <TabsTrigger value="result" disabled={!resultVideo}>
                Resultado
              </TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="py-4">
            <TabsContent value="setup">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sección de ID del video */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="videoTaskId">ID del Video</Label>
                    <div className="mt-2">
                      <Input
                        id="videoTaskId"
                        type="text"
                        placeholder="ID de la tarea del video generado"
                        value={videoTaskId}
                        onChange={(e) => setVideoTaskId(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Introduce el ID de tarea de un video generado previamente con Kling. 
                      Este ID se obtiene al generar un video con Kling Video Generation o Text-to-Video.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="audioMethod">Método de Audio</Label>
                    <div className="mt-2">
                      <RadioGroup
                        value={audioMethod}
                        onValueChange={(value) => setAudioMethod(value as 'text' | 'audio')}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent">
                          <RadioGroupItem value="text" id="text" />
                          <Label htmlFor="text" className="flex-1 cursor-pointer">
                            <div className="font-medium">Texto a Voz</div>
                            <div className="text-sm text-muted-foreground">
                              Usa texto que será convertido a voz para sincronizar con el video
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-accent">
                          <RadioGroupItem value="audio" id="audio" />
                          <Label htmlFor="audio" className="flex-1 cursor-pointer">
                            <div className="font-medium">Archivo de Audio</div>
                            <div className="text-sm text-muted-foreground">
                              Usa un archivo de audio existente para sincronizar con el video
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  
                  {audioMethod === 'audio' && (
                    <>
                      <div>
                        <Label htmlFor="audioFile">Subir Archivo de Audio</Label>
                        <div className="mt-2">
                          <Input
                            id="audioFile"
                            type="file"
                            ref={audioInputRef}
                            accept="audio/*"
                            onChange={handleAudioUpload}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="audioUrl">O usar URL de Audio</Label>
                        <div className="mt-2 flex space-x-2">
                          <Input
                            id="audioUrl"
                            type="text"
                            placeholder="https://ejemplo.com/audio.mp3"
                            onBlur={(e) => handleAudioUrlInput(e.target.value)}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              const urlInput = document.getElementById('audioUrl') as HTMLInputElement;
                              handleAudioUrlInput(urlInput.value);
                            }}
                          >
                            <Music className="h-4 w-4 mr-2" />
                            Cargar
                          </Button>
                        </div>
                      </div>
                      
                      {audioUrl && audioUrl.startsWith('data:audio/') && (
                        <div className="mt-2">
                          <audio controls className="w-full">
                            <source src={audioUrl} type="audio/mpeg" />
                            Tu navegador no soporta la reproducción de audio.
                          </audio>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Sección de configuración de texto a voz */}
                <div className="space-y-4">
                  {audioMethod === 'text' && (
                    <>
                      <div>
                        <Label htmlFor="audioText">Texto a Hablar</Label>
                        <div className="mt-2">
                          <Textarea
                            id="audioText"
                            placeholder="Introduce el texto que deseas que diga el video"
                            value={audioText}
                            onChange={(e) => setAudioText(e.target.value)}
                            rows={5}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="audioVoice">Voz</Label>
                        <div className="mt-2">
                          <Select value={audioVoice} onValueChange={setAudioVoice}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecciona una voz" />
                            </SelectTrigger>
                            <SelectContent>
                              {voiceOptions.map((voice) => (
                                <SelectItem key={voice.value} value={voice.value}>
                                  {voice.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="audioSpeed">Velocidad de Habla: {audioSpeed}x</Label>
                        <div className="mt-2">
                          <Input
                            id="audioSpeed"
                            type="range"
                            min="0.8"
                            max="2"
                            step="0.1"
                            value={audioSpeed}
                            onChange={(e) => setAudioSpeed(parseFloat(e.target.value))}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Lento (0.8x)</span>
                            <span>Normal (1x)</span>
                            <span>Rápido (2x)</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md mt-4">
                    <h3 className="font-medium text-sm mb-2">Información de Lipsync</h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      El servicio Kling Lipsync permite sincronizar los labios de un personaje en un video con audio o texto.
                    </p>
                    <p className="text-xs font-medium">Recomendaciones:</p>
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1 mt-1">
                      <li>Usa videos donde la cara del personaje sea clara y visible</li>
                      <li>La duración del audio debe ser similar a la duración del video</li>
                      <li>Para mejores resultados, el personaje debe tener una posición frontal</li>
                      <li>El procesamiento puede tardar varios minutos</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {isProcessing && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Procesando...</span>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="result">
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Resultado del Lipsync</h3>
                
                {resultVideo ? (
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden">
                      <video 
                        src={resultVideo}
                        controls
                        autoPlay
                        className="w-full h-auto max-h-[500px]"
                      />
                    </div>
                    <div className="flex justify-between">
                      <a
                        href={resultVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Ver video en una nueva pestaña
                      </a>
                      <a
                        href={resultVideo}
                        download="kling-lipsync-video.mp4"
                        className="text-blue-600 hover:underline text-sm flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-1">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Descargar video
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No hay resultados disponibles</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm}>
              Reiniciar
            </Button>
            
            <Button
              onClick={startLipsync}
              disabled={isProcessing || !videoTaskId || (audioMethod === 'text' && !audioText) || (audioMethod === 'audio' && !audioUrl)}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Iniciar Lipsync
                </>
              )}
            </Button>
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
}

export default KlingLipsync;