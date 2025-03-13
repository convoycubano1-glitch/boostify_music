import { useRef, useEffect, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { 
  WAVEFORM_HEIGHT, 
  WAVEFORM_PRIMARY_COLOR, 
  WAVEFORM_PROGRESS_COLOR,
  WAVEFORM_SAMPLES
} from '../../constants/timeline-constants';

// WaveSurfer extended interface para manejar métodos faltantes en las definiciones de tipo
interface ExtendedWaveSurfer extends WaveSurfer {
  loadDecodedBuffer?: (buffer: AudioBuffer) => void;
}

export interface WaveformData {
  max: number;
  min: number;
}

interface UseWaveSurferOptions {
  audioBuffer?: AudioBuffer;
  duration: number;
  onTimeUpdate: (time: number) => void;
}

interface UseWaveSurferResult {
  wavesurferRef: React.RefObject<ExtendedWaveSurfer | null>;
  waveformContainerRef: React.RefObject<HTMLDivElement>;
  waveformData: WaveformData[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook personalizado para manejar la inicialización y gestión de WaveSurfer
 */
export function useWaveSurfer({ 
  audioBuffer, 
  duration,
  onTimeUpdate
}: UseWaveSurferOptions): UseWaveSurferResult {
  const wavesurferRef = useRef<ExtendedWaveSurfer | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<WaveformData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Función para convertir AudioBuffer a WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    // Función auxiliar para escribir un string en un array (WAV format)
    const writeString = (view: DataView, offset: number, string: string): void => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // Calculamos el tamaño del archivo WAV
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new ArrayBuffer(length);
    const view = new DataView(out);

    // Cabecera RIFF
    writeString(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(view, 8, 'WAVE');

    // Cabecera FMT
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numOfChan, true); // canales
    view.setUint32(24, buffer.sampleRate, true); // sample rate
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true); // byte rate
    view.setUint16(32, numOfChan * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // Data chunk header
    writeString(view, 36, 'data');
    view.setUint32(40, length - 44, true);

    // Escribir los datos de audio
    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array): void => {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    };

    // Copiar los datos de audio
    let offset = 44;
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      floatTo16BitPCM(view, offset, buffer.getChannelData(i));
      offset += buffer.length * 2;
    }

    return out;
  };

  // Generar datos de forma de onda para visualización de audio mejorada
  useEffect(() => {
    // Verificación robusta de requisitos previos
    if (!audioBuffer || !waveformContainerRef.current || audioBuffer.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Limpiar instancia anterior de WaveSurfer si existe con manejo de errores mejorado
    if (wavesurferRef.current) {
      try {
        // Verificamos si la instancia actual está lista antes de intentar destruirla
        const currentInstance = wavesurferRef.current;
        
        // Primero desregistramos todos los event listeners para evitar fugas de memoria
        if (typeof currentInstance.unAll === 'function') {
          currentInstance.unAll();
        }
        
        // Usamos un pequeño timeout para asegurar que cualquier operación pendiente se complete
        setTimeout(() => {
          try {
            // Verificamos de nuevo que la instancia exista antes de destruirla
            if (currentInstance && typeof currentInstance.destroy === 'function') {
              currentInstance.destroy();
            }
          } catch (destroyErr) {
            console.warn("Error al destruir WaveSurfer:", destroyErr);
          }
        }, 0);
      } catch (err) {
        console.warn("Error al limpiar instancia WaveSurfer previa:", err);
      }
      
      // Marcamos la referencia como null inmediatamente para evitar accesos adicionales
      wavesurferRef.current = null;
    }
    
    // Crear nueva instancia de WaveSurfer con estilo mejorado
    try {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformContainerRef.current,
        waveColor: WAVEFORM_PRIMARY_COLOR,
        progressColor: WAVEFORM_PROGRESS_COLOR,
        cursorColor: 'transparent', // Ocultamos el cursor nativo ya que tenemos el nuestro
        barWidth: 2,
        barRadius: 3,
        barGap: 2,
        height: WAVEFORM_HEIGHT,
        normalize: true,
        barHeight: 0.8, // Altura variable para efecto profesional
        backend: 'WebAudio',
        fillParent: true,
        hideScrollbar: true,
      });
    } catch (err) {
      console.error("Error al crear WaveSurfer:", err);
      setError("Error al inicializar el visualizador de audio");
      setIsLoading(false);
      return;
    }
    
    // Crear un AudioContext y cargar el buffer en WaveSurfer
    try {
      // Método para cargar buffer en WaveSurfer (versión 6+)
      if (typeof wavesurferRef.current.loadDecodedBuffer === 'function') {
        wavesurferRef.current.loadDecodedBuffer(audioBuffer);
      } else {
        // Método alternativo para versiones anteriores
        wavesurferRef.current.load(URL.createObjectURL(new Blob(
          [audioBufferToWav(audioBuffer)], 
          { type: 'audio/wav' }
        )));
      }
    } catch (error) {
      console.error("Error al cargar audio en WaveSurfer:", error);
      setError("Error al cargar el audio en el visualizador");
      setIsLoading(false);
      return;
    }
    
    // Eventos para WaveSurfer
    wavesurferRef.current.on('ready', () => {
      setIsLoading(false);
    });
    
    wavesurferRef.current.on('seeking', (position: number) => {
      const seekTime = position * duration;
      onTimeUpdate(seekTime);
    });
    
    // Generar también los datos de miniatura para los clips
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / WAVEFORM_SAMPLES);
    const waveform = [];

    for (let i = 0; i < WAVEFORM_SAMPLES; i++) {
      const start = i * blockSize;
      let max = 0;
      let min = 0;

      for (let j = 0; j < blockSize; j++) {
        const value = channelData[start + j];
        max = Math.max(max, value);
        min = Math.min(min, value);
      }

      waveform.push({ max, min });
    }

    setWaveformData(waveform);
    
    // Limpieza al desmontar con manejo de errores seguro
    return () => {
      try {
        if (wavesurferRef.current) {
          // Guardamos una referencia local para evitar problemas de ciclo de vida
          const currentInstance = wavesurferRef.current;
          
          // Verificamos que los métodos estén disponibles antes de llamarlos
          if (typeof currentInstance.unAll === 'function') {
            currentInstance.unAll();
          }
          
          // Usamos un timeout para asegurar que cualquier operación pendiente se complete
          setTimeout(() => {
            try {
              if (currentInstance && typeof currentInstance.destroy === 'function') {
                currentInstance.destroy();
              }
            } catch (destroyErr) {
              console.warn("Error en cleanup de WaveSurfer:", destroyErr);
            }
          }, 0);
          
          // Marcamos la referencia como null inmediatamente
          wavesurferRef.current = null;
        }
      } catch (err) {
        console.warn("Error en limpieza segura de WaveSurfer:", err);
      }
    };
  }, [audioBuffer, duration, onTimeUpdate]);

  return {
    wavesurferRef,
    waveformContainerRef,
    waveformData,
    isLoading,
    error
  };
}