// Script para construir la aplicación completamente sin interrupciones
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 INICIANDO CONSTRUCCIÓN COMPLETA DE LA APLICACIÓN...');
console.log('⚠️ Este proceso tomará mucho tiempo (puede ser más de 15 minutos)');
console.log('⚠️ Por favor, NO INTERRUMPIR bajo ninguna circunstancia...');
console.log('');

try {
  // Limpiar carpeta dist existente
  if (fs.existsSync(path.join(__dirname, 'client', 'dist'))) {
    console.log('🗑️ Eliminando carpeta client/dist existente...');
    fs.rmSync(path.join(__dirname, 'client', 'dist'), { recursive: true, force: true });
  }

  // Asegurarse de que exista la carpeta client/dist
  fs.mkdirSync(path.join(__dirname, 'client', 'dist'), { recursive: true });

  // Construir el proyecto usando el comando npm run build con tiempo de espera extendido
  console.log('🔨 Compilando aplicación React (build completo)...');
  console.log('📢 ESTE PROCESO TOMARÁ MUCHO TIEMPO. Por favor, espere hasta que termine...');
  console.log('📢 No se mostrará progreso en tiempo real para evitar interrupciones.');
  console.log('');
  
  // Usamos execSync con un tiempo de espera muy largo (3 horas)
  // y heredamos la salida estándar/error para ver el progreso
  execSync('cd client && npx vite build', {
    stdio: 'inherit',
    timeout: 10800000 // 3 horas en milisegundos
  });
  
  console.log('');
  console.log('✅ CONSTRUCCIÓN COMPLETADA CON ÉXITO');
  console.log('📂 Archivos generados en client/dist');
  
  // Modificar el archivo start.js para usar production-server.js
  try {
    const startJsContent = `// Archivo principal para iniciar el servidor de producción
console.log('Iniciando servidor en modo producción...');

// Importar y ejecutar el servidor de producción que sirve los archivos compilados
import './production-server.js';`;
    
    fs.writeFileSync(path.join(__dirname, 'start.js'), startJsContent);
    console.log('✅ Archivo start.js actualizado para usar el servidor de producción');
  } catch (error) {
    console.error('❌ Error al actualizar start.js:', error.message);
  }
  
  console.log('');
  console.log('🎉 PROCESO COMPLETADO. Reinicie el servidor para ver la versión de producción.');
  console.log('Para reiniciar el servidor en modo producción, ejecute:');
  console.log('> npm start');
  
} catch (error) {
  console.error('❌ Error en la construcción:');
  console.error(error.message);
  console.error('');
  console.error('Si el proceso se interrumpió por tiempo, puede intentar nuevamente');
  console.error('o ajustar el tiempo de espera en el script build-completo.js');
}