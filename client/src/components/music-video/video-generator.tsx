import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import { Loader2, Video, Wand2, Info, Check, Film, Clock3 } from 'lucide-react';

export interface VideoGeneratorProps {
  onGenerateVideo: (settings: VideoGenerationSettings) => Promise<void>;
  isLoading: boolean;
  scenesCount: number;
  // Soporte completo para clips de línea de tiempo con múltiples capas
  clips?: Array<{
    id: number;
    start: number;
    duration: number;
    // Tipo de clip con soporte para múltiples formatos de media
    type: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text';
    // Layer al que pertenece: 0=audio, 1=video/imagen, 2=texto, 3=efectos
    layer: number;
    // Propiedades visuales
    thumbnail?: string;
    title: string;
    description?: string;
    imagePrompt?: string;
    // URLs de recursos
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    // Metadatos para información adicional y propiedades especiales
    metadata?: {
      section?: string;
      movementApplied?: boolean;
      movementPattern?: string;
      movementIntensity?: number;
      faceSwapApplied?: boolean;
      musicianIntegrated?: boolean;
      sourceIndex?: number;
    };
  }>;
  // Propiedades adicionales para edición y generación
  duration?: number; 
  isGenerating?: boolean;
  onGenerate?: () => Promise<void | string | null>;
}

export interface VideoGenerationSettings {
  model: string;
  quality: 'standard' | 'premium';
  duration: number;
  includeMusic: boolean;
  prompt: string;
  style: string;
  cameraMovement?: string;
}

const videoModels = [
  { id: 't2v-01', name: 'Standard', description: 'Generate videos from text' },
  { id: 'i2v-01', name: 'Image to Video', description: 'Animate your existing images' },
  { id: 's2v-01', name: 'Style to Video', description: 'Transfer visual styles' }
];

const cameraMovements = [
  'No movement',
  'Slow Zoom In',
  'Smooth Zoom Out',
  'Horizontal Pan',
  'Vertical Pan',
  'Dolly In',
  'Dolly Out',
  'Subtle Tracking',
  'Orbital Movement'
];

