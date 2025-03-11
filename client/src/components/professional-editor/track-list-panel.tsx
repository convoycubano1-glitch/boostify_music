import React, { useState } from 'react';
import { 
  List, 
  PlusCircle, 
  Mic, 
  Settings,
  ChevronDown,
  ChevronUp,
  Music,
  Video,
  Image,
  FileAudio,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  color?: string;
  muted?: boolean;
  locked?: boolean;
  visible?: boolean;
}

export interface TrackListPanelProps {
  tracks: Track[];
  onAddTrack: (trackType: string) => void;
  onRecordAudio: () => void;
  onToggleTrackVisibility: (trackId: string) => void;
  onToggleTrackLock: (trackId: string) => void;
  onToggleTrackMute: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onReorderTracks: (startIndex: number, endIndex: number) => void;
  language?: 'es' | 'en';
}

export const TrackListPanel: React.FC<TrackListPanelProps> = ({
  tracks,
  onAddTrack,
  onRecordAudio,
  onToggleTrackVisibility,
  onToggleTrackLock,
  onToggleTrackMute,
  onDeleteTrack,
  onReorderTracks,
  language = 'es'
}) => {
  const [expanded, setExpanded] = useState(true);
  
  // Traducciones
  const texts = {
    es: {
      trackList: 'Lista de pistas',
      addTrack: 'Añadir pista',
      record: 'Grabar',
      settings: 'Ajustes',
      videoTrack: 'Pista de video',
      audioTrack: 'Pista de audio',
      imageTrack: 'Pista de imagen',
      textTrack: 'Pista de texto',
      addVideoTrack: 'Añadir pista de video',
      addAudioTrack: 'Añadir pista de audio',
      addImageTrack: 'Añadir pista de imagen',
      addTextTrack: 'Añadir pista de texto'
    },
    en: {
      trackList: 'Track list',
      addTrack: 'Add track',
      record: 'Record',
      settings: 'Settings',
      videoTrack: 'Video track',
      audioTrack: 'Audio track',
      imageTrack: 'Image track',
      textTrack: 'Text track',
      addVideoTrack: 'Add video track',
      addAudioTrack: 'Add audio track',
      addImageTrack: 'Add image track',
      addTextTrack: 'Add text track'
    }
  };
  
  const t = texts[language] || texts.en;
  
  // Función para renderizar el ícono de tipo de pista
  const renderTrackTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={16} className="text-blue-400" />;
      case 'audio':
        return <Music size={16} className="text-green-400" />;
      case 'image':
        return <Image size={16} className="text-purple-400" />;
      case 'text':
        return <FileAudio size={16} className="text-yellow-400" />;
      default:
        return <Layers size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="track-list-panel bg-zinc-900 border-t border-zinc-800">
      {/* Cabecera de panel de pistas - Estilo CapCut */}
      <div className="flex items-center justify-between py-2 px-4 bg-zinc-800">
        <div className="flex items-center space-x-2">
          <List size={18} className="text-zinc-400" />
          <h3 className="text-sm font-medium text-white">{t.trackList}</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-zinc-400 hover:text-white"
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Contenido del panel de pistas */}
      {expanded && (
        <div className="p-2">
          {/* Barra de herramientas de pistas - Estilo CapCut */}
          <div className="flex items-center justify-between mb-3 space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-orange-600 hover:bg-orange-700 text-white border-none rounded-full flex-1"
                >
                  <PlusCircle size={15} className="mr-1" /> {t.addTrack}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-zinc-900 border-t border-zinc-800">
                <SheetHeader>
                  <SheetTitle className="text-white">{t.addTrack}</SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-800 hover:bg-blue-600/30" onClick={() => onAddTrack('video')}>
                    <Video size={18} className="mr-2" /> {t.videoTrack}
                  </Button>
                  <Button variant="outline" className="bg-green-600/20 text-green-400 border-green-800 hover:bg-green-600/30" onClick={() => onAddTrack('audio')}>
                    <Music size={18} className="mr-2" /> {t.audioTrack}
                  </Button>
                  <Button variant="outline" className="bg-purple-600/20 text-purple-400 border-purple-800 hover:bg-purple-600/30" onClick={() => onAddTrack('image')}>
                    <Image size={18} className="mr-2" /> {t.imageTrack}
                  </Button>
                  <Button variant="outline" className="bg-yellow-600/20 text-yellow-400 border-yellow-800 hover:bg-yellow-600/30" onClick={() => onAddTrack('text')}>
                    <FileAudio size={18} className="mr-2" /> {t.textTrack}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-zinc-800 hover:bg-zinc-700 border-none rounded-full w-10 h-10 p-0">
                    <Mic size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t.record}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-zinc-800 hover:bg-zinc-700 border-none rounded-full w-10 h-10 p-0">
                    <Settings size={15} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t.settings}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Lista de pistas - Estilo CapCut */}
          <div className="space-y-2 mt-2">
            {tracks.length === 0 && (
              <div className="text-center py-4 text-zinc-500 text-sm">
                {language === 'es' ? 'No hay pistas. Añade una nueva pista haciendo clic en "Añadir pista"' : 'No tracks. Add a new track by clicking "Add track"'}
              </div>
            )}
            
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center p-2 bg-zinc-800 rounded-md"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('trackIndex', index.toString());
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const startIndex = parseInt(e.dataTransfer.getData('trackIndex'));
                  onReorderTracks(startIndex, index);
                }}
              >
                <div className="flex-shrink-0 mr-2">
                  {renderTrackTypeIcon(track.type)}
                </div>
                <div className="flex-grow font-medium text-sm truncate text-white">
                  {track.name}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onToggleTrackVisibility(track.id)}
                    className={`p-1 rounded-full ${track.visible ? 'text-blue-400' : 'text-zinc-500'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onToggleTrackLock(track.id)}
                    className={`p-1 rounded-full ${track.locked ? 'text-red-400' : 'text-zinc-500'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onToggleTrackMute(track.id)}
                    className={`p-1 rounded-full ${track.muted ? 'text-yellow-400' : 'text-zinc-500'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12ZM19 12C19 15.53 16.39 18.44 13 18.93V21H11V18.93C7.61 18.44 5 15.53 5 12H7C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12H19ZM12 3C14.76 3 17 5.24 17 8H7C7 5.24 9.24 3 12 3ZM12 1C8.13 1 5 4.13 5 8H3C3 4.13 6.13 1 10 1H12Z" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteTrack(track.id)}
                    className="p-1 rounded-full text-zinc-500 hover:text-red-500"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackListPanel;