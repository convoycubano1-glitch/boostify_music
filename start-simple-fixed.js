/**
 * Script de inicio simplificado para evitar errores de pantalla negra
 * Este script usa un servidor simple para mostrar la información básica
 * mientras se resuelven problemas de dependencias y Firebase
 */

const { exec } = require('child_process');
const path = require('path');

console.log('Iniciando servidor simple para evitar pantalla negra...');
console.log('La información de AI Advisors estará disponible en http://localhost:5000');

// Ejecutar servidor simple
exec('node simple-server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al iniciar el servidor: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error: ${stderr}`);
    return;
  }
  console.log(`Salida: ${stdout}`);
});

console.log('Información importante:');
console.log('- Número de teléfono centralizado para asesores: +1 941 315 9237');
console.log('- Visita http://localhost:5000/ai-advisors para ver la página de asesores');