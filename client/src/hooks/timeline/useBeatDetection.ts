import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_BPM, MIN_BPM, MAX_BPM } from '../../constants/timeline-constants';

export interface BeatMap {
  /**
   * Posiciones temporales de los beats en segundos
   */
  positions: number[];
  
  /**
   * BPM (beats por minuto) detectados o establecidos
   */
  bpm: number;
  
  /**
   * Intensidad relativa de cada beat (0.0 - 1.0)
   * Si no se proporciona análisis de intensidad, todos los beats tendrán 1.0
   */
  intensities?: number[];
  
  /**
   * Tipo de beat (1: beat normal, 2: downbeat/acento, 3: sección)
   * Si no se proporciona análisis de tipo, todos los beats serán tipo 1
   */
  types?: number[];
  
  /**
   * Metadatos adicionales del análisis
   */
  metadata: {
    /**
     * Método utilizado para detectar los beats
     */
    method: 'detected' | 'manual' | 'bpm' | 'imported';
    
    /**
     * Nivel de confianza de la detección (0.0 - 1.0)
     */
    confidence?: number;
    
    /**
     * Tempo estimado en BPM
     */
    tempo?: number;
    
    /**
     * Firma de tiempo detectada (p.ej. "4/4", "3/4")
     */
    timeSignature?: string;
    
    /**
     * Offset temporal en segundos
     */
    offset?: number;
  };
}

interface BeatDetectionOptions {
  /**
   * Duración total del audio en segundos
   */
  duration: number;
  
  /**
   * Datos de energía del audio (opcional)
   * Si se proporcionan, se usarán para detectar beats
   */
  peaks?: number[];
  
  /**
   * BPM por defecto, se usa si no se pueden detectar
   */
  defaultBpm?: number;
  
  /**
   * Si es verdadero, se utilizará el BPM proporcionado sin intentar detectar
   */
  useBpmOnly?: boolean;
  
  /**
   * Si es verdadero, se suavizarán las intensidades de los beats
   */
  smoothIntensities?: boolean;
  
  /**
   * Callback cuando cambia el mapa de beats
   */
  onBeatMapChange?: (beatMap: BeatMap) => void;
}

/**
 * Hook para detectar y gestionar beats musicales
 * 
 * Este hook maneja tres métodos para trabajar con beats:
 * 1. Detección automática basada en análisis de energía del audio
 * 2. Generación por BPM fijo 
 * 3. Colocación manual de beats
 */
