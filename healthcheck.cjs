//
// Script para resolver únicamente el problema de healthcheck de Replit
// No modifica ni toca ningún otro aspecto de la aplicación
//

const http = require('http');
const { exec } = require('child_process');

// Iniciar la aplicación original
console.log('Iniciando la aplicación original...');
const appProcess = exec('node start.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al iniciar la aplicación: ${error.message}`);
    return;
  }
  console.log(`Salida: ${stdout}`);
  if (stderr) console.error(`Error: ${stderr}`);
});

// Crear un servidor sencillo solo para health checks de Replit
const server = http.createServer((req, res) => {
  if (req.url === '/_replit/healthcheck') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('OK');
    return;
  }
  
  // Redirigir cualquier otra petición a la aplicación original
  res.statusCode = 302;
  res.setHeader('Location', 'http://localhost:3000' + req.url);
  res.end();
});

// Escuchar en puerto diferente para evitar conflictos
server.listen(8000, '0.0.0.0', () => {
  console.log('Servidor de health check iniciado en puerto 8000');
});