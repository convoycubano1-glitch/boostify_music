/**
 * Biblioteca para sincronización de beats en videos musicales
 * 
 * Esta biblioteca proporciona funciones para detectar beats en archivos de audio
 * y sincronizar clips con estos beats para crear visuales que estén sincronizados
 * con la música.
 */

// Tipos de datos para beats
export type BeatType = 'downbeat' | 'accent' | 'regular';

export interface BeatData {
  time: number;        // Tiempo en segundos donde ocurre el beat
  type: BeatType;      // Tipo de beat
  energy: number;      // Intensidad/energía del beat (0-1)
  section?: string;    // Opcional: sección de la canción (intro, verso, coro, etc.)
}

// Opciones para la detección de beats
export interface BeatDetectionOptions {
  sensitivity?: number;       // Sensibilidad de la detección (0-1), por defecto 0.5
  minTempo?: number;          // BPM mínimo a detectar, por defecto 60
  maxTempo?: number;          // BPM máximo a detectar, por defecto 200
  beatGrouping?: number;      // Cuántos beats agrupar para determinar compases, por defecto 4
  frequencyRange?: [number, number]; // Rango de frecuencias a analizar [min, max], por defecto [20, 200]
}

// Opciones para la sincronización
export interface SyncOptions {
  offsetMs?: number;          // Desplazamiento en ms para ajustar la sincronización
  snapThreshold?: number;     // Umbral de distancia para ajustar a un beat en segundos
  preferDownbeats?: boolean;  // Si se prefieren los downbeats para puntos importantes
}

class BeatSynchronizationLib {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private detectedBeats: BeatData[] = [];
  
  /**
   * Carga un archivo de audio para análisis
   * @param audioSource URL o File del audio a analizar
   * @param options Opciones de detección de beats
   * @returns Promise con los beats detectados
   */
  async loadAudio(audioSource: string | File, options: BeatDetectionOptions = {}): Promise<BeatData[]> {
    try {
      // Inicializar el contexto de audio si no existe
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Cargar el archivo de audio
      const arrayBuffer = await this.loadAudioFile(audioSource);
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Ejecutar los algoritmos de detección de beats
      this.detectedBeats = await this.detectBeats(this.audioBuffer, options);
      
      // Clasificar los tipos de beats
      this.classifyBeats(this.detectedBeats);
      
      // Detectar secciones si es posible
      this.detectSections(this.detectedBeats);
      
      return this.detectedBeats;
      
    } catch (error) {
      console.error('Error al cargar o analizar el audio:', error);
      throw error;
    }
  }
  
