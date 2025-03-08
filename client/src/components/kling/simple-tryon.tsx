import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { klingService, TryOnResult } from '@/services/kling/kling-service';

export function SimpleTryOnComponent() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, setImage: (value: string | null) => void) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Por favor, sube solo imágenes (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const checkTaskStatus = async (taskId: string) => {
    try {
      const result = await klingService.checkTryOnStatus(taskId);

      if (result.status === 'completed') {
        // Manejar las diferentes formas en que puede venir la URL de la imagen resultante
        if (result.images && result.images.length > 0) {
          const imageResult = result.images[0];
          if (typeof imageResult === 'string') {
            setResultImage(imageResult);
          } else if (typeof imageResult === 'object' && 'url' in imageResult) {
            setResultImage(imageResult.url);
          }
        }
        
        setIsLoading(false);
        toast({ title: "¡Proceso completado!", description: "Imagen generada correctamente." });
      } else if (result.status === 'failed') {
        setIsLoading(false);
        throw new Error(result.errorMessage || 'El proceso falló. Intenta con otras imágenes.');
      } else {
        // Si aún está procesando, consultar nuevamente en 3 segundos
        setTimeout(() => checkTaskStatus(taskId), 3000);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error verificando estado:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : 'Error desconocido verificando el estado', 
        variant: "destructive" 
      });
    }
  };

  const handleStartTryOn = async () => {
    if (!modelImage || !clothingImage) {
      toast({ 
        title: "Imágenes requeridas", 
        description: "Debes subir una imagen del modelo y una imagen de la prenda.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setIsLoading(true);
      setResultImage(null);
      
      const result = await klingService.startTryOn(modelImage, clothingImage);

      if (result.success && result.taskId) {
        toast({ 
          title: "Proceso iniciado", 
          description: "Las imágenes se están procesando. Este proceso puede tardar entre 10-20 segundos." 
        });
        checkTaskStatus(result.taskId);
      } else {
        setIsLoading(false);
        throw new Error(result.error || "Error al iniciar el proceso. Verifica las imágenes e intenta nuevamente.");
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Error iniciando Try-On:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : 'Error desconocido iniciando el proceso', 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="mb-2 font-medium">Imagen del modelo:</p>
          <div className="flex flex-col space-y-3">
            <Input 
              type="file" 
              onChange={(e) => handleFileUpload(e, setModelImage)} 
              className="cursor-pointer"
              accept="image/*"
              disabled={isLoading}
            />
            {modelImage && (
              <div className="aspect-square max-h-64 border rounded overflow-hidden flex items-center justify-center bg-muted">
                <img 
                  src={modelImage} 
                  alt="Imagen del modelo" 
                  className="object-contain max-h-full max-w-full" 
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 font-medium">Imagen de la prenda:</p>
          <div className="flex flex-col space-y-3">
            <Input 
              type="file" 
              onChange={(e) => handleFileUpload(e, setClothingImage)} 
              className="cursor-pointer"
              accept="image/*"
              disabled={isLoading}
            />
            {clothingImage && (
              <div className="aspect-square max-h-64 border rounded overflow-hidden flex items-center justify-center bg-muted">
                <img 
                  src={clothingImage} 
                  alt="Imagen de la prenda" 
                  className="object-contain max-h-full max-w-full" 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center pt-4">
        <Button 
          onClick={handleStartTryOn} 
          disabled={!modelImage || !clothingImage || isLoading}
          className="w-full md:w-auto"
        >
          <Sparkles className="mr-2 h-4 w-4" /> 
          {isLoading ? 'Procesando...' : 'Probar Virtualmente'}
        </Button>
        
        {isLoading && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Procesando imágenes. Este proceso puede tardar entre 10-20 segundos...
          </div>
        )}

        {resultImage && (
          <div className="mt-6 w-full">
            <p className="mb-2 font-medium">Resultado:</p>
            <div className="border rounded overflow-hidden flex items-center justify-center bg-muted">
              <img 
                src={resultImage} 
                alt="Resultado de la prueba virtual" 
                className="max-w-full" 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}