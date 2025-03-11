import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Crop,
  RotateCw,
  ZoomIn,
  Camera,
  Layers,
  SlidersHorizontal,
  ListVideo,
  MessageSquare,
  Share2,
  Download,
  Scissors,
  Settings,
  ArrowLeftRight
} from 'lucide-react';

interface VideoPreviewPanelProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onTimeUpdate?: (time: number) => void;
  selectedClipId: number | null;
  clips: Array<any>;
  onSeek?: (time: number) => void;
  onClipUpdate?: (clipId: number, updates: any) => void;
  onExport?: (format: string, quality: string) => void;
  onTakeSnapshot?: () => void;
  audioVolume?: number;
  onVolumeChange?: (volume: number) => void;
}

export function VideoPreviewPanel({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onTimeUpdate,
  selectedClipId,
  clips,
  onSeek,
  onClipUpdate,
  onExport,
  onTakeSnapshot,
  audioVolume = 1,
  onVolumeChange
}: VideoPreviewPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState<'normal' | 'sideBySide' | 'beforeAfter'>('normal');
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(audioVolume * 100);
  const [isMuted, setIsMuted] = useState(false);
  const [exportFormat, setExportFormat] = useState('mp4');
  const [exportQuality, setExportQuality] = useState('high');
  const [filterPreview, setFilterPreview] = useState(true);
  const [previewScale, setPreviewScale] = useState(1);
  const [annotations, setAnnotations] = useState<Array<{x: number, y: number, text: string}>>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [editingClipInfo, setEditingClipInfo] = useState<{
    speed: number;
    rotation: number;
    crop: { x: number, y: number, width: number, height: number } | null;
  }>({
    speed: 1.0,
    rotation: 0,
    crop: null
  });

  // Actualizar el volumen cuando cambia la prop 
  useEffect(() => {
    setVolume(audioVolume * 100);
  }, [audioVolume]);
  
  // Encontrar el clip activo para la vista previa
  const getActiveClip = () => {
    if (selectedClipId !== null) {
      return clips.find(clip => clip.id === selectedClipId);
    }
    
    // Si no hay clip seleccionado, encontrar el clip que contiene el tiempo actual
    return clips.find(clip => 
      clip.start <= currentTime && clip.start + clip.duration >= currentTime
    );
  };
  
  const activeClip = getActiveClip();
  
  // Obtener la imagen o video para mostrar en la vista previa
  const getPreviewContent = () => {
    if (!activeClip) return null;
    
    if (activeClip.type === 'video') {
      return {
        type: 'video',
        url: activeClip.videoUrl || `/assets/sample-videos/${activeClip.id % 5 + 1}.mp4`,
        thumbnail: activeClip.thumbnail || null
      };
    }
    
    if (activeClip.type === 'image') {
      return {
        type: 'image',
        url: activeClip.imageUrl || activeClip.thumbnail || `/assets/sample-images/${activeClip.id % 3 + 1}.jpg`
      };
    }
    
    if (activeClip.type === 'text') {
      // Para elementos de texto, renderizamos un fondo con el texto
      return {
        type: 'text',
        content: activeClip.content || 'Texto del título',
        style: activeClip.textStyle || {
          fontFamily: 'Arial',
          fontSize: 48,
          color: '#FFFFFF'
        }
      };
    }
    
    // Si es un efecto o transición, mostrar un indicador visual
    return {
      type: 'effect',
      effectType: activeClip.effectType || 'transition'
    };
  };
  
  const previewContent = getPreviewContent();
  
  // Formatear tiempo actual
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calcular el porcentaje de progreso para el slider
  const progressPercentage = (currentTime / duration) * 100;

  // Función para cambiar la posición del tiempo actual
  const handleSeek = (value: number) => {
    const newTime = (value / 100) * duration;
    if (onSeek) {
      onSeek(newTime);
    } else if (onTimeUpdate) {
      onTimeUpdate(newTime);
    }
  };
  
  // Función para saltar al clip anterior/siguiente
  const jumpToPrevClip = () => {
    const currentClips = [...clips].sort((a, b) => a.start - b.start);
    const currentIndex = currentClips.findIndex(clip => clip.start > currentTime) - 1;
    
    if (currentIndex >= 0) {
      const prevClip = currentClips[currentIndex];
      if (onSeek) {
        onSeek(prevClip.start);
      }
    } else {
      // Si estamos antes de todos los clips, vamos al inicio
      if (onSeek) {
        onSeek(0);
      }
    }
  };
  
  const jumpToNextClip = () => {
    const currentClips = [...clips].sort((a, b) => a.start - b.start);
    const currentIndex = currentClips.findIndex(clip => clip.start > currentTime);
    
    if (currentIndex >= 0 && currentIndex < currentClips.length) {
      const nextClip = currentClips[currentIndex];
      if (onSeek) {
        onSeek(nextClip.start);
      }
    } else {
      // Si estamos después de todos los clips, vamos al final
      if (onSeek) {
        onSeek(duration);
      }
    }
  };
  
  // Manejar cambios de volumen
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (onVolumeChange) {
      onVolumeChange(value / 100);
    }
    
    // Si cambiamos de volumen cero a mayor, desmutear
    if (value > 0 && isMuted) {
      setIsMuted(false);
    }
  };
  
  // Función para tomar un snapshot
  const takeSnapshot = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Dibujar el frame actual del video en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir el canvas a una imagen
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        // Aquí puedes guardar la imagen o enviarla a algún servicio
        if (onTakeSnapshot) {
          onTakeSnapshot();
        } else {
          // Fallback: descargar la imagen
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `snapshot-${new Date().toISOString()}.jpg`;
          link.click();
        }
      }
    }
  };
  
  // Actualizar las propiedades del clip seleccionado
  const updateSelectedClip = (updates: any) => {
    if (selectedClipId && onClipUpdate) {
      onClipUpdate(selectedClipId, updates);
    }
  };
  
  // Función para exportar el video con la calidad y formato seleccionados
  const handleExport = () => {
    if (onExport) {
      onExport(exportFormat, exportQuality);
    }
  };
  
  // Renderizar filtros visuales para la vista previa
  const getFilterStyle = () => {
    if (!filterPreview || !activeClip || !activeClip.filters || activeClip.filters.length === 0) {
      return {};
    }
    
    let filterString = '';
    let transformString = '';
    
    // Aplicar filtros CSS basados en los filtros del clip
    activeClip.filters.forEach((filter: any) => {
      if (!filter.enabled) return;
      
      switch (filter.id) {
        case 'brightness':
          filterString += `brightness(${filter.value + 1}) `;
          break;
        case 'contrast':
          filterString += `contrast(${filter.value + 1}) `;
          break;
        case 'saturation':
          filterString += `saturate(${filter.value}) `;
          break;
        case 'hue':
          filterString += `hue-rotate(${filter.value}deg) `;
          break;
        case 'blur':
          filterString += `blur(${filter.value * 5}px) `;
          break;
        case 'sepia':
          filterString += `sepia(${filter.value}) `;
          break;
        case 'grayscale':
        case 'b&w':
          filterString += `grayscale(1) `;
          break;
        default:
          break;
      }
    });
    
    // Aplicar transformaciones
    if (editingClipInfo.rotation !== 0) {
      transformString += `rotate(${editingClipInfo.rotation}deg) `;
    }
    
    if (editingClipInfo.speed !== 1.0 && videoRef.current) {
      videoRef.current.playbackRate = editingClipInfo.speed;
    }
    
    return {
      filter: filterString,
      transform: transformString
    };
  };
  
  const filterStyle = getFilterStyle();
  
  // Función para renderizar las anotaciones sobre el video
  const renderAnnotations = () => {
    if (!showAnnotations || annotations.length === 0) return null;
    
    return annotations.map((annotation, index) => (
      <div 
        key={`annotation-${index}`}
        className="absolute flex items-center justify-center"
        style={{
          left: `${annotation.x * 100}%`,
          top: `${annotation.y * 100}%`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs z-20">
          {index + 1}
        </div>
        <div className="absolute top-7 bg-black/70 text-white p-1 rounded text-xs min-w-[100px] text-center">
          {annotation.text}
        </div>
      </div>
    ));
  };

  return (
    <Card className="p-4 flex flex-col">
      <div className="relative aspect-video bg-black rounded-md overflow-hidden mb-4">
        {previewContent?.type === 'video' && (
          <video 
            ref={videoRef}
            src={previewContent.url}
            className="w-full h-full object-contain"
            style={{ 
              filter: filterStyle.filter || 'none',
              transform: filterStyle.transform || 'none',
              transformOrigin: 'center center',
              scale: `${previewScale}`
            }}
            autoPlay={isPlaying}
            loop
            muted={isMuted}
            playsInline
          />
        )}
        
        {previewContent?.type === 'image' && (
          <img 
            src={previewContent.url} 
            alt="Vista previa"
            className="w-full h-full object-contain"
            style={{ 
              filter: filterStyle.filter || 'none',
              transform: filterStyle.transform || 'none',
              transformOrigin: 'center center',
              scale: `${previewScale}`
            }}
          />
        )}
        
        {previewContent?.type === 'text' && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700"
            style={{ filter: filterStyle.filter || 'none' }}
          >
            <p
              style={{
                fontFamily: previewContent.style.fontFamily,
                fontSize: `${previewContent.style.fontSize}px`,
                color: previewContent.style.color,
                fontWeight: previewContent.style.fontWeight || 'normal',
                textShadow: previewContent.style.shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
                textAlign: previewContent.style.alignment || 'center',
                transform: filterStyle.transform || 'none',
                transformOrigin: 'center center',
                scale: `${previewScale}`
              }}
            >
              {previewContent.content}
            </p>
          </div>
        )}
        
        {previewContent?.type === 'effect' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700">
            <div className="text-white text-center">
              <p className="font-semibold text-lg mb-1">
                {previewContent.effectType === 'transition' ? 'Transición' : 'Efecto'}
              </p>
              <p className="text-sm opacity-80">
                {activeClip?.title || 'Efectos visuales'}
              </p>
            </div>
          </div>
        )}
        
        {!previewContent && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-800">
            <div className="text-center">
              <p className="mb-2">Vista previa no disponible</p>
              <p className="text-sm text-gray-500">Selecciona un clip o sube contenido</p>
            </div>
          </div>
        )}
        
        {/* Canvas para tomar snapshots (oculto) */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Anotaciones sobre el video */}
        {renderAnnotations()}
        
        {/* Barra de progreso sobre el video */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 z-10">
          <div 
            className="h-full bg-orange-500"
            style={{ width: `${progressPercentage}%` }}  
          />
        </div>
        
        {/* Capa para mostrar el modo antes/después */}
        {previewMode === 'beforeAfter' && (
          <div className="absolute inset-0 overflow-hidden z-10">
            <div 
              className="absolute top-0 bottom-0 bg-black/40 h-full flex items-center justify-center overflow-hidden"
              style={{ left: 0, width: '50%', borderRight: '2px solid white' }}
            >
              <span className="text-white font-medium bg-black/50 px-2 py-1 rounded">Original</span>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full z-10 flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
        )}
        
        {/* Controles flotantes */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={jumpToPrevClip}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/20"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={jumpToNextClip}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Botones flotantes esquina superior */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white bg-black/30 hover:bg-black/50"
              onClick={() => setShowVolume(!showVolume)}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            {showVolume && (
              <div className="absolute right-0 top-full mt-1 bg-black/70 p-2 rounded-md w-36">
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  className="mb-2"
                  onValueChange={(values) => handleVolumeChange(values[0])}
                />
                <div className="flex items-center justify-between">
                  <label className="text-white text-xs flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      className="h-3 w-3" 
                      checked={isMuted}
                      onChange={() => setIsMuted(!isMuted)}
                    />
                    Silencio
                  </label>
                  <span className="text-white text-xs">{Math.round(volume)}%</span>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white bg-black/30 hover:bg-black/50"
            onClick={() => setPreviewScale(prev => prev === 1 ? 1.5 : 1)}
            title="Alternar zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white bg-black/30 hover:bg-black/50"
            onClick={takeSnapshot}
            title="Capturar fotograma"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white bg-black/30 hover:bg-black/50"
            onClick={() => setShowSettings(!showSettings)}
            title="Configuración"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Panel de configuración */}
        {showSettings && (
          <div className="absolute top-12 right-2 bg-black/80 p-3 rounded-md z-20 w-64">
            <h4 className="text-white text-sm font-medium mb-2">Configuración de vista previa</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-white text-xs block mb-1">Modo de visualización</label>
                <Select 
                  value={previewMode}
                  onValueChange={(value: any) => setPreviewMode(value)}
                >
                  <SelectTrigger className="bg-black/50 text-white border-gray-700 h-8">
                    <SelectValue placeholder="Modo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="sideBySide">Lado a lado</SelectItem>
                    <SelectItem value="beforeAfter">Antes/Después</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-white text-xs">Mostrar filtros</label>
                <Switch 
                  checked={filterPreview} 
                  onCheckedChange={setFilterPreview} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-white text-xs">Mostrar anotaciones</label>
                <Switch 
                  checked={showAnnotations} 
                  onCheckedChange={setShowAnnotations} 
                />
              </div>
              
              <div>
                <label className="text-white text-xs block mb-1">Formato de exportación</label>
                <Select 
                  value={exportFormat}
                  onValueChange={setExportFormat}
                >
                  <SelectTrigger className="bg-black/50 text-white border-gray-700 h-8">
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4 - H.264</SelectItem>
                    <SelectItem value="webm">WebM - VP9</SelectItem>
                    <SelectItem value="gif">GIF Animado</SelectItem>
                    <SelectItem value="mov">QuickTime MOV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-white text-xs block mb-1">Calidad de exportación</label>
                <Select 
                  value={exportQuality}
                  onValueChange={setExportQuality}
                >
                  <SelectTrigger className="bg-black/50 text-white border-gray-700 h-8">
                    <SelectValue placeholder="Calidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja (720p)</SelectItem>
                    <SelectItem value="medium">Media (1080p)</SelectItem>
                    <SelectItem value="high">Alta (2K)</SelectItem>
                    <SelectItem value="ultra">Ultra (4K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-1.5" /> Exportar video
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Información y controles bajo el video */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate max-w-[300px]">
              {activeClip 
                ? activeClip.title 
                : "Vista previa del proyecto"}
            </p>
            {activeClip?.resolution && (
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                {activeClip.resolution}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          <Slider
            value={[progressPercentage]}
            max={100}
            step={0.1}
            className="flex-grow cursor-pointer"
            onValueChange={(values) => handleSeek(values[0])}
          />
        </div>
        
        {/* Controles adicionales para editar el clip seleccionado */}
        {selectedClipId && (
          <Tabs defaultValue="playback" className="mt-2">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="playback">
                <ListVideo className="h-3.5 w-3.5 mr-1.5" /> Reproducción
              </TabsTrigger>
              <TabsTrigger value="transform">
                <Crop className="h-3.5 w-3.5 mr-1.5" /> Transformación
              </TabsTrigger>
              <TabsTrigger value="effects">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" /> Efectos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="playback" className="mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Velocidad
                  </label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[editingClipInfo.speed * 100]}
                      min={25}
                      max={200}
                      step={5}
                      className="flex-grow"
                      onValueChange={(values) => {
                        const newSpeed = values[0] / 100;
                        setEditingClipInfo({...editingClipInfo, speed: newSpeed});
                      }}
                      onValueCommit={() => {
                        updateSelectedClip({speed: editingClipInfo.speed});
                      }}
                    />
                    <span className="text-xs w-12 text-right">{editingClipInfo.speed.toFixed(2)}x</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Volumen
                  </label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-grow"
                      onValueChange={(values) => handleVolumeChange(values[0])}
                    />
                    <span className="text-xs w-8 text-right">{Math.round(volume)}%</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="transform" className="mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Rotación
                  </label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[editingClipInfo.rotation + 180]}
                      min={0}
                      max={360}
                      step={1}
                      className="flex-grow"
                      onValueChange={(values) => {
                        const newRotation = values[0] - 180;
                        setEditingClipInfo({...editingClipInfo, rotation: newRotation});
                      }}
                      onValueCommit={() => {
                        updateSelectedClip({rotation: editingClipInfo.rotation});
                      }}
                    />
                    <span className="text-xs w-8 text-right">{editingClipInfo.rotation}°</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Escala
                  </label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[previewScale * 100]}
                      min={50}
                      max={200}
                      step={5}
                      className="flex-grow"
                      onValueChange={(values) => {
                        setPreviewScale(values[0] / 100);
                      }}
                      onValueCommit={() => {
                        updateSelectedClip({scale: previewScale});
                      }}
                    />
                    <span className="text-xs w-8 text-right">{Math.round(previewScale * 100)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingClipInfo({
                      ...editingClipInfo,
                      rotation: 0
                    });
                    updateSelectedClip({rotation: 0});
                  }}
                >
                  <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                  Restablecer
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="effects" className="mt-2">
              <div className="text-sm text-center py-3 text-muted-foreground">
                Para editar los efectos, utiliza el panel de efectos en la sección correspondiente.
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Card>
  );
}