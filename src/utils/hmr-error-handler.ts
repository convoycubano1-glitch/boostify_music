/**
 * Utilidad para manejar errores de WebSocket de Vite HMR
 * Previene errores "The user aborted a request" durante la interacción con el timeline
 */

/**
 * Previene que los errores de HMR WebSocket interrumpan la interfaz de usuario
 * Esta función captura y suprime los errores abortados relacionados con Vite
 */
export function setupHMRErrorHandler(): void {
  const originalFetch = window.fetch;
  
  // Sobrescribir fetch para manejar errores abortados silenciosamente
  window.fetch = function(input, init) {
    return originalFetch(input, init).catch(error => {
      // Solo interceptar errores de "aborted request" relacionados con HMR
      if (error && error.name === 'AbortError' && 
          typeof input === 'string' && 
          (input.includes('vite-hmr') || input.includes('__vite'))) {
        console.debug('[HMR] Suprimido error de solicitud abortada en HMR WebSocket');
        // Devolver una respuesta vacía para evitar errores en cascada
        return new Response(null, { status: 200 });
      }
      // Re-lanzar otros errores normalmente
      throw error;
    });
  };
  
  // Capturar errores no manejados en la ventana
  window.addEventListener('unhandledrejection', function(event) {
    // Loguear detalles del error para diagnóstico
    console.debug('[Diagnostico] Error no manejado:', event.reason);
    
    // Suprime errores de Vite HMR
    if (event.reason && 
        (event.reason.message?.includes('user aborted') || 
         event.reason.name === 'AbortError' ||
         (typeof event.reason === 'object' && event.reason.type === 'unhandledrejection')) &&
        (event.reason.stack?.includes('vite') || event.reason.stack?.includes('hmr'))) {
      console.debug('[HMR] Suprimido error no manejado de Vite HMR:', event.reason.message);
      event.preventDefault(); // Prevenir que el error se propague
      return;
    }
    
    // Suprime errores de conexión a servicios externos que podrían no estar disponibles
    if (event.reason && 
        (event.reason.message?.includes('NetworkError') || 
         event.reason.message?.includes('Failed to fetch') ||
         event.reason.message?.includes('Network request failed'))) {
      console.warn('[Network] Error de red suprimido:', event.reason.message);
      event.preventDefault();
    }
  });
  
  // Sobrescribir el comportamiento de los WebSockets
  // Utilizamos un enfoque más seguro que no redefine el constructor
  
  try {
    // Interceptar eventos de error en WebSockets existentes
    const handleDOMReady = () => {
      // Capturar errores antes de que se propaguen al log
      window.addEventListener('error', (event) => {
        // Suprimir errores específicos del WebSocket de Vite
        if (event.message?.includes('WebSocket') && 
            (event.filename?.includes('vite') || event.message?.includes('vite-hmr'))) {
          console.debug('[HMR] Suprimido error de WebSocket en el listener global');
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }, true);
      
      // Manejar el caso de reconexión automática
      const webSocketProto = WebSocket.prototype;
      const originalSend = webSocketProto.send;
      webSocketProto.send = function(data: any) {
        try {
          return originalSend.call(this, data);
        } catch (err) {
          console.debug('[HMR] Error suprimido en WebSocket.send:', err);
          // Simplemente retornar sin lanzar error
          return false;
        }
      };
    };
    
    // Ejecutar inmediatamente si el DOM ya está listo
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      handleDOMReady();
    } else {
      document.addEventListener('DOMContentLoaded', handleDOMReady);
    }
    
    console.debug('[HMR] Manejador de errores de WebSocket configurado correctamente');
  } catch (err) {
    console.warn('[HMR] No se pudo configurar el manejador de WebSocket:', err);
  }
  
  console.log('WebSocket mejorado para prevenir errores de Vite HMR');
}