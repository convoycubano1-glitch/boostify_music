/**
 * Script para probar el extractor de respuestas de Kling API
 * 
 * Este script envía solicitudes a los endpoints de prueba para verificar
 * que el extractor de datos maneje correctamente los diferentes formatos de respuesta.
 */

import axios from 'axios';

// URL base para las solicitudes (usa la URL actual para funcionar en Replit)
const BASE_URL = '/api/kling-test';

// Función para probar el endpoint de verificación con diferentes formatos
async function testExtractor() {
  console.log('🧪 Iniciando pruebas del extractor de respuestas de Kling API...');
  
  const responseTypes = [
    'simple',
    'nested',
    'error',
    'nested-error',
    'processing',
    'unusual'
  ];
  
  for (const type of responseTypes) {
    try {
      console.log(`\n📋 Probando respuesta tipo: ${type}`);
      
      // Usar el endpoint de verificación
      const response = await axios.post(`${BASE_URL}/verify-extractor`, {
        responseType: type
      });
      
      // Mostrar resultados de la extracción
      console.log('✅ Respuesta original:');
      console.log(JSON.stringify(response.data.original, null, 2));
      
      console.log('✅ Respuesta procesada:');
      console.log(JSON.stringify(response.data.processed, null, 2));
      
      console.log('📊 Detalles de extracción:');
      console.log(JSON.stringify(response.data.extractionDetails, null, 2));
      
    } catch (error) {
      console.error(`❌ Error probando respuesta tipo ${type}:`, error.message);
      if (error.response) {
        console.error('Detalles:', error.response.data);
      }
    }
  }
  
  console.log('\n🏁 Pruebas completadas.');
}

// Función para probar el endpoint de respuestas simuladas
async function testSimulatedResponses() {
  console.log('\n🧪 Probando endpoints de respuestas simuladas...');
  
  const simulationTypes = [
    'simple',
    'nested',
    'error',
    'nested-error',
    'processing',
    'unusual'
  ];
  
  for (const type of simulationTypes) {
    try {
      console.log(`\n📋 Obteniendo respuesta simulada tipo: ${type}`);
      
      // Usar el endpoint de simulación
      const response = await axios.get(`${BASE_URL}/simulate/${type}`);
      
      // Mostrar la respuesta simulada
      console.log('✅ Respuesta:');
      console.log(JSON.stringify(response.data.rawResponse, null, 2));
      
    } catch (error) {
      console.error(`❌ Error obteniendo respuesta simulada tipo ${type}:`, error.message);
      if (error.response) {
        console.error('Detalles:', error.response.data);
      }
    }
  }
  
  console.log('\n🏁 Pruebas de simulación completadas.');
}

// Función principal
async function runTests() {
  try {
    // Probar el extractor
    await testExtractor();
    
    // Probar las respuestas simuladas
    await testSimulatedResponses();
    
    console.log('\n✨ Todas las pruebas finalizadas.');
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar pruebas
runTests();