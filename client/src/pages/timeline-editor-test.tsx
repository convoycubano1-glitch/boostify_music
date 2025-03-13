/**
 * Página de prueba básica para el editor de línea de tiempo con vista previa de vídeo
 * Esta página está optimizada para probar el componente con la menor cantidad de dependencias
 */

import React, { useState } from 'react';
import { TimelineEditor, BeatMap } from '../components/music-video/timeline-editor';
import { TimelineClip } from '../components/timeline/TimelineClip';

/**
 * Página de prueba para el editor de línea de tiempo
 */
export default function TimelineEditorTest() {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // URL de audio y vídeo de prueba
  const testVideoUrl = "/src/images/videos/Standard_Mode_Generated_Video.mp4";
  
  // Duración en segundos 
  const testDuration = 30;
  
  // Clips iniciales muy básicos
  const basicClips: TimelineClip[] = [
    {
      id: 1,
      title: 'Audio',
      type: 'audio',
      layer: 0,
      start: 0,
      duration: testDuration,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 2,
      title: 'Video',
      type: 'video',
      layer: 1,
      start: 0,
      duration: 10,
      metadata: {
        isAIGenerated: false
      }
    }
  ];
  
  // Beat map básico para pruebas
  const basicBeatMap: BeatMap = {
    beats: [
      { time: 0, type: 'downbeat' },
      { time: 1, type: 'beat' },
      { time: 2, type: 'downbeat' },
      { time: 3, type: 'beat' },
      { time: 4, type: 'downbeat' }
    ],
    sections: [
      { name: 'Intro', startTime: 0, endTime: 10 },
      { name: 'Verso', startTime: 10, endTime: 20 }
    ],
    metadata: {
      bpm: 120,
      timeSignature: '4/4',
      key: 'C Major'
    }
  };
  
  // Funciones de manejo básicas
  const handleClipsChange = (clips: TimelineClip[]) => {
    console.log('Clips actualizados:', clips);
  };
  
  const handleTimeChange = (time: number) => {
    setCurrentTime(time);
  };
  
  const handlePlaybackStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };
  
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-primary text-white p-4">
        <h1 className="text-2xl font-bold">Prueba del Editor</h1>
        <p className="text-sm opacity-80">Estado: {isPlaying ? 'Reproduciendo' : 'Pausado'} - Tiempo: {Math.floor(currentTime)}s</p>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <TimelineEditor
          clips={basicClips}
          beatMap={basicBeatMap}
          audioUrl={testVideoUrl}
          videoUrl={testVideoUrl}
          duration={testDuration}
          onClipsChange={handleClipsChange}
          onTimeChange={handleTimeChange}
          onPlaybackStateChange={handlePlaybackStateChange}
          showBeatGrid={true}
          autoScroll={true}
        />
      </div>
    </div>
  );
}