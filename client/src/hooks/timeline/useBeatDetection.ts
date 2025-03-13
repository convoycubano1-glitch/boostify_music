import { useState, useEffect, useRef, useCallback } from 'react';
import { BEAT_DETECTION, WEBSOCKET_EVENTS } from '../../constants/timeline-constants';

interface BeatDetectionOptions {
  minAmplitude?: number;
  sensitivity?: number;
  minInterval?: number;
  onBeatDetected?: (time: number, amplitude: number) => void;
}

interface Beat {
  time: number;
  amplitude: number;
}

/**
 * Hook para detectar beats en un audio
 * Implementa algoritmo de detección de beats en tiempo real
 */
export function useBeatDetection(
  audioElement: HTMLAudioElement | null,
  options: BeatDetectionOptions = {}
) {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Referencias para el análisis
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastBeatTimeRef = useRef<number>(0);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Opciones de configuración con valores predeterminados
  const minAmplitude = options.minAmplitude || BEAT_DETECTION.MIN_AMPLITUDE;
  const sensitivity = options.sensitivity || BEAT_DETECTION.SENSITIVITY;
  const minInterval = options.minInterval || BEAT_DETECTION.MIN_INTERVAL;
  const onBeatDetected = options.onBeatDetected;

  // Método para iniciar el análisis de beats
  const startAnalysis = useCallback(() => {
    if (!audioElement || isAnalyzing) return;
    
    try {
      // Crear contexto de audio si no existe
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Crear nodo analizador
      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 1024;
        analyserRef.current.smoothingTimeConstant = 0.85;
      }
      
      // Crear nodo de fuente si no existe o reconectar si ya existe
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      sourceRef.current = audioContext.createMediaElementSource(audioElement);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContext.destination);
      
      // Crear array para datos de frecuencia
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      // Iniciar el análisis
      setIsAnalyzing(true);
      setBeats([]);
      lastBeatTimeRef.current = 0;
      
      // Iniciar el loop de análisis
      detectBeats();
      
      console.log("[Beat Detection] Análisis iniciado");
    } catch (error) {
      console.error("[Beat Detection] Error al iniciar análisis:", error);
      stopAnalysis();
    }
  }, [audioElement, isAnalyzing]);
  
  // Método para detener el análisis
  const stopAnalysis = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    // No desconectamos los nodos para evitar errores al reiniciar
    setIsAnalyzing(false);
    console.log("[Beat Detection] Análisis detenido");
  }, []);
  
  // Función recursiva para detectar beats
  const detectBeats = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current || !audioElement) {
      return;
    }
    
    rafIdRef.current = requestAnimationFrame(detectBeats);
    
    // Obtener datos de frecuencia
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calcular la amplitud promedio en el rango de frecuencias de bajo (20-150Hz)
    // que es donde generalmente se encuentran los beats
    const bassRange = { start: 2, end: 15 }; // Aproximadamente 20-150Hz en un FFT de 1024
    let bassSum = 0;
    
    for (let i = bassRange.start; i < bassRange.end; i++) {
      bassSum += dataArrayRef.current[i];
    }
    
    const bassAvg = bassSum / (bassRange.end - bassRange.start);
    const normalizedBassAvg = bassAvg / 255; // Normalizado entre 0 y 1
    
    // Actualizar el progreso del análisis
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration || 1;
    setProgress(Math.min(100, (currentTime / duration) * 100));
    
    // Detectar beat cuando supera el umbral y ha pasado el intervalo mínimo
    if (
      normalizedBassAvg > minAmplitude && 
      normalizedBassAvg > BEAT_DETECTION.MIN_AMPLITUDE * sensitivity &&
      currentTime - lastBeatTimeRef.current > minInterval
    ) {
      const newBeat = { time: currentTime, amplitude: normalizedBassAvg };
      
      setBeats(prevBeats => [...prevBeats, newBeat]);
      lastBeatTimeRef.current = currentTime;
      
      // Llamar al callback si existe
      if (onBeatDetected) {
        onBeatDetected(currentTime, normalizedBassAvg);
      }
      
      // Enviar evento para que otros componentes puedan reaccionar
      const beatEvent = new CustomEvent(WEBSOCKET_EVENTS.BEAT_DETECTED, {
        detail: { time: currentTime, amplitude: normalizedBassAvg }
      });
      window.dispatchEvent(beatEvent);
      
      console.log("[Beat Detection] Beat detectado en", currentTime.toFixed(2), "s, amplitud:", normalizedBassAvg.toFixed(2));
    }
  }, [minAmplitude, sensitivity, minInterval, onBeatDetected, audioElement]);
  
  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (error) {
          // Ignorar errores al desconectar
        }
      }
      
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (error) {
          // Ignorar errores al desconectar
        }
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          // Ignorar errores al cerrar
        }
      }
    };
  }, []);
  
  // Método para exportar los beats detectados
  const exportBeats = useCallback(() => {
    return {
      beats,
      metadata: {
        totalBeats: beats.length,
        averageAmplitude: beats.reduce((sum, b) => sum + b.amplitude, 0) / (beats.length || 1),
        beatInterval: beats.length > 1 
          ? (beats[beats.length - 1].time - beats[0].time) / (beats.length - 1) 
          : 0
      }
    };
  }, [beats]);
  
  return {
    beats,
    isAnalyzing,
    progress,
    startAnalysis,
    stopAnalysis,
    exportBeats
  };
}