import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Maximize2
} from 'lucide-react';

interface VideoPreviewPanelProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  selectedClipId: number | null;
  clips: Array<{
    id: number;
    title: string;
    thumbnail: string | null;
    type: string;
  }>;
}

export function VideoPreviewPanel({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  selectedClipId,
  clips
}: VideoPreviewPanelProps) {
  // Encontrar la imagen a mostrar en la vista previa
  const getPreviewImage = () => {
    if (selectedClipId !== null) {
      const selectedClip = clips.find(clip => clip.id === selectedClipId);
      if (selectedClip && selectedClip.thumbnail) {
        return selectedClip.thumbnail;
      }
    }
    
    // Si no hay clip seleccionado, mostrar cualquier imagen disponible
    const clipWithThumbnail = clips.find(clip => clip.thumbnail);
    return clipWithThumbnail?.thumbnail || null;
  };
  
  const previewImage = getPreviewImage();
  
  // Formatear tiempo actual
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calcular el porcentaje de progreso para el slider
  const progressPercentage = (currentTime / duration) * 100;

  return (
    <Card className="p-4 flex flex-col">
      <div className="relative aspect-video bg-black/50 rounded-md overflow-hidden mb-4">
        {previewImage ? (
          <img 
            src={previewImage} 
            alt="Vista previa"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            Vista previa no disponible
          </div>
        )}
        
        {/* Barra de progreso sobre el video */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-orange-500"
            style={{ width: `${progressPercentage}%` }}  
          />
        </div>
        
        {/* Controles flotantes */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => {}}
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
            onClick={() => {}}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Botones flotantes esquina */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white bg-black/30 hover:bg-black/50"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white bg-black/30 hover:bg-black/50"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Información y controles bajo el video */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedClipId 
              ? clips.find(c => c.id === selectedClipId)?.title 
              : "Vista previa del proyecto"}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        
        <Slider
          value={[progressPercentage]}
          max={100}
          step={0.1}
          className="cursor-pointer"
          onValueChange={(values) => {
            // Este sería el lugar para implementar la actualización del tiempo
            // basado en el valor del slider. Sin embargo, esto requeriría
            // referencias a funciones del componente padre.
          }}
        />
      </div>
    </Card>
  );
}