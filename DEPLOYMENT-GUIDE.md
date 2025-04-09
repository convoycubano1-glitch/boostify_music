# Guía de Despliegue para Boostify Music

Esta guía te ayudará a preparar y desplegar correctamente la aplicación Boostify Music en producción.

## Preparación para el Despliegue

### 1. Ejecutar el script de preparación

```bash
node prepare-for-deployment.js
```

Este script realiza todos los pasos necesarios para generar una versión lista para producción:

- Crea una copia de seguridad de `tsconfig.json`
- Modifica temporalmente la configuración para evitar errores de TypeScript
- Compila la aplicación frontend optimizada
- Copia todos los archivos a la carpeta `dist/`
- Crea un servidor Express optimizado para producción
- Restaura la configuración original

### 2. Verificar la estructura de archivos generada

Después de ejecutar el script, deberías tener la siguiente estructura en la carpeta `dist/`:

```
dist/
├── client/          # Archivos del frontend compilado
│   ├── assets/      # CSS, JS, imágenes y otros recursos
│   ├── index.html   # Página principal
│   └── ...
├── server.js        # Servidor Express optimizado
├── package.json     # Dependencias para producción
├── start.sh         # Script de inicio automatizado
└── README.md        # Instrucciones de despliegue
```

## Opciones de Despliegue

### Opción 1: Despliegue en un VPS o servidor dedicado

1. Sube todo el contenido de la carpeta `dist/` a tu servidor
2. Instala Node.js 16 o superior si no está instalado
3. Ejecuta el script de inicio automatizado:

```bash
chmod +x ./start.sh
./start.sh
```

O instala manualmente las dependencias e inicia el servidor:

```bash
npm install --production
npm start
```

### Opción 2: Despliegue en Replit

1. Configura el archivo `.replit` con el punto de entrada adecuado:

```
entrypoint = "dist/server.js"
```

2. Asegúrate de que las dependencias estén instaladas:

```bash
cd dist
npm install --production
```

3. Inicia la aplicación:

```bash
node server.js
```

## Configuración de Variables de Entorno

Puedes personalizar el comportamiento de la aplicación mediante las siguientes variables de entorno:

- `PORT`: Puerto en el que se ejecutará el servidor (valor predeterminado: 3000)
- `NODE_ENV`: Entorno de ejecución (valor predeterminado: production)

Para servicios externos (Firebase, OpenAI, etc.), debes configurar las variables correspondientes en tu entorno de producción.

## Solución de Problemas Comunes

### Error: "Cannot find module"

Si recibes este error, asegúrate de que todas las dependencias estén instaladas:

```bash
cd dist
npm install --production
```

### Error: "EADDRINUSE"

Este error indica que el puerto ya está en uso. Cambia el puerto mediante la variable de entorno:

```bash
PORT=4000 npm start
```

### Problemas de rendimiento

Si experimentas problemas de rendimiento:

1. Asegúrate de que el servidor tenga suficientes recursos (CPU/RAM)
2. Considera utilizar un gestor de procesos como PM2:

```bash
npm install -g pm2
pm2 start server.js --name "boostify-music"
```

## Verificación del Despliegue

Para verificar que la aplicación se ha desplegado correctamente:

1. Accede a `http://tudominio.com:3000` (o el puerto configurado)
2. Verifica el estado del API con: `http://tudominio.com:3000/api/status`
3. Comprueba que todas las funcionalidades principales funcionen correctamente