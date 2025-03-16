/**
 * Página de AI Video Creation
 * Interfaz principal para la creación de videos musicales con IA
 */
import React, { useState, useEffect } from 'react';
import { AIVideoWorkspace } from '../components/music-video';
import { useToast } from "../hooks/use-toast";
import axios from 'axios';

// Clip de ejemplo para demostración
const SAMPLE_CLIPS = [
  {
    id: 1,
    start: 0,
    duration: 5000,
    layer: 1,
    type: 'image',
    title: 'Escena de apertura',
    description: 'Escena inicial con atmósfera misteriosa',
    imagePrompt: 'wide shot, Redwine Carter lies in anguish amidst a storm, surrounded by symbols of despair in his dimly lit, cluttered room',
    imageUrl: ''
  },
  {
    id: 2,
    start: 5000,
    duration: 5000,
    layer: 1,
    type: 'image',
    title: 'Lluvia intensa',
    description: 'La tormenta se intensifica',
    imagePrompt: 'close-up, Rainwater streaks down the window/pane, with heavy drops illuminated by the flickering lamp inside the room',
    imageUrl: ''
  },
  {
    id: 3,
    start: 10000,
    duration: 5000,
    layer: 1,
    type: 'image',
    title: 'En la cama',
    description: 'Protagonista en la cama',
    imagePrompt: 'medium shot, Redwine Carter lies on an unmade bed with crumpled sheets and pillows. His face is twisted in anguish, eyes half-closed as he clutches the edge of the blanket',
    imageUrl: ''
  },
  {
    id: 4,
    start: 15000,
    duration: 5000,
    layer: 1,
    type: 'image',
    title: 'Primer plano',
    description: 'Primer plano emocional',
    imagePrompt: 'extreme close-up, Redwine Carter\'s face, illuminated briefly by a flash of lightning. His eyes reveal inner turmoil, sweat beaded on forehead, four tear streaks visible on his foreheads',
    imageUrl: ''
  }
];

export default function AIVideoCreationPage() {
  const { toast } = useToast();
  const [clips, setClips] = useState(SAMPLE_CLIPS);
  const [isLoading, setIsLoading] = useState(false);

  // Simulación de carga de proyecto
  useEffect(() => {
    const generateImagesForClips = async () => {
      setIsLoading(true);
      
      try {
        toast({
          title: "Cargando proyecto",
          description: "Preparando el espacio de trabajo para video AI..."
        });
        
        // Simulación de tiempo de carga
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Marcar como completado
        setIsLoading(false);
      } catch (error) {
        console.error("Error al cargar el proyecto:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el proyecto. Intente nuevamente.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };
    
    generateImagesForClips();
  }, []);

  // Manejador para guardar el proyecto
  const handleSaveProject = async (updatedClips: typeof SAMPLE_CLIPS) => {
    try {
      // Simulación de guardado
      console.log("Guardando proyecto con clips:", updatedClips);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar clips locales
      setClips(updatedClips);
      
      return true;
    } catch (error) {
      console.error("Error al guardar proyecto:", error);
      throw error;
    }
  };

  // Manejador para exportar el video
  const handleExportVideo = async () => {
    try {
      // Simulación de exportación
      console.log("Exportando video con clips:", clips);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Exportación completada",
        description: "El video ha sido exportado correctamente. Revise la sección de descargas."
      });
      
      return true;
    } catch (error) {
      console.error("Error al exportar video:", error);
      throw error;
    }
  };

  return (
    <div className="container h-[calc(100vh-80px)] py-4">
      <h1 className="text-2xl font-bold mb-4">AI Music Video Creation</h1>
      
      <div className="h-[calc(100%-40px)]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="rounded-full bg-primary/20 h-24 w-24 flex items-center justify-center mb-4">
                <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg text-center">Cargando espacio de trabajo...</p>
            </div>
          </div>
        ) : (
          <AIVideoWorkspace 
            initialClips={clips}
            onSave={handleSaveProject}
            onExport={handleExportVideo}
            audioUrl="/assets/music-sample.mp3"
            projectId="demo-project"
          />
        )}
      </div>
    </div>
  );
}