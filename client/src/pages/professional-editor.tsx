import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, LayoutPanelLeft, Cog, Library } from 'lucide-react';

import VideoPreviewPanelComponent from '@/components/professional-editor/video-preview-panel';
import ResizeHandleControl, { ModuleConfig } from '@/components/professional-editor/resize-handle-control';
import ModuleConfiguratorComponent from '@/components/professional-editor/module-configurator';
import MediaLibraryComponent, { MediaItem } from '@/components/professional-editor/media-library';

// Datos de ejemplo para la biblioteca de medios
const mockMediaItems: MediaItem[] = [
  {
    id: '1',
    type: 'video',
    name: 'Intro de música',
    url: 'https://example.com/video1.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/vid1/300/200',
    duration: 120,
    createdAt: new Date('2025-02-15'),
    favorite: true,
    tags: ['música', 'intro']
  },
  {
    id: '2',
    type: 'audio',
    name: 'Beat principal',
    url: 'https://example.com/audio1.mp3',
    duration: 180,
    createdAt: new Date('2025-02-10'),
    tags: ['beat', 'principal']
  },
  {
    id: '3',
    type: 'image',
    name: 'Fondo escenario',
    url: 'https://picsum.photos/seed/img1/300/200',
    createdAt: new Date('2025-02-05'),
    tags: ['fondo', 'escenario']
  },
  {
    id: '4',
    type: 'video',
    name: 'Coro - toma 1',
    url: 'https://example.com/video2.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/vid2/300/200',
    duration: 45,
    createdAt: new Date('2025-02-12'),
    tags: ['coro', 'toma']
  },
  {
    id: '5',
    type: 'audio',
    name: 'Efectos de sonido',
    url: 'https://example.com/audio2.mp3',
    duration: 60,
    createdAt: new Date('2025-02-08'),
    favorite: true,
    tags: ['efectos', 'sonido']
  },
  {
    id: '6',
    type: 'image',
    name: 'Logo banda',
    url: 'https://picsum.photos/seed/img2/300/200',
    createdAt: new Date('2025-02-03'),
    tags: ['logo', 'banda']
  }
];

export default function ProfessionalEditor() {
  // Estado para gestionar la configuración de los módulos
  const [modules, setModules] = useState<ModuleConfig[]>([
    {
      id: 'preview',
      name: 'Vista previa',
      type: 'panel',
      enabled: true,
      visible: true,
      position: 0,
      defaultSize: 65
    },
    {
      id: 'timeline',
      name: 'Línea de tiempo',
      type: 'panel',
      enabled: true,
      visible: true,
      position: 1,
      defaultSize: 35
    },
    {
      id: 'media-library',
      name: 'Biblioteca de medios',
      type: 'panel',
      enabled: true,
      visible: true,
      position: 2,
      defaultSize: 30
    },
    {
      id: 'effects',
      name: 'Efectos',
      type: 'panel',
      enabled: true,
      visible: false,
      position: 3,
      defaultSize: 30
    },
    {
      id: 'text-editor',
      name: 'Editor de texto',
      type: 'panel',
      enabled: true,
      visible: false,
      position: 4,
      defaultSize: 30
    },
    {
      id: 'settings',
      name: 'Ajustes',
      type: 'tool',
      enabled: true,
      visible: true,
      position: 0
    },
    {
      id: 'cut',
      name: 'Cortar',
      type: 'tool',
      enabled: true,
      visible: true,
      position: 1
    },
    {
      id: 'transitions',
      name: 'Transiciones',
      type: 'tool',
      enabled: true,
      visible: true,
      position: 2
    }
  ]);

  // Estado para diálogo de configuración
  const [configOpen, setConfigOpen] = useState<boolean>(false);
  
  // Estado para medios seleccionados
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  
  // Función para manejar cambios en la disposición
  const handleResize = useCallback((updatedModules: ModuleConfig[]) => {
    setModules(updatedModules);
  }, []);
  
  // Función para restablecer la disposición
  const handleResetLayout = useCallback(() => {
    setModules(prev => prev.map(module => ({
      ...module,
      actualSize: module.defaultSize
    })));
  }, []);
  
  // Función para manejar la selección de medios
  const handleMediaSelect = useCallback((media: MediaItem) => {
    setSelectedMedia(media);
    console.log('Medio seleccionado:', media);
  }, []);

  // Función para simular la subida de archivos
  const handleUpload = useCallback((files: FileList) => {
    console.log('Archivos a subir:', files);
    // Aquí iría la lógica de subida de archivos
    alert(`Se simularía la subida de ${files.length} archivo(s)`);
  }, []);
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Barra de herramientas superior */}
      <div className="h-12 border-b flex items-center justify-between px-4">
        <h1 className="text-lg font-semibold">Editor profesional de videos musicales</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setConfigOpen(true)}
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel lateral izquierdo - Biblioteca de medios */}
        {modules.find(m => m.id === 'media-library')?.visible && (
          <div 
            className="border-r" 
            style={{ 
              width: `${modules.find(m => m.id === 'media-library')?.actualSize || 30}%`,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="p-4 flex-1 overflow-auto">
              <MediaLibraryComponent 
                items={mockMediaItems}
                onSelect={handleMediaSelect}
                onUpload={handleUpload}
                onDelete={(id) => console.log('Eliminar media:', id)}
                onToggleFavorite={(id, fav) => console.log('Toggle favorito:', id, fav)}
              />
            </div>
          </div>
        )}
        
        {/* Manejador de redimensión lateral */}
        {modules.find(m => m.id === 'media-library')?.visible && (
          <ResizeHandleControl 
            modules={modules.filter(m => ['media-library', 'preview'].includes(m.id))}
            onResize={handleResize}
            direction="horizontal"
          />
        )}
        
        {/* Área principal */}
        <div className="flex-1 flex flex-col">
          {/* Panel de vista previa */}
          {modules.find(m => m.id === 'preview')?.visible && (
            <div 
              className="border-b"
              style={{ 
                height: `${modules.find(m => m.id === 'preview')?.actualSize || 65}%`
              }}
            >
              <VideoPreviewPanelComponent
                src={selectedMedia?.type === 'video' ? selectedMedia.url : undefined}
                poster={selectedMedia?.type === 'image' ? selectedMedia.url : undefined}
                duration={selectedMedia?.duration}
                onSeek={(time) => console.log('Seeking to:', time)}
                onVolumeChange={(vol) => console.log('Volume changed:', vol)}
              />
            </div>
          )}
          
          {/* Manejador de redimensión horizontal */}
          {modules.find(m => m.id === 'preview')?.visible && modules.find(m => m.id === 'timeline')?.visible && (
            <ResizeHandleControl 
              modules={modules.filter(m => ['preview', 'timeline'].includes(m.id))}
              onResize={handleResize}
              direction="vertical"
            />
          )}
          
          {/* Área de línea de tiempo */}
          {modules.find(m => m.id === 'timeline')?.visible && (
            <div className="flex-1 p-4 bg-muted/20">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Línea de tiempo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] bg-muted/30 rounded flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">
                      {selectedMedia 
                        ? `Media seleccionado: ${selectedMedia.name} (${selectedMedia.type})`
                        : 'Selecciona un elemento de la biblioteca para empezar'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Diálogo de configuración de módulos */}
      <ModuleConfiguratorComponent
        modules={modules}
        open={configOpen}
        onOpenChange={setConfigOpen}
        onSave={setModules}
        onResetLayout={handleResetLayout}
      />
    </div>
  );
}