export function VideoGenerator({ onGenerateVideo, isLoading, scenesCount = 0, clips = [], duration = 15 }: VideoGeneratorProps) {
  // Inicializar con valores predeterminados, pero con consideración de clips y datos existentes
  const [settings, setSettings] = useState<VideoGenerationSettings>({
    model: 't2v-01',
    quality: 'standard',
    duration: duration > 0 ? Math.min(duration, 60) : 15, // Usar duración del proyecto o default
    includeMusic: true,
    prompt: generatePromptFromClips(clips), // Generar prompt basado en clips existentes
    style: 'cinematic',
    cameraMovement: 'Sin movimiento'
  });

  // Función para generar un prompt inicial basado en los clips existentes
  function generatePromptFromClips(clips: VideoGeneratorProps['clips']) {
    if (!clips || clips.length === 0) return '';
    
    // Extraer información de los clips para construir un prompt coherente
    const videoClips = clips.filter(clip => clip.type === 'video' || clip.type === 'image');
    if (videoClips.length === 0) return '';
    
    // Obtener secciones únicas
    const sections = Array.from(new Set(
      videoClips
        .map(clip => clip.metadata?.section)
        .filter(Boolean)
    ));
    
    // Extraer nombres/títulos de clips
    const clipTitles = videoClips.map(clip => clip.title).filter(Boolean);
    
    // Construir prompt básico
    return `Music video ${sections.join(', ')} with ${clipTitles.join(', ')}. Cinematic style, high quality.`;
  }

  const handleGenerate = async () => {
    if (!settings.prompt && settings.model === 't2v-01') {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your video",
        variant: "destructive"
      });
      return;
    }
    
    // Guardar la configuración en localStorage para futuras referencias
    try {
      localStorage.setItem('last-video-generation-settings', JSON.stringify(settings));
    } catch (e) {
      console.log('Error guardando configuración de video:', e);
    }
    
    await onGenerateVideo(settings);
  };

  // Tiempo estimado basado en los ajustes actuales
  const estimatedTime = () => {
    let baseTime = 120; // Tiempo base en segundos
    
    // Factores que afectan el tiempo
    if (settings.quality === 'premium') baseTime *= 1.5;
    if (settings.duration > 20) baseTime *= 1.3;
    
    // Convertir a minutos
    const minutes = Math.floor(baseTime / 60);
    const seconds = baseTime % 60;
    
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };
  
  // Estimación de costo basada en los ajustes actuales
  const estimatedCost = () => {
    let baseCost = 0.20; // Costo base en USD
    
    // Factores que afectan el costo
    if (settings.quality === 'premium') baseCost *= 2;
    if (settings.duration > 15) baseCost += (settings.duration - 15) * 0.05;
    
    return baseCost.toFixed(2);
  };

  return (
    <Card className="border border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Video className="h-5 w-5 mr-2 text-blue-600" />
          AI Video Generation
        </CardTitle>
        <CardDescription>
          Transform your scenes into smooth, high-quality videos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-select">Video Model</Label>
          <RadioGroup 
            value={settings.model} 
            onValueChange={(value) => setSettings({...settings, model: value})}
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {videoModels.map((model) => (
              <div key={model.id}>
                <RadioGroupItem
                  value={model.id}
                  id={`model-${model.id}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`model-${model.id}`}
                  className="flex flex-col gap-1 rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
                >
                  <span className="font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.description}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="quality">Video Quality</Label>
          <RadioGroup 
            value={settings.quality} 
            onValueChange={(value: 'standard' | 'premium') => setSettings({...settings, quality: value})}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div>
              <RadioGroupItem
                value="standard"
                id="quality-standard"
                className="peer sr-only"
              />
              <Label
                htmlFor="quality-standard"
                className="flex flex-col gap-1 rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
              >
                <span className="font-medium">Standard</span>
                <span className="text-xs text-muted-foreground">Medium quality (720p)</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="premium"
                id="quality-premium"
                className="peer sr-only"
              />
              <Label
                htmlFor="quality-premium"
                className="flex flex-col gap-1 rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 [&:has([data-state=checked])]:border-blue-500 cursor-pointer"
              >
                <span className="font-medium">Premium</span>
                <span className="text-xs text-muted-foreground">High quality (1080p)</span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <span className="text-sm text-muted-foreground">{settings.duration}s</span>
          </div>
          <Slider 
            id="duration"
            min={5} 
            max={30} 
            step={5}
            value={[settings.duration]} 
            onValueChange={(values) => setSettings({...settings, duration: values[0]})}
          />
          <div className="grid grid-cols-3 text-xs text-muted-foreground">
            <span>5s</span>
            <span className="text-center">15s</span>
            <span className="text-right">30s</span>
          </div>
        </div>
        
        {settings.model === 't2v-01' && (
          <div className="space-y-2 mt-2">
            <Label htmlFor="prompt">Video Description</Label>
            <Textarea 
              id="prompt" 
              placeholder="Describe in detail what you want to see in the video..."
              value={settings.prompt}
              onChange={(e) => setSettings({...settings, prompt: e.target.value})}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Include details about atmosphere, colors, actions, and desired visual elements.
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="camera-movement">Camera Movement</Label>
          <Select 
            value={settings.cameraMovement} 
            onValueChange={(value) => setSettings({...settings, cameraMovement: value})}
          >
            <SelectTrigger id="camera-movement">
              <SelectValue placeholder="Select movement" />
            </SelectTrigger>
            <SelectContent>
              {cameraMovements.map((movement) => (
                <SelectItem key={movement} value={movement}>{movement}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={handleGenerate} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Video
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="border rounded-md p-3 bg-blue-100/50">
            <div className="flex items-center gap-2 font-medium text-blue-700 mb-1">
              <Film className="h-4 w-4" />
              <span>Scenes</span>
            </div>
            <p className="text-muted-foreground"><span className="font-medium">{scenesCount}</span> scenes processed</p>
          </div>
          
          <div className="border rounded-md p-3 bg-blue-100/50">
            <div className="flex items-center gap-2 font-medium text-blue-700 mb-1">
              <Clock3 className="h-4 w-4" />
              <span>Estimated Time</span>
            </div>
            <p className="text-muted-foreground">~{estimatedTime()} minutos</p>
          </div>
          
          <div className="border rounded-md p-3 bg-blue-100/50">
            <div className="flex items-center gap-2 font-medium text-blue-700 mb-1">
              <Info className="h-4 w-4" />
              <span>API</span>
            </div>
            <p className="text-muted-foreground">PiAPI/Hailuo</p>
          </div>
        </div>
        
        <div className="bg-blue-100 p-3 rounded-md text-sm">
          <p className="flex items-start gap-2">
            <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <span>La generación del video puede tardar varios minutos dependiendo de la duración y calidad seleccionadas. Se te notificará cuando esté listo.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}