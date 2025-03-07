import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar si el dispositivo es móvil
 * basado en el ancho de la ventana
 * 
 * @returns boolean indicando si el dispositivo es móvil
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Función para comprobar el ancho de la ventana y actualizar el estado
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // 640px es el breakpoint sm: en Tailwind
    };

    // Realizar la comprobación inicial
    checkMobile();

    // Agregar event listener para actualizar cuando cambie el tamaño
    window.addEventListener('resize', checkMobile);

    // Cleanup: eliminar event listener cuando el componente se desmonte
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}