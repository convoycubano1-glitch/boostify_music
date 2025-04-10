// Script para ejecutar el build en segundo plano
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 INICIANDO CONSTRUCCIÓN COMPLETA EN SEGUNDO PLANO...');
console.log('⚠️ Este proceso continuará incluso si cierras esta ventana');
console.log('⚠️ No interrumpas el proceso de Replit hasta que termine');
console.log('');

// Limpiar carpeta dist existente
if (fs.existsSync(path.join(__dirname, 'client', 'dist'))) {
  console.log('🗑️ Eliminando carpeta client/dist existente...');
  fs.rmSync(path.join(__dirname, 'client', 'dist'), { recursive: true, force: true });
}

// Asegurarse de que exista la carpeta client/dist
fs.mkdirSync(path.join(__dirname, 'client', 'dist'), { recursive: true });

// Crear un comando que redireccione la salida a un archivo
const buildCommand = 'cd client && npx vite build > ../build.log 2> ../build-error.log &';

// Ejecutar el build en segundo plano
console.log('🔨 Compilando aplicación React en segundo plano...');
console.log('📝 El progreso se registrará en: build.log');
console.log('❌ Los errores se registrarán en: build-error.log');
console.log('');

// Spawn con shell permitirá la redirección adecuada en el comando
spawn(buildCommand, {
  shell: true,
  detached: true, // Esto permite que el proceso continúe incluso si el proceso padre termina
  stdio: 'ignore' // Ignorar todas las E/S para permitir que se ejecute completamente desconectado
});

// Crear un archivo para indicar que se está ejecutando el build
fs.writeFileSync(path.join(__dirname, 'build-in-progress.txt'), 
  `Build iniciado: ${new Date().toISOString()}\n` +
  `Este archivo se eliminará cuando el build se complete.\n`
);

// Crear un archivo con instrucciones para actualizar start.js
fs.writeFileSync(path.join(__dirname, 'update-start-after-build.js'), `
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
  const startJsContent = \`// Archivo principal para iniciar el servidor de producción
console.log('Iniciando servidor en modo producción...');

// Importar y ejecutar el servidor de producción que sirve los archivos compilados
import './production-server.js';\`;
  
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
`);

console.log('✅ Proceso de build iniciado en segundo plano');
console.log('');
console.log('Para verificar el estado del build, ejecuta:');
console.log('> tail -f build.log');
console.log('');
console.log('Para verificar errores, ejecuta:');
console.log('> tail -f build-error.log');
console.log('');
console.log('Para actualizar start.js cuando el build esté completo, ejecuta:');
console.log('> node update-start-after-build.js');
console.log('');
console.log('El build continuará en segundo plano incluso si cierras esta ventana.');