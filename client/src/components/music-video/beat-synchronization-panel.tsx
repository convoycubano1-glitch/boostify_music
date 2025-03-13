import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Wand2, AlertTriangle, ZapIcon, ArrowDownWideNarrow, ActivitySquare } from "lucide-react";

interface BeatsData {
  beats: {
    time: number;
    timecode?: string;
    type: 'downbeat' | 'accent' | 'regular';
    intensity: number;
    energy: number;
  }[];
  metadata?: {
    bpm: number;
    timeSignature?: string;
    key?: string;
    energy?: number;
    genre?: string;
  };
}

interface BeatSynchronizationPanelProps {
  audioUrl?: string;
  beatsData?: BeatsData;
  onAnalyzeAudio?: () => Promise<void>;
  onSyncToBeats?: (options: SyncOptions) => void;
  onUpdateBeats?: (beatsData: BeatsData) => void;
  isAnalyzing?: boolean;
  duration?: number;
  className?: string;
}

export interface SyncOptions {
  cutOnBeats: boolean;
  prioritizeDownbeats: boolean;
  minimumClipDuration: number;
  maximumClipDuration: number; // Nueva propiedad para limitar clips a máximo 5 segundos
  transitionType: string;
  intensityThreshold: number;
  cutStyle: 'phrases' | 'random_bars' | 'dynamic' | 'slow' | 'cinematic' | 
            'music_video' | 'narrative' | 'experimental' | 'rhythmic' | 
            'minimalist' | 'balanced' | 'melodic';
  allowBeatSkipping: boolean;
  durationRange: { min: number, max: number }; // Para mantener rangos específicos por estilo
  sectionDetection: boolean; // Habilitar detección de secciones (versos, coros, etc.)
  placeholderGeneration: boolean; // Generar placeholders para contenido futuro
}

/**
 * Panel de sincronización avanzada de beats para el editor de video musical
 * 
 * Este componente proporciona herramientas profesionales para sincronizar
 * el contenido visual con el ritmo musical, ofreciendo opciones para cortes
 * automáticos, análisis avanzado de BPM y visualización de beats.
 */
