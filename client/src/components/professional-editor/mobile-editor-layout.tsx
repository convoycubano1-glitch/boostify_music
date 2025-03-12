import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  X,
  Film, 
  Clock, 
  Settings,
  Layers,
  Music,
  SlidersHorizontal,
  Type,
  FileAudio
} from 'lucide-react';

import VideoPreviewPanel from './video-preview-panel';
import ProfessionalTimeline from './fixed-timeline';
import TrackListPanel from './track-list-panel';
import EffectsPanel from './effects-panel';
import CutPanel from './cut-panel';
import TransitionsPanel from './transitions-panel';
import AudioTrackEditor from './audio-track-editor';
import TranscriptionPanel from './transcription-panel';

/**
 * Componente de Layout de Editor para Dispositivos Móviles
 * Proporciona una experiencia optimizada para dispositivos móviles
 * basada en el estilo de CapCut
 */

interface MobileEditorLayoutProps {
  // Propiedades de visibilidad
  visiblePanels: {[key: string]: boolean};
  togglePanelVisibility: (panelId: string) => void;
  
  // Propiedades de video
  videoSrc: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  
  // Propiedades de timeline
  clips: any[];
  updateClips: (clips: any[]) => void;
  markModified: () => void;
  
  // Propiedades de track list
  tracks: any[];
  
  // Propiedades de efectos
  effects: any[];
  onAddEffect: (effect: any) => void;
  onUpdateEffect: (effectId: string, updates: any) => void;
  onDeleteEffect: (effectId: string) => void;
  
  // Propiedades de audio
  audioTracks: any[];
  updateAudioTracks: (tracks: any[]) => void;
  
  // Propiedades de transcripción
  transcriptions: any[];
  updateTranscriptions: (transcriptions: any[]) => void;
}

const MobileEditorLayout: React.FC<MobileEditorLayoutProps> = ({
  visiblePanels,
  togglePanelVisibility,
  videoSrc,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  clips,
  updateClips,
  markModified,
  tracks,
  effects,
  onAddEffect,
  onUpdateEffect,
  onDeleteEffect,
  audioTracks,
  updateAudioTracks,
  transcriptions,
  updateTranscriptions
}) => {
  // Estado para manejar el desplazamiento suave
  const [activeSection, setActiveSection] = useState<string>('preview');
  
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(`${sectionId}-section`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  
  return (
    <div className="flex flex-col w-full h-full overflow-auto bg-zinc-950">
      {/* Panel de control inferior fijo (estilo CapCut) */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-zinc-900 border-t border-zinc-800 flex justify-around items-center z-10">
        <Button 
          variant="ghost" 
          className={`flex flex-col text-xs p-1 ${activeSection === 'preview' ? 'text-primary' : 'text-zinc-400'}`}
          onClick={() => handleSectionChange('preview')}
        >
          <Film className="h-4 w-4 mb-1" />
          <span>Vista</span>
        </Button>
        <Button 
          variant="ghost"
          className={`flex flex-col text-xs p-1 ${activeSection === 'timeline' ? 'text-primary' : 'text-zinc-400'}`}
          onClick={() => handleSectionChange('timeline')}
        >
          <Clock className="h-4 w-4 mb-1" />
          <span>Tiempo</span>
        </Button>
        <Button 
          variant="ghost"
          className={`flex flex-col text-xs p-1 ${activeSection === 'edit' ? 'text-primary' : 'text-zinc-400'}`}
          onClick={() => handleSectionChange('edit')}
        >
          <SlidersHorizontal className="h-4 w-4 mb-1" />
          <span>Editar</span>
        </Button>
      </div>
      
      {/* Contenido principal con padding-bottom para evitar que quede oculto por la barra fija */}
      <div className="pb-16">
        {/* Sección de Vista Previa */}
        {visiblePanels.preview && (
          <div id="preview-section" className="border-b border-zinc-800 min-h-[250px]">
            <div className="p-2 bg-zinc-900 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-200">Vista previa</h3>
              <Button variant="ghost" size="icon" onClick={() => togglePanelVisibility('preview')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-full p-4">
              <VideoPreviewPanel 
                videoSrc={videoSrc}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onPlay={onPlay}
                onPause={onPause}
                onSeek={onSeek}
              />
            </div>
          </div>
        )}
        
        {/* Sección de Línea de Tiempo */}
        {visiblePanels.timeline && (
          <div id="timeline-section" className="border-b border-zinc-800 min-h-[180px]">
            <div className="p-2 bg-zinc-900 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-200">Línea de tiempo</h3>
              <Button variant="ghost" size="icon" onClick={() => togglePanelVisibility('timeline')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-full p-2">
              <ProfessionalTimeline 
                clips={clips}
                currentTime={currentTime}
                duration={duration}
                onSeek={onSeek}
                updateClips={updateClips}
                markModified={markModified}
              />
            </div>
            <div className="bg-zinc-900 p-2 border-t border-zinc-800">
              <TrackListPanel tracks={tracks} />
            </div>
          </div>
        )}
        
        {/* Sección de Edición */}
        {visiblePanels.edit && (
          <div id="edit-section" className="min-h-[300px]">
            <div className="p-2 bg-zinc-900 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-200">Edición</h3>
              <Button variant="ghost" size="icon" onClick={() => togglePanelVisibility('edit')}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Tabs defaultValue="cut" className="w-full">
              <TabsList className="grid grid-cols-5 mx-2 mt-2">
                <TabsTrigger value="cut">Cortar</TabsTrigger>
                <TabsTrigger value="transitions">Trans.</TabsTrigger>
                <TabsTrigger value="effects">Efectos</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="text">Texto</TabsTrigger>
              </TabsList>
              <TabsContent value="cut" className="p-2">
                <CutPanel />
              </TabsContent>
              <TabsContent value="transitions" className="p-2">
                <TransitionsPanel />
              </TabsContent>
              <TabsContent value="effects" className="p-2">
                <EffectsPanel 
                  effects={effects}
                  onAddEffect={onAddEffect}
                  onUpdateEffect={onUpdateEffect}
                  onDeleteEffect={onDeleteEffect}
                />
              </TabsContent>
              <TabsContent value="audio" className="p-2">
                <AudioTrackEditor
                  audioTracks={audioTracks}
                  updateAudioTracks={updateAudioTracks}
                />
              </TabsContent>
              <TabsContent value="text" className="p-2">
                <TranscriptionPanel
                  transcriptions={transcriptions}
                  updateTranscriptions={updateTranscriptions}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileEditorLayout;