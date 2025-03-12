import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel } from '../ui/resizable';
import ResizeHandleControl from './resize-handle-control';

/**
 * Componente adaptador para pantallas móviles
 * Este componente ajusta la distribución y comportamiento del editor profesional
 * para que funcione mejor en dispositivos móviles
 */

interface MobileAdapterProps {
  children: React.ReactNode;
  onResizeStop?: (sizes: number[]) => void;
  direction?: 'horizontal' | 'vertical';
  className?: string;
  defaultSizes?: number[];
}

const MobileAdapter: React.FC<MobileAdapterProps> = ({
  children,
  onResizeStop,
  direction = 'vertical',
  className = '',
  defaultSizes
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  
  // Detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Si estamos en modo móvil, aplicar estilos específicos
  const mobileClass = isMobile ? 'mobile-editor-container' : '';
  
  return (
    <ResizablePanelGroup 
      direction={isMobile ? 'vertical' : 'horizontal'} 
      className={`${className} ${mobileClass}`}
      onLayout={onResizeStop}
      autoSaveId="editor-panels"
    >
      {React.Children.map(children, (child, index) => {
        if (index === React.Children.count(children) - 1) {
          return child;
        }
        return (
          <>
            {child}
            <ResizeHandleControl />
          </>
        );
      })}
    </ResizablePanelGroup>
  );
};

export default MobileAdapter;