export function useBeatDetection({
  duration,
  peaks = [],
  defaultBpm = DEFAULT_BPM,
  useBpmOnly = false,
  smoothIntensities = true,
  onBeatMapChange
}: BeatDetectionOptions) {
  // Estado principal: el mapa de beats
  const [beatMap, setBeatMap] = useState<BeatMap>({
    positions: [],
    bpm: defaultBpm,
    intensities: [],
    metadata: {
      method: 'bpm',
      confidence: 1.0,
      tempo: defaultBpm,
      timeSignature: '4/4'
    }
  });
  
  // Estado para el BPM manual
  const [manualBpm, setManualBpm] = useState<number>(defaultBpm);
  
  // Estado para el offset de beats
  const [beatOffset, setBeatOffset] = useState<number>(0);
  
  /**
   * Detectar beats basados en el análisis de picos de energía
   */
  const detectBeats = useCallback(() => {
    if (peaks.length === 0 || useBpmOnly) {
      console.log('No hay datos de picos disponibles o se está usando solo BPM. Generando beats por BPM.');
      generateBpmBeats(manualBpm);
      return;
    }
    
    try {
      // Calcula la tasa de muestreo
      const sampleRate = peaks.length / duration; // muestras por segundo
      
      // Umbral para considerar un pico como beat
      const threshold = 0.7;
      
      // Mínima distancia entre beats en muestras (basada en BPM máximo)
      const minDistance = Math.floor(60 / MAX_BPM * sampleRate);
      
      // Buscar picos en los datos de energía
      let beatPositions: number[] = [];
      let beatIntensities: number[] = [];
      
      for (let i = 1; i < peaks.length - 1; i++) {
        // Un beat potencial es un pico local que supera el umbral
        if (peaks[i] > threshold && 
            peaks[i] > peaks[i - 1] && 
            peaks[i] > peaks[i + 1]) {
          
          // Evita beats demasiado cercanos entre sí
          if (beatPositions.length === 0 || 
              i - Math.floor(beatPositions[beatPositions.length - 1] * sampleRate) >= minDistance) {
            const time = i / sampleRate;
            beatPositions.push(time);
            
            // Normalizar intensidad a un rango de 0.3 a 1.0
            // para que incluso los beats más débiles sean visibles
            const normalizedIntensity = 0.3 + (peaks[i] * 0.7);
            beatIntensities.push(normalizedIntensity);
          }
        }
      }
      
      // Estimar BPM basado en la distancia promedio entre beats
      let estimatedBpm = defaultBpm;
      if (beatPositions.length > 1) {
        const intervals: number[] = [];
        for (let i = 1; i < beatPositions.length; i++) {
          intervals.push(beatPositions[i] - beatPositions[i - 1]);
        }
        
        // Calcular la mediana de los intervalos para estabilidad
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        estimatedBpm = Math.round(60 / medianInterval);
        
        // Verificar que el BPM esté en un rango razonable
        estimatedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, estimatedBpm));
      }
      
      // Detectar firmas de tiempo comunes (muy simplificado)
      let timeSignature = '4/4'; // La más común por defecto
      
      // Suavizar intensidades si se solicita
      if (smoothIntensities && beatIntensities.length > 2) {
        const smoothed: number[] = [];
        for (let i = 0; i < beatIntensities.length; i++) {
          if (i === 0) {
            smoothed.push((beatIntensities[i] * 2 + beatIntensities[i + 1]) / 3);
          } else if (i === beatIntensities.length - 1) {
            smoothed.push((beatIntensities[i - 1] + beatIntensities[i] * 2) / 3);
          } else {
            smoothed.push((beatIntensities[i - 1] + beatIntensities[i] * 2 + beatIntensities[i + 1]) / 4);
          }
        }
        beatIntensities = smoothed;
      }
      
      // Estimar tipos de beat (1: normal, 2: downbeat/acento, 3: sección)
      // Este es un algoritmo muy simplificado como ejemplo
      const beatTypes: number[] = [];
      for (let i = 0; i < beatPositions.length; i++) {
        if (i % 16 === 0) { // Posible inicio de sección cada 16 beats
          beatTypes.push(3);
        } else if (i % 4 === 0) { // Posible downbeat cada 4 beats
          beatTypes.push(2);
        } else {
          beatTypes.push(1);
        }
      }
      
      // Crear nuevo mapa de beats
      const newBeatMap: BeatMap = {
        positions: beatPositions,
        bpm: estimatedBpm,
        intensities: beatIntensities,
        types: beatTypes,
        metadata: {
          method: 'detected',
          confidence: 0.8, // Valor aproximado
          tempo: estimatedBpm,
          timeSignature
        }
      };
      
      setBeatMap(newBeatMap);
      if (onBeatMapChange) onBeatMapChange(newBeatMap);
      
      return newBeatMap;
    } catch (error) {
      console.error('Error al detectar beats:', error);
      // Si falla la detección, volver al método por BPM
      generateBpmBeats(manualBpm);
      return null;
    }
  }, [duration, peaks, manualBpm, useBpmOnly, smoothIntensities, defaultBpm, onBeatMapChange]);
  
  /**
   * Generar beats basados en un BPM fijo
   */
  const generateBpmBeats = useCallback((bpm: number) => {
    if (bpm < MIN_BPM || bpm > MAX_BPM) {
      console.warn(`BPM ${bpm} fuera de rango. Usando ${defaultBpm} por defecto.`);
      bpm = defaultBpm;
    }
    
    // Intervalo entre beats en segundos
    const interval = 60 / bpm;
    
    // Generar posiciones de beats
    const beatPositions: number[] = [];
    const beatIntensities: number[] = [];
    const beatTypes: number[] = [];
    
    // Aplicar offset
    let startTime = beatOffset;
    
    // Generar beats hasta el final de la duración
    for (let time = startTime; time < duration; time += interval) {
      beatPositions.push(time);
      
      // Asignar intensidades: más fuerte en el primer beat de cada 4
      const beatIndex = beatPositions.length - 1;
      if (beatIndex % 16 === 0) {
        // Beat de inicio de sección (más intenso)
        beatIntensities.push(1.0);
        beatTypes.push(3);
      } else if (beatIndex % 4 === 0) {
        // Beat de inicio de compás (intenso)
        beatIntensities.push(0.9);
        beatTypes.push(2);
      } else {
        // Beat normal
        beatIntensities.push(0.7);
        beatTypes.push(1);
      }
    }
    
    // Crear nuevo mapa de beats
    const newBeatMap: BeatMap = {
      positions: beatPositions,
      bpm,
      intensities: beatIntensities,
      types: beatTypes,
      metadata: {
        method: 'bpm',
        confidence: 1.0,
        tempo: bpm,
        timeSignature: '4/4',
        offset: beatOffset
      }
    };
    
    setBeatMap(newBeatMap);
    if (onBeatMapChange) onBeatMapChange(newBeatMap);
    
    return newBeatMap;
  }, [duration, beatOffset, defaultBpm, onBeatMapChange]);
  
  /**
   * Ajustar el offset de beats
   */
  const adjustBeatOffset = useCallback((newOffset: number) => {
    setBeatOffset(newOffset);
    
    // Regenerar beats con el nuevo offset
    if (beatMap.metadata.method === 'bpm') {
      generateBpmBeats(beatMap.bpm);
    }
  }, [beatMap, generateBpmBeats]);
  
  /**
   * Cambiar el BPM manualmente
   */
  const changeBpm = useCallback((newBpm: number) => {
    setManualBpm(newBpm);
    generateBpmBeats(newBpm);
  }, [generateBpmBeats]);
  
  /**
   * Añadir un beat manual en una posición específica
   */
  const addManualBeat = useCallback((time: number, intensity: number = 1.0, type: number = 1) => {
    // Verificar si ya existe un beat cerca de esta posición
    const nearbyBeatIndex = beatMap.positions.findIndex(
      pos => Math.abs(pos - time) < 0.1
    );
    
    if (nearbyBeatIndex >= 0) {
      // Ya existe un beat muy cercano, no añadir uno nuevo
      return false;
    }
    
    // Crear nuevos arrays con el beat añadido
    const newPositions = [...beatMap.positions, time].sort((a, b) => a - b);
    const positionIndex = newPositions.indexOf(time);
    
    const newIntensities = [...(beatMap.intensities || [])];
    const newTypes = [...(beatMap.types || [])];
    
    // Si no había intensidades antes, llenar con valores por defecto
    if (newIntensities.length < newPositions.length - 1) {
      for (let i = newIntensities.length; i < newPositions.length - 1; i++) {
        newIntensities.push(1.0);
      }
    }
    
    // Si no había tipos antes, llenar con valores por defecto
    if (newTypes.length < newPositions.length - 1) {
      for (let i = newTypes.length; i < newPositions.length - 1; i++) {
        newTypes.push(1);
      }
    }
    
    // Insertar el nuevo valor en la posición correcta
    newIntensities.splice(positionIndex, 0, intensity);
    newTypes.splice(positionIndex, 0, type);
    
    // Calcular nuevo BPM aproximado basado en los beats manuales
    let newBpm = beatMap.bpm;
    if (newPositions.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < newPositions.length; i++) {
        intervals.push(newPositions[i] - newPositions[i - 1]);
      }
      
      // Calcular la mediana de los intervalos para estabilidad
      intervals.sort((a, b) => a - b);
      const medianInterval = intervals[Math.floor(intervals.length / 2)];
      newBpm = Math.round(60 / medianInterval);
      
      // Verificar que el BPM esté en un rango razonable
      newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    }
    
    // Actualizar el mapa de beats
    const newBeatMap: BeatMap = {
      positions: newPositions,
      bpm: newBpm,
      intensities: newIntensities,
      types: newTypes,
      metadata: {
        method: 'manual',
        confidence: 1.0,
        tempo: newBpm,
        timeSignature: beatMap.metadata.timeSignature || '4/4'
      }
    };
    
    setBeatMap(newBeatMap);
    if (onBeatMapChange) onBeatMapChange(newBeatMap);
    
    return true;
  }, [beatMap, onBeatMapChange]);
  
  /**
   * Eliminar un beat manual en una posición específica
   */
  const removeManualBeat = useCallback((time: number) => {
    // Encontrar el beat más cercano a la posición dada
    const nearestBeatIndex = beatMap.positions.findIndex(
      pos => Math.abs(pos - time) < 0.1
    );
    
    if (nearestBeatIndex < 0) {
      return false; // No se encontró ningún beat cercano
    }
    
    // Crear nuevos arrays sin el beat eliminado
    const newPositions = [...beatMap.positions];
    newPositions.splice(nearestBeatIndex, 1);
    
    const newIntensities = beatMap.intensities ? [...beatMap.intensities] : [];
    if (newIntensities.length > 0) {
      newIntensities.splice(nearestBeatIndex, 1);
    }
    
    const newTypes = beatMap.types ? [...beatMap.types] : [];
    if (newTypes.length > 0) {
      newTypes.splice(nearestBeatIndex, 1);
    }
    
    // Calcular nuevo BPM aproximado
    let newBpm = beatMap.bpm;
    if (newPositions.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < newPositions.length; i++) {
        intervals.push(newPositions[i] - newPositions[i - 1]);
      }
      
      intervals.sort((a, b) => a - b);
      const medianInterval = intervals[Math.floor(intervals.length / 2)];
      newBpm = Math.round(60 / medianInterval);
      newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
    }
    
    // Actualizar el mapa de beats
    const newBeatMap: BeatMap = {
      positions: newPositions,
      bpm: newBpm,
      intensities: newIntensities.length > 0 ? newIntensities : undefined,
      types: newTypes.length > 0 ? newTypes : undefined,
      metadata: {
        method: 'manual',
        confidence: 1.0,
        tempo: newBpm,
        timeSignature: beatMap.metadata.timeSignature || '4/4'
      }
    };
    
    setBeatMap(newBeatMap);
    if (onBeatMapChange) onBeatMapChange(newBeatMap);
    
    return true;
  }, [beatMap, onBeatMapChange]);
  
  /**
   * Importar un mapa de beats desde un archivo o formato externo
   */
  const importBeatMap = useCallback((importedMap: BeatMap) => {
    // Validar el mapa importado
    if (!importedMap.positions || !Array.isArray(importedMap.positions)) {
      console.error('Mapa de beats inválido: no contiene posiciones de beats.');
      return false;
    }
    
    // Asegurarse de que las posiciones estén ordenadas
    const sortedPositions = [...importedMap.positions].sort((a, b) => a - b);
    
    // Crear un nuevo mapa de beats con la estructura correcta
    const newBeatMap: BeatMap = {
      positions: sortedPositions,
      bpm: importedMap.bpm || defaultBpm,
      intensities: importedMap.intensities,
      types: importedMap.types,
      metadata: {
        method: 'imported',
        confidence: importedMap.metadata?.confidence || 1.0,
        tempo: importedMap.metadata?.tempo || importedMap.bpm || defaultBpm,
        timeSignature: importedMap.metadata?.timeSignature || '4/4',
        offset: importedMap.metadata?.offset || 0
      }
    };
    
    setBeatMap(newBeatMap);
    if (onBeatMapChange) onBeatMapChange(newBeatMap);
    
    return true;
  }, [defaultBpm, onBeatMapChange]);
  
  /**
   * Obtener los beats cercanos a una posición temporal específica
   */
  const getNearestBeat = useCallback((time: number, maxDistance: number = 0.5): number | null => {
    if (!beatMap.positions.length) return null;
    
    // Encontrar el beat más cercano
    let closestBeat = null;
    let minDistance = Infinity;
    
    for (const beatTime of beatMap.positions) {
      const distance = Math.abs(beatTime - time);
      if (distance < minDistance) {
        minDistance = distance;
        closestBeat = beatTime;
      }
    }
    
    // Devolver el beat más cercano solo si está dentro de la distancia máxima
    return minDistance <= maxDistance ? closestBeat : null;
  }, [beatMap.positions]);
  
  /**
   * Efecto para detectar o generar beats cuando cambian las dependencias
   */
  useEffect(() => {
    if (useBpmOnly) {
      generateBpmBeats(manualBpm);
    } else if (peaks.length > 0) {
      detectBeats();
    } else {
      generateBpmBeats(manualBpm);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, useBpmOnly, peaks.length]);
  
  return {
    beatMap,
    detectBeats,
    generateBpmBeats,
    changeBpm,
    adjustBeatOffset,
    addManualBeat,
    removeManualBeat,
    importBeatMap,
    getNearestBeat,
    manualBpm,
    beatOffset
  };
}