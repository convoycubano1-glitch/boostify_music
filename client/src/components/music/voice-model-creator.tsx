import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Music, Upload, CheckCircle, AlertCircle, Server, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from '@/hooks/use-toast';

import { voiceModelService } from '../../lib/services/voice-model-service';
import type { 
  VoiceModel, 
  NewVoiceModel, 
  TrainingStatus, 
  VoiceModelGenre, 
  VoiceType, 
  AgeCategory 
} from '../../lib/types/voice-model-types';

// Esquema de validación para el formulario
const voiceModelFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  gender: z.enum(['male', 'female']),
  age: z.enum(['child', 'young adult', 'adult']),
  description: z.string().min(10, 'Por favor proporciona una descripción detallada'),
  base_language: z.string().min(2, 'Selecciona un idioma base'),
  traits: z.string().min(2, 'Ingresa al menos un rasgo vocal'),
  genre: z.enum([
    'pop', 'rock', 'hip-hop', 'r&b', 'country', 
    'jazz', 'classical', 'electronic', 'world', 'other'
  ]),
  voice_type: z.enum([
    'soprano', 'mezzo-soprano', 'alto', 'tenor', 'baritone', 'bass'
  ]),
  min_range: z.string().min(2, 'Especifica el rango mínimo (ej: C3)'),
  max_range: z.string().min(2, 'Especifica el rango máximo (ej: C7)')
});

type VoiceModelFormValues = z.infer<typeof voiceModelFormSchema>;

interface VoiceModelCreatorProps {
  onModelCreated?: (modelId: string) => void;
}

