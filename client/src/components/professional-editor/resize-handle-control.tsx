import React, { useState, useRef, useEffect } from 'react';
import { ChevronsLeftRight, ChevronsUpDown, GripHorizontal, GripVertical } from 'lucide-react';
import { Button } from '../../components/ui/button';

export interface ModuleConfig {
  id: string;
  name: string;
  type: 'panel' | 'tool';
  enabled: boolean;
  visible: boolean;
  position: number;
  defaultSize?: number;
  actualSize?: number;
}

interface ResizeHandleControlProps {
  modules: ModuleConfig[];
  onResize: (modules: ModuleConfig[]) => void;
  direction?: 'horizontal' | 'vertical';
}

export default function ResizeHandleControl({
  modules,
  onResize,
  direction = 'horizontal'
}: ResizeHandleControlProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startPosition, setStartPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [initialSizes, setInitialSizes] = useState<{[key: string]: number}>({});
  const handleRef = useRef<HTMLDivElement>(null);
  
  // Filtrar sólo los módulos visibles de tipo panel
  const visiblePanels = modules.filter(m => m.type === 'panel' && m.visible);
  
  // Ordenar paneles por posición
  const sortedPanels = [...visiblePanels].sort((a, b) => a.position - b.position);
  
  // Iniciar el arrastre
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPosition({ x: e.clientX, y: e.clientY });
    
    // Guardar los tamaños iniciales de todos los paneles
    const sizes: {[key: string]: number} = {};
    sortedPanels.forEach(panel => {
      sizes[panel.id] = panel.actualSize || panel.defaultSize || 0;
    });
    setInitialSizes(sizes);
    
    // Agregar event listeners para controlar el movimiento
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  // Manejar el movimiento durante el arrastre
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calcular el desplazamiento
    const deltaX = e.clientX - startPosition.x;
    const deltaY = e.clientY - startPosition.y;
    const delta = direction === 'horizontal' ? deltaX : deltaY;
    
    // Ajustar los tamaños de los paneles de forma proporcional
    if (sortedPanels.length > 1) {
      // Simplificación: ajustar solo los dos primeros paneles
      const firstPanel = sortedPanels[0];
      const secondPanel = sortedPanels[1];
      
      // Convertir delta en porcentaje de la ventana
      const containerSize = direction === 'horizontal' 
        ? window.innerWidth 
        : window.innerHeight;
      const deltaPercent = (delta / containerSize) * 100;
      
      // Aplicar el cambio a los dos primeros paneles
      const updatedModules = modules.map(module => {
        if (module.id === firstPanel.id) {
          return {
            ...module,
            actualSize: Math.max(10, Math.min(90, (initialSizes[module.id] || 0) + deltaPercent))
          };
        }
        if (module.id === secondPanel.id) {
          return {
            ...module,
            actualSize: Math.max(10, Math.min(90, (initialSizes[module.id] || 0) - deltaPercent))
          };
        }
        return module;
      });
      
      onResize(updatedModules);
    }
  };
  
  // Finalizar el arrastre
  const handleDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };
  
  // Limpiar los listeners cuando el componente se desmonta
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);
  
  // Si no hay al menos dos paneles, no es necesario mostrar el control
  if (sortedPanels.length < 2) return null;
  
  return (
    <div
      ref={handleRef}
      className={`resize-handle ${direction === 'horizontal' ? 'resize-handle-horizontal' : 'resize-handle-vertical'} ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleDragStart}
      style={{
        position: 'absolute',
        cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.1)',
        ...(direction === 'horizontal' 
          ? { 
              width: '12px', 
              height: '100px',
              top: '50%',
              left: `${sortedPanels[0].actualSize || sortedPanels[0].defaultSize || 50}%`,
              transform: 'translate(-50%, -50%)',
            } 
          : { 
              height: '12px', 
              width: '100px',
              left: '50%',
              top: `${sortedPanels[0].actualSize || sortedPanels[0].defaultSize || 50}%`,
              transform: 'translate(-50%, -50%)',
            })
      }}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="p-0 bg-background/50"
        onClick={(e) => e.stopPropagation()} // Evita que el clic inicie el arrastre
      >
        {direction === 'horizontal' 
          ? <ChevronsLeftRight size={16} /> 
          : <ChevronsUpDown size={16} />
        }
      </Button>
    </div>
  );
}