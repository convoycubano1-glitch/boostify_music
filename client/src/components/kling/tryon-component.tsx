import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Loader2, Upload, Camera, Image as ImageIcon, Shirt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { klingService, TryOnRequest, TryOnResult } from '@/services/kling/kling-service';

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

      if (status.status === 'completed') {
        // La tarea se completó con éxito
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        
        const resultData: TryOnResult = {
          resultImage: status.status === 'completed' ? (status as any).resultUrl : '',
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
        
        toast({
          title: "Error en el proceso",
          description: status.error || "Ha ocurrido un error durante la generación de la imagen.",
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
                    Iniciar Prueba Virtual
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
              <CardTitle>Historial de Pruebas Virtuales</CardTitle>
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