export function VoiceModelCreator({ onModelCreated }: VoiceModelCreatorProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  
  const queryClient = useQueryClient();
  
  // Consulta para obtener los modelos de voz disponibles
  const { data: voiceModels, isLoading: isLoadingModels } = useQuery({
    queryKey: ['voice-models'],
    queryFn: () => voiceModelService.getAvailableModels()
  });
  
  // Consulta para verificar el estado del entrenamiento
  const { data: trainingStatus, isLoading: isLoadingTraining } = useQuery({
    queryKey: ['training-status', currentModelId],
    queryFn: () => voiceModelService.checkTrainingStatus(currentModelId || ''),
    enabled: !!currentModelId && showTrainingDialog,
    refetchInterval: showTrainingDialog ? 2000 : false
  });
  
  // Actualizamos el progreso de entrenamiento cuando cambia el estado
  useEffect(() => {
    if (trainingStatus && trainingStatus.total_epochs) {
      const progress = Math.round((trainingStatus.current_epoch || 0) / trainingStatus.total_epochs * 100);
      setTrainingProgress(progress);
      
      // Si el entrenamiento ha terminado, actualizamos la caché
      if (trainingStatus.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['voice-models'] });
        
        // Notificamos al usuario
        toast({
          title: "¡Entrenamiento completado!",
          description: "Tu modelo de voz personalizado está listo para usar.",
        });
      }
    }
  }, [trainingStatus, queryClient]);
  
  // Configuración del formulario
  const form = useForm<VoiceModelFormValues>({
    resolver: zodResolver(voiceModelFormSchema),
    defaultValues: {
      name: '',
      gender: 'male',
      age: 'adult',
      description: '',
      base_language: 'es',
      traits: '',
      genre: 'pop',
      voice_type: 'tenor',
      min_range: 'C3',
      max_range: 'C5'
    }
  });
  
  // Mutación para crear un nuevo modelo de voz
  const createModelMutation = useMutation({
    mutationFn: async (data: { modelData: NewVoiceModel, audioFile: File }) => {
      return voiceModelService.createCustomModel(data.modelData, data.audioFile);
    },
    onSuccess: (modelId: string) => {
      setCurrentModelId(modelId);
      setShowTrainingDialog(true);
      setIsCreating(false);
      
      // Notificar creación exitosa
      toast({
        title: "Modelo creado con éxito",
        description: "El entrenamiento ha comenzado. Este proceso puede tardar varios minutos.",
      });
      
      // Callback opcional
      if (onModelCreated) {
        onModelCreated(modelId);
      }
      
      // Limpiar el formulario
      form.reset();
      setAudioFile(null);
    },
    onError: (error) => {
      setIsCreating(false);
      toast({
        title: "Error al crear el modelo",
        description: error instanceof Error ? error.message : "Ocurrió un error desconocido",
        variant: "destructive"
      });
    }
  });
  
  // Manejador para enviar el formulario
  const onSubmit = (values: VoiceModelFormValues) => {
    if (!audioFile) {
      toast({
        title: "Archivo de audio requerido",
        description: "Por favor, sube un archivo de audio para entrenar tu modelo de voz",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    // Convertir los valores del formulario al formato esperado
    const newModel: NewVoiceModel = {
      name: values.name,
      gender: values.gender,
      age: values.age,
      description: values.description,
      base_language: values.base_language,
      traits: values.traits.split(',').map(trait => trait.trim()),
      genre: values.genre as VoiceModelGenre,
      voice_type: values.voice_type as VoiceType,
      vocal_range: {
        min: values.min_range,
        max: values.max_range
      }
    };
    
    // Crear el modelo
    createModelMutation.mutate({ modelData: newModel, audioFile });
  };
  
  // Manejador para subir archivo de audio
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Verificar que sea un archivo de audio
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Tipo de archivo incorrecto",
          description: "Por favor, sube un archivo de audio (WAV recomendado)",
          variant: "destructive"
        });
        return;
      }
      
      setAudioFile(file);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Crear un Modelo de Voz Personalizado
          </CardTitle>
          <CardDescription>
            Crea tu propio modelo de voz AI entrenado con tus grabaciones vocales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Mi Voz" {...field} />
                      </FormControl>
                      <FormDescription>
                        Un nombre único que identifique tu modelo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría de Edad</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="child">Niño</SelectItem>
                          <SelectItem value="young adult">Joven</SelectItem>
                          <SelectItem value="adult">Adulto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="base_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idioma Base</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el idioma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">Inglés</SelectItem>
                          <SelectItem value="fr">Francés</SelectItem>
                          <SelectItem value="it">Italiano</SelectItem>
                          <SelectItem value="de">Alemán</SelectItem>
                          <SelectItem value="pt">Portugués</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe las características de tu voz" 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Una descripción detallada de las cualidades vocales
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="traits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rasgos Vocales</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="potente,melódica,clara,brillante" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Lista de rasgos separados por comas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="genre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Género Musical</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pop">Pop</SelectItem>
                          <SelectItem value="rock">Rock</SelectItem>
                          <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                          <SelectItem value="r&b">R&B</SelectItem>
                          <SelectItem value="country">Country</SelectItem>
                          <SelectItem value="jazz">Jazz</SelectItem>
                          <SelectItem value="classical">Clásica</SelectItem>
                          <SelectItem value="electronic">Electrónica</SelectItem>
                          <SelectItem value="world">World</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="voice_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Voz</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="soprano">Soprano</SelectItem>
                          <SelectItem value="mezzo-soprano">Mezzo-soprano</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                          <SelectItem value="tenor">Tenor</SelectItem>
                          <SelectItem value="baritone">Barítono</SelectItem>
                          <SelectItem value="bass">Bajo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="min_range"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rango Vocal Mínimo</FormLabel>
                      <FormControl>
                        <Input placeholder="C3" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ej: C3, G2, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="max_range"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rango Vocal Máximo</FormLabel>
                      <FormControl>
                        <Input placeholder="C5" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ej: C5, F4, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormLabel htmlFor="audio-upload">Archivo de Audio para Entrenamiento</FormLabel>
                <div className="mt-2 flex items-center gap-4">
                  <FormControl>
                    <Input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </FormControl>
                  {audioFile && (
                    <Badge variant="outline" className="ml-2 py-1">
                      {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </Badge>
                  )}
                </div>
                <FormDescription className="mt-2">
                  Sube un archivo de audio de tu voz (WAV recomendado). 
                  Asegúrate de que el audio sea claro y sin música de fondo.
                </FormDescription>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando modelo...
                  </>
                ) : (
                  <>
                    <Server className="mr-2 h-4 w-4" />
                    Crear y Entrenar Modelo de Voz
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground">
            El entrenamiento del modelo puede tardar varios minutos. Se te notificará cuando esté listo.
          </p>
        </CardFooter>
      </Card>
      
      {showTrainingDialog && currentModelId && (
        <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entrenando Modelo de Voz</DialogTitle>
              <DialogDescription>
                El modelo se está entrenando con tus datos. Este proceso puede tardar varios minutos.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso del entrenamiento</span>
                  <span>{trainingProgress}%</span>
                </div>
                <Progress value={trainingProgress} />
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={trainingStatus?.status === 'completed' ? 'default' : 'outline'}>
                  {trainingStatus?.status === 'pending' && 'Pendiente'}
                  {trainingStatus?.status === 'training' && 'Entrenando...'}
                  {trainingStatus?.status === 'completed' && 'Completado'}
                  {trainingStatus?.status === 'failed' && 'Error'}
                </Badge>
                
                {trainingStatus?.status === 'training' && (
                  <p className="text-sm text-muted-foreground">
                    Epochs: {trainingStatus.current_epoch || 0} / {trainingStatus.total_epochs || 0}
                  </p>
                )}
              </div>
              
              {trainingStatus?.status === 'completed' && (
                <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">¡Entrenamiento completado con éxito!</p>
                  </div>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Tu modelo de voz personalizado ya está disponible para usar en conversiones.
                  </p>
                </div>
              )}
              
              {trainingStatus?.status === 'failed' && (
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">Error en el entrenamiento</p>
                  </div>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {trainingStatus.error || "Ha ocurrido un error durante el entrenamiento. Por favor, inténtalo de nuevo."}
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowTrainingDialog(false)}
              >
                Cerrar
              </Button>
              
              {trainingStatus?.status === 'completed' && (
                <Button onClick={() => {
                  setShowTrainingDialog(false);
                  queryClient.invalidateQueries({ queryKey: ['voice-models'] });
                }}>
                  Usar modelo
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="models">
          <AccordionTrigger>Modelos de Voz Disponibles</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {isLoadingModels ? (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              ) : voiceModels && voiceModels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {voiceModels.map((model) => (
                    <Card key={model.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base">{model.name}</CardTitle>
                          {model.isCustom && (
                            <Badge>Personalizado</Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {model.description.length > 60 
                            ? `${model.description.substring(0, 60)}...` 
                            : model.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1 pt-0">
                        <div className="flex flex-wrap gap-1">
                          {model.traits.map((trait, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-3 text-muted-foreground mt-2">
                          <span>{model.gender === 'male' ? 'Masculino' : 'Femenino'}</span>
                          <span>•</span>
                          <span>{model.voice_type}</span>
                          <span>•</span>
                          <span>{model.genre}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No hay modelos de voz disponibles. ¡Crea tu primer modelo!
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}