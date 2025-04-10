// Archivo principal para iniciar la aplicación
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determinar si estamos en modo producción basado en NODE_ENV o en la existencia del directorio dist
const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, 'dist'));

if (isProd) {
  console.log('📦 Iniciando aplicación en modo PRODUCCIÓN...');
  // En producción, usar el servidor que sirve archivos estáticos compilados
  import('./production-server.js');
} else {
  console.log('🔧 Iniciando aplicación en modo DESARROLLO...');
  // En desarrollo, usar el servidor Express que muestra la aplicación React simplificada
  import('./server-express.js');
}