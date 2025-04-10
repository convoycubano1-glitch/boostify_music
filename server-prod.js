// Servidor de producción optimizado
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3333; // Puerto 3333 como está configurado en .replit

const app = express();

// Habilitar compresión para reducir el tamaño de las respuestas
app.use(compression());

// Servir archivos estáticos con caché
app.use(express.static(path.join(__dirname, 'dist', 'client'), {
  maxAge: '1d', // Caché por 1 día
  immutable: true,
  etag: true,
}));

// Ruta de verificación de estado
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Servidor en producción funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Cualquier ruta no reconocida, servir el index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'client', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de producción ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`🌐 Aplicación desplegada y lista para uso`);
});