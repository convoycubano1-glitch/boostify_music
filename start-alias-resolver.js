/**
 * Script de inicio que ejecuta el resolvedor de alias @/ antes de iniciar la aplicación
 */

// Importar y ejecutar el resolvedor de alias primero
import('./alias-resolver.mjs')
  .then(() => {
    console.log('Alias resolver ejecutado correctamente, iniciando aplicación...');
    // Ahora importar y ejecutar el script de inicio original
    import('./start.js');
  })
  .catch(error => {
    console.error('Error al ejecutar el resolvedor de alias:', error);
    console.log('Intentando iniciar la aplicación sin resolver alias...');
    import('./start.js');
  });