import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { 
  Music, 
  MusicIcon, 
  FileMusic, 
  Upload, 
  Repeat, 
  BrainCircuit, 
  MessageSquare
} from "lucide-react";

/**
 * Estructura para definir los parámetros avanzados de generación de música
 */
export interface MusicGenerationAdvancedParams {
  makeInstrumental: boolean;
  negativeTags: string;
  tags: string;
  lyricsType: 'auto' | 'none' | 'custom';
  customLyrics: string;
  seed: number;
  continueClipId: string;
  continueAt: number;
  gptDescriptionPrompt: string;
  prompt: string;
  title: string;
  serviceMode: string;
  generateLyrics: boolean;
  uploadAudio: boolean;
  audioUrl: string;
  tempo: number;
  keySignature: string;
  mainInstruments: string[];
  structure: {
    intro: boolean;
    verse: boolean;
    chorus: boolean;
    bridge: boolean;
    outro: boolean;
  };
  musicTemplate: string;
}

interface MusicGenerationAdvancedParamsProps {
  params: MusicGenerationAdvancedParams;
  setParams: (params: MusicGenerationAdvancedParams) => void;
  advancedModeType: 'standard' | 'continuation' | 'lyrics' | 'upload';
  setAdvancedModeType: (mode: 'standard' | 'continuation' | 'lyrics' | 'upload') => void;
}

/**
 * Componente para configurar parámetros avanzados de generación de música
 * Ofrece múltiples modos y opciones específicas para cada uno
 */
