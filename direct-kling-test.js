/**
 * Prueba directa de la API de Kling sin usar el proxy
 * Este script envía una solicitud directamente a la API de Kling
 * para verificar si la clave API es válida.
 */

import axios from 'axios';

// Usar directamente la clave API proporcionada
const API_KEY = "234e9e9975bf40fda7751c9c7855d87b0a4e33fb9f179943a12b08acb1bd4fde";

async function testKlingAPI() {
  try {
    console.log('Enviando solicitud de prueba directa a la API de Kling...');
    
    // Enviar una solicitud simple para verificar que la clave API sea válida
    const response = await axios.post('https://api.piapi.ai/api/v1/task', {
      model: 'kling',
      task_type: 'ai_try_on', // Usamos el tipo correcto 'ai_try_on' (no 'ai_try')
      input: {
        // Valores mínimos requeridos para validar la clave API
        model_input: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVIP/2Q==",
        dress_input: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVIP/2Q==",
        batch_size: 1
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    console.log('✅ Respuesta de la API de Kling:');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la API de Kling:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Detalles de error:', JSON.stringify(error.response.data, null, 2));
      
      // Verificar si es un error de autenticación
      if (error.response.status === 401 || 
          (error.response.data && error.response.data.message === 'Invalid API key')) {
        console.error('\n⚠️ ERROR DE AUTENTICACIÓN: La clave API no es válida o ha expirado.');
      }
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Ejecutar la prueba
testKlingAPI().then(result => {
  if (result) {
    console.log('\n✅ La clave API es válida y funciona correctamente con la API de Kling.');
  } else {
    console.log('\n❌ Prueba fallida: La clave API no es válida o hay un problema con la API de Kling.');
  }
});