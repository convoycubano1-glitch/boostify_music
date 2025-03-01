import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, VideoIcon, Loader2 } from 'lucide-react';

// Interfaces simplificadas
interface ImageResult {
  url: string;
  provider: string;
}

interface VideoResult {
  url: string;
  provider: string;
}

// Función simulada para generar imágenes
const generateImage = async (prompt: string, provider: string): Promise<ImageResult> => {
  // Simulamos una llamada a la API
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Retorna una URL de imagen según el proveedor
  return {
    url: provider === 'fal' 
      ? 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a'
      : 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9',
    provider
  };
};

// Función simulada para generar videos
const generateVideo = async (prompt: string, provider: string): Promise<VideoResult> => {
  // Simulamos una llamada a la API
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Retorna una URL de video según el proveedor
  return {
    url: provider === 'luma' 
      ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      : 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    provider
  };
};

export default function ImageGeneratorSimplePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [imageProvider, setImageProvider] = useState('fal');
  const [videoProvider, setVideoProvider] = useState('luma');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ImageResult[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<VideoResult[]>([]);

  // Handle image generation
  const handleImageGenerate = async () => {
    if (!imagePrompt) {
      toast({
        title: 'Prompt required',
        description: 'Please enter a description for your image',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      toast({
        title: 'Generating image',
        description: `Using ${imageProvider} to create your vision...`,
      });

      const result = await generateImage(imagePrompt, imageProvider);
      setGeneratedImages(prev => [result, ...prev]);

      toast({
        title: 'Image generated successfully',
        description: 'Your image is ready to view',
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
  const handleVideoGenerate = async () => {
    if (!videoPrompt) {
      toast({
        title: 'Prompt required',
        description: 'Please enter a description for your video',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      toast({
        title: 'Generating video',
        description: `Using ${videoProvider} to create your video...`,
      });

      const result = await generateVideo(videoPrompt, videoProvider);
      setGeneratedVideos(prev => [result, ...prev]);

      toast({
        title: 'Video generated successfully',
        description: 'Your video is ready to view',
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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">AI Media Generator</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Create stunning images and videos with AI
      </p>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'image' | 'video')}>
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
                    ? 'Create AI-powered images with our generator' 
                    : 'Generate videos with advanced AI'}
                </CardDescription>
              </CardHeader>
              
              <TabsContent value="image" className="mt-0">
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-prompt">Image Description</Label>
                    <Input 
                      id="image-prompt"
                      placeholder="Describe the image you want to generate..." 
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Be as detailed as possible for best results
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Generation Engine</Label>
                    <div className="flex space-x-4">
                      <Button 
                        variant={imageProvider === 'fal' ? 'default' : 'outline'}
                        onClick={() => setImageProvider('fal')}
                        size="sm"
                      >
                        Fal.ai
                      </Button>
                      <Button 
                        variant={imageProvider === 'freepik' ? 'default' : 'outline'}
                        onClick={() => setImageProvider('freepik')}
                        size="sm"
                      >
                        Freepik
                      </Button>
                      <Button 
                        variant={imageProvider === 'kling' ? 'default' : 'outline'}
                        onClick={() => setImageProvider('kling')}
                        size="sm"
                      >
                        Kling
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleImageGenerate} 
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
                </CardContent>
              </TabsContent>

              <TabsContent value="video" className="mt-0">
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-prompt">Video Description</Label>
                    <Input 
                      id="video-prompt"
                      placeholder="Describe the video you want to generate..." 
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Be detailed about scenes, actions, and style
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Video Engine</Label>
                    <div className="flex space-x-4">
                      <Button 
                        variant={videoProvider === 'luma' ? 'default' : 'outline'}
                        onClick={() => setVideoProvider('luma')}
                        size="sm"
                      >
                        Luma
                      </Button>
                      <Button 
                        variant={videoProvider === 'kling' ? 'default' : 'outline'}
                        onClick={() => setVideoProvider('kling')}
                        size="sm"
                      >
                        Kling
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleVideoGenerate} 
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
                    ? 'View your AI-generated images'
                    : 'View your AI-generated videos'}
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
                          className="relative overflow-hidden rounded-lg"
                        >
                          <img 
                            src={image.url} 
                            alt={`Generated image ${index + 1}`} 
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {image.provider}
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
                          className="relative overflow-hidden rounded-lg"
                        >
                          <video 
                            src={video.url} 
                            className="w-full h-40 object-cover"
                            controls
                          />
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            {video.provider}
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
    </div>
  );
}