/**
 * Artist Fashion Studio
 * 
 * Plataforma profesional de moda para artistas:
 * - Virtual Try-On con FAL
 * - Fashion Video con Kling
 * - AI Fashion Advisor con Gemini
 * - Portfolio de looks
 * - Productos del artista
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { falFashionService } from '@/services/fal/fal-fashion-service';
import { geminiFashionAdvisor } from '@/services/gemini/fashion-advisor';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Sparkles, 
  Video, 
  Wand2, 
  Upload, 
  Shirt, 
  Camera,
  Play,
  Download,
  Heart,
  Star,
  TrendingUp,
  Palette,
  ChevronRight
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ArtistFashionStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('tryon');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Artist Fashion Studio
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Professional fashion platform powered by AI
              </p>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1">
            <TabsTrigger 
              value="tryon" 
              className="flex flex-col gap-1 py-3"
              data-testid="tab-tryon"
            >
              <Shirt className="h-5 w-5" />
              <span className="text-xs">Virtual Try-On</span>
            </TabsTrigger>
            <TabsTrigger 
              value="video" 
              className="flex flex-col gap-1 py-3"
              data-testid="tab-video"
            >
              <Video className="h-5 w-5" />
              <span className="text-xs">Fashion Video</span>
            </TabsTrigger>
            <TabsTrigger 
              value="advisor" 
              className="flex flex-col gap-1 py-3"
              data-testid="tab-advisor"
            >
              <Wand2 className="h-5 w-5" />
              <span className="text-xs">AI Advisor</span>
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              className="flex flex-col gap-1 py-3"
              data-testid="tab-generate"
            >
              <Palette className="h-5 w-5" />
              <span className="text-xs">Design</span>
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio" 
              className="flex flex-col gap-1 py-3"
              data-testid="tab-portfolio"
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">Portfolio</span>
            </TabsTrigger>
          </TabsList>

          {/* Virtual Try-On */}
          <TabsContent value="tryon">
            <VirtualTryOnSection />
          </TabsContent>

          {/* Fashion Video */}
          <TabsContent value="video">
            <FashionVideoSection />
          </TabsContent>

          {/* AI Advisor */}
          <TabsContent value="advisor">
            <AIAdvisorSection />
          </TabsContent>

          {/* Generate Design */}
          <TabsContent value="generate">
            <DesignGenerationSection />
          </TabsContent>

          {/* Portfolio */}
          <TabsContent value="portfolio">
            <PortfolioSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================
