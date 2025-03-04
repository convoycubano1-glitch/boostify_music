/**
 * Componente de Creación de Modelos de Voz
 * 
 * Este componente permite a los usuarios:
 * 1. Grabar o subir muestras de voz
 * 2. Entrenar un modelo personalizado de voz
 * 3. Ver el progreso de entrenamiento
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Mic, Upload, Pause, Save, Server, Info, AlertCircle } from 'lucide-react';

interface VoiceModelCreatorProps {
  className?: string;
}

export function VoiceModelCreator({ className }: VoiceModelCreatorProps) {
  // Estados para controlar la grabación
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [audioSamples, setAudioSamples] = useState<{id: string; name: string; duration: number; url: string}[]>([]);
  const [modelName, setModelName] = useState<string>('');
  const [enhanceFidelity, setEnhanceFidelity] = useState<boolean>(true);
  const [reduceNoise, setReduceNoise] = useState<boolean>(true);
  const [isCreatingModel, setIsCreatingModel] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(0);
  
  // Referencia para acceder al grabador
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Función para iniciar grabación
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const sampleName = `Sample_${audioSamples.length + 1}`;
        
        setAudioSamples([
          ...audioSamples,
          {
            id: `sample-${Date.now()}`,
            name: sampleName,
            duration: recordingTime,
            url: audioUrl
          }
        ]);
        
        toast({
          title: 'Grabación completada',
          description: `Se ha guardado la muestra "${sampleName}" (${recordingTime}s)`
        });
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Iniciar temporizador para seguir el tiempo de grabación
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error al iniciar grabación:', error);
      toast({
        title: 'Error de grabación',
        description: 'No se pudo acceder al micrófono. Verifica los permisos.',
        variant: 'destructive'
      });
    }
  };
  
  // Función para detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Detener todos los tracks de audio
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Limpiar temporizador
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };
  
  // Función para subir archivo de audio
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Verificar que sea un archivo de audio
      if (!file.type.startsWith('audio/')) {
        toast({
          title: 'Tipo de archivo incorrecto',
          description: 'Por favor, sube un archivo de audio (WAV, MP3, etc.)',
          variant: 'destructive'
        });
        return;
      }
      
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      
      // Cargar el audio para obtener metadatos como duración
      audio.onloadedmetadata = () => {
        const sampleName = file.name.replace(/\.[^/.]+$/, ""); // Nombre sin extensión
        
        setAudioSamples([
          ...audioSamples,
          {
            id: `sample-${Date.now()}`,
            name: sampleName,
            duration: Math.round(audio.duration),
            url: audioUrl
          }
        ]);
        
        toast({
          title: 'Archivo subido',
          description: `Se ha añadido "${sampleName}" a tus muestras`
        });
      };
      
      audio.onerror = () => {
        toast({
          title: 'Error al cargar audio',
          description: 'No se pudo procesar el archivo de audio',
          variant: 'destructive'
        });
      };
      
      // Cargar el audio para procesar metadatos
      audio.load();
    }
  };
  
  // Eliminar una muestra
  const removeSample = (sampleId: string) => {
    setAudioSamples(audioSamples.filter(sample => sample.id !== sampleId));
  };
  
  // Iniciar creación del modelo
  const startModelCreation = () => {
    if (audioSamples.length < 2) {
      toast({
        title: 'Muestras insuficientes',
        description: 'Se requieren al menos 2 muestras de voz para crear un modelo',
        variant: 'destructive'
      });
      return;
    }
    
    if (!modelName.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Por favor, proporciona un nombre para tu modelo de voz',
        variant: 'destructive'
      });
      return;
    }
    
    // Simulación de proceso de entrenamiento
    setIsCreatingModel(true);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCreatingModel(false);
          
          toast({
            title: 'Modelo creado con éxito',
            description: `Tu modelo "${modelName}" ha sido creado y está listo para usar`
          });
          
          return 100;
        }
        return prev + 5;
      });
    }, 500);
  };
  
  // Formato del tiempo en MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Creación de Modelos de Voz
        </CardTitle>
        <CardDescription>
          Crea modelos de voz personalizados con tus propias grabaciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Información sobre requisitos */}
        <Alert className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Requisitos para un modelo óptimo</AlertTitle>
          <AlertDescription>
            Para mejores resultados, proporciona al menos 3-5 muestras de audio de alta calidad
            con una duración total de 2-5 minutos en un ambiente sin ruido.
          </AlertDescription>
        </Alert>
        
        {/* Sección de grabación */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Muestras de voz</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('upload-audio')?.click()}
                disabled={isRecording}
              >
                <Upload className="h-4 w-4 mr-1" />
                Subir audio
              </Button>
              <Input
                id="upload-audio"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {isRecording ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={stopRecording}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Detener ({formatTime(recordingTime)})
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={startRecording}
                >
                  <Mic className="h-4 w-4 mr-1" />
                  Grabar
                </Button>
              )}
            </div>
          </div>
          
          {/* Lista de muestras */}
          <div className="space-y-2">
            {audioSamples.length === 0 ? (
              <div className="bg-muted/30 p-8 rounded-lg flex flex-col items-center justify-center text-center">
                <Server className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay muestras de voz.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Graba o sube archivos de audio para crear tu modelo de voz
                </p>
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-lg">
                {audioSamples.map((sample) => (
                  <div 
                    key={sample.id} 
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mic className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{sample.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(sample.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const audio = new Audio(sample.url);
                          audio.play();
                        }}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeSample(sample.id)}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="mt-2 text-xs text-muted-foreground">
                  {audioSamples.length} muestras · {formatTime(audioSamples.reduce((acc, sample) => acc + sample.duration, 0))} duración total
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Configuración del modelo */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-medium">Configuración del modelo</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="model-name">Nombre del modelo</Label>
              <Input
                id="model-name"
                placeholder="Ej. Mi Voz Profesional"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enhance-fidelity">Mejorar fidelidad</Label>
                <p className="text-xs text-muted-foreground">
                  Mejora el realismo y reduce artefactos
                </p>
              </div>
              <Switch
                id="enhance-fidelity"
                checked={enhanceFidelity}
                onCheckedChange={setEnhanceFidelity}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reduce-noise">Reducción de ruido</Label>
                <p className="text-xs text-muted-foreground">
                  Elimina ruido de fondo y mejora claridad
                </p>
              </div>
              <Switch
                id="reduce-noise"
                checked={reduceNoise}
                onCheckedChange={setReduceNoise}
              />
            </div>
          </div>
        </div>
        
        {/* Progreso de entrenamiento */}
        {isCreatingModel && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Entrenando modelo...</span>
              <span>{trainingProgress}%</span>
            </div>
            <Progress value={trainingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              El entrenamiento puede durar varios minutos. No cierres esta ventana.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/30 pt-4 flex justify-between">
        <Button variant="outline" disabled={isCreatingModel}>
          <Info className="h-4 w-4 mr-1" />
          Más información
        </Button>
        <Button
          disabled={audioSamples.length < 2 || !modelName.trim() || isCreatingModel}
          onClick={startModelCreation}
        >
          <Save className="h-4 w-4 mr-1" />
          {isCreatingModel ? 'Creando...' : 'Crear modelo'}
        </Button>
      </CardFooter>
    </Card>
  );
}