import React from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';
import { ResizableHandle } from '../ui/resizable';

interface ResizeHandleControlProps {
  editMode: 'desktop' | 'mobile';
}

/**
 * Componente personalizado para manejar los botones de redimensionamiento
 * Muestra diferentes iconos según la orientación (móvil o escritorio)
 */
const ResizeHandleControl: React.FC<ResizeHandleControlProps> = ({ editMode }) => {
  return (
    <ResizableHandle withHandle className="bg-zinc-800 hover:bg-zinc-700">
      {editMode === 'mobile' ? (
        <GripHorizontal className="h-4 w-4 text-zinc-400" />
      ) : (
        <GripVertical className="h-4 w-4 text-zinc-400" />
      )}
    </ResizableHandle>
  );
};

export default ResizeHandleControl;