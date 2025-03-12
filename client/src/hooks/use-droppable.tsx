import { useState, useRef, useEffect } from 'react';

export interface DraggableItem {
  id: string;
  type: string;
  name?: string;
  properties?: Record<string, any>;
  data: any;
}

export interface DroppedItem {
  item: DraggableItem;
  position: {
    x: number;
    y: number;
    relativeX: number;
    relativeY: number;
  };
}

export interface DroppableAreaOptions {
  onDrop?: (data: DroppedItem) => void;
  acceptTypes?: string[];
  disabled?: boolean;
}

export interface DroppableResult {
  droppableRef: React.RefObject<HTMLElement>;
  droppableProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  isOver: boolean;
  lastDroppedItem: DroppedItem | null;
}

/**
 * Hook para crear áreas donde se pueden soltar elementos arrastrables
 * 
 * Este hook proporciona una API fácil de usar para implementar áreas donde los
 * usuarios pueden soltar elementos, con soporte para:
 * - Filtrado por tipo de elemento
 * - Posición relativa del elemento soltado
 * - Desactivación condicional
 * 
 * @param options Opciones de configuración para el área donde se pueden soltar elementos
 * @returns Propiedades y estado del área donde se pueden soltar elementos
 */
export function useDroppable(options: DroppableAreaOptions = {}): DroppableResult {
  const { onDrop, acceptTypes = [], disabled = false } = options;
  const droppableRef = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [lastDroppedItem, setLastDroppedItem] = useState<DroppedItem | null>(null);

  // Manejar evento de arrastrar sobre el área
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    // Verificar si el tipo es aceptado
    const dataTransfer = e.dataTransfer;
    if (dataTransfer.types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  // Manejar evento de entrada al área
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsOver(true);
  };

  // Manejar evento de salida del área
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    // Solo actualizar si el cursor sale completamente del área
    if (droppableRef.current && !droppableRef.current.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  // Manejar evento de soltar
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsOver(false);
    
    try {
      // Intentar obtener los datos JSON del elemento arrastrado
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;
      
      const draggedItem = JSON.parse(jsonData) as DraggableItem;
      
      // Verificar si el tipo es aceptado
      if (acceptTypes.length > 0 && !acceptTypes.includes(draggedItem.type)) {
        return;
      }
      
      // Calcular posición relativa
      const rect = droppableRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const position = {
        x: e.clientX,
        y: e.clientY,
        relativeX: e.clientX - rect.left,
        relativeY: e.clientY - rect.top
      };
      
      const droppedItem: DroppedItem = {
        item: draggedItem,
        position
      };
      
      // Actualizar estado y llamar a callback
      setLastDroppedItem(droppedItem);
      if (onDrop) {
        onDrop(droppedItem);
      }
    } catch (error) {
      console.error('Error procesando elemento soltado:', error);
    }
  };

  return {
    droppableRef,
    droppableProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    },
    isOver,
    lastDroppedItem
  };
}

export default useDroppable;