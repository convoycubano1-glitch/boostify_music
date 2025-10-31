/**
 * Workspace Completo para Creación de Videos Musicales con IA
 * Sistema profesional con timeline sincronizado, generación automática y referencias faciales
 */
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  Plus, 
  Download, 
  Upload, 
  Wand2,
  Trash2,
  Play,
  Music,
  Image as ImageIcon,
  Users,
  Sparkles,
  Film,
  Loader2
} from 'lucide-react';
import { CinematicSceneEditor, type CinematicSceneData } from './CinematicSceneEditor';
import { useToast } from "../../hooks/use-toast";

// Estilos de edición disponibles
const editingStyles = [
  { id: "cinematic", name: "Cinematográfico", description: "Cortes largos y cinematográficos", duration: { min: 3, max: 8 } },
  { id: "music_video", name: "Video Musical", description: "Cortes rápidos y dinámicos estilo MTV", duration: { min: 1, max: 3 } },
  { id: "dynamic", name: "Dinámico", description: "Adapta a la energía de la música", duration: { min: 1.5, max: 4 } },
  { id: "slow", name: "Lento", description: "Transiciones suaves", duration: { min: 5, max: 10 } },
  { id: "rhythmic", name: "Rítmico", description: "Cortes en cada beat", duration: { min: 1, max: 2 } },
];

interface ReferenceImage {
  id: number;
  file: File;
  preview: string;
  base64: string;
}

interface MusicVideoWorkspaceCompleteProps {
  projectName?: string;
}

