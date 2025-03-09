/**
 * Script para probar la corrección de secuencias 0xFF00 en imágenes JPEG
 * 
 * Este script verifica si el procesador de imágenes corrige correctamente
 * los problemas de secuencias 0xFF00 faltantes en imágenes JPEG.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Configurar el __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convierte un archivo de imagen a base64
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<string>} - String base64 del archivo
 */
async function imageToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error(`Error al convertir imagen a base64: ${error.message}`);
    throw error;
  }
}

/**
 * Procesa una imagen para asegurar compatibilidad con Kling API
 * @param {string} imageDataUrl - Data URL de la imagen
 * @returns {Promise<object>} - Resultado del procesamiento
 */
async function processImage(imageDataUrl) {
  try {
    const response = await axios.post('http://localhost:5000/api/kling/process-image', {
      imageDataUrl
    });
    return response.data;
  } catch (error) {
    console.error('Error al procesar imagen:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Función principal para probar la corrección de secuencias 0xFF00
 */
async function testFF00Fix() {
  try {
    console.log('📋 Prueba de corrección de secuencias 0xFF00 en imágenes JPEG');
    
    // 1. Usar la imagen JPEG malformada creada con create-bad-jpeg.js
    const badJpegPath = path.join(__dirname, 'bad-huffman-test.jpeg');
    console.log(`📂 Usando imagen malformada: ${badJpegPath}`);
    
    // 2. Convertir a base64
    const badJpegBase64 = await imageToBase64(badJpegPath);
    console.log('✅ Imagen convertida a base64');
    
    // 3. Procesar con nuestro endpoint
    console.log('📊 Procesando imagen malformada...');
    const processingResult = await processImage(badJpegBase64);
    
    // 4. Verificar resultado
    if (processingResult.success) {
      console.log('🎉 ¡Prueba exitosa! El procesador ha corregido la secuencia 0xFF00 faltante');
      console.log(`📏 Dimensiones: ${processingResult.width}x${processingResult.height}`);
      console.log(`📦 Tamaño: ${processingResult.sizeInMB.toFixed(2)}MB`);
      
      // 5. Guardar la imagen procesada para verificación visual
      const processedImageBase64 = processingResult.processedImage.split(',')[1];
      const processedImageBuffer = Buffer.from(processedImageBase64, 'base64');
      const processedImagePath = path.join(__dirname, 'processed-huffman-fixed.jpeg');
      fs.writeFileSync(processedImagePath, processedImageBuffer);
      console.log(`💾 Imagen procesada guardada en: ${processedImagePath}`);
    } else {
      console.error('❌ Prueba fallida: No se pudo corregir la imagen');
      console.error(`📋 Error: ${processingResult.error}`);
    }
  } catch (error) {
    console.error('❌ Error ejecutando la prueba:', error);
  }
}

// Ejecutar la prueba
testFF00Fix();