export function BeatSynchronizationPanel({
  audioUrl,
  beatsData,
  onAnalyzeAudio,
  onSyncToBeats,
  onUpdateBeats,
  isAnalyzing = false,
  duration = 0,
  className = ""
}: BeatSynchronizationPanelProps) {
  // Estado para opciones de sincronización
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({
    cutOnBeats: true,
    prioritizeDownbeats: true,
    minimumClipDuration: 1.5, // segundos
    maximumClipDuration: 5.0, // máximo 5 segundos para clips
    transitionType: "cut",
    intensityThreshold: 0.5, // 0-1
    cutStyle: "balanced",
    allowBeatSkipping: true,
    durationRange: { min: 1.5, max: 5.0 }, // Rango por defecto
    sectionDetection: true, // Habilitar detección de secciones
    placeholderGeneration: true // Generar placeholders para contenido AI
  });
  
  // Estado activo para la vista de análisis
  const [activeTab, setActiveTab] = useState<string>("options");
  
  // Función para actualizar opciones
  const updateSyncOption = <K extends keyof SyncOptions>(key: K, value: SyncOptions[K]) => {
    setSyncOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Función para ajustar manualmente los beats
  const adjustBeat = (index: number, property: string, value: any) => {
    if (!beatsData || !beatsData.beats) return;
    
    const updatedBeats = [...beatsData.beats];
    updatedBeats[index] = {
      ...updatedBeats[index],
      [property]: value
    };
    
    onUpdateBeats?.({
      ...beatsData,
      beats: updatedBeats
    });
  };
  
  // Función para aplicar sincronización
  const applySynchronization = () => {
    onSyncToBeats?.(syncOptions);
  };
  
  // Función para formatear tiempo en formato MM:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Función para obtener el color según el tipo de beat
  const getBeatTypeColor = (type: string): string => {
    switch (type) {
      case 'downbeat': return 'bg-red-500';
      case 'accent': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };
  
  // Función para generar un ritmo visual basado en los datos de beats
  const renderRhythmVisualizer = () => {
    if (!beatsData?.beats || beatsData.beats.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">No hay datos de ritmo disponibles.</p>
          <p className="text-xs mt-1">Analiza el audio para visualizar el ritmo.</p>
        </div>
      );
    }
    
    return (
      <div className="w-full h-24 bg-muted/50 rounded-md relative overflow-hidden border">
        {/* Líneas de grid para compases */}
        <div className="absolute inset-0">
          {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
            <div 
              key={`grid-${i}`}
              className="absolute top-0 bottom-0 border-l border-muted-foreground/20" 
              style={{ left: `${(i / duration) * 100}%` }}
            >
              <div className="absolute -top-1 left-0 text-[8px] text-muted-foreground">
                {formatTime(i)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Visualización de beats */}
        {beatsData.beats.map((beat, index) => {
          const position = beat.time / duration * 100;
          const height = Math.max(20, Math.min(100, beat.intensity * 100));
          const beatColor = getBeatTypeColor(beat.type);
          
          return (
            <div
              key={`viz-beat-${index}`}
              className={`absolute bottom-0 ${beatColor} opacity-90 rounded-t transition-transform hover:scale-y-110`}
              style={{
                left: `${position}%`,
                height: `${height}%`,
                width: beat.type === 'downbeat' ? '4px' : beat.type === 'accent' ? '3px' : '2px',
                transform: 'translateX(-50%)'
              }}
              title={`${beat.type} - ${formatTime(beat.time)} - Energía: ${beat.energy.toFixed(2)}`}
            />
          );
        })}
        
        {/* Overlay de metadata */}
        {beatsData.metadata && (
          <div className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs border shadow-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10">
                {beatsData.metadata.bpm} BPM
              </Badge>
              
              {beatsData.metadata.timeSignature && (
                <Badge variant="outline" className="bg-secondary/10">
                  {beatsData.metadata.timeSignature}
                </Badge>
              )}
              
              {beatsData.metadata.key && (
                <Badge variant="outline" className="bg-accent/10">
                  Key: {beatsData.metadata.key}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader className="py-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <Music className="w-5 h-5 mr-2 text-orange-500" />
            Sincronización con Beats
            
            {beatsData?.metadata?.bpm && (
              <Badge className="ml-2 bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20">
                {beatsData.metadata.bpm} BPM
              </Badge>
            )}
          </div>
          
          <Button 
            variant={beatsData?.beats?.length ? "outline" : "default"}
            size="sm" 
            onClick={onAnalyzeAudio}
            disabled={!audioUrl || isAnalyzing}
            className="h-7"
          >
            {isAnalyzing ? (
              <>
                <ActivitySquare className="w-3.5 h-3.5 mr-1 animate-pulse" />
                Analizando...
              </>
            ) : beatsData?.beats?.length ? (
              <>
                <ArrowDownWideNarrow className="w-3.5 h-3.5 mr-1" />
                Re-analizar
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5 mr-1" />
                Analizar Audio
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="options" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="options">Opciones de Sincronización</TabsTrigger>
            <TabsTrigger value="visualization" disabled={!beatsData?.beats?.length}>Visualización de Ritmo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="options" className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cut-on-beats" className="text-sm">Cortar en beats</Label>
                  <Switch 
                    id="cut-on-beats" 
                    checked={syncOptions.cutOnBeats}
                    onCheckedChange={(checked) => updateSyncOption('cutOnBeats', checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sincroniza los cortes del video con los beats de la música
                </p>
              </div>
              
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prioritize-downbeats" className="text-sm">Priorizar downbeats</Label>
                  <Switch 
                    id="prioritize-downbeats" 
                    checked={syncOptions.prioritizeDownbeats}
                    onCheckedChange={(checked) => updateSyncOption('prioritizeDownbeats', checked)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Prioriza cambios en los beats principales (primer tiempo)
                </p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="min-clip-duration" className="text-sm">
                Duración mínima de clip: {syncOptions.minimumClipDuration.toFixed(1)}s
              </Label>
              <Slider 
                id="min-clip-duration"
                min={0.5}
                max={5.0}
                step={0.1}
                value={[syncOptions.minimumClipDuration]}
                onValueChange={([value]) => updateSyncOption('minimumClipDuration', value)}
              />
              <p className="text-xs text-muted-foreground">
                Duración mínima entre cortes (evita cortes demasiado rápidos)
              </p>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="intensity-threshold" className="text-sm">
                Umbral de intensidad: {syncOptions.intensityThreshold.toFixed(2)}
              </Label>
              <Slider 
                id="intensity-threshold"
                min={0.0}
                max={1.0}
                step={0.05}
                value={[syncOptions.intensityThreshold]}
                onValueChange={([value]) => updateSyncOption('intensityThreshold', value)}
              />
              <p className="text-xs text-muted-foreground">
                Solo considera beats por encima de este nivel de intensidad
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="transition-type" className="text-sm">Tipo de transición</Label>
                <Select 
                  value={syncOptions.transitionType}
                  onValueChange={(value) => updateSyncOption('transitionType', value)}
                >
                  <SelectTrigger id="transition-type">
                    <SelectValue placeholder="Seleccionar transición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cut">Corte directo</SelectItem>
                    <SelectItem value="crossfade">Fundido cruzado</SelectItem>
                    <SelectItem value="fade">Fundido a negro</SelectItem>
                    <SelectItem value="slide">Deslizamiento</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="cut-style" className="text-sm">Estilo de corte</Label>
                <Select 
                  value={syncOptions.cutStyle}
                  onValueChange={(value: any) => {
                    // Actualizar el estilo de corte
                    updateSyncOption('cutStyle', value);
                    
                    // Actualizar los rangos de duración según el estilo seleccionado
                    const durations = {
                      phrases: { min: 4, max: 5 }, // Limitamos a máximo 5s
                      random_bars: { min: 2, max: 5 },
                      dynamic: { min: 1.5, max: 4 },
                      slow: { min: 5, max: 5 }, // Limitamos a máximo 5s
                      cinematic: { min: 3, max: 5 },
                      music_video: { min: 1, max: 3 },
                      narrative: { min: 4, max: 5 }, // Limitamos a máximo 5s
                      experimental: { min: 1, max: 5 },
                      rhythmic: { min: 1, max: 2 },
                      minimalist: { min: 5, max: 5 }, // Limitamos a máximo 5s
                      balanced: { min: 2, max: 4 },
                      melodic: { min: 3, max: 5 }
                    };
                    
                    // Si existe el rango para el estilo seleccionado, lo aplicamos
                    if (durations[value as keyof typeof durations]) {
                      updateSyncOption('durationRange', durations[value as keyof typeof durations]);
                      updateSyncOption('minimumClipDuration', durations[value as keyof typeof durations].min);
                      updateSyncOption('maximumClipDuration', 
                        Math.min(durations[value as keyof typeof durations].max, 5.0)); // Máximo 5 segundos
                    }
                  }}
                >
                  <SelectTrigger id="cut-style">
                    <SelectValue placeholder="Seleccionar estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phrases">Edición por Frases</SelectItem>
                    <SelectItem value="random_bars">Compases Aleatorios</SelectItem>
                    <SelectItem value="dynamic">Dinámico</SelectItem>
                    <SelectItem value="slow">Lento</SelectItem>
                    <SelectItem value="cinematic">Cinematográfico</SelectItem>
                    <SelectItem value="music_video">Video Musical</SelectItem>
                    <SelectItem value="narrative">Narrativo</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                    <SelectItem value="rhythmic">Rítmico</SelectItem>
                    <SelectItem value="minimalist">Minimalista</SelectItem>
                    <SelectItem value="balanced">Equilibrado</SelectItem>
                    <SelectItem value="melodic">Melódico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="visualization">
            {renderRhythmVisualizer()}
            
            <div className="mt-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Beats detectados:</span> {beatsData?.beats?.length || 0}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                    <span>Downbeats</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                    <span>Acentos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                    <span>Beats regulares</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between py-3 border-t bg-muted/50">
        <div className="text-xs text-muted-foreground">
          {beatsData?.metadata?.bpm
            ? `Tempo: ${beatsData.metadata.bpm} BPM | ${beatsData.metadata.timeSignature || "4/4"}`
            : "Analiza el audio para conocer el BPM"}
        </div>
        
        <Button
          variant="default"
          size="sm"
          onClick={applySynchronization}
          disabled={!beatsData?.beats?.length}
          className="h-8"
        >
          <ZapIcon className="w-3.5 h-3.5 mr-1" />
          Sincronizar
        </Button>
      </CardFooter>
    </Card>
  );
}