/**
 * Servidor simple para servir la página HTML estática
 * Este script soluciona el problema del spinner infinito
 */

const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos desde la carpeta public
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/assets', express.static(path.join(__dirname, 'client/public/assets')));

// Ruta principal - servir nuestra página HTML preparada
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'loading-fix.html'));
});

// Puerto para el servidor - usar el puerto 5000 para compatibilidad con la configuración existente
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});