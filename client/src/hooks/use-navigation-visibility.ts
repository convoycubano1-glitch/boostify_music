import { useState, useEffect } from "react";

/**
 * Hook para gestionar la visibilidad de la navegación (menús)
 * 
 * Este hook proporciona:
 * - Estado de visibilidad actual de la navegación
 * - Control para alternar la visibilidad
 * - Emite eventos personalizados que pueden ser escuchados por otros componentes
 */
export function useNavigationVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  
  // Función para alternar la visibilidad
  const toggleVisibility = (value?: boolean) => {
    setIsVisible((prev) => {
      // Si se proporciona un valor específico, usarlo; de lo contrario, alternar
      const newValue = value !== undefined ? value : !prev;
      
      // Emitir evento personalizado para que otros componentes puedan reaccionar
      const event = new CustomEvent('navigation-visibility-changed', {
        detail: { isVisible: newValue }
      });
      window.dispatchEvent(event);
      
      return newValue;
    });
  };
  
  // Detectar doble clic para ocultar/mostrar la navegación
  useEffect(() => {
    let lastClick = 0;
    
    const handleDoubleClick = () => {
      const now = Date.now();
      if (now - lastClick < 300) {  // 300ms como umbral para doble clic
        toggleVisibility();
        lastClick = 0;  // Reset para evitar triples clics
      } else {
        lastClick = now;
      }
    };
    
    document.addEventListener('click', handleDoubleClick);
    
    return () => {
      document.removeEventListener('click', handleDoubleClick);
    };
  }, []);
  
  return {
    isVisible,
    toggleVisibility,
  };
}