import React, { useState, useEffect } from 'react';
import { SceneData, SceneEditor } from "../components/music-video/scene-editor/SceneEditor";
import { SceneEditorContainer, TimelineClip } from "../components/music-video/scene-editor/SceneEditorContainer";
import { SceneEditorPanel } from "../components/music-video/scene-editor/SceneEditorPanel";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Separator } from '../components/ui/separator';
import { PlusCircle, Save, RefreshCw, Film, Layers } from 'lucide-react';

/**
 * Página dedicada al editor de escenas para videos musicales
 * Esta implementación incluye una interfaz completa para el editor
 * con timeline básico y funcionalidades de generación de imágenes
 */
export default function SceneEditorPage() {
  const { toast } = useToast();
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Inicializar con datos de ejemplo para mostrar la funcionalidad
  useEffect(() => {
    const initialClips: TimelineClip[] = [
      {
        id: 1,
        start: 0,
        duration: 5000,
        type: 'image',
        layer: 1,
        title: 'Intro Scene',
        description: 'Opening scene with artist introduction',
        imagePrompt: 'medium shot, artist performing on stage with dramatic lighting',
        imageUrl: 'https://picsum.photos/800/450'
      },
      {
        id: 2,
        start: 5000,
        duration: 5000,
        type: 'image',
        layer: 1,
        title: 'Verse Scene',
        description: 'Artist in studio environment',
        imagePrompt: 'close-up, artist in recording studio with vintage microphone',
        imageUrl: 'https://picsum.photos/800/451'
      },
      {
        id: 3,
        start: 10000,
        duration: 5000,
        type: 'image',
        layer: 1,
        title: 'Chorus Scene',
        description: 'High energy outdoor performance',
        imagePrompt: 'wide shot, artist performing at outdoor concert with crowd',
        imageUrl: 'https://picsum.photos/800/452'
      }
    ];
    
    setClips(initialClips);
    setSelectedClipId(1);
  }, []);
  
  const handleClipUpdate = (clipId: number, updates: Partial<TimelineClip>) => {
    setClips(prevClips => 
      prevClips.map(clip => 
        clip.id === clipId ? { ...clip, ...updates } : clip
      )
    );
    
    toast({
      title: "Clip Updated",
      description: "Timeline has been updated with the changes"
    });
  };
  
  const handleRegenerateClipImage = async (clipId: number) => {
    setIsGenerating(true);
    
    // Simular regeneración de imagen
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actualizar con una nueva imagen de ejemplo
      setClips(prevClips => 
        prevClips.map(clip => 
          clip.id === clipId 
            ? { 
                ...clip, 
                imageUrl: `https://picsum.photos/800/${450 + Math.floor(Math.random() * 10)}?random=${Date.now()}`
              } 
            : clip
        )
      );
      
      toast({
        title: "Image Regenerated",
        description: "New image has been generated successfully"
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate a new image",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAddClip = (clip: Omit<TimelineClip, 'id'>) => {
    const newId = clips.length > 0 
      ? Math.max(...clips.map(c => c.id)) + 1 
      : 1;
    
    const newClip: TimelineClip = {
      ...clip,
      id: newId
    };
    
    setClips(prevClips => [...prevClips, newClip]);
    setSelectedClipId(newId);
    
    toast({
      title: "New Scene Added",
      description: "A new scene has been added to your video"
    });
  };
  
  const handleSaveScenes = async () => {
    setIsProcessing(true);
    
    try {
      // Simular guardado en servidor
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Project Saved",
        description: "Your scenes have been saved successfully"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save your project",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Video Scene Editor</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SceneEditorContainer 
            clips={clips}
            selectedClipId={selectedClipId}
            onClipUpdate={handleClipUpdate}
            onRegenerateClipImage={handleRegenerateClipImage}
            onAddClip={handleAddClip}
            onSaveScenes={handleSaveScenes}
            isGenerating={isGenerating}
            isProcessing={isProcessing}
          />
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Video Timeline</h3>
              <Separator className="mb-4" />
              
              <div className="space-y-2">
                {clips.map(clip => (
                  <div 
                    key={clip.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedClipId === clip.id 
                        ? 'bg-primary/20 border border-primary/50' 
                        : 'hover:bg-secondary/50 bg-secondary/10'
                    }`}
                    onClick={() => setSelectedClipId(clip.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{clip.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {(clip.start / 1000).toFixed(1)}s - {((clip.start + clip.duration) / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {clip.imagePrompt}
                    </p>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline" 
                className="w-full mt-4"
                onClick={() => {
                  handleAddClip({
                    start: clips.length > 0 
                      ? clips[clips.length - 1].start + clips[clips.length - 1].duration 
                      : 0,
                    duration: 5000,
                    type: 'image',
                    layer: 1,
                    title: `Scene ${clips.length + 1}`,
                    description: 'New scene description',
                    imagePrompt: 'medium shot, cinematic scene with atmospheric lighting'
                  });
                }}
              >
                Add New Scene
              </Button>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-2">Project Information</h3>
              <Separator className="mb-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Scenes:</span>
                  <span>{clips.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Duration:</span>
                  <span>
                    {(clips.reduce((total, clip) => total + clip.duration, 0) / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Modified:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}