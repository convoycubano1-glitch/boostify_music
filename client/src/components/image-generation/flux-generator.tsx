/**
 * Flux Image Generator Component
 * 
 * Este componente proporciona una interfaz dedicada para generar imágenes exclusivamente con PiAPI Flux,
 * con integración de Firestore para almacenamiento y recuperación.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Image as ImageIcon, Save, RefreshCw } from 'lucide-react';
import { FluxModel, FluxTaskType, FluxLoraType, fluxService } from '@/lib/api/flux/flux-service';
import { ImageResult } from '@/lib/types/model-types';
import { fluxStorageService } from '@/lib/api/flux/flux-storage-service';
import { multiPlatformGenerator } from '@/lib/api/multi-platform-generator';
import { useToast } from '@/hooks/use-toast';

interface FluxGeneratorProps {
  onGeneratedImage?: (image: ImageResult) => void;
  onImageSelected?: (image: ImageResult) => void;
  isGenerating?: boolean;
  setIsGenerating?: (isGenerating: boolean) => void;
}

export function FluxGenerator({ 
  onGeneratedImage, 
  onImageSelected, 
  isGenerating: externalIsGenerating, 
  setIsGenerating: externalSetIsGenerating 
}: FluxGeneratorProps) {
  // Estado para inputs del formulario
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState<FluxModel>(FluxModel.FLUX1_DEV);
  const [loraType, setLoraType] = useState<FluxLoraType | ''>('');
  const [useLoRA, setUseLoRA] = useState(false);
  const [localIsGenerating, localSetIsGenerating] = useState(false);
  
  // Usar el estado externo si se proporciona, si no, usar el estado local
  const isGenerating = externalIsGenerating !== undefined ? externalIsGenerating : localIsGenerating;
  const setIsGenerating = externalSetIsGenerating || localSetIsGenerating;
  
  const [generatedImage, setGeneratedImage] = useState<ImageResult | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [savedImages, setSavedImages] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('generate');
  
  const { toast } = useToast();
  
  // Cargar imágenes guardadas al montar el componente
  useEffect(() => {
    async function loadSavedImages() {
      try {
        setIsLoading(true);
        const images = await fluxStorageService.getImages();
        // Filtrar imágenes sin URLs (tareas pendientes)
        const completedImages = images.filter(img => img.url && img.url.length > 0);
        console.log(`Loaded ${completedImages.length} saved Flux images`);
        setSavedImages(completedImages);
      } catch (error) {
        console.error('Error loading saved Flux images:', error);
        toast({
          title: 'Error al cargar imágenes',
          description: 'No se pudieron cargar las imágenes guardadas',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSavedImages();
  }, [toast]);
  
  // Verificar estado de tareas pendientes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (pendingTaskId) {
      interval = setInterval(async () => {
        try {
          const result = await fluxService.checkTaskStatus(pendingTaskId);
          
          console.log('Flux task status update:', result);
          
          if (result.data.status === 'completed' && result.data.output?.images && result.data.output.images.length > 0) {
            // Tarea completada, actualizar estado y limpiar intervalo
            const imageUrl = result.data.output.images[0];
            
            const completedImage: ImageResult = {
              url: imageUrl,
              provider: `flux-${model}`,
              taskId: pendingTaskId,
              status: 'COMPLETED',
              prompt: prompt,
              createdAt: new Date()
            };
            
            setGeneratedImage(completedImage);
            setPendingTaskId(null);
            setIsGenerating(false);
            
            if (onGeneratedImage) {
              onGeneratedImage(completedImage);
            }
            
            toast({
              title: 'Imagen Generada',
              description: 'Tu imagen ha sido generada exitosamente',
            });
            
            // Añadir a imágenes guardadas si no está ya
            setSavedImages(prev => {
              if (!prev.some(img => img.url === imageUrl)) {
                return [completedImage, ...prev];
              }
              return prev;
            });
            
            // Guardar en Firestore
            try {
              const firestoreId = await fluxStorageService.saveImage(completedImage);
              setGeneratedImage(prev => prev ? {...prev, firestoreId} : null);
            } catch (error) {
              console.error('Error saving completed Flux image to Firestore:', error);
            }
          } 
          else if (result.data.status === 'failed') {
            // Tarea fallida
            setPendingTaskId(null);
            setIsGenerating(false);
            toast({
              title: 'Generación Fallida',
              description: 'No se pudo generar la imagen. Por favor intenta de nuevo con un prompt diferente.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error checking Flux task status:', error);
        }
      }, 3000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pendingTaskId, onGeneratedImage, toast, model, prompt]);
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast({
        title: 'Se requiere descripción',
        description: 'Por favor, ingresa una descripción para la imagen',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Verificar si tenemos imágenes similares ya generadas
      const existingImages = await fluxStorageService.getImages();
      const similarImage = existingImages.find(img => 
        img.status === 'COMPLETED' && 
        img.url && 
        img.prompt && 
        img.prompt.toLowerCase().includes(prompt.toLowerCase().slice(0, 10))
      );
      
      if (similarImage) {
        console.log('Found similar existing Flux image:', similarImage);
        setGeneratedImage(similarImage);
        setIsGenerating(false);
        if (onGeneratedImage) {
          onGeneratedImage(similarImage);
        }
        toast({
          title: 'Imagen Similar Encontrada',
          description: 'Encontramos una imagen similar que fue generada previamente',
        });
        return;
      }
      
      // Configurar opciones según si usamos LoRA o no
      const taskType = useLoRA ? FluxTaskType.TXT2IMG_LORA : FluxTaskType.TXT2IMG;
      
      let options: any = {
        prompt: prompt,
        negative_prompt: negativePrompt,
        steps: 28,
        guidance_scale: 2.5
      };
      
      // Añadir configuración de LoRA si está habilitada
      if (useLoRA && loraType) {
        options.lora_settings = [
          {
            lora_type: loraType,
            lora_strength: 1
          }
        ];
      }
      
      console.log('Generating Flux image with options:', {model, taskType, options});
      
      // Generar imagen
      const response = await fluxService.generateTextToImage(options, model, taskType);
      
      console.log('Flux response:', response);
      
      if (response.data && response.data.task_id) {
        // Guardar el ID de tarea para verificaciones periódicas
        setPendingTaskId(response.data.task_id);
        
        // Crear resultado pendiente
        const pendingResult: ImageResult = {
          url: '',
          provider: `flux-${model}`,
          taskId: response.data.task_id,
          status: 'IN_PROGRESS',
          prompt: prompt,
          createdAt: new Date()
        };
        
        // Guardar tarea pendiente en Firestore
        try {
          const firestoreId = await fluxStorageService.saveImage(pendingResult);
          console.log('Saved pending Flux task to Firestore:', firestoreId);
        } catch (storageError) {
          console.error('Error saving pending Flux task to Firestore:', storageError);
        }
        
        toast({
          title: 'Generación iniciada',
          description: 'Tu imagen está siendo generada. Esto puede tomar unos segundos...',
        });
      } else {
        throw new Error('No se recibió ID de tarea de Flux');
      }
    } catch (error) {
      console.error('Error generating image with Flux:', error);
      setIsGenerating(false);
      toast({
        title: 'Error de Generación',
        description: error instanceof Error ? error.message : 'No se pudo generar la imagen',
        variant: 'destructive'
      });
    }
  };
  
  // Manejar selección de imagen desde la galería
  const handleImageSelect = (image: ImageResult) => {
    setGeneratedImage(image);
    if (onImageSelected) {
      onImageSelected(image);
    }
    setActiveTab('generate');
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Flux AI Image Generator
        </CardTitle>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate">Generar</TabsTrigger>
            <TabsTrigger value="gallery">Galería ({savedImages.length})</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="generate">
          <CardContent className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Textarea 
                  placeholder="Describe la imagen que quieres generar con detalle..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              
              <div>
                <Textarea 
                  placeholder="Prompt negativo (opcional) - Cosas que NO quieres en la imagen..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo Flux</label>
                  <Select 
                    value={model} 
                    onValueChange={(value) => setModel(value as FluxModel)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FluxModel.FLUX1_DEV}>Flux1 Dev (Calidad)</SelectItem>
                      <SelectItem value={FluxModel.FLUX1_SCHNELL}>Flux1 Schnell (Rápido)</SelectItem>
                      <SelectItem value={FluxModel.FLUX1_DEV_ADVANCED}>Flux1 Advanced (Para LoRA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Usar LoRA</label>
                    <input 
                      type="checkbox" 
                      checked={useLoRA}
                      onChange={(e) => {
                        setUseLoRA(e.target.checked);
                        // Si activamos LoRA, forzar modelo avanzado
                        if (e.target.checked) {
                          setModel(FluxModel.FLUX1_DEV_ADVANCED);
                        }
                      }}
                      className="h-4 w-4"
                    />
                  </div>
                  
                  {useLoRA && (
                    <Select 
                      value={loraType} 
                      onValueChange={(value) => setLoraType(value as FluxLoraType)}
                      disabled={!useLoRA}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estilo LoRA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={FluxLoraType.ANIME}>Anime</SelectItem>
                        <SelectItem value={FluxLoraType.ART}>Arte</SelectItem>
                        <SelectItem value={FluxLoraType.DISNEY}>Disney</SelectItem>
                        <SelectItem value={FluxLoraType.MJV6}>MidJourney v6</SelectItem>
                        <SelectItem value={FluxLoraType.REALISM}>Realismo</SelectItem>
                        <SelectItem value={FluxLoraType.SCENERY}>Paisajes</SelectItem>
                        <SelectItem value={FluxLoraType.CYBERPUNK_ANIME}>Cyberpunk Anime</SelectItem>
                        <SelectItem value={FluxLoraType.GRAPHIC_PORTRAIT}>Retratos Gráficos</SelectItem>
                        <SelectItem value={FluxLoraType.FRACTAL}>Geometría Fractal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isGenerating || !prompt.trim() || (useLoRA && !loraType)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : 'Generar Imagen'}
              </Button>
            </form>
            
            {generatedImage && generatedImage.url && (
              <div className="mt-6 space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={generatedImage.url} 
                    alt={generatedImage.prompt || 'Imagen generada'} 
                    className="w-full h-auto"
                  />
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {generatedImage.prompt && (
                    <p className="mb-1"><span className="font-medium">Prompt:</span> {generatedImage.prompt}</p>
                  )}
                  <p className="mb-1"><span className="font-medium">Provider:</span> {generatedImage.provider}</p>
                  <p><span className="font-medium">Creada:</span> {generatedImage.createdAt.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="gallery">
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : savedImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {savedImages.map((image) => (
                  <div 
                    key={image.firestoreId || image.url} 
                    className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageSelect(image)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.prompt || 'Imagen generada'} 
                      className="w-full h-auto aspect-square object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <ImageIcon className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">No se encontraron imágenes guardadas</p>
                <p className="text-sm text-gray-400 mt-1">Genera algunas imágenes para verlas aquí</p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <div className="text-xs text-gray-500">
          Powered by Flux AI
        </div>
        {generatedImage && generatedImage.url && (
          <Button variant="outline" size="sm" onClick={() => window.open(generatedImage.url, '_blank')}>
            <Save className="h-4 w-4 mr-2" />
            Ver Imagen Completa
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}