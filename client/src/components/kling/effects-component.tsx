import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Image as ImageIcon, Video, WandSparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { klingService, EffectsRequest, EffectsResult } from '@/services/kling/kling-service';

// Tipo para efectos válidos
type ValidEffectType = 'squish' | 'expansion' | 'zoom' | 'twirl' | 'wave' | 'custom';

// Type guard para verificar si un valor es un tipo de efecto válido
function isValidEffectType(value: any): value is ValidEffectType {
  return ['squish', 'expansion', 'zoom', 'twirl', 'wave', 'custom'].includes(value);
}

export function EffectsComponent() {
  const [sourceImage, setSourceImage] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [effectType, setEffectType] = useState<EffectsRequest['effectType']>('squish');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<EffectsRequest | null>(null);
  const [result, setResult] = useState<EffectsResult | null>(null);
  const [savedResults, setSavedResults] = useState<EffectsResult[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Configuración avanzada
  const [duration, setDuration] = useState<number>(3);
  const [intensity, setIntensity] = useState<number>(50);
  const [loop, setLoop] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'gif'>('mp4');
  const [resolution, setResolution] = useState<string>('720p');

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
      const results = await klingService.getResults('effects');
      setSavedResults(results as EffectsResult[]);
    } catch (error) {
      console.error('Error loading saved results:', error);
    }
  }

  async function checkTaskStatus() {
    if (!taskId) return;

    try {
      const status = await klingService.checkEffectsStatus(taskId);
      setTaskStatus(status);

      if (status.status === 'completed') {
        // La tarea se completó con éxito
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        
        const resultData: EffectsResult = {
          resultVideo: status.status === 'completed' ? (status as any).resultUrl : '',
          requestId: taskId,
          originalImage: sourceImage,
          effectType: effectType
        };
        
        setResult(resultData);
        setIsLoading(false);
        
        toast({
          title: "¡Proceso completado!",
          description: `El efecto ${getEffectName(effectType)} ha sido aplicado exitosamente.`,
        });
        
        // Guardar el resultado
        try {
          await klingService.saveResult('effects', resultData);
          loadSavedResults(); // Recargar resultados
        } catch (saveError) {
          console.error('Error saving effects result:', saveError);
        }
      } else if (status.status === 'failed') {
        // La tarea falló
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        setIsLoading(false);
        
        toast({
          title: "Error en el proceso",
          description: status.error || "Ha ocurrido un error durante la aplicación del efecto.",
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

  const getEffectName = (effect: EffectsRequest['effectType']): string => {
    const names: Record<string, string> = {
      'squish': 'Comprimir',
      'expansion': 'Expandir',
      'zoom': 'Zoom',
      'twirl': 'Remolino',
      'wave': 'Ondas',
      'custom': 'Personalizado'
    };
    return names[effect] || String(effect);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartEffects = async () => {
    if (!sourceImage) {
      toast({
        title: "Imagen requerida",
        description: "Por favor, sube una imagen para aplicar el efecto.",
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
        duration: duration,
        intensity: intensity,
        loop: loop,
        output_format: outputFormat,
        resolution: resolution
      };
      
      const newTaskId = await klingService.startEffects(
        sourceImage,
        effectType,
        settings
      );
      setTaskId(newTaskId);
      
      toast({
        title: "Proceso iniciado",
        description: "Comenzando a procesar la imagen. Esto puede tomar varios minutos.",
      });
    } catch (error) {
      console.error('Error starting effects process:', error);
      setIsLoading(false);
      
      toast({
        title: "Error al iniciar proceso",
        description: "No se pudo iniciar la aplicación del efecto. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setSourceImage('');
    setImageFile(null);
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
      await klingService.saveResult('effects', result);
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
          <TabsTrigger value="create">Crear Efecto</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          {/* Sección de carga de imagen */}
          <Card>
            <CardHeader>
              <CardTitle>Imagen Base</CardTitle>
              <CardDescription>Sube la imagen a la que quieres aplicar efectos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-60">
                {sourceImage ? (
                  <div className="relative w-full">
                    <img 
                      src={sourceImage} 
                      alt="Preview" 
                      className="max-h-60 mx-auto object-contain"
                    />
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSourceImage('');
                        setImageFile(null);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <p>Haz clic para subir tu imagen</p>
                  </div>
                )}
              </div>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                id="source-image"
                className="cursor-pointer"
              />
            </CardContent>
          </Card>
          
          {/* Selector de tipo de efecto */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Efecto</CardTitle>
              <CardDescription>Selecciona el efecto que deseas aplicar a tu imagen</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={effectType} 
                onValueChange={(value) => setEffectType(value as EffectsRequest['effectType'])}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="squish" id="squish" className="sr-only" />
                  <Label
                    htmlFor="squish"
                    className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      effectType === 'squish' ? 'bg-primary/20 border-primary' : ''
                    }`}
                  >
                    <WandSparkles className="mb-2 h-6 w-6" />
                    <span>Comprimir</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="expansion" id="expansion" className="sr-only" />
                  <Label
                    htmlFor="expansion"
                    className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      effectType === 'expansion' ? 'bg-primary/20 border-primary' : ''
                    }`}
                  >
                    <WandSparkles className="mb-2 h-6 w-6" />
                    <span>Expandir</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="zoom" id="zoom" className="sr-only" />
                  <Label
                    htmlFor="zoom"
                    className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      effectType === 'zoom' ? 'bg-primary/20 border-primary' : ''
                    }`}
                  >
                    <WandSparkles className="mb-2 h-6 w-6" />
                    <span>Zoom</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="twirl" id="twirl" className="sr-only" />
                  <Label
                    htmlFor="twirl"
                    className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      effectType === 'twirl' ? 'bg-primary/20 border-primary' : ''
                    }`}
                  >
                    <WandSparkles className="mb-2 h-6 w-6" />
                    <span>Remolino</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="wave" id="wave" className="sr-only" />
                  <Label
                    htmlFor="wave"
                    className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      effectType === 'wave' ? 'bg-primary/20 border-primary' : ''
                    }`}
                  >
                    <WandSparkles className="mb-2 h-6 w-6" />
                    <span>Ondas</span>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem value="custom" id="custom" className="sr-only" disabled />
                  <Label
                    htmlFor="custom"
                    className={`flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground cursor-not-allowed opacity-50 ${
                      effectType === 'custom' ? 'bg-primary/20 border-primary' : ''
                    }`}
                  >
                    <WandSparkles className="mb-2 h-6 w-6" />
                    <span>Personalizado</span>
                    <span className="text-xs">(Próximamente)</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          {/* Configuración avanzada */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>Personaliza los parámetros del efecto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="duration">Duración: {duration} segundos</Label>
                </div>
                <Slider 
                  id="duration"
                  min={1}
                  max={10}
                  step={1}
                  value={[duration]}
                  onValueChange={(value) => setDuration(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="intensity">Intensidad: {intensity}%</Label>
                </div>
                <Slider 
                  id="intensity"
                  min={10}
                  max={100}
                  step={5}
                  value={[intensity]}
                  onValueChange={(value) => setIntensity(value[0])}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="output-format">Formato de salida</Label>
                  <Select 
                    value={outputFormat} 
                    onValueChange={(value) => setOutputFormat(value as 'mp4' | 'gif')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (Mejor calidad)</SelectItem>
                      <SelectItem value="gif">GIF (Compatible con más plataformas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolución</Label>
                  <Select 
                    value={resolution} 
                    onValueChange={setResolution}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar resolución" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="480p">480p (SD)</SelectItem>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="loop">Reproducción en bucle</Label>
                  <Switch 
                    id="loop" 
                    checked={loop}
                    onCheckedChange={setLoop}
                  />
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
                  ? "Procesando la imagen, esto puede tomar varios minutos..." 
                  : "Visualiza el resultado del efecto aplicado"}
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
                  <div className="w-full">
                    <video 
                      src={result.resultVideo} 
                      autoPlay 
                      loop={loop} 
                      muted 
                      playsInline
                      controls
                      className="max-h-96 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <Video className="h-10 w-10 mb-2" />
                    <p>Los resultados aparecerán aquí después del procesamiento</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-center">
              <Button
                onClick={handleStartEffects}
                disabled={isLoading || !sourceImage}
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <WandSparkles className="mr-2 h-4 w-4" />
                    Aplicar Efecto
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
              <CardTitle>Historial de Efectos</CardTitle>
              <CardDescription>Revisa tus efectos aplicados anteriormente</CardDescription>
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
                      <div className="relative aspect-square">
                        <video 
                          src={item.resultVideo} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <CardFooter className="flex justify-between p-2">
                        <p className="text-xs text-gray-500">
                          Efecto: {getEffectName(isValidEffectType(item.effectType) ? item.effectType : 'custom')}
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