  /**
   * Carga un archivo de audio como ArrayBuffer
   * @param source URL o File del audio
   * @returns Promise con el ArrayBuffer del audio
   */
  private async loadAudioFile(source: string | File): Promise<ArrayBuffer> {
    if (typeof source === 'string') {
      // Cargar desde URL
      const response = await fetch(source);
      return await response.arrayBuffer();
    } else {
      // Cargar desde File
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(source);
      });
    }
  }
  
  /**
   * Detecta beats en un buffer de audio
   * @param audioBuffer Buffer de audio a analizar
   * @param options Opciones de detección
   * @returns Array de datos de beats detectados
   */
  private async detectBeats(audioBuffer: AudioBuffer, options: BeatDetectionOptions): Promise<BeatData[]> {
    const { 
      sensitivity = 0.5,
      minTempo = 60,
      maxTempo = 200,
      beatGrouping = 4,
      frequencyRange = [20, 200]
    } = options;
    
    // En una implementación real, aquí se ejecutaría un algoritmo complejo
    // como un detector de onsets basado en FFT, seguido de un algoritmo
    // de agrupación para detectar el tempo y la fase de los beats.
    
    // Para este demo, simularemos la detección de beats con datos predefinidos
    // basados en la duración del audio
    const duration = audioBuffer.duration;
    const mockBeats: BeatData[] = [];
    
    // Simular análisis de tempo basado en los parámetros
    const estimatedTempo = Math.min(maxTempo, Math.max(minTempo, 120 + (sensitivity * 30 - 15)));
    const beatInterval = 60 / estimatedTempo;
    
    // Generar beats simulados
    for (let time = 0; time < duration; time += beatInterval) {
      // Calcular una "energía" simulada que fluctúa con el tiempo
      const baseEnergy = 0.3 + (sensitivity * 0.4); // Base entre 0.3 y 0.7
      const randomVariation = Math.random() * 0.3; // Variación aleatoria
      const pulseVariation = Math.sin(time * 0.5) * 0.15; // Variación sinusoidal para simular patrones
      
      const energy = Math.min(1, Math.max(0.1, baseEnergy + randomVariation + pulseVariation));
      
      mockBeats.push({
        time,
        type: 'regular', // Se clasificará después
        energy
      });
    }
    
    return mockBeats;
  }
  
  /**
   * Clasifica los beats en downbeats, accents y regulares
   * @param beats Array de beats a clasificar
   */
  private classifyBeats(beats: BeatData[]): void {
    if (beats.length === 0) return;
    
    // Agrupar en conjuntos de 4 para representar compases
    // Primer beat de cada grupo = downbeat
    // Tercer beat de cada grupo = accent
    // Resto = regular
    for (let i = 0; i < beats.length; i++) {
      const positionInBar = i % 4; // Asumimos compases de 4/4
      
      if (positionInBar === 0) {
        beats[i].type = 'downbeat';
        // Aumentar ligeramente la energía de los downbeats
        beats[i].energy = Math.min(1, beats[i].energy * 1.2);
      } else if (positionInBar === 2) {
        beats[i].type = 'accent';
        // Aumentar ligeramente la energía de los acentos secundarios
        beats[i].energy = Math.min(1, beats[i].energy * 1.1);
      } else {
        beats[i].type = 'regular';
      }
    }
  }
  
  /**
   * Detecta secciones basadas en patrones de energía
   * @param beats Array de beats con información de energía
   */
  private detectSections(beats: BeatData[]): void {
    if (beats.length < 8) return;
    
    // Simulación simple para demo
    // En una implementación real, aquí habría algoritmos de segmentación
    // basados en cambios de características espectrales, ritmo, etc.
    
    const averageEnergy = beats.reduce((sum, beat) => sum + beat.energy, 0) / beats.length;
    
    let currentSection = 'intro';
    let sectionChangeCounter = 0;
    const beatsPerSection = Math.floor(beats.length / 5); // Aproximadamente 5 secciones
    
    for (let i = 0; i < beats.length; i++) {
      // Cambiar de sección cada cierto número de beats
      if (i > 0 && i % beatsPerSection === 0) {
        sectionChangeCounter++;
        
        // Alternar entre diferentes secciones
        switch (sectionChangeCounter % 5) {
          case 0: currentSection = 'intro'; break;
          case 1: currentSection = 'verse'; break;
          case 2: currentSection = 'chorus'; break;
          case 3: currentSection = 'bridge'; break;
          case 4: currentSection = 'outro'; break;
        }
      }
      
      beats[i].section = currentSection;
    }
  }
  
  /**
   * Encuentra el beat más cercano a un punto temporal
   * @param time Tiempo en segundos
   * @param maxDistance Distancia máxima permitida en segundos
   * @param type Tipo específico de beat a buscar (opcional)
   * @returns El beat más cercano o null si no hay ninguno en el rango
   */
  findNearestBeat(time: number, maxDistance: number = 0.5, type?: BeatType): BeatData | null {
    if (this.detectedBeats.length === 0) return null;
    
    let closestBeat: BeatData | null = null;
    let closestDistance = Infinity;
    
    for (const beat of this.detectedBeats) {
      // Si se especificó un tipo, ignorar beats de otro tipo
      if (type && beat.type !== type) continue;
      
      const distance = Math.abs(beat.time - time);
      if (distance < closestDistance && distance <= maxDistance) {
        closestDistance = distance;
        closestBeat = beat;
      }
    }
    
    return closestBeat;
  }
  
  /**
   * Encuentra todos los beats en un rango de tiempo
   * @param startTime Tiempo de inicio en segundos
   * @param endTime Tiempo de finalización en segundos
   * @param type Tipo específico de beat a filtrar (opcional)
   * @returns Array de beats en el rango especificado
   */
  findBeatsInRange(startTime: number, endTime: number, type?: BeatType): BeatData[] {
    return this.detectedBeats.filter(beat => {
      const isInRange = beat.time >= startTime && beat.time <= endTime;
      const matchesType = !type || beat.type === type;
      return isInRange && matchesType;
    });
  }
  
  /**
   * Calcula puntos de corte óptimos basados en beats
   * @param desiredDuration Duración deseada en segundos
   * @param options Opciones de sincronización
   * @returns Puntos de tiempo de inicio y fin recomendados
   */
  suggestClipBoundaries(desiredDuration: number, options: SyncOptions = {}): { start: number, end: number } {
    const { preferDownbeats = true } = options;
    
    if (this.detectedBeats.length < 2) {
      return { start: 0, end: desiredDuration };
    }
    
    // Buscar un buen punto de inicio (preferentemente un downbeat)
    const potentialStarts = preferDownbeats 
      ? this.detectedBeats.filter(beat => beat.type === 'downbeat')
      : this.detectedBeats;
    
    if (potentialStarts.length === 0) {
      return { start: 0, end: desiredDuration };
    }
    
    // Elegir un punto de inicio que no esté muy al principio
    const startIndex = Math.min(2, potentialStarts.length - 1);
    const startTime = potentialStarts[startIndex].time;
    
    // Buscar un punto final que sea un múltiplo de compás desde el inicio
    const endTime = this.findNearestBeat(startTime + desiredDuration)?.time || (startTime + desiredDuration);
    
    return { start: startTime, end: endTime };
  }
  
  /**
   * Sincroniza un conjunto de clips con los beats detectados
   * @param clips Array de clips con tiempos de inicio y fin
   * @param options Opciones de sincronización
   * @returns Array de clips con tiempos ajustados a los beats
   */
  synchronizeClipsToBeats(clips: { id: string, start: number, end: number }[], options: SyncOptions = {}): { id: string, start: number, end: number }[] {
    const { snapThreshold = 0.3, preferDownbeats = true } = options;
    
    return clips.map(clip => {
      // Buscar los beats más cercanos a los puntos de inicio y fin
      const startBeat = preferDownbeats
        ? this.findNearestBeat(clip.start, snapThreshold, 'downbeat') || this.findNearestBeat(clip.start, snapThreshold)
        : this.findNearestBeat(clip.start, snapThreshold);
        
      const endBeat = this.findNearestBeat(clip.end, snapThreshold);
      
      // Ajustar si se encontraron beats cercanos
      return {
        id: clip.id,
        start: startBeat ? startBeat.time : clip.start,
        end: endBeat ? endBeat.time : clip.end
      };
    });
  }
  
  /**
   * Obtiene todos los beats detectados actualmente
   * @returns Array de datos de beats
   */
  getAllBeats(): BeatData[] {
    return [...this.detectedBeats];
  }
  
  /**
   * Limpia los datos y recursos
   */
  cleanup(): void {
    this.detectedBeats = [];
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffer = null;
  }
}

// Exportar una instancia única
const BeatSynchronization = new BeatSynchronizationLib();
export default BeatSynchronization;