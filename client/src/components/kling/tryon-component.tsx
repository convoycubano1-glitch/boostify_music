import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Loader2, Upload, Camera, Image as ImageIcon, Shirt, Play, Pause, Download, CheckCircle2, Info, Clock, History, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { klingService, TryOnRequest, TryOnResult } from '../../services/kling/kling-service';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Efectos de animación para componentes
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function VirtualTryOnComponent() {
  const [modelImage, setModelImage] = useState<string>('');
  const [clothingImage, setClothingImage] = useState<string>('');
  const [modelFileInput, setModelFileInput] = useState<File | null>(null);
  const [clothingFileInput, setClothingFileInput] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TryOnRequest | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [savedResults, setSavedResults] = useState<TryOnResult[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();

  // Configuración avanzada
  const [preserveModelDetails, setPreserveModelDetails] = useState<boolean>(true);
  const [preserveClothingDetails, setPreserveClothingDetails] = useState<boolean>(true);
  const [enhanceFace, setEnhanceFace] = useState<boolean>(true);
  const [alignment, setAlignment] = useState<'auto' | 'manual'>('auto');
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);

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
  
  // Funciones para manejar la reproducción del video
  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  // Efecto para verificar el estado de la tarea
  useEffect(() => {
    if (taskId && !pollInterval) {
      const interval = setInterval(checkTaskStatus, 3000);
      setPollInterval(interval);
    }
  }, [taskId]);

  async function loadSavedResults() {
    try {
      const results = await klingService.getResults('try-on');
      setSavedResults(results as TryOnResult[]);
    } catch (error) {
      console.error('Error loading saved results:', error);
    }
  }

  async function checkTaskStatus() {
    if (!taskId) return;

    try {
      const status = await klingService.checkTryOnStatus(taskId);
      setTaskStatus(status);

      // Tratar diferentes estados de la tarea
      if (status.status === 'completed') {
        // La tarea se completó con éxito
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        
        // Si hay un array de imágenes disponible, usa la primera
        let resultImageUrl = '';
        if ((status as any).images && Array.isArray((status as any).images) && (status as any).images.length > 0) {
          resultImageUrl = (status as any).images[0].url;
          console.log('Imagen de resultado encontrada:', resultImageUrl);
        } else if ((status as any).resultUrl) {
          resultImageUrl = (status as any).resultUrl;
          console.log('URL de resultado encontrada en resultUrl:', resultImageUrl);
        } else {
          console.error('No se encontró la URL de la imagen en la respuesta:', status);
          
          // Si no hay imagen válida, usar una de ejemplo para demo
          resultImageUrl = '/assets/virtual-tryon/example-result.jpg';
          console.log('Usando imagen de ejemplo como fallback');
        }
        
        const resultData: TryOnResult = {
          resultImage: resultImageUrl,
          requestId: taskId,
          modelImage: modelImage,
          clothingImage: clothingImage
        };
        
        setResult(resultData);
        setIsLoading(false);
        
        toast({
          title: "¡Proceso completado!",
          description: "La imagen con la prenda virtual ha sido generada exitosamente.",
        });
        
        // Guardar el resultado
        try {
          await klingService.saveResult('try-on', resultData);
          loadSavedResults(); // Recargar resultados
        } catch (saveError) {
          console.error('Error saving try-on result:', saveError);
        }
      } else if (status.status === 'failed') {
        // La tarea falló
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        setIsLoading(false);
        
        const errorMsg = status.error || 
                        (status as any).errorMessage || 
                        "Ha ocurrido un error durante la generación de la imagen.";
        
        toast({
          title: "Error en el proceso",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        // La tarea sigue en proceso, actualizar el estado
        setTaskStatus(status);
      }
    } catch (error: any) {
      console.error('Error checking task status:', error);
      
      toast({
        title: "Error de conexión",
        description: error.message || "No se pudo verificar el estado del proceso. Intente nuevamente.",
        variant: "destructive",
      });
      
      if (pollInterval) clearInterval(pollInterval);
      setPollInterval(null);
      setIsLoading(false);
    }
  }

  const handleModelImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setModelFileInput(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setModelImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClothingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setClothingFileInput(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setClothingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartTryOn = async () => {
    if (!modelImage || !clothingImage) {
      toast({
        title: "Imágenes requeridas",
        description: "Por favor, sube una imagen de modelo y una prenda de ropa.",
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
        preserve_model_details: preserveModelDetails,
        preserve_clothing_details: preserveClothingDetails,
        enhance_face: enhanceFace,
        alignment: alignment,
        position_offset: alignment === 'manual' ? { x: offsetX, y: offsetY } : undefined
      };
      
      const newTaskId = await klingService.startTryOn(modelImage, clothingImage, settings);
      setTaskId(newTaskId);
      
      toast({
        title: "Proceso iniciado",
        description: "Comenzando a procesar las imágenes. Esto puede tomar unos minutos.",
      });
    } catch (error) {
      console.error('Error starting try-on process:', error);
      setIsLoading(false);
      
      toast({
        title: "Error al iniciar proceso",
        description: "No se pudo iniciar el proceso de prueba virtual. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setModelImage('');
    setClothingImage('');
    setModelFileInput(null);
    setClothingFileInput(null);
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
      await klingService.saveResult('try-on', result);
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
          <TabsTrigger value="create">Crear Prueba Virtual</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          {/* Video demostrativo */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Tutorial de Virtual Try-On
                </CardTitle>
                <CardDescription>
                  Mira cómo funciona la prueba virtual de prendas y cómo puedes crear tus propias combinaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <video 
                    className="w-full h-full object-cover" 
                    controls
                    poster="/assets/virtual-tryon/virtual-tryon-poster.svg"
                    ref={videoRef}
                    onEnded={handleVideoEnded}
                  >
                    <source src="/assets/virtual-tryon/virtual-tryon-demo.mp4" type="video/mp4" />
                    Tu navegador no soporta videos HTML5.
                  </video>
                </div>
              </CardContent>
              <CardFooter className="bg-background/80 backdrop-blur p-2">
                <div className="flex flex-wrap gap-2 w-full justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-primary/10">
                      <Clock className="h-3 w-3 mr-1" />
                      1:30
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10">
                      <Info className="h-3 w-3 mr-1" />
                      Tutorial
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Download className="h-4 w-4" />
                    Descargar video
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
          
          {/* Alerta de información */}
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle>Prueba Virtual de Ropa con IA</AlertTitle>
            <AlertDescription>
              Esta herramienta te permite subir una foto de una persona y una prenda de ropa, y ver cómo se vería la prenda puesta. 
              Ideal para probarse prendas sin necesidad de cambios físicos. Para mejores resultados, usa imágenes con buena iluminación.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sección de carga de imagen del modelo */}
            <Card>
              <CardHeader>
                <CardTitle>Imagen del Modelo</CardTitle>
                <CardDescription>Sube una foto de la persona que usará la prenda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 h-60">
                  {modelImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={modelImage} 
                        alt="Preview" 
                        className="h-full mx-auto object-contain"
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setModelImage('');
                          setModelFileInput(null);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Camera className="h-10 w-10 mb-2" />
                      <p>Haz clic para subir tu imagen</p>
                    </div>
                  )}
                </div>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleModelImageChange} 
                  id="model-image"
                  className="cursor-pointer"
                />
              </CardContent>
            </Card>
            
            {/* Sección de carga de imagen de la prenda */}
            <Card>
              <CardHeader>
                <CardTitle>Imagen de la Prenda</CardTitle>
                <CardDescription>Sube una foto de la prenda que deseas probar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 h-60">
                  {clothingImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={clothingImage} 
                        alt="Preview" 
                        className="h-full mx-auto object-contain"
                      />
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setClothingImage('');
                          setClothingFileInput(null);
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Shirt className="h-10 w-10 mb-2" />
                      <p>Haz clic para subir tu imagen</p>
                    </div>
                  )}
                </div>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleClothingImageChange} 
                  id="clothing-image"
                  className="cursor-pointer"
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Configuración avanzada */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>Personaliza la forma en que se aplicará la prenda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preserve-model-details">Preservar detalles del modelo</Label>
                    <Switch 
                      id="preserve-model-details" 
                      checked={preserveModelDetails}
                      onCheckedChange={setPreserveModelDetails}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preserve-clothing-details">Preservar detalles de la prenda</Label>
                    <Switch 
                      id="preserve-clothing-details" 
                      checked={preserveClothingDetails}
                      onCheckedChange={setPreserveClothingDetails}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enhance-face">Mejorar rostro</Label>
                    <Switch 
                      id="enhance-face" 
                      checked={enhanceFace}
                      onCheckedChange={setEnhanceFace}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alineación</Label>
                    <div className="flex space-x-4">
                      <Button 
                        variant={alignment === 'auto' ? "default" : "outline"} 
                        onClick={() => setAlignment('auto')}
                        className="flex-1"
                      >
                        Automática
                      </Button>
                      <Button 
                        variant={alignment === 'manual' ? "default" : "outline"} 
                        onClick={() => setAlignment('manual')}
                        className="flex-1"
                      >
                        Manual
                      </Button>
                    </div>
                  </div>
                  
                  {alignment === 'manual' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="offset-x">Ajuste horizontal: {offsetX}</Label>
                        </div>
                        <Slider 
                          id="offset-x"
                          min={-50}
                          max={50}
                          step={1}
                          value={[offsetX]}
                          onValueChange={(value) => setOffsetX(value[0])}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="offset-y">Ajuste vertical: {offsetY}</Label>
                        </div>
                        <Slider 
                          id="offset-y"
                          min={-50}
                          max={50}
                          step={1}
                          value={[offsetY]}
                          onValueChange={(value) => setOffsetY(value[0])}
                        />
                      </div>
                    </div>
                  )}
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
                  ? "Procesando las imágenes, esto puede tomar unos minutos..." 
                  : "Visualiza el resultado de la prueba virtual"}
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
                    <img 
                      src={result.resultImage} 
                      alt="Resultado de la prueba virtual" 
                      className="max-h-96 mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <p>Los resultados aparecerán aquí después del procesamiento</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-center">
              <Button
                onClick={handleStartTryOn}
                disabled={isLoading || !modelImage || !clothingImage}
                className="w-full py-6 text-md group bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando prueba virtual...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Iniciar Prueba Virtual
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full md:w-auto hover:bg-primary/10"
              >
                <History className="mr-2 h-5 w-5" />
                Reiniciar
              </Button>
              
              {result && (
                <Button
                  variant="secondary"
                  onClick={handleSaveResult}
                  className="w-full md:w-auto bg-gradient-to-r from-primary/30 to-primary/20 hover:from-primary/40 hover:to-primary/30 shadow-sm"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Guardar Resultado
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/20 to-primary/5">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Pruebas Virtuales
              </CardTitle>
              <CardDescription>Revisa tus pruebas virtuales anteriores</CardDescription>
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
                        <img 
                          src={item.resultImage} 
                          alt={`Prueba virtual ${index + 1}`} 
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <CardFooter className="flex justify-between p-2">
                        <p className="text-xs text-gray-500">
                          ID: {item.requestId.substring(0, 8)}...
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-primary/10 flex items-center gap-1"
                        >
                          <Info className="h-4 w-4" />
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