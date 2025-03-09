/**
 * Script para probar las funcionalidades de Kling API
 * Este script verifica el funcionamiento básico del procesador de imágenes y el servicio de Kling API
 * 
 * Versión mejorada: Incluye pruebas con imágenes malformadas (sin tablas Huffman)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Configurar el __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verifica si una imagen JPEG tiene tablas Huffman (DHT marker) y la secuencia 0xFF00 requerida
 * 
 * @param {Buffer} imageBuffer - Buffer de la imagen JPEG
 * @returns {Object} - Resultados de la verificación
 */
function verifyJpegTables(imageBuffer) {
  // Verificar si es un JPEG válido (empieza con SOI marker)
  const hasValidSOI = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8;
  
  // Verificar si termina con EOI marker
  const hasValidEOI = imageBuffer[imageBuffer.length - 2] === 0xFF && 
                      imageBuffer[imageBuffer.length - 1] === 0xD9;
  
  // Buscar marcador DHT (0xFF 0xC4)
  let hasDHTMarker = false;
  
  // Buscar secuencia FF00 (requerida por algunos decodificadores)
  let hasFF00Sequence = false;
  
  for (let i = 0; i < imageBuffer.length - 1; i++) {
    // Buscar DHT marker
    if (imageBuffer[i] === 0xFF && imageBuffer[i + 1] === 0xC4) {
      hasDHTMarker = true;
    }
    
    // Buscar secuencia FF00
    if (imageBuffer[i] === 0xFF && imageBuffer[i + 1] === 0x00) {
      hasFF00Sequence = true;
    }
  }
  
  return {
    hasValidSOI,
    hasValidEOI,
    hasDHTMarker,
    hasFF00Sequence
  };
}

/**
 * Añade tablas Huffman estándar a una imagen JPEG
 * 
 * @param {Buffer} imageBuffer - Buffer de la imagen JPEG
 * @returns {Buffer} - Imagen con tablas Huffman añadidas
 */
function addHuffmanTables(imageBuffer) {
  // Tablas Huffman estándar para JPEG baseline 
  // Estas tablas son utilizadas en la mayoría de los JPEG estándar
  const standardDHT = Buffer.from([
    // DHT marker (0xFF, 0xC4)
    0xFF, 0xC4,
    // Longitud del segmento (0x01, 0xA2) = 418 bytes
    0x01, 0xA2,
    // Tablas Huffman estándar (contenido omitido por brevedad)
    // DC luminance
    0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
    // AC luminance
    0x10, 0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
    0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0,
    0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49,
    0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69,
    0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5, 0xA6, 0xA7,
    0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5,
    0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8,
    0xF9, 0xFA,
    // DC chrominance
    0x01, 0x00, 0x03, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
    // AC chrominance
    0x11, 0x00, 0x02, 0x01, 0x02, 0x04, 0x04, 0x03, 0x04, 0x07, 0x05, 0x04, 0x04, 0x00, 0x01, 0x02, 0x77,
    0x00, 0x01, 0x02, 0x03, 0x11, 0x04, 0x05, 0x21, 0x31, 0x06, 0x12, 0x41, 0x51, 0x07, 0x61, 0x71,
    0x13, 0x22, 0x32, 0x81, 0x08, 0x14, 0x42, 0x91, 0xA1, 0xB1, 0xC1, 0x09, 0x23, 0x33, 0x52, 0xF0,
    0x15, 0x62, 0x72, 0xD1, 0x0A, 0x16, 0x24, 0x34, 0xE1, 0x25, 0xF1, 0x17, 0x18, 0x19, 0x1A, 0x26,
    0x27, 0x28, 0x29, 0x2A, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48,
    0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
    0x69, 0x6A, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7A, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
    0x88, 0x89, 0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3, 0xA4, 0xA5,
    0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3,
    0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9, 0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA,
    0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF2, 0xF3, 0xF4, 0xF5, 0xF6, 0xF7, 0xF8,
    0xF9, 0xFA
  ]);
  
  // Dividir el buffer de la imagen en dos partes: encabezado y resto
  // Queremos insertar las tablas Huffman después del marcador APP0 o SOI
  // Buscamos el marcador APP0 (0xFF, 0xE0) que suele seguir al SOI
  
  let insertPos = 2; // Por defecto después del SOI
  
  for (let i = 0; i < imageBuffer.length - 1; i++) {
    if (imageBuffer[i] === 0xFF && (imageBuffer[i + 1] >= 0xE0 && imageBuffer[i + 1] <= 0xEF)) {
      // Encontramos un marcador APPn, insertamos después de él
      const segmentLength = (imageBuffer[i + 2] << 8) + imageBuffer[i + 3];
      insertPos = i + 2 + segmentLength;
      break;
    }
  }
  
  const part1 = imageBuffer.slice(0, insertPos);
  const part2 = imageBuffer.slice(insertPos);
  
  // Concatenamos: parte1 + tablas Huffman + parte2
  return Buffer.concat([part1, standardDHT, part2]);
}

