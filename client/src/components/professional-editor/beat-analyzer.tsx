import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Button,
  Switch,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Input
} from '@/components/ui';
import {
  Play,
  Pause,
  SaveAll,
  Music,
  Music2,
  Waveform,
  PlusCircle,
  Edit,
  XCircle,
  Volume2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BeatMarker, SectionMarker } from '@/lib/professional-editor-types';

interface BeatAnalyzerProps {
  /** Archivo de audio a analizar */
  audioUrl?: string;
  
  /** Duración del audio en segundos */
  duration: number;
  
  /** Tiempo actual de reproducción */
  currentTime: number;
  
  /** Función que se dispara al cambiar el tiempo actual */
  onTimeUpdate?: (time: number) => void;
  
  /** Función para reproducir el audio */
  onPlay?: () => void;
  
  /** Función para pausar el audio */
  onPause?: () => void;
  
  /** Marcadores de beat existentes */
  beatMarkers: BeatMarker[];
  
  /** Función para añadir un marcador de beat */
  onAddBeatMarker?: (marker: Omit<BeatMarker, 'id'>) => void;
  
  /** Función para actualizar un marcador de beat */
  onUpdateBeatMarker?: (id: string, updates: Partial<BeatMarker>) => void;
  
  /** Función para eliminar un marcador de beat */
  onRemoveBeatMarker?: (id: string) => void;
  
  /** Marcadores de sección existentes */
  sectionMarkers: SectionMarker[];
  
  /** Función para añadir un marcador de sección */
  onAddSectionMarker?: (marker: Omit<SectionMarker, 'id'>) => void;
  
  /** Función para actualizar un marcador de sección */
  onUpdateSectionMarker?: (id: string, updates: Partial<SectionMarker>) => void;
  
  /** Función para eliminar un marcador de sección */
  onRemoveSectionMarker?: (id: string) => void;
}

/**
 * Componente para analizar beats en una pista de audio
 * Permite detectar automáticamente beats y gestionar secciones musicales
 */
