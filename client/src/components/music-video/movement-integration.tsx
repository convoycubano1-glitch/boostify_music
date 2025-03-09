import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, CheckCircle, Maximize2, PlayCircle, Plus, RefreshCw, Video, Wand2 } from "lucide-react";
import { TimelineClip } from "./timeline-editor";
import { 
  MovementPattern, 
  getMovementPatternsForSection, 
  movementPatterns, 
  processImageWithMovement, 
  synchronizeMovementsWithAudio,
  checkMovementProcessingStatus,
  saveMovementResult
} from "@/lib/services/movement-service";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MusicLoadingSpinner } from "@/components/ui/music-loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MovementIntegrationProps {
  clips?: TimelineClip[];
  videoId?: string;
  audioBuffer?: AudioBuffer | null;
  onUpdateClip?: (clipId: number, updates: Partial<TimelineClip>) => void;
  isPremium?: boolean;
  isPurchased?: boolean;
  onMovementComplete?: (updatedClips: TimelineClip[]) => void;
}

interface ProcessingClip {
  clipId: number;
  status: 'idle' | 'processing' | 'complete' | 'error';
  taskId?: string;
  resultUrl?: string;
  error?: string;
  section: string;
  pattern: MovementPattern;
  intensity: number;
  progress?: number;
}

// Interfaz para parámetros de guardado de movimiento
interface SaveMovementParams {
  clipId: number;
  section: string;
  patternName: string;
  intensity: number;
  videoId?: string;
}

