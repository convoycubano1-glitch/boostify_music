# Guía de Despliegue en Replit

Esta guía explica cómo desplegar correctamente esta aplicación en Replit.

## 1. Preparación para el Despliegue

Antes de desplegar, necesitamos corregir la estructura de archivos para que funcione con Replit:

```bash
# Ejecuta el script de despliegue para Replit
node replit-deploy.js
```

Este script crea exactamente la estructura de directorios que Replit espera:
- `dist/server/index.js` - Servidor Express simplificado
- `dist/client/index.html` - Página HTML básica

## 2. Despliegue en Replit

Para desplegar en Replit, sigue estos pasos:

1. Asegúrate de que el script `replit-deploy.js` ha sido ejecutado correctamente
2. Verifica que exista la estructura `dist/server/index.js` y `dist/client/index.html`
3. Haz clic en el botón "Deploy" (Desplegar) en la interfaz de Replit
4. Espera a que el proceso de despliegue se complete

## 3. Solución de errores comunes:

### Error: "Missing build command for production deployment"

Este error aparece cuando Replit no encuentra un comando de build definido. El error se resuelve ejecutando:

```bash
node replit-deploy.js
```

### Error: "Node.js server is looking for missing file '/home/runner/workspace/dist/server/index.js'"

Este error ocurre cuando no existe el archivo que el script `start` (definido en package.json) está intentando ejecutar. Asegúrate de que:

1. Existe el directorio `dist/server`
2. El archivo `dist/server/index.js` existe y es válido
3. El archivo está usando la sintaxis ESM correcta (usando `import` en lugar de `require`)

## 4. Verificación del despliegue

Una vez desplegado, puedes verificar que todo funciona correctamente accediendo a:

- **Aplicación principal**: URL de despliegue de tu proyecto en Replit
- **Estado del API**: `{URL_DESPLIEGUE}/api/status`

## 5. Notas adicionales

- Esta solución usa un HTML estático con estilos modernos pero es una página de placeholder
- El servidor Express está configurado para servir archivos estáticos y una API básica
- Esta solución es ideal para cumplir con los requisitos de Replit mientras se desarrolla la solución completa