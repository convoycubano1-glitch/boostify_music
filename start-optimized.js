/**
 * Script optimizado para iniciar la aplicación 
 * con configuraciones de memoria mejoradas y optimización para procesamiento de imágenes
 * 
 * Este script configura Node.js con parámetros optimizados para:
 * 1. Prevenir problemas de memoria y estabilidad
 * 2. Optimizar el procesamiento de imágenes (especialmente para Kling API)
 * 3. Monitorear el uso de recursos durante la ejecución
 * 
 * Versión: 1.2.0 - Optimización para procesamiento de imágenes y validación JPEG
 */

// Importamos el paquete child_process para ejecutar comandos
import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';

// Configuración optimizada para Node.js
const NODE_OPTIONS = [
  // Configuración de memoria
  '--max-old-space-size=768',  // Aumentado para manipulación de imágenes
  '--max-semi-space-size=128', // Aumentado para mejor rendimiento del GC con imágenes
  
  // Configuración de estabilidad
  '--no-expose-gc',            // No exponer garbage collector manualmente
  '--heapsnapshot-near-heap-limit=3', // Tomar snapshots para debugging cuando nos acercamos al límite
  
  // Optimizaciones para aplicaciones con procesamiento intensivo de imágenes
  '--max-http-header-size=16384', // Aumentar el tamaño máximo de cabeceras HTTP
  '--no-warnings',             // Reducir advertencias no críticas
  '--trace-warnings',          // Pero registrar advertencias importantes con stack trace
];

// Estadísticas del sistema para logging
const totalMemoryMB = Math.round(os.totalmem() / 1024 / 1024);
const freeMemoryMB = Math.round(os.freemem() / 1024 / 1024);
const cpuCount = os.cpus().length;
const loadAvg = os.loadavg();

// Comando a ejecutar
const CMD = 'tsx';
const ARGS = ['server/index.ts'];

console.log('🚀 Iniciando aplicación con configuración optimizada para procesamiento de imágenes');
console.log(`📅 Fecha de inicio: ${new Date().toISOString()}`);
console.log(`🧠 Memoria disponible: ${freeMemoryMB} MB / ${totalMemoryMB} MB (${Math.round(freeMemoryMB/totalMemoryMB*100)}% libre)`);
console.log(`💻 CPU: ${cpuCount} core(s), carga: ${loadAvg[0].toFixed(2)}, ${loadAvg[1].toFixed(2)}, ${loadAvg[2].toFixed(2)}`);
console.log('⚙️ Parámetros de optimización:');
NODE_OPTIONS.forEach(opt => console.log(`   ${opt}`));

// Configurar variables de entorno
const env = {
  ...process.env,
  NODE_OPTIONS: NODE_OPTIONS.join(' '),
  NODE_PRESERVE_SYMLINKS: '1',
  NODE_ENV: 'development',
  
  // Variables para optimizar el procesamiento de imágenes
  IMAGE_PROCESSING_ENABLED: '1',        // Habilitar procesamiento de imágenes
  IMAGE_STRICT_VALIDATION: '1',         // Validación estricta de formato JPEG
  IMAGE_PROCESSING_MEMORY_LIMIT: '256', // Límite de memoria para procesamiento de imágenes (MB)
  JPEG_VALIDATION_AGGRESSIVE: '1',      // Validación agresiva de formato JPEG
};

// Crear directorio logs si no existe
const logsDir = './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Crear archivos de log
const logTimestamp = new Date().toISOString().replace(/:/g, '-');
const outLog = fs.openSync(`${logsDir}/server-out-${logTimestamp}.log`, 'a');
const errLog = fs.openSync(`${logsDir}/server-err-${logTimestamp}.log`, 'a');

console.log(`📝 Logs: ${logsDir}/server-out-${logTimestamp}.log`);

// Iniciar el proceso de servidor con logs
const server = spawn(CMD, ARGS, {
  env,
  stdio: ['inherit', outLog, errLog] // stdin heredado, stdout y stderr a archivos
});

// Manejo de terminación
server.on('close', (code) => {
  console.log(`🛑 Proceso terminado con código ${code}`);
  
  // Cerrar archivos de log
  fs.closeSync(outLog);
  fs.closeSync(errLog);
  
  // Escribir resumen de cierre
  const endTime = Date.now();
  const runtimeSeconds = Math.floor((endTime - startTime) / 1000);
  const summary = `
======= RESUMEN DE EJECUCIÓN =======
Fecha de inicio: ${new Date(startTime).toISOString()}
Fecha de finalización: ${new Date(endTime).toISOString()}
Tiempo de ejecución: ${formatTime(runtimeSeconds)}
Código de salida: ${code}
==================================
`;
  fs.appendFileSync(`${logsDir}/server-summary-${logTimestamp}.log`, summary);
});

process.on('SIGINT', () => {
  console.log('👋 Recibida señal SIGINT (Ctrl+C). Terminando de forma limpia...');
  server.kill('SIGINT');
});

// Función para formatear tiempo en horas:minutos:segundos
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

// Registrar la hora de inicio para monitoreo de estabilidad
const startTime = Date.now();

// Monitor de recursos
setInterval(() => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const currentFreeMemoryMB = Math.round(os.freemem() / 1024 / 1024);
  const memoryUsedMB = totalMemoryMB - currentFreeMemoryMB;
  const memoryPercentUsed = Math.round((memoryUsedMB / totalMemoryMB) * 100);
  const currentLoadAvg = os.loadavg();
  
  // Verificación de memoria crítica (menos del 10% libre)
  if (currentFreeMemoryMB < totalMemoryMB * 0.1) {
    console.warn(`⚠️ ADVERTENCIA: Memoria baja (${currentFreeMemoryMB}MB, ${Math.round(currentFreeMemoryMB/totalMemoryMB*100)}% libre)`);
  }
  
  // Cada 5 minutos mostrar estadísticas completas
  if (uptime % 300 === 0 && uptime > 0) {
    console.log(`
📊 === ESTADÍSTICAS DEL SERVIDOR (${new Date().toISOString()}) ===
⏱️ Tiempo de ejecución: ${formatTime(uptime)}
🧠 Memoria: ${memoryUsedMB}MB / ${totalMemoryMB}MB (${memoryPercentUsed}% usado)
💻 Carga CPU: ${currentLoadAvg[0].toFixed(2)}, ${currentLoadAvg[1].toFixed(2)}, ${currentLoadAvg[2].toFixed(2)}
`);
    
    // Escribir estadísticas al archivo de log
    const statsLog = `${uptime},${memoryUsedMB},${totalMemoryMB},${currentLoadAvg[0]}\n`;
    fs.appendFileSync(`${logsDir}/server-stats-${logTimestamp}.csv`, statsLog);
  }
}, 1000);