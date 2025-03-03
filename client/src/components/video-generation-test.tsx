import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Sparkles, FilmIcon, Camera, CheckCircle, Download, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Define los esquemas de validación para el formulario
const videoGenerationFormSchema = z.object({
  prompt: z.string().min(5, 'El prompt debe tener al menos 5 caracteres').max(500, 'El prompt no debe exceder 500 caracteres'),
  model: z.enum(['t2v-01', 't2v-01-director']),
  cameraMovements: z.array(z.string()).optional(),
  includePromptInMovements: z.boolean().default(true),
});

type VideoGenerationFormValues = z.infer<typeof videoGenerationFormSchema>;

// Lista de movimientos de cámara disponibles
const availableCameraMovements = [
  'Zoom In', 'Zoom Out', 'Pan Left', 'Pan Right', 
  'Tilt Up', 'Tilt Down', 'Tracking Shot', 'Dolly Zoom',
  'Orbital', 'Crane Shot', 'Handheld', 'Steady Cam'
];

/**
 * Componente para probar la generación de videos usando PiAPI
 * 
 * Proporciona una interfaz para:
 * - Ingresar un prompt descriptivo
 * - Seleccionar modelo de generación
 * - Configurar movimientos de cámara (para el modelo director)
 * - Ver el progreso de generación
 * - Reproducir y descargar el video generado
 */
