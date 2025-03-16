/**
 * Servidor Express simple para servir la página de la tienda.
 * Este servidor está optimizado para manejar las solicitudes a las APIs de Stripe sin requerir autenticación.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar servicio de archivos estáticos
app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Ruta para servir la página principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de la tienda ejecutándose en http://localhost:${PORT}`);
  console.log('Presiona Ctrl+C para detener');
});