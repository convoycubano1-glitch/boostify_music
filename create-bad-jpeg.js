/**
 * Script para crear una imagen JPEG deliberadamente malformada (sin tablas Huffman)
 * para probar nuestra capacidad de corrección.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar el __dirname equivalente para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Crea una imagen JPEG malformada eliminando deliberadamente las tablas Huffman
 * y corrompiendo secuencias 0xFF00 necesarias para la decodificación
 * @param {Buffer} imageBuffer - Buffer de la imagen JPEG original
 * @returns {Buffer} - Imagen malformada
 */
function createBadJpeg(imageBuffer) {
  console.log(`🔍 Analizando imagen original: ${imageBuffer.length} bytes`);
  
  // Verificamos que es un JPEG válido
  if (imageBuffer[0] !== 0xFF || imageBuffer[1] !== 0xD8) {
    console.error('❌ No es una imagen JPEG válida');
    return imageBuffer;
  }
  
  // Buscamos todas las tablas Huffman (DHT marker = 0xFF 0xC4)
  const markers = [];
  
  for (let i = 0; i < imageBuffer.length - 4; i++) {
    if (imageBuffer[i] === 0xFF && imageBuffer[i + 1] === 0xC4) {
      const segmentLength = (imageBuffer[i + 2] << 8) + imageBuffer[i + 3];
      const markerEnd = i + 2 + segmentLength;
      
      markers.push({
        start: i,
        end: markerEnd,
        length: segmentLength
      });
      
      console.log(`✅ Tabla Huffman (DHT) encontrada en posición ${i}, longitud ${segmentLength}`);
    }
  }
  
  if (markers.length === 0) {
    console.log('⚠️ No se encontraron tablas Huffman en la imagen');
    return imageBuffer;
  }
  
  console.log(`🔍 Encontradas ${markers.length} tablas Huffman para eliminar`);
  
  // Eliminamos todas las tablas Huffman
  let result = Buffer.from(imageBuffer);
  
  // Nota: Debemos eliminar desde el último marcador hacia atrás
  // para evitar que cambien las posiciones
  markers.reverse().forEach((marker, idx) => {
    const part1 = result.slice(0, marker.start);
    const part2 = result.slice(marker.end);
    result = Buffer.concat([part1, part2]);
    console.log(`✅ Eliminada tabla Huffman #${markers.length - idx}: ${marker.length + 2} bytes`);
  });
  
  console.log(`✅ Imagen sin tablas Huffman: ${result.length} bytes (eliminados ${imageBuffer.length - result.length} bytes)`);
  
  // Buscar y corromper también secuencias 0xFF00 para crear una imagen aún más defectuosa
  // Estas secuencias son cruciales para la decodificación JPEG
  const ff00Positions = [];
  
  // Buscar todas las secuencias 0xFF00
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i] === 0xFF && result[i + 1] === 0x00) {
      ff00Positions.push(i);
      console.log(`🔍 Secuencia 0xFF00 encontrada en posición ${i}`);
    }
  }
  
  console.log(`🔍 Encontradas ${ff00Positions.length} secuencias 0xFF00 para corromper`);
  
  // Si hay secuencias 0xFF00, modificarlas para romper la estructura JPEG
  if (ff00Positions.length > 0) {
    // Creamos una copia para modificar
    const resultWithoutFF00 = Buffer.from(result);
    
    // Modificamos las secuencias 0xFF00 cambiando el 0x00 por 0x01 (valor inválido)
    // Esto romperá la secuencia sin cambiar el tamaño del archivo
    ff00Positions.forEach(pos => {
      resultWithoutFF00[pos + 1] = 0x01; // Cambiar 0x00 por 0x01
      console.log(`✅ Modificada secuencia 0xFF00 en posición ${pos} a 0xFF01`);
    });
    
    console.log(`✅ Imagen doblemente malformada creada: ${resultWithoutFF00.length} bytes (sin tablas Huffman ni secuencias FF00)`);
    return resultWithoutFF00;
  }
  
  console.log(`⚠️ No se encontraron secuencias 0xFF00 para modificar`);
  return result;
}

// Función principal
async function main() {
  try {
    // Ruta a una imagen JPEG conocida
    const originalPath = path.join(__dirname, './attached_assets/IMG_1551.jpeg');
    console.log(`📂 Usando imagen original: ${originalPath}`);
    
    // Leer la imagen original
    const originalImage = fs.readFileSync(originalPath);
    
    // Crear versión malformada
    const badImage = createBadJpeg(originalImage);
    
    // Guardar imagen malformada
    const badImagePath = path.join(__dirname, './bad-huffman-test.jpeg');
    fs.writeFileSync(badImagePath, badImage);
    
    console.log(`🎉 Imagen malformada guardada en: ${badImagePath}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar script
main();