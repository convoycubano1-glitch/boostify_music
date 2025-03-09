/**
 * Script para probar el endpoint de Try-On con la nueva API key
 * 
 * Este script envía imágenes procesadas a la API de Kling para realizar
 * un intento de Virtual Try-On y verificar que todo funcione correctamente.
 */
import fs from 'fs';
import axios from 'axios';

// Función para convertir una imagen a Base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

// Función para procesar una imagen
async function processImage(imageDataUrl) {
  console.log('Procesando imagen para compatibilidad con Kling API...');
  
  const response = await axios.post('http://localhost:5000/api/kling/process-image', {
    imageDataUrl
  });
  
  if (response.data.success) {
    console.log(`✅ Procesamiento exitoso. Dimensiones: ${response.data.width}x${response.data.height}`);
    return response.data.processedImage;
  } else {
    throw new Error(`Error al procesar imagen: ${response.data.error}`);
  }
}

// Función para iniciar un Try-On
async function startTryOn(modelImage, clothingImage) {
  console.log('Iniciando proceso de Try-On...');
  
  const response = await axios.post('http://localhost:5000/api/kling/try-on/start', {
    model: "kling",
    task_type: "ai_try_on", // Parámetro verificado con pruebas
    input: {
      model_input: modelImage,
      dress_input: clothingImage,
      batch_size: 1
    }
  });
  
  return response.data;
}

// Función para verificar el estado de un Try-On
async function checkTryOnStatus(taskId) {
  console.log(`Verificando estado del Try-On (taskId: ${taskId})...`);
  
  const response = await axios.post('http://localhost:5000/api/kling/try-on/status', {
    taskId
  });
  
  return response.data;
}

// Función principal para ejecutar la prueba
async function runTest() {
  try {
    // Cargar y procesar imagen de modelo
    const modelImagePath = './attached_assets/IMG_1551.jpeg';
    const modelDataUrl = imageToBase64(modelImagePath);
    console.log('Imagen de modelo cargada. Procesando...');
    const processedModelImage = await processImage(modelDataUrl);
    
    // Cargar y procesar imagen de ropa
    const clothingImagePath = './attached_assets/IMG_2489.jpeg'; // Reemplazado con una imagen que cumple los requisitos
    const clothingDataUrl = imageToBase64(clothingImagePath);
    console.log('Imagen de ropa cargada. Procesando...');
    const processedClothingImage = await processImage(clothingDataUrl);
    
    // Iniciar el proceso de Try-On
    const startResult = await startTryOn(processedModelImage, processedClothingImage);
    console.log('Respuesta de inicio de Try-On:', JSON.stringify(startResult, null, 2));
    
    if (!startResult.success) {
      throw new Error(`Error al iniciar Try-On: ${startResult.errorMessage || 'Error desconocido'}`);
    }
    
    // Verificar estado inicial
    const taskId = startResult.taskId;
    let statusResult = await checkTryOnStatus(taskId);
    console.log('Estado inicial:', JSON.stringify(statusResult, null, 2));
    
    // Verificar el estado periódicamente (máximo 3 veces para esta prueba)
    for (let i = 0; i < 3; i++) {
      console.log(`Esperando 3 segundos antes de verificar estado (intento ${i + 1}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      statusResult = await checkTryOnStatus(taskId);
      console.log(`Estado (intento ${i + 1}/3):`, JSON.stringify(statusResult, null, 2));
      
      if (statusResult.status === 'completed' || statusResult.status === 'failed') {
        break;
      }
    }
    
    // Mostrar resultado final
    if (statusResult.status === 'completed') {
      console.log('✅ Try-On completado con éxito!');
      console.log('URL de resultado:', statusResult.url);
    } else if (statusResult.status === 'failed') {
      console.error('❌ Try-On fallido:', statusResult.errorMessage);
    } else {
      console.log('⏳ El proceso de Try-On sigue en curso. Verificar manualmente en la interfaz web.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar la prueba
runTest();