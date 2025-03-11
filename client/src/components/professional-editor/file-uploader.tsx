import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  Music
} from 'lucide-react';

interface FileUploaderProps {
  onAudioUpload: (file: File) => void;
  onVideoUpload: (files: FileList) => void;
  onImageUpload: (files: FileList) => void;
}

export function FileUploader({ 
  onAudioUpload, 
  onVideoUpload, 
  onImageUpload 
}: FileUploaderProps) {
  // Referencias a los inputs de archivos
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Manejar la selección de archivos de audio
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAudioUpload(e.target.files[0]);
    }
  };
  
  // Manejar la selección de archivos de video
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onVideoUpload(e.target.files);
    }
  };
  
  // Manejar la selección de archivos de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageUpload(e.target.files);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      {/* Input oculto para archivos de audio */}
      <input
        type="file"
        ref={audioInputRef}
        className="hidden"
        accept="audio/*"
        onChange={handleAudioSelect}
      />
      
      {/* Input oculto para archivos de video */}
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        multiple
        onChange={handleVideoSelect}
      />
      
      {/* Input oculto para archivos de imagen */}
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        multiple
        onChange={handleImageSelect}
      />
      
      {/* Botón para subir canción (audio) */}
      <Button
        variant="outline"
        className="h-auto py-3 flex flex-col items-center justify-center gap-2"
        onClick={() => audioInputRef.current?.click()}
      >
        <Music className="h-8 w-8 text-orange-500" />
        <div className="flex flex-col items-center text-center">
          <span className="font-medium">Música / Audio</span>
          <span className="text-xs text-muted-foreground">Sube la canción principal</span>
        </div>
      </Button>
      
      {/* Botón para subir videos */}
      <Button
        variant="outline"
        className="h-auto py-3 flex flex-col items-center justify-center gap-2"
        onClick={() => videoInputRef.current?.click()}
      >
        <VideoIcon className="h-8 w-8 text-blue-500" />
        <div className="flex flex-col items-center text-center">
          <span className="font-medium">Videos</span>
          <span className="text-xs text-muted-foreground">Sube clips de video b-roll</span>
        </div>
      </Button>
      
      {/* Botón para subir imágenes */}
      <Button
        variant="outline"
        className="h-auto py-3 flex flex-col items-center justify-center gap-2"
        onClick={() => imageInputRef.current?.click()}
      >
        <ImageIcon className="h-8 w-8 text-purple-500" />
        <div className="flex flex-col items-center text-center">
          <span className="font-medium">Imágenes</span>
          <span className="text-xs text-muted-foreground">Sube fotos o gráficos</span>
        </div>
      </Button>
    </div>
  );
}