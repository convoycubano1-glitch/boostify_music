import { useEffect, useState } from 'react';

interface ImagePreloaderProps {
  urls: string[];
  onComplete?: (successCount: number, failureCount: number) => void;
  children?: React.ReactNode;
}

export function ImagePreloader({ urls, onComplete, children }: ImagePreloaderProps) {
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Si no hay URLs para precargar, considerar completo inmediatamente
    if (!urls.length) {
      setIsComplete(true);
      onComplete?.(0, 0);
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    const totalImages = urls.length;

    // Crear una nueva carga de imagen para cada URL
    urls.forEach(url => {
      const img = new Image();
      
      img.onload = () => {
        successCount++;
        setLoaded(prev => prev + 1);
        
        // Revisar si ya se completaron todas las imágenes
        if (successCount + failureCount === totalImages) {
          setIsComplete(true);
          onComplete?.(successCount, failureCount);
        }
      };
      
      img.onerror = () => {
        failureCount++;
        setFailed(prev => prev + 1);
        console.warn(`Failed to preload image: ${url}`);
        
        // Revisar si ya se completaron todas las imágenes
        if (successCount + failureCount === totalImages) {
          setIsComplete(true);
          onComplete?.(successCount, failureCount);
        }
      };
      
      // Iniciar la carga
      img.src = url;
    });

    // No es necesario limpieza ya que las imágenes se cargarán en segundo plano
  }, [urls, onComplete]);

  // El componente es invisible pero permite envolver contenido y esperar la carga
  return <>{children}</>;
}