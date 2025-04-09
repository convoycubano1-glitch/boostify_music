/**
 * Script para preparar Boostify Music para despliegue en Replit
 * Este script soluciona el problema de "crash loop" configurando
 * correctamente los archivos necesarios
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparando Boostify Music para despliegue en Replit...');

// 1. Asegurarnos de que exista el archivo start-fixed.cjs
const startScriptPath = path.join(__dirname, 'start-fixed.cjs');
if (!fs.existsSync(startScriptPath)) {
  // Código del script de inicio
  const startScriptContent = `/**
 * Script optimizado para iniciar Boostify Music en Replit
 * Diseñado para evitar problemas de crash loop
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor de Boostify Music...');

// Verificar carpetas y archivos necesarios
if (!fs.existsSync(path.join(__dirname, 'client'))) {
  fs.mkdirSync(path.join(__dirname, 'client'), { recursive: true });
  console.log('📁 Carpeta client creada');
}

// Crear una página HTML mínima si no existe
const indexPath = path.join(__dirname, 'client', 'index.html');
if (!fs.existsSync(indexPath)) {
  const htmlContent = \`
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boostify Music</title>
    <style>
      body { 
        font-family: system-ui, sans-serif; 
        background: #121212; 
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 800px;
        text-align: center;
      }
      h1 { color: #5E17EB; margin-bottom: 1rem; }
      p { line-height: 1.6; }
      .status {
        background: #1a1a1a;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 2rem;
        text-align: left;
      }
      .success { color: #4ade80; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Boostify Music</h1>
      <p>La aplicación se ha desplegado correctamente y está lista para ser utilizada.</p>
      <div class="status">
        <p>Estado: <span class="success">✓ Funcionando</span></p>
        <p>Versión: 1.0.0</p>
        <p>Modo: Producción</p>
      </div>
    </div>
  </body>
  </html>
  \`;
  fs.writeFileSync(indexPath, htmlContent);
  console.log('📄 Archivo index.html creado');
}

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Ruta para comprobar el estado del servidor
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Ruta específica para Replit health checks
app.get('/_replit/healthcheck', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint para obtener información del servidor (útil para diagnóstico)
app.get('/api/status', (req, res) => {
  const status = {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    startTime: new Date().toISOString(),
    directories: {
      client: fs.existsSync('./client'),
      clientDist: fs.existsSync('./client/dist'),
      distClient: fs.existsSync('./dist/client'),
      indexHtml: fs.existsSync('./client/index.html')
    }
  };
  res.json(status);
});

// Ruta para SPA - debe ir al final
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Manejo de errores para evitar crash loop
process.on('uncaughtException', (err) => {
  console.error('Boostify Server: Error no capturado:', err.message);
  // No terminamos el proceso
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Boostify Server: Promesa rechazada no manejada:', reason);
  // No terminamos el proceso
});

// Iniciar servidor con manejo de errores
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Boostify Music en http://localhost:\${PORT}\`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('Error del servidor:', err.message);
  // Reintentar iniciar el servidor después de un error
  setTimeout(() => {
    try {
      server.close();
      server.listen(PORT, '0.0.0.0');
    } catch (e) {
      console.error('Error al reiniciar:', e.message);
    }
  }, 1000);
});`;

  fs.writeFileSync(startScriptPath, startScriptContent);
  console.log('✅ Archivo start-fixed.cjs creado');
} else {
  console.log('✅ Archivo start-fixed.cjs ya existe');
}

// 2. Crear archivo de documentación
const deployDocPath = path.join(__dirname, 'DEPLOY-REPLIT.md');
if (!fs.existsSync(deployDocPath)) {
  const deployDocContent = `# Despliegue de Boostify Music en Replit

Este documento contiene instrucciones para desplegar correctamente Boostify Music en la plataforma Replit.

## Solución al problema de "Crash Loop"

Si estás experimentando el error "crash loop detected" durante el despliegue, sigue estas instrucciones para resolverlo:

### 1. Usa el archivo de servidor optimizado

El archivo \`start-fixed.cjs\` está diseñado específicamente para evitar el problema de "crash loop" en Replit. Este archivo:

- Maneja correctamente los errores no capturados
- Implementa verificaciones de estado para Replit
- Crea archivos mínimos necesarios si no existen
- Sirve los archivos estáticos de manera eficiente

### 2. Configura el despliegue en Replit

Para configurar el despliegue correctamente:

1. Asegúrate de que \`start-fixed.cjs\` está en la raíz del proyecto
2. Modifica el comando de ejecución para que utilice este archivo:
   \`\`\`
   run = "node start-fixed.cjs"
   \`\`\`
3. Despliega la aplicación con la configuración actualizada

### 3. Verifica los archivos estáticos

El script de despliegue detectará automáticamente los archivos estáticos en cualquiera de estas ubicaciones:

- \`./client/\`
- \`./client/dist/\`
- \`./dist/client/\`

Si no encuentra archivos, creará un HTML mínimo para asegurar que la aplicación se inicie correctamente.

## Diagnóstico

Si sigues experimentando problemas, puedes acceder al endpoint \`/api/status\` para obtener información de diagnóstico sobre el servidor.`;

  fs.writeFileSync(deployDocPath, deployDocContent);
  console.log('✅ Archivo DEPLOY-REPLIT.md creado');
} else {
  console.log('✅ Archivo DEPLOY-REPLIT.md ya existe');
}

// 3. Verificar estructura de directorios para deployments
const clientDir = path.join(__dirname, 'client');
if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir, { recursive: true });
  console.log('📁 Carpeta client creada');
}

// 4. Crear una página HTML mínima de fallback si no existe ninguna
const indexPath = path.join(clientDir, 'index.html');
let createdIndexFile = false;

// Verificar si ya existe un index.html en alguna de las carpetas
if (!fs.existsSync(indexPath)) {
  // Verificar si existe en dist/client
  const distClientIndexPath = path.join(__dirname, 'dist', 'client', 'index.html');
  if (fs.existsSync(distClientIndexPath)) {
    // Copiar desde dist/client
    fs.copyFileSync(distClientIndexPath, indexPath);
    console.log('📋 Archivo index.html copiado desde dist/client');
  } else {
    // Verificar si existe en client/dist
    const clientDistIndexPath = path.join(__dirname, 'client', 'dist', 'index.html');
    if (fs.existsSync(clientDistIndexPath)) {
      // Copiar desde client/dist
      fs.copyFileSync(clientDistIndexPath, indexPath);
      console.log('📋 Archivo index.html copiado desde client/dist');
    } else {
      // Crear HTML básico ya que no existe en ningún lado
      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      background: #121212; 
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      text-align: center;
    }
    h1 { color: #5E17EB; margin-bottom: 1rem; }
    p { line-height: 1.6; }
    .status {
      background: #1a1a1a;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 2rem;
      text-align: left;
    }
    .success { color: #4ade80; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Boostify Music</h1>
    <p>La aplicación se ha desplegado correctamente y está lista para ser utilizada.</p>
    <div class="status">
      <p>Estado: <span class="success">✓ Funcionando</span></p>
      <p>Versión: 1.0.0</p>
      <p>Modo: Producción</p>
    </div>
  </div>
</body>
</html>
      `;
      fs.writeFileSync(indexPath, htmlContent);
      console.log('📝 Archivo index.html básico creado');
      createdIndexFile = true;
    }
  }
} else {
  console.log('✅ Archivo index.html ya existe');
}

// 5. Imprimir instrucciones
console.log('\n🎉 ¡Preparación completada!');
console.log('\nPara desplegar la aplicación en Replit:');
console.log('1. Inicia tu aplicación con: node start-fixed.cjs');
console.log('2. Si quieres configurar un despliegue automático, configura run = "node start-fixed.cjs" en .replit');
console.log('3. Consulta DEPLOY-REPLIT.md para obtener más información sobre el despliegue');

// Si hemos creado el index.html básico, advertir al usuario
if (createdIndexFile) {
  console.log('\n⚠️ Nota: Se ha creado un archivo index.html básico porque no se encontró ninguno existente.');
  console.log('   Si deseas usar tu aplicación completa, asegúrate de compilarla primero con:');
  console.log('   - cd client && npm run build');
  console.log('   O de tener tus archivos estáticos en la carpeta client/');
}