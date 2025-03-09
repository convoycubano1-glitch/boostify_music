/**
 * Script simple para probar la integración con Kling API
 * 
 * Este script envía una solicitud a la API de Kling usando imágenes reales
 * y verifica que la autenticación funcione correctamente.
 */

import fs from 'fs';
import axios from 'axios';

// Usar directamente la clave API proporcionada por el usuario
const PIAPI_API_KEY = "234e9e9975bf40fda7751c9c7855d87b0a4e33fb9f179943a12b08acb1bd4fde";

console.log('✅ Usando clave API proporcionada directamente');
// Mostrar solo los primeros y últimos 4 caracteres por seguridad
const keyLength = PIAPI_API_KEY.length;
const maskedKey = PIAPI_API_KEY.substring(0, 4) + '...' + PIAPI_API_KEY.substring(keyLength - 4);
console.log(`Clave API: ${maskedKey} (longitud: ${keyLength})`);

// Función para convertir una imagen a base64
function imageToBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${fileData.toString('base64')}`;
}

// Rutas de las imágenes
const modelImagePath = './attached_assets/IMG_1551.jpeg';
const clothingImagePath = './attached_assets/IMG_2482.jpeg';

// Función principal
async function testKlingAPI() {
  try {
    // Convertir imágenes a base64
    console.log('Preparando imágenes...');
    const modelImageBase64 = imageToBase64(modelImagePath);
    const clothingImageBase64 = imageToBase64(clothingImagePath);

    console.log('Enviando solicitud a la API de Kling...');
    
    // Enviar solicitud directamente a la API de Kling
    const response = await axios.post('https://api.piapi.ai/api/v1/task', {
      model: 'kling',
      task_type: 'ai_try_on', // Valor correcto verificado mediante pruebas directas con la API
      input: {
        model_input: modelImageBase64,
        dress_input: clothingImageBase64,
        batch_size: 1
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });

    console.log('Respuesta recibida:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar que la respuesta sea exitosa (maneja ambos formatos de respuesta)
    if (response.data.code === 200 && response.data.message === 'success' && response.data.data?.task_id) {
      // Formato de respuesta anidado con { code, message, data }
      console.log('✅ La prueba fue exitosa. La autenticación con la API de Kling está funcionando correctamente.');
      console.log(`ID de tarea: ${response.data.data.task_id}`);
      console.log(`Estado inicial: ${response.data.data.status}`);
      console.log(`Tipo de tarea confirmado: ${response.data.data.task_type}`);
    } else if (response.data.success && response.data.taskId) {
      // Formato de respuesta directo { success, taskId }
      console.log('✅ La prueba fue exitosa. La autenticación con la API de Kling está funcionando correctamente.');
      console.log(`ID de tarea: ${response.data.taskId}`);
    } else {
      console.log('❌ La prueba falló. La API de Kling respondió con un error:');
      console.log(response.data.error || response.data.message || 'Error desconocido');
    }
  } catch (error) {
    console.error('❌ Error al probar la API de Kling:');
    if (error.response) {
      // Proporcionar un mensaje específico para el error de autenticación
      if (error.response.data && error.response.data.message === 'Invalid API key') {
        console.error('Error de autenticación: La clave API proporcionada no es válida.');
        console.error('Por favor, asegúrese de que:');
        console.error('  1. La clave API es correcta y está actualizada');
        console.error('  2. La clave tiene permisos para acceder a la API de Kling/PiAPI');
        console.error('  3. La clave no ha expirado');
      } else {
        console.error('Respuesta de error:', error.response.data);
      }
    } else {
      console.error(error.message);
    }
  }
}

// Ejecutar la prueba
testKlingAPI();