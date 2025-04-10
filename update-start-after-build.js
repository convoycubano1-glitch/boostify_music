
// Ejecutar este script para actualizar start.js cuando el build esté completo
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Verificar si existe la carpeta dist con archivos
const distPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(distPath) && fs.readdirSync(distPath).length > 0) {
  console.log('✅ Build completado. Actualizando start.js para modo producción');
  
  // Actualizar start.js
  const startJsContent = `// Archivo principal para iniciar el servidor de producción
console.log('Iniciando servidor en modo producción...');

// Importar y ejecutar el servidor de producción que sirve los archivos compilados
import './production-server.js';`;
  
  fs.writeFileSync(path.join(__dirname, 'start.js'), startJsContent);
  
  // Eliminar archivo de progreso
  if (fs.existsSync(path.join(__dirname, 'build-in-progress.txt'))) {
    fs.unlinkSync(path.join(__dirname, 'build-in-progress.txt'));
  }
  
  console.log('✅ Configuración actualizada para usar la versión de producción');
  console.log('🚀 Reinicia el servidor para iniciar en modo producción');
} else {
  console.log('⚠️ El build aún no ha terminado o no generó archivos');
  console.log('📝 Verifica el progreso en los archivos build.log y build-error.log');
}
