/**
 * Script de inicio mejorado que asegura la integridad de los alias
 * y reinicia automáticamente la aplicación si hay problemas
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);
const clientSrcDir = path.join(rootDir, 'client', 'src');
const nodeModulesDir = path.join(rootDir, 'node_modules');

/**
 * Verifica y corrige problemas con los alias
 */
async function fixAliases() {
  console.log('🔧 Verificando y corrigiendo config de aliases...');

  // Fix circular symlinks in assets directory
  const assetsDir = path.join(clientSrcDir, 'assets');
  try {
    if (fs.existsSync(assetsDir)) {
      const stats = fs.lstatSync(assetsDir);
      if (stats.isSymbolicLink()) {
        console.log('🔄 Eliminando enlace simbólico circular en assets...');
        fs.unlinkSync(assetsDir);
        fs.mkdirSync(assetsDir, { recursive: true });
        console.log('✅ Directorio assets recreado correctamente');
      }
    } else {
      fs.mkdirSync(assetsDir, { recursive: true });
      console.log('✅ Directorio assets creado');
    }
  } catch (error) {
    console.error('⚠️ Error al arreglar directorio assets:', error.message);
  }

  // Set up @ alias in node_modules
  const atDir = path.join(nodeModulesDir, '@');
  const packageJsonPath = path.join(atDir, 'package.json');
  
  try {
    // Create @ directory if it doesn't exist
    if (!fs.existsSync(atDir)) {
      fs.mkdirSync(atDir, { recursive: true });
      console.log('✅ Directorio @ creado en node_modules');
    }
    
    // Create package.json for @ alias
    const packageJson = {
      name: '@',
      version: '1.0.0',
      main: '../../client/src/index.js',
      types: '../../client/src/index.d.ts'
    };
    
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ package.json configurado para alias @');
    
  } catch (error) {
    console.error('⚠️ Error al configurar alias @:', error.message);
  }
  
  // Ensure critical directories exist
  const criticalDirs = ['lib', 'components', 'styles', 'firebase'];
  
  for (const dir of criticalDirs) {
    const dirPath = path.join(clientSrcDir, dir);
    
    try {
      if (fs.existsSync(dirPath)) {
        const stats = fs.lstatSync(dirPath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(dirPath);
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`✅ Directorio ${dir} recreado correctamente`);
        }
      } else {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Directorio ${dir} creado`);
      }
    } catch (error) {
      console.error(`⚠️ Error al arreglar directorio ${dir}:`, error.message);
    }
  }
  
  console.log('✅ Verificación de aliases completada');
}

/**
 * Inicia la aplicación usando npm run dev
 */
function startApplication() {
  console.log('🚀 Iniciando aplicación...');
  
  // Spawns the child process to run npm dev
  const npmProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  console.log('✅ Proceso npm run dev iniciado');
  
  // Handle process end
  npmProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Proceso terminado con código ${code}`);
      console.log('🔄 Intentando reiniciar...');
      
      // If the process crashed, try to fix aliases again
      setTimeout(async () => {
        await fixAliases();
        startApplication();
      }, 1000);
    } else {
      console.log('✅ Aplicación terminada correctamente');
    }
  });
  
  // Handle process error
  npmProcess.on('error', (error) => {
    console.error('❌ Error al iniciar la aplicación:', error);
  });
  
  return npmProcess;
}

/**
 * Función principal
 */
async function main() {
  try {
    // First, fix any alias issues
    await fixAliases();
    
    // Then start the application
    const appProcess = startApplication();
    
    // Handle script termination
    process.on('SIGINT', () => {
      console.log('👋 Terminando aplicación...');
      appProcess.kill('SIGINT');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error('❌ Error no capturado:', err);
  process.exit(1);
});