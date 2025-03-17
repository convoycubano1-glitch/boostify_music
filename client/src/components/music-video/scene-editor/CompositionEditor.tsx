/**
 * Componente CompositionEditor
 * Editor para la configuración de composición de la escena 
 */
import React, { useState } from 'react';
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { 
  Maximize, 
  Minimize,
  Move,
  LayoutGrid, 
  Laptop,
  Palette,
  Image as ImageIcon,
  RefreshCw
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../ui/select";
import { Slider } from "../../ui/slider";
import { Switch } from "../../ui/switch";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

interface CompositionSettings {
  style: string;
  aspectRatio: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string;
  stabilityLevel?: number;
  layoutGrid?: {
    columns: number;
    rows: number;
  };
}

interface CompositionEditorProps {
  settings?: CompositionSettings;
  onSettingsChange: (settings: CompositionSettings) => void;
  onGenerateImage?: () => Promise<string>;
}

const ASPECT_RATIOS = [
  { label: "16:9", value: "16:9" },
  { label: "4:3", value: "4:3" },
  { label: "1:1", value: "1:1" },
  { label: "9:16", value: "9:16" },
  { label: "21:9", value: "21:9" }
];

const STYLE_PRESETS = [
  { label: "Cinemático", value: "cinematic" },
  { label: "Animación", value: "animation" },
  { label: "Fotorealista", value: "photorealistic" },
  { label: "Anime", value: "anime" },
  { label: "3D Renderizado", value: "3d_render" },
  { label: "Abstracto", value: "abstract" }
];

export function CompositionEditor({ 
  settings = {
    style: "cinematic",
    aspectRatio: "16:9",
    prompt: "",
    stabilityLevel: 50,
    layoutGrid: { columns: 3, rows: 3 }
  },
  onSettingsChange,
  onGenerateImage
}: CompositionEditorProps) {
  const [localSettings, setLocalSettings] = useState<CompositionSettings>(settings);
  const [isPromptExpanded, setIsPromptExpanded] = useState(Boolean(settings.prompt));
  const [activeTab, setActiveTab] = useState("visual");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleStyleChange = (value: string) => {
    const newSettings = { ...localSettings, style: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleAspectRatioChange = (value: string) => {
    const newSettings = { ...localSettings, aspectRatio: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSettings = { ...localSettings, prompt: event.target.value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleNegativePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newSettings = { ...localSettings, negativePrompt: event.target.value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleStabilityChange = (values: number[]) => {
    const newSettings = { ...localSettings, stabilityLevel: values[0] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleGridColumnChange = (values: number[]) => {
    const newSettings = {
      ...localSettings,
      layoutGrid: {
        ...localSettings.layoutGrid,
        columns: values[0]
      }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleGridRowChange = (values: number[]) => {
    const newSettings = {
      ...localSettings,
      layoutGrid: {
        ...localSettings.layoutGrid,
        rows: values[0]
      }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleGenerateImage = async () => {
    if (!onGenerateImage) return;
    
    try {
      setIsGenerating(true);
      const imageUrl = await onGenerateImage();
      
      if (imageUrl) {
        const newSettings = { ...localSettings, imageUrl };
        setLocalSettings(newSettings);
        onSettingsChange(newSettings);
      }
    } catch (error) {
      console.error("Error generando imagen:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Laptop className="h-4 w-4" />
          <Label className="text-sm font-medium">Composición y Estilo</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            AI-Generated
          </Badge>
        </div>
      </div>
      
      <Tabs 
        defaultValue="visual" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs">
            <LayoutGrid className="h-3 w-3 mr-1" />
            Layout
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="visual" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Estilo</Label>
              <Select 
                value={localSettings.style} 
                onValueChange={handleStyleChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Seleccionar estilo" />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_PRESETS.map(style => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Relación de Aspecto</Label>
              <Select 
                value={localSettings.aspectRatio} 
                onValueChange={handleAspectRatioChange}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Seleccionar relación" />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map(ratio => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Nivel de Estabilidad</Label>
              <span className="text-xs text-muted-foreground">{localSettings.stabilityLevel}%</span>
            </div>
            <Slider
              value={[localSettings.stabilityLevel || 50]}
              min={0}
              max={100}
              step={5}
              onValueChange={handleStabilityChange}
              className="mt-2"
            />
          </div>
          
          <Collapsible
            open={isPromptExpanded}
            onOpenChange={setIsPromptExpanded}
            className="rounded-md border p-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs">Prompt de Imagen</Label>
              </div>
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isPromptExpanded ? (
                    <Minimize className="h-3 w-3" />
                  ) : (
                    <Maximize className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Prompt</Label>
                <Textarea
                  value={localSettings.prompt}
                  onChange={handlePromptChange}
                  className="min-h-[80px] resize-none"
                  placeholder="Describe detalladamente la imagen deseada..."
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Prompt Negativo (opcional)</Label>
                <Textarea
                  value={localSettings.negativePrompt || ""}
                  onChange={handleNegativePromptChange}
                  className="min-h-[60px] resize-none"
                  placeholder="Elementos a evitar en la imagen..."
                />
              </div>
              
              <Button 
                onClick={handleGenerateImage} 
                disabled={!localSettings.prompt || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generar Imagen
                  </>
                )}
              </Button>
              
              {localSettings.imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden border">
                  <img 
                    src={localSettings.imageUrl} 
                    alt="Generated composition" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>
        
        <TabsContent value="layout" className="space-y-4 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Columnas</Label>
              <span className="text-xs text-muted-foreground">
                {localSettings.layoutGrid?.columns || 3}
              </span>
            </div>
            <Slider 
              value={[localSettings.layoutGrid?.columns || 3]}
              min={1}
              max={6}
              step={1}
              onValueChange={handleGridColumnChange}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Filas</Label>
              <span className="text-xs text-muted-foreground">
                {localSettings.layoutGrid?.rows || 3}
              </span>
            </div>
            <Slider 
              value={[localSettings.layoutGrid?.rows || 3]}
              min={1}
              max={6}
              step={1}
              onValueChange={handleGridRowChange}
            />
          </div>
          
          <div className="rounded-md bg-muted p-4 grid place-items-center">
            <div 
              className="grid gap-1 border border-dashed border-muted-foreground rounded-md p-2"
              style={{
                gridTemplateColumns: `repeat(${localSettings.layoutGrid?.columns || 3}, 1fr)`,
                gridTemplateRows: `repeat(${localSettings.layoutGrid?.rows || 3}, 20px)`
              }}
            >
              {Array(localSettings.layoutGrid?.rows || 3).fill(0).map((_, rowIndex) => (
                Array(localSettings.layoutGrid?.columns || 3).fill(0).map((_, colIndex) => (
                  <div 
                    key={`${rowIndex}-${colIndex}`} 
                    className="bg-muted-foreground/20 rounded-sm"
                  />
                ))
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}