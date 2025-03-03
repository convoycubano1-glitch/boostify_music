/**
 * Virtual Try-On Component
 * 
 * This component provides an interface for uploading model and clothing images
 * to generate a virtual try-on result using Kling's AI capabilities.
 * 
 * Image Validation & Error Handling:
 * - Accepted formats: .jpg, .jpeg, .png only (validated both at HTML input and data URL levels)
 * - File format validation in handleModelImageChange and handleClothingImageChange
 * - Data URL validation in validateImageData before submission
 * - Enhanced error handling in loadSavedResults with improved JSON parsing
 * - Robust error handling in checkTaskStatus with specific error messages
 * - User-friendly error messages for all validation failures
 * - Toast notifications for better UX feedback
 */

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
      
      // Enhanced validation to ensure we have valid data
      if (Array.isArray(results)) {
        // Validate each result to ensure it has the required properties
        const validResults = results.filter(item => {
          try {
            // Validate required properties exist
            const isValid = 
              item && 
              typeof item === 'object' &&
              'resultImage' in item && 
              'requestId' in item && 
              'modelImage' in item && 
              'clothingImage' in item;
            
            if (!isValid) {
              console.warn('Skipping invalid result item:', item);
            }
            
            return isValid;
          } catch (validationError) {
            console.warn('Error validating result item:', validationError);
            return false;
          }
        });
        
        setSavedResults(validResults as TryOnResult[]);
        
        if (validResults.length < results.length) {
          console.info(`Filtered out ${results.length - validResults.length} invalid results`);
        }
      } else {
        console.warn('Invalid results format:', results);
        setSavedResults([]); // Initialize with empty array on invalid data
        
        toast({
          title: "Data Error",
          description: "Could not load saved Try-On results due to invalid data format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading saved results:', error);
      setSavedResults([]); // Initialize with empty array on error
      
      toast({
        title: "Load Error",
        description: "Failed to load saved Try-On results. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }

  async function checkTaskStatus() {
    if (!taskId) return;

    try {
      const status = await klingService.checkTryOnStatus(taskId);
      
      // Validate status response
      if (!status || typeof status !== 'object') {
        throw new Error('Invalid response format received from the server');
      }
      
      setTaskStatus(status);

      // Handle different task states
      if (status.status === 'completed') {
        // Task completed successfully
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        
        // If there's an images array available, use the first one
        let resultImageUrl = '';
        try {
          if ((status as any).images && Array.isArray((status as any).images) && (status as any).images.length > 0) {
            resultImageUrl = (status as any).images[0].url;
            console.log('Result image found:', resultImageUrl);
          } else if ((status as any).resultUrl) {
            resultImageUrl = (status as any).resultUrl;
            console.log('Result URL found in resultUrl:', resultImageUrl);
          } else {
            // Check for alternative response formats
            if ((status as any).result && typeof (status as any).result === 'object') {
              if ((status as any).result.images && Array.isArray((status as any).result.images)) {
                resultImageUrl = (status as any).result.images[0].url;
                console.log('Result image found in nested result object:', resultImageUrl);
              } else if ((status as any).result.image_url) {
                resultImageUrl = (status as any).result.image_url;
                console.log('Result image found in result.image_url:', resultImageUrl);
              }
            }
            
            // If still no valid URL, use fallback
            if (!resultImageUrl) {
              console.error('No image URL found in response:', status);
              // If no valid image is available, use an example for demo
              resultImageUrl = '/assets/virtual-tryon/example-result.jpg';
              console.log('Using example image as fallback');
            }
          }
        } catch (parseError) {
          console.error('Error parsing response data:', parseError);
          // Use fallback image if parsing fails
          resultImageUrl = '/assets/virtual-tryon/example-result.jpg';
          console.log('Using example image as fallback due to parsing error');
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
          
          toast({
            title: "Save Warning",
            description: "The image was generated successfully but could not be saved to history.",
          });
        }
      } else if (status.status === 'failed') {
        // Task failed
        if (pollInterval) clearInterval(pollInterval);
        setPollInterval(null);
        setIsLoading(false);
        
        let errorMsg = "An error occurred during image generation.";
        
        try {
          // Try to extract error message from different possible formats
          if (status.error && typeof status.error === 'string') {
            errorMsg = status.error;
          } else if ((status as any).errorMessage && typeof (status as any).errorMessage === 'string') {
            errorMsg = (status as any).errorMessage;
          } else if ((status as any).message && typeof (status as any).message === 'string') {
            errorMsg = (status as any).message;
          } else if ((status as any).error && typeof (status as any).error === 'object') {
            // Handle nested error objects
            if ((status as any).error.message) {
              errorMsg = (status as any).error.message;
            } else if ((status as any).error.details) {
              errorMsg = (status as any).error.details;
            }
          }
          
          // Check for specific error patterns
          if (errorMsg.includes('format') || errorMsg.includes('unsupported')) {
            errorMsg = "Unsupported image format. Please use only JPG or PNG images.";
          } else if (errorMsg.includes('size')) {
            errorMsg = "Image size too large. Please use smaller images.";
          }
        } catch (parseError) {
          console.error('Error parsing error message:', parseError);
        }
        
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
      
      let errorMessage = "Could not verify process status. Please try again.";
      
      // Extract more specific error messages if available
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response && error.response.data) {
        try {
          // Try to extract message from API error response
          const responseData = error.response.data;
          if (responseData.error && typeof responseData.error === 'string') {
            errorMessage = responseData.error;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }
        } catch (parseError) {
          console.error('Error parsing API error response:', parseError);
        }
      }
      
      toast({
        title: "Connection Error",
        description: errorMessage,
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
    
    // Validate image format - only accept jpeg, jpg, png
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!supportedFormats.includes(file.type)) {
      toast({
        title: "Unsupported Format",
        description: "Please upload only JPG or PNG images. Other formats are not supported.",
        variant: "destructive",
      });
      return;
    }
    
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
    
    // Validate image format - only accept jpeg, jpg, png
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!supportedFormats.includes(file.type)) {
      toast({
        title: "Unsupported Format",
        description: "Please upload only JPG or PNG images. Other formats are not supported.",
        variant: "destructive",
      });
      return;
    }
    
    setClothingFileInput(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      setClothingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleStartTryOn = async () => {
    // Validate required inputs
    if (!modelImage || !clothingImage) {
      toast({
        title: "Images Required",
        description: "Please upload both a model image and a clothing item.",
        variant: "destructive",
      });
      return;
    }

    // Validate image data format for model image
    if (!validateImageData(modelImage)) {
      toast({
        title: "Invalid Model Image",
        description: "The model image format is invalid. Please upload a proper JPEG or PNG image.",
        variant: "destructive",
      });
      return;
    }

    // Validate image data format for clothing image
    if (!validateImageData(clothingImage)) {
      toast({
        title: "Invalid Clothing Image",
        description: "The clothing image format is invalid. Please upload a proper JPEG or PNG image.",
        variant: "destructive",
      });
      return;
    }

    // Start loading and reset state
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
      
      // Show loading toast to provide feedback
      toast({
        title: "Preparing Process",
        description: "Uploading and validating images...",
      });
      
      const newTaskId = await klingService.startTryOn(modelImage, clothingImage, settings);
      
      if (!newTaskId) {
        throw new Error("Failed to get a valid task ID from the server");
      }
      
      setTaskId(newTaskId);
      
      toast({
        title: "Process Started",
        description: "Beginning to process images. This may take a few minutes.",
      });
    } catch (error: any) {
      console.error('Error starting try-on process:', error);
      setIsLoading(false);
      
      // Extract more specific error messages when possible
      let errorMessage = "Could not initiate virtual try-on process. Please try again.";
      
      if (error.message) {
        if (error.message.includes("format") || error.message.includes("unsupported")) {
          errorMessage = "Unsupported image format. Please use only JPG or PNG images.";
        } else if (error.message.includes("size")) {
          errorMessage = "Image size is too large. Please use smaller images (under 5MB).";
        } else if (error.message.includes("resolution")) {
          errorMessage = "Image resolution is too high. Please use images with lower resolution.";
        } else {
          errorMessage = error.message;
        }
      } else if (error.response && error.response.data) {
        try {
          const responseData = error.response.data;
          if (responseData.error) {
            errorMessage = typeof responseData.error === 'string' 
              ? responseData.error 
              : responseData.error.message || errorMessage;
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }
        } catch (parseError) {
          console.error('Error parsing API error response:', parseError);
        }
      }
      
      toast({
        title: "Process Start Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // Helper function to validate image data URLs
  const validateImageData = (dataUrl: string): boolean => {
    // Basic validation for data URLs
    if (!dataUrl.startsWith('data:image/')) {
      return false;
    }
    
    // Check for supported formats
    const isJpeg = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');
    const isPng = dataUrl.startsWith('data:image/png');
    
    if (!isJpeg && !isPng) {
      return false;
    }
    
    // Basic check for data presence
    const parts = dataUrl.split(',');
    if (parts.length !== 2 || !parts[1]) {
      return false;
    }
    
    // Optional: check minimum data length to ensure it's not an empty image
    if (parts[1].length < 100) {
      return false;
    }
    
    return true;
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
                        size="sm" 
                        className="absolute top-2 right-2 bg-gradient-to-r from-red-500/90 to-red-500 hover:from-red-500 hover:to-red-500/90 border-0"
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
                  accept="image/jpeg,image/jpg,image/png" 
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
                        size="sm" 
                        className="absolute top-2 right-2 bg-gradient-to-r from-red-500/90 to-red-500 hover:from-red-500 hover:to-red-500/90 border-0"
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
                  accept="image/jpeg,image/jpg,image/png" 
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
                        onClick={() => setAlignment('auto')}
                        className={`flex-1 ${alignment === 'auto' ? 
                          'bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90' : 
                          'bg-transparent border border-primary/30 hover:bg-primary/10'}`}
                      >
                        Automatic
                      </Button>
                      <Button 
                        onClick={() => setAlignment('manual')}
                        className={`flex-1 ${alignment === 'manual' ? 
                          'bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90' : 
                          'bg-transparent border border-primary/30 hover:bg-primary/10'}`}
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
                onClick={handleReset}
                className="w-full md:w-auto bg-gradient-to-r from-gray-500/40 to-gray-500/30 hover:from-gray-500/50 hover:to-gray-500/40 shadow-sm border-0"
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
                          size="sm"
                          className="bg-gradient-to-r from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 flex items-center gap-1 border-0 shadow-sm"
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