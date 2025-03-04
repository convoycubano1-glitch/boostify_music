import React, { useState, useRef, useCallback } from 'react';
import { Upload, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';

interface ProfessionalVoiceCloningProps {
  onComplete?: (voiceModelId: string) => void;
  onExit?: () => void;
}

export function ProfessionalVoiceCloning({ onComplete, onExit }: ProfessionalVoiceCloningProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [datasetDuration, setDatasetDuration] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Configuración avanzada
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [isolateVocals, setIsolateVocals] = useState(true);
  const [removeReverb, setRemoveReverb] = useState(false);
  const [removeBackingVocals, setRemoveBackingVocals] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Manejadores de arrastrar y soltar
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);
  
  // Manejador de cambio de archivo
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };
  
  // Procesar archivos seleccionados
  const handleFiles = (files: FileList) => {
    const file = files[0];
    
    // Verificar que sea un archivo de audio
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Tipo de archivo incorrecto",
        description: "Por favor, sube un archivo de audio (WAV, MP3, FLAC, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar el tamaño del archivo (límite de 200 MB)
    if (file.size > 200 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es 200 MB",
        variant: "destructive"
      });
      return;
    }
    
    setAudioFile(file);
    
    // Calcular una duración estimada simulada (en minutos)
    // En un entorno real, analizaríamos el archivo para obtener la duración real
    const fileSizeMB = file.size / (1024 * 1024);
    // Aproximadamente 1MB por minuto para audio comprimido de calidad media
    const estimatedDuration = Math.min(Math.round(fileSizeMB), 60);
    setDatasetDuration(estimatedDuration);
  };
  
  // Activar el diálogo de selección de archivo
  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  
  // Continuar al siguiente paso
  const handleContinue = () => {
    if (currentStep === 1) {
      if (!audioFile) {
        toast({
          title: "Archivo requerido",
          description: "Por favor, sube un archivo de audio para entrenar tu modelo de voz",
          variant: "destructive"
        });
        return;
      }
      
      // Continuar al siguiente paso (en una implementación real, aquí comenzaría el entrenamiento)
      setCurrentStep(2);
      
      // Simular finalización después de un tiempo (solo para demostración)
      setTimeout(() => {
        if (onComplete) {
          // Generar un ID ficticio para el modelo
          const mockModelId = `voice-model-${Date.now()}`;
          onComplete(mockModelId);
        }
      }, 3000);
    }
  };
  
  return (
    <Tabs defaultValue="step1" className="w-full">
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="step1" disabled={currentStep !== 1}>Datos de Entrenamiento</TabsTrigger>
        <TabsTrigger value="step2" disabled={currentStep !== 2}>Procesamiento</TabsTrigger>
        <TabsTrigger value="step3" disabled={currentStep < 3}>Completo</TabsTrigger>
      </TabsList>
      
      <TabsContent value="step1" className="space-y-6">
        <Card className="border-0 bg-black/70 shadow-xl">
          <CardContent className="p-6 space-y-6">
            {/* Área de subida de archivos */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center cursor-pointer 
                ${dragActive ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary/70 dark:border-gray-700'}
                ${audioFile ? 'bg-primary/5' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              style={{ minHeight: '200px' }}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleChange}
              />
              
              <Upload className="h-12 w-12 text-primary/70 mb-4" />
              <p className="text-center text-lg mb-2">Drag and drop file or Browse</p>
              <p className="text-center text-sm text-muted-foreground">Max file size: 200 MB</p>
              
              {audioFile && (
                <div className="mt-4 p-2 bg-primary/20 rounded-lg text-sm w-full max-w-sm text-center">
                  {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>
            
            {/* Indicador de duración del dataset */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Dataset duration: {datasetDuration} mins</span>
              </div>
              
              <div className="relative pt-1">
                <div className="flex h-2 overflow-hidden rounded bg-gray-800">
                  <div
                    style={{ width: `${Math.min((datasetDuration / 60) * 100, 100)}%` }}
                    className={`transition-all duration-300 ${
                      datasetDuration < 10 ? 'bg-red-500' : 
                      datasetDuration < 30 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs mt-1 text-gray-400">
                  <span>MINIMUM<br/>10 mins</span>
                  <span>RECOMMENDED<br/>30 mins</span>
                  <span>MAXIMUM<br/>60 mins</span>
                </div>
              </div>
            </div>
            
            {/* Configuración avanzada */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider">ADVANCED SETTINGS</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span>Auto-Enhance</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Automáticamente mejora la calidad de audio para el entrenamiento.
                            Reduce ruido y optimiza la claridad vocal.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={autoEnhance}
                    onCheckedChange={setAutoEnhance}
                  />
                </div>
                
                <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span>Isolate Vocals</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Separa automáticamente las voces de la instrumentación
                            para un entrenamiento más preciso.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={isolateVocals}
                    onCheckedChange={setIsolateVocals}
                  />
                </div>
                
                <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span>Remove Reverb</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Elimina la reverberación del audio para obtener
                            una voz más limpia para el entrenamiento.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={removeReverb}
                    onCheckedChange={setRemoveReverb}
                  />
                </div>
                
                <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span>Remove Backing Vocals</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 ml-2 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Elimina las voces secundarias o coros,
                            manteniendo solo la voz principal.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Switch
                    checked={removeBackingVocals}
                    onCheckedChange={setRemoveBackingVocals}
                  />
                </div>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={onExit}
              >
                EXIT
              </Button>
              
              <Button
                onClick={handleContinue}
                disabled={!audioFile}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                CONTINUE
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="step2">
        <Card className="border-0 bg-black/70 shadow-xl">
          <CardContent className="p-6 space-y-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Procesando tus datos de voz</h3>
              <p className="text-muted-foreground">
                Estamos preparando tu modelo de voz personalizado. Este proceso puede tardar varios minutos.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Convirtiendo audio</span>
                  <span>100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Aislando voces</span>
                  <span>80%</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mejorando calidad</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Entrenando modelo</span>
                  <span>10%</span>
                </div>
                <Progress value={10} className="h-2" />
              </div>
            </div>
            
            <div className="pt-4 text-center text-sm text-muted-foreground">
              Tiempo estimado restante: 15 minutos
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="step3">
        <Card className="border-0 bg-black/70 shadow-xl">
          <CardContent className="p-6 space-y-6 text-center">
            <div className="rounded-full bg-green-500/20 p-4 inline-flex">
              <CheckIcon className="h-12 w-12 text-green-500" />
            </div>
            
            <h3 className="text-2xl font-semibold">¡Modelo de voz completado!</h3>
            
            <p className="text-muted-foreground max-w-md mx-auto">
              Tu modelo de voz personalizado ha sido creado exitosamente y está listo para usar
              en la sección de conversión de voz.
            </p>
            
            <Button
              onClick={() => {
                console.log("Professional voice model completed");
                onComplete && onComplete('voice-model-pro-example');
              }}
              className="mt-4 bg-primary hover:bg-primary/90 text-white"
            >
              Ir a conversión de voz
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Icono de verificación
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}