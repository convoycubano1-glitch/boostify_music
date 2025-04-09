/**
 * Script para probar el rendimiento del servidor al servir videos
 * Este script realiza solicitudes concurrentes para simular múltiples usuarios
 */

const http = require('http');
const { performance } = require('perf_hooks');

// Configuración de la prueba
const TEST_CONFIG = {
  host: 'localhost',
  port: 5000,
  concurrentRequests: 5,  // Número de solicitudes simultáneas
  videoPaths: [
    '/assets/hero-video.mp4',
    '/assets/style_advisor_bg.mp4',
    '/video/hero-video.mp4',
    '/api/videos',
    '/diagnose'
  ],
  timeout: 10000  // Tiempo de espera máximo en ms
};

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

// Función para realizar una solicitud HTTP
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const options = {
      host: TEST_CONFIG.host,
      port: TEST_CONFIG.port,
      path: path,
      method: 'HEAD',  // Solo encabezados para evitar cargar todo el video
      timeout: TEST_CONFIG.timeout
    };
    
    const req = http.request(options, (res) => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      let data = {
        path,
        statusCode: res.statusCode,
        duration,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length']
      };
      
      res.on('data', () => {});  // Consumir datos para evitar fugas de memoria
      
      res.on('end', () => {
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      reject({
        path,
        error: error.message,
        duration: (performance.now() - startTime).toFixed(2)
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject({
        path,
        error: 'Timeout',
        duration: TEST_CONFIG.timeout
      });
    });
    
    req.end();
  });
}

// Función principal para ejecutar pruebas
async function runPerformanceTests() {
  log('====================================', 'magenta');
  log('  PRUEBA DE RENDIMIENTO DE VIDEOS', 'magenta');
  log('====================================', 'magenta');
  log(`Servidor: ${TEST_CONFIG.host}:${TEST_CONFIG.port}`, 'blue');
  log(`Solicitudes concurrentes: ${TEST_CONFIG.concurrentRequests}`, 'blue');
  log(`Rutas a probar: ${TEST_CONFIG.videoPaths.length}`, 'blue');
  log('====================================', 'magenta');
  
  const results = {
    successful: 0,
    failed: 0,
    totalTime: 0,
    responses: []
  };
  
  // Probar cada ruta
  for (const path of TEST_CONFIG.videoPaths) {
    log(`\nProbando: ${path}`, 'cyan');
    
    // Crear solicitudes concurrentes
    const requests = [];
    for (let i = 0; i < TEST_CONFIG.concurrentRequests; i++) {
      requests.push(makeRequest(path));
    }
    
    // Esperar a que todas las solicitudes se completen
    try {
      const start = performance.now();
      const responses = await Promise.allSettled(requests);
      const end = performance.now();
      const totalTime = (end - start).toFixed(2);
      
      results.totalTime += parseFloat(totalTime);
      
      // Procesar resultados
      let successCount = 0;
      let failCount = 0;
      let avgDuration = 0;
      
      responses.forEach((response) => {
        if (response.status === 'fulfilled') {
          successCount++;
          avgDuration += parseFloat(response.value.duration);
          results.responses.push(response.value);
        } else {
          failCount++;
          results.responses.push(response.reason);
        }
      });
      
      avgDuration = avgDuration / successCount;
      
      results.successful += successCount;
      results.failed += failCount;
      
      log(`Resultado: ${successCount}/${TEST_CONFIG.concurrentRequests} exitosas`, successCount === TEST_CONFIG.concurrentRequests ? 'green' : 'yellow');
      log(`Tiempo promedio: ${avgDuration.toFixed(2)}ms`, avgDuration < 500 ? 'green' : 'yellow');
      log(`Tiempo total: ${totalTime}ms`, 'blue');
      
      if (failCount > 0) {
        log(`Fallos: ${failCount}`, 'red');
      }
    } catch (error) {
      log(`Error al probar ${path}: ${error.message}`, 'red');
      results.failed += TEST_CONFIG.concurrentRequests;
    }
  }
  
  // Mostrar resumen
  log('\n====================================', 'magenta');
  log('          RESUMEN', 'magenta');
  log('====================================', 'magenta');
  log(`Total de solicitudes: ${results.successful + results.failed}`, 'blue');
  log(`Exitosas: ${results.successful}`, results.successful > 0 ? 'green' : 'red');
  log(`Fallidas: ${results.failed}`, results.failed === 0 ? 'green' : 'red');
  log(`Tiempo total: ${results.totalTime.toFixed(2)}ms`, 'blue');
  
  // Análisis
  if (results.failed === 0) {
    log('\n✅ El servidor maneja correctamente solicitudes concurrentes de video.', 'green');
  } else {
    log('\n⚠️ El servidor tiene problemas para manejar algunas solicitudes concurrentes.', 'yellow');
  }
  
  // Detalles de solicitudes fallidas
  if (results.failed > 0) {
    log('\nDetalles de fallos:', 'red');
    results.responses.filter(r => r.error).forEach((res, index) => {
      log(`${index + 1}. ${res.path} - ${res.error} (${res.duration}ms)`, 'red');
    });
  }
}

// Ejecutar pruebas
runPerformanceTests().catch(error => {
  log(`\nError en la prueba: ${error.message}`, 'red');
  process.exit(1);
});