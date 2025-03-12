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

  // Función unificada para manejar la selección de herramientas
  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
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

  // Manejar pistas de audio
  const handleAddAudioTrack = (track: Omit<AudioTrack, 'id'>) => {
    const newTrack: AudioTrack = {
      ...track,
      id: `track-${Date.now()}`
    };
    setAudioTracks([...audioTracks, newTrack]);
    markProjectAsModified();
  };

  const handleUpdateAudioTrack = (trackId: string, updates: Partial<AudioTrack>) => {
    const updatedTracks = audioTracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    setAudioTracks(updatedTracks);
    markProjectAsModified();
  };

  const handleRemoveAudioTrack = (trackId: string) => {
    const filteredTracks = audioTracks.filter(track => track.id !== trackId);
    setAudioTracks(filteredTracks);
    markProjectAsModified();
  };

  // Importar proyecto desde archivo JSON
  const handleImportProject = () => {
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
              setClips(typeof importedProject.timeline === 'string' 
                ? JSON.parse(importedProject.timeline) 
                : importedProject.timeline);
              setVisualEffects(typeof importedProject.effects === 'string' 
                ? JSON.parse(importedProject.effects) 
                : importedProject.effects);
              
              if (importedProject.settings) {
                const settings = typeof importedProject.settings === 'string' 
                  ? JSON.parse(importedProject.settings) 
                  : importedProject.settings;
                
                if (settings.bpm) setBpm(settings.bpm);
                if (settings.duration) setDuration(settings.duration);
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
      
      // Primero guardar el proyecto actual para tener los datos actualizados
      if (projectModified) {
        toast({
          title: "Guardando cambios",
          description: "Guardando proyecto antes de exportar..."
        });
        
        await handleSaveProject();
      }
      
      // Preparar un ID de proyecto, ya sea existente o nuevo
      const projectId = localStorage.getItem('currentProjectId') || `project-${Date.now()}`;
      
      // Mostrar toast informativo
      toast({
        title: "Exportando proyecto",
        description: "Preparando datos para exportación..."
      });
      
      // Llamar al servicio de API para exportar
      const exportData = await editorApiService.exportProject(projectId);
      
      // Convertir a string JSON con formato legible
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Crear blob y url para descargar
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga y simular click
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${projectName.replace(/\s+/g, '_')}_export.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Limpiar
      document.body.removeChild(downloadLink);
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
        description: "No se pudo exportar el proyecto"
      });
    }
  };

  const { toast } = useToast();
  const { user } = useAuth();
  
  // Guardar proyecto usando la nueva API
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
      
      // Preparar datos del proyecto para guardar
      const projectData = {
        id: `project-${Date.now()}`, // Si es un proyecto nuevo
        name: projectName,
        userId: user.uid,
        timeline: JSON.stringify(clips),
        effects: JSON.stringify(visualEffects),
        settings: JSON.stringify({
          bpm: bpm,
          duration: duration
        }),
        // No enviamos thumbnailUrl por ahora
      };
      
      toast({
        title: "Guardando proyecto",
        description: "Espere un momento..."
      });
      
      // Guardar proyecto a través de la API
      const response = await editorApiService.saveProjectToServer(projectData);
      
      if (response) {
        toast({
          title: "Proyecto guardado",
          description: "El proyecto se guardó correctamente"
        });
        setProjectModified(false);
      }
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar el proyecto. Intente nuevamente más tarde."
      });
    }
  };

  // Analizar beats (simulación)
  const handleAnalyzeBeats = async (config: { sensitivity: number, beatEmphasis: number }) => {
    // Simular procesamiento asíncrono
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generar beats ficticios basados en la configuración
    const numBeats = Math.floor(30 + config.sensitivity * 50);
    const simulatedBpm = 80 + Math.floor(config.beatEmphasis * 40);
    
    // Crear beats a intervalos regulares
    const generatedBeats: Beat[] = [];
    const beatInterval = 60 / simulatedBpm;
    
    for (let i = 0; i < numBeats; i++) {
      const time = i * beatInterval;
      if (time > duration) break;
      
      // Determinar tipo de beat
      let type: Beat['type'] = 'beat';
      let intensity = 0.5 + (Math.random() * 0.5 * config.beatEmphasis);
      let isSection = false;
      
      if (i % 4 === 0) {
        type = 'bar';
        intensity = Math.min(1, intensity + 0.2);
      }
      
      if (i % 16 === 0) {
        // En lugar de usar 'section' como tipo, que no está definido en Beat['type']
        // Lo marcamos como un beat especial con mayor intensidad
        isSection = true;
        intensity = Math.min(1, intensity + 0.3);
      }
      
      generatedBeats.push({
        id: `beat-${i}`,
        time,
        type,
        intensity,
        label: isSection ? `Sección ${Math.floor(i/16) + 1}` : undefined,
        bpm: simulatedBpm
      });
    }
    
    // Actualizar BPM
    setBpm(simulatedBpm);
    
    return { beats: generatedBeats, bpm: simulatedBpm };
  };

  // Manejar clips de la línea de tiempo
  const handleAddClip = (clip: Omit<Clip, 'id'>) => {
    const newClip: Clip = {
      ...clip,
      id: `clip-${Date.now()}`
    };
    setClips([...clips, newClip]);
    markProjectAsModified();
  };

  const handleUpdateClip = (clipId: string, updates: Partial<Clip>) => {
    const updatedClips = clips.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    );
    setClips(updatedClips);
    markProjectAsModified();
  };

  const handleDeleteClip = (clipId: string) => {
    const filteredClips = clips.filter(clip => clip.id !== clipId);
    setClips(filteredClips);
    markProjectAsModified();
  };

  // Obtener efectos activos para el tiempo actual
  const getActiveEffects = () => {
    return visualEffects.filter(effect => 
      // En la definición original de VisualEffect no existe 'enabled'
      // Consideramos un efecto activo sólo si está dentro del rango de tiempo actual
      currentTime >= effect.startTime && 
      currentTime < effect.startTime + effect.duration
    );
  };
  
  // Manejar pistas
  const handleAddTrack = (type: string) => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: type === 'video' ? `Video ${tracks.length}` : `Audio ${tracks.length}`,
      type: type as 'video' | 'audio' | 'text',
      position: tracks.length,
      visible: true,
      locked: false,
      muted: false,
      solo: false,
      color: type === 'video' ? '#FF5733' : type === 'audio' ? '#3498DB' : '#2ECC71',
      createdAt: new Date()
    };
    setTracks([...tracks, newTrack]);
    markProjectAsModified();
  };
  
  const handleUpdateTrack = (trackId: string, updates: Partial<Track>) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    );
    setTracks(updatedTracks);
    markProjectAsModified();
  };
  
  const handleDeleteTrack = (trackId: string) => {
    const filteredTracks = tracks.filter(track => track.id !== trackId);
    setTracks(filteredTracks);
    markProjectAsModified();
  };
  
  // Manejar reordenación de pistas
  const handleReorderTracks = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;
    
    const tracksCopy = [...tracks];
    const [removed] = tracksCopy.splice(startIndex, 1);
    tracksCopy.splice(endIndex, 0, removed);
    
    setTracks(tracksCopy);
    markProjectAsModified();
  };
  
  // Función para convertir clips de timeline a pistas
  const convertClipsToTracks = (timelineClips: any[]): Track[] => {
    // Obtener IDs únicos de pistas de los clips
    const uniqueTrackIds = Array.from(new Set(
      timelineClips.map(clip => clip.trackId)
    ));
    
    // Crear una pista para cada ID único
    return uniqueTrackIds.map(trackId => {
      // Obtener el primer clip de esta pista para determinar su tipo
      const clipOfTrack = timelineClips.find(clip => clip.trackId === trackId);
      const trackType = clipOfTrack?.type || 'video';
      
      return {
        id: trackId,
        name: `Pista de ${trackType === 'video' ? 'video' : 
          trackType === 'audio' ? 'audio' : 
          trackType === 'image' ? 'imagen' : 'texto'} ${trackId.slice(-2)}`,
        type: trackType as TrackType,
        position: 0,
        visible: true,
        locked: false,
        muted: false,
        solo: false,
        color: trackType === 'video' ? '#FF5733' : trackType === 'audio' ? '#3498DB' : '#2ECC71',
        createdAt: new Date()
      };
    });
  };
  
  // Mapeamos las herramientas de la barra a los tabs disponibles
  const toolToTabMap: Record<string, string> = {
    'effects': 'effects',
    'audio': 'audio',
    'text': 'transcription',
    'transitions': 'effects',
    'stickers': 'effects',
    'templates': 'effects',
    'speed': 'effects',
    'volume': 'audio',
    'camera': 'effects',
    'cut': 'effects',
    'settings': 'effects',
  };

  // Función mejorada para manejar selección de herramienta y cambiar a la pestaña correspondiente
  const handleAdvancedToolSelect = (tool: string) => {
    setActiveTool(tool);
    
    // Verificar si la herramienta tiene una pestaña correspondiente
    const tabValue = toolToTabMap[tool] || 'effects';
    
    // Buscar el elemento Tabs y cambiar su valor
    const tabsElement = document.querySelector('[data-orientation="horizontal"]');
    if (tabsElement) {
      // Utilizar la API del componente Tabs para cambiar el valor
      const tabsList = document.querySelector('[role="tablist"]');
      if (tabsList) {
        const tabButton = tabsList.querySelector(`[data-value="${tabValue}"]`) as HTMLElement;
        if (tabButton) {
          tabButton.click();
        }
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Barra de herramientas superior - Estilo CapCut para móvil */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
          <span className="text-lg font-semibold mr-2 truncate text-white">{projectName}</span>
          {projectModified && <span className="text-xs text-orange-400">(Sin guardar)</span>}
        </div>
        
        {/* Controles centrales (Reproducción) - estilo CapCut */}
        <div className="flex items-center space-x-2 order-first sm:order-none mb-2 sm:mb-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => isPlaying ? handlePause() : handlePlay()}
            className="h-9 w-9 p-0 text-white hover:bg-zinc-800 rounded-full"
          >
            {isPlaying ? (
              <PauseCircle className="h-6 w-6" />
            ) : (
              <PlayCircle className="h-6 w-6" />
            )}
          </Button>
          
          <span className="text-sm text-zinc-300">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
            {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
          </span>
        </div>
        
        {/* Botones de acción - Estilo CapCut */}
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 w-full sm:w-auto">
          <Button variant="ghost" size="sm" onClick={handleSaveProject} className="flex-grow sm:flex-grow-0 bg-zinc-800 hover:bg-zinc-700">
            <Save className="h-4 w-4 mr-1 text-orange-400" /> <span className="sm:inline text-white">Guardar</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleImportProject} className="flex-grow sm:flex-grow-0 bg-zinc-800 hover:bg-zinc-700">
            <Upload className="h-4 w-4 mr-1 text-blue-400" /> <span className="sm:inline text-white">Importar</span>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleExportProject} className="flex-grow sm:flex-grow-0 bg-zinc-800 hover:bg-zinc-700">
            <Download className="h-4 w-4 mr-1 text-green-400" /> <span className="sm:inline text-white">Exportar</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex-grow sm:flex-grow-0 bg-zinc-800 hover:bg-zinc-700">
            <Share2 className="h-4 w-4 mr-1 text-purple-400" /> <span className="sm:inline text-white">Compartir</span>
          </Button>
        </div>
      </div>
      
      {/* Área principal del editor - Combinación de estilo Adobe Premiere con CapCut para móvil */}
      <div className="flex-1 flex md:flex-row flex-col overflow-hidden bg-zinc-900">
        {/* Barra de herramientas vertical (Adobe Premiere) - Solo visible en escritorio */}
        <div className="hidden md:flex flex-col h-full border-r border-zinc-800 bg-zinc-900">
          <Toolbar
            onToolSelect={handleAdvancedToolSelect}
            activeToolId={activeTool}
            orientation="vertical"
            position="left"
            showLabels={false}
            language={language || 'es'}
            isCollapsible={true}
          />
        </div>
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Barra de navegación móvil - Estilo CapCut (dock inferior en móvil) */}
          <div className="md:hidden flex justify-around p-2 border-t border-zinc-800 bg-black fixed bottom-0 left-0 right-0 z-50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center justify-center h-14 w-16 px-0 py-1 rounded-lg"
              onClick={() => document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Film className="h-5 w-5 text-white mb-1" /> 
              <span className="text-xs text-zinc-400">Video</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center justify-center h-14 w-16 px-0 py-1 rounded-lg"
              onClick={() => document.getElementById('timeline-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <FileAudio className="h-5 w-5 text-white mb-1" /> 
              <span className="text-xs text-zinc-400">Pistas</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center justify-center h-14 w-16 px-0 py-1 rounded-lg"
              onClick={() => document.getElementById('edit-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <SlidersHorizontal className="h-5 w-5 text-white mb-1" /> 
              <span className="text-xs text-zinc-400">Editar</span>
            </Button>
          </div>
        
          {/* Contenido principal con estilo Adobe Premiere */}
          <div className="flex-1 flex flex-row overflow-hidden">
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden pb-16 md:pb-0">
              {/* Panel de visualización (izquierda en desktop, arriba en móvil) - Estilo CapCut */}
              <div className="w-full md:w-3/5 p-2 sm:p-4 flex flex-col bg-black" id="preview-section">
                <div className="sticky top-0 z-10 bg-black pb-2">
                  <h2 className="text-lg font-medium mb-2 md:hidden text-white">Vista previa</h2>
                </div>
                
                {/* Barra de herramientas del editor de video */}
                <Toolbar 
                  activeToolId={activeTool}
                  onToolSelect={handleAdvancedToolSelect}
                />
                
                <VideoPreviewPanel
                  videoSrc={videoSrc}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  activeEffects={getActiveEffects()}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onToggleEffect={(effectId, enabled) => {
                    // En la definición original no existe 'enabled', así que usaremos
                    // 'intensity' como una forma de activar/desactivar un efecto
                    // Si enabled es false, ponemos intensity a 0, de lo contrario a 1
                    handleUpdateEffect(effectId, { intensity: enabled ? 1 : 0 });
                  }}
                />
                
                <div className="mt-4" id="timeline-section">
                  <div className="sticky top-0 z-10 bg-black pb-2">
                    <h2 className="text-lg font-medium mb-2 md:hidden text-white flex items-center">
                      <FileAudio className="h-5 w-5 text-blue-400 mr-2" />
                      Línea de tiempo
                    </h2>
                  </div>
                  
                  {/* Panel de pistas */}
                  <div className="mb-4 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                    <TrackListPanel 
                      tracks={tracks}
                      onAddTrack={handleAddTrack}
                      onDeleteTrack={handleDeleteTrack}
                      onToggleTrackVisibility={(trackId) => handleUpdateTrack(trackId, { visible: !tracks.find(t => t.id === trackId)?.visible })}
                      onToggleTrackLock={(trackId) => handleUpdateTrack(trackId, { locked: !tracks.find(t => t.id === trackId)?.locked })}
                      onToggleTrackMute={(trackId) => handleUpdateTrack(trackId, { muted: !tracks.find(t => t.id === trackId)?.muted })}
                      onRecordAudio={() => alert('Funcionalidad de grabación en desarrollo')}
                      onReorderTracks={(startIndex, endIndex) => {
                        const result = Array.from(tracks);
                        const [removed] = result.splice(startIndex, 1);
                        result.splice(endIndex, 0, removed);
                        setTracks(result);
                        markProjectAsModified();
                      }}
                      language="es"
                    />
                  </div>
                  
                  {/* Línea de tiempo */}
                  <div className="rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                    <ProfessionalTimeline
                      clips={clips}
                      currentTime={currentTime}
                      duration={duration}
                      onSeek={handleSeek}
                      onAddClip={handleAddClip}
                      onUpdateClip={(id, updates) => handleUpdateClip(id, updates)}
                      onDeleteClip={handleDeleteClip}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      isPlaying={isPlaying}
                    />
                  </div>
                </div>
              </div>
              
              {/* Panel de edición (derecha en desktop, abajo en móvil) - Estilo CapCut */}
              <div className="w-full md:w-2/5 border-t border-zinc-800 md:border-t-0 md:border-l p-2 sm:p-4 bg-black" id="edit-section">
                <div className="sticky top-0 z-10 bg-black pb-2">
                  <h2 className="text-lg font-medium mb-2 md:hidden text-white flex items-center">
                    <SlidersHorizontal className="h-5 w-5 text-orange-400 mr-2" />
                    Edición
                  </h2>
                </div>
                
                <Tabs defaultValue="effects" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 md:flex md:justify-start bg-zinc-900 p-1 rounded-xl">
                    <TabsTrigger 
                      value="effects" 
                      data-value="effects"
                      className="flex items-center justify-center data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg"
                    >
                      <SlidersHorizontal className="h-4 w-4 md:mr-1 text-orange-400" /> 
                      <span className="hidden md:inline ml-1">Efectos</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="audio" 
                      data-value="audio"
                      className="flex items-center justify-center data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg"
                    >
                      <Music className="h-4 w-4 md:mr-1 text-blue-400" />
                      <span className="hidden md:inline ml-1">Audio</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="beats" 
                      data-value="beats"
                      className="flex items-center justify-center data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg"
                    >
                      <Activity className="h-4 w-4 md:mr-1 text-green-400" />
                      <span className="hidden md:inline ml-1">Ritmo</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="transcription" 
                      data-value="transcription"
                      className="flex items-center justify-center data-[state=active]:bg-zinc-800 data-[state=active]:text-white rounded-lg"
                    >
                      <Type className="h-4 w-4 md:mr-1 text-purple-400" />
                      <span className="hidden md:inline ml-1">Texto</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Panel de Efectos */}
                  <TabsContent value="effects" className="mt-4">
                    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                      <EffectsPanel
                        effects={visualEffects}
                        currentTime={currentTime}
                        duration={duration}
                        onAddEffect={handleAddEffect}
                        onUpdateEffect={handleUpdateEffect}
                        onDeleteEffect={handleDeleteEffect}
                        onPreview={(effectId) => {
                          const effect = visualEffects.find(e => e.id === effectId);
                          if (effect) {
                            handleSeek(effect.startTime);
                          }
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* Panel de Audio */}
                  <TabsContent value="audio" className="mt-4">
                    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                      <AudioTrackEditor
                        tracks={audioTracks}
                        currentTime={currentTime}
                        duration={duration}
                        isPlaying={isPlaying}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeek={handleSeek}
                        onAddTrack={handleAddAudioTrack}
                        onRemoveTrack={handleRemoveAudioTrack}
                        onUpdateTrack={handleUpdateAudioTrack}
                        onImportAudio={() => alert('Importación de audio pendiente')}
                        onExportAudio={() => alert('Exportación de audio pendiente')}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* Panel de Análisis de Ritmo */}
                  <TabsContent value="beats" className="mt-4">
                    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                      <BeatAnalyzer
                        currentTime={currentTime}
                        duration={duration}
                        beats={beats}
                        sections={sections}
                        bpm={bpm}
                        timeSignature="4/4"
                        onSeek={handleSeek}
                        onUpdateBeats={handleUpdateBeats}
                        onUpdateSections={handleUpdateSections}
                        onAnalyze={handleAnalyzeBeats}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* Panel de Transcripción */}
                  <TabsContent value="transcription" className="mt-4">
                    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                      <TranscriptionPanel
                        transcriptions={transcriptions}
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={handleSeek}
                        onUpdateTranscriptions={(newTranscriptions) => {
                          setTranscriptions(newTranscriptions);
                          markProjectAsModified();
                        }}
                      />
                    </div>
                  </TabsContent>

                  {/* Panel de Corte - Mostrado cuando activeTool es 'cut' */}
                  {activeTool === 'cut' && (
                    <div className="mt-4">
                      <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                        <CutPanel
                          currentTime={currentTime}
                          duration={duration}
                          clips={clips}
                          onCut={(time) => {
                            // Implementar la lógica de corte
                            alert(`Corte en tiempo ${time.toFixed(2)}`);
                          }}
                          onRemove={(clipId) => handleDeleteClip(clipId)}
                          onSplit={(clipId, time) => {
                            // Implementar la lógica de división
                            alert(`Dividir clip ${clipId} en tiempo ${time.toFixed(2)}`);
                          }}
                          onTrim={(clipId, startTime, endTime) => {
                            // Actualizar los tiempos del clip
                            handleUpdateClip(clipId, { startTime, endTime });
                          }}
                          onSeek={handleSeek}
                        />
                      </div>
                    </div>
                  )}

                  {/* Panel de Transiciones - Mostrado cuando activeTool es 'transitions' */}
                  {activeTool === 'transitions' && (
                    <div className="mt-4">
                      <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                        <TransitionsPanel
                          transitions={[]} // Aquí pasarías las transiciones reales
                          clips={clips}
                          currentTime={currentTime}
                          duration={duration}
                          isPlaying={isPlaying}
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
                      </div>
                    </div>
                  )}

                  {/* Placeholder para herramientas no implementadas aún */}
                  {['stickers', 'templates', 'camera', 'speed', 'volume', 'settings'].includes(activeTool) && (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalEditor;