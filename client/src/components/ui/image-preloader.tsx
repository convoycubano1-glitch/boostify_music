import { useEffect, useState, useRef } from 'react';

interface ImagePreloaderProps {
  urls: string[];
  onComplete?: (successCount: number, failureCount: number) => void;
  children?: React.ReactNode;
  timeout?: number; // Tiempo de espera en ms (por defecto 10000ms)
}

/**
 * Componente mejorado para precargar imágenes de forma confiable
 * - Maneja errores de forma robusta
 * - Proporciona un timeout configurable
 * - No bloquea la renderización de la interfaz
 * - Reporta resultados exactos
 */
export function ImagePreloader({ 
  urls, 
  onComplete, 
  children, 
  timeout = 10000 
}: ImagePreloaderProps) {
  const [loaded, setLoaded] = useState(0);
  const [failed, setFailed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // Uso de refs para evitar problemas con cierres (closures) en useEffect
  const successCountRef = useRef(0);
  const failureCountRef = useRef(0);
  const totalImagesRef = useRef(urls?.length || 0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Reset de los contadores cuando cambian las URLs
    successCountRef.current = 0;
    failureCountRef.current = 0;
    totalImagesRef.current = urls?.length || 0;
    setLoaded(0);
    setFailed(0);
    setIsComplete(false);
    
    // Marcar componente como montado
    isMountedRef.current = true;
    
    // Si no hay URLs, marcar como completado inmediatamente
    if (!urls || urls.length === 0) {
      onComplete?.(0, 0);
      setIsComplete(true);
      return;
    }
    
    // Función para verificar si todas las imágenes se han procesado
    const checkComplete = () => {
      if (!isMountedRef.current) return;
      
      if (successCountRef.current + failureCountRef.current >= totalImagesRef.current) {
        console.log(`✅ Precarga completada: ${successCountRef.current} éxitos, ${failureCountRef.current} fallos`);
        onComplete?.(successCountRef.current, failureCountRef.current);
        setIsComplete(true);
      }
    };
    
    // Procesamos cada URL de imagen
    urls.forEach((url, index) => {
      // Saltamos URLs vacías o inválidas
      if (!url || url === 'undefined' || url === 'null') {
        console.warn(`URL inválida en índice ${index}`);
        failureCountRef.current++;
        setFailed(prev => prev + 1);
        checkComplete();
        return;
      }
      
      // Verificamos si la imagen ya fue precargada antes
      try {
        const cachedImages = JSON.parse(sessionStorage.getItem('cachedImages') || '{}');
        if (cachedImages[url]) {
          console.log(`🔄 Imagen ya cargada previamente: ${url.substring(0, 30)}...`);
          successCountRef.current++;
          setLoaded(prev => prev + 1);
          checkComplete();
          return;
        }
      } catch (e) {
        // Ignorar errores de sessionStorage
      }
      
      // Crear un nuevo objeto de imagen
      const img = new Image();
      
      // Configurar handlers de éxito
      img.onload = () => {
        if (!isMountedRef.current) return;
        successCountRef.current++;
        setLoaded(prev => prev + 1);
        // Guardamos en sessionStorage para futuro uso
        try {
          const cachedImages = JSON.parse(sessionStorage.getItem('cachedImages') || '{}');
          cachedImages[url] = true;
          sessionStorage.setItem('cachedImages', JSON.stringify(cachedImages));
        } catch (e) {
          // Ignoramos errores de almacenamiento
        }
        checkComplete();
      };
      
      // Configurar handlers de error
      img.onerror = () => {
        if (!isMountedRef.current) return;
        failureCountRef.current++;
        setFailed(prev => prev + 1);
        console.warn(`Error al precargar imagen: ${url}`);
        checkComplete();
      };
      
      // Iniciar la carga (después de configurar handlers)
      img.src = url;
    });
    
    // Configurar timeout de seguridad para evitar bloqueos
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (!isComplete) {
        const remainingImages = totalImagesRef.current - (successCountRef.current + failureCountRef.current);
        if (remainingImages > 0) {
          console.warn(`⚠️ Timeout de precarga para ${remainingImages} imágenes`);
          failureCountRef.current += remainingImages;
          onComplete?.(successCountRef.current, failureCountRef.current);
          setIsComplete(true);
        }
      }
    }, timeout);
    
    // Cleanup para evitar memory leaks
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
    };
  }, [urls, onComplete, timeout]);

  return <>{children}</>;
}