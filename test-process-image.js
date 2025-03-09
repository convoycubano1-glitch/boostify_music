/**
 * Script para probar el endpoint de procesamiento de imágenes
 * Este script envía una imagen a través del endpoint /api/kling/process-image
 * para verificar su correcto funcionamiento
 */
import fs from 'fs';
import axios from 'axios';

// Función para convertir una imagen a Base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

// Función principal para probar el endpoint de procesamiento
async function testProcessImage() {
  try {
    console.log('Iniciando prueba del endpoint de procesamiento de imágenes...');
    
    // Ruta de una imagen de prueba (usar una imagen de la carpeta attachments)
    const imagePath = './attached_assets/IMG_1551.jpeg';
    
    // Convertir la imagen a base64
    const imageDataUrl = imageToBase64(imagePath);
    console.log(`Imagen cargada y convertida a base64: ${imageDataUrl.substring(0, 50)}...`);
    
    // Enviar la solicitud al endpoint de procesamiento
    const response = await axios.post('http://localhost:5000/api/kling/process-image', {
      imageDataUrl
    });
    
    console.log('✅ Respuesta del servidor recibida:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ Procesamiento exitoso. Dimensiones:', 
        response.data.width, 'x', response.data.height);
      console.log('Formato original:', response.data.originalFormat);
      console.log('Tamaño en MB:', response.data.sizeInMB);
    } else {
      console.error('❌ Error en el procesamiento:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error al realizar la prueba:', error.message);
    
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testProcessImage();