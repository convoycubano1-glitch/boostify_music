/**
 * Componente MotionEditor
 * Editor para controlar aspectos de movimiento y efectos en la escena
 */
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wand2, Volume2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MotionEditorProps {
  settings?: {
    intensity: number;
    seed: string;
    duration: string;
  };
  autoSfx?: boolean;
  onSettingsChange: (settings: MotionEditorProps['settings']) => void;
  onAutoSfxChange: (autoSfx: boolean) => void;
}

// Opciones predefinidas para la duración del movimiento
const DURATION_OPTIONS = [
  '3s', '5s', '7s', '9s'
];

export function MotionEditor({ 
  settings = { intensity: 50, seed: '123456', duration: '5s' }, 
  autoSfx = false,
  onSettingsChange,
  onAutoSfxChange
}: MotionEditorProps) {
  const [intensity, setIntensity] = useState(settings.intensity);
  const [seed, setSeed] = useState(settings.seed);
  const [duration, setDuration] = useState(settings.duration);

  // Sincronizar con cambios de props
  useEffect(() => {
    setIntensity(settings.intensity);
    setSeed(settings.seed);
    setDuration(settings.duration);
  }, [settings]);

  const handleIntensityChange = (value: number[]) => {
    const newIntensity = value[0];
    setIntensity(newIntensity);
    onSettingsChange({
      ...settings,
      intensity: newIntensity
    });
  };

  const handleSeedChange = (value: string) => {
    setSeed(value);
    onSettingsChange({
      ...settings,
      seed: value
    });
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    onSettingsChange({
      ...settings,
      duration: value
    });
  };

  const handleAutoSfxChange = (checked: boolean) => {
    onAutoSfxChange(checked);
  };

  const generateRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000).toString();
    setSeed(newSeed);
    onSettingsChange({
      ...settings,
      seed: newSeed
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Motion editor</Label>
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <Switch 
            checked={autoSfx} 
            onCheckedChange={handleAutoSfxChange}
            id="auto-sfx"
          />
          <Label htmlFor="auto-sfx" className="text-xs">
            Auto SFX
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">Intensidad</Label>
            <span className="text-xs font-mono">{intensity}%</span>
          </div>
          <Slider 
            value={[intensity]} 
            min={0} 
            max={100} 
            step={1} 
            onValueChange={handleIntensityChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Seed</Label>
            <div className="flex space-x-2">
              <Input 
                value={seed}
                onChange={(e) => handleSeedChange(e.target.value)}
                className="h-8"
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={generateRandomSeed}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Duración</Label>
            <Select 
              value={duration} 
              onValueChange={handleDurationChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Duración" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}