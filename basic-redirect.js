// Servidor básico que sirve la aplicación directamente
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/src', express.static('src'));
app.use('/assets', express.static('assets'));

// Ruta principal que sirve directamente el archivo home.tsx
app.get('/', (req, res) => {
  console.log('Sirviendo directamente home.tsx');
  
  // Leer el archivo home.tsx
  fs.readFile('./src/pages/home.tsx', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer home.tsx:', err);
      return res.status(500).send('Error al leer el archivo home.tsx');
    }
    
    // Servir el contenido como texto plano
    res.setHeader('Content-Type', 'text/plain');
    res.send(data);
  });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor básico iniciado en http://0.0.0.0:${PORT}`);
});