/**
 * Convierte una imagen a base64 para usar en pruebas
 * @param {string} filePath - Ruta del archivo de imagen
 * @returns {string} - Data URL en base64
 */
function imageToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg'; // Asumimos JPEG para pruebas
    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error(`Error al convertir imagen a base64: ${error.message}`);
    return null;
  }
}

/**
 * Inicia un proceso de Virtual Try-On
 * @param {string} modelImageDataUrl - Imagen del modelo en formato data URL
 * @param {string} garmentImageDataUrl - Imagen de la prenda en formato data URL
 * @returns {Promise<string>} - ID de la tarea creada
 */
async function startTryOn(modelImageDataUrl, garmentImageDataUrl) {
  console.log('🔄 Iniciando Try-On con Kling API...');
  
  try {
    const apiKey = process.env.PIAPI_API_KEY;
    if (!apiKey) {
      throw new Error('API key no encontrada. Configura PIAPI_API_KEY en el entorno.');
    }
    
    const requestData = {
      model: "kling",
      task_type: "ai_try_on",
      params: {
        model_image: modelImageDataUrl,
        clothing_image: garmentImageDataUrl
      }
    };
    
    console.log('📤 Enviando solicitud Try-On con imágenes:');
    console.log(`➡️ modelImageLength: ${modelImageDataUrl.length}`);
    console.log(`➡️ clothingImageLength: ${garmentImageDataUrl.length}`);
    
    const response = await axios.post(
      'https://api.piapi.ai/api/v1/task',
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.task_id) {
      console.log(`✅ Try-On iniciado correctamente, ID: ${response.data.task_id}`);
      return response.data.task_id;
    } else {
      throw new Error('Respuesta inesperada de la API: No se recibió ID de tarea');
    }
  } catch (error) {
    console.error('❌ Error al iniciar Try-On:', error.message);
    if (error.response) {
      console.error(`Código: ${error.response.status}`);
      console.error('Datos:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Verifica el estado de un proceso de Try-On
 * @param {string} taskId - ID de la tarea
 * @returns {Promise<object>} - Resultado de la verificación
 */
async function checkStatus(taskId) {
  console.log(`🔎 Verificando estado para tarea ${taskId}...`);
  
  try {
    const apiKey = process.env.PIAPI_API_KEY;
    if (!apiKey) {
      throw new Error('API key no encontrada. Configura PIAPI_API_KEY en el entorno.');
    }
    
    const url = `https://api.piapi.ai/api/v1/task/status/${taskId}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log(`✅ Estado recibido: ${response.data.status}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar estado:', error.message);
    if (error.response) {
      console.error(`Código: ${error.response.status}`);
      console.error('Datos:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

/**
 * Procesa una imagen para asegurarse de que tenga tablas Huffman
 * @param {string} imagePath - Ruta de la imagen
 * @returns {string} - Data URL procesada con tablas Huffman
 */
async function processImageForKling(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  
  // Verificar si la imagen tiene tablas Huffman
  const analysis = verifyJpegTables(imageBuffer);
  console.log(`🔍 Análisis de la imagen ${path.basename(imagePath)}:`);
  console.log(analysis);
  
  let processedBuffer = imageBuffer;
  
  // Si no tiene tablas Huffman, añadirlas
  if (!analysis.hasDHTMarker) {
    console.log('⚠️ La imagen no tiene tablas Huffman (DHT) - Aplicando corrección');
    processedBuffer = addHuffmanTables(imageBuffer);
    
    // Verificar la imagen procesada
    const processedAnalysis = verifyJpegTables(processedBuffer);
    console.log('🔍 Análisis de la imagen procesada:');
    console.log(processedAnalysis);
    
    if (processedAnalysis.hasDHTMarker) {
      console.log('✅ Corrección aplicada correctamente');
    } else {
      console.error('❌ La corrección no fue efectiva');
    }
  } else {
    console.log('✅ La imagen ya tiene tablas Huffman - No necesita corrección');
  }
  
  // Convertir a base64
  const base64Image = processedBuffer.toString('base64');
  return `data:image/jpeg;base64,${base64Image}`;
}

/**
 * Función principal para ejecutar la prueba completa
 */
async function runTest() {
  try {
    console.log('🧪 Iniciando prueba de Kling API con imágenes diferentes...');
    
    // Configurar rutas a imágenes de prueba
    const ORIGINAL_MODEL_IMAGE_PATH = path.join(__dirname, './attached_assets/IMG_1551.jpeg');
    const ORIGINAL_GARMENT_IMAGE_PATH = path.join(__dirname, './attached_assets/IMG_2485.jpeg');
    const MALFORMED_IMAGE_PATH = path.join(__dirname, './bad-huffman-test.jpeg');
    
    console.log('\n📂 PRUEBA 1: Imagen malformada con procesador de corrección');
    console.log(`📂 Usando imagen de modelo malformada: ${MALFORMED_IMAGE_PATH}`);
    console.log(`📂 Usando imagen de prenda normal: ${ORIGINAL_GARMENT_IMAGE_PATH}`);
    
    // Procesar las imágenes (verificar y corregir tablas Huffman)
    console.log('\n🔄 Procesando imágenes...');
    const malformedModelImageBase64 = await processImageForKling(MALFORMED_IMAGE_PATH);
    const garmentImageBase64 = await processImageForKling(ORIGINAL_GARMENT_IMAGE_PATH);
    
    if (!malformedModelImageBase64 || !garmentImageBase64) {
      throw new Error('Error al procesar imágenes de prueba');
    }
    
    // 1. Iniciar el proceso de Try-On
    console.log('\n📤 Paso 1: Iniciar proceso de Try-On con imagen corregida...');
    const taskId = await startTryOn(malformedModelImageBase64, garmentImageBase64);
    
    if (!taskId) {
      throw new Error('No se pudo iniciar el proceso de Try-On');
    }
    
    // 2. Verificar estado inicial
    console.log('\n🔄 Paso 2: Verificando estado inicial...');
    let statusResult = await checkStatus(taskId);
    
    console.log('📊 Resultado de verificación de estado:');
    console.log(JSON.stringify(statusResult, null, 2));
    
    // 3. Simular polling de estado (verificar cada 5 segundos, solo un intento para la prueba)
    console.log('\n⏱️ Paso 3: Verificando estado final (esperando 5 segundos)...');
    
    // Esperar 5 segundos
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar estado
    statusResult = await checkStatus(taskId);
    
    console.log('📊 Resultado actualizado:');
    console.log(JSON.stringify(statusResult, null, 2));
    
    // Evaluación de la prueba
    if (statusResult.status === 'failed' && statusResult.errorMessage && statusResult.errorMessage.includes('Huffman')) {
      console.error('❌ ERROR DE TABLAS HUFFMAN - La corrección no funcionó o hay otro problema con la imagen');
    } else {
      console.log('✅ Prueba exitosa: La imagen malformada se procesó correctamente o avanzó a la siguiente etapa de procesamiento');
    }
    
    console.log('\n🎉 Prueba completada!');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    if (error.response) {
      console.error(`Código de respuesta: ${error.response.status}`);
      console.error('Datos de respuesta:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Ejecutar la prueba
runTest();