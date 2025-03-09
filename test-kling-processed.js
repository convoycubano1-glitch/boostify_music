/**
 * Script para probar la API de Kling con imágenes procesadas adecuadamente
 * 
 * Este script utiliza el endpoint de procesamiento de imagen del servidor para
 * asegurar que las imágenes cumplan con los requisitos de la API de Kling
 */

import fs from 'fs';
import axios from 'axios';

// Puerto local del servidor Express
const API_URL = 'http://localhost:5000';

// Usar directamente la clave API proporcionada por el usuario
const PIAPI_API_KEY = "234e9e9975bf40fda7751c9c7855d87b0a4e33fb9f179943a12b08acb1bd4fde";
// URL directa de la API de Kling
const KLING_API_URL = 'https://api.piapi.ai/api/v1/task';

// Rutas de las imágenes
const modelImagePath = './attached_assets/IMG_1551.jpeg';
const clothingImagePath = './attached_assets/IMG_2482.jpeg';

/**
 * Convierte un archivo de imagen a data URL
 */
function imageToDataUrl(filePath) {
  const fileData = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${fileData.toString('base64')}`;
}

/**
 * Procesa una imagen para asegurar compatibilidad con Kling API
 * Usa el endpoint del servidor en lugar de la lógica local
 */
async function processImage(imageDataUrl) {
  try {
    console.log('Procesando imagen para compatibilidad con Kling API...');
    const response = await axios.post(`${API_URL}/api/kling/process-image`, {
      imageDataUrl
    });
    
    if (response.data.isValid) {
      console.log('✅ Imagen procesada correctamente');
      return response.data.processedImage || response.data.normalizedUrl;
    } else {
      throw new Error(response.data.errorMessage || 'Error desconocido al procesar imagen');
    }
  } catch (error) {
    console.error('❌ Error al procesar imagen:', error.message);
    throw error;
  }
}

/**
 * Prueba la API de Kling con imágenes procesadas correctamente
 */
async function testKlingWithProcessedImages() {
  try {
    console.log('✅ Iniciando prueba con imágenes procesadas correctamente');
    console.log(`Clave API: ${PIAPI_API_KEY.substring(0, 4)}...${PIAPI_API_KEY.substring(PIAPI_API_KEY.length - 4)}`);
    
    // Convertir imágenes a data URLs
    console.log('Convirtiendo imágenes a data URLs...');
    const modelDataUrl = imageToDataUrl(modelImagePath);
    const clothingDataUrl = imageToDataUrl(clothingImagePath);
    
    // Procesar imágenes para compatibilidad con Kling API
    console.log('Procesando imagen del modelo...');
    const processedModelImage = await processImage(modelDataUrl);
    
    console.log('Procesando imagen de la prenda...');
    const processedClothingImage = await processImage(clothingDataUrl);
    
    // Preparar la solicitud para la API de Kling
    const requestData = {
      model: 'kling',
      task_type: 'ai_try_on', // Usar el valor correcto verificado mediante pruebas
      input: {
        model_input: processedModelImage,
        dress_input: processedClothingImage,
        batch_size: 1
      }
    };
    
    // Enviar solicitud a la API de Kling
    console.log('Enviando solicitud a la API de Kling con imágenes procesadas...');
    const response = await axios.post(KLING_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });
    
    console.log('Respuesta recibida:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar respuesta
    const taskId = response.data?.data?.task_id || response.data?.task_id;
    
    if (taskId) {
      console.log(`✅ Solicitud aceptada por la API de Kling (Task ID: ${taskId})`);
      
      // Esperar unos segundos antes de verificar el estado
      console.log('Esperando 5 segundos para verificar el estado...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verificar estado
      console.log(`Verificando estado de la tarea ${taskId}...`);
      const statusResponse = await axios.get(`${KLING_API_URL}/${taskId}`, {
        headers: {
          'x-api-key': PIAPI_API_KEY
        }
      });
      
      console.log('Estado de la tarea:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
    } else {
      console.error('❌ No se pudo obtener un Task ID válido de la respuesta');
    }
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('Detalles de error en respuesta:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testKlingWithProcessedImages();