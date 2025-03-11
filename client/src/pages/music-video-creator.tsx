import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { TimelineMulticapa, TimelineClip } from '@/components/music-video/timeline-multicapa';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MusicVideoAI } from '@/components/music-video/music-video-ai';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, Download, Film, Music, Image, Play, 
  Pause, Share, Save, Plus, Scissors, Wand2,
  Video, Mic, FileVideo, ShieldCheck, LucideMusic,
  Sparkles, Trash, RotateCcw, RotateCw, Type as TypeIcon
} from 'lucide-react';
import BeatSynchronization from '@/lib/beat-synchronization';

// Mock de datos para desarrollo (se reemplazará por carga desde Firestore)
const sampleAudioUrls = [
  '/assets/sample-audio-1.mp3',
  '/assets/sample-audio-2.mp3',
  '/assets/sample-audio-3.mp3',
];

const sampleVideoUrls = [
  '/assets/Standard_Mode_Generated_Video (2).mp4',
  '/assets/Standard_Mode_Generated_Video (9).mp4',
  '/src/images/videos/Standard_Mode_Generated_Video.mp4',
];

const sampleImageUrls = [
  '/src/images/sample-image-1.jpg',
  '/src/images/sample-image-2.jpg',
  '/src/images/sample-image-3.jpg',
];

// Beats detectados para pruebas
const sampleBeats = [
  { time: 1.2, type: 'downbeat' as const, energy: 0.8, section: 'intro' },
  { time: 2.4, type: 'accent' as const, energy: 0.6, section: 'intro' },
  { time: 3.6, type: 'regular' as const, energy: 0.4, section: 'intro' },
  { time: 4.8, type: 'downbeat' as const, energy: 0.9, section: 'verse' },
  { time: 6.0, type: 'accent' as const, energy: 0.7, section: 'verse' },
  { time: 7.2, type: 'regular' as const, energy: 0.5, section: 'verse' },
  { time: 8.4, type: 'downbeat' as const, energy: 1.0, section: 'chorus' },
  { time: 9.6, type: 'accent' as const, energy: 0.8, section: 'chorus' },
  { time: 10.8, type: 'regular' as const, energy: 0.6, section: 'chorus' },
];

