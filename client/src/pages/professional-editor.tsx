/**
 * Professional Video Editor - CapCut Style
 * Layout profesional con herramientas de edición completas y diseño responsive
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { WaveformTimeline } from "../components/music-video/timeline/WaveformTimeline";
import { Separator } from "../components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Slider } from "../components/ui/slider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { enforceAllConstraints, MAX_CLIP_DURATION, LAYER_TYPES } from "../components/music-video/timeline/TimelineConstraints";
import { TimelineClip, ClipType } from "../interfaces/timeline";
import { musicVideoProjectService, MusicVideoProject } from "../lib/services/music-video-project-service";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { fluxService } from '../lib/api/flux/flux-service';
import { 
  Save, 
  Download, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Music, 
  Type,
  Wand2, 
  FolderOpen,
  Plus,
  Layers,
  Settings,
  Film,
  Sparkles,
  Upload,
  ChevronRight,
  Maximize2,
  Clock,
  Trash2,
  RotateCcw,
  RotateCw,
  Home,
  X,
  Scissors,
  Copy,
  Clipboard,
  Split,
  ArrowLeftRight,
  RefreshCw,
  Edit,
  Zap,
  Loader2,
  Move,
  Sliders,
  Filter,
  Link,
  Menu,
  MoreVertical
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";

// Filtros predefinidos
const VIDEO_FILTERS = [
  { id: 'none', name: 'Sin filtro', filter: '' },
  { id: 'grayscale', name: 'Blanco y Negro', filter: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', filter: 'sepia(100%)' },
  { id: 'vintage', name: 'Vintage', filter: 'sepia(50%) contrast(1.2) brightness(0.9)' },
  { id: 'bright', name: 'Brillante', filter: 'brightness(1.3) contrast(1.1)' },
  { id: 'dark', name: 'Oscuro', filter: 'brightness(0.7) contrast(1.2)' },
  { id: 'vivid', name: 'Vívido', filter: 'saturate(1.5) contrast(1.2)' },
  { id: 'cold', name: 'Frío', filter: 'hue-rotate(180deg) saturate(1.2)' },
  { id: 'warm', name: 'Cálido', filter: 'hue-rotate(-30deg) saturate(1.2)' },
  { id: 'blur', name: 'Desenfoque', filter: 'blur(3px)' },
];

export default function ProfessionalEditor() {
  const [user] = useAuthState(auth);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados del proyecto
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("Nuevo Proyecto");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [artistReferences, setArtistReferences] = useState<string[]>([]);
  
  // Estados del editor
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Estados para herramientas de edición
  const [copiedClip, setCopiedClip] = useState<TimelineClip | null>(null);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitTime, setSplitTime] = useState(0);
  const [trimDialogOpen, setTrimDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  
  // Estados para ajustes visuales
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // Estados para regeneración
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  const [isRegeneratingVideo, setIsRegeneratingVideo] = useState(false);
  
  // Panel izquierdo - tab activo
  const [leftPanelTab, setLeftPanelTab] = useState<'projects' | 'media' | 'audio' | 'text' | 'effects'>('projects');
  
  // Lista de proyectos del usuario
  const [userProjects, setUserProjects] = useState<MusicVideoProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // Estados para responsive
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  
  // Referencias
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  // Cargar proyecto desde URL
  useEffect(() => {
    const loadProjectFromURL = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlProjectId = urlParams.get('projectId');
      
      if (!urlProjectId) return;
      
      await loadProject(urlProjectId);
    };
    
    loadProjectFromURL();
  }, []);
  
  // Cargar proyectos del usuario
  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user) return;
      
      setIsLoadingProjects(true);
      try {
        const projects = await musicVideoProjectService.getUserProjects(user.uid);
        setUserProjects(projects);
      } catch (error) {
        console.error('Error loading user projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    if (leftPanelTab === 'projects' && user) {
      fetchUserProjects();
    }
  }, [leftPanelTab, user]);
  
  // Sincronizar ajustes visuales con el clip seleccionado
  useEffect(() => {
    if (selectedClipId) {
      const clip = clips.find(c => c.id === selectedClipId);
      if (clip?.metadata) {
        setBrightness(clip.metadata.brightness || 100);
        setContrast(clip.metadata.contrast || 100);
        setSaturation(clip.metadata.saturation || 100);
        setSelectedFilter(clip.metadata.filter || 'none');
      }
    }
  }, [selectedClipId, clips]);
  
  // Función para cargar un proyecto
  const loadProject = async (id: string) => {
    setIsLoadingProject(true);
    try {
      const project = await musicVideoProjectService.getProject(id);
      
      if (!project) {
        toast({
          title: "Proyecto no encontrado",
          description: "El proyecto que intentas cargar no existe",
          variant: "destructive",
        });
        return;
      }
      
      // Convertir TimelineItems a TimelineClips
      const convertedClips = musicVideoProjectService.convertTimelineItemsToClips(project.timelineItems);
      
      // Actualizar estados
      setProjectId(project.id);
      setProjectName(project.name);
      setClips(convertedClips);
      setDuration(project.duration);
      setAudioUrl(project.audioUrl);
      setArtistReferences(project.artistReferences || []);
      
      toast({
        title: "Proyecto cargado",
        description: `"${project.name}" con ${convertedClips.length} clips`,
      });
      
      console.log(`✅ Proyecto cargado: ${project.name}`, {
        clips: convertedClips.length,
        duration: project.duration,
        artistReferences: project.artistReferences?.length || 0
      });
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Error al cargar",
        description: "No se pudo cargar el proyecto",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProject(false);
    }
  };
  
  // Guardar proyecto
  const saveProject = async () => {
    if (!user) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para guardar proyectos",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const timelineItems = musicVideoProjectService.convertClipsToTimelineItems(clips);
      
      const savedProjectId = await musicVideoProjectService.saveProject(
        user.uid,
        projectName,
        {
          audioUrl: audioUrl,
          timelineItems: timelineItems,
          artistReferences: artistReferences,
          editingStyle: 'professional',
          duration: duration
        },
        projectId || undefined
      );
      
      setProjectId(savedProjectId);
      
      toast({
        title: "Proyecto guardado",
        description: `"${projectName}" guardado exitosamente`,
      });
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el proyecto",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // ==================== HERRAMIENTAS DE EDICIÓN ====================
  
  // Actualizar clip
  const handleClipUpdate = (clipId: number, updates: Partial<TimelineClip>) => {
    const updatedClips = clips.map(clip => {
      if (clip.id === clipId) {
        return { ...clip, ...updates };
      }
      return clip;
    });
    
    const constrainedClips = enforceAllConstraints(updatedClips);
    setClips(constrainedClips);
  };
  
  // Eliminar clip
  const deleteClip = (clipId: number) => {
    setClips(clips.filter(clip => clip.id !== clipId));
    if (selectedClipId === clipId) {
      setSelectedClipId(null);
    }
    toast({
      title: "Clip eliminado",
      description: "El clip se ha eliminado del timeline",
    });
  };
  
  // Duplicar clip
  const duplicateClip = () => {
    if (!selectedClipId) return;
    
    const clipToDuplicate = clips.find(c => c.id === selectedClipId);
    if (!clipToDuplicate) return;
    
    const newClip: TimelineClip = {
      ...clipToDuplicate,
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      start: clipToDuplicate.start + clipToDuplicate.duration,
      title: `${clipToDuplicate.title} (copia)`,
    };
    
    const updatedClips = enforceAllConstraints([...clips, newClip]);
    setClips(updatedClips);
    setSelectedClipId(newClip.id);
    
    toast({
      title: "Clip duplicado",
      description: "Se ha creado una copia del clip",
    });
  };
  
  // Copiar clip
  const copyClip = () => {
    if (!selectedClipId) return;
    
    const clipToCopy = clips.find(c => c.id === selectedClipId);
    if (!clipToCopy) return;
    
    setCopiedClip(clipToCopy);
    toast({
      title: "Clip copiado",
      description: "Clip copiado al portapapeles",
    });
  };
  
  // Pegar clip
  const pasteClip = () => {
    if (!copiedClip) return;
    
    const newClip: TimelineClip = {
      ...copiedClip,
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      start: currentTime,
      title: `${copiedClip.title} (pegado)`,
    };
    
    const updatedClips = enforceAllConstraints([...clips, newClip]);
    setClips(updatedClips);
    setSelectedClipId(newClip.id);
    
    toast({
      title: "Clip pegado",
      description: "Clip pegado en la posición actual",
    });
  };
  
  // Dividir clip (split)
  const splitClip = () => {
    if (!selectedClipId) return;
    
    const clipToSplit = clips.find(c => c.id === selectedClipId);
    if (!clipToSplit) return;
    
    // Verificar que el tiempo de división esté dentro del clip
    if (splitTime <= clipToSplit.start || splitTime >= (clipToSplit.start + clipToSplit.duration)) {
      toast({
        title: "Posición inválida",
        description: "El tiempo de división debe estar dentro del clip",
        variant: "destructive",
      });
      return;
    }
    
    const firstPart: TimelineClip = {
      ...clipToSplit,
      duration: splitTime - clipToSplit.start,
      title: `${clipToSplit.title} (1)`,
    };
    
    const secondPart: TimelineClip = {
      ...clipToSplit,
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      start: splitTime,
      duration: (clipToSplit.start + clipToSplit.duration) - splitTime,
      title: `${clipToSplit.title} (2)`,
    };
    
    const updatedClips = clips
      .filter(c => c.id !== selectedClipId)
      .concat([firstPart, secondPart]);
    
    const constrainedClips = enforceAllConstraints(updatedClips);
    setClips(constrainedClips);
    setSelectedClipId(secondPart.id);
    setSplitDialogOpen(false);
    
    toast({
      title: "Clip dividido",
      description: "El clip se ha dividido en dos partes",
    });
  };
  
  // Abrir diálogo de split con el tiempo actual
  const openSplitDialog = () => {
    if (!selectedClipId) return;
    
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    
    // Establecer el tiempo de división en el medio del clip
    const midTime = clip.start + (clip.duration / 2);
    setSplitTime(midTime);
    setSplitDialogOpen(true);
  };
  
  // Mover clip
  const moveClip = (newStart: number) => {
    if (!selectedClipId) return;
    
    handleClipUpdate(selectedClipId, { start: newStart });
    setMoveDialogOpen(false);
    
    toast({
      title: "Clip movido",
      description: `Clip reposicionado a ${newStart.toFixed(2)}s`,
    });
  };
  
  // Recortar clip (trim)
  const trimClip = (newStart: number, newDuration: number) => {
    if (!selectedClipId) return;
    
    handleClipUpdate(selectedClipId, { 
      start: newStart,
      duration: newDuration 
    });
    setTrimDialogOpen(false);
    
    toast({
      title: "Clip recortado",
      description: "Los bordes del clip han sido ajustados",
    });
  };
  
  // Aplicar filtro
  const applyFilter = (filterId: string) => {
    if (!selectedClipId) return;
    
    const filter = VIDEO_FILTERS.find(f => f.id === filterId);
    if (!filter) return;
    
    setSelectedFilter(filterId);
    handleClipUpdate(selectedClipId, {
      metadata: {
        ...clips.find(c => c.id === selectedClipId)?.metadata,
        filter: filterId,
        filterValue: filter.filter
      }
    });
    
    toast({
      title: "Filtro aplicado",
      description: `Filtro "${filter.name}" aplicado al clip`,
    });
  };
  
  // Aplicar ajustes visuales
  const applyVisualAdjustments = () => {
    if (!selectedClipId) return;
    
    handleClipUpdate(selectedClipId, {
      metadata: {
        ...clips.find(c => c.id === selectedClipId)?.metadata,
        brightness,
        contrast,
        saturation
      }
    });
    
    toast({
      title: "Ajustes aplicados",
      description: "Los ajustes visuales se han guardado",
    });
  };
  
  // Sustituir URL del clip
  const replaceClipUrl = () => {
    if (!selectedClipId || !newUrl) return;
    
    handleClipUpdate(selectedClipId, { url: newUrl });
    setReplaceDialogOpen(false);
    setNewUrl('');
    
    toast({
      title: "Medio reemplazado",
      description: "El contenido del clip ha sido actualizado",
    });
  };
  
  // ==================== REGENERACIÓN CON IA ====================
  
  // Regenerar imagen
  const regenerateImage = async () => {
    if (!selectedClipId) return;
    
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip || clip.type !== ClipType.IMAGE) return;
    
    const imagePrompt = clip.metadata?.imagePrompt;
    if (!imagePrompt) {
      toast({
        title: "No hay prompt",
        description: "Este clip no tiene un prompt de IA para regenerar",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegeneratingImage(true);
    
    try {
      toast({
        title: "Regenerando imagen",
        description: "Generando nueva imagen con FLUX...",
      });
      
      // Generar con FLUX Kontext Pro
      const result = await fluxService.generateImage({
        prompt: imagePrompt,
        negativePrompt: "blurry, bad quality, distorted",
        width: 1024,
        height: 1024,
        guidance_scale: 4.5,
        steps: 35,
        model: "Qubico/flux1-dev",
        taskType: "txt2img"
      });
      
      if (result.success && result.taskId) {
        // Polling para obtener el resultado
        let attempts = 0;
        const maxAttempts = 60; // 2 minutos máximo
        
        const pollResult = async (): Promise<void> => {
          const status = await fluxService.checkTaskStatus(result.taskId!);
          
          if (status.status === 'completed' && status.url) {
            handleClipUpdate(selectedClipId, { url: status.url });
            toast({
              title: "Imagen regenerada",
              description: "La nueva imagen se ha generado exitosamente",
            });
            setIsRegeneratingImage(false);
          } else if (status.status === 'failed') {
            throw new Error('La generación de imagen falló');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollResult, 2000);
          } else {
            throw new Error('Tiempo de espera agotado');
          }
        };
        
        await pollResult();
      } else {
        throw new Error('No se pudo iniciar la generación');
      }
    } catch (error) {
      console.error('Error regenerating image:', error);
      toast({
        title: "Error",
        description: "No se pudo regenerar la imagen",
        variant: "destructive",
      });
      setIsRegeneratingImage(false);
    }
  };
  
  // Regenerar video
  const regenerateVideo = async () => {
    if (!selectedClipId) return;
    
    const clip = clips.find(c => c.id === selectedClipId);
    if (!clip) return;
    
    toast({
      title: "Regenerando video",
      description: "Esta funcionalidad estará disponible próximamente",
    });
  };
  
  // Toggle reproducción
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Añadir nuevo clip
  const addNewClip = (type: ClipType, layerId: number) => {
    const newClip: TimelineClip = {
      id: Math.max(0, ...clips.map(c => c.id)) + 1,
      layerId: layerId,
      type: type,
      start: currentTime || 0,
      duration: type === ClipType.IMAGE ? 3 : 2,
      title: `Nuevo ${type}`,
      locked: false,
    };
    
    const updatedClips = enforceAllConstraints([...clips, newClip]);
    setClips(updatedClips);
    setSelectedClipId(newClip.id);
  };
  
  // Exportar proyecto
  const exportProject = () => {
    const projectData = {
      clips,
      duration,
      projectName,
      artistReferences,
      version: "1.0",
      exportedAt: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(projectData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${projectName.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Proyecto exportado",
      description: "Archivo JSON descargado exitosamente",
    });
  };
  
  const selectedClip = clips.find(c => c.id === selectedClipId);
  
  // Componente de panel lateral izquierdo (reutilizable para desktop y móvil)
  const LeftPanelContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex border-b">
        <Button
          variant={leftPanelTab === 'projects' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => setLeftPanelTab('projects')}
          data-testid="tab-projects"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button
          variant={leftPanelTab === 'media' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => setLeftPanelTab('media')}
          data-testid="tab-media"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={leftPanelTab === 'audio' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => setLeftPanelTab('audio')}
          data-testid="tab-audio"
        >
          <Music className="h-4 w-4" />
        </Button>
        <Button
          variant={leftPanelTab === 'text' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => setLeftPanelTab('text')}
          data-testid="tab-text"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          variant={leftPanelTab === 'effects' ? 'secondary' : 'ghost'}
          size="sm"
          className="flex-1 rounded-none"
          onClick={() => setLeftPanelTab('effects')}
          data-testid="tab-effects"
        >
          <Wand2 className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Proyectos Tab */}
          {leftPanelTab === 'projects' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Mis Proyectos</h3>
              
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-2">
                    Inicia sesión para ver tus proyectos
                  </p>
                </div>
              ) : isLoadingProjects ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No tienes proyectos aún
                  </p>
                </div>
              ) : (
                userProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      loadProject(project.id);
                      setLeftPanelOpen(false);
                    }}
                    data-testid={`project-${project.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {project.totalScenes} clips • {Math.floor(project.duration)}s
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(project.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {project.id === projectId && (
                          <Badge variant="default" className="ml-2">Abierto</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
          
          {/* Media Tab */}
          {leftPanelTab === 'media' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Medios</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  addNewClip(ClipType.IMAGE, LAYER_TYPES.VIDEO_IMAGE);
                  setLeftPanelOpen(false);
                }}
                data-testid="button-add-image"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Añadir Imagen
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  addNewClip(ClipType.VIDEO, LAYER_TYPES.VIDEO_IMAGE);
                  setLeftPanelOpen(false);
                }}
                data-testid="button-add-video"
              >
                <VideoIcon className="h-4 w-4 mr-2" />
                Añadir Video
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  addNewClip(ClipType.IMAGE, LAYER_TYPES.AI_GENERATED);
                  setLeftPanelOpen(false);
                }}
                data-testid="button-add-ai-image"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generar con IA
              </Button>
              
              <Separator className="my-3" />
              
              <div className="text-xs text-muted-foreground">
                Los clips se añadirán en la posición actual del timeline
              </div>
            </div>
          )}
          
          {/* Audio Tab */}
          {leftPanelTab === 'audio' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Audio</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  addNewClip(ClipType.AUDIO, LAYER_TYPES.AUDIO);
                  setLeftPanelOpen(false);
                }}
                data-testid="button-add-audio"
              >
                <Music className="h-4 w-4 mr-2" />
                Añadir Pista
              </Button>
              
              {audioUrl && (
                <Card className="mt-3">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium mb-1">Audio Principal</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {audioUrl.split('/').pop()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Text Tab */}
          {leftPanelTab === 'text' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Texto</h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  addNewClip(ClipType.TEXT, LAYER_TYPES.TEXT);
                  setLeftPanelOpen(false);
                }}
                data-testid="button-add-text"
              >
                <Type className="h-4 w-4 mr-2" />
                Añadir Texto
              </Button>
            </div>
          )}
          
          {/* Effects Tab */}
          {leftPanelTab === 'effects' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold mb-3">Efectos</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Fundido', 'Rotación', 'Zoom', 'Desenfocar', 'Brillo', 'Contraste'].map((effect) => (
                  <Card key={effect} className="cursor-pointer hover:bg-accent transition-colors">
                    <CardContent className="p-3 text-center">
                      <Wand2 className="h-5 w-5 mx-auto mb-1" />
                      <p className="text-xs">{effect}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
  
  // Componente de propiedades (reutilizable para desktop y móvil)
  const RightPanelContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Propiedades
        </h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {selectedClip ? (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="adjust">Ajustar</TabsTrigger>
                <TabsTrigger value="filters">Filtros</TabsTrigger>
              </TabsList>
              
              {/* Tab Básico */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={selectedClip.title || ''}
                    onChange={(e) => handleClipUpdate(selectedClip.id, { title: e.target.value })}
                    className="mt-1"
                    placeholder="Nombre del clip"
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm flex items-center justify-between">
                    <span>{selectedClip.type}</span>
                    {selectedClip.generatedImage && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        IA
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Inicio</Label>
                    <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm">
                      {selectedClip.start.toFixed(2)}s
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Duración</Label>
                    <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm">
                      {selectedClip.duration.toFixed(2)}s
                    </div>
                  </div>
                </div>
                
                {/* AI Regeneration Tools */}
                {selectedClip.metadata?.imagePrompt && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label className="text-xs mb-2 block flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        Herramientas IA
                      </Label>
                      
                      <div className="space-y-2">
                        {selectedClip.type === ClipType.IMAGE && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={regenerateImage}
                            disabled={isRegeneratingImage}
                            data-testid="button-regenerate-image"
                          >
                            {isRegeneratingImage ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Regenerar Imagen
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={regenerateVideo}
                          disabled={isRegeneratingVideo}
                          data-testid="button-regenerate-video"
                        >
                          <VideoIcon className="h-4 w-4 mr-2" />
                          Regenerar Video
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Prompt IA</Label>
                      <Textarea
                        value={selectedClip.metadata.imagePrompt}
                        onChange={(e) => handleClipUpdate(selectedClip.id, {
                          metadata: {
                            ...selectedClip.metadata,
                            imagePrompt: e.target.value
                          }
                        })}
                        className="mt-1 text-xs"
                        rows={3}
                      />
                    </div>
                  </>
                )}
                
                {selectedClip.url && (
                  <div>
                    <Label className="text-xs">URL</Label>
                    <div className="mt-1 px-3 py-2 bg-muted rounded-md text-xs truncate">
                      {selectedClip.url}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => deleteClip(selectedClip.id)}
                  data-testid="button-delete-clip"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Clip
                </Button>
              </TabsContent>
              
              {/* Tab Ajustar */}
              <TabsContent value="adjust" className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Brillo</Label>
                    <span className="text-xs text-muted-foreground">{brightness}%</span>
                  </div>
                  <Slider
                    value={[brightness]}
                    onValueChange={([value]) => setBrightness(value)}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Contraste</Label>
                    <span className="text-xs text-muted-foreground">{contrast}%</span>
                  </div>
                  <Slider
                    value={[contrast]}
                    onValueChange={([value]) => setContrast(value)}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Saturación</Label>
                    <span className="text-xs text-muted-foreground">{saturation}%</span>
                  </div>
                  <Slider
                    value={[saturation]}
                    onValueChange={([value]) => setSaturation(value)}
                    min={0}
                    max={200}
                    step={1}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                    }}
                  >
                    Resetear
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={applyVisualAdjustments}
                  >
                    <Sliders className="h-4 w-4 mr-2" />
                    Aplicar
                  </Button>
                </div>
              </TabsContent>
              
              {/* Tab Filtros */}
              <TabsContent value="filters" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {VIDEO_FILTERS.map((filter) => (
                    <Card
                      key={filter.id}
                      className={`cursor-pointer transition-all ${
                        selectedFilter === filter.id
                          ? 'ring-2 ring-primary'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => applyFilter(filter.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <Filter className="h-5 w-5 mx-auto mb-1" />
                        <p className="text-xs font-medium">{filter.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Selecciona un clip para ver sus propiedades
              </p>
            </div>
          )}
          
          <Separator />
          
          {/* Artist References */}
          {artistReferences.length > 0 && (
            <>
              <div>
                <Label className="text-xs mb-2 block">Referencias del Artista</Label>
                <div className="grid grid-cols-3 gap-2">
                  {artistReferences.slice(0, 3).map((ref, idx) => (
                    <div key={idx} className="aspect-square rounded-md overflow-hidden border">
                      <img
                        src={ref}
                        alt={`Referencia ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {artistReferences.length} imagen(es) de referencia
                </p>
              </div>
              <Separator />
            </>
          )}
          
          <div>
            <Label className="text-xs mb-2 block">Configuración del Proyecto</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Duración total</Label>
                <Select
                  value={duration.toString()}
                  onValueChange={(val) => setDuration(parseInt(val))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
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
              
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                <p className="font-medium mb-1">Clips activos:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{clips.length} total</li>
                  <li>{clips.filter(c => c.type === ClipType.IMAGE).length} imágenes</li>
                  <li>{clips.filter(c => c.type === ClipType.VIDEO).length} videos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
  
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b bg-card flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                data-testid="button-mobile-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <LeftPanelContent />
            </SheetContent>
          </Sheet>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            data-testid="button-home"
            className="hidden sm:flex"
          >
            <Home className="h-5 w-5" />
          </Button>
          
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="font-semibold text-xs sm:text-sm px-2 sm:px-4" data-testid="button-project-name">
                <Film className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{projectName}</span>
                <span className="sm:hidden truncate max-w-[80px]">{projectName}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nombre del Proyecto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Mi Proyecto de Video"
                  data-testid="input-project-name"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Toolbar - Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMoveDialogOpen(true)}
            disabled={!selectedClipId}
            data-testid="button-move"
          >
            <Move className="h-4 w-4 mr-1" />
            Mover
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTrimDialogOpen(true)}
            disabled={!selectedClipId}
            data-testid="button-trim"
          >
            <Scissors className="h-4 w-4 mr-1" />
            Trim
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={copyClip}
            disabled={!selectedClipId}
            data-testid="button-copy"
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={pasteClip}
            disabled={!copiedClip}
            data-testid="button-paste"
          >
            <Clipboard className="h-4 w-4 mr-1" />
            Pegar
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={duplicateClip}
            disabled={!selectedClipId}
            data-testid="button-duplicate"
          >
            <Copy className="h-4 w-4 mr-1" />
            Duplicar
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={openSplitDialog}
            disabled={!selectedClipId}
            data-testid="button-split"
          >
            <Split className="h-4 w-4 mr-1" />
            Dividir
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplaceDialogOpen(true)}
            disabled={!selectedClipId}
            data-testid="button-replace"
          >
            <Link className="h-4 w-4 mr-1" />
            Sustituir
          </Button>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-undo"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-redo"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Toolbar - Mobile (Dropdown Menu) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" disabled={!selectedClipId}>
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setMoveDialogOpen(true)}>
              <Move className="h-4 w-4 mr-2" />
              Mover
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTrimDialogOpen(true)}>
              <Scissors className="h-4 w-4 mr-2" />
              Recortar (Trim)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyClip}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={pasteClip} disabled={!copiedClip}>
              <Clipboard className="h-4 w-4 mr-2" />
              Pegar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={duplicateClip}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={openSplitDialog}>
              <Split className="h-4 w-4 mr-2" />
              Dividir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setReplaceDialogOpen(true)}>
              <Link className="h-4 w-4 mr-2" />
              Sustituir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportProject}
            data-testid="button-export"
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={saveProject}
            disabled={isSaving || !user}
            data-testid="button-save"
          >
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </Button>
          
          {/* Mobile Properties Button */}
          <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                data-testid="button-mobile-properties"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <RightPanelContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isLoadingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <Card className="w-[320px]">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <div className="text-center">
                  <p className="text-lg font-semibold">Cargando proyecto...</p>
                  <p className="text-sm text-muted-foreground">Preparando timeline y clips</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Split Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dividir Clip</DialogTitle>
            <DialogDescription>
              Selecciona el tiempo donde quieres dividir el clip
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tiempo de división (segundos)</Label>
              <Input
                type="number"
                value={splitTime.toFixed(2)}
                onChange={(e) => setSplitTime(parseFloat(e.target.value))}
                step={0.1}
                min={selectedClip?.start || 0}
                max={(selectedClip?.start || 0) + (selectedClip?.duration || 0)}
              />
            </div>
            <Slider
              value={[splitTime]}
              onValueChange={([value]) => setSplitTime(value)}
              min={selectedClip?.start || 0}
              max={(selectedClip?.start || 0) + (selectedClip?.duration || 0)}
              step={0.1}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSplitDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={splitClip}>
              <Scissors className="h-4 w-4 mr-2" />
              Dividir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mover Clip</DialogTitle>
            <DialogDescription>
              Define la nueva posición del clip en el timeline
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nueva posición (segundos)</Label>
              <Input
                type="number"
                defaultValue={selectedClip?.start || 0}
                onChange={(e) => {
                  const newStart = parseFloat(e.target.value);
                  if (!isNaN(newStart) && newStart >= 0) {
                    moveClip(newStart);
                  }
                }}
                step={0.1}
                min={0}
                max={duration}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Trim Dialog */}
      <Dialog open={trimDialogOpen} onOpenChange={setTrimDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recortar Clip (Trim)</DialogTitle>
            <DialogDescription>
              Ajusta el inicio y duración del clip
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Inicio (segundos)</Label>
              <Input
                type="number"
                defaultValue={selectedClip?.start || 0}
                id="trim-start"
                step={0.1}
                min={0}
              />
            </div>
            <div>
              <Label>Duración (segundos)</Label>
              <Input
                type="number"
                defaultValue={selectedClip?.duration || 0}
                id="trim-duration"
                step={0.1}
                min={0.1}
                max={MAX_CLIP_DURATION}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrimDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              const startInput = document.getElementById('trim-start') as HTMLInputElement;
              const durationInput = document.getElementById('trim-duration') as HTMLInputElement;
              const newStart = parseFloat(startInput.value);
              const newDuration = parseFloat(durationInput.value);
              trimClip(newStart, newDuration);
            }}>
              <Scissors className="h-4 w-4 mr-2" />
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Replace URL Dialog */}
      <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sustituir Medio</DialogTitle>
            <DialogDescription>
              Ingresa la nueva URL del medio (imagen o video)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nueva URL</Label>
              <Input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>
            {selectedClip?.url && (
              <div>
                <Label className="text-xs text-muted-foreground">URL Actual</Label>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {selectedClip.url}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplaceDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={replaceClipUrl} disabled={!newUrl}>
              <Link className="h-4 w-4 mr-2" />
              Sustituir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Desktop only */}
        <div className="hidden md:block w-64 border-r bg-card shrink-0">
          <LeftPanelContent />
        </div>
        
        {/* Center Panel - Preview & Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Preview */}
          <div className="h-[35%] sm:h-[40%] md:h-[45%] bg-black flex items-center justify-center relative border-b">
            <div className="w-full h-full flex items-center justify-center">
              {selectedClip?.url ? (
                selectedClip.type === ClipType.VIDEO ? (
                  <video
                    ref={videoPreviewRef}
                    src={selectedClip.url}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: selectedClip.metadata?.filterValue || 
                             `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }}
                    controls={false}
                  />
                ) : selectedClip.type === ClipType.IMAGE ? (
                  <img
                    src={selectedClip.url}
                    alt={selectedClip.title}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: selectedClip.metadata?.filterValue || 
                             `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    }}
                  />
                ) : (
                  <div className="text-white text-center p-4">
                    <Film className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xs sm:text-sm opacity-70">Selecciona un clip para previsualizar</p>
                  </div>
                )
              ) : (
                <div className="text-white text-center p-4">
                  <Film className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xs sm:text-sm opacity-70">Vista previa del video</p>
                </div>
              )}
            </div>
            
            {/* Preview Controls */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-black/60 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-2 rounded-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8 text-white hover:bg-white/20"
                onClick={togglePlayback}
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="h-4 w-4 sm:h-5 sm:w-5" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>
              
              <Separator orientation="vertical" className="h-4 sm:h-6 bg-white/30" />
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 sm:h-8 sm:w-8 text-white hover:bg-white/20"
                data-testid="button-fullscreen"
              >
                <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <div className="text-white text-xs sm:text-sm font-mono ml-1 sm:ml-2">
                {Math.floor(currentTime)}s / {duration}s
              </div>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="flex-1 bg-card overflow-hidden">
            <WaveformTimeline
              clips={clips}
              audioUrl={audioUrl || "/assets/sample-music.mp3"}
              duration={duration}
              currentTime={currentTime}
              onClipUpdate={handleClipUpdate}
              onTimeUpdate={setCurrentTime}
              isPlaying={isPlaying}
              onPlayPause={togglePlayback}
            />
          </div>
        </div>
        
        {/* Right Panel - Desktop only */}
        <div className="hidden md:block w-72 lg:w-80 border-l bg-card shrink-0">
          <RightPanelContent />
        </div>
      </div>
    </div>
  );
}
