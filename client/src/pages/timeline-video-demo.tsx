/**
 * Página para demostrar el editor de línea de tiempo con vista previa de vídeo
 * Esta página muestra el editor con un video sincronizado
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { TimelineEditor, BeatMap } from '../components/music-video/timeline-editor';
import { TimelineClip } from '../components/timeline/TimelineClip';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { LayerType } from '../constants/timeline-constants';

/**
 * Página de demostración del editor con vista previa de vídeo
 */
export default function TimelineVideoDemo() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // URL de audio y vídeo de ejemplo
  const demoAudioUrl = "/assets/Standard_Mode_Generated_Video%20(9).mp4";
  const demoVideoUrl = "/assets/Standard_Mode_Generated_Video%20(9).mp4";
  
  // Duración en segundos para el demo
  const demoDuration = 30;
  
  // Ejemplo de clips iniciales
  const initialClips: TimelineClip[] = [
    {
      id: 1,
      title: 'Audio Principal',
      type: 'audio',
      layer: 0, // Capa de audio
      start: 0,
      duration: demoDuration,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 2,
      title: 'Intro',
      type: 'video',
      layer: 1, // Capa de video
      start: 0,
      duration: 5,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 3,
      title: 'Texto',
      type: 'text',
      layer: 2, // Capa de texto
      start: 2,
      duration: 3,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 4,
      title: 'Efecto',
      type: 'effect',
      layer: 3, // Capa de efectos
      start: 1.5,
      duration: 4,
      metadata: {
        isAIGenerated: false
      }
    }
  ];
  
  // Mapa de beats para sincronización (ejemplo simple)
  const beatMap: BeatMap = {
    beats: [
      { time: 0, type: 'downbeat' },
      { time: 0.5, type: 'beat' },
      { time: 1.0, type: 'downbeat' },
      { time: 1.5, type: 'beat' },
      { time: 2.0, type: 'downbeat' },
      { time: 2.5, type: 'beat' },
      { time: 3.0, type: 'downbeat' },
      { time: 3.5, type: 'beat' },
      { time: 4.0, type: 'downbeat' }
      // Más beats...
    ],
    sections: [
      { name: 'Intro', startTime: 0, endTime: 8 },
      { name: 'Verso', startTime: 8, endTime: 16 },
      { name: 'Coro', startTime: 16, endTime: 24 },
      { name: 'Outro', startTime: 24, endTime: 30 }
    ],
    metadata: {
      bpm: 120,
      timeSignature: '4/4',
      key: 'C Major'
    }
  };
  
  // Funciones para gestionar eventos del timeline
  const handleClipsChange = (clips: TimelineClip[]) => {
    console.log('Clips actualizados:', clips);
  };
  
  const handleTimeChange = (time: number) => {
    setCurrentTime(time);
  };
  
  const handlePlaybackStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };
  
  const handleSaveProject = () => {
    toast({
      title: 'Proyecto guardado',
      description: 'Tu proyecto ha sido guardado correctamente.',
    });
  };
  
  const handleExportProject = () => {
    toast({
      title: 'Proyecto exportado',
      description: 'Tu proyecto ha sido exportado correctamente.',
    });
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Helmet>
        <title>Editor de Línea de Tiempo con Vídeo</title>
      </Helmet>
      
      {/* Encabezado */}
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Editor con Vista Previa de Vídeo</h1>
          <p className="text-sm opacity-80 mt-1">
            Demostración de sincronización entre audio, video y timeline
          </p>
        </div>
      </header>
      
      {/* Barra de herramientas */}
      <div className="bg-gray-100 p-3 border-b">
        <div className="container mx-auto flex justify-between items-center">
          <div className="project-info">
            <span className="text-sm font-medium">Proyecto Demo</span>
            <span className="text-xs text-gray-500 ml-2">
              {isPlaying ? 'Reproduciendo' : 'Pausado'} - {Math.floor(currentTime)}s
            </span>
          </div>
          
          <div className="project-controls flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProject}
            >
              Guardar Proyecto
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportProject}
            >
              Exportar Video
            </Button>
          </div>
        </div>
      </div>
      
      {/* Editor de línea de tiempo */}
      <div className="flex-1 overflow-hidden">
        <TimelineEditor
          clips={initialClips}
          beatMap={beatMap}
          audioUrl={demoAudioUrl}
          videoUrl={demoVideoUrl}
          duration={demoDuration}
          onClipsChange={handleClipsChange}
          onTimeChange={handleTimeChange}
          onPlaybackStateChange={handlePlaybackStateChange}
          showBeatGrid={true}
          autoScroll={true}
        />
      </div>
      
      {/* Pie de página */}
      <footer className="bg-gray-100 p-3 border-t text-center text-sm text-gray-500">
        <div className="container mx-auto">
          © {new Date().getFullYear()} Editor de Línea de Tiempo Profesional | Todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}