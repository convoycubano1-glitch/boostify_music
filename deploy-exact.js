/**
 * Script para ejecutar la construcción con comportamiento exacto a desarrollo
 * Este script es un wrapper que ejecuta build-production-exact.js
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

console.log(`
${colors.magenta}=== DESPLIEGUE CON COMPORTAMIENTO EXACTO A DESARROLLO ===${colors.reset}

Este script construirá la aplicación de forma que funcione 
exactamente igual en producción que en desarrollo.

Esto incluye:
- Misma estructura de rutas y alias
- Misma gestión de recursos estáticos
- Mismo comportamiento del servidor
- Mismos encabezados y configuración CORS
`);

try {
  console.log(`${colors.yellow}Ejecutando script de construcción...${colors.reset}`);
  execSync('node build-production-exact.js', { stdio: 'inherit' });
  
  console.log(`
${colors.green}=== DESPLIEGUE COMPLETADO CON ÉXITO ===${colors.reset}

La aplicación está lista para ser desplegada y funcionará 
exactamente igual que en desarrollo.

Para iniciar:
  cd dist
  npm install
  npm start
`);

} catch (error) {
  console.error(`
${colors.red}=== ERROR EN EL DESPLIEGUE ===${colors.reset}

Ocurrió un error durante el proceso de construcción:
${error.message}

Verifique los mensajes de error anteriores para más detalles.
`);
  process.exit(1);
}