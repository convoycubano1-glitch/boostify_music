import { useState, useEffect } from "react";
import { Header } from "../components/layout/header";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { 
  ArrowLeft, Shirt, Video, Wand2, User, Download, Heart, Play, 
  Loader2, ArrowRight, ImageIcon, Sparkles, ChevronRight, Grid, Camera
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/use-auth";
import { apiRequest, queryClient } from "../lib/queryClient";

type ViewMode = 'dashboard' | 'tryon' | 'video' | 'advisor' | 'gallery';

interface Artist {
  id: number;
  name: string;
  artistName?: string;
  profileImage?: string;
}

interface FashionSession {
  id: number;
  sessionType: string;
  metadata?: any;
}

export default function ArtistImageAdvisorPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Fetch artists
  const { data: artistsData } = useQuery<{ success: boolean; artists: Artist[] }>({
    queryKey: ["/api/artist-generator/my-artists"],
    enabled: !!user
  });

  // Fetch products for selected artist
  const { data: productsData } = useQuery<{ success: boolean; products: any[] }>({
    queryKey: ["/api/fashion/products", selectedArtistId],
    enabled: !!selectedArtistId
  });

  // Auto-select first artist
  useEffect(() => {
    if (artistsData?.artists && artistsData.artists.length > 0 && !selectedArtistId) {
      setSelectedArtistId(artistsData.artists[0].id);
    }
  }, [artistsData, selectedArtistId]);

  const selectedArtist = artistsData?.artists?.find(a => a.id === selectedArtistId);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => viewMode === 'dashboard' ? setLocation("/") : setViewMode('dashboard')}
          className="text-muted-foreground hover:text-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {viewMode === 'dashboard' ? 'Back to Home' : 'Back to Dashboard'}
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && (
            <DashboardView
              key="dashboard"
              selectedArtistId={selectedArtistId}
              setSelectedArtistId={setSelectedArtistId}
              selectedArtist={selectedArtist}
              artists={artistsData?.artists || []}
              onSelectMode={(mode) => setViewMode(mode)}
              onCreateSession={setCurrentSessionId}
            />
          )}

          {viewMode === 'tryon' && (
            <VirtualTryOnView
              key="tryon"
              artistId={selectedArtistId}
              artist={selectedArtist}
              products={productsData?.products || []}
              sessionId={currentSessionId}
              onBack={() => setViewMode('dashboard')}
              onNext={() => setViewMode('video')}
            />
          )}

          {viewMode === 'video' && (
            <FashionVideoView
              key="video"
              artistId={selectedArtistId}
              artist={selectedArtist}
              sessionId={currentSessionId}
              onBack={() => setViewMode('tryon')}
              onNext={() => setViewMode('advisor')}
            />
          )}

          {viewMode === 'advisor' && (
            <AIAdvisorView
              key="advisor"
              artistId={selectedArtistId}
              artist={selectedArtist}
              sessionId={currentSessionId}
              onBack={() => setViewMode('video')}
              onNext={() => setViewMode('gallery')}
            />
          )}

          {viewMode === 'gallery' && (
            <GalleryView
              key="gallery"
              artistId={selectedArtistId}
              onBack={() => setViewMode('dashboard')}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================
// DASHBOARD VIEW
// ============================================
function DashboardView({ 
  selectedArtistId, 
  setSelectedArtistId, 
  selectedArtist,
  artists, 
  onSelectMode,
  onCreateSession
}: any) {
  const { toast } = useToast();
  const { user } = useAuth();

  const createSessionMutation = useMutation({
    mutationFn: async (sessionType: string) => {
      return await apiRequest({
        url: '/api/fashion/sessions',
        method: 'POST',
        body: {
          sessionType,
          metadata: {
            artistId: selectedArtistId,
            artistName: selectedArtist?.name || selectedArtist?.artistName
          }
        }
      });
    },
    onSuccess: (data) => {
      onCreateSession(data.session.id);
      toast({
        title: "Session created!",
        description: "Let's start creating your fashion look"
      });
    }
  });

  const handleStartMode = async (mode: ViewMode) => {
    if (!selectedArtistId) {
      toast({
        title: "Select an artist first",
        description: "Please choose an artist to continue",
        variant: "destructive"
      });
      return;
    }

    await createSessionMutation.mutateAsync(mode);
    onSelectMode(mode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 z-10"></div>
        <div className="relative h-[300px] md:h-[350px] w-full overflow-hidden">
          <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover">
            <source src="/assets/Standard_Mode_Generated_Video%20(9).mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
            <div className="bg-black/50 p-8 rounded-xl backdrop-blur-sm">
              <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500 mb-4">
                Artist Fashion Studio
              </h1>
              <p className="text-base md:text-lg text-white max-w-2xl mx-auto">
                AI-powered fashion tools for artists: Virtual try-on, video modeling, and personalized style advice
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Selector */}
      {artists.length > 0 && (
        <Card className="border-orange-500/20 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              Select Your Artist
            </CardTitle>
            <CardDescription>Choose which artist to work with</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select 
              value={selectedArtistId?.toString()} 
              onValueChange={(value) => setSelectedArtistId(parseInt(value))}
            >
              <SelectTrigger className="w-full" data-testid="select-artist">
                <SelectValue placeholder="Choose an artist..." />
              </SelectTrigger>
              <SelectContent>
                {artists.map((artist: Artist) => (
                  <SelectItem key={artist.id} value={artist.id.toString()}>
                    <div className="flex items-center gap-2">
                      {artist.profileImage && (
                        <img src={artist.profileImage} alt="" className="h-6 w-6 rounded-full" />
                      )}
                      {artist.name || artist.artistName || `Artist ${artist.id}`}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedArtist && (
              <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg">
                {selectedArtist.profileImage && (
                  <img src={selectedArtist.profileImage} alt="" className="h-12 w-12 rounded-full" />
                )}
                <div>
                  <p className="font-semibold">{selectedArtist.name || selectedArtist.artistName}</p>
                  <p className="text-sm text-muted-foreground">Ready to create</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Actions Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Virtual Try-On Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="h-full border-2 border-orange-500/20 hover:border-orange-500/50 transition-all cursor-pointer bg-gradient-to-br from-orange-500/5 to-transparent"
            onClick={() => handleStartMode('tryon')}
            data-testid="card-tryon"
          >
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                <Shirt className="h-8 w-8 text-orange-500" />
              </div>
              <CardTitle className="text-2xl">Virtual Try-On</CardTitle>
              <CardDescription className="text-base">
                Try your merchandise and clothing on your artist with AI-powered visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500" />
                  Upload artist photo
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500" />
                  Select clothing item
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-orange-500" />
                  Get instant results
                </li>
              </ul>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={!selectedArtistId || createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <>Start Try-On <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Fashion Video Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="h-full border-2 border-purple-500/20 hover:border-purple-500/50 transition-all cursor-pointer bg-gradient-to-br from-purple-500/5 to-transparent"
            onClick={() => handleStartMode('video')}
            data-testid="card-video"
          >
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <Video className="h-8 w-8 text-purple-500" />
              </div>
              <CardTitle className="text-2xl">Fashion Video</CardTitle>
              <CardDescription className="text-base">
                Create AI videos of your artist modeling clothing in motion with Kling AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-500" />
                  Upload outfit photo
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-500" />
                  Describe movement
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-500" />
                  AI generates video
                </li>
              </ul>
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                disabled={!selectedArtistId || createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <>Create Video <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Stylist Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="h-full border-2 border-blue-500/20 hover:border-blue-500/50 transition-all cursor-pointer bg-gradient-to-br from-blue-500/5 to-transparent"
            onClick={() => handleStartMode('advisor')}
            data-testid="card-advisor"
          >
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Wand2 className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle className="text-2xl">AI Fashion Advisor</CardTitle>
              <CardDescription className="text-base">
                Get personalized style recommendations and analysis powered by Gemini AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Upload current look
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  AI analyzes style
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Get recommendations
                </li>
              </ul>
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600"
                disabled={!selectedArtistId || createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <>Get Advice <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Gallery Button */}
      <Card 
        className="border-zinc-700 bg-black/40 cursor-pointer hover:bg-black/60 transition-all"
        onClick={() => onSelectMode('gallery')}
        data-testid="card-gallery"
      >
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center">
              <Grid className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">My Fashion Gallery</h3>
              <p className="text-sm text-muted-foreground">View all your created looks and results</p>
            </div>
          </div>
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// VIRTUAL TRY-ON VIEW
// ============================================
function VirtualTryOnView({ artistId, artist, products, sessionId, onBack, onNext }: any) {
  const { toast } = useToast();
  const [modelImage, setModelImage] = useState("");
  const [clothingImage, setClothingImage] = useState("");
  const [resultImage, setResultImage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultId, setResultId] = useState<number | null>(null);

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
          sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResultImage(data.imageUrl);
        setResultId(data.resultId);
        toast({
          title: "Success!",
          description: "Virtual try-on completed. You can now create a video with this look!"
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Shirt className="h-8 w-8 text-orange-500" />
            Virtual Try-On
          </h2>
          <p className="text-muted-foreground mt-1">
            Working with: <span className="font-semibold">{artist?.name || artist?.artistName}</span>
          </p>
        </div>
        <Badge variant="outline" className="text-sm">Step 1 of 3</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Setup</CardTitle>
            <CardDescription>Upload images to try on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Artist Photo (Model)</Label>
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
                  Generate Try-On
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>Your try-on will appear here</CardDescription>
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
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => window.open(resultImage, '_blank')}
                    data-testid="button-download-tryon"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    onClick={onNext}
                    className="bg-purple-500 hover:bg-purple-600"
                    data-testid="button-next-video"
                  >
                    Create Video
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-zinc-400 mx-auto mb-2" />
                  <p className="text-zinc-500">No result yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ============================================
// FASHION VIDEO VIEW
// ============================================
function FashionVideoView({ artistId, artist, sessionId, onBack, onNext }: any) {
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
          sessionId,
          duration: 5,
          aspectRatio: '16:9'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setVideoId(data.videoId);
        toast({
          title: "Video processing started!",
          description: "This may take 2-3 minutes. The video will update automatically."
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Video className="h-8 w-8 text-purple-500" />
            Fashion Video Generator
          </h2>
          <p className="text-muted-foreground mt-1">
            Working with: <span className="font-semibold">{artist?.name || artist?.artistName}</span>
          </p>
        </div>
        <Badge variant="outline" className="text-sm">Step 2 of 3</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create AI Fashion Video</CardTitle>
          <CardDescription>
            Generate a video showing your artist modeling the outfit with AI-powered motion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Photo with Outfit</Label>
            <Input
              type="url"
              placeholder="Paste image URL (from try-on or upload new)..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              data-testid="input-video-image"
            />
          </div>

          <div>
            <Label>Movement Description</Label>
            <Textarea
              placeholder="Describe the movement... e.g., 'Artist confidently walking and posing, showcasing the outfit with professional runway movements'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              data-testid="textarea-video-prompt"
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Tip: Describe natural movements like walking, turning, or posing
            </p>
          </div>

          <Button
            onClick={handleGenerateVideo}
            disabled={isProcessing || !imageUrl || !prompt}
            className="w-full bg-purple-500 hover:bg-purple-600"
            data-testid="button-generate-video"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting generation...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Generate Fashion Video
              </>
            )}
          </Button>

          {videoStatus?.video && (
            <div className="mt-6 space-y-4 p-4 border rounded-lg bg-black/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Status: <Badge>{videoStatus.video.status}</Badge>
                </span>
                {videoStatus.video.status === 'processing' && (
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                )}
              </div>

              {videoStatus.video.status === 'processing' && (
                <div className="space-y-2">
                  <Progress value={66} className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">
                    Generating video... This usually takes 2-3 minutes
                  </p>
                </div>
              )}

              {videoStatus.video.status === 'completed' && videoStatus.video.videoUrl && (
                <div className="space-y-3">
                  <video
                    src={videoStatus.video.videoUrl}
                    controls
                    className="w-full rounded-lg"
                    data-testid="video-result"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => window.open(videoStatus.video.videoUrl, '_blank')}
                      data-testid="button-download-video"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      onClick={onNext}
                      className="bg-blue-500 hover:bg-blue-600"
                      data-testid="button-next-advisor"
                    >
                      Get AI Advice
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// AI ADVISOR VIEW
// ============================================
function AIAdvisorView({ artistId, artist, sessionId, onBack, onNext }: any) {
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
      const prompt = `Analyze this artist's fashion image and provide detailed style recommendations for a ${genre || 'music'} artist for ${occasion || 'general occasions'}.`;
      
      const response = await fetch('/api/fashion/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          prompt,
          genre,
          occasion,
          sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        toast({
          title: "Analysis complete!",
          description: "Fashion recommendations ready. You can now view your gallery!"
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Wand2 className="h-8 w-8 text-blue-500" />
            AI Fashion Advisor
          </h2>
          <p className="text-muted-foreground mt-1">
            Working with: <span className="font-semibold">{artist?.name || artist?.artistName}</span>
          </p>
        </div>
        <Badge variant="outline" className="text-sm">Step 3 of 3</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Style Analysis</CardTitle>
            <CardDescription>Get AI-powered fashion advice from Gemini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Image to Analyze</Label>
              <Input
                type="url"
                placeholder="Paste image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                data-testid="input-analysis-image"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Music Genre</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger data-testid="select-genre">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="latin">Latin</SelectItem>
                    <SelectItem value="indie">Indie</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Occasion</Label>
                <Select value={occasion} onValueChange={setOccasion}>
                  <SelectTrigger data-testid="select-occasion">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="photoshoot">Photoshoot</SelectItem>
                    <SelectItem value="red_carpet">Red Carpet</SelectItem>
                    <SelectItem value="music_video">Music Video</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !imageUrl}
              className="w-full bg-blue-500 hover:bg-blue-600"
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

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>AI-generated fashion insights</CardDescription>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Style Score</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={analysis.styleScore || 75} className="flex-1" />
                      <span className="text-sm font-medium">{analysis.styleScore || 75}%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Genre Match</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={analysis.genreCoherence || 80} className="flex-1" />
                      <span className="text-sm font-medium">{analysis.genreCoherence || 80}%</span>
                    </div>
                  </div>
                </div>

                {analysis.colorPalette && analysis.colorPalette.length > 0 && (
                  <div>
                    <Label className="text-xs mb-2 block">Recommended Colors</Label>
                    <div className="flex gap-2">
                      {analysis.colorPalette.map((color: string, i: number) => (
                        <div
                          key={i}
                          className="h-10 w-10 rounded-md border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {analysis.suggestions && (
                  <div>
                    <Label className="text-xs mb-2 block">Suggestions</Label>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {analysis.suggestions.slice(0, 3).map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button 
                  onClick={onNext}
                  className="w-full bg-green-500 hover:bg-green-600"
                  data-testid="button-view-gallery"
                >
                  View Gallery
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-zinc-400 mx-auto mb-2" />
                  <p className="text-zinc-500">No analysis yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ============================================
// GALLERY VIEW
// ============================================
function GalleryView({ artistId, onBack }: any) {
  const { data: portfolio } = useQuery<{
    success: boolean;
    portfolio: any[];
  }>({
    queryKey: ["/api/fashion/portfolio", artistId],
    enabled: !!artistId
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Grid className="h-8 w-8 text-green-500" />
          Fashion Gallery
        </h2>
        <p className="text-muted-foreground mt-1">
          All your created looks and fashion content
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>Saved fashion looks and creations</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio && portfolio.portfolio && portfolio.portfolio.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {portfolio.portfolio.map((item: any) => (
                <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <img src={item.images[0]} alt={item.title} className="w-full h-48 object-cover" />
                  <div className="p-3">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-500 mb-4">No portfolio items yet</p>
              <Button onClick={onBack} variant="outline">
                Create Your First Look
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
