/**
 * Script para probar el procesador de imágenes mejorado
 * 
 * Este script verifica si el procesador de imágenes corrige correctamente
 * los problemas de tablas Huffman no inicializadas en imágenes JPEG.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processImageForKling } from './server/utils/image-processor.js';

// Configurar el __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a un archivo de imagen para pruebas (puede ser JPEG, PNG, etc.)
const TEST_IMAGE_PATH = path.join(__dirname, './attached_assets/IMG_1551.jpeg');

async function runTest() {
  console.log('🧪 Iniciando prueba del procesador de imágenes...');
  console.log(`📁 Usando imagen de prueba: ${TEST_IMAGE_PATH}`);

  try {
    // Leer la imagen como un Buffer
    console.log('📤 Leyendo archivo de imagen...');
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    
    // Convertir a base64
    console.log('🔄 Convirtiendo a base64...');
    const base64Image = imageBuffer.toString('base64');
    
    // Crear data URL en formato similar al que recibiría desde el frontend
    const mimeType = 'image/jpeg'; // Asumimos JPEG pero el procesador debe verificar y convertir si es necesario
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log('✅ Data URL creada correctamente');
    console.log(`📊 Longitud de data URL: ${dataUrl.length} caracteres`);
    
    // Procesar la imagen con nuestro módulo mejorado
    console.log('\n🔍 Procesando imagen con processImageForKling...');
    const result = await processImageForKling(dataUrl);
    
    // Verificar resultado
    console.log('\n📋 Resultado del procesamiento:');
    console.log(`🔹 isValid: ${result.isValid}`);
    console.log(`🔹 width: ${result.width}`);
    console.log(`🔹 height: ${result.height}`);
    console.log(`🔹 originalFormat: ${result.originalFormat}`);
    console.log(`🔹 sizeInMB: ${result.sizeInMB ? result.sizeInMB.toFixed(2) + ' MB' : 'N/A'}`);
    
    if (!result.isValid) {
      console.error(`❌ Error: ${result.errorMessage}`);
      return;
    }
    
    // Guardar la imagen procesada para verificación visual
    if (result.processedImage) {
      console.log('\n💾 Guardando imagen procesada para verificación...');
      
      // Extraer la parte base64 de la URL de datos
      const processedBase64 = result.processedImage.split(',')[1];
      const processedBuffer = Buffer.from(processedBase64, 'base64');
      
      // Guardar en un archivo para verificación
      const outputPath = './processed-test-image.jpg';
      fs.writeFileSync(outputPath, processedBuffer);
      
      console.log(`✅ Imagen procesada guardada en: ${outputPath}`);
    }
    
    console.log('\n🎉 Prueba completada exitosamente!');
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
runTest();