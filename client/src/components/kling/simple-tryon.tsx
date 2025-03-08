import { useState, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Camera, Shirt, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente simplificado de Virtual Try-On
 * 
 * Esta implementación usa un enfoque más directo:
 * 1. Convierte las imágenes a JPEG usando Canvas
 * 2. Hace llamadas directas a la API de Kling
 * 3. Elimina la complejidad excesiva de validación
 */
export function SimpleTryOnComponent() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const modelInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Función para manejar la carga de archivos
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor, sube solo archivos de imagen (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Convertir a Data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        // Convertir a JPEG simple usando Canvas
        convertToJpeg(dataUrl, setImage);
      }
    };
    reader.readAsDataURL(file);
  };

  // Función mejorada para convertir a JPEG utilizando el servidor para asegurar compatibilidad con Kling API
  const convertToJpeg = async (
    imageDataUrl: string,
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    try {
      // Mostrar un toast para indicar que se está procesando la imagen
      toast({
        title: "Procesando imagen...",
        description: "Convirtiendo imagen para máxima compatibilidad con Kling API",
      });
      
      // Ahora envía la imagen al servidor para que utilice el procesador de imágenes especializado
      const response = await axios.post('/api/kling/process-image', {
        imageDataUrl
      });
      
      if (response.data.success && response.data.processedImage) {
        // Usar imagen procesada en formato JPEG puro compatible con Kling
        setImage(response.data.processedImage);
        
        console.log('Imagen procesada por el servidor para compatibilidad con Kling API:', 
          `${response.data.processedImage.substring(0, 30)}...`,
          `Dimensiones: ${response.data.width}x${response.data.height}`);
          
        toast({
          title: "Imagen lista",
          description: `Imagen procesada correctamente (${response.data.width}x${response.data.height})`,
        });
      } else {
        // Usar método de canvas como fallback si el servidor no puede procesar
        processImageWithCanvas(imageDataUrl, setImage);
      }
    } catch (error) {
      console.error('Error al procesar imagen en el servidor:', error);
      // Usar método de canvas como fallback
      processImageWithCanvas(imageDataUrl, setImage);
    }
  };
  
  // Método de fallback usando Canvas si la conversión del servidor falla
  const processImageWithCanvas = (
    imageDataUrl: string,
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const img = new Image();
    img.onload = () => {
      // Crear canvas del mismo tamaño que la imagen
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Dibujar imagen en canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fondo blanco para eliminar transparencias
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Dibujar imagen
        ctx.drawImage(img, 0, 0);
        
        // Convertir a JPEG con calidad 0.95 para mayor compatibilidad
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setImage(jpegDataUrl);
        
        console.log('Imagen convertida con Canvas a JPEG:', 
          `${jpegDataUrl.substring(0, 30)}...`,
          `Dimensiones: ${canvas.width}x${canvas.height}`);
          
        toast({
          title: "Imagen procesada localmente",
          description: "La imagen se procesó en tu navegador. La compatibilidad con Kling API podría ser limitada.",
          variant: "warning"
        });
      }
    };
    img.src = imageDataUrl;
  };

  // Función para iniciar el proceso de Try-On
  const handleStartTryOn = async () => {
    if (!modelImage || !clothingImage) {
      toast({
        title: "Imágenes requeridas",
        description: "Por favor, sube una imagen de modelo y una prenda",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Preparar datos directamente para la API de Kling
      const requestBody = {
        input: {
          model_input: modelImage,
          dress_input: clothingImage,
          batch_size: 1
        }
      };
      
      console.log('Enviando solicitud Try-On con imágenes', {
        modelImageLength: modelImage?.length || 0,
        clothingImageLength: clothingImage?.length || 0
      });
      
      // Hacer la llamada a través del proxy (para manejar CORS y proteger la API key)
      const response = await axios.post('/api/kling/try-on/start', requestBody);
      
      if (response.data.success && response.data.taskId) {
        setTaskId(response.data.taskId);
        toast({
          title: "Proceso iniciado",
          description: "Procesando imágenes. Este proceso puede tardar unos minutos.",
        });
        
        // Iniciar polling para verificar estado
        checkTaskStatus(response.data.taskId);
      } else {
        throw new Error(response.data.error || "Error al iniciar proceso");
      }
    } catch (error: any) {
      console.error('Error iniciando Try-On:', error);
      setIsLoading(false);
      setError(error.message || "Error al procesar las imágenes");
      
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al iniciar el proceso",
        variant: "destructive",
      });
    }
  };

  // Función para verificar el estado de la tarea
  const checkTaskStatus = async (taskId: string) => {
    try {
      const response = await axios.post('/api/kling/try-on/status', { taskId });
      
      if (response.data.status === 'completed') {
        setIsLoading(false);
        
        // Extraer URL de imagen resultante
        if (response.data.images && response.data.images.length > 0) {
          const resultUrl = response.data.images[0].url || response.data.images[0];
          setResultImage(resultUrl);
          
          toast({
            title: "¡Proceso completado!",
            description: "La imagen ha sido generada correctamente",
          });
        } else {
          throw new Error("No se encontró imagen resultante en la respuesta");
        }
      } else if (response.data.status === 'failed') {
        setIsLoading(false);
        const errorMsg = response.data.errorMessage || "El proceso falló sin un mensaje específico";
        setError(errorMsg);
        
        toast({
          title: "Error en procesamiento",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        // Seguir verificando si aún está en proceso
        setTimeout(() => checkTaskStatus(taskId), 3000);
      }
    } catch (error: any) {
      console.error('Error verificando estado:', error);
      setIsLoading(false);
      setError(error.message || "Error al verificar el estado del proceso");
      
      toast({
        title: "Error",
        description: error.message || "Error al verificar el estado del proceso",
        variant: "destructive",
      });
    }
  };

  // Función para reiniciar el proceso
  const handleReset = () => {
    setModelImage(null);
    setClothingImage(null);
    setResultImage(null);
    setTaskId(null);
    setError(null);
    setIsLoading(false);
    
    // Reset file inputs
    if (modelInputRef.current) modelInputRef.current.value = '';
    if (clothingInputRef.current) clothingInputRef.current.value = '';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-card">
      <CardHeader>
        <CardTitle className="text-center">Virtual Try-On Simplificado</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Imagen del Modelo */}
          <div className="space-y-4">
            <Label 
              htmlFor="model-image" 
              className="block text-lg font-medium mb-2 flex items-center gap-2"
            >
              <Camera className="h-5 w-5" /> Imagen de Modelo
            </Label>
            
            <div className="flex flex-col items-center gap-4">
              <div className="border-2 border-dashed border-primary/50 rounded-lg w-full h-60 relative flex items-center justify-center overflow-hidden">
                {modelImage ? (
                  <img 
                    src={modelImage} 
                    alt="Modelo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Sube una foto tuya o de un modelo</p>
                  </div>
                )}
              </div>
              
              <Input
                id="model-image"
                type="file"
                accept="image/*"
                ref={modelInputRef}
                onChange={(e) => handleFileUpload(e, setModelImage)}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Imagen de Prenda */}
          <div className="space-y-4">
            <Label 
              htmlFor="clothing-image" 
              className="block text-lg font-medium mb-2 flex items-center gap-2"
            >
              <Shirt className="h-5 w-5" /> Imagen de Prenda
            </Label>
            
            <div className="flex flex-col items-center gap-4">
              <div className="border-2 border-dashed border-primary/50 rounded-lg w-full h-60 relative flex items-center justify-center overflow-hidden">
                {clothingImage ? (
                  <img 
                    src={clothingImage} 
                    alt="Prenda" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Shirt className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Sube una imagen de prenda de vestir</p>
                  </div>
                )}
              </div>
              
              <Input
                id="clothing-image"
                type="file"
                accept="image/*"
                ref={clothingInputRef}
                onChange={(e) => handleFileUpload(e, setClothingImage)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        
        {/* Imagen Resultado */}
        {resultImage && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Resultado
            </h3>
            
            <div className="border rounded-lg overflow-hidden">
              <img 
                src={resultImage} 
                alt="Resultado" 
                className="w-full max-h-[500px] object-contain"
              />
            </div>
          </div>
        )}
        
        {/* Mensaje de Error */}
        {error && (
          <div className="mt-4 p-4 bg-destructive/20 text-destructive rounded-md">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          onClick={handleReset}
          variant="outline"
          disabled={isLoading}
        >
          Reiniciar
        </Button>
        
        <Button
          onClick={handleStartTryOn}
          disabled={isLoading || !modelImage || !clothingImage}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Probar Virtualmente
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}