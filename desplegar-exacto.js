/**
 * Script para construir y desplegar la aplicación con comportamiento exacto a desarrollo
 * Este script se puede ejecutar directamente con "node desplegar-exacto.js"
 */

import { execSync } from 'child_process';
import fs from 'fs';
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`
${colors.magenta}=== DESPLIEGUE EXACTO A DESARROLLO EN ESPAÑOL ===${colors.reset}

Este script construirá la aplicación para que funcione exactamente
igual en producción que en desarrollo.

Este proceso:
1. Construye la aplicación con la misma configuración que en desarrollo
2. Configura el entorno de producción para emular desarrollo
3. Prepara todo para un fácil despliegue
`);

// Verificar que existe el script de construcción exacto
if (!fs.existsSync('build-production-exact.js')) {
  console.log(`${colors.blue}No se encontró build-production-exact.js. Verificando si existe...${colors.reset}`);
  try {
    execSync('node build-production-exact.js --version', { stdio: 'ignore' });
  } catch (error) {
    console.log(`${colors.yellow}El script de construcción exacto no está disponible o no es ejecutable.${colors.reset}`);
    console.log(`${colors.yellow}Ejecutando el script de despliegue principal en su lugar...${colors.reset}`);
    
    try {
      execSync('node deploy-exact.js', { stdio: 'inherit' });
      process.exit(0);
    } catch (error) {
      console.error(`${colors.red}Error al ejecutar el script de despliegue: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }
}

try {
  // Verificar si Node.js es compatible con módulos ES
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  
  if (majorVersion < 14) {
    console.log(`${colors.yellow}⚠ Advertencia: La versión de Node.js (${nodeVersion}) puede no ser compatible con módulos ES.${colors.reset}`);
    console.log(`${colors.yellow}Se recomienda usar Node.js 14 o superior para este script.${colors.reset}`);
  }
  
  // Ejecutar la construcción exacta
  console.log(`\n${colors.cyan}PASO 1: Construyendo aplicación...${colors.reset}`);
  execSync('node build-production-exact.js', { stdio: 'inherit' });
  
  // Verificar si la construcción se completó correctamente
  if (!fs.existsSync('dist/start.js') || !fs.existsSync('dist/public/index.html')) {
    throw new Error('Construcción incompleta. Faltan archivos críticos.');
  }
  
  console.log(`\n${colors.cyan}PASO 2: Verificando estructura...${colors.reset}`);
  if (fs.existsSync('dist/public') && fs.existsSync('dist/server')) {
    console.log(`${colors.green}✓ Estructura correcta verificada${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Advertencia: La estructura de archivos puede no ser completa${colors.reset}`);
  }
  
  // Crear un archivo README.md en dist para instrucciones
  const readmeContent = `# Aplicación desplegada

Esta aplicación ha sido construida para funcionar exactamente igual que en desarrollo.

## Instrucciones de inicio

1. Instalar dependencias:
   \`\`\`
   npm install
   \`\`\`

2. Iniciar la aplicación:
   \`\`\`
   npm start
   \`\`\`

La aplicación estará disponible en http://localhost:3000 (o el puerto configurado en la variable de entorno PORT).

## Variables de entorno

Asegúrese de configurar estas variables de entorno para un funcionamiento completo:

- \`NODE_ENV=production\` (ya configurado)
- \`PORT=3000\` (opcional, puerto de escucha)
- \`OPENAI_API_KEY\` (si usa funcionalidades de IA)
- \`FIREBASE_CONFIG\` (si usa Firebase)

## Resolución de problemas

Si encuentra problemas al iniciar:

1. Verifique que todas las variables de entorno necesarias estén configuradas
2. Asegúrese de que el puerto no esté siendo usado por otra aplicación
3. Revise los logs para mensajes de error específicos
`;

  fs.writeFileSync('dist/README.md', readmeContent);
  
  console.log(`\n${colors.green}=== DESPLIEGUE COMPLETADO CON ÉXITO ===${colors.reset}`);
  console.log(`
La aplicación está lista para ser desplegada y funcionará exactamente igual que en desarrollo.

Para iniciar la aplicación:
  ${colors.cyan}cd dist${colors.reset}
  ${colors.cyan}npm install${colors.reset}
  ${colors.cyan}npm start${colors.reset}

Para desplegar en un servidor:
  ${colors.cyan}1. Copie todo el contenido de la carpeta 'dist' a su servidor${colors.reset}
  ${colors.cyan}2. Ejecute 'npm install' en el servidor${colors.reset}
  ${colors.cyan}3. Configure las variables de entorno necesarias${colors.reset}
  ${colors.cyan}4. Ejecute 'npm start' o use un gestor de procesos como PM2${colors.reset}
`);

} catch (error) {
  console.error(`
${colors.red}=== ERROR EN EL DESPLIEGUE ===${colors.reset}

Ocurrió un error durante el proceso:
${error.message}

Verifique los mensajes de error anteriores para más detalles.
`);
  process.exit(1);
}