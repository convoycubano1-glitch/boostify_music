import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ProfessionalTimeline } from '@/components/professional-editor/professional-timeline';
import { EditorStateUtils, TimelineClip } from '@/lib/professional-editor-types';
import { Button } from '@/components/ui/button';
import {
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Play,
  Pause,
  Settings,
  Video,
  Image,
  Music,
  Text,
  Filter,
  SplitSquareVertical,
  Plus,
  ChevronsUpDown
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

export default function ProfessionalEditorPage() {
  // Estado del editor
  const [editorState, setEditorState] = useState(EditorStateUtils.createEmptyState());
  
  // Estado para paneles colapsables
  const [collapsedPanels, setCollapsedPanels] = useState({
    left: false,
    right: false,
    timeline: false
  });
  
  // Estado para controlar el panel activo en la derecha
  const [activeRightPanel, setActiveRightPanel] = useState('effects');
  
  // Estado para seguimiento de vídeo reproducido
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  
  // Efecto para sincronizar el tiempo del video con el estado del editor
  useEffect(() => {
    if (videoEl && editorState.isPlaying) {
      const interval = setInterval(() => {
        setEditorState(prevState => ({
          ...prevState,
          currentTime: videoEl.currentTime
        }));
      }, 16); // Aproximadamente 60fps
      
      return () => clearInterval(interval);
    }
  }, [videoEl, editorState.isPlaying]);
  
  // Funciones de manipulación del estado
  
  // Función para retroceder en el historial
  const handleUndo = () => {
    const newState = EditorStateUtils.undo(editorState);
    setEditorState(newState);
  };
  
  // Función para avanzar en el historial
  const handleRedo = () => {
    const newState = EditorStateUtils.redo(editorState);
    setEditorState(newState);
  };
  
  // Función para buscar una posición específica en el video
  const handleSeek = (time: number) => {
    if (videoEl) {
      videoEl.currentTime = time;
    }
    
    setEditorState(prevState => ({
      ...prevState,
      currentTime: time
    }));
  };
  
  // Función para reproducir el video
  const handlePlay = () => {
    if (videoEl) {
      videoEl.play();
    }
    
    setEditorState(prevState => ({
      ...prevState,
      isPlaying: true
    }));
  };
  
  // Función para pausar el video
  const handlePause = () => {
    if (videoEl) {
      videoEl.pause();
    }
    
    setEditorState(prevState => ({
      ...prevState,
      isPlaying: false
    }));
  };
  
  // Función para añadir un clip a la línea de tiempo
  const handleAddClip = (clip: Omit<TimelineClip, 'id'>) => {
    const newClip: TimelineClip = {
      ...clip,
      id: uuidv4()
    };
    
    const newState = {
      ...editorState,
      timelineClips: [...editorState.timelineClips, newClip]
    };
    
    // Añadir entrada al historial
    const updatedState = EditorStateUtils.addHistoryEntry(
      editorState, 
      { timelineClips: newState.timelineClips },
      `Añadido clip "${clip.title || 'sin título'}"`
    );
    
    setEditorState(updatedState);
  };
  
  // Función para actualizar un clip existente
  const handleUpdateClip = (id: string, updates: Partial<TimelineClip>) => {
    const updatedClips = editorState.timelineClips.map(clip => 
      clip.id === id ? { ...clip, ...updates } : clip
    );
    
    const newState = {
      ...editorState,
      timelineClips: updatedClips
    };
    
    // Añadir entrada al historial
    const updatedState = EditorStateUtils.addHistoryEntry(
      editorState, 
      { timelineClips: newState.timelineClips },
      `Actualizado clip "${editorState.timelineClips.find(c => c.id === id)?.title || 'sin título'}"`
    );
    
    setEditorState(updatedState);
  };
  
  // Función para eliminar un clip
  const handleDeleteClip = (id: string) => {
    const clipToDelete = editorState.timelineClips.find(clip => clip.id === id);
    
    if (!clipToDelete) return;
    
    const updatedClips = editorState.timelineClips.filter(clip => clip.id !== id);
    
    const newState = {
      ...editorState,
      timelineClips: updatedClips
    };
    
    // Añadir entrada al historial
    const updatedState = EditorStateUtils.addHistoryEntry(
      editorState, 
      { timelineClips: newState.timelineClips },
      `Eliminado clip "${clipToDelete.title || 'sin título'}"`
    );
    
    setEditorState(updatedState);
  };
  
  // Función para alternar el colapso de paneles
  const togglePanel = (panel: 'left' | 'right' | 'timeline') => {
    setCollapsedPanels(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };
  
  // Función para crear un nuevo video en blanco
  const handleNewProject = () => {
    const newState = EditorStateUtils.createEmptyState();
    setEditorState(newState);
  };
  
  // Función para guardar el proyecto
  const handleSaveProject = () => {
    const projectJson = JSON.stringify(editorState);
    
    // Guardar en localStorage para demo
    localStorage.setItem('professional-editor-project', projectJson);
    
    // En una implementación real, esto se guardaría en una base de datos
    alert('Proyecto guardado con éxito (en localStorage)');
  };
  
  // Función para cargar un proyecto
  const handleLoadProject = () => {
    const savedProject = localStorage.getItem('professional-editor-project');
    
    if (savedProject) {
      try {
        const loadedState = JSON.parse(savedProject);
        setEditorState(loadedState);
        alert('Proyecto cargado con éxito');
      } catch (error) {
        console.error('Error al cargar el proyecto:', error);
        alert('Error al cargar el proyecto');
      }
    } else {
      alert('No hay proyecto guardado');
    }
  };
  
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Barra de herramientas superior */}
      <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center px-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleNewProject}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSaveProject}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLoadProject}>
            <Upload className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleUndo} disabled={editorState.historyIndex < 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRedo} disabled={editorState.historyIndex >= editorState.history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 text-center">
          <h1 className="text-sm font-semibold">{editorState.projectName}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Contenedor principal con tres columnas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo - Biblioteca y recursos */}
        <div className={cn(
          "bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden transition-all duration-300",
          collapsedPanels.left ? "w-10" : "w-64"
        )}>
          {/* Botón para colapsar panel */}
          <div className="h-8 border-b border-zinc-800 flex items-center justify-end px-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => togglePanel('left')}
            >
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </div>
          
          {!collapsedPanels.left && (
            <>
              {/* Pestañas de biblioteca */}
              <div className="h-10 flex items-center border-b border-zinc-800">
                <Button variant="ghost" className="flex-1 h-full rounded-none">
                  Media
                </Button>
                <Button variant="ghost" className="flex-1 h-full rounded-none">
                  Efectos
                </Button>
              </div>
              
              {/* Contenido del panel */}
              <div className="flex-1 overflow-y-auto p-2 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold mb-2 text-zinc-400">VIDEOS</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Demo videos */}
                    <div 
                      className="aspect-video bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'video',
                          title: 'Video de muestra',
                          url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
                        }));
                      }}
                    >
                      <Video className="h-6 w-6 text-zinc-500" />
                    </div>
                    <div 
                      className="aspect-video bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'video',
                          title: 'Naturaleza',
                          url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
                        }));
                      }}
                    >
                      <Video className="h-6 w-6 text-zinc-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold mb-2 text-zinc-400">IMÁGENES</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Demo images */}
                    <div 
                      className="aspect-square bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'image',
                          title: 'Imagen 1',
                          url: 'https://via.placeholder.com/300'
                        }));
                      }}
                    >
                      <Image className="h-6 w-6 text-zinc-500" />
                    </div>
                    <div 
                      className="aspect-square bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'image',
                          title: 'Imagen 2',
                          url: 'https://via.placeholder.com/300/0000FF'
                        }));
                      }}
                    >
                      <Image className="h-6 w-6 text-zinc-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold mb-2 text-zinc-400">AUDIO</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Demo audio */}
                    <div 
                      className="h-16 bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'audio',
                          title: 'Música de fondo',
                          url: 'https://sample-videos.com/audio/mp3/crowd-cheering.mp3'
                        }));
                      }}
                    >
                      <Music className="h-6 w-6 text-zinc-500" />
                    </div>
                    <div 
                      className="h-16 bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'audio',
                          title: 'Efectos de sonido',
                          url: 'https://sample-videos.com/audio/mp3/wave.mp3'
                        }));
                      }}
                    >
                      <Music className="h-6 w-6 text-zinc-500" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold mb-2 text-zinc-400">TEXTO</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Demo text */}
                    <div 
                      className="h-10 bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'text',
                          title: 'Título',
                          content: 'Texto de ejemplo'
                        }));
                      }}
                    >
                      <Text className="h-5 w-5 text-zinc-500 mr-2" />
                      <span className="text-xs text-zinc-400">Título</span>
                    </div>
                    <div 
                      className="h-10 bg-zinc-800 rounded-sm flex items-center justify-center cursor-pointer hover:bg-zinc-700"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify({
                          type: 'text',
                          title: 'Subtítulo',
                          content: 'Texto de ejemplo'
                        }));
                      }}
                    >
                      <Text className="h-5 w-5 text-zinc-500 mr-2" />
                      <span className="text-xs text-zinc-400">Subtítulo</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Panel central - Previsualizador de video */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Vista previa del video */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className="relative aspect-video bg-zinc-900 rounded w-full max-h-full flex items-center justify-center">
              <video
                ref={(el) => setVideoEl(el)}
                className="max-w-full max-h-full"
                src={editorState.timelineClips.find(c => c.type === 'video')?.url}
                onTimeUpdate={(e) => {
                  if (!editorState.isPlaying) return;
                  setEditorState(prev => ({ ...prev, currentTime: e.currentTarget.currentTime }));
                }}
                onEnded={() => {
                  setEditorState(prev => ({ ...prev, isPlaying: false }));
                }}
              />
              
              {/* Capa para mostrar efectos, textos, etc. */}
              <div className="absolute inset-0 pointer-events-none">
                {editorState.timelineClips
                  .filter(clip => clip.type === 'text' && 
                    clip.startTime <= editorState.currentTime && 
                    clip.startTime + clip.duration >= editorState.currentTime)
                  .map(clip => (
                    <div 
                      key={clip.id}
                      className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded text-white"
                    >
                      {clip.title}
                    </div>
                  ))
                }
              </div>
              
              {/* Controles de vídeo superpuestos */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-black/50 border-white/20"
                  onClick={editorState.isPlaying ? handlePause : handlePlay}
                >
                  {editorState.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="text-xs text-white">
                  {formatTime(editorState.currentTime)} / {formatTime(editorState.duration)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Timeline - Panel inferior */}
          <div className={cn(
            "border-t border-zinc-800 transition-all duration-300",
            collapsedPanels.timeline ? "h-12" : "h-64"
          )}>
            {/* Botón para colapsar timeline */}
            <div className="h-8 border-b border-zinc-800 flex items-center justify-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => togglePanel('timeline')}
              >
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Timeline profesional */}
            {!collapsedPanels.timeline && (
              <div className="h-[calc(100%-32px)]">
                <ProfessionalTimeline
                  clips={editorState.timelineClips}
                  currentTime={editorState.currentTime}
                  duration={editorState.duration}
                  isPlaying={editorState.isPlaying}
                  onSeek={handleSeek}
                  onAddClip={handleAddClip}
                  onUpdateClip={handleUpdateClip}
                  onDeleteClip={handleDeleteClip}
                  onPlay={handlePlay}
                  onPause={handlePause}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Panel derecho - Propiedades y efectos */}
        <div className={cn(
          "bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden transition-all duration-300",
          collapsedPanels.right ? "w-10" : "w-80"
        )}>
          {/* Botón para colapsar panel */}
          <div className="h-8 border-b border-zinc-800 flex items-center px-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 ml-auto" 
              onClick={() => togglePanel('right')}
            >
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </div>
          
          {!collapsedPanels.right && (
            <>
              {/* Pestañas de propiedades */}
              <div className="h-10 flex items-center border-b border-zinc-800">
                <Button 
                  variant={activeRightPanel === 'properties' ? 'default' : 'ghost'} 
                  className="flex-1 h-full rounded-none"
                  onClick={() => setActiveRightPanel('properties')}
                >
                  Propiedades
                </Button>
                <Button 
                  variant={activeRightPanel === 'effects' ? 'default' : 'ghost'} 
                  className="flex-1 h-full rounded-none"
                  onClick={() => setActiveRightPanel('effects')}
                >
                  Efectos
                </Button>
              </div>
              
              {/* Contenido del panel */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeRightPanel === 'properties' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Propiedades del proyecto</h3>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Nombre</label>
                          <input
                            type="text"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                            value={editorState.projectName}
                            onChange={(e) => {
                              setEditorState(prevState => ({
                                ...prevState,
                                projectName: e.target.value
                              }));
                            }}
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Resolución</label>
                          <select
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                            value={`${editorState.settings.resolution.width}x${editorState.settings.resolution.height}`}
                            onChange={(e) => {
                              const [width, height] = e.target.value.split('x').map(Number);
                              setEditorState(prevState => ({
                                ...prevState,
                                settings: {
                                  ...prevState.settings,
                                  resolution: { width, height }
                                }
                              }));
                            }}
                          >
                            <option value="1920x1080">1920x1080 (FHD)</option>
                            <option value="1280x720">1280x720 (HD)</option>
                            <option value="3840x2160">3840x2160 (4K)</option>
                            <option value="1080x1920">1080x1920 (Vertical)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-zinc-400 block mb-1">Duración (segundos)</label>
                          <input
                            type="number"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                            value={editorState.duration}
                            onChange={(e) => {
                              setEditorState(prevState => ({
                                ...prevState,
                                duration: Number(e.target.value)
                              }));
                            }}
                            min={1}
                            max={3600}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {editorState.selectedClipId && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Propiedades del clip</h3>
                        {/* Propiedades del clip seleccionado */}
                        {(() => {
                          const selectedClip = editorState.timelineClips.find(
                            clip => clip.id === editorState.selectedClipId
                          );
                          
                          if (!selectedClip) return null;
                          
                          return (
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs text-zinc-400 block mb-1">Título</label>
                                <input
                                  type="text"
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                                  value={selectedClip.title || ''}
                                  onChange={(e) => {
                                    handleUpdateClip(selectedClip.id, {
                                      title: e.target.value
                                    });
                                  }}
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-zinc-400 block mb-1">Tiempo de inicio</label>
                                <input
                                  type="number"
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                                  value={selectedClip.startTime}
                                  onChange={(e) => {
                                    handleUpdateClip(selectedClip.id, {
                                      startTime: Number(e.target.value)
                                    });
                                  }}
                                  min={0}
                                  max={editorState.duration - selectedClip.duration}
                                  step={0.1}
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-zinc-400 block mb-1">Duración</label>
                                <input
                                  type="number"
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                                  value={selectedClip.duration}
                                  onChange={(e) => {
                                    handleUpdateClip(selectedClip.id, {
                                      duration: Number(e.target.value)
                                    });
                                  }}
                                  min={0.1}
                                  max={editorState.duration - selectedClip.startTime}
                                  step={0.1}
                                />
                              </div>
                              
                              {/* Propiedades específicas por tipo */}
                              {selectedClip.type === 'text' && (
                                <div>
                                  <label className="text-xs text-zinc-400 block mb-1">Texto</label>
                                  <textarea
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                                    value={selectedClip.content || ''}
                                    onChange={(e) => {
                                      handleUpdateClip(selectedClip.id, {
                                        content: e.target.value
                                      } as any);
                                    }}
                                    rows={3}
                                  />
                                </div>
                              )}
                              
                              {/* Botón para eliminar */}
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="mt-4 w-full"
                                onClick={() => handleDeleteClip(selectedClip.id)}
                              >
                                Eliminar clip
                              </Button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                
                {activeRightPanel === 'effects' && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold mb-2">Efectos</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Efectos disponibles */}
                      <div 
                        className="aspect-square bg-zinc-800 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'filter',
                            name: 'Blur',
                            properties: { intensity: 5 }
                          }));
                        }}
                      >
                        <Filter className="h-6 w-6 text-zinc-500 mb-1" />
                        <span className="text-xs">Blur</span>
                      </div>
                      <div 
                        className="aspect-square bg-zinc-800 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'filter',
                            name: 'Sepia',
                            properties: { intensity: 0.8 }
                          }));
                        }}
                      >
                        <Filter className="h-6 w-6 text-zinc-500 mb-1" />
                        <span className="text-xs">Sepia</span>
                      </div>
                      <div 
                        className="aspect-square bg-zinc-800 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'filter',
                            name: 'Greyscale',
                            properties: { intensity: 1 }
                          }));
                        }}
                      >
                        <Filter className="h-6 w-6 text-zinc-500 mb-1" />
                        <span className="text-xs">B&W</span>
                      </div>
                      <div 
                        className="aspect-square bg-zinc-800 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify({
                            type: 'transition',
                            name: 'Fade',
                            properties: { duration: 1 }
                          }));
                        }}
                      >
                        <SplitSquareVertical className="h-6 w-6 text-zinc-500 mb-1" />
                        <span className="text-xs">Fade</span>
                      </div>
                    </div>
                    
                    {/* Efectos aplicados */}
                    {editorState.selectedClipId && (
                      <div className="mt-6">
                        <h4 className="text-xs font-semibold mb-2 text-zinc-400">EFECTOS APLICADOS</h4>
                        <div className="space-y-2">
                          {(() => {
                            const selectedClip = editorState.timelineClips.find(
                              clip => clip.id === editorState.selectedClipId
                            );
                            
                            if (!selectedClip || !selectedClip.effects || selectedClip.effects.length === 0) {
                              return (
                                <div className="text-xs text-zinc-500 italic">
                                  No hay efectos aplicados
                                </div>
                              );
                            }
                            
                            return selectedClip.effects.map(effect => (
                              <div 
                                key={effect.id} 
                                className="bg-zinc-800 p-2 rounded border border-zinc-700"
                              >
                                <div className="flex justify-between">
                                  <span className="text-xs font-medium">{effect.name}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5" 
                                    onClick={() => {
                                      // Eliminar efecto
                                      const updatedEffects = selectedClip.effects?.filter(e => e.id !== effect.id) || [];
                                      handleUpdateClip(selectedClip.id, {
                                        effects: updatedEffects
                                      });
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M18 6L6 18"></path>
                                      <path d="M6 6l12 12"></path>
                                    </svg>
                                  </Button>
                                </div>
                                {/* Propiedades del efecto */}
                                {effect.type === 'filter' && (
                                  <div className="mt-2">
                                    <label className="text-xs text-zinc-400 block mb-1">Intensidad</label>
                                    <input
                                      type="range"
                                      className="w-full"
                                      min={0}
                                      max={10}
                                      step={0.1}
                                      value={effect.parameters.intensity || 0}
                                      onChange={(e) => {
                                        // Actualizar parámetros del efecto
                                        const updatedEffects = selectedClip.effects?.map(ef => {
                                          if (ef.id === effect.id) {
                                            return {
                                              ...ef,
                                              parameters: {
                                                ...ef.parameters,
                                                intensity: parseFloat(e.target.value)
                                              }
                                            };
                                          }
                                          return ef;
                                        }) || [];
                                        
                                        handleUpdateClip(selectedClip.id, {
                                          effects: updatedEffects
                                        });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Función para formatear el tiempo en formato mm:ss.ms
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
};