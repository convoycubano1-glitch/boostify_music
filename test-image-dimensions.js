/**
 * Script para verificar las dimensiones de varias imágenes
 * usando nuestro propio endpoint de procesamiento de imágenes
 */
import fs from 'fs';
import axios from 'axios';

// Función para convertir una imagen a Base64
function imageToBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

// Función para verificar las dimensiones de una imagen
async function checkImageDimensions(imagePath) {
  try {
    const imageDataUrl = imageToBase64(imagePath);
    
    const response = await axios.post('http://localhost:5000/api/kling/process-image', {
      imageDataUrl
    });
    
    if (response.data.success) {
      console.log(`✅ ${imagePath}: ${response.data.width}x${response.data.height} px (${response.data.sizeInMB.toFixed(2)} MB)`);
      return {
        path: imagePath,
        width: response.data.width,
        height: response.data.height,
        sizeInMB: response.data.sizeInMB
      };
    } else {
      console.error(`❌ ${imagePath}: ${response.data.error}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error procesando ${imagePath}: ${error.message}`);
    return null;
  }
}

// Función principal
async function checkMultipleImages() {
  const imagePaths = [
    './attached_assets/IMG_1551.jpeg',
    './attached_assets/IMG_2482.jpeg',
    './attached_assets/IMG_2483.jpeg',
    './attached_assets/IMG_2489.jpeg',
    './attached_assets/IMG_2736.jpeg',
    './attached_assets/IMG_2756.jpeg',
    './attached_assets/IMG_2815.jpeg',
    './attached_assets/IMG_2822.jpeg'
  ];
  
  const results = [];
  
  console.log('Verificando dimensiones de imágenes...\n');
  
  for (const path of imagePaths) {
    const result = await checkImageDimensions(path);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\nImágenes adecuadas para Try-On (lado mínimo >= 512px):');
  const validImages = results.filter(img => Math.min(img.width, img.height) >= 512);
  
  validImages.forEach(img => {
    console.log(`- ${img.path}: ${img.width}x${img.height} px (${img.sizeInMB.toFixed(2)} MB)`);
  });
}

// Ejecutar
checkMultipleImages();