import React, { useState } from 'react';
import { useEditor } from '@/lib/context/editor-context';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Save,
  Download,
  Settings,
  Video,
  Music,
  Image,
  Type,
  Wand2,
  Camera,
  Clock,
  Text,
  Layers,
  FileVideo,
  PlusCircle,
  Scissors,
  PanelRight,
  ScreenShare,
  Mic,
  Brush,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  Upload
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

export interface ToolbarProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  language?: 'es' | 'en';
  onZoom?: (level: number) => void;
  currentZoom?: number;
}

// Textos localizados
const localizedText = {
  efectos: {
    es: 'Efectos',
    en: 'Effects'
  },
  audio: {
    es: 'Audio',
    en: 'Audio'
  },
  ritmo: {
    es: 'Ritmo',
    en: 'Rhythm'
  },
  texto: {
    es: 'Texto',
    en: 'Text'
  },
  efectosVisuales: {
    es: 'Efectos Visuales',
    en: 'Visual Effects'
  },
  añadirEfecto: {
    es: 'Añadir efecto',
    en: 'Add effect'
  },
  lineaTiempo: {
    es: 'Línea de Tiempo',
    en: 'Timeline'
  },
  activos: {
    es: 'Activos',
    en: 'Assets'
  },
  grabar: {
    es: 'Grabar',
    en: 'Record'
  },
  camara: {
    es: 'Cámara',
    en: 'Camera'
  },
  importar: {
    es: 'Importar',
    en: 'Import'
  },
  exportar: {
    es: 'Exportar',
    en: 'Export'
  },
  guardar: {
    es: 'Guardar',
    en: 'Save'
  },
  configuracion: {
    es: 'Configuración',
    en: 'Settings'
  },
  deshacer: {
    es: 'Deshacer',
    en: 'Undo'
  },
  rehacer: {
    es: 'Rehacer',
    en: 'Redo'
  },
  cortar: {
    es: 'Cortar',
    en: 'Cut'
  },
  dividir: {
    es: 'Dividir',
    en: 'Split'
  },
  titulo: {
    es: 'Título',
    en: 'Title'
  },
  subtitulo: {
    es: 'Subtítulo',
    en: 'Subtitle'
  },
  musica: {
    es: 'Música',
    en: 'Music'
  },
  voz: {
    es: 'Voz',
    en: 'Voice'
  },
  transicion: {
    es: 'Transición',
    en: 'Transition'
  },
  filtro: {
    es: 'Filtro',
    en: 'Filter'
  },
  animacion: {
    es: 'Animación',
    en: 'Animation'
  },
  velocidad: {
    es: 'Velocidad',
    en: 'Speed'
  },
  volumen: {
    es: 'Volumen',
    en: 'Volume'
  },
  tono: {
    es: 'Tono',
    en: 'Pitch'
  },
  color: {
    es: 'Color',
    en: 'Color'
  },
  brillo: {
    es: 'Brillo',
    en: 'Brightness'
  },
  contraste: {
    es: 'Contraste',
    en: 'Contrast'
  },
  saturacion: {
    es: 'Saturación',
    en: 'Saturation'
  },
  desenfoque: {
    es: 'Desenfoque',
    en: 'Blur'
  },
  recorte: {
    es: 'Recorte',
    en: 'Crop'
  },
  rotar: {
    es: 'Rotar',
    en: 'Rotate'
  },
  girar: {
    es: 'Girar',
    en: 'Flip'
  },
  normal: {
    es: 'Normal',
    en: 'Normal'
  },
  lento: {
    es: 'Lento',
    en: 'Slow'
  },
  rapido: {
    es: 'Rápido',
    en: 'Fast'
  },
  pantallaCompleta: {
    es: 'Pantalla completa',
    en: 'Fullscreen'
  },
  acercar: {
    es: 'Acercar',
    en: 'Zoom in'
  },
  alejar: {
    es: 'Alejar',
    en: 'Zoom out'
  },
  compartir: {
    es: 'Compartir',
    en: 'Share'
  },
  reproducir: {
    es: 'Reproducir',
    en: 'Play'
  },
  pausar: {
    es: 'Pausar',
    en: 'Pause'
  },
  reiniciar: {
    es: 'Reiniciar',
    en: 'Reset'
  }
};

