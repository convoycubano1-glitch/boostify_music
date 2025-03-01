import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { 
  generateImage, 
  generateVideo, 
  saveGeneratedContent,
  ImageResult,
  VideoResult 
} from '@/lib/api/multi-platform-generator';

// Form validation schemas
const imageFormSchema = z.object({
  prompt: z.string().min(3, { message: 'Prompt must be at least 3 characters long' }),
  negativePrompt: z.string().optional(),
  apiProvider: z.enum(['fal', 'freepik', 'kling']),
  imageSize: z.enum(['small', 'medium', 'large']).default('medium'),
  imageCount: z.number().min(1).max(4).default(1),
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
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ImageResult[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<VideoResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Image generation form
  const imageForm = useForm<ImageFormValues>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      prompt: '',
      negativePrompt: '',
      apiProvider: 'fal',
      imageSize: 'medium',
      imageCount: 1,
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
      });

      // Save the generated image (could be to Firestore or similar)
      await saveGeneratedContent(result, 'image');

      // Update the state with the new image
      setGeneratedImages(prev => [result, ...prev]);

      // Show success notification
      toast({
        title: 'Image generated successfully',
        description: 'Your image is ready to view and download.',
        variant: 'success',
      });
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

      // Save the generated video
      await saveGeneratedContent(result, 'video');

      // Update the state with the new video
      setGeneratedVideos(prev => [result, ...prev]);

      // Show success notification
      toast({
        title: 'Video generated successfully',
        description: 'Your video is ready to view and download.',
        variant: 'success',
      });
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

      <Tabs defaultValue="image" value={activeTab} onValueChange={(value) => setActiveTab(value as 'image' | 'video')}>
        <TabsList className="mb-4">
          <TabsTrigger value="image">
            <ImageIcon className="mr-2 h-4 w-4" />
            Images
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
                  {activeTab === 'image' ? 'Image Generator' : 'Video Generator'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'image' 
                    ? 'Create AI-powered images with our multi-model generator.' 
                    : 'Generate dynamic videos with advanced AI technology.'}
                </CardDescription>
              </CardHeader>
              
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
                  {activeTab === 'image' ? 'Generated Images' : 'Generated Videos'}
                </CardTitle>
                <CardDescription>
                  {activeTab === 'image'
                    ? 'View and manage your AI-generated images'
                    : 'View and manage your AI-generated videos'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
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
                          <img 
                            src={image.url} 
                            alt={`Generated image ${index + 1}`} 
                            className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
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
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
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
              {activeTab === 'image' ? 'Image Details' : 'Video Details'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'image' 
                ? 'View and manage your generated image' 
                : 'View and manage your generated video'}
            </DialogDescription>
          </DialogHeader>

          {activeTab === 'image' && selectedImage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-center justify-center">
                <img 
                  src={selectedImage.url} 
                  alt="Generated image" 
                  className="max-w-full max-h-[400px] rounded-lg object-contain"
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
              {activeTab === 'image' && selectedImage && (
                <Button 
                  variant="outline"
                  onClick={() => handleDownload(selectedImage.url, 'image')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}

              {activeTab === 'video' && selectedVideo && (
                <Button 
                  variant="outline"
                  onClick={() => handleDownload(selectedVideo.url, 'video')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
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