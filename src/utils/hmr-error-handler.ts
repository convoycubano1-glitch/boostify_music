/**
 * Utilidad para manejar errores de WebSocket de Vite HMR
 * Previene errores "The user aborted a request" durante la interacción con el timeline
 */

/**
 * Previene que los errores de HMR WebSocket interrumpan la interfaz de usuario
 * Esta función captura y suprime los errores abortados relacionados con Vite
 */
export function setupHMRErrorHandler(): void {
  // Verificar si el entorno es navegador
  if (typeof window !== 'undefined') {
    // Guarda la función fetch original
    const originalFetch = window.fetch;
    
    // Reemplaza la función fetch con una versión que maneja los errores abortados
    window.fetch = function(input, init) {
      return originalFetch(input, init)
        .catch(error => {
          // Solo capturar "AbortError" relacionados con HMR
          if (
            error.name === 'AbortError' && 
            (
              (typeof input === 'string' && input.includes('vite')) ||
              (input instanceof Request && input.url.includes('vite'))
            )
          ) {
            console.debug('[HMR] Ignorado AbortError en conexión HMR');
            // Devolver una respuesta simulada para prevenir errores en cascada
            return new Response('{}', {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          // Re-lanzar otros errores
          throw error;
        });
    };
    
    // También manejar errores de WebSocket
    window.addEventListener('error', function(event) {
      // Verificar si el error está relacionado con WebSocket HMR
      if (
        event.message && 
        (
          event.message.includes('WebSocket') || 
          event.message.includes('vite') || 
          event.message.includes('HMR')
        )
      ) {
        // Registrar pero no mostrar errores de WebSocket HMR al usuario
        console.debug('[HMR] Ignorado error de WebSocket:', event.message);
        // Prevenir que el error se propague
        event.preventDefault();
      }
    });
  }
}