export function MusicVideoWorkspaceComplete({ 
  projectName = "Mi Video Musical"
}: MusicVideoWorkspaceCompleteProps) {
  const { toast } = useToast();
  const [scenes, setScenes] = useState<CinematicSceneData[]>(getDefaultScenes());
  const [selectedSceneId, setSelectedSceneId] = useState<number>(scenes[0]?.id || 1);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState<number | null>(null);
  const [editingStyle, setEditingStyle] = useState<string>("cinematic");
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para convertir File a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Extraer solo la parte base64 (sin el prefijo data:image/...)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Manejo de carga de imágenes de referencia
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: ReferenceImage[] = [];
    
    for (let i = 0; i < Math.min(files.length, 3 - referenceImages.length); i++) {
      const file = files[i];
      const preview = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      
      newImages.push({
        id: Date.now() + i,
        file,
        preview,
        base64
      });
    }

    setReferenceImages(prev => [...prev, ...newImages]);
    
    if (newImages.length > 0) {
      setSelectedReferenceId(newImages[0].id);
      toast({
        title: "Imágenes cargadas",
        description: `Se han cargado ${newImages.length} imagen(es) de referencia.`
      });
    }

    event.target.value = '';
  };

  const handleDeleteReference = (id: number) => {
    setReferenceImages(prev => prev.filter(img => img.id !== id));
    if (selectedReferenceId === id) {
      setSelectedReferenceId(null);
    }
    toast({
      title: "Imagen eliminada",
      description: "La imagen de referencia ha sido eliminada."
    });
  };

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
  };

  const handleDeleteScene = (sceneId: number) => {
    if (scenes.length <= 1) {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos una escena.",
        variant: "destructive"
      });
      return;
    }

    setScenes(prev => prev.filter(s => s.id !== sceneId));
    if (selectedSceneId === sceneId) {
      const remainingScenes = scenes.filter(s => s.id !== sceneId);
      setSelectedSceneId(remainingScenes[0]?.id || 1);
    }
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

  const handleGenerateAllImages = async () => {
    setIsGeneratingAll(true);
    setGenerationProgress(0);
    
    try {
      const selectedReference = referenceImages.find(img => img.id === selectedReferenceId);
      
      toast({
        title: "Generando video completo",
        description: selectedReference 
          ? `Generando ${scenes.length} cortes con rostro de referencia...`
          : `Generando ${scenes.length} cortes...`
      });

      const endpoint = selectedReference 
        ? '/api/gemini/generate-batch-with-face'
        : '/api/gemini/generate-batch';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenes,
          ...(selectedReference && { referenceImageBase64: selectedReference.base64 })
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const updatedScenes = scenes.map(scene => {
          const result = data.results[scene.id];
          if (result?.success && result.imageUrl) {
            return { ...scene, imageUrl: result.imageUrl };
          }
          return scene;
        });

        setScenes(updatedScenes);
        setGenerationProgress(100);

        const successCount = Object.values(data.results).filter((r: any) => r.success).length;
        
        toast({
          title: "Video generado",
          description: `${successCount} de ${scenes.length} cortes generados exitosamente.`
        });
      } else {
        throw new Error(data.error || 'Error al generar imágenes');
      }
    } catch (error: any) {
      console.error('Error generando video:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el video. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAll(false);
      setGenerationProgress(0);
    }
  };

  const selectedScene = scenes.find(s => s.id === selectedSceneId);

  return (
    <div className="flex flex-col h-full gap-3 p-3 md:p-4 bg-background">
      {/* Header con controles */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 px-4 md:px-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Music className="h-5 w-5" />
                {projectName}
              </CardTitle>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  data-testid="button-export-json"
                  className="text-xs md:text-sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar JSON
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateAllImages}
                  disabled={isGeneratingAll || scenes.length === 0}
                  data-testid="button-generate-video"
                  className="text-xs md:text-sm"
                >
                  {isGeneratingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Generando {generationProgress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1" />
                      Generar Video
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Estilo de edición y referencias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editing-style" className="text-xs md:text-sm">Estilo de Edición</Label>
                <Select value={editingStyle} onValueChange={setEditingStyle}>
                  <SelectTrigger id="editing-style" className="text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editingStyles.map((style) => (
                      <SelectItem key={style.id} value={style.id} className="text-xs md:text-sm">
                        {style.name} - {style.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs md:text-sm flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Imágenes de Referencia ({referenceImages.length}/3)
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={referenceImages.length >= 3}
                    className="flex-1 text-xs md:text-sm"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Subir Imagen
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>

            {/* Referencias visuales */}
            {referenceImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {referenceImages.map((img) => (
                  <div
                    key={img.id}
                    className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedReferenceId === img.id 
                        ? 'border-primary shadow-lg' 
                        : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedReferenceId(img.id)}
                  >
                    <img 
                      src={img.preview} 
                      alt="Referencia" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReference(img.id);
                      }}
                      className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-bl-md"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Timeline y Editor */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 overflow-hidden min-h-0">
        {/* Timeline de escenas */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm md:text-base flex items-center gap-1">
                <Film className="h-4 w-4" />
                Timeline ({scenes.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleAddScene}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-3">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`
                      flex items-center gap-2 p-2 rounded-md cursor-pointer
                      transition-all text-xs md:text-sm
                      ${selectedSceneId === scene.id 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-muted'}
                    `}
                    onClick={() => setSelectedSceneId(scene.id)}
                    data-testid={`scene-item-${scene.id}`}
                  >
                    {scene.imageUrl ? (
                      <img 
                        src={scene.imageUrl} 
                        alt={`Corte ${scene.id}`}
                        className="w-12 h-8 md:w-16 md:h-10 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-8 md:w-16 md:h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-4 w-4 opacity-50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">Corte #{scene.id}</p>
                      <p className="text-xs truncate opacity-80">
                        {scene.scene.substring(0, 30)}...
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(scene.id);
                      }}
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
              <p className="text-muted-foreground text-sm md:text-base">
                Selecciona o añade una escena
              </p>
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
      scene: "Plano medio: el artista se detiene junto a un jet privado Gulfstream G700, mira hacia cámara con expresión seria, el viento mueve su camisa mientras las hélices giran en el fondo.",
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