// VIRTUAL TRY-ON SECTION
// ============================================
function VirtualTryOnSection() {
  const { toast } = useToast();
  const [modelImage, setModelImage] = useState<string>('');
  const [clothingImage, setClothingImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['/api/fashion/products']
  });

  const handleTryOn = async () => {
    if (!modelImage || !clothingImage) {
      toast({
        title: 'Missing images',
        description: 'Please upload both model and clothing images',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiRequest('/api/fashion/tryon', {
        method: 'POST',
        body: JSON.stringify({
          modelImage,
          clothingImage
        })
      });

      setResultImage(response.imageUrl);
      toast({
        title: 'Success!',
        description: 'Virtual try-on completed'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>Upload your photo and the clothing you want to try on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Your Photo (Model)</Label>
            <Input
              type="url"
              placeholder="Paste image URL..."
              value={modelImage}
              onChange={(e) => setModelImage(e.target.value)}
              data-testid="input-model-image"
            />
          </div>

          <div>
            <Label>Clothing Image</Label>
            <Input
              type="url"
              placeholder="Paste clothing image URL..."
              value={clothingImage}
              onChange={(e) => setClothingImage(e.target.value)}
              data-testid="input-clothing-image"
            />
          </div>

          {products && products.products && products.products.length > 0 && (
            <div>
              <Label>Or select from your products</Label>
              <Select onValueChange={(url) => setClothingImage(url)}>
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.products.map((product: any) => (
                    <SelectItem key={product.id} value={product.images[0]}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleTryOn}
            disabled={isProcessing || !modelImage || !clothingImage}
            className="w-full"
            data-testid="button-start-tryon"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Shirt className="mr-2 h-4 w-4" />
                Start Try-On
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Section */}
      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>Your virtual try-on result will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          {resultImage ? (
            <div className="space-y-4">
              <img
                src={resultImage}
                alt="Try-on result"
                className="w-full rounded-lg"
                data-testid="img-tryon-result"
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" data-testid="button-download-tryon">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" data-testid="button-save-favorite">
                  <Heart className="mr-2 h-4 w-4" />
                  Save to Portfolio
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <p className="text-zinc-500">No result yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// FASHION VIDEO SECTION (KLING)
// ============================================
function FashionVideoSection() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [videoId, setVideoId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerateVideo = async () => {
    if (!imageUrl || !prompt) {
      toast({
        title: 'Missing information',
        description: 'Please provide image and prompt',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiRequest('/api/fashion/generate-video', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          prompt,
          duration: 5,
          aspectRatio: '16:9'
        })
      });

      setVideoId(response.videoId);
      toast({
        title: 'Video processing started!',
        description: 'This may take 2-3 minutes. We\'ll notify you when it\'s ready.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const { data: videoStatus } = useQuery({
    queryKey: ['/api/fashion/video-status', videoId],
    enabled: !!videoId,
    refetchInterval: (data) => {
      if (!data) return 5000;
      return data.video?.status === 'processing' ? 5000 : false;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-orange-500" />
          Fashion Video Generator
        </CardTitle>
        <CardDescription>
          Create videos showing you modeling your clothes using Kling AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Your Photo</Label>
          <Input
            type="url"
            placeholder="Paste image URL of you wearing the outfit..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            data-testid="input-video-image"
          />
        </div>

        <div>
          <Label>Video Prompt</Label>
          <Textarea
            placeholder="Describe the movement... e.g., 'Artist confidently walking down a runway, showcasing the outfit with professional modeling poses'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            data-testid="textarea-video-prompt"
          />
          <p className="text-xs text-zinc-500 mt-1">
            💡 Tip: Describe natural movements like walking, posing, or turning
          </p>
        </div>

        <Button
          onClick={handleGenerateVideo}
          disabled={isProcessing || !imageUrl || !prompt}
          className="w-full"
          data-testid="button-generate-video"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Starting...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Generate Fashion Video
            </>
          )}
        </Button>

        {videoStatus && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Status: {videoStatus.video?.status}
              </span>
              {videoStatus.video?.status === 'processing' && (
                <span className="text-xs text-zinc-500">Processing...</span>
              )}
            </div>

            {videoStatus.video?.status === 'processing' && (
              <Progress value={66} className="w-full" />
            )}

            {videoStatus.video?.status === 'completed' && videoStatus.video.videoUrl && (
              <div className="space-y-2">
                <video
                  src={videoStatus.video.videoUrl}
                  controls
                  className="w-full rounded-lg"
                  data-testid="video-result"
                />
                <Button variant="outline" className="w-full" data-testid="button-download-video">
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// AI ADVISOR SECTION
// ============================================
function AIAdvisorSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Fashion Advisor</CardTitle>
        <CardDescription>Get personalized fashion advice powered by Gemini AI</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-zinc-500">
          Coming soon: AI-powered fashion analysis and recommendations
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// DESIGN GENERATION SECTION
// ============================================
function DesignGenerationSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Design Generator</CardTitle>
        <CardDescription>Create new clothing designs with AI</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-zinc-500">
          Coming soon: AI-powered clothing design generation
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// PORTFOLIO SECTION
// ============================================
function PortfolioSection() {
  const { data: portfolio } = useQuery({
    queryKey: ['/api/fashion/portfolio']
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fashion Portfolio</CardTitle>
        <CardDescription>Your saved looks and creations</CardDescription>
      </CardHeader>
      <CardContent>
        {portfolio && portfolio.portfolio && portfolio.portfolio.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {portfolio.portfolio.map((item: any) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <img src={item.images[0]} alt={item.title} className="w-full h-48 object-cover" />
                <div className="p-3">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-xs text-zinc-500">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-500">
            No portfolio items yet. Create your first look!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
