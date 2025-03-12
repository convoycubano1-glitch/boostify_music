import { useState } from "react";
import { Input } from "../../ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../../ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "../../ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "../../ui/alert";
import { MusicGenreTemplate } from "./genre-data";
import { GenreTemplateSelector } from "./genre-template-selector";
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
      {/* Genre selection panel */}
      <div className={`rounded-lg border bg-card ${expandTemplates ? 'p-4' : 'p-0 overflow-hidden'}`}>
        <div 
          className={`flex justify-between items-center cursor-pointer ${expandTemplates ? '' : 'p-4'}`}
          onClick={() => setExpandTemplates(!expandTemplates)}
        >
          <div className="flex items-center">
            <Music className="h-5 w-5 mr-2 text-primary" />
            <h3 className="font-medium">Music Genre Templates</h3>
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
      
      {/* Main generation controls */}
      <div className="space-y-4">
        {/* Prompt text field */}
        <div className="space-y-2">
          <Label htmlFor="musicPrompt">Music Description</Label>
          <Textarea
            id="musicPrompt"
            placeholder="Describe the music you want to generate. For example: An energetic pop song with dance rhythm, synthesizers and female vocals..."
            value={musicPrompt}
            onChange={(e) => setMusicPrompt(e.target.value)}
            className="min-h-[80px]"
            disabled={isGeneratingMusic}
          />
        </div>
        
        {/* Title field */}
        <div className="space-y-2">
          <Label htmlFor="musicTitle">Song Title (optional)</Label>
          <Input
            id="musicTitle"
            placeholder="Enter a title for your generation"
            value={musicTitle}
            onChange={(e) => setMusicTitle(e.target.value)}
            disabled={isGeneratingMusic}
          />
        </div>
        
        {/* Model selector */}
        <div className="space-y-2">
          <Label htmlFor="model-selector">Model</Label>
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
              ? "Suno generates high-quality music with a wider range of styles and precise control." 
              : "Udio produces results with more natural vocals and is optimal for pop and modern music."}
          </p>
        </div>
        
        {/* Advanced parameters toggle */}
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
              {showAdvancedParams ? "Hide Parameters" : "Show Parameters"}
            </Button>
          </div>
        </div>
        
        {/* Advanced parameters section */}
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
        
        {/* Tips for better results */}
        <Alert variant="default" className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Tips for better results:</strong> Include the musical genre, instruments, tempo, and any reference artists. The more detailed your description, the better results you'll get.
          </AlertDescription>
        </Alert>
        
        {/* Generation button and progress */}
        <div className="pt-2">
          {isGeneratingMusic ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                <span>Generating music...</span>
                <span>{musicGenerationProgress}%</span>
              </div>
              <Progress value={musicGenerationProgress} className="h-2" />
              <div className="flex justify-center">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>This process may take up to 2 minutes...</span>
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
              Generate Music
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}