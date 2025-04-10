// Servidor Express que redirige al puerto 5173 donde corre la aplicación completa
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;
const app = express();

console.log('⚡ Iniciando servidor de redirección a Vite');

// Permitir a Express analizar JSON y formularios codificados en URL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Copiar la configuración que permite todos los hosts para Vite
try {
  fs.copyFileSync(
    join(__dirname, 'client', 'vite.config.allow-all.js'), 
    join(__dirname, 'client', 'vite.config.js')
  );
  console.log('✅ Configuración de Vite actualizada para permitir cualquier host');
} catch (err) {
  console.error('❌ Error al copiar configuración Vite:', err.message);
}

// Iniciar el servidor Vite en segundo plano
console.log('🚀 Iniciando servidor Vite en segundo plano...');
const viteServer = exec('cd client && npx vite --host 0.0.0.0 --port 5173');

viteServer.stdout.on('data', (data) => {
  console.log(`Vite: ${data.trim()}`);
});

viteServer.stderr.on('data', (data) => {
  if (data.includes('running at')) {
    console.log(data.trim());
  }
});

// Ruta para redirigir a la aplicación en puerto 5173
app.get('*', (req, res) => {
  const host = req.headers.host || '';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const path = req.originalUrl || '/';
  
  // Generar URL de redirección basado en el host actual
  const redirectUrl = `${protocol}://${host.replace(/:\d+/, '')}:${VITE_PORT}${path}`;
  
  console.log(`Redirigiendo a: ${redirectUrl}`);
  // Hacer una redirección HTTP 302 (temporal)
  res.redirect(redirectUrl);
});

// Iniciar el servidor
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado en http://0.0.0.0:${PORT}`);
  console.log(`✨ Redirigiendo tráfico al puerto ${VITE_PORT}`);
});