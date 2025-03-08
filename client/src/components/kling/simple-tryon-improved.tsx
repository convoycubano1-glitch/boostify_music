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

// Simplified client service for Kling API
const klingService = {
  // Start the Try-On process
  startTryOn: async (modelImage: string, clothingImage: string): Promise<TryOnResult> => {
    try {
      // Structure following the format expected by the Kling API
      const response = await axios.post('/api/kling/try-on/start', {
        model: "kling",
        task_type: "ai_try_on",
        input: {
          model_input: modelImage,
          dress_input: clothingImage,
          batch_size: 1
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error starting Try-On:', error);
      return {
        success: false,
        errorMessage: error.response?.data?.error || error.message || 'Unknown error when starting Try-On'
      };
    }
  },

  // Check the status of the process
  checkTryOnStatus: async (taskId: string): Promise<TryOnResult> => {
    try {
      // Changed from GET to POST to match the server implementation
      const response = await axios.post('/api/kling/try-on/status', { taskId });
      
      // Make sure that if there is an error object in the response, we convert it to a string
      if (response.data.errorMessage && typeof response.data.errorMessage === 'object') {
        response.data.errorMessage = JSON.stringify(response.data.errorMessage);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error checking status:', error);
      
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
      return {
        isValid: false,
        errorMessage: error.response?.data?.error || error.message || 'Unknown error when validating image'
      };
    }
  }
};

export function SimpleTryOnComponent() {
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
    <div className="container mx-auto">
      {/* Error and success messages */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4 animate-in fade-in-50 duration-300">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="default" className="mb-4 bg-green-50 border-green-200 animate-in fade-in-50 duration-300">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Success</AlertTitle>
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Tabs for loading models and clothing */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-muted/70">
          <TabsTrigger value="model" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Model
          </TabsTrigger>
          <TabsTrigger value="clothing" className="flex items-center gap-2">
            <ShirtIcon className="h-4 w-4" />
            Garment
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="model" className="animate-in fade-in-50 slide-in-from-left-10 duration-300">
          <Card className="border-primary/10 shadow-sm bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-primary">
                <UserIcon className="h-5 w-5" />
                Model Image
              </CardTitle>
              <CardDescription>
                Upload a photo of a person to virtually try on clothing
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="model-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 border-primary/20 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-primary/60" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground/70">
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
                  <div className="rounded-md overflow-hidden border border-primary/10 shadow-sm bg-muted/20">
                    <div className="relative aspect-[3/4] w-full max-h-[400px] overflow-hidden">
                      <img 
                        src={modelImage} 
                        alt="Model" 
                        className="object-contain w-full h-full"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                          Model
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {modelValidation && modelValidation.isValid ? (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700">Image Information</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      <ul className="list-disc list-inside">
                        <li>Format: {modelValidation.originalFormat?.toUpperCase()}</li>
                        <li>Dimensions: {modelValidation.width} x {modelValidation.height} px</li>
                        <li>Size: {modelValidation.sizeInMB?.toFixed(2)} MB</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  modelValidation && !modelValidation.isValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Validation Error</AlertTitle>
                      <AlertDescription>{modelValidation.errorMessage}</AlertDescription>
                    </Alert>
                  )
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/10 pt-4">
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
              <Button 
                onClick={() => setActiveTab('clothing')} 
                disabled={!modelImage || loading || (modelValidation && modelValidation.isValid === false)}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                Next
                <ShirtIcon className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="clothing" className="animate-in fade-in-50 slide-in-from-right-10 duration-300">
          <Card className="border-primary/10 shadow-sm bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShirtIcon className="h-5 w-5" />
                Garment Image
              </CardTitle>
              <CardDescription>
                Upload a photo of the clothing you want to virtually try on
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="clothing-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 border-primary/20 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-primary/60" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground/70">
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
                  <div className="rounded-md overflow-hidden border border-primary/10 shadow-sm bg-muted/20">
                    <div className="relative aspect-square w-full max-h-[400px] overflow-hidden">
                      <img 
                        src={clothingImage} 
                        alt="Garment" 
                        className="object-contain w-full h-full"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                          Garment
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {clothingValidation && clothingValidation.isValid ? (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-700">Image Information</AlertTitle>
                    <AlertDescription className="text-blue-600">
                      <ul className="list-disc list-inside">
                        <li>Format: {clothingValidation.originalFormat?.toUpperCase()}</li>
                        <li>Dimensions: {clothingValidation.width} x {clothingValidation.height} px</li>
                        <li>Size: {clothingValidation.sizeInMB?.toFixed(2)} MB</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  clothingValidation && !clothingValidation.isValid && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Validation Error</AlertTitle>
                      <AlertDescription>{clothingValidation.errorMessage}</AlertDescription>
                    </Alert>
                  )
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/10 pt-4">
              <Button variant="outline" onClick={() => setActiveTab('model')} className="gap-2">
                <UserIcon className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleStartTryOn} 
                disabled={!modelImage || !clothingImage || loading || (clothingValidation && clothingValidation.isValid === false)}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Start Virtual Try-On
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Result area */}
      {result && (
        <Card className="border-primary/10 shadow-md bg-gradient-to-br from-background to-muted/30 animate-in fade-in-50 duration-500">
          <CardHeader className="bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                Try-On Result
                {(result.status === 'pending' || result.status === 'processing') && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />
                )}
              </CardTitle>
              <Badge 
                variant={
                  result.status === 'completed' ? 'default' : 
                  result.status === 'failed' ? 'destructive' : 
                  'outline'
                }
                className={
                  result.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                  result.status === 'processing' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 
                  result.status === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' :
                  'bg-red-100 text-red-800 hover:bg-red-100'
                }
              >
                {getStatusLabel(result.status)}
              </Badge>
            </div>
            <CardDescription>
              {result.status === 'pending' ? 'Your request is in the queue and will be processed soon' : 
               result.status === 'processing' ? 'AI is generating your virtual try-on image' : 
               result.status === 'completed' ? 'Your virtual try-on is ready!' : 
               'Something went wrong with your request'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {/* Progress */}
            {(result.status === 'pending' || result.status === 'processing') && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{result.progress || 0}%</span>
                </div>
                <Progress value={result.progress || 0} className="h-2" />
              </div>
            )}
            
            {/* Result image */}
            {result.url && (
              <div className="rounded-lg overflow-hidden border border-primary/20 shadow-md bg-muted/10">
                <div className="relative">
                  <img src={result.url} alt="Try-On Result" className="w-full object-contain" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-background hover:bg-primary/80">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            
            {/* Details */}
            <div className="text-sm space-y-2 bg-muted/20 p-4 rounded-md border border-muted">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary/70" />
                Process Details:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Task ID:</span>
                <span className="font-mono text-xs">{result.taskId}</span>
                
                {result.width && result.height && (
                  <>
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span>{result.width} x {result.height} px</span>
                  </>
                )}
                
                {result.imageSize && (
                  <>
                    <span className="text-muted-foreground">Size:</span>
                    <span>{result.imageSize}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/10 pt-4">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Start New
            </Button>
            
            {result.url && (
              <Button 
                onClick={() => window.open(result.url, '_blank')}
                className="gap-2 bg-primary hover:bg-primary/90"
              >
                <ImageIcon className="h-4 w-4" />
                View Full Image
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}