export default function VideoGenerationTest() {
  // Estado del componente
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Configurar el formulario con react-hook-form
  const form = useForm<VideoGenerationFormValues>({
    resolver: zodResolver(videoGenerationFormSchema),
    defaultValues: {
      prompt: '',
      model: 't2v-01-director',
      cameraMovements: [],
      includePromptInMovements: true,
    },
  });

  // Función para manejar el envío del formulario
  const onSubmit = async (values: VideoGenerationFormValues) => {
    try {
      // Reiniciar estados
      setGenerating(true);
      setProgress(0);
      setVideoUrl(null);
      setError(null);
      
      // Mostrar notificación de inicio de generación
      toast({
        title: 'Iniciando generación de video',
        description: 'Esto puede tardar varios minutos',
      });

      // Preparar parámetros según el modelo seleccionado
      const requestData: any = {
        prompt: values.prompt,
        model: values.model,
      };

      // Si el modelo es director, incluir movimientos de cámara
      if (values.model === 't2v-01-director' && values.cameraMovements && values.cameraMovements.length > 0) {
        // Formatear movimientos de cámara según la API
        // La API espera un formato: [Movimiento1,Movimiento2]prompt
        if (values.includePromptInMovements) {
          // Los movimientos se insertan antes del prompt
          requestData.prompt = `[${values.cameraMovements.join(',')}]${values.prompt}`;
        } else {
          // Los movimientos se envían por separado
          requestData.cameraMovements = values.cameraMovements;
        }
      }

      // Enviar solicitud para iniciar la generación
      const response = await axios.post('/api/video-generation/generate', requestData);
      
      if (response.data.success && response.data.taskId) {
        // Guardar ID de tarea para verificar el estado
        setTaskId(response.data.taskId);
        
        // Iniciar polling para verificar el estado
        startPolling(response.data.taskId);
      } else {
        throw new Error(response.data.error || 'Error desconocido al iniciar la generación');
      }
    } catch (err: any) {
      console.error('Error al generar video:', err);
      setError(err.message || 'Error al generar video');
      setGenerating(false);
      
      toast({
        title: 'Error al generar video',
        description: err.message || 'Hubo un problema al iniciar la generación',
        variant: 'destructive',
      });
    }
  };

  // Función para iniciar el polling de estado
  const startPolling = (taskId: string) => {
    // Limpiar intervalo anterior si existe
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Iniciar nuevo intervalo
    const interval = setInterval(async () => {
      try {
        // Verificar estado de la tarea
        const response = await axios.get(`/api/video-generation/status?taskId=${taskId}`);
        
        if (response.data.success) {
          // Actualizar progreso
          const status = response.data.status;
          
          if (status === 'completed' && response.data.url) {
            // La generación ha terminado con éxito
            clearInterval(interval);
            setPollingInterval(null);
            setVideoUrl(response.data.url);
            setProgress(100);
            setGenerating(false);
            
            toast({
              title: '¡Video generado con éxito!',
              description: 'Ahora puedes reproducir y descargar el video',
            });
          } else if (status === 'failed') {
            // La generación ha fallado
            clearInterval(interval);
            setPollingInterval(null);
            setError(response.data.error || 'La generación del video ha fallado');
            setGenerating(false);
            
            toast({
              title: 'Error en la generación',
              description: response.data.error || 'La generación del video ha fallado',
              variant: 'destructive',
            });
          } else if (status === 'processing') {
            // La generación está en progreso
            // Incrementar progreso gradualmente hasta 95% (reservamos 5% para la finalización)
            setProgress(Math.min(95, progress + 5));
          }
        } else {
          throw new Error(response.data.error || 'Error al verificar el estado de la generación');
        }
      } catch (err: any) {
        console.error('Error al verificar estado:', err);
        clearInterval(interval);
        setPollingInterval(null);
        setError(err.message || 'Error al verificar el estado de la generación');
        setGenerating(false);
        
        toast({
          title: 'Error al verificar el estado',
          description: err.message || 'Hubo un problema al verificar el estado de la generación',
          variant: 'destructive',
        });
      }
    }, 5000); // Verificar cada 5 segundos
    
    setPollingInterval(interval);
  };

  // Limpiar intervalo al desmontar el componente
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Función para descargar el video generado
  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `generated_video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Descarga iniciada',
        description: 'Tu video comenzará a descargarse',
      });
    }
  };

  // Función para reiniciar el formulario
  const handleReset = () => {
    form.reset();
    setVideoUrl(null);
    setError(null);
    setProgress(0);
    setTaskId(null);
  };

  // Renderizar componente
  return (
    <div className="space-y-6">
      {/* Formulario de generación de video */}
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" disabled={generating}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Video
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!videoUrl && !generating}>
            <FilmIcon className="h-4 w-4 mr-2" />
            Ver Resultado
          </TabsTrigger>
        </TabsList>
        
        {/* Pestaña de formulario */}
        <TabsContent value="form" className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Campo de prompt */}
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción del video</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe lo que quieres ver en el video..."
                        className="resize-none min-h-[100px]"
                        disabled={generating}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe con detalle la escena que quieres que se genere.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Selector de modelo */}
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={generating}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un modelo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="t2v-01">Estándar (t2v-01)</SelectItem>
                        <SelectItem value="t2v-01-director">Director con movimientos de cámara (t2v-01-director)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      El modelo Director permite añadir movimientos de cámara.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Configuración de movimientos de cámara (solo visible si el modelo es director) */}
              {form.watch('model') === 't2v-01-director' && (
                <div className="space-y-4 border p-4 rounded-md">
                  <FormField
                    control={form.control}
                    name="cameraMovements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Movimientos de cámara</FormLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {availableCameraMovements.map((movement) => (
                            <Button
                              key={movement}
                              type="button"
                              variant={field.value?.includes(movement) ? "default" : "outline"}
                              size="sm"
                              disabled={
                                generating || 
                                (field.value?.length === 3 && !field.value?.includes(movement))
                              }
                              onClick={() => {
                                const current = field.value || [];
                                const updated = current.includes(movement)
                                  ? current.filter(m => m !== movement)
                                  : [...current, movement];
                                field.onChange(updated);
                              }}
                              className="flex items-center justify-center h-10"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {movement}
                            </Button>
                          ))}
                        </div>
                        <FormDescription>
                          Selecciona hasta 3 movimientos de cámara para el video.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Opción para incluir el prompt en los movimientos */}
                  <FormField
                    control={form.control}
                    name="includePromptInMovements"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            disabled={generating}
                            className="h-4 w-4 mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Formato preferido para movimientos</FormLabel>
                          <FormDescription>
                            Activado: [Movimiento1,Movimiento2]prompt (recomendado) <br />
                            Desactivado: Enviar movimientos por separado
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={generating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>
                <Button
                  type="submit"
                  disabled={generating}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar Video
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        {/* Pestaña de previsualización */}
        <TabsContent value="preview" className="space-y-4">
          {/* Mostrar progreso durante la generación */}
          {generating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generando video...</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Esta operación puede tardar varios minutos. Por favor, espera...
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Mostrar error si existe */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Mostrar video generado */}
          {videoUrl && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Video Generado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video rounded-md overflow-hidden border">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                    }
                  }}
                >
                  <FilmIcon className="h-4 w-4 mr-2" />
                  Reproducir
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Video
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}