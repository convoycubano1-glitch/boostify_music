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
  MinusCircle, PlusCircle, ArrowLeftRight, Book,
  Sparkles
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ProfessionalTimeline } from '@/components/professional-editor/professional-timeline';
import { VideoPreviewPanel } from '@/components/professional-editor/video-preview-panel';
import { MediaLibrary } from '@/components/professional-editor/media-library';
import { EffectsPanel } from '@/components/professional-editor/effects-panel';
import { AudioTrackEditor } from '@/components/professional-editor/audio-track-editor';
import { BeatAnalyzer } from '@/components/professional-editor/beat-analyzer';
import { TranscriptionPanel } from '@/components/professional-editor/transcription-panel';
import { FileUploader } from '@/components/professional-editor/file-uploader';
import { MusicVideoWorkflow } from '@/components/music-video/music-video-workflow';

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
      timelineInterval.current = window.setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime >= duration) {
            if (timelineInterval.current) {
              window.clearInterval(timelineInterval.current);
              timelineInterval.current = null;
            }
            setIsPlaying(false);
            return duration;
          }
          return prevTime + 0.1; // Incremento de 100ms
        });
      }, 100);
      
      setIsPlaying(true);
    }
  };

  // Limpiar intervalo cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (timelineInterval.current) {
        window.clearInterval(timelineInterval.current);
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
              selectedClipId={selectedClipId}
              clips={clips}
            />
          </div>

          {/* Panel de herramientas (derecha) */}
          <div className="col-span-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5">
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
                <TabsTrigger value="aiCreator">
                  <Sparkles className="h-4 w-4 mr-1.5" /> AI Creator
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
                    onAddToTimeline={(type, id) => {
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
              
              <TabsContent value="aiCreator" className="h-[600px] overflow-auto">
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Creador de Videos Musicales AI</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Transforma tu música en experiencias visuales
                  </p>
                  
                  {/* Flujo de trabajo del Creador de Videos Musicales AI */}
                  <div className="grid gap-6">
                    {/* 1. Subir Audio */}
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">1. Subir Audio</h4>
                      <div className="grid gap-2">
                        <div className="flex items-center border rounded-md p-2 bg-muted/20">
                          <Music className="h-5 w-5 mr-2 text-orange-500" />
                          <span className="text-sm">geminis_REDWINE_combined_KITS.mp3</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 2. Transcripción */}
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">2. Transcripción</h4>
                      <div className="bg-muted/20 rounded-md p-3 max-h-40 overflow-y-auto text-sm">
                        Ooh, ooh, come with me This is Red Wine Hall, yeah I walk in like a storm, lightning in my veins One moment I'm fire, the next I'm rain I swear devotion, then vanishing smoke You think you own me, but I'm gone before you spoke Entro como trueno, con furia en la piel Hoy soy tu paraíso, mañana tu infiel Juro que te amo, pero solo un show Cuando menos lo esperas, ya me fui sin adiós You try to hold me, but I slip away Promise you forever, then laughing straight Intentas atarme, pero me voy sin pensar Prometo el infinito, pero nunca me verás quedar Heavy knees, oh Lord, love me if you dare I'll turn your world with just a stare One day I'm your king, the next I'm the ghost With a charming smile, I'll leave you lost Heavy knees, ay Dios, si me amas sufrirás Te levo al cielo, luego te dejo atrás Hoy soy tu dueño, mañana un adiós Con solo una risa, te pierdo en mi voz I love the thrill, more than the prize Truth is just a game, wrapped in my lies You think you know me, but I've already gone Left you a story, but no name to hold on Me encanta la casa, más que la presa La verdad es un juego dentro de mi promesa Que es que me quieres, pero ya no
                      </div>
                      <div className="mt-2">
                        <Button variant="outline" size="sm" className="mt-2">
                          <Sparkles className="h-4 w-4 mr-1.5" /> Generar Guion Musical
                        </Button>
                      </div>
                    </div>
                    
                    {/* 3. Guion Profesional */}
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">3. Guion Profesional</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        El guion profesional se generará basado en la transcripción de la letra.
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Incluirá análisis de género musical, estructura narrativa, diseño visual y segmentación por escenas con vocabulario cinematográfico.
                      </p>
                    </div>

                    {/* 4. Estilo Visual */}
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">4. Estilo Visual</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor="camera-format" className="text-sm mb-1 block">Formato de Cámara</Label>
                          <Select>
                            <SelectTrigger id="camera-format">
                              <SelectValue placeholder="Seleccionar formato de cámara" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="16:9">16:9 Estándar</SelectItem>
                              <SelectItem value="9:16">9:16 Vertical</SelectItem>
                              <SelectItem value="1:1">1:1 Cuadrado</SelectItem>
                              <SelectItem value="21:9">21:9 Cinemático</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="mood" className="text-sm mb-1 block">Mood</Label>
                          <Select>
                            <SelectTrigger id="mood">
                              <SelectValue placeholder="Seleccionar mood" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dramatic">Dramático</SelectItem>
                              <SelectItem value="energetic">Energético</SelectItem>
                              <SelectItem value="melancholic">Melancólico</SelectItem>
                              <SelectItem value="romantic">Romántico</SelectItem>
                              <SelectItem value="mysterious">Misterioso</SelectItem>
                              <SelectItem value="happy">Feliz</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="color-palette" className="text-sm mb-1 block">Paleta de Colores</Label>
                          <Select>
                            <SelectTrigger id="color-palette">
                              <SelectValue placeholder="Seleccionar paleta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="warm">Cálida</SelectItem>
                              <SelectItem value="cool">Fría</SelectItem>
                              <SelectItem value="vibrant">Vibrante</SelectItem>
                              <SelectItem value="pastel">Pastel</SelectItem>
                              <SelectItem value="monochrome">Monocromática</SelectItem>
                              <SelectItem value="neon">Neón</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="character-style" className="text-sm mb-1 block">Estilo de Personajes</Label>
                          <Select>
                            <SelectTrigger id="character-style">
                              <SelectValue placeholder="Seleccionar estilo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realistic">Realista</SelectItem>
                              <SelectItem value="anime">Anime</SelectItem>
                              <SelectItem value="stylized">Estilizado</SelectItem>
                              <SelectItem value="3d">3D</SelectItem>
                              <SelectItem value="abstract">Abstracto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <Label htmlFor="visual-intensity" className="text-sm">Intensidad Visual (50%)</Label>
                          </div>
                          <Slider id="visual-intensity" defaultValue={[50]} max={100} step={1} />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <Label htmlFor="narrative-intensity" className="text-sm">Intensidad Narrativa (50%)</Label>
                          </div>
                          <Slider id="narrative-intensity" defaultValue={[50]} max={100} step={1} />
                          <p className="text-xs text-muted-foreground mt-1">Ajusta qué tan fielmente el video sigue la narrativa de la letra</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <Label htmlFor="reference-image" className="text-sm mb-1 block">Imagen de Referencia</Label>
                        <div className="border border-dashed rounded-md p-4 text-center">
                          <p className="text-sm text-muted-foreground">Ningún archivo seleccionado</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="director" className="text-sm mb-1 block">Director del Video</Label>
                        <Select>
                          <SelectTrigger id="director">
                            <SelectValue placeholder="Seleccionar director" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spielberg">Estilo Spielberg</SelectItem>
                            <SelectItem value="tarantino">Estilo Tarantino</SelectItem>
                            <SelectItem value="nolan">Estilo Nolan</SelectItem>
                            <SelectItem value="wes-anderson">Estilo Wes Anderson</SelectItem>
                            <SelectItem value="fincher">Estilo Fincher</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* 5. Sincronizar Beats */}
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">5. Sincronizar Beats</h4>
                      <Button variant="outline" size="sm" className="mb-4">
                        <BarChart4 className="h-4 w-4 mr-1.5" /> Detectar Cortes Musicales
                      </Button>
                      
                      <fieldset className="border rounded-md p-3">
                        <legend className="text-sm font-medium px-2">Estilo de Edición</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4">
                          {[
                            { id: "phrases", label: "Edición por Frases", desc: "Cortes sincronizados con las frases musicales" },
                            { id: "random", label: "Compases Aleatorios", desc: "Cortes variados siguiendo el ritmo" },
                            { id: "dynamic", label: "Dinámico", desc: "Cortes rápidos en momentos intensos, más lentos en partes suaves" },
                            { id: "slow", label: "Lento", desc: "Cortes largos y suaves transiciones" },
                            { id: "cinematic", label: "Cinematográfico", desc: "Estilo de película con variedad de duraciones" },
                            { id: "mtv", label: "Video Musical", desc: "Estilo MTV con cortes rápidos y dinámicos" },
                            { id: "narrative", label: "Narrativo", desc: "Cortes que siguen la historia de la letra" },
                            { id: "experimental", label: "Experimental", desc: "Patrones de corte no convencionales" },
                            { id: "rhythmic", label: "Rítmico", desc: "Cortes precisos en cada beat" },
                            { id: "minimalist", label: "Minimalista", desc: "Pocos cortes, transiciones suaves" }
                          ].map(item => (
                            <div key={item.id} className="flex items-start space-x-2">
                              <input type="radio" id={item.id} name="edit-style" className="mt-1" />
                              <div>
                                <Label htmlFor={item.id} className="text-sm font-medium">{item.label}</Label>
                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                    
                    {/* 6-7. Generar Prompts e Imágenes */}
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-medium mb-2">6. Generar Prompts</h4>
                      <Button variant="outline" size="sm" className="mr-2 mb-4">
                        <Sparkles className="h-4 w-4 mr-1.5" /> Generar Prompts con Estilo
                      </Button>
                      
                      <h4 className="text-md font-medium mb-2">7. Generar Imágenes</h4>
                      <Button variant="default" size="sm" className="bg-orange-500 hover:bg-orange-600">
                        <ImageIcon className="h-4 w-4 mr-1.5" /> Generar Imágenes
                      </Button>
                    </div>
                    
                    {/* Resto del flujo de trabajo */}
                    <MusicVideoWorkflow
                      onComplete={(result) => {
                        toast({
                          title: "Video musical completado",
                          description: `Se ha generado un video de ${Math.floor((result.duration || 0) / 60)}:${((result.duration || 0) % 60).toString().padStart(2, '0')} minutos`,
                        });
                      }}
                    />
                  </div>
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
              onApplyEffect={(effectType) => {
                if (selectedClipId === null) {
                  toast({
                    title: "Error",
                    description: "Selecciona un clip primero",
                    variant: "destructive"
                  });
                  return;
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