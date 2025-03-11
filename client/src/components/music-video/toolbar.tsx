import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Video, 
  Image,
  Music, 
  Type, 
  Wand2, 
  Scissors, 
  Copy, 
  Split, 
  Trash, 
  Undo, 
  Redo,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ToolbarProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAddClip: (type: 'video' | 'image' | 'audio' | 'text' | 'effect' | 'transition') => void;
  onRemoveClip?: () => void;
  onCutClip?: () => void;
  onSplitClip?: () => void;
  onCopyClip?: () => void;
  onExportVideo?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  selectedClipId: string | null;
}

export function Toolbar({
  isPlaying,
  onPlayPause,
  onZoomIn,
  onZoomOut,
  onAddClip,
  onRemoveClip,
  onCutClip,
  onSplitClip,
  onCopyClip,
  onExportVideo,
  onUndo,
  onRedo,
  selectedClipId
}: ToolbarProps) {
  // Determinar si los botones de edición deberían estar deshabilitados
  const editingDisabled = !selectedClipId;
  
  return (
    <div className="flex items-center space-x-1">
      {/* Sección de reproducción */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              className="h-8 w-8"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isPlaying ? 'Pausar' : 'Reproducir'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Separador */}
      <div className="h-6 w-px bg-gray-500 opacity-40 mx-1" />
      
      {/* Sección de zoom */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomIn}
              className="h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ampliar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onZoomOut}
              className="h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reducir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Separador */}
      <div className="h-6 w-px bg-gray-500 opacity-40 mx-1" />
      
      {/* Botón de agregar con menú desplegable */}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Añadir elemento</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onAddClip('video')}>
            <Video className="h-4 w-4 mr-2" />
            <span>Añadir video</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddClip('image')}>
            <Image className="h-4 w-4 mr-2" />
            <span>Añadir imagen</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddClip('audio')}>
            <Music className="h-4 w-4 mr-2" />
            <span>Añadir audio</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddClip('text')}>
            <Type className="h-4 w-4 mr-2" />
            <span>Añadir texto</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddClip('effect')}>
            <Wand2 className="h-4 w-4 mr-2" />
            <span>Añadir efecto</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddClip('transition')}>
            <div className="h-4 w-4 mr-2 flex items-center justify-center font-bold text-xs">T</div>
            <span>Añadir transición</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Botones de edición */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCutClip}
              disabled={editingDisabled}
              className={`h-8 w-8 ${editingDisabled ? 'opacity-50' : ''}`}
            >
              <Scissors className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cortar selección</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSplitClip}
              disabled={editingDisabled}
              className={`h-8 w-8 ${editingDisabled ? 'opacity-50' : ''}`}
            >
              <Split className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Dividir clip</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopyClip}
              disabled={editingDisabled}
              className={`h-8 w-8 ${editingDisabled ? 'opacity-50' : ''}`}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Duplicar clip</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemoveClip}
              disabled={editingDisabled}
              className={`h-8 w-8 ${editingDisabled ? 'opacity-50' : ''}`}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar clip</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Separador */}
      <div className="h-6 w-px bg-gray-500 opacity-40 mx-1" />
      
      {/* Deshacer/Rehacer */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              className="h-8 w-8"
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Deshacer</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              className="h-8 w-8"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Rehacer</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Separador */}
      <div className="h-6 w-px bg-gray-500 opacity-40 mx-1" />
      
      {/* Exportar */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportVideo}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Exportar video</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}