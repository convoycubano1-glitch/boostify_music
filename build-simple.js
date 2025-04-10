// Script simplificado para construir la aplicación React
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Iniciando construcción simplificada...');

// Eliminar carpetas existentes
if (fs.existsSync(path.join(__dirname, 'client', 'dist'))) {
  console.log('🗑️ Eliminando carpeta client/dist existente...');
  fs.rmSync(path.join(__dirname, 'client', 'dist'), { recursive: true, force: true });
}

// Asegurarse de que exista la carpeta client/dist
fs.mkdirSync(path.join(__dirname, 'client', 'dist'), { recursive: true });

// Construir el proyecto usando Vite
console.log('🔨 Compilando aplicación React con Vite...');
const buildProcess = exec('cd client && npx vite build', {
  env: { ...process.env, NODE_ENV: 'production' }
});

buildProcess.stdout.on('data', (data) => {
  console.log(`[Build]: ${data.trim()}`);
});

buildProcess.stderr.on('data', (data) => {
  console.error(`[Build Error]: ${data.trim()}`);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Construcción completada con éxito');
    console.log('📂 Archivos generados en client/dist');
    
    // Crear el archivo de servidor simple para producción
    const serverContent = `
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Carpeta donde están los archivos compilados
const distPath = join(__dirname, 'client', 'dist');

// Servir archivos estáticos
app.use(express.static(distPath));

// Para cualquier ruta no encontrada, servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Servidor de producción iniciado en http://0.0.0.0:\${PORT}\`);
  console.log(\`📂 Sirviendo archivos desde: \${distPath}\`);
});`;
    
    const productionServerPath = path.join(__dirname, 'production-server.js');
    fs.writeFileSync(productionServerPath, serverContent);
    console.log(`✅ Archivo del servidor de producción creado en ${productionServerPath}`);
    console.log('Para iniciar el servidor en producción, ejecute: node production-server.js');
  } else {
    console.error(`❌ Error en la construcción. Código: ${code}`);
    process.exit(1);
  }
});