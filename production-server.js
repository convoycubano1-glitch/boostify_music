// Servidor de producción mejorado que funciona con o sin build
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Carpeta donde deberían estar los archivos compilados
const distPath = join(__dirname, 'client', 'dist');
const hasBuild = fs.existsSync(distPath) && fs.readdirSync(distPath).length > 0;

// Función para verificar si el servidor Vite está en funcionamiento
function checkViteServerRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5173', () => {
      resolve(true);
    }).on('error', () => {
      resolve(false);
    });
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  // Verificar si tenemos un build o si tenemos que usar el servidor de desarrollo
  const viteIsRunning = await checkViteServerRunning();

  if (hasBuild) {
    // Modo producción - servir archivos estáticos desde el build
    console.log('⚡ Iniciando servidor de producción con archivos compilados');
    
    // Servir archivos estáticos
    app.use(express.static(distPath));
    
    // Para cualquier ruta no encontrada, servir index.html (SPA)
    app.get('*', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  } else if (viteIsRunning) {
    // Modo desarrollo con proxy a Vite
    console.log('⚡ Iniciando servidor con proxy a Vite en desarrollo');

    // Configurar proxy a Vite
    app.use(
      '/',
      createProxyMiddleware({
        target: 'http://localhost:5173',
        changeOrigin: true,
        ws: true,
        logLevel: 'silent'
      })
    );
  } else {
    // Modo fallback - redireccionar al servidor Vite
    console.log('⚡ Iniciando servidor de redirección a Vite');
    
    // Iniciar Vite en segundo plano
    import('child_process').then(({ spawn }) => {
      console.log('🚀 Iniciando servidor Vite en segundo plano...');
      
      const viteProcess = spawn('cd client && npx vite --host 0.0.0.0 --port 5173', {
        shell: true,
        detached: true,
        stdio: 'inherit'
      });
      
      viteProcess.unref();
    });
    
    // Enviar página de redirección para cualquier ruta
    app.get('*', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="3;url=http://${req.headers.host.replace(/:\d+/, '')}:5173${req.originalUrl}">
          <title>Redireccionando...</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0F172A; color: #E2E8F0; text-align: center; padding-top: 50px; }
            h1 { font-size: 24px; margin-bottom: 20px; color: #F59E0B; }
            p { font-size: 16px; line-height: 1.6; margin-bottom: 15px; }
            .loader { width: 50px; height: 50px; border: 5px solid #334155; border-radius: 50%; border-top: 5px solid #F59E0B; margin: 30px auto; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            a { color: #F59E0B; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>Boostify</h1>
          <p>Redireccionando al servidor de desarrollo...</p>
          <div class="loader"></div>
          <p>Si no eres redirigido automáticamente, <a href="http://${req.headers.host.replace(/:\d+/, '')}:5173${req.originalUrl}">haz clic aquí</a>.</p>
        </body>
        </html>
      `);
    });
  }

  // Iniciar el servidor
  app.listen(PORT, '0.0.0.0', () => {
    if (hasBuild) {
      console.log(`✅ Servidor de producción iniciado en http://0.0.0.0:${PORT}`);
      console.log(`📂 Sirviendo archivos desde: ${distPath}`);
    } else if (viteIsRunning) {
      console.log(`✅ Servidor proxy iniciado en http://0.0.0.0:${PORT}`);
      console.log(`🔄 Redirigiendo tráfico a http://localhost:5173`);
    } else {
      console.log(`✅ Servidor de redirección iniciado en http://0.0.0.0:${PORT}`);
      console.log(`🔄 Las solicitudes serán redirigidas a http://localhost:5173`);
    }
  });
}

// Instalar dependencia necesaria si no está disponible
if (!fs.existsSync(join(__dirname, 'node_modules', 'http-proxy-middleware'))) {
  console.log('📦 Instalando http-proxy-middleware...');
  import('child_process').then(({ execSync }) => {
    try {
      execSync('npm install http-proxy-middleware --no-save', { stdio: 'inherit' });
      console.log('✅ Dependencia instalada correctamente');
      startServer();
    } catch (error) {
      console.error('❌ Error al instalar la dependencia:', error.message);
      // Continuar sin el proxy
      startServer();
    }
  });
} else {
  startServer();
}