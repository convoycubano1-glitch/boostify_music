import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  Sparkles,
  History,
  Image as ImageIcon,
  Shirt,
  Download,
  Save,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Tally3,
  Settings,
  Sliders,
  AlignVerticalJustifyCenter,
  ChevronDown,
  ChevronUp,
  Undo2,
  Ghost,
  FileWarning,
  Expand,
  ExternalLink,
  RefreshCw,
  Dices
} from "lucide-react";

/**
 * Types for the component
 */
interface TryOnResult {
  success: boolean;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  taskId?: string;
  resultImage?: string;
  createdAt?: string;
  errorMessage?: string;
  progress?: number;
  id?: string;
}

/**
 * Improved Kling service with robust image validation and error handling
 */
const klingService = {
  // Start the Try-On process
  startTryOn: async (modelImage: string, clothingImage: string): Promise<TryOnResult> => {
    try {
      // First, validate and process both images to ensure they meet Kling's requirements
      const processedModelResult = await validateAndProcessImage(modelImage);
      if (!processedModelResult.isValid) {
        return {
          success: false,
          status: 'failed',
          errorMessage: `Model image error: ${processedModelResult.errorMessage}`
        };
      }
      
      const processedClothingResult = await validateAndProcessImage(clothingImage);
      if (!processedClothingResult.isValid) {
        return {
          success: false,
          status: 'failed',
          errorMessage: `Clothing image error: ${processedClothingResult.errorMessage}`
        };
      }
      
      // Structure following the format expected by the Kling API
      const response = await axios.post('/api/kling/try-on/start', {
        model: "kling",
        task_type: "ai_try_on", // Using the correct task_type verified with direct API tests
        input: {
          model_input: processedModelResult.processedImage || modelImage,
          dress_input: processedClothingResult.processedImage || clothingImage,
          batch_size: 1
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error starting Try-On:', error);
      
      // Handle API authentication errors specifically with more detail
      if (error.response?.status === 401 || 
          error.response?.data?.message === 'Invalid API key' || 
          error.response?.data?.error === 'Invalid API key') {
        console.error('❌ Authentication error with Kling API. Details:', error.response?.data);
        return {
          success: false,
          status: 'failed',
          errorMessage: 'Authentication error: The API key is invalid or has expired. Please contact the administrator.'
        };
      }
      
      return {
        success: false,
        status: 'failed',
        errorMessage: error.response?.data?.error || error.message || 'Unknown error when starting Try-On'
      };
    }
  },
  
  // Check the status of an ongoing Try-On process
  checkTryOnStatus: async (taskId: string): Promise<TryOnResult> => {
    try {
      const response = await axios.post('/api/kling/try-on/status', { taskId });
      return response.data;
    } catch (error: any) {
      console.error('Error checking Try-On status:', error);
      return {
        success: false,
        status: 'failed',
        errorMessage: error.response?.data?.error || error.message || 'Error checking status'
      };
    }
  },
  
  // Save a completed try-on result
  saveResult: async (result: TryOnResult): Promise<boolean> => {
    try {
      if (!result.resultImage || !result.taskId) {
        throw new Error('No valid result to save');
      }
      
      await axios.post('/api/kling/save-result', {
        type: 'try-on',
        taskId: result.taskId,
        resultImage: result.resultImage
      });
      
      return true;
    } catch (error: any) {
      console.error('Error saving Try-On result:', error);
      return false;
    }
  },
  
  // Get all saved try-on results
  getResults: async (): Promise<TryOnResult[]> => {
    try {
      const response = await axios.get('/api/kling/results?type=try-on');
      return response.data.results || [];
    } catch (error: any) {
      console.error('Error fetching saved Try-On results:', error);
      return [];
    }
  }
};

/**
 * Validate and process an image to ensure it meets Kling API requirements
 */
interface ImageValidationResult {
  isValid: boolean;
  errorMessage?: string;
  width?: number;
  height?: number;
  originalFormat?: string;
  sizeInMB?: number;
  processedImage?: string;
}

/**
 * Validate and process an image to ensure it meets Kling API requirements
 * This function handles JPEG format issues including missing Huffman tables and 0xFF00 sequences
 */
async function validateAndProcessImage(imageDataUrl: string): Promise<ImageValidationResult> {
  try {
    // Use our server-side processor to handle all JPEG corrections
    const response = await axios.post('/api/kling/process-image', { 
      imageDataUrl: imageDataUrl 
    });
    
    if (response.data.isValid) {
      return {
        isValid: true,
        width: response.data.width,
        height: response.data.height,
        originalFormat: response.data.originalFormat,
        sizeInMB: response.data.sizeInMB,
        processedImage: response.data.processedImage || response.data.normalizedUrl
      };
    } else {
      return {
        isValid: false,
        errorMessage: response.data.errorMessage || 'Unknown image validation error'
      };
    }
  } catch (error: any) {
    console.error('Error validating image:', error);
    return {
      isValid: false,
      errorMessage: error.response?.data?.error || error.message || 'Failed to process image'
    };
  }
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

/**
 * EnglishVirtualTryOn Component
 * A complete Virtual Try-On component with improved JPEG handling and English interface
 */
export function EnglishVirtualTryOn() {
  const [modelImage, setModelImage] = useState<string>('');
  const [clothingImage, setClothingImage] = useState<string>('');
  const [modelFileInput, setModelFileInput] = useState<File | null>(null);
  const [clothingFileInput, setClothingFileInput] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TryOnResult | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [savedResults, setSavedResults] = useState<TryOnResult[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
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

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Fetch saved results
  const loadSavedResults = async () => {
    try {
      const results = await klingService.getResults();
      setSavedResults(results);
    } catch (error) {
      console.error('Error loading saved results:', error);
    }
  };

  // Handle file upload for model or clothing
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string>>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous results
    setResult(null);
    setTaskId(null);
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload only image files (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setFile(file);
    
    // Read and convert to data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start the try-on process
  const handleStartTryOn = async () => {
    if (!modelImage || !clothingImage) {
      toast({
        title: "Missing images",
        description: "Please upload both a model and clothing image to continue",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

      // Clean up existing polling
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }

      const startResult = await klingService.startTryOn(modelImage, clothingImage);
      
      if (!startResult.success) {
        throw new Error(startResult.errorMessage || 'Failed to start try-on process');
      }

      setTaskId(startResult.taskId || null);
      setTaskStatus(startResult);

      // Start polling for status updates
      if (startResult.taskId) {
        const intervalId = setInterval(async () => {
          try {
            const statusResult = await klingService.checkTryOnStatus(startResult.taskId!);
            setTaskStatus(statusResult);

            // When process is completed or failed, stop polling
            if (statusResult.status === 'completed' || statusResult.status === 'failed') {
              clearInterval(intervalId);
              setPollInterval(null);
              setIsLoading(false);

              if (statusResult.status === 'completed') {
                setResult(statusResult);
                toast({
                  title: "Success!",
                  description: "Virtual try-on completed successfully",
                });
              } else {
                toast({
                  title: "Process Failed",
                  description: statusResult.errorMessage || "Failed to generate try-on result",
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            console.error('Error in polling interval:', error);
          }
        }, 2000); // Check every 2 seconds

        setPollInterval(intervalId);
      }
    } catch (error: any) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message || "An error occurred while starting the process",
        variant: "destructive",
      });
    }
  };

  // Reset all inputs and results
  const handleReset = () => {
    setModelImage('');
    setClothingImage('');
    setModelFileInput(null);
    setClothingFileInput(null);
    setResult(null);
    setTaskId(null);
    setTaskStatus(null);
    
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
    
    setIsLoading(false);
  };

  // Save a successful result
  const handleSaveResult = async () => {
    if (!result || !result.resultImage) {
      toast({
        title: "No result to save",
        description: "There is no completed try-on result to save",
        variant: "destructive",
      });
      return;
    }

    try {
      const saved = await klingService.saveResult(result);
      
      if (saved) {
        toast({
          title: "Saved successfully",
          description: "The try-on result has been saved to your history",
        });
        
        // Refresh the saved results list
        loadSavedResults();
      } else {
        throw new Error("Failed to save the result");
      }
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Could not save the result. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete a saved result
  const handleDeleteResult = async (id: string) => {
    try {
      await axios.delete(`/api/kling/results/${id}`);
      
      toast({
        title: "Deleted successfully",
        description: "The saved result has been removed",
      });
      
      // Update the saved results list
      setSavedResults(savedResults.filter(item => item.id !== id));
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete the result. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Download a try-on result image
  const handleDownloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `virtual-tryon-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Select a sample model or clothing image
  const handleUseSampleImage = (imageType: 'model' | 'clothing', index: number) => {
    const sampleImages = {
      model: [
        '/assets/sample-images/model-1.jpg',
        '/assets/sample-images/model-2.jpg'
      ],
      clothing: [
        '/assets/sample-images/clothing-1.jpg',
        '/assets/sample-images/clothing-2.jpg'
      ]
    };
    
    // If sample images are available, use them directly
    // Otherwise, use the default paths that might be part of the public assets
    if (imageType === 'model') {
      fetch(sampleImages.model[index] || `/assets/sample-model-${index + 1}.jpg`)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setModelImage(e.target.result as string);
              setModelFileInput(null);
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('Error loading sample image:', error);
          toast({
            title: "Error",
            description: "Failed to load sample image. Please try uploading your own image.",
            variant: "destructive",
          });
        });
    } else {
      fetch(sampleImages.clothing[index] || `/assets/sample-clothing-${index + 1}.jpg`)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setClothingImage(e.target.result as string);
              setClothingFileInput(null);
            }
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('Error loading sample image:', error);
          toast({
            title: "Error",
            description: "Failed to load sample image. Please try uploading your own image.",
            variant: "destructive",
          });
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
          {/* Main interface */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <Card className="overflow-hidden border-primary/20 bg-black/40 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/30 via-primary/20 to-primary/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Virtual Try-On
                </CardTitle>
                <CardDescription className="text-base">
                  Try on clothing virtually using AI to see how garments would look on you or your models
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                {/* Model Image Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      Model Image
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUseSampleImage('model', 0)}
                      className="text-xs h-7 px-2"
                    >
                      <Dices className="h-3 w-3 mr-1" />
                      Use Sample
                    </Button>
                  </div>
                  
                  <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden border border-primary/20 flex items-center justify-center">
                    {modelImage ? (
                      <img 
                        src={modelImage} 
                        alt="Model" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Upload model image</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Person wearing neutral clothes
                        </p>
                      </div>
                    )}
                    
                    {/* Upload button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setModelImage, setModelFileInput)}
                        />
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Model
                        </Button>
                      </label>
                    </div>
                  </div>
                  
                  {/* Model upload guidance */}
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p className="font-medium">Best practices for model images:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Full body, front-facing pose</li>
                      <li>Neutral or plain background</li>
                      <li>Wearing form-fitting clothing</li>
                      <li>Good lighting without shadows</li>
                      <li>JPG or PNG format recommended</li>
                    </ul>
                  </div>
                </motion.div>
                
                {/* Clothing Image Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-primary" />
                      Clothing Image
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUseSampleImage('clothing', 0)}
                      className="text-xs h-7 px-2"
                    >
                      <Dices className="h-3 w-3 mr-1" />
                      Use Sample
                    </Button>
                  </div>
                  
                  <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden border border-primary/20 flex items-center justify-center">
                    {clothingImage ? (
                      <img 
                        src={clothingImage} 
                        alt="Clothing" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Shirt className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Upload clothing image</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Dress, shirt, or complete outfit
                        </p>
                      </div>
                    )}
                    
                    {/* Upload button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setClothingImage, setClothingFileInput)}
                        />
                        <Button className="gap-2">
                          <Upload className="h-4 w-4" />
                          Upload Clothing
                        </Button>
                      </label>
                    </div>
                  </div>
                  
                  {/* Clothing upload guidance */}
                  <div className="text-sm space-y-2 text-muted-foreground">
                    <p className="font-medium">Best practices for clothing images:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Front-facing display of garment</li>
                      <li>White or transparent background</li>
                      <li>Full garment visibility</li>
                      <li>Even lighting without reflections</li>
                      <li>JPG or PNG format with transparency</li>
                    </ul>
                  </div>
                </motion.div>
                
                {/* Advanced Options (toggle section) */}
                <motion.div variants={itemVariants} className="md:col-span-2">
                  <div 
                    className="flex items-center justify-between cursor-pointer py-2"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      <span className="font-medium">Advanced Options</span>
                    </div>
                    {showAdvancedOptions ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </div>
                  
                  {showAdvancedOptions && (
                    <div className="mt-4 space-y-4 p-4 bg-black/20 rounded-lg border border-primary/10">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Detail Preservation</h4>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="preserve-model">Preserve Model Details</Label>
                              <p className="text-xs text-muted-foreground">
                                Keep facial features and model details accurate
                              </p>
                            </div>
                            <Switch
                              id="preserve-model"
                              checked={preserveModelDetails}
                              onCheckedChange={setPreserveModelDetails}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="preserve-clothing">Preserve Clothing Details</Label>
                              <p className="text-xs text-muted-foreground">
                                Maintain clothing patterns, textures and details
                              </p>
                            </div>
                            <Switch
                              id="preserve-clothing"
                              checked={preserveClothingDetails}
                              onCheckedChange={setPreserveClothingDetails}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="enhance-face">Enhance Face</Label>
                              <p className="text-xs text-muted-foreground">
                                Apply facial enhancement to improve quality
                              </p>
                            </div>
                            <Switch
                              id="enhance-face"
                              checked={enhanceFace}
                              onCheckedChange={setEnhanceFace}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Alignment Controls</h4>
                          
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="alignment-mode">Alignment Mode</Label>
                              <p className="text-xs text-muted-foreground">
                                Choose between automatic or manual positioning
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant={alignment === 'auto' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAlignment('auto')}
                                className="h-8 px-3"
                              >
                                Auto
                              </Button>
                              <Button
                                variant={alignment === 'manual' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAlignment('manual')}
                                className="h-8 px-3"
                              >
                                Manual
                              </Button>
                            </div>
                          </div>
                          
                          {alignment === 'manual' && (
                            <>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <Label htmlFor="offset-x">Horizontal Offset ({offsetX}px)</Label>
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
                                  <Label htmlFor="offset-y">Vertical Offset ({offsetY}px)</Label>
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
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
                
                {/* Result Section (conditionally shown) */}
                {(taskStatus || result) && (
                  <motion.div 
                    variants={itemVariants}
                    className="md:col-span-2 border border-primary/20 rounded-lg overflow-hidden bg-black/30"
                  >
                    <div className="bg-primary/10 p-3 flex justify-between items-center">
                      <h3 className="font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Try-On Result
                      </h3>
                      {taskStatus && taskStatus.status === 'processing' && (
                        <div className="flex items-center gap-2 text-sm">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Processing: {taskStatus.progress ? `${Math.round(taskStatus.progress)}%` : 'Initializing...'}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      {taskStatus && ['pending', 'processing'].includes(taskStatus.status || '') && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                          <div className="relative w-16 h-16">
                            <Loader2 className="w-16 h-16 animate-spin text-primary opacity-25" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {taskStatus.progress ? `${Math.round(taskStatus.progress)}%` : '...'}
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <h4 className="font-medium">Creating your virtual try-on</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              This process may take up to 30 seconds
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {taskStatus && taskStatus.status === 'failed' && (
                        <Alert variant="destructive" className="bg-red-950/40 border-red-900/50">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Processing Failed</AlertTitle>
                          <AlertDescription>
                            {taskStatus.errorMessage || 
                             "We couldn't complete your virtual try-on. Please try again with different images."}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {result && result.status === 'completed' && result.resultImage && (
                        <div className="space-y-4">
                          <div className="relative aspect-[3/4] bg-black/20 rounded-lg overflow-hidden border border-primary/20">
                            <img 
                              src={result.resultImage} 
                              alt="Try-On Result" 
                              className="w-full h-full object-cover"
                            />
                            
                            {/* Success indicator */}
                            <div className="absolute top-2 right-2 bg-green-500/80 text-white rounded-full p-1">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          </div>
                          
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadImage(result.resultImage)}
                              className="gap-1"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSaveResult}
                              className="gap-1"
                            >
                              <Save className="h-4 w-4" />
                              Save to History
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
              
              <CardFooter className="flex gap-2 justify-center p-6">
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
              </CardFooter>
            </Card>
            
            {/* Information card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">About Virtual Try-On</CardTitle>
                <CardDescription>
                  Learn how our advanced AI clothing visualization works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Virtual Try-On uses state-of-the-art AI algorithms to accurately overlay clothing items
                  onto model images, giving you a realistic preview of how garments would look without physical fitting.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Technology
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Powered by Kling's advanced neural networks that analyze body pose, garment structure,
                      and fabric properties to create natural-looking results.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-primary" />
                      Garment Types
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Works best with dresses, tops, and full outfits. The system adapts to various styles,
                      from casual wear to formal attire and fashion pieces.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      Best Practices
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      For optimal results, use high-quality images with neutral backgrounds,
                      clear lighting, and standard poses for both models and clothing items.
                    </p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <FileWarning className="h-4 w-4 text-amber-500" />
                    Image Processing Improvements
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our system now includes advanced JPEG processing to fix common image issues:
                  </p>
                  <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Automatic correction of missing Huffman tables in JPEG images</li>
                    <li>Repair of corrupted 0xFF00 sequences for improved compatibility</li>
                    <li>Image format validation and optimization for the AI processing pipeline</li>
                    <li>Dimension verification to ensure images meet API requirements</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Saved Try-On Results</CardTitle>
              <CardDescription>
                View and manage your previous virtual try-on creations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedResults.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Ghost className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-medium">No saved results yet</h3>
                  <p className="text-muted-foreground">
                    Your saved try-on results will appear here after you create and save them
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.querySelector('[data-value="create"]')?.click()}
                    className="mt-2"
                  >
                    Create Your First Try-On
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedResults.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-primary/20 group">
                      <div className="relative aspect-[3/4]">
                        <img
                          src={item.resultImage}
                          alt="Saved Try-On Result"
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadImage(item.resultImage!)}
                            className="bg-white/20 hover:bg-white/30"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteResult(item.id!)}
                            className="bg-red-500/70 hover:bg-red-500/90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(item.resultImage, '_blank')}
                            className="bg-white/20 hover:bg-white/30"
                          >
                            <Expand className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Date overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-2 px-3 text-xs">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Unknown date'}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Tutorial or Help Section */}
          <Card>
            <CardHeader>
              <CardTitle>Tips for Better Try-On Results</CardTitle>
              <CardDescription>
                Follow these guidelines to achieve the most realistic virtual try-ons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    Model Photography
                  </h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Ensure even lighting without harsh shadows</li>
                    <li>Use a neutral or plain background</li>
                    <li>Position the camera at chest height</li>
                    <li>Stand with a natural, front-facing pose</li>
                    <li>Wear form-fitting clothes if possible</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-primary" />
                    Clothing Photography
                  </h3>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Use flat, well-lit product images</li>
                    <li>White or transparent backgrounds work best</li>
                    <li>Avoid mannequins or human models</li>
                    <li>Display the garment in a front-facing view</li>
                    <li>High-resolution images produce better details</li>
                  </ul>
                </div>
              </div>
              
              {/* Mobile app promotion */}
              <div className="flex items-center p-4 mt-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <Sparkles className="h-10 w-10 text-blue-500 mr-4 flex-shrink-0" />
                <div className="flex-grow">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                    Want to use Virtual Try-On on your mobile device?
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Discover our mobile app with on-the-go virtual try-on features, available for iOS and Android.
                    Try clothes anywhere and share your virtual outfits directly from your phone.
                  </p>
                </div>
                <Button size="sm" className="ml-4 flex-shrink-0">
                  Get App
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}