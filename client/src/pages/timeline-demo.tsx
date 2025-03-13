/**
 * Página de demostración del editor de línea de tiempo
 * 
 * Esta página sirve como punto de entrada para mostrar y probar
 * las funcionalidades del editor de línea de tiempo.
 */

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '../hooks/use-toast';
import TimelineDemo from '../components/timeline/TimelineDemo';
import { TimelineClip } from '../components/timeline/TimelineDemo';
import { 
  LayerType, 
  EDITING_STYLES
} from '../constants/timeline-constants';
import { Button } from '../components/ui/button';

/**
 * Página principal de demostración del editor
 */
export default function TimelineDemoPage() {
  const { toast } = useToast();
  
  // Ejemplo de clips iniciales para demostrar funcionalidad
  const initialClips = [
    {
      id: 1,
      title: 'Audio Principal',
      type: LayerType.AUDIO,
      layer: 0, // Capa de audio
      start: 0,
      duration: 30,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 2,
      title: 'Intro',
      type: LayerType.VIDEO,
      layer: 1, // Capa de video
      start: 0,
      duration: 5,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 3,
      title: 'Logo',
      type: LayerType.IMAGE,
      layer: 2, // Capa de imagen
      start: 2,
      duration: 3,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 4,
      title: 'Subtítulo',
      type: LayerType.TEXT,
      layer: 3, // Capa de texto
      start: 1.5,
      duration: 4,
      metadata: {
        isAIGenerated: false
      }
    },
    {
      id: 5,
      title: 'IA Placeholder',
      type: LayerType.AI_PLACEHOLDER,
      layer: 1, // Capa de video
      start: 6,
      duration: 5, // Max 5 segundos para placeholders IA
      metadata: {
        isAIGenerated: true
      }
    }
  ];

  /**
   * Manejar actualizaciones de la línea de tiempo
   */
  const handleTimelineUpdate = (clips: TimelineClip[]) => {
    // En una aplicación real, aquí se guardarían los cambios en el backend
    console.log('Timeline actualizada:', clips);
  };
  
  /**
   * Manejar guardado del proyecto
   */
  const handleSaveProject = () => {
    toast({
      title: 'Proyecto guardado',
      description: 'Tu proyecto ha sido guardado correctamente.',
    });
  };
  
  /**
   * Manejar exportación del proyecto
   */
  const handleExportProject = () => {
    toast({
      title: 'Proyecto exportado',
      description: 'Tu proyecto ha sido exportado correctamente.',
    });
  };
  
  return (
    <div className="timeline-demo-page h-screen flex flex-col">
      <Helmet>
        <title>Timeline Editor Demo</title>
      </Helmet>
      
      {/* Encabezado de la página */}
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Editor de Línea de Tiempo</h1>
          <p className="text-sm opacity-80 mt-1">
            Editor profesional de videos musicales con capas aisladas y placeholders de IA
          </p>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Controles adicionales */}
        <div className="bg-gray-100 p-3 border-b">
          <div className="container mx-auto flex justify-between items-center">
            <div className="project-controls flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveProject}
              >
                Guardar Proyecto
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProject}
              >
                Exportar Video
              </Button>
            </div>
            
            <div className="info text-sm text-gray-600">
              <span>Arrastre clips para organizar su proyecto</span>
            </div>
          </div>
        </div>
        
        {/* Editor de línea de tiempo */}
        <div className="flex-1 overflow-hidden">
          <TimelineDemo
            mode="edit"
            initialClips={initialClips}
            onTimelineUpdate={handleTimelineUpdate}
          />
        </div>
      </main>
      
      {/* Pie de página */}
      <footer className="bg-gray-100 p-3 border-t text-center text-sm text-gray-500">
        <div className="container mx-auto">
          © {new Date().getFullYear()} Editor de Línea de Tiempo Profesional | Todos los derechos reservados
        </div>
      </footer>
    </div>
  );
}