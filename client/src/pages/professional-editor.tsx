import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Music, Video, Image as ImageIcon, Wand2, 
  Save, Play, Pause, Scissors, ChevronRight, 
  Plus, RefreshCw, Clock, BarChart4, Sliders, 
  Layers, AudioLines, FileVideo, Grid, Maximize,
  MinusCircle, PlusCircle, ArrowLeftRight, Book
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfessionalTimeline } from '@/components/professional-editor/professional-timeline';
import { VideoPreviewPanel } from '@/components/professional-editor/video-preview-panel';
import { MediaLibrary } from '@/components/professional-editor/media-library';
import { EffectsPanel } from '@/components/professional-editor/effects-panel';
import { AudioTrackEditor } from '@/components/professional-editor/audio-track-editor';
import { BeatAnalyzer } from '@/components/professional-editor/beat-analyzer';
import { TranscriptionPanel } from '@/components/professional-editor/transcription-panel';
import { FileUploader } from '@/components/professional-editor/file-uploader';

// Datos de muestra para el editor
import { 
  sampleClips, 
  sampleAudioData, 
  sampleEffects,
  sampleBeats 
} from '@/lib/sample-editor-data';

export default function ProfessionalEditorPage() {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // 2 minutos por defecto
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [clips, setClips] = useState(sampleClips);
  const [audioData, setAudioData] = useState(sampleAudioData);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [beatData, setBeatData] = useState(sampleBeats);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("timeline");
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  
  const projectRef = useRef<HTMLDivElement>(null);
  const timelineInterval = useRef<number | null>(null);

  // Manejar reproducción
  const handlePlayPause = () => {
    if (isPlaying) {
      if (timelineInterval.current) {
        window.clearInterval(timelineInterval.current);
        timelineInterval.current = null;
      }
      setIsPlaying(false);
    } else {
      // Si estamos al final, volvemos al principio
      if (currentTime >= duration) {
        setCurrentTime(0);
      }
      
      // Creamos un intervalo para actualizar el tiempo actual
      // Usamos requestAnimationFrame para mejor rendimiento y sincronización más precisa
      const startTime = performance.now();
      const startPosition = currentTime;
      
      const updateFrame = (timestamp: number) => {
        if (!isPlaying) return;
        
        const elapsed = (timestamp - startTime) / 1000; // Convertir a segundos
        const newTime = startPosition + elapsed;
        
        if (newTime >= duration) {
          setCurrentTime(duration);
          setIsPlaying(false);
          return;
        }
        
        setCurrentTime(newTime);
        timelineInterval.current = requestAnimationFrame(updateFrame);
      };
      
      timelineInterval.current = requestAnimationFrame(updateFrame);
      setIsPlaying(true);
    }
  };
  
  // Manejar búsqueda (seek) en el tiempo
  const handleSeek = (time: number) => {
    // Actualizar el tiempo actual
    setCurrentTime(time);
    
    // Si estamos reproduciendo, reiniciar el intervalo desde la nueva posición
    if (isPlaying) {
      if (timelineInterval.current) {
        cancelAnimationFrame(timelineInterval.current);
        timelineInterval.current = null;
      }
      
      handlePlayPause(); // Detener
      setTimeout(() => handlePlayPause(), 10); // Iniciar de nuevo
    }
  };

  // Limpiar intervalo cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (timelineInterval.current) {
        cancelAnimationFrame(timelineInterval.current);
        timelineInterval.current = null;
      }
    };
  }, []);

  // Manejar subida de audio
  const handleAudioUpload = (file: File) => {
    setAudioFile(file);
    toast({
      title: "Audio cargado",
      description: `Archivo: ${file.name}`,
    });
    
    // Simular análisis de audio
    setTimeout(() => {
      setDuration(Math.floor(60 + Math.random() * 120)); // Entre 1 y 3 minutos
      setBeatData({
        ...sampleBeats,
        metadata: {
          ...sampleBeats.metadata,
          songTitle: file.name.replace(/\.[^/.]+$/, ""),
        }
      });
      
      // Simular transcripción
      setTranscription("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin euismod, nisl eget ultricies ultricies, nunc nisl ultricies nunc, quis ultricies nisl nisl eget.");
    }, 1500);
  };

  // Manejar subida de videos
  const handleVideoUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    setVideoFiles((prev) => [...prev, ...fileArray]);
    
    // Simular creación de clips
    const newClips = fileArray.map((file, index) => ({
      id: clips.length + index + 1,
      title: file.name,
      start: Math.max(0, currentTime),
      duration: 5 + Math.random() * 10,
      type: 'video',
      color: '#4CAF50',
      thumbnail: null,
      layer: 1
    }));
    
    setClips((prev) => [...prev, ...newClips]);
    
    toast({
      title: `${fileArray.length} video(s) cargado(s)`,
      description: "Se han añadido clips al timeline",
    });
  };

  // Manejar subida de imágenes
  const handleImageUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    setImageFiles((prev) => [...prev, ...fileArray]);
    
    // Simular creación de clips
    const newClips = fileArray.map((file, index) => ({
      id: clips.length + index + 1,
      title: file.name,
      start: Math.max(0, currentTime),
      duration: 3,
      type: 'image',
      color: '#2196F3',
      thumbnail: null,
      layer: 1
    }));
    
    setClips((prev) => [...prev, ...newClips]);
    
    toast({
      title: `${fileArray.length} imagen(es) cargada(s)`,
      description: "Se han añadido clips al timeline",
    });
  };

  // Actualizar clip cuando se arrastra o redimensiona
  const handleClipUpdate = (clipId: number, updates: any) => {
    setClips(clips.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    ));
  };

  // Manejar clic en clip
  const handleClipSelect = (clipId: number) => {
    setSelectedClipId(clipId);
  };

  // Generar video
  const handleGenerateVideo = () => {
    toast({
      title: "Generando video",
      description: "Creando sincronización y renderizando...",
    });
    
    setTimeout(() => {
      toast({
        title: "Video generado",
        description: "El video ha sido renderizado exitosamente.",
      });
    }, 3000);
  };

  // Dividir clip
  const handleSplitClip = () => {
    if (selectedClipId === null) {
      toast({
        title: "Error",
        description: "Selecciona un clip primero",
        variant: "destructive"
      });
      return;
    }
    
    const selectedClip = clips.find(c => c.id === selectedClipId);
    if (!selectedClip) return;
    
    const clipTime = currentTime - selectedClip.start;
    
    // Solo permitir división si el punto actual está dentro del clip
    if (clipTime <= 0 || clipTime >= selectedClip.duration) {
      toast({
        title: "Error",
        description: "El punto de corte debe estar dentro del clip",
        variant: "destructive"
      });
      return;
    }
    
    // Actualizar el clip seleccionado para que termine en el punto actual
    const updatedClips = clips.map(clip => {
      if (clip.id === selectedClipId) {
        return { ...clip, duration: clipTime };
      }
      return clip;
    });
    
    // Crear un nuevo clip con la parte restante
    const newClip = {
      ...selectedClip,
      id: Math.max(...clips.map(c => c.id)) + 1,
      start: currentTime,
      duration: selectedClip.duration - clipTime
    };
    
    setClips([...updatedClips, newClip]);
    toast({
      title: "Clip dividido",
      description: "Se ha creado un nuevo clip",
    });
  };

  // Formato para mostrar el tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={projectRef} className="w-full h-full flex flex-col gap-4 p-4">
      <Card className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editor Profesional de Video Musical</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: "Proyecto guardado",
                  description: "El proyecto se ha guardado correctamente",
                });
              }}
            >
              <Save className="h-4 w-4 mr-2" /> Guardar
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleGenerateVideo}
            >
              <Wand2 className="h-4 w-4 mr-2" /> Generar Video
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Panel de vista previa (izquierda) */}
          <div className="col-span-2">
            <VideoPreviewPanel
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onTimeUpdate={(time: number) => setCurrentTime(time)}
              onSeek={handleSeek}
              selectedClipId={selectedClipId}
              clips={clips}
              onClipUpdate={handleClipUpdate}
              onExport={(format: string, quality: string) => {
                toast({
                  title: "Exportando video",
                  description: `Formato: ${format}, Calidad: ${quality}`
                });
                
                setTimeout(() => {
                  toast({
                    title: "Exportación completada",
                    description: "El video ha sido exportado exitosamente"
                  });
                }, 3000);
              }}
              onTakeSnapshot={() => {
                toast({
                  title: "Captura tomada",
                  description: "Se ha guardado un fotograma del video",
                });
              }}
              audioVolume={0.8}
              onVolumeChange={(volume: number) => {
                // Función para manejar cambios de volumen
                console.log("Volumen cambiado:", volume);
              }}
            />
          </div>

          {/* Panel de herramientas (derecha) */}
          <div className="col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="media">
                  <FileVideo className="h-4 w-4 mr-1.5" /> Media
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <AudioLines className="h-4 w-4 mr-1.5" /> Audio
                </TabsTrigger>
                <TabsTrigger value="beats">
                  <BarChart4 className="h-4 w-4 mr-1.5" /> Beats
                </TabsTrigger>
                <TabsTrigger value="lyrics">
                  <Book className="h-4 w-4 mr-1.5" /> Letras
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="media" className="h-[300px]">
                <Card className="p-4">
                  <FileUploader
                    onAudioUpload={handleAudioUpload}
                    onVideoUpload={handleVideoUpload}
                    onImageUpload={handleImageUpload}
                  />
                  <MediaLibrary
                    videoFiles={videoFiles}
                    imageFiles={imageFiles}
                    audioFile={audioFile}
                    onAddToTimeline={(type: string, id: string | number) => {
                      toast({
                        title: "Elemento añadido",
                        description: `Se ha añadido un elemento de tipo ${type}`,
                      });
                    }}
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="audio" className="h-[300px]">
                <Card className="p-4">
                  <AudioTrackEditor
                    audioData={audioData}
                    currentTime={currentTime}
                    duration={duration}
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="beats" className="h-[300px]">
                <Card className="p-4">
                  <BeatAnalyzer
                    beatsData={beatData}
                    currentTime={currentTime}
                    duration={duration}
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="lyrics" className="h-[300px]">
                <Card className="p-4">
                  <TranscriptionPanel
                    transcription={transcription}
                    currentTime={currentTime}
                  />
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Controles de reproducción y herramientas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentTime(0)}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>
            <Button
              variant="default"
              onClick={handlePlayPause}
              className="min-w-24 bg-orange-500 hover:bg-orange-600"
            >
              {isPlaying ? (
                <><Pause className="h-4 w-4 mr-2" /> Pausar</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Reproducir</>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentTime(duration)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <div className="bg-black/5 px-3 py-1.5 rounded-md font-mono text-sm border">
              {formatTime(currentTime)}
            </div>
            <span className="text-sm text-muted-foreground">
              / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSplitClip}
              disabled={selectedClipId === null}
            >
              <Scissors className="h-4 w-4 mr-1.5" /> Cortar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEffectsPanel(!showEffectsPanel)}
            >
              <Sliders className="h-4 w-4 mr-1.5" /> Efectos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newZoom = zoomLevel < 2 ? zoomLevel + 0.25 : zoomLevel;
                setZoomLevel(newZoom);
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newZoom = zoomLevel > 0.5 ? zoomLevel - 0.25 : zoomLevel;
                setZoomLevel(newZoom);
              }}
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Panel de efectos (opcional) */}
        {showEffectsPanel && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Efectos y Transiciones</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEffectsPanel(false)}
              >
                Cerrar
              </Button>
            </div>
            <EffectsPanel
              selectedClipId={selectedClipId}
              effects={sampleEffects}
              clips={clips}
              onClipUpdate={handleClipUpdate}
              onApplyEffect={(effectType, parameters) => {
                if (selectedClipId === null) {
                  toast({
                    title: "Error",
                    description: "Selecciona un clip primero",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Actualizar el clip con el nuevo efecto
                const clipToUpdate = clips.find(c => c.id === selectedClipId);
                if (clipToUpdate) {
                  // Determinar si es un efecto de color o un efecto normal
                  if (effectType.startsWith('effect-') || effectType.startsWith('transition-')) {
                    // Efectos normales
                    const updatedEffects = [...(clipToUpdate.effects || []), {
                      id: effectType,
                      ...parameters,
                      appliedAt: new Date().toISOString()
                    }];
                    
                    handleClipUpdate(selectedClipId, { effects: updatedEffects });
                  } else {
                    // Corrección de color (filtros)
                    const updatedFilters = [...(clipToUpdate.filters || [])];
                    const existingFilterIndex = updatedFilters.findIndex(f => f.id === effectType);
                    
                    if (existingFilterIndex >= 0) {
                      // Actualizar filtro existente
                      updatedFilters[existingFilterIndex] = { 
                        ...updatedFilters[existingFilterIndex], 
                        ...parameters,
                        enabled: true
                      };
                    } else {
                      // Agregar nuevo filtro
                      updatedFilters.push({
                        id: effectType,
                        ...parameters,
                        enabled: true
                      });
                    }
                    
                    handleClipUpdate(selectedClipId, { filters: updatedFilters });
                  }
                }
                
                toast({
                  title: "Efecto aplicado",
                  description: `Se ha aplicado el efecto ${effectType}`,
                });
              }}
            />
          </Card>
        )}

        {/* Timeline profesional */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-2">Línea de Tiempo</h3>
          <ProfessionalTimeline
            clips={clips}
            currentTime={currentTime}
            duration={duration}
            zoomLevel={zoomLevel}
            onClipUpdate={handleClipUpdate}
            onClipSelect={handleClipSelect}
            selectedClipId={selectedClipId}
            onTimeUpdate={(time) => setCurrentTime(time)}
            isPlaying={isPlaying}
            beatsData={beatData}
          />
        </Card>
      </Card>
    </div>
  );
}