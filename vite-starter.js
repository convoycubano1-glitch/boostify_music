// Script para iniciar el servidor Vite de desarrollo
import { createServer } from 'vite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function startViteServer() {
  console.log('🚀 Iniciando servidor de desarrollo Vite en puerto 5173...');
  
  try {
    // Crear instancia del servidor Vite con configuración optimizada para Replit
    const server = await createServer({
      configFile: join(__dirname, 'vite.config.ts'),
      server: {
        hmr: {
          clientPort: 443, // Importante para Replit
          port: 5173
        },
        host: '0.0.0.0',
        port: 5173,
        cors: true,
        strictPort: true,
        open: true
      }
    });
    
    // Iniciar el servidor
    await server.listen();
    
    // Obtener la URL para poder acceder
    const info = server.config.server;
    console.log(`✅ Servidor Vite iniciado en http://${info.host}:${info.port}`);
    console.log('✅ Accede a la aplicación React completa con estilos en el puerto 5173');
  } catch (error) {
    console.error('❌ Error al iniciar el servidor Vite:', error);
  }
}

startViteServer();