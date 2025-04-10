// Script para generar una versión optimizada para producción
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Iniciando compilación para producción...');

// Asegurarse de que exista la carpeta dist
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.mkdirSync(path.join(__dirname, 'dist'));
}

// Paso 1: Compilar la aplicación React
console.log('🔨 Compilando aplicación React (cliente)...');
const clientBuild = exec('cd client && npm run build');

clientBuild.stdout.on('data', (data) => {
  console.log(`[Client Build]: ${data.trim()}`);
});

clientBuild.stderr.on('data', (data) => {
  console.error(`[Client Build Error]: ${data.trim()}`);
});

clientBuild.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Compilación del cliente exitosa');
    
    // Copiar los archivos compilados a la carpeta dist
    console.log('📂 Copiando archivos compilados a dist/client...');
    if (!fs.existsSync(path.join(__dirname, 'dist', 'client'))) {
      fs.mkdirSync(path.join(__dirname, 'dist', 'client'), { recursive: true });
    }
    
    copyFolderSync(
      path.join(__dirname, 'client', 'dist'),
      path.join(__dirname, 'dist', 'client')
    );
    
    // Crear un archivo server.js para producción en dist
    console.log('📝 Creando archivo server.js para producción...');
    const serverContent = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Servir archivos estáticos desde client/dist (aplicación compilada)
app.use(express.static(path.join(__dirname, 'client')));

// Para cualquier ruta no encontrada, servir el archivo index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Servidor de producción iniciado en http://0.0.0.0:\${PORT}\`);
});
`;
    
    fs.writeFileSync(path.join(__dirname, 'dist', 'server.js'), serverContent);
    
    console.log('🎉 Compilación completada con éxito. Los archivos están en la carpeta dist/');
    console.log('Para iniciar el servidor en producción ejecute: node dist/server.js');
  } else {
    console.error(`❌ Error en la compilación del cliente. Código: ${code}`);
    process.exit(1);
  }
});

// Función auxiliar para copiar carpetas de forma recursiva
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  
  const files = fs.readdirSync(from);
  
  files.forEach(file => {
    const currentPath = path.join(from, file);
    const targetPath = path.join(to, file);
    
    if (fs.lstatSync(currentPath).isDirectory()) {
      copyFolderSync(currentPath, targetPath);
    } else {
      fs.copyFileSync(currentPath, targetPath);
    }
  });
}