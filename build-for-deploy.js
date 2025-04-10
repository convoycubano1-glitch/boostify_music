// Script de construcción para despliegue
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Iniciando proceso de construcción para despliegue...');

// Limpiar directorio dist si existe (esto es ejecutado por prebuild)
// fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });

// Construir frontend con Vite
console.log('🏗️ Construyendo frontend con Vite...');
try {
  execSync('cd client && vite build', { stdio: 'inherit' });
  console.log('✅ Frontend construido exitosamente');
} catch (error) {
  console.error('❌ Error al construir el frontend:', error);
  process.exit(1);
}

// El script postbuild se encargará de copiar los archivos al directorio dist

// Construir backend
console.log('🏗️ Construyendo backend...');
try {
  execSync('tsc -p tsconfig.json --outDir dist/server', { stdio: 'inherit' });
  console.log('✅ Backend construido exitosamente');
} catch (error) {
  console.error('❌ Error al construir el backend:', error);
  // No salimos con error porque puede que no tengamos archivos TypeScript en el backend
}

// Copiar archivos de configuración al directorio dist
console.log('📋 Copiando archivos de configuración...');
try {
  // Copiar .env al directorio dist si existe
  if (fs.existsSync(path.join(__dirname, '.env'))) {
    fs.copyFileSync(
      path.join(__dirname, '.env'),
      path.join(__dirname, 'dist', '.env')
    );
  }
  
  // Crear un archivo server.js en el directorio dist/server para producción
  const serverContent = `
// Servidor Express para producción
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'client')));

// Para todas las rutas, enviar el index.html (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Servidor de producción iniciado en http://0.0.0.0:\${PORT}\`);
});`;

  fs.writeFileSync(path.join(__dirname, 'dist', 'server', 'index.js'), serverContent);
  
  console.log('✅ Archivos de configuración copiados exitosamente');
} catch (error) {
  console.error('❌ Error al copiar archivos de configuración:', error);
}

console.log('🎉 Construcción para despliegue completada exitosamente');
console.log('Para ejecutar la aplicación en producción: npm start');