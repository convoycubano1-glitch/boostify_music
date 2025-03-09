/**
 * Script para verificar errores en los archivos de componentes de Flux
 */

import * as fs from 'fs';
import * as path from 'path';

// Archivos a verificar
const filesToCheck = [
  'client/src/lib/api/flux/flux-local-storage-service.ts',
  'client/src/lib/types/model-types.ts',
  'client/src/components/image-generation/sections/flux-upload-section.tsx',
  'client/src/components/image-generation/sections/flux-style-section.tsx'
];

// Comprobación básica de archivos
filesToCheck.forEach(filePath => {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`✅ Archivo ${filePath} existe y tiene contenido.`);
      
      // Verificar exportaciones
      if (filePath.includes('flux-local-storage-service')) {
        if (!content.includes('export const fluxLocalStorageService')) {
          console.error(`❌ Error: No se encontró la exportación fluxLocalStorageService en ${filePath}`);
        } else {
          console.log(`✅ Exportación fluxLocalStorageService verificada.`);
        }
      }
      
      if (filePath.includes('model-types')) {
        if (!content.includes('export interface ImageResult')) {
          console.error(`❌ Error: No se encontró la exportación ImageResult en ${filePath}`);
        } else {
          console.log(`✅ Exportación ImageResult verificada.`);
        }
      }
      
      if (filePath.includes('flux-upload-section')) {
        if (!content.includes('export function FluxUploadSection')) {
          console.error(`❌ Error: No se encontró la exportación FluxUploadSection en ${filePath}`);
        } else {
          console.log(`✅ Exportación FluxUploadSection verificada.`);
        }
      }
      
      if (filePath.includes('flux-style-section')) {
        if (!content.includes('export function FluxStyleSection')) {
          console.error(`❌ Error: No se encontró la exportación FluxStyleSection en ${filePath}`);
        } else {
          console.log(`✅ Exportación FluxStyleSection verificada.`);
        }
      }
    } else {
      console.error(`❌ Error: El archivo ${filePath} no existe.`);
    }
  } catch (error) {
    console.error(`❌ Error al verificar ${filePath}:`, error.message);
  }
});

// Verificar si flux-service.ts existe
const fluxServicePath = 'client/src/lib/api/flux/flux-service.ts';
if (fs.existsSync(fluxServicePath)) {
  console.log(`✅ Archivo ${fluxServicePath} existe.`);
} else {
  console.error(`❌ Error: El archivo ${fluxServicePath} no existe. Es necesario para los componentes de Flux.`);
}

console.log('\nVerificación completada ✨');