import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '../../components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '../../components/ui/tabs';
// Nota: Implementación simplificada sin react-beautiful-dnd
// TODO: Instalar la dependencia react-beautiful-dnd cuando sea posible
import { GripVertical, X, PlusCircle, Save, RotateCcw } from 'lucide-react';

// Definición de tipos para la simulación de arrastrar y soltar
interface DropResult {
  destination?: {
    index: number;
  };
  source: {
    index: number;
  };
}

// Componentes simulados para arrastrar y soltar (versión simplificada)
const DragDropContext: React.FC<{onDragEnd: (result: DropResult) => void; children: React.ReactNode}> = ({children, onDragEnd}) => {
  // Simulación simplificada
  return <>{children}</>;
};

const Droppable: React.FC<{droppableId: string; children: (provided: any) => React.ReactNode}> = ({children}) => {
  // Simulamos el objeto provided
  const provided = {
    droppableProps: {},
    innerRef: (el: any) => {},
    placeholder: null
  };
  
  return <>{children(provided)}</>;
};

const Draggable: React.FC<{draggableId: string; index: number; children: (provided: any) => React.ReactNode}> = ({children}) => {
  // Simulamos el objeto provided
  const provided = {
    draggableProps: {},
    dragHandleProps: {},
    innerRef: (el: any) => {}
  };
  
  return <>{children(provided)}</>;
};

// Definición de tipos para configuración de módulos
export interface ModuleConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  visible: boolean;
  position: number;
  minSize?: number;
  maxSize?: number;
  defaultSize?: number;
  settings?: {[key: string]: any};
}

interface ModuleConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  modules: ModuleConfig[];
  onSaveModules: (modules: ModuleConfig[]) => void;
  onResetModules: () => void;
}

/**
 * Componente para configurar y personalizar los módulos del editor
 * Permite reordenar, activar/desactivar y personalizar los módulos disponibles
 */
