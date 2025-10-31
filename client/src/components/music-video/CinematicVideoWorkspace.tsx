/**
 * Workspace para Creación de Videos Musicales con IA
 * Integra el editor de escenas cinematográficas con sistema de exportación JSON
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { 
  Plus, 
  Download, 
  Upload, 
  FileJson, 
  Wand2,
  Trash2,
  Play,
  Music
} from 'lucide-react';
import { CinematicSceneEditor, type CinematicSceneData } from './CinematicSceneEditor';
import { useToast } from "../../hooks/use-toast";
import { generateBatchImages, type CinematicScene } from "../../lib/api/gemini-image";

interface CinematicVideoWorkspaceProps {
  initialScenes?: CinematicSceneData[];
  audioUrl?: string;
  projectName?: string;
}

export function CinematicVideoWorkspace({ 
  initialScenes = [],
  audioUrl,
  projectName = "Mi Video Musical"
}: CinematicVideoWorkspaceProps) {
  const { toast } = useToast();
  const [scenes, setScenes] = useState<CinematicSceneData[]>(
    initialScenes.length > 0 ? initialScenes : getDefaultScenes()
  );
  const [selectedSceneId, setSelectedSceneId] = useState<number>(
    scenes.length > 0 ? scenes[0].id : 1
  );
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const handleSceneUpdate = (updatedScene: CinematicSceneData) => {
    setScenes(prev => 
      prev.map(scene => scene.id === updatedScene.id ? updatedScene : scene)
    );
  };

  const handleAddScene = () => {
    const newId = Math.max(...scenes.map(s => s.id)) + 1;
    const newScene: CinematicSceneData = {
      id: newId,
      scene: "Nueva escena",
      camera: "ARRI Alexa LF, lente 35mm",
      lighting: "Iluminación natural",
      style: "Cinematográfico moderno",
      movement: "Plano estático"
    };
    setScenes(prev => [...prev, newScene]);
    setSelectedSceneId(newId);
    
    toast({
      title: "Escena añadida",
      description: `Se ha añadido el corte #${newId}`
    });
  };

  const handleDeleteScene = (sceneId: number) => {
    if (scenes.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos una escena en el proyecto.",
        variant: "destructive"
      });
      return;
    }

    setScenes(prev => prev.filter(s => s.id !== sceneId));
    
    if (selectedSceneId === sceneId) {
      const remainingScenes = scenes.filter(s => s.id !== sceneId);
      setSelectedSceneId(remainingScenes[0]?.id || 1);
    }

    toast({
      title: "Escena eliminada",
      description: `El corte #${sceneId} ha sido eliminado`
    });
  };

  const handleExportJSON = () => {
    const exportData = scenes.map(scene => ({
      id: scene.id,
      scene: scene.scene,
      camera: scene.camera,
      lighting: scene.lighting,
      style: scene.style,
      movement: scene.movement
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}_scenes.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "JSON exportado",
      description: "El archivo JSON con las escenas ha sido descargado."
    });
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(json)) {
          throw new Error('El archivo JSON debe contener un array de escenas');
        }

        const importedScenes: CinematicSceneData[] = json.map((scene: any) => ({
          id: scene.id || Date.now(),
          scene: scene.scene || "",
          camera: scene.camera || "",
          lighting: scene.lighting || "",
          style: scene.style || "",
          movement: scene.movement || ""
        }));

        setScenes(importedScenes);
        setSelectedSceneId(importedScenes[0]?.id || 1);

        toast({
          title: "JSON importado",
          description: `Se han importado ${importedScenes.length} escenas correctamente.`
        });
      } catch (error: any) {
        console.error('Error importando JSON:', error);
        toast({
          title: "Error al importar",
          description: error.message || "El archivo JSON no es válido.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };

  const handleGenerateAllImages = async () => {
    setIsGeneratingAll(true);
    
    try {
      toast({
        title: "Generando imágenes",
        description: `Generando ${scenes.length} imágenes con Gemini AI...`
      });

      const results = await generateBatchImages(scenes);
      
      const updatedScenes = scenes.map(scene => {
        const result = results[scene.id];
        if (result?.success && result.imageUrl) {
          return { ...scene, imageUrl: result.imageUrl };
        }
        return scene;
      });

      setScenes(updatedScenes);

      const successCount = Object.values(results).filter(r => r.success).length;
      
      toast({
        title: "Generación completada",
        description: `${successCount} de ${scenes.length} imágenes generadas exitosamente.`
      });
    } catch (error: any) {
      console.error('Error generando imágenes:', error);
      toast({
        title: "Error",
        description: "No se pudieron generar todas las imágenes. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Barra de herramientas superior */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {projectName}
            </CardTitle>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddScene}
                data-testid="button-add-scene"
              >
                <Plus className="h-4 w-4 mr-1" />
                Añadir Corte
              </Button>
              
              <label htmlFor="import-json">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-testid="button-import-json"
                >
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Importar JSON
                  </span>
                </Button>
                <input
                  id="import-json"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
              </label>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                data-testid="button-export-json"
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar JSON
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={handleGenerateAllImages}
                disabled={isGeneratingAll}
                data-testid="button-generate-all"
              >
                <Wand2 className="h-4 w-4 mr-1" />
                {isGeneratingAll ? "Generando..." : "Generar Todas"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenido principal: Lista de escenas y editor */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
        {/* Lista de escenas */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cortes ({scenes.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-1 p-4">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`
                      flex items-center justify-between p-3 rounded-md cursor-pointer
                      transition-colors
                      ${selectedSceneId === scene.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'}
                    `}
                    onClick={() => setSelectedSceneId(scene.id)}
                    data-testid={`scene-item-${scene.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Corte #{scene.id}</p>
                      <p className="text-xs truncate opacity-80">
                        {scene.scene.substring(0, 40)}...
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(scene.id);
                      }}
                      data-testid={`button-delete-${scene.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Editor de escena seleccionada */}
        <div className="lg:col-span-3 overflow-auto">
          {selectedScene ? (
            <CinematicSceneEditor
              key={selectedScene.id}
              scene={selectedScene}
              onUpdate={handleSceneUpdate}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Selecciona o añade una escena</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Escenas de ejemplo por defecto
function getDefaultScenes(): CinematicSceneData[] {
  return [
    {
      id: 1,
      scene: "Plano general: el artista camina con paso firme sobre la pista de un aeropuerto privado al atardecer. Detrás se observan jets ejecutivos alineados, hangares blancos y luces cálidas encendiéndose.",
      camera: "ARRI Alexa LF, lente 35mm anamórfico, formato 2.39:1",
      lighting: "golden hour cálida con flare solar lateral, reflejos metálicos sobre los jets y sombras largas",
      style: "Bruno Aveillan – lujo cinematográfico con atmósfera de poder y éxito",
      movement: "travelling frontal lento con ligero paneo hacia el skyline iluminado al fondo"
    },
    {
      id: 2,
      scene: "Plano medio: el artista se detiene junto a un jet privado Gulfstream G700, mira hacia cámara con expresión seria, el viento mueve su camisa roja mientras las hélices giran en el fondo.",
      camera: "Sony Venice 8K, lente 50mm con filtro ND suave, enfoque en el rostro",
      lighting: "puesta de sol intensa detrás del avión, tonos naranjas y dorados con flare natural",
      style: "look cinematográfico premium, contraste entre el cielo cálido y el metal frío de los jets",
      movement: "cámara en slow motion acercándose lentamente hasta plano cerrado"
    },
    {
      id: 3,
      scene: "Plano aéreo con drone: el artista camina por la pista entre dos jets privados mientras un tercer avión despega al fondo. La ciudad brilla en el horizonte bajo el último sol del día.",
      camera: "drone 8K, lente gran angular 24mm",
      lighting: "cielo anaranjado con reflejos rosados y luces de pista encendiéndose",
      style: "cine de lujo internacional, energía de movimiento y grandeza visual",
      movement: "ascenso lento en espiral para capturar el jet despegando y el artista en tierra"
    }
  ];
}
