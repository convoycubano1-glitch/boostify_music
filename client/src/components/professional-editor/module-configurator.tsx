import React, { useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Check, X, Move, Eye, EyeOff, Settings, Paintbrush, Layout, ArrowUpDown, RotateCcw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// ModuleConfig ya fue definido en resize-handle-control.tsx
// Lo importamos para mantener la coherencia
import { ModuleConfig } from './resize-handle-control';

export interface ModuleConfiguratorProps {
  modules: ModuleConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (modules: ModuleConfig[]) => void;
  activeEffects?: string[];
  onResetLayout?: () => void;
}

// Combined default and named export
export default function ModuleConfiguratorComponent({
  modules,
  open,
  onOpenChange,
  onSave,
  activeEffects = [],
  onResetLayout
}: ModuleConfiguratorProps) {
  const [localModules, setLocalModules] = useState<ModuleConfig[]>(() => [...modules]);
  
  // Función para manejar cambios en los módulos
  const handleModuleChange = useCallback((id: string, updates: Partial<ModuleConfig>) => {
    setLocalModules(prev => 
      prev.map(module => module.id === id ? { ...module, ...updates } : module)
    );
  }, []);
  
  // Función para manejar el drag-and-drop
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(localModules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Actualizar las posiciones después del reordenamiento
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setLocalModules(updatedItems);
  }, [localModules]);
  
  // Función para guardar los cambios
  const handleSave = useCallback(() => {
    onSave(localModules);
    onOpenChange(false);
  }, [localModules, onSave, onOpenChange]);
  
  // Función para cancelar los cambios
  const handleCancel = useCallback(() => {
    setLocalModules([...modules]);
    onOpenChange(false);
  }, [modules, onOpenChange]);
  
  // Función para restablecer la disposición predeterminada
  const handleResetLayout = useCallback(() => {
    if (onResetLayout) {
      onResetLayout();
      setLocalModules([...modules]);
      onOpenChange(false);
    }
  }, [onResetLayout, modules, onOpenChange]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuración de módulos</DialogTitle>
          <DialogDescription>
            Personaliza los módulos visibles y su orden en el editor.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ScrollArea className="h-[350px] pr-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="modules">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {localModules.sort((a, b) => a.position - b.position).map((module, index) => (
                      <Draggable key={module.id} draggableId={module.id} index={index}>
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border ${module.enabled ? 'border-primary/20' : 'border-muted/30'}`}
                          >
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-move p-1"
                                >
                                  <Move size={16} className="text-muted-foreground" />
                                </div>
                                
                                <div className="flex flex-col">
                                  <span className={`font-medium ${module.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {module.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {module.type}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {module.type === 'panel' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={!module.enabled}
                                    onClick={() => handleModuleChange(module.id, { visible: !module.visible })}
                                    title={module.visible ? "Ocultar panel" : "Mostrar panel"}
                                  >
                                    {module.visible ? (
                                      <Eye size={16} className={module.enabled ? "text-primary" : "text-muted-foreground"} />
                                    ) : (
                                      <EyeOff size={16} className="text-muted-foreground" />
                                    )}
                                  </Button>
                                )}
                                
                                <Switch
                                  checked={module.enabled}
                                  onCheckedChange={(checked) => {
                                    handleModuleChange(module.id, { 
                                      enabled: checked,
                                      visible: checked ? module.visible : false 
                                    });
                                  }}
                                  className="ml-2"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ScrollArea>
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetLayout} disabled={!onResetLayout}>
              <RotateCcw size={16} className="mr-2" />
              Restablecer
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Check size={16} className="mr-2" />
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}