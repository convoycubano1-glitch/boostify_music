import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Settings, Move, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

// Interfaz para módulos configurables
export interface ModuleConfig {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  position: number;
  minSize?: number;
  maxSize?: number;
  defaultSize?: number;
}

export interface ModuleConfiguratorProps {
  modules: ModuleConfig[];
  onModuleUpdate: (updatedModules: ModuleConfig[]) => void;
  onResetDefaults: () => void;
  layouts?: { id: string, name: string }[];
  onLayoutChange?: (layoutId: string) => void;
  currentLayout?: string;
}

export function ModuleConfigurator({
  modules,
  onModuleUpdate,
  onResetDefaults,
  layouts,
  onLayoutChange,
  currentLayout
}: ModuleConfiguratorProps) {
  const [localModules, setLocalModules] = useState<ModuleConfig[]>(modules);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Manejar cambios en un módulo
  const handleModuleChange = (moduleId: string, updates: Partial<ModuleConfig>) => {
    const updatedModules = localModules.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    );
    setLocalModules(updatedModules);
  };

  // Guardar cambios
  const handleSave = () => {
    onModuleUpdate(localModules);
    setDialogOpen(false);
  };

  // Cancelar cambios
  const handleCancel = () => {
    setLocalModules([...modules]);
    setDialogOpen(false);
  };

  // Reordenar módulos
  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    const index = localModules.findIndex(m => m.id === moduleId);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === localModules.length - 1)
    ) {
      return; // No hacer nada si ya está en el extremo
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newModules = [...localModules];
    
    // Intercambiar posiciones
    [newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]];
    
    // Actualizar valores numéricos de position
    newModules.forEach((module, idx) => {
      module.position = idx;
    });
    
    setLocalModules(newModules);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración de módulos</DialogTitle>
          <DialogDescription>
            Personaliza la visibilidad, posición y comportamiento de los módulos del editor.
          </DialogDescription>
        </DialogHeader>

        {layouts && layouts.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">Distribuciones predefinidas</h4>
            <div className="flex gap-2 flex-wrap">
              {layouts.map(layout => (
                <Button
                  key={layout.id}
                  variant={currentLayout === layout.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onLayoutChange && onLayoutChange(layout.id)}
                >
                  {layout.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <Accordion type="single" collapsible defaultValue="modules">
          <AccordionItem value="modules">
            <AccordionTrigger>Módulos del editor</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {localModules.map((module) => (
                  <div 
                    key={module.id} 
                    className="p-3 border border-zinc-800 rounded-lg bg-zinc-950"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{module.name}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveModule(module.id, 'up')}
                          disabled={module.position === 0}
                        >
                          <Move className="h-3 w-3 rotate-90" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveModule(module.id, 'down')}
                          disabled={module.position === localModules.length - 1}
                        >
                          <Move className="h-3 w-3 -rotate-90" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`visible-${module.id}`}
                          checked={module.visible}
                          onCheckedChange={(checked) => 
                            handleModuleChange(module.id, { visible: checked })
                          }
                        />
                        <Label htmlFor={`visible-${module.id}`} className="text-sm flex items-center">
                          {module.visible ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Oculto
                            </>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`locked-${module.id}`}
                          checked={module.locked}
                          onCheckedChange={(checked) => 
                            handleModuleChange(module.id, { locked: checked })
                          }
                        />
                        <Label htmlFor={`locked-${module.id}`} className="text-sm flex items-center">
                          {module.locked ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Bloqueado
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              Desbloqueado
                            </>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={onResetDefaults}>
            Restaurar valores
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}