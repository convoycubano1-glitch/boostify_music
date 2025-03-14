/**
 * Página de editor profesional para música y vídeo
 * Con soporte para timeline mejorado y restricciones para clips de 5 segundos
 */
import React, { useState, useEffect, useRef } from 'react';
import { Header } from "../components/layout/header";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";
import { TimelineClip } from "../components/timeline/TimelineClip";
import { WaveformTimeline } from "../components/music-video/timeline/WaveformTimeline";
import { Separator } from "../components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { enforceAllConstraints, MAX_CLIP_DURATION, LAYER_TYPES } from "../components/music-video/timeline/TimelineConstraints";
import { 
  Upload, 
  Save, 
  Download, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Text, 
  Wand2, 
  Star, 
  BookOpen, 
  HelpCircle 
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

/**
 * Página principal del editor profesional
 */
export default function ProfessionalEditor() {
  // Estados para el editor
  const [clips, setClips] = useState<TimelineClip[]>([
    // Clips de ejemplo
    {
      id: 1,
      start: 0,
      duration: 3,
      type: 'audio',
      layer: LAYER_TYPES.AUDIO,
      title: 'Pista de Audio',
      visible: true,
      locked: false,
    },
    {
      id: 2,
      start: 0,
      duration: 3,
      type: 'image',
      layer: LAYER_TYPES.VIDEO_IMAGE,
      title: 'Imagen Principal',
      imageUrl: 'https://images.unsplash.com/photo-1492282738061-813ef179fff3',
      visible: true,
      locked: false,
    },
    {
      id: 3,
      start: 3.5,
      duration: 2.5,
      type: 'image',
      layer: LAYER_TYPES.AI_GENERATED,
      title: 'IA Generada',
      imagePrompt: 'Professional singer on stage with colorful lighting',
      visible: true,
      locked: false,
    }
  ]);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTab, setSelectedTab] = useState("timeline");
  
  // Referencias para elementos multimedia
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Toast para notificaciones
  const { toast } = useToast();
  
  // Manejar la actualización de un clip
  const handleClipUpdate = (clipId: number, updates: Partial<TimelineClip>) => {
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        const updatedClip = { ...clip, ...updates };
        
        // Si la duración supera los 5 segundos, mostrar una notificación
        if (updates.duration && updates.duration > MAX_CLIP_DURATION) {
          toast({
            title: "Aviso: Duración máxima",
            description: `La duración máxima permitida es de ${MAX_CLIP_DURATION} segundos. Se ha limitado automáticamente.`,
            variant: "warning",
          });
        }
        
        return updatedClip;
      }
      return clip;
    });
    
    // Aplicar restricciones automaticamente
    const constrainedClips = enforceAllConstraints(updatedClips);
    setClips(constrainedClips);
  };
  
  // Controlar reproducción
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Crear un nuevo clip
  const addNewClip = (type: 'video' | 'image' | 'audio' | 'text', layerId: number) => {
    // Determinar la posición del nuevo clip
    const lastClipInLayer = [...clips]
      .filter(c => c.layer === layerId)
      .sort((a, b) => (a.start + a.duration) - (b.start + b.duration))
      .pop();
    
    const newStart = lastClipInLayer ? lastClipInLayer.start + lastClipInLayer.duration + 0.1 : 0;
    
    // Crear nuevo clip
    const newClip: TimelineClip = {
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      start: newStart,
      duration: type === 'image' ? 3 : 2, // Valores predeterminados
      type,
      layer: layerId,
      title: `Nuevo ${type}`,
      visible: true,
      locked: false,
    };
    
    // Si es una imagen generada por IA
    if (type === 'image' && layerId === LAYER_TYPES.AI_GENERATED) {
      newClip.imagePrompt = 'Escriba su descripción aquí';
    }
    
    // Aplicar restricciones
    const updatedClips = enforceAllConstraints([...clips, newClip]);
    setClips(updatedClips);
    
    toast({
      title: "Clip creado",
      description: `Se ha añadido un nuevo clip de tipo ${type} en la capa ${layerId}`,
    });
  };
  
  // Generar una imagen con IA para un clip específico
  const generateAIImage = (clipId: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip || clip.layer !== LAYER_TYPES.AI_GENERATED) return;
    
    toast({
      title: "Generando imagen",
      description: "Procesando solicitud de generación de imagen con IA...",
    });
    
    // Aquí iría la lógica de generación de imagen con IA
    // Por ahora, simulamos un cambio para mostrar la funcionalidad
    setTimeout(() => {
      handleClipUpdate(clipId, {
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4",
        title: clip.imagePrompt?.slice(0, 20) + "..." || "Imagen IA",
      });
      
      toast({
        title: "Imagen generada",
        description: "La imagen se ha generado correctamente",
        variant: "success",
      });
    }, 1500);
  };
  
  // Exportar el proyecto actual
  const exportProject = () => {
    const projectData = {
      clips,
      duration,
      version: "1.0",
      exportedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `proyecto-musical-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Proyecto exportado",
      description: "El proyecto se ha exportado correctamente",
      variant: "success",
    });
  };
  
  // Eliminar un clip
  const deleteClip = (clipId: number) => {
    setClips(clips.filter(clip => clip.id !== clipId));
    
    toast({
      title: "Clip eliminado",
      description: "El clip se ha eliminado correctamente",
    });
  };
  
  // Interfaz de usuario
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col">
        {/* Título y controles principales */}
        <div className="container mx-auto py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Editor Profesional de Vídeo Musical</h1>
              <p className="text-muted-foreground text-sm">Crea videos musicales profesionales con control total sobre el timeline</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button variant="default" className="flex items-center" onClick={exportProject}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="secondary" className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
          
          {/* Pestañas de navegación */}
          <Tabs defaultValue="timeline" value={selectedTab} onValueChange={setSelectedTab}>
            <div className="border-b">
              <TabsList className="mx-4">
                <TabsTrigger value="timeline" className="text-sm">
                  <Video className="h-4 w-4 mr-2" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="assets" className="text-sm">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Recursos
                </TabsTrigger>
                <TabsTrigger value="effects" className="text-sm">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Efectos
                </TabsTrigger>
                <TabsTrigger value="help" className="text-sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Guía
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Contenido: Timeline */}
            <TabsContent value="timeline" className="space-y-4 py-4">
              <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-240px)]">
                {/* Panel lateral izquierdo */}
                <div className="w-full md:w-64 flex flex-col gap-2">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-lg">Añadir elementos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-start" 
                        onClick={() => addNewClip('audio', LAYER_TYPES.AUDIO)}
                      >
                        <Music className="h-4 w-4 mr-2" />
                        Audio
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-start"
                        onClick={() => addNewClip('image', LAYER_TYPES.VIDEO_IMAGE)}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Imagen
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-start"
                        onClick={() => addNewClip('video', LAYER_TYPES.VIDEO_IMAGE)}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-start"
                        onClick={() => addNewClip('text', LAYER_TYPES.TEXT)}
                      >
                        <Text className="h-4 w-4 mr-2" />
                        Texto
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="w-full flex items-center justify-start"
                        onClick={() => addNewClip('image', LAYER_TYPES.AI_GENERATED)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Imagen IA
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-lg">Propiedades</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Duración del proyecto</label>
                        <Select
                          value={duration.toString()}
                          onValueChange={(val) => setDuration(parseInt(val))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Duración" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 segundos</SelectItem>
                            <SelectItem value="60">1 minuto</SelectItem>
                            <SelectItem value="120">2 minutos</SelectItem>
                            <SelectItem value="180">3 minutos</SelectItem>
                            <SelectItem value="240">4 minutos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                      <div className="text-xs text-muted-foreground">
                        <p>Restricciones:</p>
                        <ul className="list-disc list-inside">
                          <li>Máximo 5 segundos por clip</li>
                          <li>Sin superposición en la misma capa</li>
                          <li>Imágenes generadas por IA solo en la capa 7</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Área principal del timeline */}
                <div className="flex-1 overflow-hidden">
                  <Card className="h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      {/* Área de preview */}
                      <div className="p-4 h-48 bg-gray-950 flex items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                          {/* Vista previa del video */}
                          <video
                            ref={videoRef}
                            className="max-h-full max-w-full"
                            controls={false}
                          />
                          {/* Controles de reproducción */}
                          <div className="absolute bottom-0 left-0 right-0 flex justify-center p-2">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="bg-gray-900/80 hover:bg-gray-800"
                              onClick={togglePlayback}
                            >
                              {isPlaying ? (
                                <Pause className="h-4 w-4 mr-1" />
                              ) : (
                                <Play className="h-4 w-4 mr-1" />
                              )}
                              {isPlaying ? "Pausar" : "Reproducir"}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Editor de timeline */}
                      <div className="flex-1 p-0">
                        <WaveformTimeline
                          clips={clips}
                          audioUrl="/assets/sample-music.mp3"
                          duration={duration}
                          currentTime={currentTime}
                          onClipUpdate={handleClipUpdate}
                          onTimeUpdate={setCurrentTime}
                          isPlaying={isPlaying}
                          onPlayPause={togglePlayback}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Contenido: Recursos */}
            <TabsContent value="assets" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Biblioteca de recursos</CardTitle>
                  <CardDescription>
                    Gestiona todas tus imágenes, videos y audios en un solo lugar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Arrastra y suelta para añadir recursos
                    </p>
                    <Button variant="secondary" size="sm">Examinar archivos</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Contenido: Efectos */}
            <TabsContent value="effects" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Efectos disponibles</CardTitle>
                  <CardDescription>
                    Añade efectos a tus clips para crear vídeos más dinámicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {["Fundido", "Rotación", "Escala", "Desvanecimiento", "Deslizar", "Zoom", "Flash", "Resplandor"].map((effect, index) => (
                      <Card key={index} className="p-4 cursor-pointer hover:bg-secondary/20 transition-colors">
                        <div className="flex flex-col items-center">
                          <Wand2 className="h-6 w-6 mb-2" />
                          <p className="text-sm font-medium">{effect}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Contenido: Guía */}
            <TabsContent value="help" className="space-y-4 py-4">
              <Card>
                <CardHeader>
                  <CardTitle>Guía de uso del editor</CardTitle>
                  <CardDescription>
                    Aprende a utilizar todas las funciones del editor profesional
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="mr-2 mt-1">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium">Trabajando con clips</h3>
                        <p className="text-sm text-muted-foreground">
                          Para añadir un clip, utiliza los botones del panel izquierdo. Puedes arrastrar 
                          los clips en la línea de tiempo para moverlos o redimensionarlos desde sus bordes.
                          Recuerda que todos los clips tienen una duración máxima de 5 segundos y no pueden superponerse
                          en la misma capa.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-2 mt-1">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium">Organizando capas</h3>
                        <p className="text-sm text-muted-foreground">
                          El editor utiliza un sistema de capas donde cada tipo de elemento tiene un lugar específico:
                          <br/>- Capa 0: Pistas de audio
                          <br/>- Capa 1: Videos e imágenes
                          <br/>- Capa 2: Texto y títulos
                          <br/>- Capa 3: Efectos visuales
                          <br/>- Capa 7: Imágenes generadas con IA
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="mr-2 mt-1">
                        <HelpCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium">Exportando tu proyecto</h3>
                        <p className="text-sm text-muted-foreground">
                          Cuando hayas terminado de editar, utiliza el botón "Exportar" en la parte superior 
                          para guardar tu proyecto. Podrás elegir entre varios formatos de exportación y ajustar
                          la calidad de salida.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}