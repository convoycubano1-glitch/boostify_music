import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Video as VideoIcon, 
  Image as ImageIcon, 
  Music
} from 'lucide-react';
import { useEditor } from '@/lib/context/editor-context';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onAudioUpload?: (file: File) => void;
  onVideoUpload?: (files: FileList) => void;
  onImageUpload?: (files: FileList) => void;
  syncWithContext?: boolean;
}

export function FileUploader({ 
  onAudioUpload, 
  onVideoUpload, 
  onImageUpload,
  syncWithContext = true
}: FileUploaderProps) {
  // Obtenemos acceso al contexto del editor
  const editorContext = useEditor();
  const { toast } = useToast();
  
  // Referencias a los inputs de archivos
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Manejar la selección de archivos de audio
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Llamar al callback si está definido
      if (onAudioUpload) {
        onAudioUpload(file);
      }
      
      // Sincronizar con el contexto si está habilitado
      if (syncWithContext) {
        // Crear URL del objeto para acceder al archivo
        const audioUrl = URL.createObjectURL(file);
        
        // Añadir al contexto como pista de audio
        editorContext.addAudioTrack({
          name: file.name,
          url: audioUrl,
          startTime: 0,
          endTime: 180, // Duración predeterminada estimada
          volume: 1,
          muted: false
        });
        
        // Añadir al contexto como asset
        editorContext.addAsset({
          type: 'audio',
          url: audioUrl,
          name: file.name,
          duration: 180 // Duración predeterminada estimada
        });
        
        toast({
          title: "Audio añadido al proyecto",
          description: `El archivo "${file.name}" se ha sincronizado con el editor profesional.`
        });
      }
    }
  };
  
  // Manejar la selección de archivos de video
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      
      // Llamar al callback si está definido
      if (onVideoUpload) {
        onVideoUpload(files);
      }
      
      // Sincronizar con el contexto si está habilitado
      if (syncWithContext) {
        Array.from(files).forEach((file, index) => {
          // Crear URL del objeto para acceder al archivo
          const videoUrl = URL.createObjectURL(file);
          
          // Añadir al contexto como asset
          editorContext.addAsset({
            type: 'video',
            url: videoUrl,
            name: file.name
          });
          
          // Añadir como clip unificado al timeline con el nuevo sistema
          const startTime = index * 10; // Espaciamos los clips
          // Usar el nuevo método addClip para mayor compatibilidad
          editorContext.addClip({
            type: 'video',
            url: videoUrl,
            name: file.name,
            startTime: startTime,
            duration: 10, // Asumimos 10 segundos por defecto
            layer: 1,
            properties: {
              x: 0,
              y: 0,
              width: 1280,
              height: 720,
              opacity: 1
            }
          });
        });
        
        toast({
          title: `${files.length} video(s) añadido(s)`,
          description: `Los videos se han sincronizado con el editor profesional.`
        });
      }
    }
  };
  
  // Manejar la selección de archivos de imagen
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      
      // Llamar al callback si está definido
      if (onImageUpload) {
        onImageUpload(files);
      }
      
      // Sincronizar con el contexto si está habilitado
      if (syncWithContext) {
        Array.from(files).forEach((file, index) => {
          // Crear URL del objeto para acceder al archivo
          const imageUrl = URL.createObjectURL(file);
          
          // Añadir al contexto como asset
          editorContext.addAsset({
            type: 'image',
            url: imageUrl,
            name: file.name,
            thumbnail: imageUrl
          });
          
          // También añadir como clip unificado
          const startTime = index * 5; // Espaciamos las imágenes 
          editorContext.addClip({
            type: 'image',
            url: imageUrl,
            name: file.name,
            startTime: startTime,
            duration: 5, // Duración predeterminada para imágenes
            layer: 1,
            properties: {
              x: 0,
              y: 0,
              width: 1280,
              height: 720,
              opacity: 1
            }
          });
        });
        
        toast({
          title: `${files.length} imagen(es) añadida(s)`,
          description: `Las imágenes se han sincronizado con el editor profesional.`
        });
      }
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