import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MusicGenreTemplate, 
  GenreTemplateSelector 
} from "./genre-template-selector";
import { 
  MusicGenerationAdvancedParams,
} from "./advanced-music-params";

import { 
  Sparkles, 
  Music, 
  Settings, 
  Loader2,
  PlusCircle,
  Info,
  AlertCircle
} from "lucide-react";

interface MusicGenerationSectionProps {
  musicGenreTemplates: MusicGenreTemplate[];
  selectedGenreTemplate: string;
  setSelectedGenreTemplate: (id: string) => void;
  isGeneratingMusic: boolean;
  musicGenerationProgress: number;
  handleGenerateMusic: () => void;
  musicPrompt: string;
  setMusicPrompt: (prompt: string) => void;
  musicTitle: string;
  setMusicTitle: (title: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  showAdvancedParams: boolean;
  setShowAdvancedParams: (show: boolean) => void;
  advancedModeType: 'standard' | 'continuation' | 'lyrics' | 'upload';
  setAdvancedModeType: (mode: 'standard' | 'continuation' | 'lyrics' | 'upload') => void;
  advancedParams: MusicGenerationAdvancedParams;
  setAdvancedParams: (params: MusicGenerationAdvancedParams) => void;
  applyMusicTemplate: (templateId: string) => void;
}

/**
 * Componente para la sección principal de generación de música
 * Integra el selector de plantillas de género y los controles de generación
 */
export function MusicGenerationSection({
  musicGenreTemplates,
  selectedGenreTemplate,
  setSelectedGenreTemplate,
  isGeneratingMusic,
  musicGenerationProgress,
  handleGenerateMusic,
  musicPrompt,
  setMusicPrompt,
  musicTitle,
  setMusicTitle,
  selectedModel,
  setSelectedModel,
  showAdvancedParams,
  setShowAdvancedParams,
  advancedModeType,
  setAdvancedModeType,
  advancedParams,
  setAdvancedParams,
  applyMusicTemplate
}: MusicGenerationSectionProps) {
  const [expandTemplates, setExpandTemplates] = useState<boolean>(false);
  
  // Manejador para seleccionar un template de género musical
  const handleTemplateSelect = (templateId: string) => {
    setSelectedGenreTemplate(templateId);
    applyMusicTemplate(templateId);
  };
  
  return (
    <div className="space-y-4">
      {/* Panel de selección de género */}
      <div className={`rounded-lg border bg-card ${expandTemplates ? 'p-4' : 'p-0 overflow-hidden'}`}>
        <div 
          className={`flex justify-between items-center cursor-pointer ${expandTemplates ? '' : 'p-4'}`}
          onClick={() => setExpandTemplates(!expandTemplates)}
        >
          <div className="flex items-center">
            <Music className="h-5 w-5 mr-2 text-primary" />
            <h3 className="font-medium">Plantillas por Género Musical</h3>
          </div>
          <Button variant="ghost" size="icon" className="ml-2 h-8 w-8">
            <PlusCircle className={`h-4 w-4 transition-transform ${expandTemplates ? 'rotate-45' : ''}`} />
          </Button>
        </div>
        
        {expandTemplates && (
          <div className="mt-2">
            <GenreTemplateSelector
              templates={musicGenreTemplates}
              selectedTemplate={selectedGenreTemplate}
              onTemplateSelect={handleTemplateSelect}
            />
          </div>
        )}
      </div>
      
      {/* Controles principales de generación */}
      <div className="space-y-4">
        {/* Campo de texto para prompt */}
        <div className="space-y-2">
          <Label htmlFor="musicPrompt">Descripción de la música</Label>
          <Textarea
            id="musicPrompt"
            placeholder="Describe la música que quieres generar. Por ejemplo: Una canción pop enérgica con ritmo de baile, sintetizadores y voces femeninas..."
            value={musicPrompt}
            onChange={(e) => setMusicPrompt(e.target.value)}
            className="min-h-[80px]"
            disabled={isGeneratingMusic}
          />
        </div>
        
        {/* Campo para título */}
        <div className="space-y-2">
          <Label htmlFor="musicTitle">Título de la canción (opcional)</Label>
          <Input
            id="musicTitle"
            placeholder="Ingresa un título para tu generación"
            value={musicTitle}
            onChange={(e) => setMusicTitle(e.target.value)}
            disabled={isGeneratingMusic}
          />
        </div>
        
        {/* Selector de modelo */}
        <div className="space-y-2">
          <Label htmlFor="model-selector">Modelo</Label>
          <Tabs 
            value={selectedModel} 
            onValueChange={setSelectedModel} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="music-s" className="text-xs">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> 
                Suno
              </TabsTrigger>
              <TabsTrigger value="music-u" className="text-xs">
                <Music className="h-3.5 w-3.5 mr-1.5" /> 
                Udio
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {selectedModel === 'music-s' 
              ? "Suno genera música de alta calidad con mayor rango de estilos y control preciso." 
              : "Udio produce resultados con más naturalidad en voces y es óptimo para música pop y moderna."}
          </p>
        </div>
        
        {/* Parámetros avanzados toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant={showAdvancedParams ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedParams(!showAdvancedParams)}
              className="flex items-center"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              {showAdvancedParams ? "Ocultar parámetros" : "Mostrar parámetros"}
            </Button>
          </div>
        </div>
        
        {/* Sección de parámetros avanzados */}
        {showAdvancedParams && (
          <div className="rounded-lg border p-4">
            <MusicGenerationAdvancedParams 
              params={advancedParams}
              setParams={setAdvancedParams}
              advancedModeType={advancedModeType}
              setAdvancedModeType={setAdvancedModeType}
            />
          </div>
        )}
        
        {/* Consejos para mejores resultados */}
        <Alert variant="default" className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Consejos para mejores resultados:</strong> Incluye el género musical, instrumentos, tempo, y cualquier artista de referencia. Cuanto más detallada sea tu descripción, mejores resultados obtendrás.
          </AlertDescription>
        </Alert>
        
        {/* Botón de generación y progreso */}
        <div className="pt-2">
          {isGeneratingMusic ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                <span>Generando música...</span>
                <span>{musicGenerationProgress}%</span>
              </div>
              <Progress value={musicGenerationProgress} className="h-2" />
              <div className="flex justify-center">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Este proceso puede tardar hasta 2 minutos...</span>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleGenerateMusic} 
              className="w-full py-6 text-md group"
              disabled={!musicPrompt.trim()}
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Generar Música
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}