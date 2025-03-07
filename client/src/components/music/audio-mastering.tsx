import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, Wand2, Mic, Download, RefreshCw, Waves, Music, History, 
  Split, Settings, AudioLines, Info, Cloud, Save, Mic2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

// Importar nuevos componentes de voz
import { VoiceModelCreator } from "./voice-model-creator";
import { VoiceConversion } from "./voice-conversion";

// Firebase imports
import { auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Timestamp } from "firebase/firestore";
import { 
  uploadAudioFile, 
  saveVoiceConversion, 
  getUserVoiceConversions, 
  updateVoiceConversion,
  getOrCreateUserDocument,
  downloadFileFromStorage,
  getMockVoiceConversions
} from "@/lib/firebase-storage";

// Importamos los tipos desde nuestro archivo centralizado
import type { VoiceConversionRecord, VoiceConversion as VoiceConversionType } from "@/lib/types/audio-types";

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
  data: VoiceConversionType[];
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
  const isMobile = useIsMobile();
  
  // Auth state
  const [user] = useAuthState(auth);
  const [fbConversions, setFbConversions] = useState<VoiceConversionRecord[]>([]);
  const [selectedFbConversion, setSelectedFbConversion] = useState<VoiceConversionRecord | null>(null);
  
  // Voice conversion specific states
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [conversionStrength, setConversionStrength] = useState(0.75);
  const [modelVolumeMix, setModelVolumeMix] = useState(0.5);
  const [pitchShift, setPitchShift] = useState(0);
  const [usePreprocessing, setUsePreprocessing] = useState(false);
  const [usePostprocessing, setUsePostprocessing] = useState(false);
  const [voiceConversions, setVoiceConversions] = useState<VoiceConversionType[]>([]);
  const [selectedConversion, setSelectedConversion] = useState<VoiceConversionType | null>(null);
  
  const { toast } = useToast();

  // Load user voice conversions from Firebase when authenticated
  useEffect(() => {
    if (user?.uid) {
      console.log("Loading user voice conversions from Firebase");
      const loadUserConversions = async () => {
        try {
          setIsLoading(true);
          const conversions = await getUserVoiceConversions(user.uid);
          setFbConversions(conversions);
          
          // Convert Firebase conversions to app format for UI
          const formattedConversions = conversions.map(conversion => {
            // Get the model name from the stored data or voiceModels array
            const modelName = conversion.modelName || 
              voiceModels.find(m => m.id === conversion.modelId)?.name || 
              `Model #${conversion.modelId}`;
              
            return {
              id: conversion.id || Math.random().toString(36).substring(7),
              fileName: conversion.fileName,
              status: conversion.status === 'processing' ? 'running' : conversion.status,
              voiceModelId: conversion.modelId,
              modelName: modelName,
              type: "infer", // Añadido el campo type requerido por la interfaz
              createdAt: conversion.createdAt.toDate().toISOString(),
              jobStartTime: conversion.createdAt.toDate().toISOString(),
              jobEndTime: conversion.completedAt ? conversion.completedAt.toDate().toISOString() : null,
              duration: "Unknown", // We don't store durations in Firestore yet
              originalUrl: conversion.originalFileUrl,
              resultUrl: conversion.resultFileUrl,
              // Add progress based on status
              progress: conversion.status === 'completed' ? 100 : 
                        conversion.status === 'failed' ? 0 : 
                        conversion.status === 'processing' ? 65 : 30
            };
          });
          
          setVoiceConversions(formattedConversions);
          console.log("Loaded voice conversions:", formattedConversions);
        } catch (error) {
          console.error("Error loading user conversions:", error);
          // Crear datos simulados si hay un error
          createSimulatedData();
        } finally {
          setIsLoading(false);
        }
      };
      
      loadUserConversions();
    } else {
      // Si no hay usuario, usar datos simulados
      createSimulatedData();
    }
  }, [user]);
  
  // Crear datos simulados para demostración
  const createSimulatedData = () => {
    // Usamos URLS reales de Firebase Storage para la demostración
    const simulatedResultUrl1 = "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/demoFiles%2Fmastered_audio_sample.mp3?alt=media&token=93a82642-59e3-406c-a7b6-8d4cc3b5c6a8";
    const simulatedResultUrl2 = "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/demoFiles%2Fvoice_conversion_sample.mp3?alt=media&token=1be2a3c4-5d6e-7f8g-9h0i-jk1l2m3n4o5p";
    
    const mockConversions: VoiceConversionType[] = [
      {
        id: "demo-1",
        fileName: "Vocal_Demo_01.wav",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        type: "infer",
        voiceModelId: 2,
        modelName: "Female Warm Pop",
        status: "completed",
        jobStartTime: new Date(Date.now() - 3500000).toISOString(),
        jobEndTime: new Date(Date.now() - 3200000).toISOString(),
        resultUrl: simulatedResultUrl1,
        progress: 100,
        duration: "3:45"
      },
      {
        id: "demo-2",
        fileName: "Rock_Vocal_Mix.wav",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        type: "infer",
        voiceModelId: 4,
        modelName: "Male Gritty Rock",
        status: "completed",
        jobStartTime: new Date(Date.now() - 7100000).toISOString(),
        jobEndTime: new Date(Date.now() - 6800000).toISOString(),
        resultUrl: simulatedResultUrl2,
        progress: 100,
        duration: "2:58"
      },
      {
        id: "demo-3",
        fileName: "New_Song_Draft.mp3",
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        type: "infer",
        voiceModelId: 7,
        modelName: "Female Jazz",
        status: "running",
        jobStartTime: new Date(Date.now() - 1700000).toISOString(),
        jobEndTime: null,
        resultUrl: null,
        progress: 65,
        duration: "Unknown"
      }
    ];
    
    setVoiceConversions(mockConversions);
  };
  
  // Fetch voice models when component mounts
  useEffect(() => {
    // Get models with mobile-friendly names
    const modelList = [
      { id: 1, name: isMobile ? "Male Pop" : "Smooth Male Pop", description: "Medium vocal range" },
      { id: 2, name: isMobile ? "Female Pop" : "Female Warm Pop", description: "High vocal range" },
      { id: 3, name: isMobile ? "F-LoFi" : "Female LoFi", description: "High vocal range" },
      { id: 4, name: isMobile ? "M-Rock" : "Male Gritty Rock", description: "High vocal range" },
      { id: 5, name: isMobile ? "M-Pop" : "Male Pop", description: "High vocal range" },
      { id: 6, name: isMobile ? "Rock M" : "Male Strained Rock", description: "Medium vocal range" },
      { id: 7, name: isMobile ? "F-Jazz" : "Female Jazz", description: "High vocal range" },
      { id: 8, name: isMobile ? "F-RnB" : "Female RnB", description: "Medium vocal range" },
      { id: 9, name: isMobile ? "M-Emo" : "Male Emo Pop", description: "Medium vocal range" },
      { id: 10, name: isMobile ? "F-Rock" : "Female Rock/Pop", description: "High vocal range" },
      { id: 11, name: isMobile ? "Electronic" : "Low Electronic", description: "Low vocal range" },
      { id: 12, name: isMobile ? "F-Songwriter" : "Female Singer Songwriter", description: "Medium vocal range" },
      { id: 13, name: isMobile ? "F-Slavic" : "Female Slavic", description: "High vocal range" },
      { id: 14, name: isMobile ? "F-Country" : "Female Pop Country", description: "High vocal range" },
      { id: 15, name: isMobile ? "B-Pop" : "Bright Pop", description: "High vocal range" },
      { id: 16, name: isMobile ? "M-Jazz" : "Male Jazz", description: "Medium vocal range" },
      { id: 17, name: isMobile ? "M-Alt Rock" : "Male Alternative Rock", description: "Low vocal range" },
      { id: 18, name: isMobile ? "F-Gospel" : "Female Gospel", description: "High vocal range" },
      { id: 19, name: isMobile ? "F-EDM" : "Female Bright EDM", description: "High vocal range" },
      { id: 20, name: isMobile ? "M-Rap" : "Male Low Rap", description: "Low vocal range" },
    ];
    
    setVoiceModels(modelList);
  }, [isMobile]);

  // Fetch voice conversions history from Firebase
  const fetchVoiceConversions = async () => {
    try {
      setIsLoading(true);
      
      // Verificar si hay un usuario autenticado
      if (!user?.uid) {
        // Si no hay usuario, cargar los datos de demostración
        // Esto es solo para fines de demostración
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockConversions: VoiceConversionType[] = [
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
          }
        ];
        
        setVoiceConversions(mockConversions);
        return;
      }
      
      // Si hay un usuario, obtener los datos de Firebase
      const conversions = await getUserVoiceConversions(user.uid);
      
      // Actualizar el estado con los datos de Firebase
      setFbConversions(conversions);
      
      // También actualizar el estado de la interfaz actual
      // Mapear los datos de Firebase al formato que usa la UI
      const mappedConversions: VoiceConversionType[] = conversions.map((conv, index) => ({
        id: index + 1, // Usar el índice como ID para UI
        createdAt: conv.createdAt.toDate().toISOString(),
        type: "infer",
        voiceModelId: conv.modelId,
        status: conv.status === "completed" ? "completed" : 
               conv.status === "failed" ? "failed" : "running",
        jobStartTime: conv.createdAt.toDate().toISOString(),
        jobEndTime: conv.completedAt ? conv.completedAt.toDate().toISOString() : null,
        resultUrl: conv.resultFileUrl
      }));
      
      setVoiceConversions(mappedConversions);
      
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
  const fetchVoiceConversionById = async (id: number | string) => {
    try {
      setIsLoading(true);
      
      // Detectar entorno de desarrollo o testing
      const isDev = window.location.hostname.includes('replit') || 
                  window.location.hostname.includes('localhost');
      
      // Para UI: recuperamos el objeto de conversión del estado local
      const conversion = voiceConversions.find(c => c.id === id || c.id.toString() === id.toString()) || null;
      setSelectedConversion(conversion);
      
      // Si estamos en entorno de desarrollo, usamos los datos simulados
      if (isDev) {
        console.log("Development environment detected - using mock conversion data for ID:", id);
        
        // Obtenemos todos los datos simulados - manejamos la promesa que devuelve getMockVoiceConversions
        const allMockConversions: VoiceConversionRecord[] = fbConversions.length > 0 
          ? fbConversions 
          : await getMockVoiceConversions();
        
        // Buscamos la conversión por ID o "conv-00X" si el ID es numérico
        const mockConversion = allMockConversions.find((c: VoiceConversionRecord) => 
          c.id === id.toString() || 
          (typeof id === 'number' && c.id === `conv-00${id}`)
        );
        
        if (mockConversion) {
          console.log("Found mock conversion:", mockConversion);
          setSelectedFbConversion(mockConversion);
          
          // No mostramos toasts en modo desarrollo al seleccionar
          // para no interrumpir la experiencia del usuario
        } else {
          console.log("No mock conversion found with ID:", id);
          // Usar la primera conversión como fallback si no encontramos la específica
          setSelectedFbConversion(allMockConversions[0]);
        }
        
        setIsLoading(false);
        return;
      }
      
      // Si no hay usuario autenticado, terminamos aquí
      if (!user?.uid) {
        console.log("User not authenticated, using local conversion data only");
        setIsLoading(false);
        return;
      }
      
      // Para Firebase: Buscamos en fbConversions para setear el estado de Firebase
      const fbConversion = fbConversions.find(c => c.id === id.toString()) || null;
      if (fbConversion) {
        setSelectedFbConversion(fbConversion);
        console.log("Found Firebase conversion:", fbConversion);
        
        // Si está en Firebase, actualizar la UI según el estado real
        if (fbConversion.status === "completed") {
          toast({
            title: "Success",
            description: "Voice conversion completed successfully",
            duration: 3000,
          });
        } else if (fbConversion.status === "processing" || fbConversion.status === "running") {
          toast({
            title: "In Progress",
            description: "Voice conversion is being processed",
            duration: 3000,
          });
        } else if (fbConversion.status === "failed") {
          toast({
            title: "Error",
            description: "Voice conversion failed",
            variant: "destructive",
            duration: 3000,
          });
        }
      } else {
        console.log("No Firebase conversion found with ID:", id);
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

  // Upload audio file to Firebase Storage
  const uploadToFirebaseStorage = async (file: File): Promise<string> => {
    try {
      if (!user?.uid) {
        // Si no hay usuario autenticado, simular respuesta para demo
        await new Promise(resolve => setTimeout(resolve, 800));
        return `https://example.com/uploads/${file.name}`;
      }
      
      // Subir archivo a Firebase Storage
      const fileUrl = await uploadAudioFile(file, 'voice-conversions/originals', user.uid);
      
      // Devolver la URL
      return fileUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file to storage",
        variant: "destructive"
      });
      throw new Error("Failed to upload file to storage");
    }
  };

  // Create a new voice conversion job with Firebase Storage integration
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
      
      // Upload audio file to Firebase Storage
      const fileUrl = await uploadToFirebaseStorage(file);
      
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
      
      // Get the selected voice model name
      const selectedModel = voiceModels.find(model => model.id === selectedModelId);
      const modelName = selectedModel?.name || `Model #${selectedModelId}`;
      
      // Create a record in Firestore
      if (user?.uid) {
        // Guarda los detalles de la conversión en Firestore
        const conversionRecord: Omit<VoiceConversionRecord, 'id'> = {
          userId: user.uid,
          fileName: file.name,
          modelId: selectedModelId,
          modelName: modelName,
          originalFileUrl: fileUrl,
          createdAt: Timestamp.now(),
          status: 'processing',
          settings: {
            conversionStrength: conversionStrength,
            modelVolumeMix: modelVolumeMix,
            pitchShift: pitchShift,
            usePreprocessing: usePreprocessing,
            usePostprocessing: usePostprocessing
          }
        };
        
        // Guardar en Firestore
        const newConversionId = await saveVoiceConversion(conversionRecord);
        
        // Recuperar conversiones actualizadas
        const updatedConversions = await getUserVoiceConversions(user.uid);
        setFbConversions(updatedConversions);
        
        // Encontrar el registro recién agregado
        const newRecord = updatedConversions.find(conv => conv.id === newConversionId);
        if (newRecord) {
          setSelectedFbConversion(newRecord);
        }
      }
      
      // Simular la respuesta para la UI (en producción esto se manejaría con webhooks)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Crear objeto para la UI
      const newConversion: VoiceConversionType = {
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
        description: "Voice conversion started successfully",
      });
      
      // Switch to history tab to show progress
      setActiveTab("history");
      
      // En producción, después de un tiempo simularíamos la finalización
      // Este código es solo para demostración
      setTimeout(async () => {
        if (user?.uid && newConversion) {
          // Simular resultado completado después de 5 segundos
          const resultUrl = `https://firebasestorage.googleapis.com/v0/b/project-id/o/voice-conversions%2Fresults%2F${user.uid}%2Fresult_${file.name}?alt=media`;
          
          // Actualizar el registro en Firestore (solo para demostración)
          try {
            const conversionUpdates: Partial<VoiceConversionRecord> = {
              status: 'completed',
              completedAt: Timestamp.now(),
              resultFileUrl: resultUrl
            };
            
            // Buscar el ID correcto
            const conversion = fbConversions.find(c => 
              c.fileName === file.name && 
              c.modelId === selectedModelId && 
              c.status === 'processing'
            );
            
            if (conversion?.id) {
              await updateVoiceConversion(conversion.id, conversionUpdates);
              // Recargar las conversiones
              const updatedConversions = await getUserVoiceConversions(user.uid);
              setFbConversions(updatedConversions);
            }
          } catch (error) {
            console.error("Error updating conversion:", error);
          }
        }
      }, 5000);
      
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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 mb-4 sm:mb-8">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-4 flex items-center gap-2 text-center sm:text-left">
        <AudioLines className="text-blue-500 h-4 sm:h-5 md:h-6 w-4 sm:w-5 md:w-6" />
        Audio Production Suite
      </h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2 p-1">
          <TabsTrigger value="mastering" className="flex flex-row items-center justify-center gap-1 sm:gap-3 py-2 sm:py-3 px-1 sm:px-2 text-xs sm:text-sm">
            <Waves className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm whitespace-nowrap font-medium">{isMobile ? "Audio" : "Audio Processing"}</span>
          </TabsTrigger>
          <TabsTrigger value="voice-conversion" className="flex flex-row items-center justify-center gap-3 py-3 px-2">
            <Mic className="h-5 w-5" />
            <span className="text-xs sm:text-sm whitespace-nowrap font-medium">{isMobile ? "Voice" : "Voice Conversion"}</span>
          </TabsTrigger>
          <TabsTrigger value="voice-model" className="flex flex-row items-center justify-center gap-3 py-3 px-2">
            <Music className="h-5 w-5" />
            <span className="text-xs sm:text-sm whitespace-nowrap font-medium">{isMobile ? "Train" : "Train Voice"}</span>
          </TabsTrigger>
          <TabsTrigger value="separation" className="flex flex-row items-center justify-center gap-3 py-3 px-2">
            <Split className="h-5 w-5" />
            <span className="text-xs sm:text-sm whitespace-nowrap font-medium">{isMobile ? "Split" : "Stem Separation"}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex flex-row items-center justify-center gap-3 py-3 px-2">
            <History className="h-5 w-5" />
            <span className="text-xs sm:text-sm whitespace-nowrap font-medium">History</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Audio Processing Tab */}
        <TabsContent value="mastering">
          <Card className="border-t-4 border-t-primary/80">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AudioLines className="h-5 w-5 text-primary" />
                    Audio Processing
                  </CardTitle>
                  <CardDescription>
                    Enhance your audio with professional mastering and processing techniques
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/5">Professional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="audio-mastering" className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary/80" />
                  <span>Audio File</span>
                </Label>
                <Input
                  id="audio-mastering"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="border-primary/20 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground italic">
                  Upload your audio file (WAV or MP3) for processing
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <TooltipProvider>
                  <Card className="bg-primary/5 border-0 hover:bg-primary/10 transition-colors cursor-pointer">
                    <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-1 sm:gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-full bg-primary/10 p-1 sm:p-2">
                            <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enhance your track with professional mastering</p>
                        </TooltipContent>
                      </Tooltip>
                      <h3 className="font-medium text-sm sm:text-base">Master Track</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Optimize levels, EQ, and dynamics
                      </p>
                    </CardContent>
                  </Card>
                
                  <Card className="bg-primary/5 border-0 hover:bg-primary/10 transition-colors cursor-pointer">
                    <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-1 sm:gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-full bg-primary/10 p-1 sm:p-2">
                            <Split className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Separate vocals from instrumentation</p>
                        </TooltipContent>
                      </Tooltip>
                      <h3 className="font-medium text-sm sm:text-base">Voice Extraction</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Isolate vocals from the mix
                      </p>
                    </CardContent>
                  </Card>
                
                  <Card className="bg-primary/5 border-0 hover:bg-primary/10 transition-colors cursor-pointer">
                    <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-1 sm:gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-full bg-primary/10 p-1 sm:p-2">
                            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Customize audio processing settings</p>
                        </TooltipContent>
                      </Tooltip>
                      <h3 className="font-medium text-sm sm:text-base">Advanced Settings</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Fine-tune processing parameters
                      </p>
                    </CardContent>
                  </Card>
                </TooltipProvider>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                onClick={handleMaster}
                disabled={isMastering || !file}
                className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90"
              >
                {isMastering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Process Audio
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Processing typically takes 1-2 minutes depending on file size
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Voice Conversion Tab */}
        <TabsContent value="voice-conversion">
          <Card className="border-t-4 border-t-primary/80">
            <CardHeader className="px-3 py-4 sm:px-6 sm:py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    Voice Conversion
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Transform your vocals using advanced AI voice models
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-500/5 text-blue-500 text-xs">Professional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Recording High-Quality Datasets Guide Section */}
              <div className="bg-primary/5 rounded-lg p-4 mb-4">
                <h3 className="text-base font-semibold mb-2">Recording High-Quality Datasets</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  30-60 minutes of clean and varied audio will result in the highest-quality voice models.
                </p>
                
                <h4 className="text-sm font-medium mt-3 mb-1">Clean audio recommendations:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Use a quality microphone into an audio interface</li>
                  <li>Record in a noise-free setting with limited room reverberations</li>
                  <li>Maintain correct and consistent mic placement</li>
                  <li>Ensure volume peaks between -9db and -3db</li>
                </ul>
                
                <h4 className="text-sm font-medium mt-3 mb-1">Processing recommendations:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Maintain consistent dynamics across the whole dataset</li>
                  <li>Apply light EQ to remove any muddiness or hiss</li>
                  <li>Use compression/limiting to smooth out peaks</li>
                  <li>Avoid reverb, delay, or doubling effects</li>
                </ul>
              </div>
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
                <Label htmlFor="voice-model" className="flex items-center gap-2">
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-primary/80" />
                  <span className="text-sm sm:text-base">Voice Model</span>
                </Label>
                <Select 
                  onValueChange={(value) => setSelectedModelId(Number(value))}
                  value={selectedModelId?.toString()}
                >
                  <SelectTrigger 
                    id="voice-model" 
                    className="text-xs sm:text-sm py-2 px-3 sm:py-2 sm:px-4"
                  >
                    <SelectValue placeholder={isMobile ? "Select model" : "Select voice model"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <div className="max-h-60 overflow-y-auto">
                      {voiceModels.map((model) => (
                        <SelectItem 
                          key={model.id} 
                          value={model.id.toString()}
                          className="text-xs sm:text-sm py-1 sm:py-2"
                        >
                          {model.name}
                          {!isMobile && 
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({model.description})
                            </span>
                          }
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 sm:space-y-3 mb-1 sm:mb-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="conversion-strength" className="text-xs sm:text-sm flex items-center gap-1 font-medium">
                    <span className="hidden sm:inline">Conversion</span> Strength
                  </Label>
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded-md">
                    {Math.round(conversionStrength * 100)}%
                  </span>
                </div>
                <Slider
                  id="conversion-strength"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[conversionStrength]}
                  onValueChange={(value) => setConversionStrength(value[0])}
                  className="py-3 sm:py-4 h-5 sm:h-6 touch-action-manipulation"
                />
                <p className="text-xs text-muted-foreground mt-0.5 px-1 hidden sm:block">
                  Controls how strongly the source audio matches the voice model
                </p>
              </div>
              
              <div className="space-y-2 sm:space-y-3 mb-1 sm:mb-2 mt-4 sm:mt-5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="volume-mix" className="text-xs sm:text-sm flex items-center gap-1 font-medium">
                    <span className="hidden sm:inline">Model</span> Volume Mix
                  </Label>
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded-md">
                    {Math.round(modelVolumeMix * 100)}%
                  </span>
                </div>
                <Slider
                  id="volume-mix"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[modelVolumeMix]}
                  onValueChange={(value) => setModelVolumeMix(value[0])}
                  className="py-3 sm:py-4 h-5 sm:h-6 touch-action-manipulation"
                />
                <p className="text-xs text-muted-foreground mt-0.5 px-1 hidden sm:block">
                  Blends between source audio and target model characteristics
                </p>
              </div>
              
              <div className="space-y-2 sm:space-y-3 mb-1 sm:mb-2 mt-4 sm:mt-5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="pitch-shift" className="text-xs sm:text-sm flex items-center gap-1 font-medium">
                    Pitch Shift
                  </Label>
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded-md">
                    {pitchShift > 0 ? `+${pitchShift}` : pitchShift} <span className="hidden sm:inline">semitones</span>
                  </span>
                </div>
                <Slider
                  id="pitch-shift"
                  min={-24}
                  max={24}
                  step={1}
                  value={[pitchShift]}
                  onValueChange={(value) => setPitchShift(value[0])}
                  className="py-3 sm:py-4 h-5 sm:h-6 touch-action-manipulation"
                />
                <p className="text-xs text-muted-foreground mt-0.5 px-1 hidden sm:block">
                  Shifts the pitch up or down (measured in semitones)
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label 
                      htmlFor="preprocessing" 
                      className="text-xs sm:text-sm font-medium"
                    >
                      Pre-processing
                    </Label>
                    <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
                      {isMobile ? "Noise gate, high-pass" : "Apply noise gate and high-pass filter"}
                    </p>
                  </div>
                  <Switch
                    id="preprocessing"
                    checked={usePreprocessing}
                    onCheckedChange={setUsePreprocessing}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label 
                      htmlFor="postprocessing" 
                      className="text-xs sm:text-sm font-medium"
                    >
                      Post-processing
                    </Label>
                    <p className="text-xs text-muted-foreground line-clamp-1 sm:line-clamp-none">
                      {isMobile ? "Compression effects" : "Apply compression effects"}
                    </p>
                  </div>
                  <Switch
                    id="postprocessing"
                    checked={usePostprocessing}
                    onCheckedChange={setUsePostprocessing}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="py-4 sm:py-6">
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={createVoiceConversion}
                  disabled={isMastering || !file || !selectedModelId}
                  className="w-full h-10 sm:h-12 bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-sm sm:text-base"
                >
                  {isMastering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      {isMobile ? "Converting..." : "Converting Voice..."}
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {isMobile ? "Convert" : "Convert Voice"}
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {user ? 
                    "Your conversions will be saved to your account" : 
                    "Sign in to save your conversion history"
                  }
                </p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Voice Model Training Tab */}
        <TabsContent value="voice-model">
          <Card className="border-t-4 border-t-primary/80">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Voice Model Training
                  </CardTitle>
                  <CardDescription>
                    Create your own custom voice models for voice conversion with AI
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/5">Professional</Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-80">
                        <p>Revocalize API status check</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Voice Model Creator component */}
              <VoiceModelCreator 
                onModelCreated={(modelId: string) => {
                  toast({
                    title: "Model created successfully",
                    description: `Voice model with ID ${modelId} has been created and is ready to use.`,
                  });
                }} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stem Separation Tab */}
        <TabsContent value="separation">
          <Card className="border-t-4 border-t-primary/80">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Split className="h-5 w-5 text-primary" />
                    Stem Separation
                  </CardTitle>
                  <CardDescription>
                    Separate your audio into individual instrument tracks
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/5">Professional</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="audio-stem-separation" className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary/80" />
                  <span>Audio File</span>
                </Label>
                <Input
                  id="audio-stem-separation"
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="border-primary/20 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground italic">
                  Upload your mixed audio file (WAV or MP3) for stem separation
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                <TooltipProvider>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Card className="bg-primary/5 border-0 hover:bg-primary/10 transition-colors cursor-pointer">
                      <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-1 sm:gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-full bg-primary/10 p-1 sm:p-2">
                              <Mic className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Extract vocals from the mix</p>
                          </TooltipContent>
                        </Tooltip>
                        <h3 className="font-medium text-sm sm:text-base">Vocals</h3>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-primary/5 border-0 hover:bg-primary/10 transition-colors cursor-pointer">
                      <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-1 sm:gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-full bg-primary/10 p-1 sm:p-2">
                              <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Extract instrumentals (no vocals)</p>
                          </TooltipContent>
                        </Tooltip>
                        <h3 className="font-medium text-sm sm:text-base">Instrumental</h3>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <Card className="bg-primary/5 border-0 hover:bg-primary/10 transition-colors cursor-pointer">
                      <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-1 sm:gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-full bg-primary/10 p-1 sm:p-2">
                              <Waves className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Extract drum tracks</p>
                          </TooltipContent>
                        </Tooltip>
                        <h3 className="font-medium text-sm sm:text-base">Drums</h3>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-primary/5 border-0 hover:bg-primary/10 transition-colors cursor-pointer">
                      <CardContent className="p-2 sm:p-4 flex flex-col items-center gap-1 sm:gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-full bg-primary/10 p-1 sm:p-2">
                              <AudioLines className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Extract bass lines</p>
                          </TooltipContent>
                        </Tooltip>
                        <h3 className="font-medium text-sm sm:text-base">Bass</h3>
                      </CardContent>
                    </Card>
                  </div>
                </TooltipProvider>
                
                <div className="bg-primary/5 rounded-lg p-3 sm:p-4">
                  <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">About Stem Separation</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                    Our advanced AI can separate your mixed audio into individual instrument tracks (stems), including:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 sm:space-y-1 list-disc pl-3 sm:pl-4">
                    <li>Vocals (lead and backing vocals)</li>
                    <li>Instruments (all non-vocal elements)</li>
                    <li>Drums (percussion elements)</li>
                    <li>Bass (bass guitar and sub frequencies)</li>
                    <li>Other (remaining musical elements)</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2 sm:mt-3 italic">
                    For best results, use high-quality WAV or lossless audio files.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button 
                onClick={handleMaster}
                disabled={isMastering || !file}
                className="w-full bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90"
              >
                {isMastering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Separating Stems...
                  </>
                ) : (
                  <>
                    <Split className="mr-2 h-4 w-4" />
                    Separate Stems
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Processing typically takes 2-5 minutes depending on file size
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card className="border-t-4 border-t-primary/80">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Processing History
                  </CardTitle>
                  <CardDescription>
                    View and manage your audio processing jobs
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/5">Recent Jobs</Badge>
              </div>
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
                  {voiceConversions.map((conversion) => {
                    // Determine the appropriate model name based on the model ID
                    const modelName = voiceModels.find(model => model.id === conversion.voiceModelId)?.name || `Model #${conversion.voiceModelId}`;
                    
                    return (
                      <Card 
                        key={conversion.id} 
                        className={`cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${
                          selectedConversion?.id === conversion.id 
                            ? 'border-primary border-2 shadow-md' 
                            : 'border-border'
                        }`}
                        onClick={() => fetchVoiceConversionById(conversion.id.toString())}
                      >
                        {/* Progress bar at top */}
                        <div className="relative h-1 w-full bg-muted">
                          <div 
                            className={`absolute top-0 left-0 h-full ${
                              conversion.status === "completed" 
                                ? "bg-green-500" 
                                : conversion.status === "failed" 
                                ? "bg-red-500" 
                                : "bg-primary animate-pulse"
                            }`}
                            style={{ width: `${conversion.progress || (conversion.status === 'completed' ? 100 : conversion.status === 'running' ? 65 : 0)}%` }}
                          />
                        </div>
                        
                        <CardContent className={`p-3 sm:p-4 relative ${
                          conversion.status === "completed" 
                            ? "bg-green-50/30 dark:bg-green-950/10" 
                            : conversion.status === "failed" 
                            ? "bg-red-50/30 dark:bg-red-950/10" 
                            : ""
                        }`}>
                          <div className="flex flex-col gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {/* Icon based on status */}
                                {conversion.status === "completed" ? (
                                  <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30 flex-shrink-0">
                                    <Music className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                  </div>
                                ) : conversion.status === "failed" ? (
                                  <div className="rounded-full bg-red-100 p-1 dark:bg-red-900/30 flex-shrink-0">
                                    <Info className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                  </div>
                                ) : (
                                  <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                                  </div>
                                )}
                                
                                <h4 className="text-sm font-medium line-clamp-1">
                                  {conversion.fileName || "Voice conversion"}
                                </h4>
                              </div>
                              
                              <div className="flex items-center gap-1 mt-1.5">
                                <p className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                                  {new Date(conversion.createdAt).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <span className="text-muted-foreground hidden sm:inline">•</span>
                                <p className="text-xs font-medium text-primary/90 truncate">{modelName}</p>
                              </div>
                            </div>
                            
                            {/* Badges in a flex-wrap container to prevent overflow */}
                            <div className="flex flex-wrap items-center gap-1">
                              {conversion.status === "completed" ? (
                                <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[10px] py-0 h-5 px-1.5">
                                  Completed
                                </Badge>
                              ) : conversion.status === "failed" ? (
                                <Badge variant="outline" className="bg-red-100/50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 text-[10px] py-0 h-5 px-1.5">
                                  Failed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 animate-pulse text-[10px] py-0 h-5 px-1.5">
                                  Processing
                                </Badge>
                              )}
                              
                              {/* Show duration if available */}
                              {conversion.duration && conversion.duration !== "Unknown" && (
                                <Badge variant="outline" className="bg-muted/50 border-muted text-[10px] py-0 h-5 px-1.5">
                                  {conversion.duration}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Quick action buttons */}
                          {conversion.status === "completed" && conversion.resultUrl && (
                            <div className="mt-2 flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 min-w-8 ml-auto" /* Agregado min-w-8 y ml-auto para evitar superposición */
                                onClick={(e) => {
                                  e.stopPropagation();
                                  
                                  // Usar la función personalizada para descargar archivos de Firebase Storage
                                  const fileName = conversion.fileName || `converted_${new Date().getTime()}.wav`;
                                  const processedName = `processed_${fileName}`;
                                  
                                  try {
                                    toast({
                                      title: "Download Started",
                                      description: "Your file is downloading...",
                                      duration: 3000,
                                    });
                                    
                                    if (conversion.resultUrl) {
                                      downloadFileFromStorage(conversion.resultUrl, processedName);
                                    } else {
                                      throw new Error("No URL available for download");
                                    }
                                  } catch (error) {
                                    console.error("Download error:", error);
                                    toast({
                                      title: "Error",
                                      description: "Could not download the file",
                                      variant: "destructive"
                                    });
                                    
                                    // Intento alternativo de descarga
                                    if (conversion.resultUrl) {
                                      window.open(conversion.resultUrl, '_blank');
                                    }
                                  }
                                }}
                                aria-label="Download file"
                              >
                                <Download className="h-4 w-4 text-primary" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            
            {selectedConversion && (
              <CardFooter className="flex-col items-start p-3 sm:p-4">
                <Separator className="my-1 sm:my-2" />
                <div className="w-full space-y-2">
                  <h3 className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-primary" />
                    {isMobile ? "Details" : "Selected Conversion Details"}
                  </h3>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="truncate">{selectedConversion.id}</span>
                    
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`capitalize font-medium ${
                      selectedConversion.status === 'completed' ? 'text-green-600' :
                      selectedConversion.status === 'running' ? 'text-blue-600' :
                      selectedConversion.status === 'failed' ? 'text-red-600' : ''
                    }`}>
                      {selectedConversion.status}
                    </span>
                    
                    <span className="text-muted-foreground">Started:</span>
                    <span className="truncate">
                      {new Date(selectedConversion.jobStartTime).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: !isMobile
                      })}
                    </span>
                    
                    {selectedConversion.jobEndTime && (
                      <>
                        <span className="text-muted-foreground">Completed:</span>
                        <span className="truncate">
                          {new Date(selectedConversion.jobEndTime).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: !isMobile
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {selectedConversion.status === 'completed' && selectedConversion.resultUrl && (
                    <div className="pt-1.5 sm:pt-3">
                      <Button 
                        className="w-full text-xs sm:text-sm bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90" 
                        onClick={() => {
                          // Usar la función personalizada para descargar archivos de Firebase Storage
                          const fileName = selectedConversion.fileName || `converted_${new Date().getTime()}.wav`;
                          const processedName = `processed_${fileName}`;
                          
                          try {
                            toast({
                              title: "Descarga iniciada",
                              description: "El archivo procesado se está descargando...",
                              duration: 3000,
                            });
                            
                            if (selectedConversion.resultUrl) {
                              downloadFileFromStorage(selectedConversion.resultUrl, processedName);
                            } else {
                              throw new Error("No URL disponible para descargar");
                            }
                          } catch (error) {
                            console.error("Error al descargar:", error);
                            toast({
                              title: "Error",
                              description: "No se pudo descargar el archivo",
                              variant: "destructive"
                            });
                            
                            // Intento de descarga alternativo
                            if (selectedConversion.resultUrl) {
                              window.open(selectedConversion.resultUrl, '_blank');
                            }
                          }
                        }}
                      >
                        <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {isMobile ? "Download" : "Download Result"}
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
