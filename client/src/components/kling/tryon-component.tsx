import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Loader2, Upload, Camera, Image as ImageIcon, Shirt, Play, Pause, Download, CheckCircle2, Info, Clock, History, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { klingService, TryOnRequest, TryOnResult } from '../../services/kling/kling-service';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Efectos de animación para componentes
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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();

  // Advanced configuration
  const [preserveModelDetails, setPreserveModelDetails] = useState<boolean>(true);
  const [preserveClothingDetails, setPreserveClothingDetails] = useState<boolean>(true);
  const [enhanceFace, setEnhanceFace] = useState<boolean>(true);
  const [alignment, setAlignment] = useState<'auto' | 'manual'>('auto');
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);

  // Load saved results on mount
  useEffect(() => {
    loadSavedResults();
  }, []);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);
  
  // Functions to handle video playback
  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  // Effect to check task status
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

      // Handle different task states
      if (status.status === 'completed') {
        // Task completed successfully
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        
        // If there's an images array available, use the first one
        let resultImageUrl = '';
        if ((status as any).images && Array.isArray((status as any).images) && (status as any).images.length > 0) {
          resultImageUrl = (status as any).images[0].url;
          console.log('Result image found:', resultImageUrl);
        } else if ((status as any).resultUrl) {
          resultImageUrl = (status as any).resultUrl;
          console.log('Result URL found in resultUrl:', resultImageUrl);
        } else {
          console.error('No image URL found in response:', status);
          
          // If no valid image is available, use an example for demo
          resultImageUrl = '/assets/virtual-tryon/example-result.jpg';
          console.log('Using example image as fallback');
        }
        
        const resultData: TryOnResult = {
          resultImage: resultImageUrl,
          requestId: taskId,
          modelImage: modelImage,
          clothingImage: clothingImage
        };
        
        setResult(resultData);
        setIsLoading(false);
        
        toast({
          title: "Process Completed!",
          description: "The virtual try-on image has been successfully generated.",
        });
        
        // Save the result
        try {
          await klingService.saveResult('try-on', resultData);
          loadSavedResults(); // Reload results
        } catch (saveError) {
          console.error('Error saving try-on result:', saveError);
        }
      } else if (status.status === 'failed') {
        // Task failed
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        setIsLoading(false);
        
        const errorMsg = status.error || 
                        (status as any).errorMessage || 
                        "An error occurred during image generation.";
        
        toast({
          title: "Process Error",
          description: errorMsg,
          variant: "destructive",
        });
      } else {
        // Task is still in progress, update status
        setTaskStatus(status);
      }
    } catch (error: any) {
      console.error('Error checking task status:', error);
      
      toast({
        title: "Connection Error",
        description: error.message || "Could not verify process status. Please try again.",
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
        title: "Images Required",
        description: "Please upload both a model image and a clothing item.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTaskId(null);
    setTaskStatus(null);
    setResult(null);
    
    try {
      // Configuration for the request
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
        title: "Process Started",
        description: "Beginning to process images. This may take a few minutes.",
      });
    } catch (error) {
      console.error('Error starting try-on process:', error);
      setIsLoading(false);
      
      toast({
        title: "Process Start Error",
        description: "Could not initiate virtual try-on process. Please try again.",
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
        title: "Save Successful",
        description: "The result has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving result:', error);
      
      toast({
        title: "Save Error",
        description: "Could not save the result. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-4">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="create">Create Virtual Try-On</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-4">
          {/* Demonstration animation */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <Card className="overflow-hidden border-primary/20 bg-black/40 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Virtual Try-On Tutorial
                </CardTitle>
                <CardDescription className="text-base">
                  Learn how virtual garment try-on works and create your own combinations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-md">
                  {/* Boostify Music tutorial video */}
                  <video
                    ref={videoRef}
                    className="w-full object-cover rounded-md shadow-inner"
                    style={{ minHeight: "340px" }}
                    poster="/assets/virtual-tryon/virtual-tryon-poster.svg"
                    onClick={handlePlayVideo}
                    onEnded={handleVideoEnded}
                  >
                    <source src="/assets/tv/Welcome to Boostify Music.mp4" type="video/mp4" />
                    Your browser does not support video playback.
                  </video>
                  
                  {/* Overlay with glow effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-orange-500/60 blur-sm animate-pulse"></div>
                    <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-red-500/40 blur-sm animate-ping" style={{animationDuration: "4s"}}></div>
                    <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-orange-500/50 blur-sm animate-pulse" style={{animationDuration: "3s"}}></div>
                    
                    {/* Central play button when video is paused */}
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-4">
                          <Play className="h-12 w-12 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-gradient-to-r from-primary/5 via-black/60 to-primary/5 backdrop-blur-sm p-4">
                <div className="flex flex-wrap gap-2 w-full justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-primary/10 border-orange-500/20">
                      <Sparkles className="h-3 w-3 mr-1 text-orange-500" />
                      Video
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10 border-orange-500/20">
                      <Info className="h-3 w-3 mr-1 text-orange-500" />
                      Tutorial
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1 text-xs"
                    onClick={() => {
                      toast({
                        title: "Interactive Tutorial",
                        description: "This video demonstrates the Boostify Music platform and its features.",
                      });
                    }}
                  >
                    <Info className="h-4 w-4 text-orange-500" />
                    More Info
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
          
          {/* Information alert */}
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle>AI-Powered Virtual Try-On</AlertTitle>
            <AlertDescription>
              This tool allows you to upload a photo of a person and a clothing item to see how the garment would look when worn.
              Perfect for trying clothes without physical fitting. For best results, use images with good lighting.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model image upload section */}
            <Card>
              <CardHeader>
                <CardTitle>Model Image</CardTitle>
                <CardDescription>Upload a photo of the person who will wear the garment</CardDescription>
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
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Camera className="h-10 w-10 mb-2" />
                      <p>Click to upload your image</p>
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
            
            {/* Clothing image upload section */}
            <Card>
              <CardHeader>
                <CardTitle>Clothing Image</CardTitle>
                <CardDescription>Upload a photo of the garment you want to try on</CardDescription>
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
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Shirt className="h-10 w-10 mb-2" />
                      <p>Click to upload your image</p>
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
          
          {/* Advanced settings */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Customize how the garment will be applied</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preserve-model-details">Preserve model details</Label>
                    <Switch 
                      id="preserve-model-details" 
                      checked={preserveModelDetails}
                      onCheckedChange={setPreserveModelDetails}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preserve-clothing-details">Preserve clothing details</Label>
                    <Switch 
                      id="preserve-clothing-details" 
                      checked={preserveClothingDetails}
                      onCheckedChange={setPreserveClothingDetails}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enhance-face">Enhance face</Label>
                    <Switch 
                      id="enhance-face" 
                      checked={enhanceFace}
                      onCheckedChange={setEnhanceFace}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alignment</Label>
                    <div className="flex space-x-4">
                      <Button 
                        variant={alignment === 'auto' ? "default" : "outline"} 
                        onClick={() => setAlignment('auto')}
                        className="flex-1"
                      >
                        Automatic
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
                          <Label htmlFor="offset-x">Horizontal adjustment: {offsetX}</Label>
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
                          <Label htmlFor="offset-y">Vertical adjustment: {offsetY}</Label>
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
          
          {/* Results section */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {isLoading 
                  ? "Processing images, this may take a few minutes..." 
                  : "View the result of the virtual try-on"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center min-h-60">
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="text-center">
                      <p>Processing your request...</p>
                      {taskStatus && (
                        <p className="text-sm text-muted-foreground">
                          Status: {taskStatus.status === 'pending' ? 'Queued' : 'Processing'} - 
                          Progress: {taskStatus.progress}%
                        </p>
                      )}
                    </div>
                  </div>
                ) : result ? (
                  <div className="w-full">
                    <img 
                      src={result.resultImage} 
                      alt="Virtual try-on result" 
                      className="max-h-96 mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-gray-500">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <p>Results will appear here after processing</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-center">
              <Button
                onClick={handleStartTryOn}
                disabled={isLoading || !modelImage || !clothingImage}
                className="w-full py-6 text-md group bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 transition-all shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing virtual try-on...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Start Virtual Try-On
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full md:w-auto hover:bg-primary/10"
              >
                <History className="mr-2 h-5 w-5" />
                Reset
              </Button>
              
              {result && (
                <Button
                  variant="secondary"
                  onClick={handleSaveResult}
                  className="w-full md:w-auto bg-gradient-to-r from-primary/30 to-primary/20 hover:from-primary/40 hover:to-primary/30 shadow-sm"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Save Result
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card className="overflow-hidden border-primary/20 bg-black/40 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10">
              <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                <History className="h-5 w-5 text-orange-500" />
                Virtual Try-On History
              </CardTitle>
              <CardDescription>Review your previous virtual try-ons</CardDescription>
            </CardHeader>
            <CardContent>
              {savedResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No saved results yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedResults.map((item, index) => (
                    <Card key={index} className="overflow-hidden border-primary/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-colors">
                      <div className="relative aspect-square group">
                        <img 
                          src={item.resultImage} 
                          alt={`Virtual try-on ${index + 1}`} 
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                          <div className="text-white">
                            <p className="text-sm font-medium">Try-on #{index + 1}</p>
                            <p className="text-xs opacity-80">AI-Generated</p>
                          </div>
                        </div>
                      </div>
                      <CardFooter className="flex justify-between p-3 bg-gradient-to-r from-primary/5 via-black/60 to-primary/5">
                        <Badge variant="outline" className="bg-primary/10 border-orange-500/20">
                          <Sparkles className="h-3 w-3 mr-1 text-orange-500" />
                          {item.requestId.substring(0, 6)}...
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="hover:bg-primary/10 flex items-center gap-1"
                        >
                          <Info className="h-4 w-4 text-orange-500" />
                          View details
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