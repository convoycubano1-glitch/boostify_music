// Servidor web básico compatible con restricciones de Replit
// Este servidor utiliza únicamente módulos nativos de Node.js

import http from 'http';

// Usar solo el puerto 5000 que es el que espera el workflow de Replit
const PORTS = [5000];

// Contenido HTML simple
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Servidor Básico en Replit</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #333;
    }
    .container {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>¡Servidor funcionando correctamente!</h1>
    <p>Este es un servidor web básico creado con Node.js.</p>
    <p>Información del servidor:</p>
    <ul>
      <li>Hora del servidor: ${new Date().toLocaleString()}</li>
      <li>Node.js versión: ${process.version}</li>
      <li>Plataforma: ${process.platform}</li>
    </ul>
  </div>
</body>
</html>
`;

// Crear servidor HTTP básico
const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  // Responder con contenido HTML simple
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(htmlContent);
  console.log('Respuesta enviada: 200 OK');
});

// Intentar iniciar el servidor en múltiples puertos
function startServer() {
  let currentPortIndex = 0;
  
  function tryNextPort() {
    if (currentPortIndex >= PORTS.length) {
      console.error('❌ No se pudo iniciar el servidor en ningún puerto');
      process.exit(1);
      return;
    }
    
    const port = PORTS[currentPortIndex];
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Servidor iniciado exitosamente en http://0.0.0.0:${port}`);
    }).on('error', (err) => {
      console.log(`⚠️ No se pudo iniciar en puerto ${port}: ${err.message}`);
      currentPortIndex++;
      tryNextPort();
    });
  }
  
  tryNextPort();
}

startServer();