export function BeatAnalyzer({
  audioUrl,
  duration,
  currentTime,
  onTimeUpdate,
  onPlay,
  onPause,
  beatMarkers = [],
  onAddBeatMarker,
  onUpdateBeatMarker,
  onRemoveBeatMarker,
  sectionMarkers = [],
  onAddSectionMarker,
  onUpdateSectionMarker,
  onRemoveSectionMarker
}: BeatAnalyzerProps) {
  // Estado para el elemento de audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Estado para el análisis de audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  // Estado para la edición de secciones
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [newSectionData, setNewSectionData] = useState<{
    name: string;
    type: SectionMarker['type'];
    startTime: number;
    endTime: number;
    color?: string;
  }>({
    name: '',
    type: 'verse',
    startTime: 0,
    endTime: 0,
    color: '#6366f1' // Indigo por defecto
  });
  
  // Estado para expandir/colapsar paneles
  const [showBeatSettings, setShowBeatSettings] = useState(true);
  const [showSectionSettings, setShowSectionSettings] = useState(true);
  
  // Crear elemento de audio cuando cambia la URL
  useEffect(() => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current = audio;
    
    // Cargar y analizar la forma de onda
    loadWaveform(audioUrl);
    
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
    };
  }, [audioUrl]);
  
  // Actualizar volumen cuando cambia
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  // Actualizar el tiempo actual basado en props
  useEffect(() => {
    if (audioRef.current && !isPlaying && Math.abs(audioRef.current.currentTime - currentTime) > 0.5) {
      audioRef.current.currentTime = currentTime;
    }
  }, [currentTime, isPlaying]);
  
  // Manejar la finalización del audio
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (onPause) {
      onPause();
    }
  };
  
  // Manejar la actualización del tiempo
  const handleTimeUpdate = () => {
    if (audioRef.current && onTimeUpdate) {
      onTimeUpdate(audioRef.current.currentTime);
    }
  };
  
  // Cargar y analizar la forma de onda
  const loadWaveform = async (url: string) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      audioContext.decodeAudioData(arrayBuffer, (buffer) => {
        // Obtener datos del canal izquierdo (o mono)
        const channelData = buffer.getChannelData(0);
        
        // Reducir la cantidad de datos para visualización (tomar 1000 muestras)
        const sampleCount = 1000;
        const sampleSize = Math.floor(channelData.length / sampleCount);
        const samples = [];
        
        for (let i = 0; i < sampleCount; i++) {
          let sum = 0;
          const startSample = i * sampleSize;
          for (let j = 0; j < sampleSize; j++) {
            sum += Math.abs(channelData[startSample + j]);
          }
          samples.push(sum / sampleSize);
        }
        
        // Normalizar los datos a un rango de 0-1
        const max = Math.max(...samples);
        const normalizedSamples = samples.map(s => s / max);
        
        setWaveformData(normalizedSamples);
        drawWaveform(normalizedSamples);
      });
    } catch (error) {
      console.error('Error al cargar la forma de onda:', error);
    }
  };
  
  // Dibujar la forma de onda en el canvas
  const drawWaveform = (data: number[]) => {
    if (!waveformCanvasRef.current) return;
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dibujar la línea central
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Dibujar la forma de onda
    ctx.beginPath();
    ctx.strokeStyle = '#6366f1'; // Indigo
    
    const barWidth = width / data.length;
    
    for (let i = 0; i < data.length; i++) {
      const x = i * barWidth;
      const amplitude = data[i] * (height / 2);
      
      // Dibujar línea desde el centro hacia arriba y abajo
      ctx.moveTo(x, (height / 2) - amplitude);
      ctx.lineTo(x, (height / 2) + amplitude);
    }
    
    ctx.stroke();
    
    // Dibujar marcadores de beat
    beatMarkers.forEach(marker => {
      const x = (marker.time / duration) * width;
      
      ctx.beginPath();
      ctx.strokeStyle = marker.type === 'downbeat' ? '#22c55e' : '#f59e0b';
      ctx.lineWidth = marker.type === 'downbeat' ? 2 : 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.lineWidth = 1;
    });
    
    // Dibujar marcadores de sección
    sectionMarkers.forEach(marker => {
      const startX = (marker.startTime / duration) * width;
      const endX = (marker.endTime / duration) * width;
      
      // Dibujar rectángulo semi-transparente para la sección
      ctx.fillStyle = marker.color || getSectionColor(marker.type);
      ctx.globalAlpha = 0.3;
      ctx.fillRect(startX, 0, endX - startX, height);
      ctx.globalAlpha = 1;
      
      // Dibujar líneas de inicio y fin
      ctx.beginPath();
      ctx.strokeStyle = marker.color || getSectionColor(marker.type);
      ctx.lineWidth = 2;
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX, height);
      ctx.moveTo(endX, 0);
      ctx.lineTo(endX, height);
      ctx.stroke();
      ctx.lineWidth = 1;
      
      // Dibujar nombre de la sección
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const labelX = startX + ((endX - startX) / 2);
      ctx.fillText(marker.label, labelX, 12);
    });
    
    // Dibujar indicador de tiempo actual
    const currentTimeX = (currentTime / duration) * width;
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444'; // Rojo
    ctx.lineWidth = 2;
    ctx.moveTo(currentTimeX, 0);
    ctx.lineTo(currentTimeX, height);
    ctx.stroke();
    ctx.lineWidth = 1;
  };
  
  // Obtener color basado en el tipo de sección
  const getSectionColor = (type: SectionMarker['type']): string => {
    switch (type) {
      case 'intro':
        return '#22c55e'; // Verde
      case 'verse':
        return '#6366f1'; // Indigo
      case 'chorus':
        return '#f59e0b'; // Ámbar
      case 'bridge':
        return '#ec4899'; // Rosa
      case 'outro':
        return '#8b5cf6'; // Violeta
      case 'custom':
        return '#0ea5e9'; // Celeste
      default:
        return '#6366f1'; // Indigo por defecto
    }
  };
  
  // Reproducir/pausar el audio
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause();
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      if (onPlay) onPlay();
    }
  };
  
  // Buscar beats automáticamente
  const detectBeats = () => {
    if (!waveformData.length || !onAddBeatMarker) return;
    
    setIsAnalyzing(true);
    
    // Usar el umbral basado en la sensibilidad
    const threshold = 0.5 - sensitivity * 0.3; // Sensibilidad inversa: menor threshold = más sensible
    
    // Detectar picos en la forma de onda
    const peaks: number[] = [];
    let beatCount = 0;
    
    for (let i = 2; i < waveformData.length - 2; i++) {
      // Verificar si es un pico local
      if (
        waveformData[i] > threshold &&
        waveformData[i] > waveformData[i-1] &&
        waveformData[i] > waveformData[i-2] &&
        waveformData[i] > waveformData[i+1] &&
        waveformData[i] > waveformData[i+2]
      ) {
        const timePosition = (i / waveformData.length) * duration;
        peaks.push(timePosition);
      }
    }
    
    // Eliminar beats existentes
    beatMarkers.forEach(marker => {
      if (onRemoveBeatMarker) {
        onRemoveBeatMarker(marker.id);
      }
    });
    
    // Crear nuevos beats
    peaks.forEach((time, index) => {
      beatCount++;
      const isDownbeat = beatCount % beatsPerBar === 1;
      
      onAddBeatMarker({
        time,
        type: isDownbeat ? 'downbeat' : 'beat',
        intensity: waveformData[Math.floor((time / duration) * waveformData.length)] * 10,
        label: isDownbeat ? `${Math.floor(beatCount / beatsPerBar) + 1}.1` : `${Math.floor(beatCount / beatsPerBar) + 1}.${beatCount % beatsPerBar}`
      });
    });
    
    // Actualizar BPM basado en el número de beats detectados
    if (peaks.length > 1) {
      const averageBPM = Math.round((peaks.length / duration) * 60);
      setBpm(averageBPM);
    }
    
    setIsAnalyzing(false);
  };
  
  // Crear beats basados en BPM
  const createBeatsFromBPM = () => {
    if (!onAddBeatMarker) return;
    
    // Limpiar beats existentes
    beatMarkers.forEach(marker => {
      if (onRemoveBeatMarker) {
        onRemoveBeatMarker(marker.id);
      }
    });
    
    // Calcular intervalo entre beats
    const beatInterval = 60 / bpm;
    const totalBeats = Math.floor(duration / beatInterval);
    
    // Crear nuevos beats
    for (let i = 0; i < totalBeats; i++) {
      const time = i * beatInterval;
      const isDownbeat = i % beatsPerBar === 0;
      
      onAddBeatMarker({
        time,
        type: isDownbeat ? 'downbeat' : 'beat',
        intensity: 5, // intensidad media
        label: isDownbeat ? `${Math.floor(i / beatsPerBar) + 1}.1` : `${Math.floor(i / beatsPerBar) + 1}.${(i % beatsPerBar) + 1}`
      });
    }
  };
  
  // Añadir un beat manual en la posición actual
  const addBeatAtCurrentTime = () => {
    if (!onAddBeatMarker) return;
    
    // Contar el total de downbeats para determinar el número de compás
    const bars = beatMarkers.filter(marker => marker.type === 'downbeat').length;
    
    // Contar beats desde el último downbeat
    const lastDownbeat = [...beatMarkers]
      .filter(marker => marker.type === 'downbeat')
      .sort((a, b) => b.time - a.time)[0];
    
    let beatsInCurrentBar = 0;
    
    if (lastDownbeat) {
      beatsInCurrentBar = beatMarkers.filter(
        marker => marker.time > lastDownbeat.time && marker.time <= currentTime
      ).length;
    }
    
    const isDownbeat = beatsInCurrentBar % beatsPerBar === 0;
    
    onAddBeatMarker({
      time: currentTime,
      type: isDownbeat ? 'downbeat' : 'beat',
      intensity: 5, // intensidad media
      label: isDownbeat ? `${bars + 1}.1` : `${bars}.${beatsInCurrentBar + 1}`
    });
  };
  
  // Iniciar la creación de una nueva sección
  const startNewSection = () => {
    setNewSectionData({
      name: 'Nueva Sección',
      type: 'verse',
      startTime: currentTime,
      endTime: Math.min(currentTime + 10, duration),
      color: getSectionColor('verse')
    });
    setEditingSectionId('new');
  };
  
  // Guardar la sección editada
  const saveSection = () => {
    if (editingSectionId === 'new' && onAddSectionMarker) {
      onAddSectionMarker({
        startTime: newSectionData.startTime,
        endTime: newSectionData.endTime,
        type: newSectionData.type,
        label: newSectionData.name,
        color: newSectionData.color
      });
    } else if (editingSectionId && onUpdateSectionMarker) {
      onUpdateSectionMarker(editingSectionId, {
        startTime: newSectionData.startTime,
        endTime: newSectionData.endTime,
        type: newSectionData.type,
        label: newSectionData.name,
        color: newSectionData.color
      });
    }
    
    setEditingSectionId(null);
  };
  
  // Cancelar la edición de sección
  const cancelSectionEdit = () => {
    setEditingSectionId(null);
  };
  
  // Editar una sección existente
  const editSection = (section: SectionMarker) => {
    setNewSectionData({
      name: section.label,
      type: section.type,
      startTime: section.startTime,
      endTime: section.endTime,
      color: section.color
    });
    setEditingSectionId(section.id);
  };
  
  // Eliminar una sección
  const deleteSection = (id: string) => {
    if (onRemoveSectionMarker) {
      onRemoveSectionMarker(id);
    }
  };
  
  // Actualizar el canvas cuando cambian los datos relevantes
  useEffect(() => {
    drawWaveform(waveformData);
  }, [waveformData, beatMarkers, sectionMarkers, currentTime, duration]);
  
  // Formatear tiempo en formato MM:SS.ss
  const formatTime = (timeInSeconds: number): string => {
    if (isNaN(timeInSeconds)) return '00:00.00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 100);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className="w-full bg-zinc-900 border-0 rounded-xl overflow-hidden shadow-xl">
      <CardHeader className="pb-2 border-b border-zinc-800 flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center text-white">
          <Waveform className="h-5 w-5 mr-2 text-indigo-400" />
          Analizador de Beats
        </CardTitle>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            className="h-8 px-2 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="p-4">
          <div className="h-20 relative mb-2 overflow-hidden rounded-md">
            <canvas 
              ref={waveformCanvasRef}
              width={800}
              height={80}
              className="w-full h-full bg-zinc-800"
            />
            
            <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-zinc-400" />
              <Slider
                value={[volume * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) => setVolume(values[0] / 100)}
                className="w-24"
              />
            </div>
          </div>
          
          {/* Panel de configuración de beats */}
          <div className="mb-4 bg-zinc-800 rounded-md overflow-hidden">
            <div 
              className="flex items-center justify-between p-2 bg-zinc-700 cursor-pointer"
              onClick={() => setShowBeatSettings(!showBeatSettings)}
            >
              <h3 className="text-sm font-medium flex items-center">
                <Music2 className="h-4 w-4 mr-2" />
                Configuración de Beats
              </h3>
              {showBeatSettings ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            
            {showBeatSettings && (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bpm" className="text-xs text-zinc-400 mb-1 block">
                      BPM
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="bpm"
                        type="number"
                        min={30}
                        max={300}
                        value={bpm}
                        onChange={e => setBpm(parseInt(e.target.value, 10) || 120)}
                        className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                      />
                      <Label className="text-xs text-zinc-400">BPM</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="beats-per-bar" className="text-xs text-zinc-400 mb-1 block">
                      Beats por compás
                    </Label>
                    <Select
                      value={beatsPerBar.toString()}
                      onValueChange={value => setBeatsPerBar(parseInt(value, 10))}
                    >
                      <SelectTrigger id="beats-per-bar" className="h-8 bg-zinc-900 border-zinc-700">
                        <SelectValue placeholder="Beats por compás" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2/4</SelectItem>
                        <SelectItem value="3">3/4</SelectItem>
                        <SelectItem value="4">4/4</SelectItem>
                        <SelectItem value="6">6/8</SelectItem>
                        <SelectItem value="8">8/8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="beat-sensitivity" className="text-xs text-zinc-400 mb-1 block">
                    Sensibilidad
                  </Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-zinc-400">Baja</span>
                    <Slider
                      id="beat-sensitivity"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[sensitivity]}
                      onValueChange={values => setSensitivity(values[0])}
                      className="flex-1"
                    />
                    <span className="text-xs text-zinc-400">Alta</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                    onClick={addBeatAtCurrentTime}
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Añadir Beat
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                    onClick={createBeatsFromBPM}
                  >
                    <Music className="h-3.5 w-3.5 mr-1" />
                    Generar con BPM
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 bg-amber-700 hover:bg-amber-600 border-amber-600 text-white"
                    onClick={detectBeats}
                    disabled={isAnalyzing || !waveformData.length}
                  >
                    <Waveform className="h-3.5 w-3.5 mr-1" />
                    {isAnalyzing ? 'Analizando...' : 'Detectar Beats'}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Panel de secciones */}
          <div className="mb-4 bg-zinc-800 rounded-md overflow-hidden">
            <div 
              className="flex items-center justify-between p-2 bg-zinc-700 cursor-pointer"
              onClick={() => setShowSectionSettings(!showSectionSettings)}
            >
              <h3 className="text-sm font-medium flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                Secciones
              </h3>
              {showSectionSettings ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            
            {showSectionSettings && (
              <div className="p-3">
                {editingSectionId ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="section-name" className="text-xs text-zinc-400 mb-1 block">
                        Nombre
                      </Label>
                      <Input
                        id="section-name"
                        value={newSectionData.name}
                        onChange={e => setNewSectionData({...newSectionData, name: e.target.value})}
                        className="h-8 bg-zinc-900 border-zinc-700 text-sm"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="section-type" className="text-xs text-zinc-400 mb-1 block">
                        Tipo
                      </Label>
                      <Select
                        value={newSectionData.type}
                        onValueChange={value => setNewSectionData({
                          ...newSectionData, 
                          type: value as SectionMarker['type'],
                          color: getSectionColor(value as SectionMarker['type'])
                        })}
                      >
                        <SelectTrigger id="section-type" className="h-8 bg-zinc-900 border-zinc-700">
                          <SelectValue placeholder="Tipo de sección" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="intro">Intro</SelectItem>
                          <SelectItem value="verse">Verso</SelectItem>
                          <SelectItem value="chorus">Coro</SelectItem>
                          <SelectItem value="bridge">Puente</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="section-color" className="text-xs text-zinc-400 mb-1 block">
                        Color
                      </Label>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded border border-zinc-600" 
                          style={{backgroundColor: newSectionData.color}}
                        />
                        <Input
                          id="section-color"
                          type="color"
                          value={newSectionData.color}
                          onChange={e => setNewSectionData({...newSectionData, color: e.target.value})}
                          className="w-12 h-8 p-0 bg-zinc-900 border-zinc-700"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="section-start" className="text-xs text-zinc-400 mb-1 block">
                          Inicio ({formatTime(newSectionData.startTime)})
                        </Label>
                        <Slider
                          id="section-start"
                          min={0}
                          max={duration}
                          step={0.1}
                          value={[newSectionData.startTime]}
                          onValueChange={values => setNewSectionData({
                            ...newSectionData, 
                            startTime: values[0],
                            endTime: Math.max(values[0] + 0.5, newSectionData.endTime)
                          })}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="section-end" className="text-xs text-zinc-400 mb-1 block">
                          Fin ({formatTime(newSectionData.endTime)})
                        </Label>
                        <Slider
                          id="section-end"
                          min={0}
                          max={duration}
                          step={0.1}
                          value={[newSectionData.endTime]}
                          onValueChange={values => setNewSectionData({
                            ...newSectionData, 
                            endTime: values[0],
                            startTime: Math.min(values[0] - 0.5, newSectionData.startTime)
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelSectionEdit}
                        className="h-8"
                      >
                        Cancelar
                      </Button>
                      
                      <Button
                        variant="default"
                        size="sm"
                        onClick={saveSection}
                        className="h-8 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <SaveAll className="h-3.5 w-3.5 mr-1" />
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                        onClick={startNewSection}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Nueva Sección
                      </Button>
                    </div>
                    
                    {sectionMarkers.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {sectionMarkers.map(section => (
                          <div 
                            key={section.id}
                            className="flex items-center justify-between p-2 bg-zinc-900 rounded"
                          >
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{backgroundColor: section.color || getSectionColor(section.type)}}
                              />
                              <span className="text-sm">{section.label}</span>
                              <span className="text-xs text-zinc-500 ml-2">
                                {formatTime(section.startTime)} - {formatTime(section.endTime)}
                              </span>
                            </div>
                            
                            <div className="flex space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => editSection(section)}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-zinc-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar sección</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => deleteSection(section.id)}
                                    >
                                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar sección</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-zinc-500 text-sm">
                        No hay secciones definidas
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}