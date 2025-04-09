# Guía de Despliegue de Boostify Music con Videos 

Esta guía detalla los pasos para desplegar correctamente Boostify Music en Replit, preservando todos los archivos de video (~302MB en 35 archivos).

## Resumen del problema

El proyecto contiene aproximadamente 35 archivos de video MP4 que suman ~302MB. Necesitamos desplegar la aplicación en Replit asegurando que:

1. Todos los videos estén disponibles en la versión desplegada
2. La aplicación funcione correctamente con streaming de videos
3. El proceso de compilación sea optimizado para manejar archivos grandes

## Scripts de Despliegue

Hemos creado varios scripts especializados que trabajan juntos para garantizar un despliegue exitoso:

### 1. `deploy-optimized.js`

Este script prepara la aplicación para el despliegue:

- Crea una estructura de directorios optimizada en la carpeta `dist/`
- Localiza y copia todos los archivos de video preservando sus rutas
- Crea un `package.json` optimizado para producción
- Genera un script de inicio (`optimized-start.js`) y un servidor optimizado (`server-prod.js`)

**Ejecutar con:** `node deploy-optimized.js`

### 2. `prepare-deploy.cjs`

Este script mueve los archivos generados de la carpeta `dist/` al directorio raíz:

- Copia `package.json` optimizado
- Copia `optimized-start.js` y `server-prod.js`
- Copia el contenido de la carpeta `client` preservando la estructura

**Ejecutar con:** `node prepare-deploy.cjs`

### 3. `deploy-simple-check.cjs`

Este script verifica que todos los videos estén presentes y proporciona diagnósticos:

- Cuenta el número total de videos
- Calcula el tamaño total
- Muestra una lista detallada de todos los archivos de video

**Ejecutar con:** `node deploy-simple-check.cjs`

## Servidor Optimizado

El servidor optimizado (`server-prod.js`) incluye:

- Soporte para streaming de videos con rangos parciales
- Compresión automática de respuestas HTTP
- Múltiples rutas para acceder a videos:
  - `/assets/nombre-video.mp4` - Acceso directo a archivos estáticos
  - `/video/nombre-video.mp4` - Endpoint de streaming optimizado
- Ruta de diagnóstico en `/diagnose` para verificar videos disponibles
- API REST en `/api/videos` que devuelve detalles de todos los videos

## Proceso de Despliegue Paso a Paso

1. **Preparar la aplicación:**
   ```bash
   node deploy-optimized.js
   ```

2. **Mover archivos al directorio raíz:**
   ```bash
   node prepare-deploy.cjs
   ```

3. **Iniciar el servidor optimizado:**
   ```bash
   node optimized-start.js
   ```

4. **Verificar la aplicación:**
   - Accede a `http://localhost:5000/` para ver la aplicación
   - Accede a `http://localhost:5000/diagnose` para verificar los videos
   - Prueba la reproducción de videos en `http://localhost:5000/assets/hero-video.mp4`

5. **Desplegar en Replit:**
   - Utiliza el botón "Deploy" de Replit para publicar la aplicación

## Verificación Post-Despliegue

Después del despliegue, verifica:

1. Que la página de diagnóstico muestre 35 videos (accede a `/diagnose`)
2. Que los videos se reproduzcan correctamente 
3. Que el servidor responda rápidamente incluso con archivos grandes

## Solución de Problemas

Si encuentras algún problema:

1. **Verifica los logs del servidor** para identificar errores
2. **Comprueba las rutas de los archivos** si algún video no se encuentra
3. **Reinicia el servidor** si observas problemas de rendimiento

---

Fecha de última actualización: 3 de abril de 2025