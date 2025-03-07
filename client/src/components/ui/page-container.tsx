import React, { useState, useEffect } from "react";
import { useNavigationVisibility } from '@/hooks/use-navigation-visibility';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Componente contenedor de página que se adapta al estado de visibilidad de la navegación
 * 
 * Este componente:
 * - Ajusta el margen superior cuando los menús están ocultos
 * - Proporciona una transición suave para mejorar la experiencia del usuario
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  const { isVisible } = useNavigationVisibility();
  const [headerHeight, setHeaderHeight] = useState(280); // Valor predeterminado
  
  // Escuchar eventos de cambio de visibilidad de navegación
  useEffect(() => {
    // Escuchar el evento de cambio de visibilidad de navegación
    const handleVisibilityChange = (event: CustomEvent) => {
      const { isVisible } = event.detail;
      
      // Ajustar la altura del header según su visibilidad
      if (isVisible) {
        setHeaderHeight(280); // Con navegación visible
      } else {
        setHeaderHeight(16); // Solo con la barra superior mínima visible
      }
    };
    
    // Añadir el escuchador de eventos
    window.addEventListener('navigation-visibility-changed' as any, 
      handleVisibilityChange as EventListener);
    
    // Limpiar al desmontar
    return () => {
      window.removeEventListener('navigation-visibility-changed' as any, 
        handleVisibilityChange as EventListener);
    };
  }, []);
  
  return (
    <div 
      className={`flex flex-col min-h-screen w-full transition-all duration-300 ${className}`}
      style={{ 
        marginTop: `${headerHeight}px`, 
        paddingTop: isVisible ? '0' : '1rem' 
      }}
    >
      {children}
    </div>
  );
}