// Datos de muestra para el editor profesional de videos musicales

// Clips de ejemplo para la línea de tiempo
export const sampleClips = [
  {
    id: 1,
    title: 'Intro',
    start: 0,
    duration: 10,
    type: 'video',
    color: '#4CAF50',
    thumbnail: null,
    layer: 1
  },
  {
    id: 2,
    title: 'Verso 1',
    start: 10,
    duration: 15,
    type: 'video',
    color: '#4CAF50',
    thumbnail: null,
    layer: 1
  },
  {
    id: 3,
    title: 'Coro',
    start: 25,
    duration: 20,
    type: 'video',
    color: '#4CAF50',
    thumbnail: null,
    layer: 1
  },
  {
    id: 4,
    title: 'Overlay Título',
    start: 5,
    duration: 8,
    type: 'text',
    color: '#9C27B0',
    thumbnail: null,
    layer: 2
  },
  {
    id: 5,
    title: 'Efecto Transición',
    start: 24,
    duration: 2,
    type: 'effect',
    color: '#FF9800',
    thumbnail: null,
    layer: 3
  }
];

// Datos de forma de onda de audio
export const sampleAudioData = {
  waveform: Array(1000).fill(0).map(() => Math.random() * 0.8),
  peaks: [
    { time: 10, label: 'Verso 1', type: 'section' },
    { time: 25, label: 'Coro', type: 'section' },
    { time: 45, label: 'Verso 2', type: 'section' },
    { time: 60, label: 'Puente', type: 'section' },
    { time: 70, label: 'Coro Final', type: 'section' }
  ]
};

// Efectos disponibles
export const sampleEffects = [
  { id: 'fade', name: 'Fundido', icon: 'fade' },
  { id: 'dissolve', name: 'Disolución', icon: 'dissolve' },
  { id: 'wipe', name: 'Barrido', icon: 'wipe' },
  { id: 'zoom', name: 'Zoom', icon: 'zoom' },
  { id: 'blur', name: 'Desenfoque', icon: 'blur' },
  { id: 'b&w', name: 'Blanco y Negro', icon: 'b&w' },
  { id: 'sepia', name: 'Sepia', icon: 'sepia' },
  { id: 'vignette', name: 'Viñeta', icon: 'vignette' }
];

// Datos de beats para la visualización de tiempo musical
export const sampleBeats = {
  metadata: {
    songTitle: 'Canción de Demostración',
    artist: 'Artista de Prueba',
    duration: 120,
    bpm: 128,
    key: 'C Mayor',
    timeSignature: '4/4',
    complexity: 'Media',
    generatedAt: new Date().toISOString(),
    beatAnalysis: {
      totalBeats: 240,
      beatTypes: {
        downbeats: 60,
        accents: 60,
        regularBeats: 120
      },
      averageInterval: 0.5,
      patternComplexity: 'Media'
    }
  },
  // Generar beats cada 0.5 segundos (simulando 120 BPM en 4/4)
  beats: Array(240).fill(0).map((_, i) => {
    // En 4/4, cada 4 beats es un downbeat (primer tiempo del compás)
    const isDownbeat = i % 4 === 0;
    // Los tiempos 2 y 4 de cada compás son acentos en muchos géneros
    const isAccent = i % 4 === 1 || i % 4 === 3;
    
    return {
      time: i * 0.5, // Cada beat ocurre cada 0.5 segundos
      type: isDownbeat ? 'downbeat' : (isAccent ? 'accent' : 'beat'),
      intensity: isDownbeat ? 0.9 : (isAccent ? 0.7 : 0.5 + Math.random() * 0.2),
      energy: isDownbeat ? (0.8 + Math.random() * 0.2) : (isAccent ? (0.6 + Math.random() * 0.2) : (0.4 + Math.random() * 0.2)),
      isDownbeat
    };
  })
};