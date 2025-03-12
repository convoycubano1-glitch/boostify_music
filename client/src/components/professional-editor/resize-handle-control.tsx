import React, { useEffect, useState } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';
import { ResizableHandle } from '../ui/resizable';

/**
 * Componente personalizado para manejar los botones de redimensionamiento
 * Detecta automáticamente si estamos en móvil o escritorio y muestra el icono adecuado
 */
const ResizeHandleControl: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <ResizableHandle withHandle className="bg-zinc-800 hover:bg-zinc-700">
      {isMobile ? (
        <GripHorizontal className="h-4 w-4 text-zinc-400" />
      ) : (
        <GripVertical className="h-4 w-4 text-zinc-400" />
      )}
    </ResizableHandle>
  );
};

export default ResizeHandleControl;