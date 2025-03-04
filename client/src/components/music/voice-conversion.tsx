import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Upload, Play, Pause, Download, Music2, Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { voiceModelService } from '../../lib/services/voice-model-service';
import type { VoiceModel, VoiceConversionRequest } from '../../lib/types/voice-model-types';

interface VoiceConversionProps {
  className?: string;
}

export function VoiceConversion({ className }: VoiceConversionProps) {
  const [sourceAudio, setSourceAudio] = useState<File | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [transpose, setTranspose] = useState<number>(0);
  const [generationsCount, setGenerationsCount] = useState<number>(1);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedOutput, setSelectedOutput] = useState<number>(0);
  
  const sourceAudioRef = useRef<HTMLAudioElement>(null);
  const outputAudioRef = useRef<HTMLAudioElement>(null);
  
  // Consulta para obtener los modelos de voz disponibles
  const { data: voiceModels, isLoading: isLoadingModels } = useQuery({
    queryKey: ['voice-models'],
    queryFn: () => voiceModelService.getAvailableModels()
  });
  
  // Consulta para verificar el estado de la tarea de conversión
  const { 
    data: conversionStatus, 
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['conversion-status', taskId],
    queryFn: () => voiceModelService.checkConversionStatus(taskId || ''),
    enabled: !!taskId,
    refetchInterval: isConverting ? 2000 : false
  });
  
  // Actualizamos el estado cuando la conversión se completa
  useEffect(() => {
    if (conversionStatus) {
      if (conversionStatus.status === 'completed') {
        setIsConverting(false);
        toast({
          title: 'Conversión completada',
          description: 'La conversión de voz se ha completado con éxito.'
        });
      } else if (conversionStatus.status === 'failed') {
        setIsConverting(false);
        toast({
          title: 'Error en la conversión',
          description: 'No se pudo completar la conversión de voz.',
          variant: 'destructive'
        });
      }
    }
  }, [conversionStatus]);
  
  // Mutación para iniciar la conversión
  const convertMutation = useMutation({
    mutationFn: (request: VoiceConversionRequest) => {
      return voiceModelService.convertAudio(request);
    },
    onSuccess: (taskId: string) => {
      setTaskId(taskId);
      setIsConverting(true);
      toast({
        title: 'Conversión iniciada',
        description: 'La conversión de voz ha comenzado. Este proceso puede tardar unos minutos.'
      });
    },
    onError: (error) => {
      setIsConverting(false);
      toast({
        title: 'Error al iniciar la conversión',
        description: error instanceof Error ? error.message : 'Ocurrió un error desconocido',
        variant: 'destructive'
      });
    }
  });
  
  // Manejador para subir archivo de audio
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Verificar que sea un archivo de audio
      if (!file.type.startsWith('audio/')) {
        toast({
          title: 'Tipo de archivo incorrecto',
          description: 'Por favor, sube un archivo de audio (WAV recomendado)',
          variant: 'destructive'
        });
        return;
      }
      
      setSourceAudio(file);
    }
  };
  
  // Manejador para iniciar la conversión
  const handleStartConversion = () => {
    if (!sourceAudio) {
      toast({
        title: 'Archivo de audio requerido',
        description: 'Por favor, sube un archivo de audio para la conversión',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedModelId) {
      toast({
        title: 'Modelo no seleccionado',
        description: 'Por favor, selecciona un modelo de voz para la conversión',
        variant: 'destructive'
      });
      return;
    }
    
    const request: VoiceConversionRequest = {
      audio_file: sourceAudio,
      model: selectedModelId,
      transpose,
      generations_count: generationsCount
    };
    
    convertMutation.mutate(request);
  };
  
  // Manejador para reproducir/pausar el audio original
  const toggleSourceAudio = () => {
    if (sourceAudioRef.current) {
      if (sourceAudioRef.current.paused) {
        sourceAudioRef.current.play();
      } else {
        sourceAudioRef.current.pause();
      }
    }
  };
  
  // Manejador para reproducir/pausar el audio convertido
  const toggleOutputAudio = () => {
    if (outputAudioRef.current) {
      if (outputAudioRef.current.paused) {
        outputAudioRef.current.play();
      } else {
        outputAudioRef.current.pause();
      }
    }
  };
  
  // Manejador para descargar el audio convertido con validación de URL
  const handleDownloadOutput = () => {
    if (conversionStatus?.output_audio_urls && 
        conversionStatus.output_audio_urls.length > selectedOutput &&
        conversionStatus.output_audio_urls[selectedOutput]) {
      
      const url = conversionStatus.output_audio_urls[selectedOutput];
      
      // Validación mejorada de URL para seguridad
      if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        toast({
          title: 'Error de seguridad',
          description: 'La URL del audio no es válida o no está disponible.',
          variant: 'destructive'
        });
        return;
      }
      
      try {
        // Verificar que sea una URL válida con estructura correcta
        new URL(url);
        
        // Crear un enlace temporal para descargar el audio
        const link = document.createElement('a');
        link.href = url;
        link.download = `converted_voice_${Date.now()}.wav`;
        link.type = "audio/wav"; // Agregar MIME type correcto para el audio
        
        // Proceso de descarga con manejo de errores
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Descarga iniciada',
          description: 'Tu archivo de audio procesado se está descargando...',
        });
      } catch (error) {
        toast({
          title: 'Error al descargar',
          description: 'No se pudo descargar el archivo de audio. La URL no es válida o no se puede acceder al recurso.',
          variant: 'destructive'
        });
        console.error('Error al descargar audio:', error);
      }
    } else {
      toast({
        title: 'Audio no disponible',
        description: 'No hay un archivo de audio disponible para descargar.',
        variant: 'destructive'
      });
    }
  };
  
  // Seleccionar salida diferente
  const handleSelectOutput = (index: number) => {
    if (conversionStatus?.output_audio_urls && index < conversionStatus.output_audio_urls.length) {
      setSelectedOutput(index);
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Conversión de Voz
          </CardTitle>
          <CardDescription>
            Convierte tu voz utilizando modelos de voz de IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Entrada de audio */}
          <div>
            <Label htmlFor="source-audio">Audio Original</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="source-audio"
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {sourceAudio && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={toggleSourceAudio}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
            {sourceAudio && (
              <audio 
                ref={sourceAudioRef}
                className="hidden"
                controls={false}
                preload="metadata"
                onEnded={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Error loading source audio:', e);
                  toast({
                    title: 'Error de audio',
                    description: 'No se pudo cargar el audio original. El formato podría no ser compatible.',
                    variant: 'destructive'
                  });
                }}
              >
                <source 
                  src={URL.createObjectURL(sourceAudio)} 
                  type={sourceAudio.type || "audio/mpeg"} 
                />
                <source 
                  src={URL.createObjectURL(sourceAudio)} 
                  type="audio/mp3" 
                />
                Tu navegador no soporta la reproducción de audio
              </audio>
            )}
          </div>
          
          {/* Selección de modelo */}
          <div>
            <Label htmlFor="voice-model">Modelo de Voz</Label>
            <Select
              value={selectedModelId}
              onValueChange={setSelectedModelId}
            >
              <SelectTrigger id="voice-model" className="mt-2">
                <SelectValue placeholder="Selecciona un modelo de voz" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingModels ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : voiceModels && voiceModels.length > 0 ? (
                  voiceModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        {model.isCustom && (
                          <Badge variant="outline" className="ml-2">Personal</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No hay modelos disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Opciones de conversión */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between">
                <Label htmlFor="transpose">Transposición (semitonos)</Label>
                <span className="text-sm text-muted-foreground">{transpose}</span>
              </div>
              <Slider
                id="transpose"
                min={-12}
                max={12}
                step={1}
                value={[transpose]}
                onValueChange={(value) => setTranspose(value[0])}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-12</span>
                <span>0</span>
                <span>+12</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between">
                <Label htmlFor="generations">Número de generaciones</Label>
                <span className="text-sm text-muted-foreground">{generationsCount}</span>
              </div>
              <Slider
                id="generations"
                min={1}
                max={5}
                step={1}
                value={[generationsCount]}
                onValueChange={(value) => setGenerationsCount(value[0])}
                className="mt-2"
              />
            </div>
          </div>
          
          {/* Botón de conversión */}
          <Button
            className="w-full"
            onClick={handleStartConversion}
            disabled={isConverting || !sourceAudio || !selectedModelId}
          >
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Convirtiendo...
              </>
            ) : (
              <>
                <Music2 className="mr-2 h-4 w-4" />
                Convertir Voz
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Resultados de la conversión */}
      {(taskId || conversionStatus) && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de la Conversión</CardTitle>
            <CardDescription>
              {isConverting ? 'Procesando tu conversión de voz...' : 'Conversión completada'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConverting && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso de la conversión</span>
                    <span>En progreso...</span>
                  </div>
                  <Progress value={isConverting ? 33 : 100} className="h-2" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>La conversión puede tardar unos minutos. No cierres esta ventana.</span>
                </div>
              </div>
            )}
            
            {!isConverting && conversionStatus && conversionStatus.status === 'completed' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Badge variant="default">Completado</Badge>
                  <span>Tu conversión de voz está lista</span>
                </div>
                
                {conversionStatus.output_audio_urls && conversionStatus.output_audio_urls.length > 0 && (
                  <div>
                    <audio 
                      ref={outputAudioRef}
                      className="hidden"
                      controls={false}
                      preload="metadata"
                      onEnded={() => setIsPlaying(false)}
                      onError={(e) => {
                        console.error('Error loading converted audio:', e);
                        toast({
                          title: 'Error de reproducción',
                          description: 'No se pudo cargar el audio convertido. Intenta descargar el archivo directamente.',
                          variant: 'destructive'
                        });
                        setIsPlaying(false);
                      }}
                    >
                      {conversionStatus.output_audio_urls && conversionStatus.output_audio_urls[selectedOutput] && (
                        <>
                          <source 
                            src={conversionStatus.output_audio_urls[selectedOutput]} 
                            type="audio/wav" 
                          />
                          <source 
                            src={conversionStatus.output_audio_urls[selectedOutput]} 
                            type="audio/mpeg" 
                          />
                        </>
                      )}
                      Tu navegador no soporta la reproducción de audio
                    </audio>
                    
                    {conversionStatus.output_audio_urls.length > 1 && (
                      <div className="mb-3">
                        <Label className="mb-2 block">Selecciona una generación:</Label>
                        <div className="flex flex-wrap gap-2">
                          {conversionStatus.output_audio_urls.map((_, index) => (
                            <Button
                              key={index}
                              variant={selectedOutput === index ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSelectOutput(index)}
                            >
                              Generación {index + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      <Button onClick={toggleOutputAudio} className="flex-1">
                        {outputAudioRef.current?.paused ? (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Reproducir
                          </>
                        ) : (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pausar
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={handleDownloadOutput}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                )}
                
                {conversionStatus.output_settings && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Configuración utilizada:</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Modelo: {conversionStatus.output_settings.model}</p>
                      <p>Transposición: {conversionStatus.output_settings.transpose} semitonos</p>
                      {conversionStatus.output_settings.vocal_style && (
                        <p>Estilo vocal: {conversionStatus.output_settings.vocal_style}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!isConverting && conversionStatus && conversionStatus.status === 'failed' && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                <h4 className="text-red-600 dark:text-red-400 font-medium mb-1">Error en la conversión</h4>
                <p className="text-sm text-muted-foreground">
                  {conversionStatus.error || "Ocurrió un error durante la conversión. Por favor intenta de nuevo con un audio diferente o un modelo distinto."}
                </p>
                <Button variant="outline" className="mt-3" onClick={() => setTaskId(null)}>
                  Intentar nuevamente
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}