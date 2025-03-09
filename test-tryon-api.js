/**
 * Script para probar el endpoint de Try-On con el task_type correcto
 * con comunicación directa a la API de Kling
 */

import fs from 'fs';
import axios from 'axios';

// Usar directamente la clave API proporcionada por el usuario
const PIAPI_API_KEY = "234e9e9975bf40fda7751c9c7855d87b0a4e33fb9f179943a12b08acb1bd4fde";
// URL directa de la API de Kling
const KLING_API_URL = 'https://api.piapi.ai/api/v1/task';

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
async function testDirectKlingAPI() {
  try {
    // Convertir imágenes a base64
    console.log('Preparando imágenes...');
    const modelImageBase64 = imageToBase64(modelImagePath);
    const clothingImageBase64 = imageToBase64(clothingImagePath);

    console.log('Enviando solicitud directamente a la API de Kling...');
    
    // Preparar la solicitud para la API de Kling
    const requestData = {
      model: 'kling',
      task_type: 'ai_try_on', // Usar el valor correcto verificado mediante pruebas
      input: {
        model_input: modelImageBase64,
        dress_input: clothingImageBase64,
        batch_size: 1
      }
    };
    
    // Enviar solicitud directamente a la API de Kling
    const response = await axios.post(KLING_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });

    console.log('Respuesta recibida de la API de Kling:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar la respuesta - Versión mejorada
    let taskId = null;
    let taskType = null;
    let status = null;
    
    // La respuesta puede tener diferentes estructuras
    if (response.data?.code === 200 && response.data?.data?.task_id) {
      // Nuevo formato de respuesta anidado
      taskId = response.data.data.task_id;
      taskType = response.data.data.task_type;
      status = response.data.data.status;
      console.log('✅ Solicitud exitosa (formato de respuesta anidado)');
    } else if (response.data?.task_id) {
      // Formato de respuesta antiguo directo
      taskId = response.data.task_id;
      taskType = response.data.task_type;
      status = response.data.status;
      console.log('✅ Solicitud exitosa (formato de respuesta directo)');
    }
    
    if (taskId) {
      console.log(`✅ La API de Kling aceptó la solicitud con task_type="${taskType}"`);
      console.log(`ID de tarea: ${taskId}`);
      console.log(`Estado inicial: ${status}`);
      
      // Verificar el estado de la tarea después de 5 segundos
      console.log('\nEsperando 5 segundos antes de verificar el estado...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Verificando estado de la tarea...');
      const statusResponse = await axios.get(`${KLING_API_URL}/${taskId}`, {
        headers: {
          'x-api-key': PIAPI_API_KEY
        }
      });
      
      console.log('Estado actual de la tarea:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
    } else {
      console.log('❌ No se pudo extraer un task_id válido de la respuesta.');
    }
  } catch (error) {
    console.error('❌ Error al probar la API de Kling:');
    if (error.response) {
      console.error('Error en la respuesta:', error.response.data);
      console.error('Código de estado:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar la prueba directa con la API de Kling
testDirectKlingAPI();