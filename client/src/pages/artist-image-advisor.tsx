import { useState, useEffect } from "react";
import { Header } from "../components/layout/header";
import { FluxUploadSection } from "../components/image-generation/sections/flux-upload-section";
import { FluxStyleSection } from "../components/image-generation/sections/flux-style-section";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { 
  Upload, Sparkles, Camera, Palette, Music2, TrendingUp, Star, ArrowLeft, 
  Shirt, Video, Wand2, Download, Heart, Play, Loader2, User
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";

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

export default function ArtistImageAdvisorPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [language, setLanguage] = useState<"en" | "es">("en");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Selected artist state
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);

  // Fetch artists
  const { data: artistsData } = useQuery<{
    success: boolean;
    artists: any[];
  }>({
    queryKey: ["/api/artist-generator/my-artists"],
    enabled: !!user
  });

  // Fetch products for selected artist
  const { data: productsData } = useQuery<{
    success: boolean;
    products: any[];
  }>({
    queryKey: ["/api/fashion/products", selectedArtistId],
    enabled: !!selectedArtistId
  });

  // Auto-select first artist if available
  useEffect(() => {
    if (artistsData?.artists && artistsData.artists.length > 0 && !selectedArtistId) {
      setSelectedArtistId(artistsData.artists[0].id);
    }
  }, [artistsData, selectedArtistId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-back-home"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative rounded-xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 z-10"></div>
          
          <div className="relative h-[350px] md:h-[400px] w-full overflow-hidden">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute w-full h-full object-cover"
            >
              <source src="/assets/Standard_Mode_Generated_Video%20(9).mp4" type="video/mp4" />
            </video>
            
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
              <div className="bg-black/50 p-8 rounded-xl backdrop-blur-sm">
                <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 mb-4">
                  AI-Powered Fashion Studio
                </h1>
                <p className="text-base md:text-lg text-white max-w-2xl mx-auto">
                  Virtual try-on, AI fashion videos, and personalized style advice for artists
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Artist Selector */}
        {artistsData?.artists && artistsData.artists.length > 0 && (
          <Card className="mb-6 border-orange-500/20 bg-black/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Artist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedArtistId?.toString()} 
                onValueChange={(value) => setSelectedArtistId(parseInt(value))}
              >
                <SelectTrigger data-testid="select-artist">
                  <SelectValue placeholder="Choose an artist..." />
                </SelectTrigger>
                <SelectContent>
                  {artistsData.artists.map((artist: any) => (
                    <SelectItem key={artist.id} value={artist.id.toString()}>
                      {artist.name || artist.artistName || `Artist ${artist.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Shirt className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Virtual Try-On</h3>
                  <p className="text-sm text-muted-foreground">
                    Try your products with AI-powered visualization
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Video className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Fashion Videos</h3>
                  <p className="text-sm text-muted-foreground">
                    Create AI videos modeling your clothing
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="p-6 border-orange-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Wand2 className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">AI Stylist</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized fashion recommendations
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Interface */}
        <Card className="border-orange-500/20 bg-black/40 backdrop-blur-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="sticky top-0 z-30 bg-black/60 backdrop-blur-sm border-b border-orange-500/20 px-4 py-2">
              <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 gap-2 max-w-4xl mx-auto">
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                  data-testid="tab-upload"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden md:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="style" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                  data-testid="tab-style"
                >
                  <Music2 className="h-4 w-4" />
                  <span className="hidden md:inline">Style</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tryon" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                  data-testid="tab-tryon"
                >
                  <Shirt className="h-4 w-4" />
                  <span className="hidden md:inline">Try On</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="video" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                  data-testid="tab-video"
                >
                  <Video className="h-4 w-4" />
                  <span className="hidden md:inline">Video</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="advisor" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                  data-testid="tab-advisor"
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="hidden md:inline">AI Advisor</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="flex items-center gap-2 data-[state=active]:bg-orange-500"
                  data-testid="tab-results"
                >
                  <Star className="h-4 w-4" />
                  <span className="hidden md:inline">Results</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 md:p-8">
              <TabsContent value="upload" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <FluxUploadSection language={language} />
                </motion.div>
              </TabsContent>
              
              <TabsContent value="style" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <FluxStyleSection language={language} />
                </motion.div>
              </TabsContent>
              
              {/* VIRTUAL TRY-ON with FAL */}
              <TabsContent value="tryon" className="mt-0">
                <VirtualTryOnSection 
                  artistId={selectedArtistId} 
                  products={productsData?.products || []} 
                />
              </TabsContent>
              
              {/* FASHION VIDEO with KLING */}
              <TabsContent value="video" className="mt-0">
                <FashionVideoSection artistId={selectedArtistId} />
              </TabsContent>
              
              {/* AI FASHION ADVISOR with GEMINI */}
              <TabsContent value="advisor" className="mt-0">
                <AIFashionAdvisorSection artistId={selectedArtistId} />
              </TabsContent>
              
              <TabsContent value="results" className="mt-0">
                <ResultsSection artistId={selectedArtistId} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}

// ============================================
// VIRTUAL TRY-ON SECTION (FAL)
// ============================================
function VirtualTryOnSection({ artistId, products }: { artistId: number | null, products: any[] }) {
  const { toast } = useToast();
  const [modelImage, setModelImage] = useState("");
  const [clothingImage, setClothingImage] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTryOn = async () => {
    if (!modelImage || !clothingImage) {
      toast({
        title: "Missing images",
        description: "Please provide both model and clothing images",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/fashion/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelImage,
          clothingImage,
          sessionId: null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResultImage(data.imageUrl);
        toast({
          title: "Success!",
          description: "Virtual try-on completed"
        });
      } else {
        throw new Error(data.error || 'Try-on failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>Upload your photo and clothing to try on</CardDescription>
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

          {products && products.length > 0 && (
            <div>
              <Label>Or select from your products</Label>
              <Select onValueChange={(url) => setClothingImage(url)}>
                <SelectTrigger data-testid="select-product">
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.images?.[0] || ''}>
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
            className="w-full bg-orange-500 hover:bg-orange-600"
            data-testid="button-start-tryon"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>Your try-on result will appear here</CardDescription>
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
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open(resultImage, '_blank')}
                  data-testid="button-download-tryon"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" data-testid="button-save-favorite">
                  <Heart className="mr-2 h-4 w-4" />
                  Save
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
function FashionVideoSection({ artistId }: { artistId: number | null }) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [videoId, setVideoId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: videoStatus, refetch: refetchVideo } = useQuery<{
    success: boolean;
    video: any;
  }>({
    queryKey: ["/api/fashion/video-status", videoId],
    enabled: !!videoId,
    refetchInterval: (data: any) => {
      if (!data) return 5000;
      return data.video?.status === 'processing' ? 5000 : false;
    }
  });

  const handleGenerateVideo = async () => {
    if (!imageUrl || !prompt) {
      toast({
        title: "Missing information",
        description: "Please provide image and prompt",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/fashion/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          prompt,
          duration: 5,
          aspectRatio: '16:9'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setVideoId(data.videoId);
        toast({
          title: "Video processing started!",
          description: "This may take 2-3 minutes. Check back soon."
        });
      } else {
        throw new Error(data.error || 'Video generation failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-orange-500" />
          Fashion Video Generator (Kling AI)
        </CardTitle>
        <CardDescription>
          Create AI videos showing you modeling your clothing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Your Photo (wearing outfit)</Label>
          <Input
            type="url"
            placeholder="Paste image URL..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            data-testid="input-video-image"
          />
        </div>

        <div>
          <Label>Video Prompt</Label>
          <Textarea
            placeholder="Describe the movement... e.g., 'Artist confidently walking, showcasing the outfit with professional poses'"
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
          className="w-full bg-orange-500 hover:bg-orange-600"
          data-testid="button-generate-video"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Generate Fashion Video
            </>
          )}
        </Button>

        {videoStatus?.video && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Status: {videoStatus.video.status}
              </span>
              {videoStatus.video.status === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              )}
            </div>

            {videoStatus.video.status === 'processing' && (
              <Progress value={66} className="w-full" />
            )}

            {videoStatus.video.status === 'completed' && videoStatus.video.videoUrl && (
              <div className="space-y-2">
                <video
                  src={videoStatus.video.videoUrl}
                  controls
                  className="w-full rounded-lg"
                  data-testid="video-result"
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open(videoStatus.video.videoUrl, '_blank')}
                  data-testid="button-download-video"
                >
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
// AI FASHION ADVISOR SECTION (GEMINI)
// ============================================
function AIFashionAdvisorSection({ artistId }: { artistId: number | null }) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [genre, setGenre] = useState("");
  const [occasion, setOccasion] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!imageUrl) {
      toast({
        title: "Missing image",
        description: "Please provide an image to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this artist's fashion image and provide style recommendations for a ${genre || 'music'} artist for ${occasion || 'general occasions'}.`;
      
      const response = await fetch('/api/fashion/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          prompt,
          genre,
          occasion
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Analysis complete!",
          description: "Fashion recommendations ready"
        });
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Fashion Analysis</CardTitle>
          <CardDescription>Get personalized fashion advice powered by Gemini AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Image URL</Label>
            <Input
              type="url"
              placeholder="Paste image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              data-testid="input-analysis-image"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Music Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger data-testid="select-genre">
                  <SelectValue placeholder="Select genre..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rock">Rock</SelectItem>
                  <SelectItem value="pop">Pop</SelectItem>
                  <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                  <SelectItem value="electronic">Electronic</SelectItem>
                  <SelectItem value="latin">Latin</SelectItem>
                  <SelectItem value="indie">Indie</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="jazz">Jazz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Occasion</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger data-testid="select-occasion">
                  <SelectValue placeholder="Select occasion..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="photoshoot">Photoshoot</SelectItem>
                  <SelectItem value="red_carpet">Red Carpet</SelectItem>
                  <SelectItem value="music_video">Music Video</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !imageUrl}
            className="w-full bg-orange-500 hover:bg-orange-600"
            data-testid="button-analyze"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Analyze Style
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Style Score</Label>
                <div className="flex items-center gap-2">
                  <Progress value={analysis.styleScore || 0} className="flex-1" />
                  <span className="text-sm font-medium">{analysis.styleScore || 0}%</span>
                </div>
              </div>
              <div>
                <Label>Genre Coherence</Label>
                <div className="flex items-center gap-2">
                  <Progress value={analysis.genreCoherence || 0} className="flex-1" />
                  <span className="text-sm font-medium">{analysis.genreCoherence || 0}%</span>
                </div>
              </div>
            </div>

            {analysis.colorPalette && analysis.colorPalette.length > 0 && (
              <div>
                <Label>Recommended Color Palette</Label>
                <div className="flex gap-2 mt-2">
                  {analysis.colorPalette.map((color: string, i: number) => (
                    <div
                      key={i}
                      className="h-12 w-12 rounded-md border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <div>
                <Label>Style Suggestions</Label>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {analysis.suggestions.map((suggestion: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// RESULTS SECTION
// ============================================
function ResultsSection({ artistId }: { artistId: number | null }) {
  const { data: portfolio } = useQuery<{
    success: boolean;
    portfolio: any[];
  }>({
    queryKey: ["/api/fashion/portfolio", artistId],
    enabled: !!artistId
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
