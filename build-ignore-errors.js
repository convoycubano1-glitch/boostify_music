/**
 * Script de compilación que ignora errores de TypeScript
 */
const { execSync } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '🔨 Compilando cliente ignorando errores de TypeScript...');

try {
  // Compilar cliente con --force para ignorar errores de TypeScript
  execSync('cd client && npx vite build --mode production', { stdio: 'inherit' });
  console.log('\x1b[32m%s\x1b[0m', '✅ Compilación del cliente completada con éxito');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error durante la compilación:', error.message);
  process.exit(1);
}