export function MovementIntegration({ 
  clips = [], 
  videoId,
  audioBuffer, 
  onUpdateClip,
  isPremium = false,
  isPurchased = false,
  onMovementComplete
}: MovementIntegrationProps) {
  const { toast } = useToast();
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    'Coro': true,
    'Verso': false,
    'Puente': false,
    'Introducción': false,
    'Solo': true,
    'Final': false
  });
  const [selectedPattern, setSelectedPattern] = useState<string>(movementPatterns[0].name);
  const [intensity, setIntensity] = useState<number>(50);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [processingClips, setProcessingClips] = useState<ProcessingClip[]>([]);
  const [activeTab, setActiveTab] = useState<string>("patrones");
  
  // Función para manejar el guardado de resultados de movimiento
  const handleSaveMovementResult = (taskId: string, resultUrl: string, params: SaveMovementParams) => {
    saveMovementResult(taskId, resultUrl, params)
      .then(result => {
        if (!result.success) {
          // Verificar si el error está relacionado con la necesidad de comprar
          if (result.error?.includes('requiere compra')) {
            toast({
              title: "Versión de preview",
              description: "Este es un preview. Adquiere la versión completa para guardar los resultados.",
              variant: "warning",
            });
          } else {
            console.error('Error guardando resultado:', result.error);
          }
        }
      })
      .catch(error => {
        console.error('Error en saveMovementResult:', error);
      });
  };
  
  // Filtrar clips por secciones seleccionadas
  const filteredClips = clips.filter(clip => {
    // Solo considerar clips que tienen asignada una sección
    if (!clip.metadata?.section) return false;
    
    // Verificar si la sección está seleccionada
    return selectedSections[clip.metadata.section];
  });

  // Obtener el patrón seleccionado actual
  const getCurrentPattern = (): MovementPattern => {
    const pattern = movementPatterns.find(p => p.name === selectedPattern);
    return pattern || movementPatterns[0];
  };

  // Cuando cambia el audioBuffer, recomienda patrones basados en el análisis
  useEffect(() => {
    if (audioBuffer && autoSync) {
      // Recomendar patrones para cada sección seleccionada
      const activeSection = Object.keys(selectedSections).find(
        section => selectedSections[section]
      ) || 'Coro';
      
      const { recommendedPattern, recommendedIntensity } = 
        synchronizeMovementsWithAudio(audioBuffer, activeSection);
      
      if (recommendedPattern) {
        setSelectedPattern(recommendedPattern.name);
        setIntensity(recommendedIntensity);
        
        toast({
          title: "Análisis musical completado",
          description: `Se recomendó "${recommendedPattern.name}" para la sección ${activeSection}`,
        });
      }
    }
  }, [audioBuffer, autoSync, selectedSections, toast]);

  // Monitorear el estado de procesamiento de clips
  useEffect(() => {
    // Solo verificar si hay clips en procesamiento
    const processingTaskIds = processingClips
      .filter(pc => pc.status === 'processing' && pc.taskId)
      .map(pc => ({ id: pc.clipId, taskId: pc.taskId as string }));
    
    if (processingTaskIds.length === 0) return;
    
    // Configurar intervalo para verificar el estado
    const checkInterval = setInterval(async () => {
      for (const { id, taskId } of processingTaskIds) {
        try {
          const status = await checkMovementProcessingStatus(taskId);
          
          // Actualizar estado del clip en procesamiento
          setProcessingClips(prev => {
            return prev.map(pc => {
              if (pc.clipId === id) {
                if (status.status === 'completed' && status.resultUrl) {
                  // Si se completó, guardar el resultado
                  // Usamos una función separada para no necesitar await dentro del map
                  handleSaveMovementResult(taskId, status.resultUrl, {
                    clipId: pc.clipId,
                    section: pc.section,
                    patternName: pc.pattern.name,
                    intensity: pc.intensity,
                    videoId: videoId
                  });
                  
                  // Actualizar el clip original si hay una función de actualización
                  if (onUpdateClip) {
                    onUpdateClip(pc.clipId, {
                      movementUrl: status.resultUrl,
                      // Mantener otra metadata existente
                      metadata: {
                        ...(clips.find(c => c.id === pc.clipId)?.metadata || {}),
                        movementApplied: true,
                        movementPattern: pc.pattern.name,
                        movementIntensity: pc.intensity
                      }
                    });
                  }
                  
                  // Actualizar estado a completo
                  return { ...pc, status: 'complete', resultUrl: status.resultUrl };
                } else if (status.status === 'failed') {
                  // Si falló, actualizar estado
                  return { ...pc, status: 'error', error: status.error };
                }
              }
              return pc;
            });
          });
        } catch (error) {
          console.error(`Error verificando estado de tarea ${taskId}:`, error);
        }
      }
      
      // Detener el intervalo si todos los clips están completos o con error
      const allProcessed = processingClips.every(
        pc => pc.status !== 'processing' && pc.status !== 'idle'
      );
      
      if (allProcessed) {
        clearInterval(checkInterval);
        
        // Contar completados
        const completedCount = processingClips.filter(pc => pc.status === 'complete').length;
        
        if (completedCount > 0) {
          toast({
            title: "Procesamiento completado",
            description: `Se aplicaron movimientos a ${completedCount} clips correctamente.`,
          });
          
          // Notificar al componente padre que se completó el procesamiento
          if (onMovementComplete) {
            // Convertir los clips procesados de vuelta a TimelineClip
            const updatedClips = clips.map(clip => {
              const processed = processingClips.find(pc => pc.clipId === clip.id && pc.status === 'complete');
              if (processed && processed.resultUrl) {
                return {
                  ...clip,
                  movementUrl: processed.resultUrl,
                  metadata: {
                    ...(clip.metadata || {}),
                    movementApplied: true,
                    movementPattern: processed.pattern.name,
                    movementIntensity: processed.intensity
                  }
                };
              }
              return clip;
            });
            
            // Llamar al callback con los clips actualizados
            onMovementComplete(updatedClips);
          }
        }
      }
    }, 5000); // Verificar cada 5 segundos
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(checkInterval);
  }, [processingClips, clips, onUpdateClip, toast, videoId, onMovementComplete]);

  // Función para aplicar movimientos a los clips seleccionados
  const applyMovements = async () => {
    if (!isPremium && !isPurchased) {
      toast({
        title: "Función premium",
        description: "La integración de movimientos requiere la versión premium o comprar el video completo.",
        variant: "destructive",
      });
      return;
    }
    
    if (filteredClips.length === 0) {
      toast({
        title: "Sin clips seleccionados",
        description: "Selecciona al menos una sección para aplicar movimientos.",
        variant: "destructive",
      });
      return;
    }
    
    const selectedPattern = getCurrentPattern();
    
    // Preparar clips para procesamiento
    const clipsToProcess = filteredClips.map(clip => ({
      clipId: clip.id,
      status: 'idle' as const,
      section: clip.metadata?.section || 'Desconocida',
      pattern: selectedPattern,
      intensity: intensity
    }));
    
    setProcessingClips(clipsToProcess);
    
    // Iniciar procesamiento para cada clip
    for (const clip of clipsToProcess) {
      try {
        // Obtener la URL de la imagen del clip
        const imageUrl = clip.clipId < clips.length ? clips[clip.clipId].imageUrl : '';
        
        if (!imageUrl) {
          // Actualizar estado si no hay imagen
          setProcessingClips(prev => prev.map(pc => 
            pc.clipId === clip.clipId 
              ? { ...pc, status: 'error', error: 'No hay imagen disponible' }
              : pc
          ));
          continue;
        }
        
        // Iniciar procesamiento
        setProcessingClips(prev => prev.map(pc => 
          pc.clipId === clip.clipId 
            ? { ...pc, status: 'processing' }
            : pc
        ));
        
        // Enviar solicitud para procesar la imagen
        const result = await processImageWithMovement(
          imageUrl,
          selectedPattern.prompt,
          intensity
        );
        
        if (result.success && result.taskId) {
          // Actualizar con taskId para seguimiento
          setProcessingClips(prev => prev.map(pc => 
            pc.clipId === clip.clipId 
              ? { ...pc, taskId: result.taskId, status: 'processing' }
              : pc
          ));
        } else {
          // Actualizar estado de error
          setProcessingClips(prev => prev.map(pc => 
            pc.clipId === clip.clipId 
              ? { ...pc, status: 'error', error: result.error }
              : pc
          ));
        }
      } catch (error: any) {
        console.error(`Error procesando clip ${clip.clipId}:`, error);
        
        // Actualizar estado de error
        setProcessingClips(prev => prev.map(pc => 
          pc.clipId === clip.clipId 
            ? { ...pc, status: 'error', error: error.message || 'Error desconocido' }
            : pc
        ));
      }
    }
  };

  // Función para cambiar la selección de secciones
  const toggleSection = (section: string, checked: boolean) => {
    setSelectedSections(prev => ({
      ...prev,
      [section]: checked
    }));
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-lg font-semibold">Integración de Movimientos</Label>
        
        {!isPremium && !isPurchased && (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
            Premium
          </Badge>
        )}
        {isPurchased && (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
            Comprado
          </Badge>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="patrones" className="flex-1">Patrones</TabsTrigger>
          <TabsTrigger value="secciones" className="flex-1">Secciones</TabsTrigger>
          <TabsTrigger value="ajustes" className="flex-1">Ajustes</TabsTrigger>
          <TabsTrigger value="resultado" className="flex-1">Resultados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="patrones">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Patrones de Movimiento</CardTitle>
              <CardDescription>
                Selecciona el patrón que deseas aplicar a tus imágenes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] pr-4">
                <div className="grid gap-3">
                  {movementPatterns.map(pattern => (
                    <div
                      key={pattern.name}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedPattern === pattern.name
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedPattern(pattern.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{pattern.name}</div>
                        <Badge variant={pattern.tempo === 'slow' ? 'outline' : (pattern.tempo === 'medium' ? 'secondary' : 'default')}>
                          {pattern.tempo === 'slow' ? 'Lento' : (pattern.tempo === 'medium' ? 'Medio' : 'Rápido')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pattern.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pattern.suitable.map(section => (
                          <Badge key={section} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="secciones">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aplicar en Secciones</CardTitle>
              <CardDescription>
                Selecciona las secciones donde deseas aplicar movimientos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {Object.keys(selectedSections).map((section) => (
                  <div key={section} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <Checkbox
                      id={`movement-${section}`}
                      checked={selectedSections[section]}
                      onCheckedChange={(checked) => toggleSection(section, checked === true)}
                      disabled={!isPremium && !isPurchased}
                    />
                    <div className="grid gap-1">
                      <Label htmlFor={`movement-${section}`} className="text-sm font-medium">
                        {section}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {filteredClips.filter(clip => clip.metadata?.section === section).length} clips
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ajustes">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ajustes de Movimiento</CardTitle>
              <CardDescription>
                Personaliza la intensidad y sincronización de los movimientos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Ajustes de Intensidad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Intensidad de Movimientos</Label>
                  <span className="text-sm font-medium">{intensity}%</span>
                </div>
                <Slider
                  disabled={!isPremium && !isPurchased}
                  value={[intensity]}
                  max={100}
                  step={5}
                  onValueChange={(values) => setIntensity(values[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Ajusta la intensidad del movimiento aplicado a las imágenes
                </p>
              </div>
              
              {/* Sincronización con música */}
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="sync-music"
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                  disabled={(!isPremium && !isPurchased) || !audioBuffer}
                />
                <div className="grid gap-1">
                  <Label htmlFor="sync-music" className="text-sm font-medium">
                    Sincronizar con música
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Ajusta automáticamente los movimientos al ritmo de la música
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resultado">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Estado de Procesamiento</CardTitle>
              <CardDescription>
                Monitorea el progreso de aplicación de movimientos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processingClips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p>No hay clips en procesamiento</p>
                  <p className="text-sm mt-1">Selecciona secciones y aplica movimientos para ver resultados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {processingClips.map(clip => (
                    <div key={clip.clipId} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Clip {clip.clipId + 1}</div>
                        <StatusBadge status={clip.status} />
                      </div>
                      
                      <div className="grid gap-1 mt-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sección:</span>
                          <span>{clip.section}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Patrón:</span>
                          <span>{clip.pattern.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Intensidad:</span>
                          <span>{clip.intensity}%</span>
                        </div>
                      </div>
                      
                      {/* Mostrar error si existe */}
                      {clip.status === 'error' && clip.error && (
                        <div className="mt-2 text-xs text-red-500">
                          Error: {clip.error}
                        </div>
                      )}
                      
                      {/* Mostrar miniatura del resultado si está completo */}
                      {clip.status === 'complete' && clip.resultUrl && (
                        <div className="mt-2">
                          <div className="relative aspect-video rounded-md overflow-hidden bg-black/10">
                            <video 
                              src={clip.resultUrl}
                              className="w-full h-full object-cover"
                              controls
                              loop
                              muted
                              preload="metadata"
                            />
                            <div className="absolute bottom-2 right-2">
                              <Button 
                                size="icon" 
                                variant="secondary" 
                                className="h-8 w-8 bg-white/20 hover:bg-white/40"
                                onClick={() => {
                                  // Abrir preview en nueva ventana
                                  window.open(clip.resultUrl, '_blank');
                                }}
                              >
                                <Maximize2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Mostrar barra de progreso si está procesando */}
                      {clip.status === 'processing' && (
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <MusicLoadingSpinner className="w-5 h-5" />
                            <span className="text-xs">Procesando...</span>
                          </div>
                          <div className="relative h-1.5 mt-2 bg-primary/10 rounded-full overflow-hidden">
                            <div 
                              className="absolute inset-y-0 left-0 bg-primary transition-all duration-300"
                              style={{ width: `${clip.progress || 50}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 flex flex-wrap gap-2 justify-between">
        <div>
          <Button
            onClick={() => {
              // Recomendar movimientos basados en el audio
              if (audioBuffer) {
                const activeSection = Object.keys(selectedSections).find(
                  section => selectedSections[section]
                ) || 'Coro';
                
                const { recommendedPattern, recommendedIntensity } = 
                  synchronizeMovementsWithAudio(audioBuffer, activeSection);
                
                if (recommendedPattern) {
                  setSelectedPattern(recommendedPattern.name);
                  setIntensity(recommendedIntensity);
                  
                  toast({
                    title: "Movimientos recomendados",
                    description: `Se recomendó "${recommendedPattern.name}" con intensidad ${recommendedIntensity}% para la sección ${activeSection}`,
                  });
                }
              } else {
                toast({
                  title: "Sin análisis de audio",
                  description: "No hay audio disponible para recomendar movimientos",
                  variant: "destructive",
                });
              }
            }}
            variant="outline"
            size="sm"
            disabled={(!isPremium && !isPurchased) || !audioBuffer}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Recomendar
          </Button>
        </div>
        
        <Button
          onClick={applyMovements}
          disabled={(!isPremium && !isPurchased) || filteredClips.length === 0 || processingClips.some(pc => pc.status === 'processing')}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {processingClips.some(pc => pc.status === 'processing') ? (
            <>
              <MusicLoadingSpinner className="mr-2 h-4 w-4" />
              Procesando...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Aplicar Movimientos
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Componente para mostrar el estado de procesamiento de un clip
function StatusBadge({ status }: { status: 'idle' | 'processing' | 'complete' | 'error' }) {
  switch (status) {
    case 'idle':
      return <Badge variant="outline">Pendiente</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="bg-primary/10 text-primary">Procesando</Badge>;
    case 'complete':
      return <Badge variant="default" className="bg-green-500">Completado</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
  }
}