// Componente principal
const MusicVideoCreator: React.FC = () => {
  // Estado del usuario y sesión
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estado del proyecto
  const [projectName, setProjectName] = useState('Nuevo Video Musical');
  const [projectDuration, setProjectDuration] = useState(60); // En segundos
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Estado del timeline
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [fileType, setFileType] = useState<'audio' | 'video' | 'image' | null>(null);
  
  // Estado de la IA
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [openAIPanel, setOpenAIPanel] = useState(false);
  
  // Beats y sincronización
  const [audioBeats, setAudioBeats] = useState(sampleBeats);
  const [useBeatSync, setUseBeatSync] = useState(true);
  
  // Historial y deshacer/rehacer
  const [history, setHistory] = useState<TimelineClip[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Efecto para inicializar historial
  useEffect(() => {
    if (clips.length > 0 && historyIndex === -1) {
      setHistory([clips]);
      setHistoryIndex(0);
    }
  }, [clips, history, historyIndex]);
  
  // Funciones de historial
  const addToHistory = (newClips: TimelineClip[]) => {
    // Cortar historial si estamos en un punto intermedio
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newClips]);
    setHistoryIndex(newHistory.length);
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setClips(history[historyIndex - 1]);
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setClips(history[historyIndex + 1]);
    }
  };
  
  // Funciones para manejo de clips
  const handleAddClip = (clip: TimelineClip) => {
    const newClips = [...clips, clip];
    setClips(newClips);
    addToHistory(newClips);
  };
  
  const handleUpdateClip = (clip: TimelineClip) => {
    const newClips = clips.map(c => c.id === clip.id ? clip : c);
    setClips(newClips);
    addToHistory(newClips);
  };
  
  const handleDeleteClip = (clipId: string) => {
    const newClips = clips.filter(clip => clip.id !== clipId);
    setClips(newClips);
    
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
    
    addToHistory(newClips);
  };
  
  // Función para agregar nuevo clip desde la biblioteca
  const addNewClip = (url: string, type: 'audio' | 'video' | 'image', title: string = 'Nuevo clip') => {
    const id = `clip-${Date.now()}`;
    const newClip: TimelineClip = {
      id,
      type,
      title,
      start: currentTime,
      end: currentTime + (type === 'audio' ? 30 : 10), // Ajustar según tipo
      layer: type === 'audio' ? 0 : 1,
      visible: true,
      locked: false,
      metadata: {
        volume: 1.0
      }
    };
    
    // Asignar URL según tipo
    if (type === 'audio') {
      newClip.audioUrl = url;
    } else if (type === 'video') {
      newClip.videoUrl = url;
    } else if (type === 'image') {
      newClip.imageUrl = url;
    }
    
    handleAddClip(newClip);
    setShowFileSelector(false);
  };
  
  // Función para cargar archivo desde el sistema
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fileType) return;
    
    const url = URL.createObjectURL(file);
    addNewClip(url, fileType, file.name);
  };
  
  // Función para analizar beats de un archivo de audio
  const analyzeAudioBeats = async (audioFile: string) => {
    try {
      // Usar la biblioteca real de detección de beats
      const beats = await BeatSynchronization.loadAudio(audioFile, {
        sensitivity: 0.6
      });
      
      setAudioBeats(beats);
      
      toast({
        title: 'Análisis completado',
        description: `Se detectaron ${beats.length} beats en el audio`,
      });
    } catch (error) {
      console.error('Error al analizar beats:', error);
      toast({
        title: 'Error en análisis',
        description: 'No se pudieron detectar beats en el audio',
        variant: 'destructive'
      });
    }
  };
  
  // Función para guardar proyecto (mock)
  const saveProject = () => {
    // Aquí se implementaría la lógica para guardar en Firestore
    toast({
      title: 'Proyecto guardado',
      description: 'Tu video musical ha sido guardado correctamente',
    });
  };
  
  // Función para exportar proyecto (mock)
  const exportProject = () => {
    // Aquí se implementaría la lógica de renderizado y exportación
    toast({
      title: 'Exportando video',
      description: 'El video se está generando, te notificaremos cuando esté listo',
    });
  };
  
  // Función para generar clip con IA
  const generateVideoWithAI = async (prompt: string) => {
    setGeneratingVideo(true);
    
    try {
      // Simular llamada a API de generación
      setTimeout(() => {
        // Simular respuesta exitosa
        const videoUrl = sampleVideoUrls[Math.floor(Math.random() * sampleVideoUrls.length)];
        
        addNewClip(videoUrl, 'video', 'Video generado con IA');
        
        setGeneratingVideo(false);
        setOpenAIPanel(false);
        
        toast({
          title: 'Video generado',
          description: 'Se ha generado un nuevo clip usando IA',
        });
      }, 3000);
    } catch (error) {
      console.error('Error al generar video:', error);
      setGeneratingVideo(false);
      
      toast({
        title: 'Error en generación',
        description: 'No se pudo generar el video con IA',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{projectName}</h1>
          <p className="text-muted-foreground">
            Crea videos musicales profesionales con sincronización avanzada
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={undo}
            disabled={historyIndex <= 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Deshacer
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Rehacer
          </Button>
          
          <Button variant="outline" size="sm" onClick={saveProject}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          
          <Button variant="default" size="sm" onClick={exportProject}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Biblioteca */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Biblioteca</CardTitle>
              <CardDescription>
                Clips y recursos para tu video
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="library">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="library" className="flex-1">Biblioteca</TabsTrigger>
                  <TabsTrigger value="effects" className="flex-1">Efectos</TabsTrigger>
                  <TabsTrigger value="text" className="flex-1">Texto</TabsTrigger>
                </TabsList>
                
                <TabsContent value="library" className="space-y-4">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setFileType('audio');
                        setShowFileSelector(true);
                      }}
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Agregar Audio
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setFileType('video');
                        setShowFileSelector(true);
                      }}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Agregar Video
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setFileType('image');
                        setShowFileSelector(true);
                      }}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Agregar Imagen
                    </Button>
                  </div>
                  
                  <div className="border rounded-md">
                    <h3 className="px-3 py-2 font-medium border-b">Audios</h3>
                    <div className="p-2 space-y-2">
                      {sampleAudioUrls.map((url, index) => (
                        <div 
                          key={`audio-${index}`}
                          className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => addNewClip(url, 'audio', `Audio ${index + 1}`)}
                        >
                          <Music className="h-4 w-4 mr-2 text-primary" />
                          <span>Audio {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border rounded-md">
                    <h3 className="px-3 py-2 font-medium border-b">Videos</h3>
                    <div className="p-2 space-y-2">
                      {sampleVideoUrls.map((url, index) => (
                        <div 
                          key={`video-${index}`}
                          className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => addNewClip(url, 'video', `Video ${index + 1}`)}
                        >
                          <Video className="h-4 w-4 mr-2 text-primary" />
                          <span>Video {index + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => setOpenAIPanel(true)}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generar con IA
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="effects" className="space-y-4">
                  <div className="border rounded-md">
                    <h3 className="px-3 py-2 font-medium border-b">Transiciones</h3>
                    <div className="p-2 space-y-2">
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Scissors className="h-4 w-4 mr-2 text-primary" />
                        <span>Fundido</span>
                      </div>
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Scissors className="h-4 w-4 mr-2 text-primary" />
                        <span>Disolución</span>
                      </div>
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Scissors className="h-4 w-4 mr-2 text-primary" />
                        <span>Barrido</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md">
                    <h3 className="px-3 py-2 font-medium border-b">Filtros</h3>
                    <div className="p-2 space-y-2">
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        <span>Cine</span>
                      </div>
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        <span>Vintage</span>
                      </div>
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        <span>Blanco y Negro</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <div className="border rounded-md">
                    <h3 className="px-3 py-2 font-medium border-b">Estilos de Texto</h3>
                    <div className="p-2 space-y-2">
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <TypeIcon className="h-4 w-4 mr-2 text-primary" />
                        <span>Título</span>
                      </div>
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <TypeIcon className="h-4 w-4 mr-2 text-primary" />
                        <span>Subtítulo</span>
                      </div>
                      <div className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer">
                        <TypeIcon className="h-4 w-4 mr-2 text-primary" />
                        <span>Créditos</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Panel central: Timeline y Editor */}
        <div className="col-span-1 lg:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black overflow-hidden">
                {/* Preview del video */}
                {clips.filter(clip => clip.visible && (clip.type === 'video' || clip.type === 'image')).map(clip => (
                  <div 
                    key={clip.id}
                    className="absolute inset-0"
                    style={{
                      opacity: clip.visible ? 1 : 0,
                      display: currentTime >= clip.start && currentTime <= clip.end ? 'block' : 'none'
                    }}
                  >
                    {clip.type === 'video' && clip.videoUrl && (
                      <video 
                        src={clip.videoUrl}
                        className="w-full h-full object-contain"
                        muted
                        autoPlay={false}
                        loop={false}
                      />
                    )}
                    {clip.type === 'image' && clip.imageUrl && (
                      <img 
                        src={clip.imageUrl}
                        className="w-full h-full object-contain"
                        alt={clip.title}
                      />
                    )}
                  </div>
                ))}
                
                {/* Overlay con controles */}
                <div className="absolute bottom-4 right-4 left-4 flex justify-center">
                  <div className="bg-black/70 text-white px-3 py-1.5 rounded-full flex items-center space-x-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-white"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? 
                        <Pause className="h-4 w-4" /> : 
                        <Play className="h-4 w-4" />
                      }
                    </Button>
                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(projectDuration)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle>Timeline</CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="use-beat-sync" className="text-sm">
                    Sincronización
                  </Label>
                  <input
                    id="use-beat-sync"
                    type="checkbox"
                    checked={useBeatSync}
                    onChange={() => setUseBeatSync(!useBeatSync)}
                    className="mr-4"
                  />
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Pista
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <TimelineMulticapa
                initialClips={clips}
                duration={projectDuration}
                onClipAdd={handleAddClip}
                onClipUpdate={handleUpdateClip}
                onClipDelete={handleDeleteClip}
                onPlaybackChange={setIsPlaying}
                onPositionChange={setCurrentTime}
                audioBeats={useBeatSync ? audioBeats : []}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Diálogo para seleccionar archivos */}
      <Dialog open={showFileSelector} onOpenChange={setShowFileSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {fileType === 'audio' ? 'Agregar Audio' : 
               fileType === 'video' ? 'Agregar Video' : 
               'Agregar Imagen'}
            </DialogTitle>
            <DialogDescription>
              Selecciona un archivo para agregar al proyecto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept={
                  fileType === 'audio' ? 'audio/*' : 
                  fileType === 'video' ? 'video/*' : 
                  'image/*'
                }
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Arrastra aquí o haz clic para explorar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fileType === 'audio' ? 'MP3, WAV, OGG' : 
                     fileType === 'video' ? 'MP4, WEBM, MOV' : 
                     'JPG, PNG, GIF, WEBP'}
                  </p>
                </div>
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {(fileType === 'audio' ? sampleAudioUrls : 
                fileType === 'video' ? sampleVideoUrls : 
                sampleImageUrls).map((url, index) => (
                <div
                  key={`sample-${index}`}
                  className="border rounded-md p-2 cursor-pointer hover:bg-accent"
                  onClick={() => addNewClip(url, fileType!, `${fileType} ${index + 1}`)}
                >
                  <div className="flex items-center">
                    {fileType === 'audio' ? (
                      <Music className="h-4 w-4 mr-2 text-primary" />
                    ) : fileType === 'video' ? (
                      <Video className="h-4 w-4 mr-2 text-primary" />
                    ) : (
                      <Image className="h-4 w-4 mr-2 text-primary" />
                    )}
                    <span className="text-sm">
                      {fileType} {index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para generación con IA */}
      <Dialog open={openAIPanel} onOpenChange={setOpenAIPanel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generar contenido con IA</DialogTitle>
            <DialogDescription>
              Describe el video que quieres crear y nuestra IA generará clips adaptados a tu proyecto
            </DialogDescription>
          </DialogHeader>
          
          <MusicVideoAI 
            onGenerateVideo={(videoUrl, title) => {
              addNewClip(videoUrl, 'video', title || 'Video generado con IA');
              setOpenAIPanel(false);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Función auxiliar para formatear tiempo
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default MusicVideoCreator;