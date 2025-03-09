import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, AlertTriangle, CheckCircle, Info, Loader2, 
  Upload, Sparkles, ShirtIcon, UserIcon, ImageIcon, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface TryOnResult {
  success: boolean;
  taskId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  url?: string;
  progress?: number;
  imageSize?: string;
  originalFormat?: string;
  width?: number;
  height?: number;
}

interface ImageValidationResult {
  isValid: boolean;
  errorMessage?: string;
  width?: number;
  height?: number;
  originalFormat?: string;
  sizeInMB?: number;
  processedImage?: string;
}

// Enhanced client service for Kling API
const klingService = {
  // Start the Try-On process
  startTryOn: async (modelImage: string, clothingImage: string): Promise<TryOnResult> => {
    try {
      // Structure following the format expected by the Kling API
      const response = await axios.post('/api/kling/try-on/start', {
        model: "kling",
        task_type: "ai_try_on", // Using the correct task_type for the newer API version
        input: {
          model_input: modelImage,
          dress_input: clothingImage,
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

  // Check the status of the process
  checkTryOnStatus: async (taskId: string): Promise<TryOnResult> => {
    try {
      const response = await axios.post('/api/kling/try-on/status', { taskId });
      
      // Make sure that if there is an error object in the response, we convert it to a string
      if (response.data.errorMessage && typeof response.data.errorMessage === 'object') {
        response.data.errorMessage = JSON.stringify(response.data.errorMessage);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error checking status:', error);
      
      // Handle API authentication errors specifically
      if (error.response?.status === 401 || 
          error.response?.data?.message === 'Invalid API key' || 
          error.response?.data?.error === 'Invalid API key') {
        console.error('❌ Authentication error with Kling API while checking status. Details:', error.response?.data);
        return {
          success: false,
          status: 'failed',
          errorMessage: 'Authentication error: The API key is invalid or has expired. Please contact the administrator.'
        };
      }
      
      // Ensure that the error message is always a string
      let errorMessage = 'Unknown error when checking status';
      
      if (error.response?.data?.error) {
        errorMessage = typeof error.response.data.error === 'object' 
          ? JSON.stringify(error.response.data.error) 
          : error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        status: 'failed',
        errorMessage: errorMessage
      };
    }
  },

  // Verify the validity of an image for Kling API
  validateImage: async (imageDataUrl: string): Promise<ImageValidationResult> => {
    try {
      const response = await axios.post('/api/kling/validate-image', {
        imageDataUrl
      });
      return response.data;
    } catch (error: any) {
      console.error('Error validating image:', error);
      
      // Handle API authentication errors
      if (error.response?.status === 401 || 
          error.response?.data?.message === 'Invalid API key' || 
          error.response?.data?.error === 'Invalid API key') {
        console.error('❌ Authentication error with Kling API during image validation. Details:', error.response?.data);
        return {
          isValid: false,
          errorMessage: 'Authentication error: The API key is invalid or has expired. Please contact the administrator.'
        };
      }
      
      return {
        isValid: false,
        errorMessage: error.response?.data?.error || error.message || 'Unknown error when validating image'
      };
    }
  }
};

export function ArtistVirtualTryOn() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modelValidation, setModelValidation] = useState<ImageValidationResult | null>(null);
  const [clothingValidation, setClothingValidation] = useState<ImageValidationResult | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<string>('model');

  const modelInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  // Clear the polling interval when the component unmounts
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Validate and set model image
  const handleModelImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setErrorMessage(null);
      setSuccessMessage(null);
      setModelValidation(null);
      
      const imageDataUrl = await fileToBase64(file);
      
      setLoading(true);
      setModelImage(imageDataUrl);
      setActiveTab('clothing');
      
      // Validate image with the backend
      const validation = await klingService.validateImage(imageDataUrl);
      setModelValidation(validation);
      
      if (!validation.isValid) {
        setErrorMessage(`Model image error: ${validation.errorMessage}`);
      } else {
        setSuccessMessage('Model image processed successfully');
        // If there is a processed version, update the model image
        if (validation.processedImage) {
          setModelImage(validation.processedImage);
        }
      }
    } catch (error: any) {
      setErrorMessage(`Error processing image: ${error.message}`);
      console.error('Error processing model image:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate and set clothing image
  const handleClothingImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setErrorMessage(null);
      setSuccessMessage(null);
      setClothingValidation(null);
      
      const imageDataUrl = await fileToBase64(file);
      
      setLoading(true);
      setClothingImage(imageDataUrl);
      
      // Validate image with the backend
      const validation = await klingService.validateImage(imageDataUrl);
      setClothingValidation(validation);
      
      if (!validation.isValid) {
        setErrorMessage(`Clothing image error: ${validation.errorMessage}`);
      } else {
        setSuccessMessage('Clothing image processed successfully');
        // If there is a processed version, update the clothing image
        if (validation.processedImage) {
          setClothingImage(validation.processedImage);
        }
      }
    } catch (error: any) {
      setErrorMessage(`Error processing image: ${error.message}`);
      console.error('Error processing clothing image:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start the Try-On process
  const handleStartTryOn = async () => {
    try {
      if (!modelImage || !clothingImage) {
        setErrorMessage('Both images are required: model and clothing');
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setResult(null);

      // We use the service to start the process
      const startResult = await klingService.startTryOn(modelImage, clothingImage);
      
      if (!startResult.success) {
        setErrorMessage(`Error starting Try-On: ${startResult.errorMessage}`);
        return;
      }

      setResult(startResult);
      setSuccessMessage('Try-On process started successfully');

      // Set up polling to check the status
      if (startResult.taskId) {
        const intervalId = setInterval(async () => {
          const statusResult = await klingService.checkTryOnStatus(startResult.taskId!);
          setResult(statusResult);

          // If the process has finished (completed or failed), stop polling
          if (statusResult.status === 'completed' || statusResult.status === 'failed') {
            clearInterval(intervalId);
            setPollingInterval(null);

            if (statusResult.status === 'completed') {
              setSuccessMessage('Try-On completed successfully!');
            } else {
              setErrorMessage(`Try-On failed: ${statusResult.errorMessage}`);
            }
          }
        }, 3000); // Check every 3 seconds

        setPollingInterval(intervalId);
      }
    } catch (error: any) {
      setErrorMessage(`Error: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset the component
  const handleReset = () => {
    // Clear images
    setModelImage(null);
    setClothingImage(null);
    
    // Clear validations
    setModelValidation(null);
    setClothingValidation(null);
    
    // Clear result
    setResult(null);
    
    // Clear messages
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // Stop polling if active
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    
    // Reset inputs
    if (modelInputRef.current) modelInputRef.current.value = '';
    if (clothingInputRef.current) clothingInputRef.current.value = '';
    
    // Go back to the first tab
    setActiveTab('model');
  };

  // Helper function to get the status label
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Error and success messages */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </motion.div>
      )}
      
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-700">Success</AlertTitle>
            <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Tabs for loading models and clothing */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-background/60 border border-primary/10">
          <TabsTrigger value="model" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <UserIcon className="h-4 w-4" />
            Person
          </TabsTrigger>
          <TabsTrigger value="clothing" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ShirtIcon className="h-4 w-4" />
            Clothing
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="model" className="mt-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-primary/10 overflow-hidden bg-black/40 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-black/60 to-black/40 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <UserIcon className="h-5 w-5" />
                  Person Image
                </CardTitle>
                <CardDescription>
                  Upload a photo of yourself or an artist to try on clothing
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="model-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer border-primary/20 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-primary/60" />
                        <p className="mb-2 text-sm">
                          <span className="font-semibold text-primary/80">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG or PNG (max 50MB)
                        </p>
                      </div>
                      <Input
                        id="model-upload"
                        ref={modelInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleModelImageChange}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {modelImage && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-md overflow-hidden border border-primary/10 shadow-md"
                    >
                      <div className="relative aspect-[3/4] w-full max-h-[400px] overflow-hidden">
                        <img 
                          src={modelImage} 
                          alt="Person" 
                          className="object-contain w-full h-full"
                        />
                        {modelValidation && modelValidation.isValid && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="bg-black/40 backdrop-blur-sm text-white border-green-500">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              Valid
                            </Badge>
                          </div>
                        )}
                      </div>
                      {modelValidation && (
                        <div className="p-3 bg-black/60 border-t border-primary/10">
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium text-primary/80">Format:</span>{' '}
                              <span className="capitalize">{modelValidation.originalFormat || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-primary/80">Size:</span>{' '}
                              <span>{modelValidation.sizeInMB ? `${modelValidation.sizeInMB.toFixed(2)} MB` : 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-primary/80">Width:</span>{' '}
                              <span>{modelValidation.width || 'Unknown'} px</span>
                            </div>
                            <div>
                              <span className="font-medium text-primary/80">Height:</span>{' '}
                              <span>{modelValidation.height || 'Unknown'} px</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="clothing" className="mt-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-primary/10 overflow-hidden bg-black/40 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-black/60 to-black/40 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <ShirtIcon className="h-5 w-5" />
                  Clothing Image
                </CardTitle>
                <CardDescription>
                  Upload a garment photo to virtually try on
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="clothing-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer border-primary/20 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ShirtIcon className="w-10 h-10 mb-3 text-primary/60" />
                        <p className="mb-2 text-sm">
                          <span className="font-semibold text-primary/80">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG or PNG (max 50MB)
                        </p>
                      </div>
                      <Input
                        id="clothing-upload"
                        ref={clothingInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleClothingImageChange}
                        disabled={loading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {clothingImage && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-md overflow-hidden border border-primary/10 shadow-md"
                    >
                      <div className="relative aspect-[3/4] w-full max-h-[400px] overflow-hidden">
                        <img 
                          src={clothingImage} 
                          alt="Clothing" 
                          className="object-contain w-full h-full" 
                        />
                        {clothingValidation && clothingValidation.isValid && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="bg-black/40 backdrop-blur-sm text-white border-green-500">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              Valid
                            </Badge>
                          </div>
                        )}
                      </div>
                      {clothingValidation && (
                        <div className="p-3 bg-black/60 border-t border-primary/10">
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium text-primary/80">Format:</span>{' '}
                              <span className="capitalize">{clothingValidation.originalFormat || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-primary/80">Size:</span>{' '}
                              <span>{clothingValidation.sizeInMB ? `${clothingValidation.sizeInMB.toFixed(2)} MB` : 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="font-medium text-primary/80">Width:</span>{' '}
                              <span>{clothingValidation.width || 'Unknown'} px</span>
                            </div>
                            <div>
                              <span className="font-medium text-primary/80">Height:</span>{' '}
                              <span>{clothingValidation.height || 'Unknown'} px</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 pb-4 px-6 bg-black/40 border-t border-primary/10">
                <Button 
                  variant="outline" 
                  onClick={handleReset} 
                  disabled={loading}
                  className="border-primary/20 hover:bg-primary/10 hover:text-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleStartTryOn} 
                  disabled={loading || !modelImage || !clothingImage}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Try On Now
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Result Section */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <Card className="border-primary/10 bg-black/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-black/60 to-black/40 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                Try-On Result
              </CardTitle>
              <CardDescription>
                Real-time progress and final image
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                {/* Status information */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline" className={
                      result.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                      result.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    }>
                      {result.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {result.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {result.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {getStatusLabel(result.status)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Task ID: <span className="font-mono">{result.taskId?.substring(0, 8)}...</span>
                  </div>
                </div>

                {/* Progress bar */}
                {result.status === 'processing' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Processing...</span>
                      <span>{result.progress ? `${Math.round(result.progress * 100)}%` : 'Calculating'}</span>
                    </div>
                    <Progress 
                      value={result.progress ? result.progress * 100 : undefined} 
                      className="h-2 bg-primary/10"
                    />
                  </div>
                )}

                {/* Result image */}
                {result.url && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-4 rounded-md overflow-hidden border border-primary/10 shadow-md"
                  >
                    <div className="relative aspect-[3/4] w-full max-h-[500px] overflow-hidden">
                      <img 
                        src={result.url} 
                        alt="Try-On Result" 
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Processing or waiting message */}
                {!result.url && (result.status === 'pending' || result.status === 'processing') && (
                  <div className="flex flex-col items-center justify-center p-10 border border-dashed border-primary/20 rounded-md bg-black/20">
                    <Loader2 className="h-10 w-10 text-primary/50 animate-spin mb-4" />
                    <p className="text-center text-muted-foreground">
                      {result.status === 'pending' ? 'Waiting to start processing...' : 'Processing your images...'}
                    </p>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      This may take 15-30 seconds depending on image complexity
                    </p>
                  </div>
                )}

                {/* Error message if failed */}
                {result.status === 'failed' && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Processing Failed</AlertTitle>
                    <AlertDescription>
                      {result.errorMessage || 'An unknown error occurred during processing.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between pt-2 pb-4 px-6 bg-black/40 border-t border-primary/10">
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={loading}
                className="border-primary/20 hover:bg-primary/10 hover:text-primary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Start New Try-On
              </Button>
              {result.url && (
                <Button 
                  onClick={() => window.open(result.url, '_blank')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  View Full Image
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  );
}