import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
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
  // Solo usar iconos que existen en lucide-react
  // Waveform,
  // Settings
} from 'lucide-react';

// Importar componentes del editor
import BeatAnalyzer from '@/components/professional-editor/beat-analyzer';
import EffectsPanel from '@/components/professional-editor/effects-panel';
import VideoPreviewPanel from '@/components/professional-editor/video-preview-panel';
import ProfessionalTimeline from '@/components/professional-editor/professional-timeline';
import TranscriptionPanel from '@/components/professional-editor/transcription-panel';
import AudioTrackEditor from '@/components/professional-editor/audio-track-editor';

// Importar tipos desde professional-editor-types
import { 
  VisualEffect, 
  AudioTrack, 
  Beat, 
  Section, 
  Clip, 
  Transcription, 
  TimelineClip, 
  EditorStateUtils 
} from '@/lib/professional-editor-types';

const ProfessionalEditor: React.FC = () => {
  // Estado del reproductor de video
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(120); // 2 minutos por defecto

  // Estado de los datos del proyecto
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [projectName, setProjectName] = useState<string>('Nuevo Proyecto');
  const [projectModified, setProjectModified] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(120);

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

  // Importar/exportar proyecto
  const handleImportProject = () => {
    // Implementación pendiente
    alert('Funcionalidad de importación pendiente');
  };

  const handleExportProject = () => {
    // Implementación pendiente
    alert('Funcionalidad de exportación pendiente');
  };

  const handleSaveProject = () => {
    // Implementación pendiente
    alert('Proyecto guardado correctamente');
    setProjectModified(false);
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Barra de herramientas superior - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-2 border-b bg-background">
        <div className="flex items-center w-full sm:w-auto mb-2 sm:mb-0">
          <span className="text-lg font-semibold mr-2 truncate">{projectName}</span>
          {projectModified && <span className="text-xs text-gray-500">(Sin guardar)</span>}
        </div>
        
        {/* Controles centrales (Reproducción) - visible en todos los dispositivos */}
        <div className="flex items-center space-x-2 order-first sm:order-none mb-2 sm:mb-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => isPlaying ? handlePause() : handlePlay()}
            className="h-9 w-9 p-0"
          >
            {isPlaying ? (
              <PauseCircle className="h-5 w-5" />
            ) : (
              <PlayCircle className="h-5 w-5" />
            )}
          </Button>
          
          <span className="text-sm">
            {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / 
            {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
          </span>
        </div>
        
        {/* Botones de acción - Se reorganizan en móvil */}
        <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleSaveProject} className="flex-grow sm:flex-grow-0">
            <Save className="h-4 w-4 mr-1" /> <span className="sm:inline">Guardar</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleImportProject} className="flex-grow sm:flex-grow-0">
            <Upload className="h-4 w-4 mr-1" /> <span className="sm:inline">Importar</span>
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportProject} className="flex-grow sm:flex-grow-0">
            <Download className="h-4 w-4 mr-1" /> <span className="sm:inline">Exportar</span>
          </Button>
          
          <Button variant="outline" size="sm" className="flex-grow sm:flex-grow-0">
            <Share2 className="h-4 w-4 mr-1" /> <span className="sm:inline">Compartir</span>
          </Button>
        </div>
      </div>
      
      {/* Área principal del editor - Responsive */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Barra de navegación móvil - Solo visible en dispositivos pequeños */}
        <div className="md:hidden flex justify-center p-2 border-b">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mx-1"
            onClick={() => document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Film className="h-4 w-4 mr-1" /> 
            <span>Video</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mx-1"
            onClick={() => document.getElementById('timeline-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <FileAudio className="h-4 w-4 mr-1" /> 
            <span>Timeline</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mx-1"
            onClick={() => document.getElementById('edit-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" /> 
            <span>Editar</span>
          </Button>
        </div>
        
        {/* Contenido principal que se convierte en desplazable verticalmente en móvil */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* Panel de visualización (izquierda en desktop, arriba en móvil) */}
          <div className="w-full md:w-3/5 p-2 sm:p-4 flex flex-col" id="preview-section">
            <div className="sticky top-0 z-10 bg-background pb-2">
              <h2 className="text-lg font-medium mb-2 md:hidden">Vista previa</h2>
            </div>
            
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
              <div className="sticky top-0 z-10 bg-background pb-2">
                <h2 className="text-lg font-medium mb-2 md:hidden">Línea de tiempo</h2>
              </div>
              
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
          
          {/* Panel de edición (derecha en desktop, abajo en móvil) */}
          <div className="w-full md:w-2/5 border-t md:border-t-0 md:border-l p-2 sm:p-4" id="edit-section">
            <div className="sticky top-0 z-10 bg-background pb-2">
              <h2 className="text-lg font-medium mb-2 md:hidden">Edición</h2>
            </div>
            
            <Tabs defaultValue="effects">
              <TabsList className="w-full grid grid-cols-4 md:flex md:justify-start">
                <TabsTrigger value="effects" className="flex items-center justify-center">
                  <SlidersHorizontal className="h-4 w-4 md:mr-1" /> 
                  <span className="hidden md:inline ml-1">Efectos</span>
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center justify-center">
                  <Music className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline ml-1">Audio</span>
                </TabsTrigger>
                <TabsTrigger value="beats" className="flex items-center justify-center">
                  <Activity className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline ml-1">Ritmo</span>
                </TabsTrigger>
                <TabsTrigger value="transcription" className="flex items-center justify-center">
                  <Type className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline ml-1">Texto</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="effects" className="mt-4">
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
              </TabsContent>
              
              <TabsContent value="audio" className="mt-4">
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
              </TabsContent>
              
              <TabsContent value="beats" className="mt-4">
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
              </TabsContent>
              
              <TabsContent value="transcription" className="mt-4">
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalEditor;