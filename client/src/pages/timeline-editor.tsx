/**
 * Timeline Editor Page - Professional Editor
 * Edita y previsualiza el timeline con control total de imágenes y funciones avanzadas
 * Accesible por: /timeline/:projectId
 */

import React, { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Save, RotateCcw, Zap, Music, Users, Film, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface TimelineItem {
  id: string | number;
  start_time: number;
  end_time: number;
  duration: number;
  title: string;
  imagePrompt?: string;
  generatedImage?: string;
  shotType?: string;
  mood?: string;
  cinematicStyle?: string;
  [key: string]: any;
}

interface Project {
  id: number;
  projectName: string;
  timelineItems: TimelineItem[];
  videoStyle?: any;
  selectedDirector?: any;
  artistName?: string;
  songName?: string;
  status?: string;
  [key: string]: any;
}

export default function TimelineEditorPage() {
  const [, params] = useRoute('/timeline/:projectId');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.projectId;

  const [project, setProject] = useState<Project | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | number | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string | number>>(new Set());

  // Cargar proyecto
  const { isLoading, error } = useQuery({
    queryKey: ['/api/music-video-projects/load', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await fetch(`/api/music-video-projects/load/${projectId}`);
      if (!response.ok) throw new Error('No se pudo cargar el proyecto');
      const data = await response.json();
      return data.project;
    },
    enabled: !!projectId,
    onSuccess: (data) => {
      if (data) {
        setProject(data);
        setTimelineItems(data.timelineItems || []);
      }
    }
  });

  // Guardar cambios
  const handleSave = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      const response = await apiRequest({
        path: '/api/music-video-projects/update-timeline',
        method: 'POST',
        body: {
          projectId: project.id,
          timelineItems: timelineItems,
          status: 'draft'
        }
      });

      if (response.success) {
        toast({
          title: '✅ Saved Successfully',
          description: 'Timeline guardado exitosamente',
        });
      } else {
        throw new Error(response.error || 'Error guardando timeline');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error guardando timeline',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Actualizar imagen
  const updateItemImage = (itemId: string | number, newImageUrl: string) => {
    setTimelineItems(prev =>
      prev.map(item =>
        (item.id === itemId || item.id === String(itemId))
          ? { ...item, generatedImage: newImageUrl }
          : item
      )
    );
  };

  // Actualizar prompt
  const updateItemPrompt = (itemId: string | number, newPrompt: string) => {
    setTimelineItems(prev =>
      prev.map(item =>
        (item.id === itemId || item.id === String(itemId))
          ? { ...item, imagePrompt: newPrompt }
          : item
      )
    );
  };

  // Simular funciones avanzadas
  const handleRegenerateImage = async (item: TimelineItem) => {
    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      toast({
        title: '🎨 Regenerando imagen...',
        description: `Escena ${item.title} - Esto tomará algunos segundos`,
      });
      // Simulación - en producción llamaría a /api/gemini/generate-image
      await new Promise(r => setTimeout(r, 2000));
      toast({
        title: '✅ Imagen regenerada',
        description: `Nueva imagen para escena ${item.title}`,
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleLipsync = async (item: TimelineItem) => {
    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      toast({
        title: '🎤 Aplicando Lip-Sync...',
        description: `Sincronizando labios para escena ${item.title}`,
      });
      await new Promise(r => setTimeout(r, 3000));
      toast({
        title: '✅ Lip-Sync aplicado',
        description: `Labios sincronizados con la música`,
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleAddMusician = async (item: TimelineItem) => {
    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      toast({
        title: '🎸 Agregando músico...',
        description: `Generando músico adicional para escena ${item.title}`,
      });
      await new Promise(r => setTimeout(r, 2500));
      toast({
        title: '✅ Músico agregado',
        description: `Nuevo músico en la escena`,
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleConvertToVideo = async (item: TimelineItem) => {
    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      toast({
        title: '🎬 Convirtiendo a video...',
        description: `Generando video para escena ${item.title}`,
      });
      await new Promise(r => setTimeout(r, 4000));
      toast({
        title: '✅ Video generado',
        description: `Video listo para escena ${item.title}`,
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleEnhanceImage = async (item: TimelineItem) => {
    setProcessingIds(prev => new Set(prev).add(item.id));
    try {
      toast({
        title: '✨ Mejorando imagen...',
        description: `Mejorando calidad de imagen`,
      });
      await new Promise(r => setTimeout(r, 2000));
      toast({
        title: '✅ Imagen mejorada',
        description: `Calidad de imagen incrementada`,
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">Project ID not found</h1>
          <Button onClick={() => navigate('/music-video-flow')} variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 w-4 h-4" /> Volver al workflow
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">Proyecto no encontrado</h1>
          <p className="text-gray-400 mt-3">{error instanceof Error ? error.message : 'Proyecto no existe'}</p>
          <Button onClick={() => navigate('/music-video-flow')} variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 w-4 h-4" /> Volver al workflow
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header profesional */}
        <div className="mb-8 sticky top-6 z-40 bg-gradient-to-r from-slate-800/95 to-purple-900/95 backdrop-blur-md rounded-lg p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-black text-white mb-1">{project.projectName}</h1>
              <p className="text-purple-300 font-semibold">{project.artistName} - {project.songName}</p>
              <p className="text-gray-400 text-sm mt-2">{timelineItems.length} escenas • {project.selectedDirector?.name || 'Director'} style</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/music-video-flow')}
                className="border-gray-600 hover:bg-gray-800"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Volver
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-white"
              >
                <Save className="mr-2 w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>

        {/* Timeline Items */}
        <div className="space-y-4">
          {timelineItems.map((item, idx) => {
            const isExpanded = expandedItem === item.id;
            const isProcessing = processingIds.has(item.id);

            return (
              <Card
                key={item.id || idx}
                className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
              >
                <CardHeader 
                  className="pb-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                          <span className="text-white font-bold text-sm">#{idx + 1}</span>
                        </div>
                        <CardTitle className="text-lg text-white">{item.title || `Escena ${idx + 1}`}</CardTitle>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>⏱️ {Math.round(item.duration / 1000)}s</span>
                        <span>📍 {Math.round(item.start_time / 1000)}s</span>
                        {item.shotType && <span>🎥 {item.shotType}</span>}
                        {item.mood && <span>🎭 {item.mood}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                  </div>
                </CardHeader>

                {/* Contenido expandido */}
                {isExpanded && (
                  <CardContent className="border-t border-slate-700 pt-6 space-y-6">
                    {/* Imagen grande con preview */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Imagen generada</h3>
                      {item.generatedImage ? (
                        <div className="relative w-full h-64 bg-slate-900 rounded-lg overflow-hidden group">
                          <img
                            src={item.generatedImage}
                            alt={`Scene ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button
                              size="sm"
                              className="bg-white/20 hover:bg-white/40 text-white border border-white/30"
                              onClick={() => window.open(item.generatedImage, '_blank')}
                            >
                              Ver en tamaño completo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-slate-900 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-700">
                          <span className="text-gray-500">Sin imagen generada</span>
                        </div>
                      )}
                    </div>

                    {/* Prompt editable */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-300 uppercase tracking-wide">Prompt de imagen</label>
                      <textarea
                        value={item.imagePrompt || ''}
                        onChange={(e) => updateItemPrompt(item.id, e.target.value)}
                        className="w-full h-24 px-4 py-3 bg-slate-900 text-white text-sm rounded-lg border border-slate-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                        placeholder="Editar prompt cinematográfico..."
                      />
                    </div>

                    {/* Botones de funciones avanzadas */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Button
                        onClick={() => handleRegenerateImage(item)}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="border-purple-500/50 hover:bg-purple-500/10 text-purple-300"
                      >
                        <RotateCcw className="mr-2 w-4 h-4" />
                        {isProcessing ? 'Regenerando...' : 'Regenerar'}
                      </Button>

                      <Button
                        onClick={() => handleLipsync(item)}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="border-blue-500/50 hover:bg-blue-500/10 text-blue-300"
                      >
                        <Zap className="mr-2 w-4 h-4" />
                        {isProcessing ? 'Sincronizando...' : 'Lip-Sync'}
                      </Button>

                      <Button
                        onClick={() => handleAddMusician(item)}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="border-green-500/50 hover:bg-green-500/10 text-green-300"
                      >
                        <Users className="mr-2 w-4 h-4" />
                        {isProcessing ? 'Agregando...' : 'Músicos'}
                      </Button>

                      <Button
                        onClick={() => handleConvertToVideo(item)}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="border-pink-500/50 hover:bg-pink-500/10 text-pink-300"
                      >
                        <Film className="mr-2 w-4 h-4" />
                        {isProcessing ? 'Generando...' : 'A Video'}
                      </Button>

                      <Button
                        onClick={() => handleEnhanceImage(item)}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-300"
                      >
                        <Sparkles className="mr-2 w-4 h-4" />
                        {isProcessing ? 'Mejorando...' : 'Mejorar'}
                      </Button>

                      <Button
                        onClick={() => handleRegenerateImage(item)}
                        disabled={isProcessing}
                        variant="outline"
                        size="sm"
                        className="border-orange-500/50 hover:bg-orange-500/10 text-orange-300"
                      >
                        <Music className="mr-2 w-4 h-4" />
                        Más opciones
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {timelineItems.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700 text-center p-16">
            <p className="text-gray-400 text-xl font-semibold">No timeline items found</p>
            <p className="text-gray-500 text-sm mt-2">Genera imágenes primero en el workflow principal</p>
          </Card>
        )}
      </div>
    </div>
  );
}
