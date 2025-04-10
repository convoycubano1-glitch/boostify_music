// Servidor HTTP extremadamente simple que muestra una página básica
import http from 'http';

// Puerto que espera Replit
const PORT = 5000;

// HTML básico para mostrar
const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #1e1e2e;
      color: #cdd6f4;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background-color: #181825;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid #313244;
    }
    h1 {
      color: #f97316;
      margin-bottom: 1rem;
    }
    p {
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .feature {
      background-color: #1e1e2e;
      padding: 1.5rem;
      border-radius: 6px;
      border: 1px solid #313244;
    }
    .feature h2 {
      color: #f97316;
      font-size: 1.25rem;
      margin-top: 0;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Boostify Music</h1>
    <p>¡Bienvenido a la plataforma de música impulsada por inteligencia artificial! Esta página de prueba confirma que el servidor está funcionando correctamente.</p>
    
    <div class="features">
      <div class="feature">
        <h2>Servidor Simple</h2>
        <p>Este es un servidor HTTP simple diseñado para funcionar en el entorno de Replit sin problemas de bloqueo de dominio.</p>
      </div>
      <div class="feature">
        <h2>Página de Prueba</h2>
        <p>Esta página demuestra que el servidor está sirviendo contenido correctamente y es accesible desde internet.</p>
      </div>
      <div class="feature">
        <h2>Siguiente Paso</h2>
        <p>Ahora que tenemos un servidor funcional, podemos trabajar en servir la aplicación completa.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Crear un servidor extremadamente simple
const server = http.createServer((req, res) => {
  console.log(`🌐 Solicitud recibida: ${req.method} ${req.url}`);
  
  // Establecer encabezados básicos
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Enviar el HTML
  res.end(html);
  console.log('✅ Página enviada correctamente');
});

// Iniciar el servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP básico ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`✅ Servidor configurado para aceptar solicitudes de cualquier origen`);
});