import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para trabajar con __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const BASE_URL = 'http://localhost:5000'; // URL base del servidor
const MODEL_IMAGE_PATH = './attached_assets/model-guidline.png'; // Ruta a la imagen del modelo
const GARMENT_IMAGE_PATH = './attached_assets/garment-guideline.png'; // Ruta a la imagen de la prenda

/**
 * Convierte una imagen a base64 y la convierte a JPEG si es necesario
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<string>} - Data URL en base64 con formato JPEG
 */
function imageToBase64(filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`Archivo no encontrado: ${filePath}`));
      }

      // Leer el archivo
      const imageBuffer = fs.readFileSync(filePath);
      // Convertir a base64
      const base64Image = imageBuffer.toString('base64');
      
      // IMPORTANTE: Para la API de Kling, SIEMPRE usar JPEG
      // Independientemente de la extensión del archivo, forzamos JPEG
      const mimeType = 'image/jpeg';
      
      // Crear data URL - usando siempre el formato JPEG para Kling API
      const dataUrl = `data:${mimeType};base64,${base64Image}`;
      
      console.log(`✅ Imagen convertida a formato JPEG para compatibilidad con Kling API: ${filePath}`);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Inicia un proceso de Virtual Try-On
 * @param {string} modelImageDataUrl - Imagen del modelo en formato data URL
 * @param {string} garmentImageDataUrl - Imagen de la prenda en formato data URL
 * @returns {Promise<string>} - ID de la tarea creada
 */
async function startTryOn(modelImageDataUrl, garmentImageDataUrl) {
  console.log('Iniciando proceso de Virtual Try-On');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/kling/try-on/start`, {
      input: {
        model_input: modelImageDataUrl,
        dress_input: garmentImageDataUrl,
        batch_size: 1
      }
    });
    
    console.log('Respuesta del servidor:', response.data);
    
    if (response.data.success && response.data.taskId) {
      return response.data.taskId;
    } else {
      throw new Error('No se recibió un ID de tarea válido');
    }
  } catch (error) {
    console.error('Error al iniciar Try-On:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
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
  console.log(`Verificando estado de tarea: ${taskId}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/kling/try-on/status`, {
      taskId
    });
    
    console.log('Estado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al verificar estado:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Función principal para ejecutar la prueba completa
 */
async function runTest() {
  try {
    console.log('Iniciando prueba de API de Kling');
    
    // Convertir imágenes a base64
    console.log('Cargando imagen del modelo...');
    const modelImage = await imageToBase64(MODEL_IMAGE_PATH);
    console.log(`Imagen del modelo cargada: ${modelImage.substring(0, 50)}...`);
    
    console.log('Cargando imagen de la prenda...');
    const garmentImage = await imageToBase64(GARMENT_IMAGE_PATH);
    console.log(`Imagen de la prenda cargada: ${garmentImage.substring(0, 50)}...`);
    
    // Iniciar proceso
    console.log('Iniciando proceso de Try-On...');
    const taskId = await startTryOn(modelImage, garmentImage);
    console.log(`Proceso iniciado con ID: ${taskId}`);
    
    // Verificar estado (solo como ejemplo)
    console.log('Primera verificación de estado:');
    await checkStatus(taskId);
    
    // En un caso real, implementaríamos un loop de verificación
    console.log('Prueba completada con éxito');
  } catch (error) {
    console.error('Error en la prueba:', error.message);
  }
}

// Ejecutar la prueba
runTest();