export function MusicGenerationAdvancedParams({
  params,
  setParams,
  advancedModeType,
  setAdvancedModeType
}: MusicGenerationAdvancedParamsProps) {
  const handleParamChange = (name: string, value: any) => {
    setParams({
      ...params,
      [name]: value
    });
  };
  
  const keySignatureOptions = [
    "C Major", "G Major", "D Major", "A Major", "E Major", "B Major", "F# Major", "Db Major",
    "Ab Major", "Eb Major", "Bb Major", "F Major",
    "A Minor", "E Minor", "B Minor", "F# Minor", "C# Minor", "G# Minor", "Eb Minor",
    "Bb Minor", "F Minor", "C Minor", "G Minor", "D Minor"
  ];
  
  return (
    <div className="space-y-4">
      {/* Selector de modo avanzado */}
      <Tabs 
        value={advancedModeType} 
        onValueChange={(v) => setAdvancedModeType(v as 'standard' | 'continuation' | 'lyrics' | 'upload')} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="standard" className="text-xs px-2 py-1.5">
            <MusicIcon className="w-3.5 h-3.5 mr-1" />
            Estándar
          </TabsTrigger>
          <TabsTrigger value="continuation" className="text-xs px-2 py-1.5">
            <Repeat className="w-3.5 h-3.5 mr-1" />
            Continuación
          </TabsTrigger>
          <TabsTrigger value="lyrics" className="text-xs px-2 py-1.5">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            Letras
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs px-2 py-1.5">
            <Upload className="w-3.5 h-3.5 mr-1" />
            Subir audio
          </TabsTrigger>
        </TabsList>
        
        {/* Parámetros para modo estándar */}
        <TabsContent value="standard" className="space-y-4 mt-4">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="music-params">
              <AccordionTrigger className="py-2 text-sm font-medium">
                <div className="flex items-center">
                  <Music className="h-4 w-4 mr-2" />
                  Parámetros Musicales
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 p-2">
                  {/* Tempo (BPM) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tempo" className="text-xs">Tempo (BPM)</Label>
                      <span className="text-xs font-mono">{params.tempo} BPM</span>
                    </div>
                    <Slider
                      id="tempo"
                      min={60}
                      max={180}
                      step={1}
                      value={[params.tempo]}
                      onValueChange={(values) => handleParamChange("tempo", values[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Lento</span>
                      <span>Medio</span>
                      <span>Rápido</span>
                    </div>
                  </div>
                  
                  {/* Tonalidad */}
                  <div className="space-y-2">
                    <Label htmlFor="keySignature" className="text-xs">Tonalidad</Label>
                    <Select
                      value={params.keySignature}
                      onValueChange={(value) => handleParamChange("keySignature", value)}
                    >
                      <SelectTrigger id="keySignature">
                        <SelectValue placeholder="Seleccionar tonalidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {keySignatureOptions.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Estructura musical */}
                  <div className="space-y-2">
                    <Label className="text-xs">Estructura musical</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="intro"
                          checked={params.structure.intro}
                          onCheckedChange={(checked) => handleParamChange("structure", { ...params.structure, intro: checked })}
                        />
                        <Label htmlFor="intro" className="text-xs">Intro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="verse"
                          checked={params.structure.verse}
                          onCheckedChange={(checked) => handleParamChange("structure", { ...params.structure, verse: checked })}
                        />
                        <Label htmlFor="verse" className="text-xs">Verso</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="chorus"
                          checked={params.structure.chorus}
                          onCheckedChange={(checked) => handleParamChange("structure", { ...params.structure, chorus: checked })}
                        />
                        <Label htmlFor="chorus" className="text-xs">Coro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="bridge"
                          checked={params.structure.bridge}
                          onCheckedChange={(checked) => handleParamChange("structure", { ...params.structure, bridge: checked })}
                        />
                        <Label htmlFor="bridge" className="text-xs">Puente</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="outro"
                          checked={params.structure.outro}
                          onCheckedChange={(checked) => handleParamChange("structure", { ...params.structure, outro: checked })}
                        />
                        <Label htmlFor="outro" className="text-xs">Outro</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="advanced-options">
              <AccordionTrigger className="py-2 text-sm font-medium">
                <div className="flex items-center">
                  <BrainCircuit className="h-4 w-4 mr-2" />
                  Opciones Avanzadas
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 p-2">
                  {/* Opciones instrumentales */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="makeInstrumental"
                      checked={params.makeInstrumental}
                      onCheckedChange={(checked) => handleParamChange("makeInstrumental", checked)}
                    />
                    <Label htmlFor="makeInstrumental" className="text-xs">Generar versión instrumental</Label>
                  </div>
                  
                  {/* Etiquetas a incluir */}
                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-xs">Etiquetas a incluir (separadas por comas)</Label>
                    <Input
                      id="tags"
                      value={params.tags}
                      onChange={(e) => handleParamChange("tags", e.target.value)}
                      placeholder="jazz, piano, smooth, ..."
                    />
                  </div>
                  
                  {/* Etiquetas a excluir */}
                  <div className="space-y-2">
                    <Label htmlFor="negativeTags" className="text-xs">Etiquetas a evitar (separadas por comas)</Label>
                    <Input
                      id="negativeTags"
                      value={params.negativeTags}
                      onChange={(e) => handleParamChange("negativeTags", e.target.value)}
                      placeholder="heavy, distorted, loud, ..."
                    />
                  </div>
                  
                  {/* Semilla de generación aleatoria */}
                  <div className="space-y-2">
                    <Label htmlFor="seed" className="text-xs">Semilla (-1 para aleatorio)</Label>
                    <Input
                      id="seed"
                      type="number"
                      value={params.seed}
                      onChange={(e) => handleParamChange("seed", parseInt(e.target.value) || -1)}
                      min="-1"
                      max="999999999"
                    />
                    <p className="text-xs text-muted-foreground">
                      Una semilla específica permite reproducir la misma generación.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        
        {/* Parámetros para modo continuación */}
        <TabsContent value="continuation" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="continueClipId" className="text-sm font-medium">ID del clip a continuar</Label>
              <Input
                id="continueClipId"
                value={params.continueClipId}
                onChange={(e) => handleParamChange("continueClipId", e.target.value)}
                placeholder="Ej. A1B2C3D4"
              />
              <p className="text-xs text-muted-foreground">
                Introduce el ID del clip de música que quieres continuar.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="continueAt" className="text-sm font-medium">Continuar en (segundos)</Label>
                <span className="text-xs font-mono">{params.continueAt}s</span>
              </div>
              <Slider
                id="continueAt"
                min={5}
                max={60}
                step={1}
                value={[params.continueAt]}
                onValueChange={(values) => handleParamChange("continueAt", values[0])}
              />
              <p className="text-xs text-muted-foreground">
                Define en qué segundo la nueva generación continuará la pieza original.
              </p>
            </div>
          </div>
        </TabsContent>
        
        {/* Parámetros para modo letras */}
        <TabsContent value="lyrics" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Opciones de letras</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="generateLyrics"
                  checked={params.generateLyrics}
                  onCheckedChange={(checked) => handleParamChange("generateLyrics", checked)}
                />
                <Label htmlFor="generateLyrics" className="text-xs">
                  Generar letras automáticamente
                </Label>
              </div>
            </div>
            
            {!params.generateLyrics && (
              <div className="space-y-2">
                <Label htmlFor="customLyrics" className="text-sm font-medium">Letras personalizadas</Label>
                <Textarea
                  id="customLyrics"
                  value={params.customLyrics}
                  onChange={(e) => handleParamChange("customLyrics", e.target.value)}
                  placeholder="Escribe aquí las letras que quieres para tu canción..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Separa los versos y coros con líneas en blanco para mejor estructuración.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Parámetros para modo subir audio */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="audioUrl" className="text-sm font-medium">URL del audio</Label>
              <Input
                id="audioUrl"
                value={params.audioUrl}
                onChange={(e) => handleParamChange("audioUrl", e.target.value)}
                placeholder="https://ejemplo.com/audio.mp3"
              />
              <p className="text-xs text-muted-foreground">
                Proporciona una URL pública a un archivo de audio MP3, WAV o FLAC.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subir archivo de audio</Label>
              <div className="border-2 border-dashed rounded-md p-4 text-center">
                <FileMusic className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Arrastra aquí tu archivo o
                </p>
                <Button type="button" size="sm" className="mx-auto">
                  Seleccionar archivo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos soportados: MP3, WAV, FLAC. Máximo 10 MB.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}