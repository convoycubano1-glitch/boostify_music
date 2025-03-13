import { useState, useEffect, useRef, useCallback } from 'react';

// Definir interfaces para datos de forma de onda
export interface WaveformData {
  min: number;
  max: number;
}

interface UseWaveSurferProps {
  audioUrl?: string;
  onReady?: () => void;
  onTimeUpdate?: (time: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
}

interface UseWaveSurferResult {
  waveformContainerRef: React.RefObject<HTMLDivElement>;
  waveformData: WaveformData[];
  duration: number;
  isReady: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  isPlaying: boolean;
}

/**
 * Hook para gestionar visualización y control de forma de onda de audio
 * 
 * Este hook maneja:
 * - Carga y renderizado de la forma de onda con WaveSurfer.js
 * - Funciones de control de reproducción (play, pause, seek)
 * - Exporta datos para renderizado de forma de onda de respaldo en caso de fallo
 */
export function useWaveSurfer({
  audioUrl,
  onReady,
  onTimeUpdate,
  onPlayPause
}: UseWaveSurferProps): UseWaveSurferResult {
  // Referencias
  const wavesurferRef = useRef<any>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  
  // Estados
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(10); // Duración predeterminada
  const [waveformData, setWaveformData] = useState<WaveformData[]>([]);
  
  // Inicializar WaveSurfer al cargar
  useEffect(() => {
    // Importación dinámica para evitar problemas de SSR
    let wavesurferInstance: any = null;
    
    const initWaveSurfer = async () => {
      try {
        // Solo cargamos WaveSurfer si tenemos una URL de audio
        if (!audioUrl || !waveformContainerRef.current) {
          return;
        }
        
        // Importación dinámica para evitar problemas con SSR
        const WaveSurfer = (await import('wavesurfer.js')).default;
        
        // Crear instancia de WaveSurfer
        wavesurferInstance = WaveSurfer.create({
          container: waveformContainerRef.current,
          waveColor: 'rgba(249, 115, 22, 0.4)',
          progressColor: 'rgba(249, 115, 22, 0.8)',
          cursorColor: 'rgba(249, 115, 22, 1.0)',
          barWidth: 2,
          barRadius: 2,
          barGap: 1,
          height: 80,
          responsive: true
        });
        
        // Cargar audio
        wavesurferInstance.load(audioUrl);
        
        // Eventos
        wavesurferInstance.on('ready', () => {
          setIsReady(true);
          setDuration(wavesurferInstance.getDuration());
          
          // Extraer datos de la forma de onda para renderizado alternativo
          const rawData = wavesurferInstance.exportPeaks();
          const channelData = rawData[0] || [];
          
          // Convertir a formato min/max para mejor visualización
          const sampleRate = 50; // Reducir resolución para mejor rendimiento
          const waveData: WaveformData[] = [];
          
          for (let i = 0; i < channelData.length; i += sampleRate) {
            const chunk = channelData.slice(i, i + sampleRate);
            if (chunk.length > 0) {
              waveData.push({
                min: Math.min(...chunk),
                max: Math.max(...chunk)
              });
            }
          }
          
          setWaveformData(waveData);
          onReady?.();
        });
        
        wavesurferInstance.on('audioprocess', () => {
          onTimeUpdate?.(wavesurferInstance.getCurrentTime());
        });
        
        wavesurferInstance.on('seek', () => {
          onTimeUpdate?.(wavesurferInstance.getCurrentTime());
        });
        
        wavesurferInstance.on('play', () => {
          setIsPlaying(true);
          onPlayPause?.(true);
        });
        
        wavesurferInstance.on('pause', () => {
          setIsPlaying(false);
          onPlayPause?.(false);
        });
        
        // Guardar referencia
        wavesurferRef.current = wavesurferInstance;
      } catch (error) {
        console.error('Error initializing WaveSurfer:', error);
        
        // Generar datos de forma de onda sintéticos como fallback
        const fallbackWaveData: WaveformData[] = [];
        for (let i = 0; i < 100; i++) {
          fallbackWaveData.push({
            min: -0.3 - Math.random() * 0.2,
            max: 0.3 + Math.random() * 0.2
          });
        }
        
        setWaveformData(fallbackWaveData);
      }
    };
    
    initWaveSurfer();
    
    // Limpieza
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioUrl, onReady, onTimeUpdate, onPlayPause]);
  
  // Funciones de control
  const play = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.play();
    }
  }, []);
  
  const pause = useCallback(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.pause();
    }
  }, []);
  
  const seekTo = useCallback((time: number) => {
    if (wavesurferRef.current) {
      // Asegurar que el tiempo esté dentro del rango válido
      const validTime = Math.max(0, Math.min(time, duration));
      
      // Convertir a porcentaje (WaveSurfer usa 0-1)
      const seekPosition = validTime / duration;
      wavesurferRef.current.seekTo(seekPosition);
      
      // Actualizar callback manualmente para actualizaciones inmediatas
      onTimeUpdate?.(validTime);
    }
  }, [duration, onTimeUpdate]);
  
  return {
    waveformContainerRef,
    waveformData,
    duration,
    isReady,
    play,
    pause,
    seekTo,
    isPlaying
  };
}