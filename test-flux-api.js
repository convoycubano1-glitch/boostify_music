/**
 * Script para probar la integración con Flux API
 * 
 * Este script realiza una prueba simple de la generación de imágenes
 * utilizando la API de Flux a través de PiAPI.
 */

import axios from 'axios';

// Función para generar una imagen con Flux API
async function testFluxAPI() {
  try {
    console.log('Iniciando prueba de Flux API...');
    
    // 1. Generar una imagen
    console.log('Paso 1: Generando imagen...');
    const generateResponse = await axios.post('http://localhost:5000/api/flux/generate-image', {
      prompt: 'Un hermoso paisaje de montañas con un lago al atardecer, estilo fotográfico realista',
      negativePrompt: 'baja calidad, distorsionado, texto, marca de agua',
      steps: 28,
      guidance_scale: 2.5,
      width: 1024,
      height: 576,
      model: 'Qubico/flux1-dev',
      taskType: 'txt2img'
    });
    
    console.log('Respuesta de generación:', JSON.stringify(generateResponse.data, null, 2));
    
    // Verificar que recibimos un ID de tarea
    if (!generateResponse.data || !generateResponse.data.task_id) {
      throw new Error('No se recibió un ID de tarea válido');
    }
    
    const taskId = generateResponse.data.task_id;
    console.log(`Tarea iniciada con ID: ${taskId}`);
    
    // 2. Verificar el estado de la tarea
    console.log('\nPaso 2: Verificando estado de la tarea...');
    
    // Función para verificar el estado
    async function checkStatus() {
      const statusResponse = await axios.get(`http://localhost:5000/api/flux/status?taskId=${taskId}`);
      console.log('Respuesta completa del estado:', JSON.stringify(statusResponse.data, null, 2));
      
      // La respuesta puede venir en diferentes estructuras, necesitamos normalizarla
      let taskStatus;
      let outputData;
      
      // Formato 1: Directamente en el nivel superior
      if (statusResponse.data.status) {
        taskStatus = statusResponse.data.status;
        outputData = statusResponse.data.output;
      } 
      // Formato 2: Anidado en data (respuesta de PiAPI)
      else if (statusResponse.data.data && statusResponse.data.data.status) {
        taskStatus = statusResponse.data.data.status;
        outputData = statusResponse.data.data.output;
      }
      else {
        console.warn('No se pudo determinar el estado de la tarea:', statusResponse.data);
        return false;
      }
      
      console.log('Estado actual:', taskStatus);
      
      if (taskStatus === 'completed') {
        console.log('¡Éxito! Imagen generada correctamente.');
        
        // Extraer URL de imagen - puede estar en diferentes formatos
        let imageUrl = null;
        if (outputData) {
          if (outputData.images && outputData.images.length > 0) {
            imageUrl = outputData.images[0];
            console.log('URL de imagen encontrada en output.images:', imageUrl);
          } else if (outputData.image) {
            imageUrl = outputData.image;
            console.log('URL de imagen encontrada en output.image:', imageUrl);
          } else if (outputData.image_url) {
            imageUrl = outputData.image_url;
            console.log('URL de imagen encontrada en output.image_url:', imageUrl);
          }
        }
        
        if (imageUrl) {
          console.log('URL de imagen generada:');
          console.log(imageUrl);
        } else {
          console.warn('No se encontró URL de imagen en la respuesta, pero la tarea está completa');
          console.log('Datos de output completos:', outputData);
        }
        
        return true;
      }
      
      if (taskStatus === 'failed') {
        let errorInfo = 'Error desconocido';
        // Intentar obtener información de error de cualquiera de los posibles lugares donde podría estar
        if (statusResponse.data.error) {
          errorInfo = JSON.stringify(statusResponse.data.error);
        } else if (statusResponse.data.data && statusResponse.data.data.error) {
          errorInfo = JSON.stringify(statusResponse.data.data.error);
        }
        throw new Error(`La tarea falló: ${errorInfo}`);
      }
      
      return false;
    }
    
    // Intentar verificar el estado hasta 5 veces, con 3 segundos entre cada intento
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(`Intento ${attempt + 1}/${maxAttempts}...`);
      
      try {
        const completed = await checkStatus();
        if (completed) break;
        
        // Si no está completado, esperar antes del siguiente intento
        if (attempt < maxAttempts - 1) {
          console.log('Esperando 3 segundos...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        console.error('Error verificando estado:', error.message);
        throw error;
      }
    }
    
    console.log('\nPrueba completada.');
    
  } catch (error) {
    console.error('Error en la prueba:', error);
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Ejecutar la prueba
testFluxAPI().then(() => {
  console.log('Script finalizado.');
}).catch(error => {
  console.error('Error general:', error);
});

// Para compatibilidad con ES modules
export { testFluxAPI };