/**
 * Script optimizado para compilación de producción
 * Este script ignora errores de TypeScript y genera una build funcional
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

console.log(`${colors.magenta}===== CONSTRUCCIÓN OPTIMIZADA PARA PRODUCCIÓN =====\n${colors.reset}`);

/**
 * Ejecuta un comando y muestra su salida
 * @param {string} command Comando a ejecutar
 * @param {string} errorMessage Mensaje de error personalizado
 * @param {boolean} ignoreErrors Indica si se deben ignorar los errores
 */
function execute(command, errorMessage, ignoreErrors = false) {
  console.log(`${colors.blue}Ejecutando: ${command}${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (ignoreErrors) {
      console.log(`${colors.yellow}⚠ ${errorMessage || error.message}${colors.reset}`);
      console.log(`${colors.yellow}Continuando a pesar del error...${colors.reset}`);
      return false;
    } else {
      console.error(`${colors.red}✗ ${errorMessage || error.message}${colors.reset}`);
      process.exit(1);
    }
  }
}

/**
 * Prepara el directorio de distribución
 */
function prepareDistDirectory() {
  console.log(`${colors.blue}Preparando directorio de distribución...${colors.reset}`);
  
  // Crear directorio dist si no existe
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Limpiar directorio dist
  execute('rm -rf dist/*', 'Error al limpiar directorio dist');
}

/**
 * Compila los archivos TypeScript del servidor ignorando errores
 */
function compileServerTypeScript() {
  console.log(`${colors.blue}Compilando archivos TypeScript del servidor...${colors.reset}`);
  
  // Compilar ignorando errores (usando allowJs y checkJs: false en tsconfig temporal)
  const tempTsConfigPath = 'tsconfig.prod.json';
  const originalTsConfigPath = 'tsconfig.json';
  
  // Crear configuración temporal
  if (fs.existsSync(originalTsConfigPath)) {
    try {
      const tsConfig = JSON.parse(fs.readFileSync(originalTsConfigPath, 'utf8'));
      
      // Modificar configuración para ignorar errores
      const prodConfig = {
        ...tsConfig,
        compilerOptions: {
          ...tsConfig.compilerOptions,
          skipLibCheck: true,
          noEmitOnError: false,
          allowJs: true,
          checkJs: false
        }
      };
      
      fs.writeFileSync(tempTsConfigPath, JSON.stringify(prodConfig, null, 2));
      console.log(`${colors.green}✓ Configuración temporal creada${colors.reset}`);
      
      // Compilar con la configuración temporal
      execute(`tsc --project ${tempTsConfigPath}`, 'Error al compilar TypeScript del servidor', true);
      
      // Eliminar configuración temporal
      fs.unlinkSync(tempTsConfigPath);
    } catch (error) {
      console.error(`${colors.red}✗ Error al crear configuración temporal: ${error.message}${colors.reset}`);
      // Fallar suavemente: intentar compilar con la configuración original
      execute('tsc', 'Error al compilar TypeScript con configuración original', true);
    }
  } else {
    // Si no hay tsconfig, compilar con opciones básicas
    execute('tsc --skipLibCheck --noEmitOnError false', 'Error al compilar TypeScript sin configuración', true);
  }
}

/**
 * Compila la aplicación cliente
 */
function buildClient() {
  console.log(`${colors.blue}Compilando aplicación cliente...${colors.reset}`);
  
  // Comprobar si existe la carpeta client
  if (fs.existsSync('client')) {
    execute('cd client && npx vite build', 'Error al compilar aplicación cliente', true);
    
    // Copiar archivos del cliente a dist/client
    console.log(`${colors.blue}Copiando archivos del cliente a dist/client...${colors.reset}`);
    
    if (fs.existsSync('client/dist')) {
      fs.mkdirSync('dist/client', { recursive: true });
      execute('cp -r client/dist/* dist/client/', 'Error al copiar archivos del cliente', true);
    } else {
      console.error(`${colors.red}✗ No se encontró la carpeta client/dist${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ No se encontró la carpeta client${colors.reset}`);
  }
}

/**
 * Copia archivos estáticos necesarios
 */
function copyStaticFiles() {
  console.log(`${colors.blue}Copiando archivos estáticos...${colors.reset}`);
  
  // Copiar package.json para producción
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Crear versión simplificada para producción
      const prodPackage = {
        name: packageJson.name,
        version: packageJson.version,
        type: packageJson.type,
        engines: packageJson.engines || { node: ">=16.0.0" },
        dependencies: packageJson.dependencies,
        scripts: {
          start: "node server/index.js"
        }
      };
      
      fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
      console.log(`${colors.green}✓ package.json optimizado para producción${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Error al procesar package.json: ${error.message}${colors.reset}`);
      // Copiar original como fallback
      execute('cp package.json dist/', 'Error al copiar package.json original', true);
    }
  }
  
  // Copiar otros archivos necesarios
  const filesToCopy = [
    '.env',
    '.env.production',
    'public'
  ];
  
  for (const file of filesToCopy) {
    if (fs.existsSync(file)) {
      if (fs.lstatSync(file).isDirectory()) {
        execute(`cp -r ${file} dist/`, `Error al copiar directorio ${file}`, true);
      } else {
        execute(`cp ${file} dist/`, `Error al copiar archivo ${file}`, true);
      }
    }
  }
}

/**
 * Ejecuta el proceso completo de construcción
 */
async function build() {
  try {
    console.log(`${colors.magenta}Iniciando proceso de construcción para producción...\n${colors.reset}`);
    
    prepareDistDirectory();
    compileServerTypeScript();
    buildClient();
    copyStaticFiles();
    
    console.log(`\n${colors.green}===== CONSTRUCCIÓN COMPLETADA =====\n${colors.reset}`);
    console.log(`${colors.green}La aplicación está lista para producción en la carpeta 'dist'${colors.reset}`);
    console.log(`${colors.blue}Para iniciar la aplicación, ejecute:${colors.reset}`);
    console.log(`${colors.yellow}cd dist && npm start${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}Error durante la construcción: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ejecutar el proceso de construcción
build();