/**
 * Script para preparar el despliegue en Replit
 * Este script mueve los archivos de la carpeta dist al directorio raíz
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function execute(command) {
  try {
    log(`Ejecutando: ${command}`, 'blue');
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error al ejecutar '${command}': ${error.message}`, 'red');
    return false;
  }
}

// Verificar que existe la carpeta dist
if (!fs.existsSync('./dist')) {
  log('Error: La carpeta dist no existe. Ejecuta primero node deploy-optimized.js', 'red');
  process.exit(1);
}

// Verificar que existe el archivo index.html en dist/client
if (!fs.existsSync('./dist/client/index.html')) {
  log('Error: No se encontró el archivo index.html en dist/client', 'red');
  process.exit(1);
}

log('====================================', 'magenta');
log('   PREPARANDO PARA DESPLIEGUE', 'magenta');
log('====================================', 'magenta');

// Guardar una copia de seguridad del package.json actual
if (fs.existsSync('./package.json')) {
  fs.copyFileSync('./package.json', './package.json.backup');
  log('✓ Copia de seguridad de package.json creada', 'green');
}

// Mover archivos de la carpeta dist al directorio raíz
log('Copiando archivos para el despliegue...', 'cyan');

// Copiar package.json
fs.copyFileSync('./dist/package.json', './package.json');
log('✓ Copiado: package.json', 'green');

// Mover archivos esenciales
const essentialFiles = [
  'optimized-start.js',
  'server-prod.js'
];

essentialFiles.forEach(file => {
  if (fs.existsSync(`./dist/${file}`)) {
    fs.copyFileSync(`./dist/${file}`, `./${file}`);
    log(`✓ Copiado: ${file}`, 'green');
  }
});

// Crear directorio client si no existe
if (!fs.existsSync('./client')) {
  fs.mkdirSync('./client', { recursive: true });
}

// Copiar todo el directorio client
execute('cp -r ./dist/client/* ./client/');

log('====================================', 'green');
log('✓ PREPARACIÓN COMPLETADA', 'green');
log('====================================', 'green');

log('\nPasos para desplegar:', 'cyan');
log('1. Inicia la aplicación con: node optimized-start.js', 'cyan');
log('2. Verifica que los videos se reproduzcan correctamente', 'cyan');
log('3. Usa el botón "Deploy" de Replit para desplegar la aplicación', 'cyan');