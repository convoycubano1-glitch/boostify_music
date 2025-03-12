import React, { useState, useEffect, useRef } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../components/ui/accordion';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/use-auth';
import {
  Film,
  Music,
  SlidersHorizontal,
  Type,
  FileAudio,
  PlayCircle,
  PauseCircle,
  Upload,
  Download,
  Save,
  Share2,
  Activity,
  Wand2,
  Camera,
  Clock,
  Volume2,
  Layers,
  Image,
  Move,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Grip,
  GripVertical,
  GripHorizontal,
  X,
  ChevronsUpDown,
  ChevronsLeftRight,
  RotateCcw
} from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';

// Importar componentes del editor
import BeatAnalyzer from '../components/professional-editor/beat-analyzer';
import EffectsPanel from '../components/professional-editor/effects-panel';
import VideoPreviewPanel from '../components/professional-editor/video-preview-panel';
import ResizeHandleControl from '../components/professional-editor/resize-handle-control';
import MobileAdapter from '../components/professional-editor/mobile-adapter';
import MobileEditorLayout from '../components/professional-editor/mobile-editor-layout';
import ProfessionalTimeline from '../components/professional-editor/fixed-timeline';
import TranscriptionPanel from '../components/professional-editor/transcription-panel';
import AudioTrackEditor from '../components/professional-editor/audio-track-editor';
import { Toolbar } from '../components/professional-editor/toolbar';
import { TrackListPanel } from '../components/professional-editor/track-list-panel';
import { MobileToolbar } from '../components/professional-editor/mobile-toolbar';
import { ModuleConfigurator, ModuleConfig } from '../components/professional-editor/module-configurator';
import { Track } from '../lib/professional-editor-types';
import CutPanel from '../components/professional-editor/cut-panel';
import TransitionsPanel from '../components/professional-editor/transitions-panel';
import { EditorProvider } from '../lib/context/editor-context';

// Importar tipos desde professional-editor-types
import { 
  VisualEffect, 
  AudioTrack, 
  Beat, 
  Section, 
  Clip, 
  Transcription, 
  TimelineClip, 
  EditorState,
  EditorStateUtils 
} from '../lib/professional-editor-types';

// Importar servicios para comunicación con el servidor
import * as editorApiService from '../lib/services/professional-editor-api-service';

