# Guía de Despliegue

Esta guía explica cómo desplegar la aplicación en diferentes entornos.

## Requisitos Previos

- Node.js (versión 18 o superior)
- NPM (versión 9 o superior)
- Acceso a las API Keys necesarias para las funcionalidades completas

## Despliegue en Replit

1. Asegúrate de tener todos los secretos configurados en la sección "Secrets" del proyecto:
   - `OPENAI_API_KEY` (Para funcionalidades de IA)
   - `FAL_API_KEY` (Para generación de imágenes)
   - `FIREBASE_CONFIG` (Para autenticación y base de datos)
   - Otras claves según las funcionalidades que utilices

2. Para desplegar la aplicación, simplemente haz clic en el botón "Deploy" en la interfaz de Replit.

3. Replit configurará automáticamente tu aplicación para producción y la hará accesible a través de una URL pública.

## Despliegue Manual (Entorno de Producción)

1. Construye la aplicación para producción:
   ```
   npm run build
   ```

2. Ejecuta el servidor de producción:
   ```
   node production.js
   ```

3. La aplicación estará disponible en `http://localhost:3000` (o el puerto configurado en las variables de entorno).

## Variables de Entorno

Asegúrate de configurar las siguientes variables de entorno para el correcto funcionamiento de la aplicación:

- `PORT`: Puerto para el servidor (por defecto: 3000)
- `OPENAI_API_KEY`: Clave API de OpenAI
- `FAL_API_KEY`: Clave API de FAL AI
- `FIREBASE_CONFIG`: Configuración JSON de Firebase (escapada)

## Estructura de Archivos Importantes

- `direct-vite.js`: Script para ejecutar el servidor de desarrollo Vite
- `start.js`: Script principal que inicia la aplicación en desarrollo
- `production.js`: Script para construir y servir la aplicación en producción

## Solución de Problemas

Si encuentras problemas durante el despliegue:

1. Verifica que todas las variables de entorno estén correctamente configuradas
2. Asegúrate de que los archivos de construcción se han generado correctamente en la carpeta `dist/client`
3. Revisa los logs del servidor para identificar posibles errores

## Seguridad

Nunca incluyas directamente las claves API en el código fuente. Siempre utiliza variables de entorno o el sistema de secretos de tu plataforma de despliegue.