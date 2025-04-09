
# Guía de Despliegue para Boostify Music

## Versión de demostración

Esta es una versión de demostración estática de Boostify Music que se puede desplegar sin problemas
de compilación. Esta versión simplificada muestra las funcionalidades principales de la aplicación.

## Pasos para el despliegue

1. **Preparar el servidor**:
   Asegúrese de tener Node.js 16 o superior instalado.

2. **Copiar archivos de distribución**:
   Copie todo el contenido de la carpeta `dist/` a su servidor.

3. **Instalar dependencias**:
   ```
   npm install --production
   ```

4. **Iniciar la aplicación**:
   ```
   npm start
   ```

## Variables de entorno

Para una versión completa de la aplicación, se necesitan las siguientes variables de entorno:

- `VITE_OPENROUTER_API_KEY`: Clave API para OpenRouter AI
- `VITE_ELEVENLABS_API_KEY`: Clave API para ElevenLabs
- `FIREBASE_CONFIG`: Configuración de Firebase

## Notas importantes

- Esta es una versión estática sin todas las funcionalidades de la aplicación completa.
- Para acceder a todas las funcionalidades, se requiere compilar la versión completa.
