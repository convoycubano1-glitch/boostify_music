/**
 * Script para probar la corrección de tablas Huffman mejorada
 * 
 * Este script verifica si el procesador de imágenes corrige correctamente
 * los problemas de tablas Huffman no inicializadas en imágenes JPEG.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Promisify para uso de async/await
const readFile = fs.promises.readFile;
const writeFile = fs.promises.writeFile;

/**
 * Convierte un archivo de imagen a base64
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<string>} - String base64 del archivo
 */
async function imageToBase64(filePath) {
  try {
    const data = await readFile(filePath);
    return data.toString('base64');
  } catch (error) {
    console.error(`Error al leer archivo ${filePath}:`, error);
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
    // Usar la URL correcta con el puerto de la aplicación
    const response = await axios.post('http://localhost:5000/api/kling/process-image', {
      imageDataUrl
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error al procesar imagen:');
    if (error.response?.data) {
      console.error('Respuesta del servidor:', error.response.data);
    } else if (error.message) {
      console.error('Mensaje de error:', error.message);
    } else {
      console.error('Error desconocido');
    }
    throw error;
  }
}

/**
 * Función principal para probar la corrección de tablas Huffman
 */
async function testHuffmanFix() {
  try {
    // Prueba con una imagen JPEG sin tablas Huffman (problematica)
    const badImagePath = path.join(__dirname, './bad-huffman-test.jpeg');
    console.log(`Procesando imagen problemática: ${badImagePath}`);
    
    // Convertir a base64
    const base64Image = await imageToBase64(badImagePath);
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    // Procesar la imagen
    console.log('Enviando imagen al procesador...');
    const result = await processImage(imageDataUrl);
    
    console.log('\n🔍 Resultado del procesamiento:');
    console.log(JSON.stringify(result, null, 2));
    
    // En nuestro caso el resultado tiene una estructura diferente
    // Verificamos las posibles estructuras de respuesta
    if (result.success && (result.processedImage || result.normalizedUrl)) {
      // Extraer la imagen procesada
      const processedImageUrl = result.processedImage || result.normalizedUrl;
      const processedBase64 = processedImageUrl.split(',')[1];
      const processedImagePath = path.join(__dirname, './processed-huffman-fixed.jpeg');
      
      await writeFile(processedImagePath, Buffer.from(processedBase64, 'base64'));
      console.log(`\n✅ Imagen procesada guardada como: ${processedImagePath}`);
      console.log(`   Dimensiones: ${result.width}x${result.height}`);
      console.log(`   Formato original: ${result.originalFormat}`);
      console.log(`   Tamaño: ${result.sizeInMB.toFixed(2)}MB`);
      
      // Procesamiento exitoso
      return true;
    } else {
      // Verificar diferentes estructuras de error
      const errorMessage = result.error || result.errorMessage || 'Causa desconocida';
      console.log(`\n❌ El procesamiento no fue exitoso: ${errorMessage}`);
      return false;
    }
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testHuffmanFix();