const ProfessionalEditor: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estado del reproductor de video
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(120); // 2 minutos por defecto

  // Estado de los datos del proyecto
  // Usar un video de ejemplo para que el reproductor funcione correctamente
  const [videoSrc, setVideoSrc] = useState<string>('/assets/Standard_Mode_Generated_Video (2).mp4');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [projectName, setProjectName] = useState<string>('Nuevo Proyecto');
  const [projectModified, setProjectModified] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);
  
  // Estado para el panel de pistas
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 'video-main',
      name: 'Video principal',
      type: 'video',
      position: 0,
      visible: true,
      locked: false,
      muted: false,
      solo: false,
      color: '#FF5733',
      createdAt: new Date()
    },
    {
      id: 'audio-main',
      name: 'Audio principal',
      type: 'audio',
      position: 1,
      visible: true,
      locked: false,
      muted: false,
      solo: false,
      color: '#3498DB',
      createdAt: new Date()
    }
  ]);
  
  // Estado para la herramienta activa
  const [activeTool, setActiveTool] = useState<string>('cut');
  
  // Estado para el idioma del editor (español por defecto)
  const [language, setLanguage] = useState<string>('es');
  
  // Estado para la configuración de paneles
  const [panelLayout, setPanelLayout] = useState<string>('default'); // 'default', 'compact', 'video-focus', 'timeline-focus', 'edit-focus'
  const [panelSizes, setPanelSizes] = useState<{[key: string]: number}>(() => {
    // Intentar cargar desde localStorage, si existe
    const savedSizes = localStorage.getItem('editor-panel-sizes');
    return savedSizes ? JSON.parse(savedSizes) : {
      preview: 60, // Porcentaje del ancho
      timeline: 20,
      edit: 20,
    };
  });
  
  // Estado para el modo de edición: pc o móvil
  const [editMode, setEditMode] = useState<'pc' | 'mobile'>(() => {
    // Detectar automáticamente basado en el tamaño de la pantalla
    return window.innerWidth < 768 ? 'mobile' : 'pc';
  });
  
  // Funciones de utilidad para manejar la orientación de los controles
  const getGripComponent = () => {
    return editMode === 'mobile' ? (
      <GripHorizontal className="h-4 w-4 text-zinc-400" />
    ) : (
      <GripVertical className="h-4 w-4 text-zinc-400" />
    );
  };

  // Referencias para elementos arrastables
  const panelRefs = useRef<{[key: string]: HTMLDivElement | null}>({
    preview: null,
    timeline: null,
    edit: null,
  });
  
  // Estado para mostrar/ocultar paneles
  const [visiblePanels, setVisiblePanels] = useState<{[key: string]: boolean}>(() => {
    // Intentar cargar desde localStorage, si existe
    const savedVisibility = localStorage.getItem('editor-panel-visibility');
    return savedVisibility ? JSON.parse(savedVisibility) : {
      preview: true,
      timeline: true,
      edit: true,
      toolbar: true,
    };
  });

  // Función para actualizar tamaños de paneles
  const handlePanelResize = (panelId: string, newSize: number) => {
    setPanelSizes(prev => {
      const updated = { ...prev, [panelId]: newSize };
      // Guardar en localStorage
      localStorage.setItem('editor-panel-sizes', JSON.stringify(updated));
      return updated;
    });
    markProjectAsModified();
  };

  // Función para mostrar/ocultar paneles
  const togglePanelVisibility = (panelId: string) => {
    setVisiblePanels(prev => {
      const updated = { ...prev, [panelId]: !prev[panelId] };
      // Guardar en localStorage
      localStorage.setItem('editor-panel-visibility', JSON.stringify(updated));
      return updated;
    });
  };

  // Función para restaurar el layout predeterminado
  const resetLayout = () => {
    setPanelSizes({
      preview: 60,
      timeline: 20,
      edit: 20,
    });
    setVisiblePanels({
      preview: true,
      timeline: true,
      edit: true,
      toolbar: true,
    });
    setPanelLayout('default');
    localStorage.setItem('editor-panel-sizes', JSON.stringify({
      preview: 60,
      timeline: 20,
      edit: 20,
    }));
    localStorage.setItem('editor-panel-visibility', JSON.stringify({
      preview: true,
      timeline: true,
      edit: true,
      toolbar: true,
    }));
    toast({
      title: "Layout restaurado",
      description: "La distribución de paneles se ha restablecido a los valores predeterminados"
    });
  };

  // Función para cambiar entre layouts predefinidos
  const changeLayout = (layoutName: string) => {
    setPanelLayout(layoutName);
    
    // Configurar tamaños según el layout seleccionado
    switch(layoutName) {
      case 'video-focus':
        setPanelSizes({
          preview: 70,
          timeline: 15,
          edit: 15,
        });
        setVisiblePanels(prev => ({...prev, preview: true, timeline: true, edit: true}));
        break;
      case 'timeline-focus':
        setPanelSizes({
          preview: 30,
          timeline: 50,
          edit: 20,
        });
        setVisiblePanels(prev => ({...prev, preview: true, timeline: true, edit: true}));
        break;
      case 'edit-focus':
        setPanelSizes({
          preview: 30,
          timeline: 20,
          edit: 50,
        });
        setVisiblePanels(prev => ({...prev, preview: true, timeline: true, edit: true}));
        break;
      case 'compact':
        setPanelSizes({
          preview: 50,
          timeline: 25,
          edit: 25,
        });
        setVisiblePanels(prev => ({...prev, preview: true, timeline: true, edit: true}));
        break;
      default: // 'default'
        setPanelSizes({
          preview: 60,
          timeline: 20,
          edit: 20,
        });
        setVisiblePanels(prev => ({...prev, preview: true, timeline: true, edit: true}));
        break;
    }
    
    // Guardar en localStorage
    localStorage.setItem('editor-panel-sizes', JSON.stringify(panelSizes));
    localStorage.setItem('editor-panel-visibility', JSON.stringify(visiblePanels));
    
    toast({
      title: "Layout cambiado",
      description: `Se ha aplicado el layout "${layoutName}"`
    });
  };

  // Detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setEditMode(window.innerWidth < 768 ? 'mobile' : 'pc');
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Función unificada para manejar la selección de herramientas
  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
  };
  
  // Función para manejar herramientas avanzadas del editor
  const handleAdvancedToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    
    // Verificar si la herramienta tiene una pestaña correspondiente
    const tabValue = toolToTabMap?.[toolId] || 'effects';
    
    // Si es una herramienta que necesita un panel específico, mostrar ese panel
    if (toolId === 'cut' || toolId === 'transitions') {
      // Asegurar que el panel de edición es visible
      setVisiblePanels(prev => ({...prev, edit: true}));
      // Hacer scroll al panel de edición en móvil
      if (editMode === 'mobile') {
        document.getElementById('edit-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Buscar el elemento Tabs y cambiar su valor si existe
      const tabsElement = document.querySelector('[data-orientation="horizontal"]');
      if (tabsElement) {
        const tabButton = document.querySelector(`[data-value="${tabValue}"]`) as HTMLElement;
        if (tabButton) {
          tabButton.click();
        }
      }
    }
  };

  // Manejar reproducción
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  // Actualizar estado de proyecto
  const markProjectAsModified = () => {
    setProjectModified(true);
  };

  // Manejar beats
  const handleUpdateBeats = (newBeats: Beat[]) => {
    setBeats(newBeats);
    markProjectAsModified();
  };

  // Manejar secciones
  const handleUpdateSections = (newSections: Section[]) => {
    setSections(newSections);
    markProjectAsModified();
  };

  // Manejar efectos visuales
  const handleAddEffect = (effect: Omit<VisualEffect, 'id'>) => {
    const newEffect: VisualEffect = {
      ...effect,
      id: `effect-${Date.now()}`
    };
    setVisualEffects([...visualEffects, newEffect]);
    markProjectAsModified();
  };

  const handleUpdateEffect = (effectId: string, updates: Partial<VisualEffect>) => {
    const updatedEffects = visualEffects.map(effect => 
      effect.id === effectId ? { ...effect, ...updates } : effect
    );
    setVisualEffects(updatedEffects);
    markProjectAsModified();
  };

  const handleDeleteEffect = (effectId: string) => {
    const filteredEffects = visualEffects.filter(effect => effect.id !== effectId);
    setVisualEffects(filteredEffects);
    markProjectAsModified();
  };
  
  // Guardar proyecto en el servidor
  const handleSaveProject = async () => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Debe iniciar sesión para guardar proyectos"
        });
        return;
      }
      
      toast({
        title: "Guardando proyecto",
        description: "Espere un momento mientras guardamos su proyecto..."
      });
      
      // Crear objeto con los datos del proyecto actual
      const projectData = {
        name: projectName,
        timeline: JSON.stringify(clips),
        effects: JSON.stringify(visualEffects),
        settings: JSON.stringify({
          bpm,
          duration,
          layoutConfig: {
            panelSizes,
            visiblePanels,
            panelLayout
          }
        })
      };
      
      // Llamar al servicio de API para guardar
      const result = await editorApiService.saveProject(projectData);
      
      if (result.success) {
        setProjectModified(false);
        toast({
          title: "Proyecto guardado",
          description: "El proyecto se ha guardado correctamente"
        });
      } else {
        throw new Error(result.error || "Error desconocido al guardar");
      }
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el proyecto. Inténtelo de nuevo."
      });
    }
  };
  
  // Exportar proyecto a archivo JSON
  const handleExportProject = async () => {
    try {
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Debe iniciar sesión para exportar proyectos"
        });
        return;
      }
      
      // Primero guardar cambios pendientes
      if (projectModified) {
        toast({
          title: "Guardando cambios",
          description: "Guardando cambios antes de exportar..."
        });
        await handleSaveProject();
      }
      
      // Preparar datos para exportación
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        project: {
          name: projectName,
          timeline: clips,
          effects: visualEffects,
          settings: {
            bpm,
            duration,
            layoutConfig: {
              panelSizes,
              visiblePanels,
              panelLayout
            }
          }
        }
      };
      
      // Convertir a JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Crear un objeto Blob con el JSON
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Crear URL para el Blob
      const url = URL.createObjectURL(blob);
      
      // Crear un elemento <a> para descargar el archivo
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName.replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0, 10)}.json`;
      
      // Añadir el enlace al documento y hacer clic
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Proyecto exportado",
        description: "El proyecto se ha exportado correctamente"
      });
    } catch (error) {
      console.error('Error al exportar proyecto:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo exportar el proyecto. Inténtelo de nuevo."
      });
    }
  };
  
  // Importar proyecto desde archivo JSON
  const handleImportProject = async () => {
    try {
      // Crear un input tipo file oculto
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      
      // Manejar la selección del archivo
      fileInput.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        
        if (!files || files.length === 0) {
          return;
        }
        
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = async (event) => {
          try {
            const fileContent = event.target?.result as string;
            const importData = JSON.parse(fileContent);
            
            // Mostrar toast informativo
            toast({
              title: "Importando proyecto",
              description: "Espere un momento mientras procesamos su proyecto..."
            });
            
            // Llamar al servicio de API para importar
            const importedProject = await editorApiService.importProject(importData);
            
            if (importedProject) {
              // Actualizar estado local con datos del proyecto importado
              setProjectName(importedProject.name);
              
              // Actualizar clips, efectos, etc.
              const parsedTimeline = typeof importedProject.timeline === 'string' 
                ? JSON.parse(importedProject.timeline) 
                : importedProject.timeline;
              setClips(parsedTimeline || []);
              
              const parsedEffects = typeof importedProject.effects === 'string' 
                ? JSON.parse(importedProject.effects) 
                : importedProject.effects;
              setVisualEffects(parsedEffects || []);
              
              // Actualizar configuración y ajustes
              if (importedProject.settings) {
                const settings = typeof importedProject.settings === 'string' 
                  ? JSON.parse(importedProject.settings) 
                  : importedProject.settings;
                
                if (settings.bpm) setBpm(settings.bpm);
                if (settings.duration) setDuration(settings.duration);
                
                // Actualizar layout si está disponible
                if (settings.layoutConfig) {
                  if (settings.layoutConfig.panelSizes) {
                    setPanelSizes(settings.layoutConfig.panelSizes);
                  }
                  if (settings.layoutConfig.visiblePanels) {
                    setVisiblePanels(settings.layoutConfig.visiblePanels);
                  }
                  if (settings.layoutConfig.panelLayout) {
                    setPanelLayout(settings.layoutConfig.panelLayout);
                  }
                }
              }
              
              toast({
                title: "Proyecto importado",
                description: "El proyecto se ha importado correctamente"
              });
              
              setProjectModified(false);
            }
          } catch (error) {
            console.error('Error al procesar archivo importado:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "El archivo seleccionado no es un proyecto válido."
            });
          }
        };
        
        reader.readAsText(file);
        
        // Limpiar el input del DOM después de usarlo
        document.body.removeChild(fileInput);
      };
      
      // Simular click para abrir el diálogo de selección de archivo
      fileInput.click();
    } catch (error) {
      console.error('Error al importar proyecto:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo importar el proyecto"
      });
    }
  };

  // Definir mapeo de herramientas a pestañas
  const toolToTabMap: { [key: string]: string } = {
    cut: 'cut',
    transitions: 'transitions',
    audio: 'audio',
    text: 'text',
    effects: 'effects'
  };
  
  // Definir layouts predefinidos para el ModuleConfigurator
  const predefinedLayouts = [
    { id: 'default', name: 'Estándar' },
    { id: 'video-focus', name: 'Enfoque Video' },
    { id: 'timeline-focus', name: 'Enfoque Timeline' },
    { id: 'edit-focus', name: 'Enfoque Edición' },
    { id: 'compact', name: 'Compacto' },
    { id: 'mobile', name: 'Modo Móvil' }
  ];
  
  // Convertir estado de paneles a formato ModuleConfig para el ModuleConfigurator
  const moduleConfigs: ModuleConfig[] = [
    {
      id: 'preview',
      name: 'Vista Previa',
      visible: visiblePanels.preview,
      locked: false,
      position: 0,
      minSize: 20,
      defaultSize: panelSizes.preview
    },
    {
      id: 'timeline',
      name: 'Línea de Tiempo',
      visible: visiblePanels.timeline,
      locked: false,
      position: 1,
      minSize: 15,
      defaultSize: panelSizes.timeline
    },
    {
      id: 'edit',
      name: 'Editor',
      visible: visiblePanels.edit,
      locked: false,
      position: 2,
      minSize: 15,
      defaultSize: panelSizes.edit
    },
    {
      id: 'toolbar',
      name: 'Barra de Herramientas',
      visible: visiblePanels.toolbar,
      locked: false,
      position: 3
    }
  ];
  
  // Función para actualizar la configuración de módulos
  const handleModuleUpdate = (updatedModules: ModuleConfig[]) => {
    // Actualizar visibilidad de paneles
    const newVisiblePanels = { ...visiblePanels };
    updatedModules.forEach(module => {
      newVisiblePanels[module.id] = module.visible;
    });
    setVisiblePanels(newVisiblePanels);
    
    // Guardar en localStorage
    localStorage.setItem('editor-panel-visibility', JSON.stringify(newVisiblePanels));
    
    // Marcar proyecto como modificado
    markProjectAsModified();
    
    toast({
      title: "Configuración actualizada",
      description: "Los cambios de configuración se han aplicado correctamente"
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Barra de herramientas superior - Estilo CapCut para móvil */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
          <span className="text-lg font-semibold mr-2 truncate text-white">{projectName}</span>
          {projectModified && <span className="text-xs text-orange-400">(Sin guardar)</span>}
        </div>
        
        <div className="flex flex-wrap justify-center sm:justify-end gap-1 w-full sm:w-auto">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2"
            onClick={handleImportProject}
          >
            <Upload className="h-4 w-4 mr-1" />
            <span className="text-xs">Importar</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2"
            onClick={handleExportProject}
          >
            <Download className="h-4 w-4 mr-1" />
            <span className="text-xs">Exportar</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2"
            onClick={handleSaveProject}
          >
            <Save className="h-4 w-4 mr-1" />
            <span className="text-xs">Guardar</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2"
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Compartir</span>
          </Button>
          
          <ModuleConfigurator
            modules={moduleConfigs}
            onModuleUpdate={handleModuleUpdate}
            onResetDefaults={resetLayout}
            layouts={predefinedLayouts}
            onLayoutChange={changeLayout}
            currentLayout={panelLayout}
          />
        </div>
      </div>
      
      {/* Contenedor principal del editor */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {/* Indicador de modo móvil en pantallas pequeñas */}
        {editMode === 'mobile' && (
          <div className="bg-orange-500 text-white text-xs p-1 text-center">
            Modo móvil activado - Desliza para ver todos los paneles
          </div>
        )}
        
        {/* Contenedor principal con paneles redimensionables */}
        <div className="flex-grow relative min-h-[500px] bg-zinc-950 border border-zinc-800 rounded-lg">
          {/* Panel principal de edición con modo distinto para móvil */}
          <ResizablePanelGroup
            direction={editMode === 'mobile' ? "vertical" : "horizontal"}
            className="h-full w-full rounded-lg overflow-hidden"
            onLayout={(sizes) => {
              // Solo guardar tamaños en modo escritorio
              if (editMode !== 'mobile') {
                const sizeMap = {
                  preview: sizes[0],
                  timeline: sizes[1],
                  edit: sizes[2]
                };
                setPanelSizes(sizeMap);
                localStorage.setItem('editor-panel-sizes', JSON.stringify(sizeMap));
              }
            }}
          >
            <ResizablePanel
              defaultSize={panelSizes.preview}
              minSize={20}
              collapsible={true}
              collapsedSize={0}
              onCollapse={() => togglePanelVisibility('preview')}
              className={!visiblePanels.preview ? 'hidden' : ''}
            >
              <div className="h-full flex flex-col bg-zinc-950 rounded-tl-lg overflow-hidden">
                <div className="bg-zinc-900 p-2 flex items-center justify-between">
                  <h3 className="font-medium text-sm">Vista previa</h3>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => changeLayout('video-focus')}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => togglePanelVisibility('preview')}
                    >
                      <Minimize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-grow overflow-hidden p-2">
                  <VideoPreviewPanel 
                    videoSrc={videoSrc}
                    currentTime={currentTime}
                    duration={duration}
                    isPlaying={isPlaying}
                    activeEffects={visualEffects}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeek={handleSeek}
                  />
                </div>
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-zinc-800 hover:bg-zinc-700">
              <GripVertical className="h-4 w-4 text-zinc-400" />
            </ResizableHandle>
            
            <ResizablePanel
              defaultSize={panelSizes.timeline}
              minSize={15}
              collapsible={true}
              collapsedSize={0}
              onCollapse={() => togglePanelVisibility('timeline')}
              className={!visiblePanels.timeline ? 'hidden' : ''}
            >
              <div className="h-full flex flex-col bg-zinc-950 overflow-hidden">
                <div className="bg-zinc-900 p-2 flex items-center justify-between">
                  <h3 className="font-medium text-sm">Línea de tiempo</h3>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => changeLayout('timeline-focus')}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => togglePanelVisibility('timeline')}
                    >
                      <Minimize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-grow overflow-auto p-2">
                  <TrackListPanel tracks={tracks} />
                </div>
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-zinc-800 hover:bg-zinc-700">
              <GripVertical className="h-4 w-4 text-zinc-400" />
            </ResizableHandle>
            
            <ResizablePanel
              defaultSize={panelSizes.edit}
              minSize={15}
              collapsible={true}
              collapsedSize={0}
              onCollapse={() => togglePanelVisibility('edit')}
              className={!visiblePanels.edit ? 'hidden' : ''}
            >
              <div id="edit-section" className="h-full flex flex-col bg-zinc-950 rounded-tr-lg overflow-hidden">
                <div className="bg-zinc-900 p-2 flex items-center justify-between">
                  <h3 className="font-medium text-sm">Editor</h3>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => changeLayout('edit-focus')}
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => togglePanelVisibility('edit')}
                    >
                      <Minimize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-grow p-2 overflow-auto">
                  <Tabs defaultValue="cut" className="w-full">
                    <TabsList className="grid grid-cols-5 mb-4">
                      <TabsTrigger value="cut">
                        <SlidersHorizontal className="h-4 w-4 mr-1" />
                        <span className="text-xs hidden sm:inline">Cortar</span>
                      </TabsTrigger>
                      <TabsTrigger value="transitions">
                        <Activity className="h-4 w-4 mr-1" />
                        <span className="text-xs hidden sm:inline">Transiciones</span>
                      </TabsTrigger>
                      <TabsTrigger value="effects">
                        <Wand2 className="h-4 w-4 mr-1" />
                        <span className="text-xs hidden sm:inline">Efectos</span>
                      </TabsTrigger>
                      <TabsTrigger value="audio">
                        <FileAudio className="h-4 w-4 mr-1" />
                        <span className="text-xs hidden sm:inline">Audio</span>
                      </TabsTrigger>
                      <TabsTrigger value="text">
                        <Type className="h-4 w-4 mr-1" />
                        <span className="text-xs hidden sm:inline">Texto</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cut" className="w-full">
                      <CutPanel 
                        currentTime={currentTime}
                        duration={duration}
                        clips={clips}
                        onCut={(clipData) => {
                          // Implementación pendiente
                          alert(`Cortar en tiempo ${clipData.startTime}`);
                        }}
                        onUpdateClip={(id, updates) => {
                          // Implementación pendiente
                          console.log("Actualizar clip", id, updates);
                        }}
                        onDeleteClip={(id) => {
                          // Implementación pendiente
                          alert(`Eliminar clip ${id}`);
                        }}
                        onPreview={(clip) => {
                          // Ir a la posición del clip
                          if (clip.startTime !== undefined) {
                            handleSeek(clip.startTime);
                          }
                        }}
                      />
                    </TabsContent>

                    <TabsContent value="transitions" className="w-full">
                      <TransitionsPanel 
                        transitions={[]}
                        clips={clips}
                        currentTime={currentTime}
                        duration={duration}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeek={handleSeek}
                        onAddTransition={(transition) => {
                          // Implementación pendiente
                          alert(`Añadir transición de tipo ${transition.type}`);
                        }}
                        onUpdateTransition={(id, updates) => {
                          // Implementación pendiente
                          console.log("Actualizar transición", id, updates);
                        }}
                        onDeleteTransition={(id) => {
                          // Implementación pendiente
                          alert(`Eliminar transición ${id}`);
                        }}
                        onPreview={(transition) => {
                          // Ir a la posición de la transición
                          if (transition.startTime !== undefined) {
                            handleSeek(transition.startTime);
                          }
                        }}
                      />
                    </TabsContent>

                    {/* Placeholder para herramientas no implementadas aún */}
                    {['effects', 'audio', 'text', 'stickers', 'templates', 'camera', 'speed', 'volume', 'settings'].includes(activeTool) && (
                      <div className="mt-4">
                        <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 flex flex-col items-center justify-center py-10">
                          <div className="text-4xl mb-4">🚧</div>
                          <h3 className="text-xl font-bold text-white mb-2">Herramienta en desarrollo</h3>
                          <p className="text-zinc-400 text-center max-w-md">
                            La herramienta "{activeTool}" está actualmente en desarrollo. 
                            Pronto tendrás acceso a todas sus funcionalidades.
                          </p>
                        </div>
                      </div>
                    )}
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
      
      {/* Barra de herramientas para dispositivos móviles (solo visible en pantallas pequeñas) */}
      <MobileToolbar 
        activeTool={activeTool}
        onToolSelect={handleAdvancedToolSelect}
      />
      
      {/* Margen inferior en móvil para evitar que la barra oculte contenido */}
      <div className="h-16 sm:h-0 w-full bg-black"></div>
    </div>
  );
};

export default ProfessionalEditor;