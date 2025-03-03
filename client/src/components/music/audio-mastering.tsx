import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Mic, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

// Interfaces for voice conversion
interface VoiceConversion {
  id: number;
  createdAt: string;
  type: string;
  voiceModelId: number;
  status: "pending" | "running" | "completed" | "failed";
  jobStartTime: string;
  jobEndTime: string | null;
  resultUrl?: string;
}

interface PaginationMeta {
  currentPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPage: number;
  lastPageUrl: string;
  nextPageUrl: string | null;
  perPage: number;
  previousPageUrl: string | null;
  total: number;
}

interface VoiceConversionListResponse {
  data: VoiceConversion[];
  meta: PaginationMeta;
}

interface PreProcessingEffect {
  noiseGate?: {
    threshold_db: number;
    ratio: number;
    attack_ms: number;
    release_ms: number;
  };
  highPassFilter?: {
    cutoff_frequency_hz: number;
  };
  lowPassFilter?: {
    cutoff_frequency_hz: number;
  };
  compressor?: {
    threshold_db: number;
    ratio: number;
    attack_ms: number;
    release_ms: number;
  };
}

interface VoiceModel {
  id: number;
  name: string;
  description: string;
  previewUrl?: string;
}

export function AudioMastering() {
  // Basic state
  const [file, setFile] = useState<File | null>(null);
  const [isMastering, setIsMastering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("mastering");
  
  // Voice conversion specific states
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [conversionStrength, setConversionStrength] = useState(0.75);
  const [modelVolumeMix, setModelVolumeMix] = useState(0.5);
  const [pitchShift, setPitchShift] = useState(0);
  const [usePreprocessing, setUsePreprocessing] = useState(false);
  const [usePostprocessing, setUsePostprocessing] = useState(false);
  const [voiceConversions, setVoiceConversions] = useState<VoiceConversion[]>([]);
  const [selectedConversion, setSelectedConversion] = useState<VoiceConversion | null>(null);
  
  const { toast } = useToast();

  // Fetch voice models when component mounts
  useEffect(() => {
    // Simulating API call to fetch voice models
    // In a real implementation, you would call your API
    setVoiceModels([
      { id: 1, name: "Male Vocalist", description: "Professional male vocalist" },
      { id: 2, name: "Female Vocalist", description: "Professional female vocalist" },
      { id: 3, name: "Rap Artist", description: "Professional rap vocals" },
      { id: 4, name: "Pop Star", description: "Professional pop vocals" },
    ]);
  }, []);

  // Fetch voice conversions history
  const fetchVoiceConversions = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would call your API
      // This is a simulated API response
      // const response = await axios.get<VoiceConversionListResponse>(
      //   'https://arpeggi.io/api/kits/v1/voice-conversions',
      //   { headers: { Authorization: `Bearer ${yourApiKey}` } }
      // );
      
      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockConversions: VoiceConversion[] = [
        {
          id: 1,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          type: "infer",
          voiceModelId: 2,
          status: "completed",
          jobStartTime: new Date(Date.now() - 3500000).toISOString(),
          jobEndTime: new Date(Date.now() - 3200000).toISOString(),
          resultUrl: "https://example.com/result1.mp3"
        },
        {
          id: 2,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          type: "infer",
          voiceModelId: 1,
          status: "completed",
          jobStartTime: new Date(Date.now() - 7100000).toISOString(),
          jobEndTime: new Date(Date.now() - 6800000).toISOString(),
          resultUrl: "https://example.com/result2.mp3"
        },
        {
          id: 3,
          createdAt: new Date().toISOString(),
          type: "infer",
          voiceModelId: 3,
          status: "running",
          jobStartTime: new Date(Date.now() - 100000).toISOString(),
          jobEndTime: null
        }
      ];
      
      setVoiceConversions(mockConversions);
    } catch (error) {
      console.error("Error fetching voice conversions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch voice conversions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch a specific voice conversion by ID
  const fetchVoiceConversionById = async (id: number) => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would call your API
      // const response = await axios.get<VoiceConversion>(
      //   `https://arpeggi.io/api/kits/v1/voice-conversions/${id}`,
      //   { headers: { Authorization: `Bearer ${yourApiKey}` } }
      // );
      
      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const conversion = voiceConversions.find(c => c.id === id) || null;
      setSelectedConversion(conversion);
      
      if (conversion?.status === "completed") {
        toast({
          title: "Success",
          description: "Voice conversion completed successfully"
        });
      } else if (conversion?.status === "running") {
        toast({
          title: "In Progress",
          description: "Voice conversion is still processing"
        });
      }
    } catch (error) {
      console.error("Error fetching voice conversion:", error);
      toast({
        title: "Error",
        description: "Failed to fetch voice conversion details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload audio file to ephemeral storage
  const uploadToEphemeralStorage = async (file: File): Promise<string> => {
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      
      // Extract base64 part without the data URI prefix
      const base64Content = base64Data.split(',')[1];
      
      // In a real implementation, you would call your API
      // const response = await axios.post(
      //   'https://upload.theapi.app/api/ephemeral_resource',
      //   {
      //     file_name: file.name,
      //     file_data: base64Content
      //   },
      //   { headers: { 'x-api-key': yourApiKey, 'Content-Type': 'application/json' } }
      // );
      
      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return simulated URL
      return `https://example.com/uploads/${file.name}`;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error("Failed to upload file to storage");
    }
  };

  // Create a new voice conversion job
  const createVoiceConversion = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an audio file",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedModelId) {
      toast({
        title: "Error",
        description: "Please select a voice model",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsMastering(true);
      
      // Upload audio file to ephemeral storage
      const fileUrl = await uploadToEphemeralStorage(file);
      
      // Prepare pre and post processing effects if enabled
      const preProcessingEffects: PreProcessingEffect | undefined = usePreprocessing ? {
        noiseGate: {
          threshold_db: -50,
          ratio: 4,
          attack_ms: 5,
          release_ms: 50
        },
        highPassFilter: {
          cutoff_frequency_hz: 100
        }
      } : undefined;
      
      const postProcessingEffects: PreProcessingEffect | undefined = usePostprocessing ? {
        compressor: {
          threshold_db: -24,
          ratio: 4,
          attack_ms: 5,
          release_ms: 50
        }
      } : undefined;
      
      // In a real implementation, you would call your API
      // const formData = new FormData();
      // formData.append('voiceModelId', String(selectedModelId));
      // formData.append('soundFile', file);
      // formData.append('conversionStrength', String(conversionStrength));
      // formData.append('modelVolumeMix', String(modelVolumeMix));
      // formData.append('pitchShift', String(pitchShift));
      
      // if (preProcessingEffects) {
      //   formData.append('pre', JSON.stringify(preProcessingEffects));
      // }
      
      // if (postProcessingEffects) {
      //   formData.append('post', JSON.stringify(postProcessingEffects));
      // }
      
      // const response = await axios.post<VoiceConversion>(
      //   'https://arpeggi.io/api/kits/v1/voice-conversions',
      //   formData,
      //   { 
      //     headers: { 
      //       Authorization: `Bearer ${yourApiKey}`,
      //       'Content-Type': 'multipart/form-data'
      //     } 
      //   }
      // );
      
      // Simulated response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newConversion: VoiceConversion = {
        id: Math.floor(Math.random() * 1000) + 10,
        createdAt: new Date().toISOString(),
        type: "infer",
        voiceModelId: selectedModelId,
        status: "running",
        jobStartTime: new Date().toISOString(),
        jobEndTime: null
      };
      
      // Add to list and select the new conversion
      setVoiceConversions(prev => [newConversion, ...prev]);
      setSelectedConversion(newConversion);
      
      toast({
        title: "Success",
        description: "Voice conversion started successfully"
      });
      
      // Switch to history tab to show progress
      setActiveTab("history");
      
    } catch (error) {
      console.error("Error creating voice conversion:", error);
      toast({
        title: "Error",
        description: "Failed to start voice conversion. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMastering(false);
    }
  };

  // Original mastering functionality
  const handleMaster = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select an audio file",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsMastering(true);
      // Here we would call our mastering API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated API call

      toast({
        title: "Success",
        description: "Audio mastering started successfully"
      });

    } catch (error) {
      console.error("Error mastering audio:", error);
      toast({
        title: "Error",
        description: "Failed to master audio. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMastering(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mastering">Mastering</TabsTrigger>
          <TabsTrigger value="voice-conversion">Voice Conversion</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        {/* Mastering Tab */}
        <TabsContent value="mastering">
          <Card>
            <CardHeader>
              <CardTitle>Audio Mastering</CardTitle>
              <CardDescription>
                Enhance your audio with professional mastering techniques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audio-mastering">Audio File</Label>
                <Input
                  id="audio-mastering"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleMaster}
                disabled={isMastering || !file}
                className="w-full"
              >
                {isMastering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mastering...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Master Track
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Voice Conversion Tab */}
        <TabsContent value="voice-conversion">
          <Card>
            <CardHeader>
              <CardTitle>Voice Conversion</CardTitle>
              <CardDescription>
                Transform your vocals using advanced AI voice models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="audio-voice">Audio File</Label>
                <Input
                  id="audio-voice"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voice-model">Voice Model</Label>
                <Select 
                  onValueChange={(value) => setSelectedModelId(Number(value))}
                  value={selectedModelId?.toString()}
                >
                  <SelectTrigger id="voice-model">
                    <SelectValue placeholder="Select voice model" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceModels.map((model) => (
                      <SelectItem key={model.id} value={model.id.toString()}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="conversion-strength">Conversion Strength</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(conversionStrength * 100)}%</span>
                </div>
                <Slider
                  id="conversion-strength"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[conversionStrength]}
                  onValueChange={(value) => setConversionStrength(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="volume-mix">Model Volume Mix</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(modelVolumeMix * 100)}%</span>
                </div>
                <Slider
                  id="volume-mix"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[modelVolumeMix]}
                  onValueChange={(value) => setModelVolumeMix(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="pitch-shift">Pitch Shift</Label>
                  <span className="text-sm text-muted-foreground">{pitchShift > 0 ? `+${pitchShift}` : pitchShift} semitones</span>
                </div>
                <Slider
                  id="pitch-shift"
                  min={-24}
                  max={24}
                  step={1}
                  value={[pitchShift]}
                  onValueChange={(value) => setPitchShift(value[0])}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="preprocessing">Pre-processing</Label>
                    <p className="text-sm text-muted-foreground">Apply noise gate and high-pass filter</p>
                  </div>
                  <Switch
                    id="preprocessing"
                    checked={usePreprocessing}
                    onCheckedChange={setUsePreprocessing}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="postprocessing">Post-processing</Label>
                    <p className="text-sm text-muted-foreground">Apply compression effects</p>
                  </div>
                  <Switch
                    id="postprocessing"
                    checked={usePostprocessing}
                    onCheckedChange={setUsePostprocessing}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={createVoiceConversion}
                disabled={isMastering || !file || !selectedModelId}
                className="w-full"
              >
                {isMastering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting Voice...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Convert Voice
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
              <CardDescription>
                View and manage your voice conversion jobs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={fetchVoiceConversions} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
              
              {voiceConversions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conversion jobs found. Start by converting a voice in the Voice Conversion tab.
                </div>
              ) : (
                <div className="space-y-3">
                  {voiceConversions.map((conversion) => (
                    <Card 
                      key={conversion.id} 
                      className={`cursor-pointer hover:bg-accent/50 transition-colors ${selectedConversion?.id === conversion.id ? 'border-primary' : ''}`}
                      onClick={() => fetchVoiceConversionById(conversion.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="text-sm font-medium">
                              Voice Model #{conversion.voiceModelId}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(conversion.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              conversion.status === 'completed' ? 'bg-green-100 text-green-800' :
                              conversion.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              conversion.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {conversion.status.charAt(0).toUpperCase() + conversion.status.slice(1)}
                            </div>
                            
                            {conversion.status === 'completed' && conversion.resultUrl && (
                              <Button size="icon" variant="ghost" onClick={(e) => {
                                e.stopPropagation();
                                window.open(conversion.resultUrl, '_blank');
                              }}>
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            
            {selectedConversion && (
              <CardFooter className="flex-col items-start">
                <Separator className="my-2" />
                <div className="w-full space-y-2">
                  <h3 className="text-sm font-medium">Selected Conversion Details</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span>{selectedConversion.id}</span>
                    
                    <span className="text-muted-foreground">Status:</span>
                    <span>{selectedConversion.status}</span>
                    
                    <span className="text-muted-foreground">Started:</span>
                    <span>{new Date(selectedConversion.jobStartTime).toLocaleString()}</span>
                    
                    {selectedConversion.jobEndTime && (
                      <>
                        <span className="text-muted-foreground">Completed:</span>
                        <span>{new Date(selectedConversion.jobEndTime).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  
                  {selectedConversion.status === 'completed' && selectedConversion.resultUrl && (
                    <div className="pt-3">
                      <Button className="w-full" onClick={() => window.open(selectedConversion.resultUrl, '_blank')}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Result
                      </Button>
                    </div>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
