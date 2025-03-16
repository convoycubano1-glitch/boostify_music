/**
 * Servidor simple para servir directamente la página de la tienda
 * Esto evita problemas de carga con el desarrollo completo de Vite
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3500; // Puerto diferente al servidor principal

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar servicio de archivos estáticos
app.use(express.static(path.join(__dirname, 'assets')));

// Ruta para servir la página de la tienda
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'store-page.html'));
});

// Ruta para redirigir a /login 
app.get('/login', (req, res) => {
  // Redirigir al sitio principal
  res.redirect('/');
});

// Implementación simple de redirect para rutas API
app.all('/api/*', (req, res) => {
  res.redirect(`http://localhost:5000${req.originalUrl}`);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de la tienda ejecutándose en http://localhost:${PORT}`);
  console.log('Presiona Ctrl+C para detener');
});