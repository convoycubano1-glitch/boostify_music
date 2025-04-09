# Guía para Actualizar Videos en Boostify Music

Esta guía explica cómo añadir, actualizar o eliminar videos de la aplicación Boostify Music desplegada en Replit.

## Estructura de Directorios de Videos

Los videos se almacenan en las siguientes ubicaciones:

1. `client/assets/` - Directorio principal para videos 
2. `client/assets/indications/` - Videos de indicaciones y tutoriales
3. `client/assets/tv/` - Videos para la sección TV
4. `client/public/assets/` - Copia de seguridad/alternativa para videos públicos

## Añadir Nuevos Videos

Para añadir nuevos videos a la aplicación:

1. **Coloca el archivo de video** en la ubicación adecuada según su propósito:
   ```bash
   # Por ejemplo, para añadir un video a la sección TV:
   cp mi-nuevo-video.mp4 client/assets/tv/
   ```

2. **Actualiza el índice de videos** (opcional si quieres mostrar el video en la sección de diagnóstico):
   ```bash
   # Ejecuta el verificador de videos para actualizar la lista
   node deploy-simple-check.cjs
   ```

3. **Reinicia el servidor** si está en ejecución:
   ```bash
   # Reinicia el flujo de trabajo en Replit
   # O si estás ejecutando localmente:
   node optimized-start.js
   ```

## Actualizar Videos Existentes

Para reemplazar videos existentes:

1. **Haz una copia de seguridad** del video original (opcional):
   ```bash
   cp client/assets/mi-video.mp4 client/assets/mi-video.mp4.backup
   ```

2. **Reemplaza el archivo** manteniendo el mismo nombre:
   ```bash
   cp mi-video-actualizado.mp4 client/assets/mi-video.mp4
   ```

3. **Verifica el reemplazo**:
   ```bash
   # Comprueba el tamaño y la existencia
   ls -la client/assets/mi-video.mp4
   ```

4. **Limpia la caché** (si es necesario):
   En el navegador, usa Ctrl+F5 para forzar una recarga completa al acceder al video.

## Eliminar Videos

Para eliminar videos que ya no son necesarios:

1. **Haz una copia de seguridad** (recomendado):
   ```bash
   mkdir -p backup/videos
   cp client/assets/video-a-eliminar.mp4 backup/videos/
   ```

2. **Elimina el archivo**:
   ```bash
   rm client/assets/video-a-eliminar.mp4
   ```

3. **Actualiza el índice** (opcional):
   ```bash
   node deploy-simple-check.cjs
   ```

## Consideraciones de Rendimiento

- **Tamaño de los videos**: Considera comprimir los videos grandes antes de añadirlos
- **Formato**: MP4 con codec H.264 es el más compatible con navegadores
- **Resolución**: Usa resoluciones moderadas (720p o menos) para mejor rendimiento

## Recomendaciones para Despliegue después de Cambios Grandes

Si has añadido o actualizado muchos videos, considera realizar un nuevo despliegue completo:

1. **Genera la versión optimizada**:
   ```bash
   node deploy-optimized.js
   ```

2. **Prepara para despliegue**:
   ```bash
   node prepare-deploy.cjs
   ```

3. **Verifica antes del despliegue**:
   ```bash
   node optimized-start.js
   # Visita http://localhost:5000/diagnose para verificar
   ```

4. **Despliega en Replit** usando el botón "Deploy"

## Solución de Problemas Comunes

### Video no se muestra

1. Verifica la ruta exacta del archivo
2. Comprueba que el formato sea compatible (MP4, WebM)
3. Verifica los permisos del archivo

### Error 404 al acceder al video

1. Confirma que el archivo existe en ambas ubicaciones: `client/assets/` y `client/public/assets/`
2. Revisa la URL (distinción entre mayúsculas/minúsculas)
3. Prueba acceder con la ruta `/video/nombre-archivo.mp4`

### Problemas de rendimiento

1. Verifica el tamaño del video (>50MB puede causar lentitud)
2. Considera comprimir los videos más grandes
3. Reinicia el servidor si notas latencia alta

---

Para cualquier otro problema, consulta los logs del servidor o la página de diagnóstico en `/diagnose`.

Fecha de última actualización: 3 de abril de 2025