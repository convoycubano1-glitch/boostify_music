import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import MobileAdapter from './mobile-adapter';
import VideoPreviewPanel from './video-preview-panel';
import ProfessionalTimeline from './fixed-timeline';
import EffectsPanel from './effects-panel';
import AudioTrackEditor from './audio-track-editor';
import TranscriptionPanel from './transcription-panel';
import CutPanel from './cut-panel';
import TransitionsPanel from './transitions-panel';
import { Track, VisualEffect, Beat, Section, Clip, Transcription } from '../../lib/professional-editor-types';

// Interfaz para las propiedades del componente
interface MobileEditorLayoutProps {
  visiblePanels: {[key: string]: boolean};
  togglePanelVisibility: (panelId: string) => void;
  videoSrc: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  clips: Clip[];
  effects: VisualEffect[];
  updateClips: (clips: Clip[]) => void;
  markModified: () => void;
  tracks: Track[];
  onAddEffect: (effect: Omit<VisualEffect, 'id'>) => void;
  onUpdateEffect: (effectId: string, updates: Partial<VisualEffect>) => void;
  onDeleteEffect: (effectId: string) => void;
  audioTracks: any[];
  updateAudioTracks: (tracks: any[]) => void;
  transcriptions: Transcription[];
  updateTranscriptions: (transcriptions: Transcription[]) => void;
}

/**
 * Componente especializado para el layout móvil del editor profesional
 * Organiza los paneles en un formato vertical optimizado para dispositivos móviles
 */
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
  return (
    <div className="flex flex-col w-full h-full">
      {/* Panel de Vista Previa */}
      <MobileAdapter
        id="preview-section"
        title="Vista previa"
        isVisible={visiblePanels.preview}
        onToggle={() => togglePanelVisibility('preview')}
        minHeight="200px"
        className="md:min-h-[300px]"
      >
        <VideoPreviewPanel
          videoSrc={videoSrc}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlay={onPlay}
          onPause={onPause}
          onSeek={onSeek}
        />
      </MobileAdapter>
      
      {/* Panel de Línea de Tiempo */}
      <MobileAdapter
        id="timeline-section"
        title="Línea de tiempo"
        isVisible={visiblePanels.timeline}
        onToggle={() => togglePanelVisibility('timeline')}
        minHeight="150px"
      >
        <ProfessionalTimeline
          clips={clips}
          currentTime={currentTime}
          duration={duration}
          onSeek={onSeek}
          updateClips={updateClips}
          markModified={markModified}
        />
      </MobileAdapter>
      
      {/* Panel de Edición con Pestañas */}
      <MobileAdapter
        id="edit-section"
        title="Edición"
        isVisible={visiblePanels.edit}
        onToggle={() => togglePanelVisibility('edit')}
        minHeight="200px"
        fullHeight={true}
      >
        <Tabs defaultValue="cut" className="w-full h-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="cut">Cortar</TabsTrigger>
            <TabsTrigger value="transitions">Transiciones</TabsTrigger>
            <TabsTrigger value="effects">Efectos</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="text">Texto</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cut" className="h-[calc(100%-48px)] overflow-auto">
            <CutPanel />
          </TabsContent>
          
          <TabsContent value="transitions" className="h-[calc(100%-48px)] overflow-auto">
            <TransitionsPanel />
          </TabsContent>
          
          <TabsContent value="effects" className="h-[calc(100%-48px)] overflow-auto">
            <EffectsPanel 
              effects={effects}
              onAddEffect={onAddEffect}
              onUpdateEffect={onUpdateEffect}
              onDeleteEffect={onDeleteEffect}
            />
          </TabsContent>
          
          <TabsContent value="audio" className="h-[calc(100%-48px)] overflow-auto">
            <AudioTrackEditor
              audioTracks={audioTracks}
              updateAudioTracks={updateAudioTracks}
            />
          </TabsContent>
          
          <TabsContent value="text" className="h-[calc(100%-48px)] overflow-auto">
            <TranscriptionPanel
              transcriptions={transcriptions}
              updateTranscriptions={updateTranscriptions}
            />
          </TabsContent>
        </Tabs>
      </MobileAdapter>
    </div>
  );
};

export default MobileEditorLayout;