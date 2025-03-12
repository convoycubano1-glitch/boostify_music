import React, { useState, useEffect } from 'react';
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
  Image
} from 'lucide-react';

// Importar componentes del editor
import BeatAnalyzer from '../components/professional-editor/beat-analyzer';
import EffectsPanel from '../components/professional-editor/effects-panel';
import VideoPreviewPanel from '../components/professional-editor/video-preview-panel';
import ProfessionalTimeline from '../components/professional-editor/fixed-timeline';
import TranscriptionPanel from '../components/professional-editor/transcription-panel';
import AudioTrackEditor from '../components/professional-editor/audio-track-editor';
import { Toolbar } from '../components/professional-editor/toolbar';
import { TrackListPanel } from '../components/professional-editor/track-list-panel';
import { Track } from '../lib/professional-editor-types';
import CutPanel from '../components/professional-editor/cut-panel';
import TransitionsPanel from '../components/professional-editor/transitions-panel';
import { EditorProvider } from '../lib/context/editor-context';
import { apiService } from '../lib/services/professional-editor-api-service';

// Tipo para la configuración del editor
interface EditorConfig {
  defaultZoom: number;
  autoSaveInterval: number; // en milisegundos
  maxTracks: number;
  language: 'es' | 'en';
  interfaceMode: 'simple' | 'advanced';
  trackHeight: number;
  themeMode: 'light' | 'dark' | 'system';
  showTimecodes: boolean;
  showWaveforms: boolean;
  showThumbnails: boolean;
  gridSnap: boolean;
  theme: {
    primary: string;
    accent: string;
    background: string;
    text: string;
  }
}

export default function ProfessionalEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estado para la configuración del editor
  const [config, setConfig] = useState<EditorConfig>({
    defaultZoom: 1,
    autoSaveInterval: 60000, // 1 minuto
    maxTracks: 20,
    language: 'es',
    interfaceMode: 'advanced',
    trackHeight: 60,
    themeMode: 'system',
    showTimecodes: true,
    showWaveforms: true,
    showThumbnails: true,
    gridSnap: true,
    theme: {
      primary: '#FF5A00',
      accent: '#FFA162',
      background: '#1A1A1A',
      text: '#FFFFFF'
    }
  });
  
  // Estado para selección de herramientas
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<string>('video');
  
  // Estado para simulación de guardado
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Estado para zoom
  const [zoomLevel, setZoomLevel] = useState<number>(config.defaultZoom);
  
  // Estado para orientación de la barra de herramientas
  const [toolbarOrientation, setToolbarOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  
  // Estado para simular pistas
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      name: 'Video principal',
      type: 'video',
      color: '#FF5A00',
      clips: [
        {
          id: 'clip1',
          name: 'Intro',
          start: 0,
          end: 10,
          sourceStart: 0,
          sourceEnd: 10,
          color: '#FF5A00'
        },
        {
          id: 'clip2',
          name: 'Parte 1',
          start: 10,
          end: 25,
          sourceStart: 0,
          sourceEnd: 15,
          color: '#FF5A00'
        }
      ],
      muted: false,
      locked: false,
      visible: true
    },
    {
      id: '2',
      name: 'Música',
      type: 'audio',
      color: '#00AAFF',
      clips: [
        {
          id: 'clip3',
          name: 'Música de fondo',
          start: 0,
          end: 30,
          sourceStart: 0,
          sourceEnd: 30,
          color: '#00AAFF'
        }
      ],
      muted: false,
      locked: false,
      visible: true
    },
    {
      id: '3',
      name: 'Voz en off',
      type: 'audio',
      color: '#00FF00',
      clips: [
        {
          id: 'clip4',
          name: 'Narración',
          start: 5,
          end: 20,
          sourceStart: 0,
          sourceEnd: 15,
          color: '#00FF00'
        }
      ],
      muted: false,
      locked: false,
      visible: true
    }
  ]);
  
  // Simulación de guardado automático
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, config.autoSaveInterval);
    
    return () => clearInterval(autoSaveInterval);
  }, [config.autoSaveInterval, tracks]);
  
  // Función para guardar el proyecto
  const handleSave = async () => {
    setIsSaving(true);
    
    // Simular una operación de guardado
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      
      toast({
        title: "Proyecto guardado",
        description: `Guardado exitosamente a las ${new Date().toLocaleTimeString()}`,
      });
    }, 1000);
    
    // Aquí iría la lógica real de guardado
    // await apiService.saveProject(projectData);
  };
  
  // Función para exportar el proyecto
  const handleExport = async () => {
    toast({
      title: "Exportando proyecto",
      description: "La exportación puede tomar algunos minutos...",
    });
    
    // Aquí iría la lógica real de exportación
    // const result = await apiService.exportProject(projectId);
  };
  
  // Función para manejar cambios en el zoom
  const handleZoomChange = (level: number) => {
    setZoomLevel(level);
  };
  
  // Función para seleccionar una herramienta
  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    
    // Dependiendo de la herramienta seleccionada, podríamos cambiar el panel visible
    switch (toolId) {
      case 'efectos':
        setSelectedPanel('effects');
        break;
      case 'audio':
        setSelectedPanel('audio');
        break;
      case 'ritmo':
        setSelectedPanel('rhythm');
        break;
      case 'texto':
        setSelectedPanel('text');
        break;
      case 'cortar':
        setSelectedPanel('cut');
        break;
      default:
        // Mantener el panel actual para otras herramientas
        break;
    }
  };
  
  return (
    <EditorProvider>
      <div className="flex flex-col h-screen bg-background text-foreground">
        {/* Barra de herramientas principal */}
        <Toolbar 
          orientation={toolbarOrientation}
          language={config.language}
          onZoom={handleZoomChange}
          currentZoom={zoomLevel}
          onToolSelect={handleToolSelect}
          activeToolId={selectedTool}
        />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Panel lateral izquierdo (solo si la barra de herramientas es horizontal) */}
          {toolbarOrientation === 'horizontal' && (
            <div className="w-16 bg-card border-r flex flex-col items-center p-2 space-y-4">
              <Button variant="ghost" size="icon" onClick={() => handleToolSelect('video')}>
                <Film className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleToolSelect('audio')}>
                <FileAudio className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleToolSelect('text')}>
                <Type className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleToolSelect('effects')}>
                <Wand2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleToolSelect('rhythm')}>
                <Activity className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          {/* Área de trabajo principal */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Área de previsualización */}
            <div className="flex-1 p-4 overflow-hidden">
              <div className="h-full flex gap-4">
                {/* Previsualización de video */}
                <div className="flex-1 bg-card rounded-lg overflow-hidden shadow-lg flex flex-col">
                  <VideoPreviewPanel />
                </div>
                
                {/* Panel lateral derecho */}
                <div className="w-1/4 bg-card rounded-lg shadow-lg overflow-hidden">
                  <Tabs defaultValue={selectedPanel} value={selectedPanel} className="w-full h-full" onValueChange={(value) => setSelectedPanel(value as string)}>
                    <TabsList className="w-full grid grid-cols-5">
                      <TabsTrigger value="video">Video</TabsTrigger>
                      <TabsTrigger value="audio">Audio</TabsTrigger>
                      <TabsTrigger value="rhythm">Ritmo</TabsTrigger>
                      <TabsTrigger value="effects">Efectos</TabsTrigger>
                      <TabsTrigger value="text">Texto</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="video" className="p-0 h-full">
                      <TrackListPanel tracks={tracks} />
                    </TabsContent>
                    
                    <TabsContent value="audio" className="p-0 h-full">
                      <AudioTrackEditor />
                    </TabsContent>
                    
                    <TabsContent value="rhythm" className="p-0 h-full">
                      <BeatAnalyzer />
                    </TabsContent>
                    
                    <TabsContent value="effects" className="p-0 h-full">
                      <EffectsPanel />
                    </TabsContent>
                    
                    <TabsContent value="text" className="p-0 h-full">
                      <TranscriptionPanel />
                    </TabsContent>
                    
                    <TabsContent value="cut" className="p-0 h-full">
                      <CutPanel />
                    </TabsContent>
                    
                    <TabsContent value="transitions" className="p-0 h-full">
                      <TransitionsPanel />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
            
            {/* Línea de tiempo */}
            <div className="h-1/3 border-t bg-card">
              <ProfessionalTimeline 
                tracks={tracks} 
                zoom={zoomLevel}
              />
            </div>
          </div>
          
          {/* Panel lateral derecho (controlado por estado) */}
          {toolbarOrientation === 'vertical' && (
            <div className="w-64 bg-card border-l flex flex-col p-4 space-y-4 overflow-auto">
              <Accordion type="single" collapsible defaultValue="settings">
                <AccordionItem value="settings">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {config.language === 'es' ? 'Configuración' : 'Settings'}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>{config.language === 'es' ? 'Mostrar códigos de tiempo' : 'Show timecodes'}</span>
                        <Button 
                          variant={config.showTimecodes ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setConfig({...config, showTimecodes: !config.showTimecodes})}
                        >
                          {config.showTimecodes ? 
                            (config.language === 'es' ? 'Sí' : 'Yes') : 
                            (config.language === 'es' ? 'No' : 'No')
                          }
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>{config.language === 'es' ? 'Mostrar formas de onda' : 'Show waveforms'}</span>
                        <Button 
                          variant={config.showWaveforms ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setConfig({...config, showWaveforms: !config.showWaveforms})}
                        >
                          {config.showWaveforms ? 
                            (config.language === 'es' ? 'Sí' : 'Yes') : 
                            (config.language === 'es' ? 'No' : 'No')
                          }
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>{config.language === 'es' ? 'Orientación de la barra' : 'Toolbar orientation'}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setToolbarOrientation(
                            toolbarOrientation === 'horizontal' ? 'vertical' : 'horizontal'
                          )}
                        >
                          {toolbarOrientation === 'horizontal' ? 
                            (config.language === 'es' ? 'Horizontal' : 'Horizontal') : 
                            (config.language === 'es' ? 'Vertical' : 'Vertical')
                          }
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="project">
                  <AccordionTrigger>
                    <div className="flex items-center">
                      <Film className="h-4 w-4 mr-2" />
                      {config.language === 'es' ? 'Proyecto' : 'Project'}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>{config.language === 'es' ? 'Auto-guardado' : 'Auto-save'}</span>
                        <span className="text-sm text-muted-foreground">
                          {config.autoSaveInterval / 1000}s
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span>{config.language === 'es' ? 'Último guardado' : 'Last saved'}</span>
                        <span className="text-sm text-muted-foreground">
                          {lastSaved ? 
                            lastSaved.toLocaleTimeString() : 
                            (config.language === 'es' ? 'Nunca' : 'Never')
                          }
                        </span>
                      </div>
                      
                      <Button 
                        className="w-full mt-2" 
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 
                          (config.language === 'es' ? 'Guardando...' : 'Saving...') : 
                          (config.language === 'es' ? 'Guardar ahora' : 'Save now')
                        }
                      </Button>
                      
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={handleExport}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {config.language === 'es' ? 'Exportar' : 'Export'}
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </EditorProvider>
  );
}