/**
 * Componente MotionEditor
 * Editor para configurar el movimiento y efectos de la escena
 */
import React, { useState } from 'react';
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Slider } from "../../ui/slider";
import { Switch } from "../../ui/switch";
import { Button } from "../../ui/button";
import { 
  Move, 
  Music, 
  RotateCcw, 
  Sparkles, 
  Volume2 
} from 'lucide-react';
import { Badge } from "../../ui/badge";

interface MotionSettings {
  intensity: number;
  seed: string;
  duration: string;
}

interface MotionEditorProps {
  settings?: MotionSettings;
  autoSfx?: boolean;
  onSettingsChange: (settings: MotionSettings) => void;
  onAutoSfxChange: (autoSfx: boolean) => void;
}

export function MotionEditor({ 
  settings = { intensity: 50, seed: '12345', duration: '5s' },
  autoSfx = false,
  onSettingsChange,
  onAutoSfxChange
}: MotionEditorProps) {
  const [localSettings, setLocalSettings] = useState<MotionSettings>(settings);
  
  const handleIntensityChange = (values: number[]) => {
    const newSettings = { ...localSettings, intensity: values[0] };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleSeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...localSettings, seed: event.target.value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleDurationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    // Asegurar que termina con 's' para segundos
    if (!value.endsWith('s') && !isNaN(Number(value))) {
      value = value + 's';
    }
    
    const newSettings = { ...localSettings, duration: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const regenerateSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000).toString();
    const newSettings = { ...localSettings, seed: newSeed };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  const handleAutoSfxChange = (checked: boolean) => {
    onAutoSfxChange(checked);
  };

  // Convertir duración de "5s" a 5 para el slider
  const getDurationValue = () => {
    const durationStr = localSettings.duration;
    if (durationStr.endsWith('s')) {
      const numValue = parseFloat(durationStr.slice(0, -1));
      if (!isNaN(numValue)) {
        return numValue;
      }
    }
    return 5; // valor por defecto
  };

  const handleDurationSliderChange = (values: number[]) => {
    const newDuration = `${values[0]}s`;
    const newSettings = { ...localSettings, duration: newDuration };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4" />
          <Label className="text-sm font-medium">Motion Settings</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Engine: Standard
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs">Motion Intensity</Label>
            <span className="text-xs text-muted-foreground">{localSettings.intensity}%</span>
          </div>
          <Slider
            value={[localSettings.intensity]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleIntensityChange}
            className="mt-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs">Duration</Label>
            <span className="text-xs text-muted-foreground">{localSettings.duration}</span>
          </div>
          <Slider
            value={[getDurationValue()]}
            min={1}
            max={20}
            step={0.5}
            onValueChange={handleDurationSliderChange}
            className="mt-2"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Seed</Label>
          <div className="flex gap-2">
            <Input
              value={localSettings.seed}
              onChange={handleSeedChange}
              className="h-8 text-xs"
              placeholder="Random seed for generation"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2" 
              onClick={regenerateSeed}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Auto SFX</Label>
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoSfx}
              onCheckedChange={handleAutoSfxChange}
              id="auto-sfx"
            />
            <Label htmlFor="auto-sfx" className="text-xs cursor-pointer">
              <div className="flex items-center gap-1">
                <Volume2 className="h-3 w-3" />
                <span>Añadir efectos de sonido automáticamente</span>
              </div>
            </Label>
          </div>
        </div>
      </div>
      
      <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground flex items-center gap-2">
        <Sparkles className="h-3 w-3" />
        <span>
          La intensidad afecta la fluidez del movimiento. Valores más altos pueden crear efectos más dramáticos.
        </span>
      </div>
    </div>
  );
}