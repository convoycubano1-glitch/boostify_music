#!/usr/bin/env node

/**
 * Script para verificar que el entorno está configurado correctamente
 * para el despliegue de Boostify Music
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuración básica
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la salida
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Encabezado
console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║             VERIFICACIÓN DE DESPLIEGUE                   ║
║                 BOOSTIFY MUSIC                           ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);

// Verificar archivos críticos
const requiredFiles = [
  { path: 'start-deployment.js', description: 'Script principal de despliegue' },
  { path: 'start-prod.js', description: 'Script alternativo de despliegue' },
  { path: 'deploy.sh', description: 'Script de shell para despliegue local' },
  { path: 'server/index.ts', description: 'Punto de entrada del servidor' },
  { path: 'client/src/main.tsx', description: 'Punto de entrada del cliente' }
];

console.log(`${colors.blue}[1] Verificando archivos críticos...${colors.reset}`);

let allFilesPresent = true;
for (const file of requiredFiles) {
  if (fs.existsSync(path.join(__dirname, file.path))) {
    console.log(`  ${colors.green}✓ ${file.path}${colors.reset} (${file.description})`);
  } else {
    console.log(`  ${colors.red}✗ ${file.path}${colors.reset} (${file.description}) - ¡FALTA!`);
    allFilesPresent = false;
  }
}

if (!allFilesPresent) {
  console.log(`\n${colors.red}❌ Error: Faltan archivos críticos para el despliegue.${colors.reset}`);
  process.exit(1);
}

// Verificar permisos de ejecución
console.log(`\n${colors.blue}[2] Verificando permisos de ejecución...${colors.reset}`);

const executableFiles = ['deploy.sh', 'start-deployment.js', 'start-prod.js'];
let allPermissionsCorrect = true;

for (const file of executableFiles) {
  try {
    const filePath = path.join(__dirname, file);
    const stats = fs.statSync(filePath);
    const isExecutable = !!(stats.mode & 0o111);
    
    if (isExecutable) {
      console.log(`  ${colors.green}✓ ${file}${colors.reset} tiene permisos de ejecución`);
    } else {
      console.log(`  ${colors.yellow}⚠ ${file}${colors.reset} no tiene permisos de ejecución`);
      console.log(`    Ejecutando: chmod +x ${file}`);
      fs.chmodSync(filePath, stats.mode | 0o111);
      console.log(`  ${colors.green}✓ Permisos corregidos para ${file}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error al verificar permisos de ${file}: ${error.message}${colors.reset}`);
    allPermissionsCorrect = false;
  }
}

// Verificar dependencias
console.log(`\n${colors.blue}[3] Verificando dependencias críticas...${colors.reset}`);

const requiredDependencies = ['tsx', 'ts-node', 'typescript'];
let allDependenciesPresent = true;

for (const dep of requiredDependencies) {
  try {
    const output = execSync(`npm list ${dep} --depth=0 2>/dev/null`).toString();
    if (output.includes(dep)) {
      console.log(`  ${colors.green}✓ ${dep}${colors.reset} está instalado`);
    } else {
      console.log(`  ${colors.yellow}⚠ ${dep}${colors.reset} no está instalado como dependencia directa`);
      allDependenciesPresent = false;
    }
  } catch (error) {
    console.log(`  ${colors.yellow}⚠ ${dep}${colors.reset} no está instalado`);
    allDependenciesPresent = false;
  }
}

if (!allDependenciesPresent) {
  console.log(`  ${colors.yellow}⚠ Algunas dependencias podrían necesitar ser instaladas durante el despliegue.${colors.reset}`);
  console.log(`  ${colors.cyan}ℹ El script start-deployment.js instalará las dependencias faltantes automáticamente.${colors.reset}`);
}

// Mostrar configuración actual
console.log(`\n${colors.blue}[4] Configuración actual...${colors.reset}`);

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

console.log(`  ${colors.cyan}Scripts disponibles:${colors.reset}`);
console.log(`  - npm start: ${packageJson.scripts.start || 'No definido'}`);
console.log(`  - npm run deploy: ${packageJson.scripts.deploy || 'No definido'}`);
console.log(`  - npm run build: ${packageJson.scripts.build || 'No definido'}`);

// Mostrar instrucciones para despliegue
console.log(`\n${colors.blue}[5] Instrucciones para el despliegue:${colors.reset}`);
console.log(`
  ${colors.magenta}Pasos para desplegar en Replit:${colors.reset}
  1. Haz clic en el botón "Deploy" en la parte superior de Replit
  2. Cuando se te pida un comando de compilación, DÉJALO EN BLANCO
  3. En el comando de inicio, escribe: ${colors.green}node start-deployment.js${colors.reset}
  4. Completa el despliegue

  ${colors.magenta}Para ejecutar localmente:${colors.reset}
  - Opción 1: ${colors.green}./deploy.sh${colors.reset}
  - Opción 2: ${colors.green}node start-deployment.js${colors.reset}
  - Opción 3: ${colors.green}node start-prod.js${colors.reset}
`);

// Resultado final
console.log(`\n${colors.blue}[6] Resultado de la verificación:${colors.reset}`);

if (allFilesPresent && allPermissionsCorrect) {
  console.log(`
  ${colors.green}✅ ¡VERIFICACIÓN COMPLETA!${colors.reset}
  ${colors.cyan}El entorno está listo para el despliegue de Boostify Music.${colors.reset}
  ${colors.cyan}Para más detalles, consulta:${colors.reset}
  - ${colors.yellow}INSTRUCCIONES-DESPLIEGUE.md${colors.reset} - Guía paso a paso
  - ${colors.yellow}DEPLOYMENT-SOLUTION.md${colors.reset} - Documentación técnica
  `);
} else {
  console.log(`
  ${colors.red}⚠️ VERIFICACIÓN INCOMPLETA${colors.reset}
  ${colors.yellow}Hay problemas que deben ser corregidos antes del despliegue.${colors.reset}
  ${colors.yellow}Revisa los mensajes anteriores y corrige los problemas indicados.${colors.reset}
  `);
}

// Mensaje final
console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║       VERIFICACIÓN COMPLETADA - BOOSTIFY MUSIC           ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);