export const ModuleConfigurator: React.FC<ModuleConfiguratorProps> = ({
  isOpen,
  onClose,
  modules,
  onSaveModules,
  onResetModules
}) => {
  const { toast } = useToast();
  const [activeModules, setActiveModules] = useState<ModuleConfig[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  
  // Inicializar módulos al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveModules([...modules]);
    }
  }, [isOpen, modules]);
  
  // Manejar cambio de estado de un módulo
  const handleToggleModule = (moduleId: string) => {
    setActiveModules(prevModules => 
      prevModules.map(mod => 
        mod.id === moduleId ? { ...mod, enabled: !mod.enabled } : mod
      )
    );
  };
  
  // Manejar cambio de visibilidad de un módulo
  const handleToggleVisibility = (moduleId: string) => {
    setActiveModules(prevModules => 
      prevModules.map(mod => 
        mod.id === moduleId ? { ...mod, visible: !mod.visible } : mod
      )
    );
  };
  
  // Manejar cambio de tamaño predeterminado
  const handleSizeChange = (moduleId: string, size: number) => {
    setActiveModules(prevModules => 
      prevModules.map(mod => 
        mod.id === moduleId ? { ...mod, defaultSize: size } : mod
      )
    );
  };
  
  // Manejar finalización de arrastre (reordenamiento)
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(activeModules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Actualizar posiciones
    const updatedModules = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setActiveModules(updatedModules);
  };
  
  // Guardar cambios
  const handleSave = () => {
    onSaveModules(activeModules);
    toast({
      title: "Configuración guardada",
      description: "Los cambios de módulos se han guardado correctamente"
    });
    onClose();
  };
  
  // Restablecer configuración
  const handleReset = () => {
    onResetModules();
    toast({
      title: "Configuración restablecida",
      description: "Se ha restablecido la configuración predeterminada de módulos"
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar módulos del editor</DialogTitle>
          <DialogDescription>
            Personaliza los módulos del editor según tus necesidades. Puedes reordenar, activar/desactivar o ajustar el tamaño predeterminado de cada módulo.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="modules" className="w-full mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>
          
          <TabsContent value="modules" className="p-1">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="modules-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {activeModules
                      .sort((a, b) => a.position - b.position)
                      .map((module, index) => (
                        <Draggable key={module.id} draggableId={module.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center p-3 rounded-md border ${
                                module.enabled ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-900 border-zinc-800 opacity-70'
                              }`}
                            >
                              <div {...provided.dragHandleProps} className="mr-2">
                                <GripVertical className="h-5 w-5 text-zinc-400" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <Checkbox
                                    id={`enable-${module.id}`}
                                    checked={module.enabled}
                                    onCheckedChange={() => handleToggleModule(module.id)}
                                    className="mr-2"
                                  />
                                  <Label htmlFor={`enable-${module.id}`} className="font-medium">
                                    {module.name}
                                  </Label>
                                </div>
                                
                                <div className="text-xs text-zinc-400 mt-1">
                                  {module.type} • {module.enabled ? 'Activado' : 'Desactivado'}
                                </div>
                              </div>
                              
                              <div className="flex space-x-2 items-center">
                                <div className="flex items-center mr-2">
                                  <Label htmlFor={`size-${module.id}`} className="text-xs mr-2">
                                    Tamaño:
                                  </Label>
                                  <Input
                                    id={`size-${module.id}`}
                                    type="number"
                                    min={module.minSize || 10}
                                    max={module.maxSize || 80}
                                    value={module.defaultSize || 0}
                                    onChange={(e) => handleSizeChange(module.id, parseInt(e.target.value))}
                                    className="w-16 h-7 text-xs"
                                    disabled={!module.enabled}
                                  />
                                  <span className="text-xs ml-1">%</span>
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleToggleVisibility(module.id)}
                                  disabled={!module.enabled}
                                >
                                  {module.visible ? (
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                      <path d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z" fill="currentColor"></path>
                                    </svg>
                                  ) : (
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                                      <path d="M13.3536 2.35357L13.5488 2.14836C13.7441 2.34362 13.7441 2.65021 13.5488 2.84547L2.14853 14.2458C1.95327 14.441 1.64668 14.441 1.45142 14.2458L1.25621 14.0505C1.06095 13.8553 1.06095 13.5487 1.25621 13.3534L12.6565 1.95309C12.8517 1.75783 13.1583 1.75783 13.3536 1.95309L13.3536 2.35357ZM7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C1.87284 6.23399 2.97619 5.20661 4.27894 4.51686L5.39696 3.39884C3.75317 4.2551 2.42911 5.71498 1.70448 7.50001C3.13778 9.62183 5.41112 11 7.5 11C8.45179 11 9.36756 10.8183 10.2052 10.4879L11.7061 8.98696C10.5319 10.2102 9.08205 11 7.5 11ZM13.9038 7.50001C13.1381 8.74257 12.0535 9.75596 10.7689 10.4422L9.62313 11.588C11.2781 10.7226 12.6099 9.25313 13.3354 7.45856L13.9038 7.50001ZM7.5 4C8.55294 4 9.52836 4.18947 10.3786 4.52532L8.45539 6.44847C8.14422 6.27589 7.78237 6.17676 7.40039 6.17676C6.1758 6.17676 5.17676 7.17581 5.17676 8.40039C5.17676 8.78237 5.27589 9.14422 5.44847 9.45539L3.52532 11.3786C3.18947 10.5284 3 9.55294 3 8.5C3 6.01472 4.95343 4 7.5 4ZM7.5 9.5C8.05228 9.5 8.5 9.05228 8.5 8.5C8.5 8.44775 8.49691 8.39622 8.49096 8.3458L7.3458 9.49095C7.39622 9.4969 7.44775 9.5 7.5 9.5Z" fill="currentColor"></path>
                                    </svg>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </TabsContent>
          
          <TabsContent value="settings" className="p-1">
            <div className="space-y-4">
              <div className="p-4 rounded-md border border-zinc-700 bg-zinc-800">
                <h3 className="text-sm font-medium mb-2">Configuración general</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox id="auto-save" className="mr-2" />
                    <Label htmlFor="auto-save">
                      Guardar configuración automáticamente
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="remember-layout" className="mr-2" />
                    <Label htmlFor="remember-layout">
                      Recordar layout entre sesiones
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox id="mobile-optimize" className="mr-2" defaultChecked />
                    <Label htmlFor="mobile-optimize">
                      Optimizar automáticamente para móvil
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-md border border-zinc-700 bg-zinc-800">
                <h3 className="text-sm font-medium mb-2">Layouts predefinidos</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="justify-start">
                    Vista previa grande
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    Timeline extendido
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    Edición extendida
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start">
                    Compacto
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="destructive"
            onClick={handleReset}
            className="mr-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Restablecer
          </Button>
          
          <DialogClose asChild>
            <Button type="button" variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </DialogClose>
          
          <Button type="button" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleConfigurator;