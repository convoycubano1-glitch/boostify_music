// Servidor web simple para servir archivos estáticos
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde client/public
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Servir archivos de src para desarrollo
app.use('/src', express.static(path.join(__dirname, 'client', 'src')));

// Ruta para ver archivos en desarrollo
app.get('/src/*', (req, res) => {
  const filePath = path.join(__dirname, 'client', req.path);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

// Servir index.html para todas las rutas no manejadas (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor estático ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`✅ Accesible desde cualquier host de Replit`);
});