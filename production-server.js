// Servidor de producción que sirve la aplicación React compilada
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Carpeta donde están los archivos compilados
const distPath = join(__dirname, 'client', 'dist');

// Servir archivos estáticos
app.use(express.static(distPath));

// Para cualquier ruta no encontrada, servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de producción iniciado en http://0.0.0.0:${PORT}`);
  console.log(`📂 Sirviendo archivos desde: ${distPath}`);
});