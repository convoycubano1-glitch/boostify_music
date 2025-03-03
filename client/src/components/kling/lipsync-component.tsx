import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileVideo, FileAudio, Mic, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { klingService, LipsyncRequest, LipsyncResult } from '@/services/kling/kling-service';

export function LipsyncComponent() {
  const [videoSource, setVideoSource] = useState<string>('');
  const [audioSource, setAudioSource] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputMode, setInputMode] = useState<'audio' | 'text'>('text');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<LipsyncRequest | null>(null);
  const [result, setResult] = useState<LipsyncResult | null>(null);
  const [savedResults, setSavedResults] = useState<LipsyncResult[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const resultVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Configuración avanzada
  const [preserveExpressions, setPreserveExpressions] = useState<boolean>(true);
  const [enhanceClarity, setEnhanceClarity] = useState<boolean>(true);
  const [language, setLanguage] = useState<'en' | 'es' | 'fr' | 'auto'>('auto');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female' | 'neutral'>('neutral');

  // Cargar resultados guardados al montar
  useEffect(() => {
    loadSavedResults();
  }, []);

  // Limpiar intervalo al desmontar
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  // Efecto para verificar el estado de la tarea
  useEffect(() => {
    if (taskId && !pollInterval) {
      const interval = setInterval(checkTaskStatus, 3000);
      setPollInterval(interval);
    }
  }, [taskId]);

  async function loadSavedResults() {
    try {
      const results = await klingService.getResults('lipsync');
      setSavedResults(results as LipsyncResult[]);
    } catch (error) {
      console.error('Error loading saved results:', error);
    }
  }

  async function checkTaskStatus() {
    if (!taskId) return;

    try {
      const status = await klingService.checkLipsyncStatus(taskId);
      setTaskStatus(status);

      if (status.status === 'completed') {
        // La tarea se completó con éxito
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        
        const resultData: LipsyncResult = {
          resultVideo: status.status === 'completed' ? (status as any).resultUrl : '',
          requestId: taskId,
          originalVideo: videoSource,
          audioUsed: inputMode === 'audio' ? audioSource : undefined
        };
        
        setResult(resultData);
        setIsLoading(false);
        
        toast({
          title: "¡Proceso completado!",
          description: "El video con sincronización de labios ha sido generado exitosamente.",
        });
        
        // Guardar el resultado
        try {
          await klingService.saveResult('lipsync', resultData);
          loadSavedResults(); // Recargar resultados
        } catch (saveError) {
          console.error('Error saving lipsync result:', saveError);
        }
      } else if (status.status === 'failed') {
        // La tarea falló
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        setIsLoading(false);
        
        toast({
          title: "Error en el proceso",
          description: status.error || "Ha ocurrido un error durante la sincronización del video.",
          variant: "destructive",
        });
      } else {
        // La tarea sigue en proceso, actualizar el estado
        setTaskStatus(status);
      }
    } catch (error) {
      console.error('Error checking task status:', error);
      
      toast({
        title: "Error de conexión",
        description: "No se pudo verificar el estado del proceso. Intente nuevamente.",
        variant: "destructive",
      });
      
      if (pollInterval) clearInterval(pollInterval);
      setPollInterval(null);
      setIsLoading(false);
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setVideoFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setVideoSource(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAudioFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setAudioSource(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleToggleResultPlay = () => {
    if (!resultVideoRef.current) return;
    
    if (resultVideoRef.current.paused) {
      resultVideoRef.current.play();
    } else {
      resultVideoRef.current.pause();
    }
  };

  const handleStartLipsync = async () => {
    if (!videoSource) {
      toast({
        title: "Video requerido",
        description: "Por favor, sube un video para realizar la sincronización de labios.",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === 'audio' && !audioSource) {
      toast({
        title: "Audio requerido",
        description: "Por favor, sube un archivo de audio para realizar la sincronización de labios.",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === 'text' && !textContent.trim()) {
      toast({
        title: "Texto requerido",
        description: "Por favor, ingresa el texto que deseas que se sincronice con el video.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTaskId(null);
    setTaskStatus(null);
    setResult(null);
    
    try {
      // Configuración para la solicitud
      const settings = {
        preserve_expressions: preserveExpressions,
        enhance_clarity: enhanceClarity,
        language: language,
        voice_gender: inputMode === 'text' ? voiceGender : undefined
      };
      
      const newTaskId = await klingService.startLipsync(
        videoSource,
        inputMode === 'audio' ? audioSource : null,
        inputMode === 'text' ? textContent : null,
        settings
      );
      setTaskId(newTaskId);
      
      toast({
        title: "Proceso iniciado",
        description: "Comenzando a procesar el video. Esto puede tomar varios minutos.",
      });
    } catch (error) {
      console.error('Error starting lipsync process:', error);
      setIsLoading(false);
      
      toast({
        title: "Error al iniciar proceso",
        description: "No se pudo iniciar el proceso de sincronización de labios. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setVideoSource('');
    setAudioSource('');
    setTextContent('');
    setVideoFile(null);
    setAudioFile(null);
    setTaskId(null);
    setTaskStatus(null);
    setResult(null);
    if (pollInterval) clearInterval(pollInterval);
    setPollInterval(null);
    setIsLoading(false);
  };

  const handleSaveResult = async () => {
    if (!result) return;
    
    try {
      await klingService.saveResult('lipsync', result);
      loadSavedResults();
      
      toast({
        title: "Guardado exitoso",
        description: "El resultado ha sido guardado correctamente.",
      });
    } catch (error) {
      console.error('Error saving result:', error);
      
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el resultado. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-4">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="create">Crear Sincronización</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          {/* Sección de carga de video */}
          <Card>
            <CardHeader>
              <CardTitle>Video Base</CardTitle>
              <CardDescription>Sube el video al que quieres sincronizar los labios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-60">
                {videoSource ? (
                  <div className="relative w-full">
                    <video 
                      ref={videoRef}
                      src={videoSource} 
                      className="max-h-60 mx-auto" 
                      controls={false}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button 
                        variant="secondary" 
                        size="icon"
                        className="rounded-full bg-black/50 hover:bg-black/70"
                        onClick={handleTogglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6 text-white" />
                        ) : (
                          <Play className="h-6 w-6 text-white" />
                        )}
                      </Button>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setVideoSource('');
                        setVideoFile(null);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <FileVideo className="h-10 w-10 mb-2" />
                    <p>Haz clic para subir tu video</p>
                  </div>
                )}
              </div>
              <Input 
                type="file" 
                accept="video/*" 
                onChange={handleVideoChange} 
                id="video-source"
                className="cursor-pointer"
              />
            </CardContent>
          </Card>
          
          {/* Selector de modo de entrada */}
          <div className="flex justify-center gap-4 my-4">
            <Button
              variant={inputMode === 'audio' ? "default" : "outline"}
              onClick={() => setInputMode('audio')}
              className="flex-1 md:flex-none"
            >
              <FileAudio className="mr-2 h-4 w-4" />
              Usar Audio
            </Button>
            <Button
              variant={inputMode === 'text' ? "default" : "outline"}
              onClick={() => setInputMode('text')}
              className="flex-1 md:flex-none"
            >
              <Mic className="mr-2 h-4 w-4" />
              Usar Texto
            </Button>
          </div>
          
          {/* Sección audio o texto */}
          {inputMode === 'audio' ? (
            <Card>
              <CardHeader>
                <CardTitle>Audio para sincronizar</CardTitle>
                <CardDescription>Sube el audio que se sincronizará con el video</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 h-32">
                  {audioSource ? (
                    <div className="relative w-full">
                      <audio 
                        src={audioSource} 
                        controls 
                        className="w-full"
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setAudioSource('');
                          setAudioFile(null);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileAudio className="h-10 w-10 mb-2" />
                      <p>Haz clic para subir tu archivo de audio</p>
                    </div>
                  )}
                </div>
                <Input 
                  type="file" 
                  accept="audio/*" 
                  onChange={handleAudioChange} 
                  id="audio-source"
                  className="cursor-pointer"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Texto para sincronizar</CardTitle>
                <CardDescription>Ingresa el texto que se sincronizará con el video</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Escribe el texto que quieres que diga la persona en el video..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-32"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma del texto</Label>
                    <Select 
                      value={language} 
                      onValueChange={(value) => setLanguage(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Detección automática</SelectItem>
                        <SelectItem value="en">Inglés</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Francés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="voice-gender">Género de voz</Label>
                    <Select 
                      value={voiceGender} 
                      onValueChange={(value) => setVoiceGender(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Configuración avanzada */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>Personaliza la sincronización de labios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preserve-expressions">Preservar expresiones faciales</Label>
                    <Switch 
                      id="preserve-expressions" 
                      checked={preserveExpressions}
                      onCheckedChange={setPreserveExpressions}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enhance-clarity">Mejorar claridad del habla</Label>
                    <Switch 
                      id="enhance-clarity" 
                      checked={enhanceClarity}
                      onCheckedChange={setEnhanceClarity}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sección de resultados */}
          <Card>
            <CardHeader>
              <CardTitle>Resultado</CardTitle>
              <CardDescription>
                {isLoading 
                  ? "Procesando el video, esto puede tomar varios minutos..." 
                  : "Visualiza el resultado de la sincronización de labios"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center min-h-60">
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="text-center">
                      <p>Procesando tu solicitud...</p>
                      {taskStatus && (
                        <p className="text-sm text-muted-foreground">
                          Estado: {taskStatus.status === 'pending' ? 'En cola' : 'Procesando'} - 
                          Progreso: {taskStatus.progress}%
                        </p>
                      )}
                    </div>
                  </div>
                ) : result ? (
                  <div className="relative w-full">
                    <video 
                      ref={resultVideoRef}
                      src={result.resultVideo} 
                      className="max-h-96 mx-auto" 
                      controls
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <FileVideo className="h-10 w-10 mb-2" />
                    <p>Los resultados aparecerán aquí después del procesamiento</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-center">
              <Button
                onClick={handleStartLipsync}
                disabled={isLoading || !videoSource || (inputMode === 'audio' && !audioSource) || (inputMode === 'text' && !textContent)}
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Iniciar Sincronización
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full md:w-auto"
              >
                Reiniciar
              </Button>
              
              {result && (
                <Button
                  variant="secondary"
                  onClick={handleSaveResult}
                  className="w-full md:w-auto"
                >
                  Guardar Resultado
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Sincronizaciones</CardTitle>
              <CardDescription>Revisa tus sincronizaciones de labios anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              {savedResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay resultados guardados aún</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedResults.map((item, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative aspect-video">
                        <video 
                          src={item.resultVideo} 
                          className="object-cover w-full h-full" 
                          controls
                        />
                      </div>
                      <CardFooter className="flex justify-between p-2">
                        <p className="text-xs text-gray-500">
                          ID: {item.requestId.substring(0, 8)}...
                        </p>
                        <Button variant="ghost" size="sm">
                          Ver detalles
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}