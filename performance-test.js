/**
 * Script para pruebas de rendimiento en entorno de producción
 * Este script mide el tiempo de carga y respuesta de diferentes endpoints
 * para evaluar el rendimiento de la aplicación en producción.
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuración
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ITERATIONS = process.env.TEST_ITERATIONS ? parseInt(process.env.TEST_ITERATIONS) : 5;
const TIMEOUT = process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) : 10000;

// Colores para la consola
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

console.log(`${BLUE}=======================================${RESET}`);
console.log(`${BLUE}    PRUEBAS DE RENDIMIENTO PRODUCCIÓN    ${RESET}`);
console.log(`${BLUE}=======================================${RESET}`);
console.log(`URL Base: ${BASE_URL}`);
console.log(`Iteraciones: ${ITERATIONS}`);
console.log(`Timeout: ${TIMEOUT}ms\n`);

/**
 * Realiza una prueba de rendimiento en un endpoint
 * @param {string} endpoint URL del endpoint a probar
 * @param {string} name Nombre descriptivo de la prueba
 * @param {string} method Método HTTP (GET, POST, etc.)
 * @param {object} data Datos para enviar (solo para POST, PUT)
 * @param {object} headers Cabeceras HTTP adicionales
 */
async function testEndpoint(endpoint, name, method = 'GET', data = null, headers = {}) {
  console.log(`${YELLOW}Probando: ${name} (${method} ${endpoint})${RESET}`);
  
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const tiempos = [];
  const resultados = {
    exito: 0,
    fallo: 0,
    tiempoPromedio: 0,
    tiempoMinimo: Number.MAX_SAFE_INTEGER,
    tiempoMaximo: 0,
    errores: []
  };
  
  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const inicio = performance.now();
      
      const response = await axios({
        method,
        url,
        data,
        headers,
        timeout: TIMEOUT
      });
      
      const fin = performance.now();
      const tiempoMs = fin - inicio;
      
      tiempos.push(tiempoMs);
      resultados.exito++;
      
      if (tiempoMs < resultados.tiempoMinimo) resultados.tiempoMinimo = tiempoMs;
      if (tiempoMs > resultados.tiempoMaximo) resultados.tiempoMaximo = tiempoMs;
      
      process.stdout.write(`${GREEN}✓${RESET}`);
    } catch (error) {
      resultados.fallo++;
      process.stdout.write(`${RED}✗${RESET}`);
      
      resultados.errores.push({
        mensaje: error.message,
        codigo: error.response?.status,
        datos: error.response?.data
      });
    }
  }
  
  if (tiempos.length > 0) {
    resultados.tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
  }
  
  if (resultados.tiempoMinimo === Number.MAX_SAFE_INTEGER) {
    resultados.tiempoMinimo = 0;
  }
  
  console.log('\n');
  console.log(`${BLUE}Resultados para ${name}:${RESET}`);
  console.log(`Éxito: ${resultados.exito}/${ITERATIONS} (${(resultados.exito / ITERATIONS * 100).toFixed(2)}%)`);
  console.log(`Tiempo promedio: ${resultados.tiempoPromedio.toFixed(2)}ms`);
  console.log(`Tiempo mínimo: ${resultados.tiempoMinimo.toFixed(2)}ms`);
  console.log(`Tiempo máximo: ${resultados.tiempoMaximo.toFixed(2)}ms`);
  
  if (resultados.errores.length > 0) {
    console.log(`${RED}Errores encontrados:${RESET}`);
    resultados.errores.forEach((error, index) => {
      console.log(`  Error ${index + 1}: ${error.mensaje} (Código: ${error.codigo || 'N/A'})`);
    });
  }
  
  console.log('----------------------------------------');
  return resultados;
}

/**
 * Ejecuta todas las pruebas de rendimiento
 */
async function ejecutarPruebas() {
  const resultados = {};
  
  // Prueba 1: Carga de la página principal
  resultados.paginaPrincipal = await testEndpoint('/', 'Página Principal');
  
  // Prueba 2: API de estado
  resultados.apiStatus = await testEndpoint('/api/status', 'API de Estado');
  
  // Prueba 3: Carga de activos estáticos
  resultados.activos = await testEndpoint('/assets/freepik__boostify_music_organe_abstract_icon.png', 'Carga de Activos Estáticos');
  
  // Prueba 4: Ruta no encontrada (para probar manejo de errores)
  resultados.rutaNoEncontrada = await testEndpoint('/ruta-que-no-existe', 'Manejo de Rutas No Encontradas');
  
  // Resumen general
  console.log(`${BLUE}=======================================${RESET}`);
  console.log(`${BLUE}    RESUMEN DE RENDIMIENTO    ${RESET}`);
  console.log(`${BLUE}=======================================${RESET}`);
  
  let totalExito = 0;
  let totalPruebas = 0;
  let tiempoPromedioTotal = 0;
  let pruebasConExito = 0;
  
  Object.entries(resultados).forEach(([nombre, resultado]) => {
    totalExito += resultado.exito;
    totalPruebas += ITERATIONS;
    
    if (resultado.tiempoPromedio > 0) {
      tiempoPromedioTotal += resultado.tiempoPromedio;
      pruebasConExito++;
    }
    
    // Evaluar rendimiento
    let calificacion;
    if (resultado.tiempoPromedio < 200) {
      calificacion = `${GREEN}Excelente${RESET}`;
    } else if (resultado.tiempoPromedio < 500) {
      calificacion = `${GREEN}Bueno${RESET}`;
    } else if (resultado.tiempoPromedio < 1000) {
      calificacion = `${YELLOW}Aceptable${RESET}`;
    } else {
      calificacion = `${RED}Necesita Optimización${RESET}`;
    }
    
    console.log(`${nombre}: ${resultado.tiempoPromedio.toFixed(2)}ms - ${calificacion}`);
  });
  
  const exitoTotal = (totalExito / totalPruebas * 100).toFixed(2);
  const tiempoPromedioGeneral = pruebasConExito > 0 ? (tiempoPromedioTotal / pruebasConExito).toFixed(2) : 0;
  
  console.log(`\nTasa de éxito general: ${exitoTotal}%`);
  console.log(`Tiempo promedio general: ${tiempoPromedioGeneral}ms`);
  
  // Evaluación final
  let evaluacionFinal;
  if (exitoTotal >= 95 && tiempoPromedioGeneral < 300) {
    evaluacionFinal = `${GREEN}EXCELENTE - La aplicación está lista para producción con alto rendimiento${RESET}`;
  } else if (exitoTotal >= 90 && tiempoPromedioGeneral < 600) {
    evaluacionFinal = `${GREEN}BUENO - La aplicación funciona bien pero hay margen de mejora${RESET}`;
  } else if (exitoTotal >= 80 && tiempoPromedioGeneral < 1000) {
    evaluacionFinal = `${YELLOW}ACEPTABLE - Se recomienda optimizar antes de desplegar a producción${RESET}`;
  } else {
    evaluacionFinal = `${RED}NECESITA MEJORAS - No se recomienda desplegar hasta optimizar${RESET}`;
  }
  
  console.log(`\nEvaluación final: ${evaluacionFinal}`);
}

// Ejecutar las pruebas
ejecutarPruebas().catch(error => {
  console.error(`${RED}Error al ejecutar las pruebas:${RESET}`, error);
  process.exit(1);
});