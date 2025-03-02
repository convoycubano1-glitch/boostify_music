import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { 
  ImageIcon, 
  VideoIcon, 
  Pencil, 
  RefreshCw, 
  Download, 
  Share2, 
  FilmIcon, 
  PictureInPicture2, 
  CirclePlay,
  Loader2,
  Save,
  CheckCircle,
  CloudUpload
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { 
  generateImage, 
  generateVideo, 
  saveGeneratedContent,
  checkTaskStatus,
  multiPlatformGenerator,
  ImageResult,
  VideoResult 
} from '@/lib/api/multi-platform-generator';
import { FreepikModel } from '@/lib/api/freepik-service';
import { 
  saveGeneratedImage, 
  getGeneratedImages, 
  saveGeneratedVideo, 
  getGeneratedVideos,
  saveMediaToLocalStorage
} from '@/lib/api/generated-images-service';
import { FreepikGenerator, FluxGenerator } from '@/components/image-generation';

// Form validation schemas
const imageFormSchema = z.object({
  prompt: z.string().min(3, { message: 'Prompt must be at least 3 characters long' }),
  negativePrompt: z.string().optional(),
  apiProvider: z.enum(['fal', 'freepik', 'kling']),
  imageSize: z.enum(['small', 'medium', 'large']).default('medium'),
  imageCount: z.number().min(1).max(4).default(1),
  freepikModel: z.nativeEnum(FreepikModel).optional(),
});

const videoFormSchema = z.object({
  prompt: z.string().min(3, { message: 'Prompt must be at least 3 characters long' }),
  apiProvider: z.enum(['luma', 'kling']),
  duration: z.number().min(3).max(15).default(5),
  style: z.enum(['realistic', 'cinematic', 'anime', 'cartoon']).default('cinematic'),
});

type ImageFormValues = z.infer<typeof imageFormSchema>;
type VideoFormValues = z.infer<typeof videoFormSchema>;

export default function ImageGeneratorPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'freepik' | 'flux'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ImageResult[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<VideoResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>('');

  // Image generation form
  const imageForm = useForm<ImageFormValues>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      prompt: '',
      negativePrompt: '',
      apiProvider: 'fal',
      imageSize: 'medium',
      imageCount: 1,
      freepikModel: FreepikModel.MYSTIC,
    },
  });

  // Video generation form
  const videoForm = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      prompt: '',
      apiProvider: 'luma',
      duration: 5,
      style: 'cinematic',
    },
  });

  // Handle image generation
  const onImageSubmit = async (values: ImageFormValues) => {
    try {
      setIsGenerating(true);
      setProgressMessage('Preparing your request...');
      
      // Create toast notification
      toast({
        title: 'Generating image',
        description: `Using ${values.apiProvider} to create your vision...`,
      });

      // Call the API to generate the image
      const result = await generateImage({
        prompt: values.prompt,
        negativePrompt: values.negativePrompt,
        apiProvider: values.apiProvider,
        imageSize: values.imageSize,
        imageCount: values.imageCount,
        freepikModel: values.apiProvider === 'freepik' ? values.freepikModel : undefined,
      });

      console.log('Resultado de generación:', result);
      
      // Verificar si es una tarea asíncrona (como en el caso de Freepik)
      if (result.taskId && (!result.url || result.url === '') && result.status !== 'FAILED') {
        console.log('Tarea de generación iniciada, esperando resultados...', result);
        
        // Es una tarea pendiente, actualizar el mensaje de estado
        setProgressMessage(`Generando imagen con ${result.provider}. Esto puede tardar unos segundos...`);
        
        // Agregar la imagen en estado "pendiente" a la cola
        setGeneratedImages(prev => [{
          ...result,
          status: 'IN_PROGRESS',
        }, ...prev]);
        
        // Mostrar notificación de que la tarea se inició
        toast({
          title: 'Generación iniciada',
          description: 'La imagen se está generando. Se actualizará automáticamente cuando esté lista.',
          variant: 'default',
        });
        
        // No continuamos con el resto del proceso, ya que la verificación periódica
        // se encargará de actualizar la imagen cuando esté lista
        setIsGenerating(false);
        return;
      }
      
      // Si no tenemos URL (pero no es una tarea pendiente), es un error
      if (!result || !result.url) {
        console.error('Error en generación de imagen:', result);
        throw new Error('La URL de la imagen generada no está disponible');
      }
      
      console.log('Imagen generada con éxito:', result);

      // Actualizar inmediatamente el estado con la nueva imagen para mostrarla
      setGeneratedImages(prev => [result, ...prev]);
      
      // Intentar guardar la imagen después de haberla mostrado
      try {
        const firestoreId = await saveGeneratedContent(result, 'image');
        
        // Actualizar la imagen en el estado con su ID
        if (firestoreId) {
          setGeneratedImages(prev => 
            prev.map(item => 
              item.url === result.url 
                ? { ...item, firestoreId } 
                : item
            )
          );
        }
      } catch (saveError) {
        console.error('Error saving image to storage:', saveError);
        // No mostramos error aquí para no interrumpir la experiencia del usuario
        // La imagen ya está en la pantalla
      }

      // Show success notification
      toast({
        title: 'Image generated successfully',
        description: 'Your image is ready to view and download.',
        variant: 'success',
      });
      
      // Reset the progress message
      setProgressMessage('');
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Generation failed',
        description: 'Could not generate the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle video generation
  const onVideoSubmit = async (values: VideoFormValues) => {
    try {
      setIsGenerating(true);
      setProgressMessage('Preparing your video request...');
      
      // Create toast notification
      toast({
        title: 'Generating video',
        description: `Using ${values.apiProvider} to create your video...`,
      });

      // Call the API to generate the video
      const result = await generateVideo({
        prompt: values.prompt,
        apiProvider: values.apiProvider,
        duration: values.duration,
        style: values.style,
      });

      // Verificar que la URL exista
      if (!result || !result.url) {
        console.error('Video generation returned invalid result:', result);
        throw new Error('Generated video URL is missing');
      }
      
      console.log('Video generated successfully:', result);

      // Actualizar inmediatamente el estado con el nuevo video para mostrarlo
      setGeneratedVideos(prev => [result, ...prev]);
      
      // Intentar guardar el video después de haberlo mostrado
      try {
        const firestoreId = await saveGeneratedContent(result, 'video');
        
        // Actualizar el video en el estado con su ID
        if (firestoreId) {
          setGeneratedVideos(prev => 
            prev.map(item => 
              item.url === result.url 
                ? { ...item, firestoreId } 
                : item
            )
          );
        }
      } catch (saveError) {
        console.error('Error saving video to storage:', saveError);
        // No mostramos error aquí para no interrumpir la experiencia del usuario
        // El video ya está en la pantalla
      }

      // Show success notification
      toast({
        title: 'Video generated successfully',
        description: 'Your video is ready to view and download.',
        variant: 'success',
      });
      
      // Reset the progress message
      setProgressMessage('');
    } catch (error) {
      console.error('Error generating video:', error);
      toast({
        title: 'Generation failed',
        description: 'Could not generate the video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Verificar periódicamente el estado de tareas pendientes
  useEffect(() => {
    // Función para verificar tareas pendientes
    async function checkPendingTasks() {
      // Filtrar imágenes en proceso
      const pendingImages = generatedImages.filter(img => 
        img.status === 'IN_PROGRESS' || 
        img.status === 'processing' ||
        (typeof img.provider === 'string' && img.provider.includes('processing')));
      
      if (pendingImages.length > 0) {
        console.log(`Verificando ${pendingImages.length} tareas pendientes...`);
        
        for (const pendingImg of pendingImages) {
          if (pendingImg.taskId) {
            try {
              // Determinar el proveedor basado en la cadena del proveedor
              const provider = pendingImg.provider.includes('freepik') 
                ? 'freepik' 
                : (pendingImg.provider.includes('kling') ? 'kling' : 'fal');
              
              console.log(`Verificando tarea ${pendingImg.taskId} de ${provider}...`);
              
              // Verificar estado actual
              const result = await multiPlatformGenerator.checkTaskStatus(
                pendingImg.taskId, 
                provider
              );
              
              if (result && result.url) {
                console.log('Imagen generada con éxito:', result);
                
                // Actualizar en el estado
                setGeneratedImages(prev => 
                  prev.map(img => img.taskId === pendingImg.taskId 
                    ? {
                        ...img,
                        url: result.url,
                        status: 'COMPLETED',
                        provider: provider // Sin "(processing)"
                      } 
                    : img
                  )
                );
                
                // Notificar al usuario
                toast({
                  title: '¡Imagen generada!',
                  description: 'Tu imagen ha sido generada con éxito.',
                  variant: 'default',
                });
                
                // Guardar en localStorage
                const updatedImage = {
                  ...pendingImg,
                  url: result.url, 
                  status: 'COMPLETED',
                  provider: provider
                };
                saveMediaToLocalStorage('image', [updatedImage]);
              } 
              else if (result && (result.status === 'FAILED' || result.status === 'failed')) {
                console.error('La generación falló:', pendingImg.taskId);
                
                // Marcar como fallida
                setGeneratedImages(prev => 
                  prev.map(img => img.taskId === pendingImg.taskId 
                    ? {
                        ...img,
                        status: 'FAILED',
                        provider: `${provider} (error)`
                      } 
                    : img
                  )
                );
              }
            } catch (error) {
              console.error('Error al verificar tarea:', error);
            }
          }
        }
      }
    }
    
    // Ejecutar la verificación inicialmente y cada 5 segundos
    checkPendingTasks();
    const intervalId = setInterval(checkPendingTasks, 5000);
    
    // Limpiar el intervalo al desmontar
    return () => clearInterval(intervalId);
  }, [generatedImages, toast]);
  
  // Load saved images and videos from Firestore when component mounts
  useEffect(() => {
    async function loadSavedMedia() {
      // Cargar imágenes guardadas (de Firestore y/o localStorage)
      try {
        const savedImages = await getGeneratedImages();
        if (savedImages.length > 0) {
          console.log(`Cargadas ${savedImages.length} imágenes guardadas`);
          console.log('Imágenes obtenidas:', savedImages);
          
          // Actualizar el estado directamente con todas las imágenes para evitar problemas de sincronización
          setGeneratedImages(savedImages);
          
          // Mostrar un mensaje informativo si hay imágenes
          if (savedImages.length > 0) {
            toast({
              title: 'Imágenes cargadas',
              description: `Se cargaron ${savedImages.length} imágenes guardadas.`,
              variant: 'default',
            });
          }
        }
      } catch (error) {
        console.error('Error getting generated images:', error);
        // No mostrar notificación de error para evitar abrumar al usuario
      }

      // Cargar videos guardados (de Firestore y/o localStorage)
      try {
        const savedVideos = await getGeneratedVideos();
        if (savedVideos.length > 0) {
          console.log(`Cargados ${savedVideos.length} videos guardados`);
          
          setGeneratedVideos(prev => {
            // Combine with any existing videos, avoiding duplicates by URL
            const existingUrls = new Set(prev.map(vid => vid.url));
            const newVideos = savedVideos.filter(vid => !existingUrls.has(vid.url));
            return [...prev, ...newVideos];
          });
          
          // Mostrar un mensaje informativo si hay videos
          if (savedVideos.length > 0) {
            toast({
              title: 'Videos cargados',
              description: `Se cargaron ${savedVideos.length} videos guardados.`,
              variant: 'default',
            });
          }
        }
      } catch (error) {
        console.error('Error getting generated videos:', error);
        // No mostrar notificación de error para evitar abrumar al usuario
      }
    }
    
    loadSavedMedia();
  }, [toast]);
  
  // Handle image selection
  const handleImageSelect = (image: ImageResult) => {
    setSelectedImage(image);
    setShowDetailDialog(true);
  };

  // Handle video selection
  const handleVideoSelect = (video: VideoResult) => {
    setSelectedVideo(video);
    setShowDetailDialog(true);
  };
  
  // Save content to persistent storage (Firestore with localStorage fallback)
  const handleSaveToFirestore = async (content: ImageResult | VideoResult, type: 'image' | 'video') => {
    // Primero verificamos si ya está guardado para evitar operaciones duplicadas
    if (content.firestoreId) {
      toast({
        title: `${type === 'image' ? 'Image' : 'Video'} already saved`,
        description: `This ${type} is already in your collection.`,
        variant: 'default',
      });
      return;
    }
    
    try {
      let firestoreId: string;
      let storageLocation: string;
      
      // Intentar guardar el contenido (Firestore con fallback a localStorage)
      if (type === 'image') {
        firestoreId = await saveGeneratedImage(content as ImageResult);
        storageLocation = firestoreId.startsWith('local_') ? 'device' : 'cloud';
        
        toast({
          title: 'Image saved successfully',
          description: `Your image has been saved to your ${storageLocation === 'cloud' ? 'cloud' : 'local device'} collection.`,
          variant: 'success',
        });
      } else {
        firestoreId = await saveGeneratedVideo(content as VideoResult);
        storageLocation = firestoreId.startsWith('local_') ? 'device' : 'cloud';
        
        toast({
          title: 'Video saved successfully',
          description: `Your video has been saved to your ${storageLocation === 'cloud' ? 'cloud' : 'local device'} collection.`,
          variant: 'success',
        });
      }
      
      // Actualizar la interfaz con el nuevo ID
      if (type === 'image') {
        setGeneratedImages(prev => 
          prev.map(item => 
            item.url === content.url 
              ? { ...item, firestoreId } 
              : item
          )
        );
      } else {
        setGeneratedVideos(prev => 
          prev.map(item => 
            item.url === content.url 
              ? { ...item, firestoreId } 
              : item
          )
        );
      }
      
      // Mensaje adicional si se usó almacenamiento local
      if (storageLocation === 'device') {
        console.log(`${type} saved to localStorage instead of Firestore due to permission issues`);
      }
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      
      // Mensaje de error más específico
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isPermissionError = errorMessage.includes('permission-denied') || 
                               errorMessage.includes('PERMISSION_DENIED');
      
      toast({
        title: `Could not save ${type}`,
        description: isPermissionError 
          ? `Permission denied. Try logging in or check your account permissions.` 
          : `There was a problem saving your ${type}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Download content
  const handleDownload = (url: string, type: 'image' | 'video') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `generated-${type}-${Date.now()}.${type === 'image' ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download started',
      description: `Your ${type} is being downloaded.`,
    });
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'fal':
        return <PictureInPicture2 className="h-4 w-4" />;
      case 'freepik':
        return <ImageIcon className="h-4 w-4" />;
      case 'kling':
        return <FilmIcon className="h-4 w-4" />;
      case 'luma':
        return <CirclePlay className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">AI Media Generator</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Create stunning images and videos with our multi-platform AI generator
      </p>

      <Tabs defaultValue="image" value={activeTab} onValueChange={(value) => setActiveTab(value as 'image' | 'video' | 'freepik' | 'flux')}>
        <TabsList className="mb-4">
          <TabsTrigger value="image">
            <ImageIcon className="mr-2 h-4 w-4" />
            Multi-Platform
          </TabsTrigger>
          <TabsTrigger value="freepik">
            <ImageIcon className="mr-2 h-4 w-4" />
            Freepik
          </TabsTrigger>
          <TabsTrigger value="flux">
            <PictureInPicture2 className="mr-2 h-4 w-4" />
            Flux AI
          </TabsTrigger>
          <TabsTrigger value="video">
            <VideoIcon className="mr-2 h-4 w-4" />
            Videos
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left panel: Generation form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'image' 
                    ? 'Image Generator' 
                    : activeTab === 'freepik' 
                      ? 'Freepik Generator'
                      : activeTab === 'flux'
                        ? 'Flux AI Generator'
                        : 'Video Generator'
                  }
                </CardTitle>
                <CardDescription>
                  {activeTab === 'image' 
                    ? 'Create AI-powered images with our multi-model generator.' 
                    : activeTab === 'freepik'
                      ? 'Generate high-quality images with dedicated Freepik models.'
                      : activeTab === 'flux'
                        ? 'Advanced AI image generation with LoRA and ControlNet features.'
                        : 'Generate dynamic videos with advanced AI technology.'}
                </CardDescription>
              </CardHeader>
              
              <TabsContent value="freepik" className="mt-0">
                <CardContent>
                  <FreepikGenerator 
                    onGeneratedImage={(image) => {
                      // Add the newly generated image to our images list
                      setGeneratedImages(prev => [image, ...prev]);
                      // Also set it as selected image
                      setSelectedImage(image);
                      // Stop loading state
                      setIsGenerating(false);
                    }}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                  />
                </CardContent>
              </TabsContent>
              
              <TabsContent value="flux" className="mt-0">
                <CardContent>
                  <FluxGenerator 
                    onGeneratedImage={(image) => {
                      // Add the newly generated image to our images list
                      setGeneratedImages(prev => [image, ...prev]);
                      // Also set it as selected image
                      setSelectedImage(image);
                      // Stop loading state
                      setIsGenerating(false);
                    }}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                  />
                </CardContent>
              </TabsContent>
              
              <TabsContent value="image" className="mt-0">
                <CardContent>
                  <Form {...imageForm}>
                    <form onSubmit={imageForm.handleSubmit(onImageSubmit)} className="space-y-4">
                      <FormField
                        control={imageForm.control}
                        name="prompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the image you want to generate..." 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Be as detailed as possible for best results
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={imageForm.control}
                        name="negativePrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Elements to Avoid (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Elements to exclude from the image..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Specify elements you don't want in the image
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={imageForm.control}
                        name="apiProvider"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Generation Engine</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="fal" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Fal.ai
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="freepik" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Freepik
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="kling" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Kling
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Conditional Freepik model selection */}
                      {imageForm.watch('apiProvider') === 'freepik' && (
                        <FormField
                          control={imageForm.control}
                          name="freepikModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Freepik Model</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select model" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={FreepikModel.MYSTIC}>Mystic</SelectItem>
                                  <SelectItem value={FreepikModel.IMAGEN3}>Imagen3</SelectItem>
                                  <SelectItem value={FreepikModel.CLASSIC}>Classic</SelectItem>
                                  <SelectItem value={FreepikModel.FLUX_DEV}>Flux Dev</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Each model has different strengths and styles
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={imageForm.control}
                          name="imageSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Image Size</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={imageForm.control}
                          name="imageCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Images: {field.value}</FormLabel>
                              <FormControl>
                                <Slider
                                  min={1}
                                  max={4}
                                  step={1}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Generate Image
                          </>
                        )}
                      </Button>
                      
                      {/* Progress indicator for image generation */}
                      {isGenerating && activeTab === 'image' && (
                        <div className="mt-4 p-4 bg-muted rounded-md">
                          <div className="flex items-center space-x-3">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <div>
                              <p className="text-sm font-medium">Generating your image...</p>
                              {progressMessage && (
                                <p className="text-xs text-muted-foreground">{progressMessage}</p>
                              )}
                            </div>
                          </div>
                          <Progress className="mt-2" value={progressMessage ? 75 : 30} />
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </TabsContent>

              <TabsContent value="video" className="mt-0">
                <CardContent>
                  <Form {...videoForm}>
                    <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-4">
                      <FormField
                        control={videoForm.control}
                        name="prompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Video Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the video you want to generate..." 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Be detailed about scenes, actions, and style
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={videoForm.control}
                        name="apiProvider"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Video Engine</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="luma" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Luma
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="kling" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Kling
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={videoForm.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration: {field.value}s</FormLabel>
                              <FormControl>
                                <Slider
                                  min={3}
                                  max={15}
                                  step={1}
                                  defaultValue={[field.value]}
                                  onValueChange={(vals) => field.onChange(vals[0])}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={videoForm.control}
                          name="style"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Video Style</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select style" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="realistic">Realistic</SelectItem>
                                  <SelectItem value="cinematic">Cinematic</SelectItem>
                                  <SelectItem value="anime">Anime</SelectItem>
                                  <SelectItem value="cartoon">Cartoon</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <VideoIcon className="mr-2 h-4 w-4" />
                            Generate Video
                          </>
                        )}
                      </Button>
                      
                      {/* Progress indicator for video generation */}
                      {isGenerating && activeTab === 'video' && (
                        <div className="mt-4 p-4 bg-muted rounded-md">
                          <div className="flex items-center space-x-3">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <div>
                              <p className="text-sm font-medium">Generating your video...</p>
                              {progressMessage && (
                                <p className="text-xs text-muted-foreground">{progressMessage}</p>
                              )}
                            </div>
                          </div>
                          <Progress className="mt-2" value={progressMessage ? 75 : 30} />
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </TabsContent>
            </Card>
          </div>

          {/* Right panel: Results gallery */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  {activeTab === 'image' || activeTab === 'freepik' ? 'Generated Images' : 'Generated Videos'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'image' || activeTab === 'freepik'
                    ? 'View and manage your AI-generated images'
                    : 'View and manage your AI-generated videos'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <TabsContent value="freepik" className="mt-0">
                  {generatedImages.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold">No Freepik images yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Generate your first Freepik image to see it here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedImages
                        .filter(img => img.provider && img.provider.toLowerCase().includes('freepik'))
                        .map((image, index) => (
                          <div 
                            key={`freepik-${index}`} 
                            className="relative group cursor-pointer overflow-hidden rounded-lg"
                            onClick={() => handleImageSelect(image)}
                          >
                            {image.url ? (
                              <img 
                                src={image.url} 
                                alt={`Generated Freepik image ${index + 1}`} 
                                className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  console.error(`Error loading Freepik image: ${image.url}`);
                                  e.currentTarget.src = '/assets/freepik__boostify_music_organe_abstract_icon.png';
                                }}
                              />
                            ) : (
                              <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                <ImageIcon className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(image.url, 'image');
                                }}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveToFirestore(image, 'image');
                                }}
                                disabled={!!image.firestoreId}
                              >
                                {image.firestoreId ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                    Saved
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-1" />
                                    Save
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center">
                              {getProviderIcon(image.provider)}
                              <span className="ml-1 capitalize">{image.provider}</span>
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="image" className="mt-0">
                  {generatedImages.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold">No images yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Generate your first image to see it here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedImages.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative group cursor-pointer overflow-hidden rounded-lg"
                          onClick={() => handleImageSelect(image)}
                        >
                          {/* Agregar fallback de imagen */}
                          {image.url ? (
                            <img 
                              src={image.url} 
                              alt={`Generated image ${index + 1}`} 
                              className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                console.error(`Error loading image: ${image.url}`);
                                // Establecer una imagen de fallback local
                                e.currentTarget.src = '/assets/freepik__boostify_music_organe_abstract_icon.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(image.url, 'image');
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveToFirestore(image, 'image');
                              }}
                              disabled={!!image.firestoreId}
                            >
                              {image.firestoreId ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center">
                            {getProviderIcon(image.provider)}
                            <span className="ml-1 capitalize">{image.provider}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="video" className="mt-0">
                  {generatedVideos.length === 0 ? (
                    <div className="text-center py-12">
                      <VideoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold">No videos yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Generate your first video to see it here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedVideos.map((video, index) => (
                        <div 
                          key={index} 
                          className="relative group cursor-pointer overflow-hidden rounded-lg"
                          onClick={() => handleVideoSelect(video)}
                        >
                          <video 
                            src={video.url} 
                            className="w-full h-40 object-cover"
                            controls
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(video.url, 'video');
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveToFirestore(video, 'video');
                              }}
                              disabled={!!video.firestoreId}
                            >
                              {video.firestoreId ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center">
                            {getProviderIcon(video.provider)}
                            <span className="ml-1 capitalize">{video.provider}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>

      {/* Detail dialog */}
      <Dialog 
        open={showDetailDialog} 
        onOpenChange={setShowDetailDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'image' || activeTab === 'freepik' ? 'Image Details' : 'Video Details'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'image' || activeTab === 'freepik'
                ? 'View and manage your generated image' 
                : 'View and manage your generated video'}
            </DialogDescription>
          </DialogHeader>

          {(activeTab === 'image' || activeTab === 'freepik') && selectedImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center justify-center">
                <img 
                  src={selectedImage.url} 
                  alt="Generated image" 
                  className="max-w-full max-h-[400px] rounded-lg object-contain"
                  onError={(e) => {
                    console.error(`Error loading detail image: ${selectedImage.url}`);
                    e.currentTarget.src = '/assets/freepik__boostify_music_organe_abstract_icon.png';
                  }}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Prompt</h3>
                  <p className="text-sm">{selectedImage.prompt}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider</h3>
                  <div className="flex items-center">
                    {getProviderIcon(selectedImage.provider)}
                    <span className="ml-1 capitalize">{selectedImage.provider}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Generated At</h3>
                  <p className="text-sm">{selectedImage.createdAt.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'video' && selectedVideo && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <video 
                  src={selectedVideo.url} 
                  controls
                  className="max-w-full max-h-[400px] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Prompt</h3>
                  <p className="text-sm">{selectedVideo.prompt}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider</h3>
                  <div className="flex items-center">
                    {getProviderIcon(selectedVideo.provider)}
                    <span className="ml-1 capitalize">{selectedVideo.provider}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Generated At</h3>
                  <p className="text-sm">{selectedVideo.createdAt.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex gap-2">
              {(activeTab === 'image' || activeTab === 'freepik') && selectedImage && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => handleDownload(selectedImage.url, 'image')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleSaveToFirestore(selectedImage, 'image')}
                    disabled={!!selectedImage.firestoreId}
                  >
                    {selectedImage.firestoreId ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Saved
                      </>
                    ) : (
                      <>
                        <CloudUpload className="h-4 w-4 mr-2" />
                        Save to Collection
                      </>
                    )}
                  </Button>
                </>
              )}

              {activeTab === 'video' && selectedVideo && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => handleDownload(selectedVideo.url, 'video')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => handleSaveToFirestore(selectedVideo, 'video')}
                    disabled={!!selectedVideo.firestoreId}
                  >
                    {selectedVideo.firestoreId ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        Saved
                      </>
                    ) : (
                      <>
                        <CloudUpload className="h-4 w-4 mr-2" />
                        Save to Collection
                      </>
                    )}
                  </Button>
                </>
              )}

              <Button
                variant="secondary"
                onClick={() => setShowDetailDialog(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}