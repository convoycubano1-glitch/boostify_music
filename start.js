// Archivo principal para iniciar la aplicación
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determinar el modo de ejecución basado en variables de entorno
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

console.log(`🚀 Iniciando Boostify Music en modo: ${isProd ? 'PRODUCCIÓN' : 'DESARROLLO'}`);

// En producción usar un servidor que combine Express y Vite
// En desarrollo usar solo el servidor Express para pruebas rápidas
if (isProd) {
  console.log('📦 Usando configuración para producción con puerto 5173...');
  // Usar el servidor combinado que asegura que la plataforma use el puerto 5173
  import('./vite-start.js');
} else {
  console.log('🔧 Usando configuración para desarrollo...');
  // Usar el servidor Express simplificado
  import('./server-express.js');
}