export function Toolbar({
  orientation = 'horizontal',
  className,
  language = 'es',
  onZoom,
  currentZoom = 1
}: ToolbarProps) {
  const { 
    state, 
    play, 
    pause, 
    seek, 
    undo, 
    redo, 
    saveProject,
    exportProject 
  } = useEditor();
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Controlar la reproducción
  const togglePlayback = () => {
    if (state.playhead.isPlaying) {
      pause();
    } else {
      play();
    }
  };
  
  // Ir al inicio
  const goToStart = () => {
    seek(0);
  };
  
  // Saltar adelante 5 segundos
  const skipForward = () => {
    const newTime = Math.min(
      (state.project?.duration || 60),
      state.playhead.time + 5
    );
    seek(newTime);
  };
  
  // Saltar atrás 5 segundos
  const skipBackward = () => {
    const newTime = Math.max(0, state.playhead.time - 5);
    seek(newTime);
  };
  
  // Guardar el proyecto
  const handleSave = async () => {
    const saved = await saveProject();
    
    // Aquí podríamos mostrar una notificación de éxito/error
    console.log('Proyecto guardado:', saved);
  };
  
  // Exportar el proyecto
  const handleExport = async () => {
    try {
      const url = await exportProject();
      
      // Aquí podríamos mostrar una notificación de éxito con el enlace
      console.log('Proyecto exportado:', url);
    } catch (error) {
      // Aquí podríamos mostrar una notificación de error
      console.error('Error al exportar:', error);
    }
  };
  
  // Cambiar el nivel de zoom
  const handleZoomChange = (newZoom: number) => {
    if (onZoom) {
      onZoom(newZoom);
    }
  };
  
  // Determinar si un menú está activo
  const isMenuActive = (menuId: string) => activeMenu === menuId;
  
  // Alternar un menú
  const toggleMenu = (menuId: string) => {
    setActiveMenu(isMenuActive(menuId) ? null : menuId);
  };
  
  // Obtener el texto localizado
  const getText = (key: keyof typeof localizedText) => {
    return localizedText[key][language];
  };
  
  // Renderizar la barra de herramientas horizontal
  const renderHorizontalToolbar = () => (
    <div className={cn("flex items-center gap-2 p-2 bg-card border-b", className)}>
      {/* Botones principales */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('guardar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Separator orientation="vertical" className="h-6" />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={undo}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('deshacer')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={redo}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('rehacer')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Separator orientation="vertical" className="h-6" />
      </div>
      
      {/* Controles de reproducción */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={goToStart}>
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{language === 'es' ? 'Ir al inicio' : 'Go to start'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={skipBackward}>
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{language === 'es' ? 'Retroceder 5s' : 'Back 5s'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={state.playhead.isPlaying ? "default" : "outline"} size="icon" onClick={togglePlayback}>
                {state.playhead.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{state.playhead.isPlaying ? getText('pausar') : getText('reproducir')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={skipForward}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{language === 'es' ? 'Avanzar 5s' : 'Forward 5s'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Separator orientation="vertical" className="h-6 ml-1" />
      </div>
      
      {/* Menús desplegables */}
      <div className="flex-1 flex items-center gap-1">
        {/* Menú de Efectos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('efectos') ? 'bg-accent' : ''}>
              <Wand2 className="h-4 w-4 mr-1" />
              {getText('efectos')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Image className="h-4 w-4 mr-2" />
                {getText('filtro')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Brush className="h-4 w-4 mr-2" />
                {getText('color')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wand2 className="h-4 w-4 mr-2" />
                {getText('transicion')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Menú de Audio */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('audio') ? 'bg-accent' : ''}>
              <Music className="h-4 w-4 mr-1" />
              {getText('audio')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Music className="h-4 w-4 mr-2" />
                {getText('musica')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mic className="h-4 w-4 mr-2" />
                {getText('voz')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Ajustes de audio' : 'Audio settings'}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    {getText('volumen')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {getText('velocidad')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {getText('tono')}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Menú de Ritmo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('ritmo') ? 'bg-accent' : ''}>
              <Clock className="h-4 w-4 mr-1" />
              {getText('ritmo')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Análisis de ritmo' : 'Rhythm analysis'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Detectar beats' : 'Detect beats'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Sincronizar clip' : 'Sync clip'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Menú de Texto */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('texto') ? 'bg-accent' : ''}>
              <Type className="h-4 w-4 mr-1" />
              {getText('texto')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Text className="h-4 w-4 mr-2" />
                {getText('titulo')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Text className="h-4 w-4 mr-2" />
                {getText('subtitulo')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Estilos de texto' : 'Text styles'}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    {language === 'es' ? 'Negrita' : 'Bold'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {language === 'es' ? 'Cursiva' : 'Italic'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {language === 'es' ? 'Subrayado' : 'Underline'}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Menú de Efectos Visuales */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('efectosVisuales') ? 'bg-accent' : ''}>
              <Video className="h-4 w-4 mr-1" />
              {getText('efectosVisuales')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Camera className="h-4 w-4 mr-2" />
                {getText('camara')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                {getText('brillo')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                {getText('contraste')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                {getText('saturacion')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Menú de Añadir Efecto */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('anadirEfecto') ? 'bg-accent' : ''}>
              <PlusCircle className="h-4 w-4 mr-1" />
              {getText('añadirEfecto')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Wand2 className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Destello' : 'Flare'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wand2 className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Partículas' : 'Particles'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wand2 className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Viñeta' : 'Vignette'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Menú de Línea de Tiempo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('lineaTiempo') ? 'bg-accent' : ''}>
              <Layers className="h-4 w-4 mr-1" />
              {getText('lineaTiempo')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Scissors className="h-4 w-4 mr-2" />
                {getText('cortar')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Scissors className="h-4 w-4 mr-2" />
                {getText('dividir')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value="normal">
                <DropdownMenuRadioItem value="slow">
                  {getText('lento')} (0.5x)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="normal">
                  {getText('normal')} (1x)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fast">
                  {getText('rapido')} (2x)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Menú de Activos */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={isMenuActive('activos') ? 'bg-accent' : ''}>
              <FileVideo className="h-4 w-4 mr-1" />
              {getText('activos')}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                {getText('importar')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                {getText('exportar')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <PanelRight className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Mostrar biblioteca' : 'Show library'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Controles de zoom */}
      <div className="flex items-center gap-2 ml-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoomChange(Math.max(0.25, currentZoom - 0.25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('alejar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Slider
          value={[currentZoom]}
          min={0.25}
          max={3}
          step={0.25}
          className="w-32"
          onValueChange={([value]) => handleZoomChange(value)}
        />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoomChange(Math.min(3, currentZoom + 0.25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('acercar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-xs text-muted-foreground w-10 text-center">
          {(currentZoom * 100).toFixed(0)}%
        </div>
      </div>
      
      {/* Botones de acciones */}
      <div className="flex items-center gap-1 ml-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <ScreenShare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('pantallaCompleta')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('exportar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getText('configuracion')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
  
  // Renderizar la barra de herramientas vertical
  const renderVerticalToolbar = () => (
    <div className={cn("flex flex-col gap-2 p-2 bg-card border-r h-full", className)}>
      {/* Botones principales */}
      <div className="flex flex-col gap-1 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleSave}>
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('guardar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Separator className="w-4 my-1" />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={undo}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('deshacer')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={redo}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('rehacer')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Separator className="w-4 my-1" />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={state.playhead.isPlaying ? "default" : "outline"} size="icon" onClick={togglePlayback}>
                {state.playhead.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{state.playhead.isPlaying ? getText('pausar') : getText('reproducir')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Separator className="w-4 my-1" />
      </div>
      
      {/* Menús de herramientas */}
      <div className="flex-1 flex flex-col gap-1 items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('efectos') ? 'bg-accent' : ''}
                onClick={() => toggleMenu('efectos')}
              >
                <Wand2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('efectos')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('audio') ? 'bg-accent' : ''} 
                onClick={() => toggleMenu('audio')}
              >
                <Music className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('audio')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('ritmo') ? 'bg-accent' : ''} 
                onClick={() => toggleMenu('ritmo')}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('ritmo')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('texto') ? 'bg-accent' : ''} 
                onClick={() => toggleMenu('texto')}
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('texto')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('efectosVisuales') ? 'bg-accent' : ''} 
                onClick={() => toggleMenu('efectosVisuales')}
              >
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('efectosVisuales')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('anadirEfecto') ? 'bg-accent' : ''} 
                onClick={() => toggleMenu('anadirEfecto')}
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('añadirEfecto')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('lineaTiempo') ? 'bg-accent' : ''} 
                onClick={() => toggleMenu('lineaTiempo')}
              >
                <Layers className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('lineaTiempo')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={isMenuActive('activos') ? 'bg-accent' : ''} 
                onClick={() => toggleMenu('activos')}
              >
                <FileVideo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('activos')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Controles de zoom */}
      <div className="flex flex-col gap-2 items-center mt-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoomChange(Math.min(3, currentZoom + 0.25))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('acercar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <Slider
          value={[currentZoom]}
          min={0.25}
          max={3}
          step={0.25}
          orientation="vertical"
          className="h-32"
          onValueChange={([value]) => handleZoomChange(value)}
        />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => handleZoomChange(Math.max(0.25, currentZoom - 0.25))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('alejar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="text-xs text-muted-foreground text-center mt-1">
          {(currentZoom * 100).toFixed(0)}%
        </div>
      </div>
      
      {/* Botones de acciones */}
      <div className="flex flex-col gap-1 items-center mt-2">
        <Separator className="w-4 my-1" />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('exportar')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{getText('configuracion')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
  
  // Renderizar según orientación
  return orientation === 'horizontal' ? renderHorizontalToolbar() : renderVerticalToolbar();
}