# Guía Completa de Despliegue para Boostify Music

Este documento proporciona instrucciones paso a paso para desplegar Boostify Music en entornos de producción.

## Resumen

Hay dos métodos para desplegar la aplicación:

1. **Despliegue simplificado** - Un servidor estático básico (recomendado para pruebas rápidas)
2. **Despliegue completo** - La aplicación real con todas sus funcionalidades

## Método 1: Despliegue Simplificado

### Paso 1: Generar archivos para despliegue

```bash
# Crear despliegue simplificado
node simple-deploy.js
```

Este comando crea una carpeta `dist/` con un servidor Express básico y una página de bienvenida.

### Paso 2: Desplegar

Sube todos los archivos de la carpeta `dist/` a tu servidor y ejecuta:

```bash
cd dist
chmod +x ./start.sh
./start.sh
```

O manualmente:

```bash
cd dist
npm install --production
node server.js
```

## Método 2: Despliegue Completo (con compilación)

Para un despliegue completo de la aplicación real, necesitarás seguir estos pasos más detallados:

### Paso 1: Preparación

1. Instalar dependencias necesarias:

```bash
npm install --save-dev typescript autoprefixer postcss tailwindcss
```

2. Crear archivo de configuración para producción:

```bash
# Crear copia de seguridad de tsconfig.json
cp tsconfig.json tsconfig.prod.json

# Modificar tsconfig.prod.json para ignorar problemas con vite/client
# (Edita manualmente o usa sed para eliminar "vite/client" y añadir "skipLibCheck": true)
```

### Paso 2: Compilar el frontend

```bash
# Configurar variables de entorno
export NODE_ENV=production
export SKIP_PREFLIGHT_CHECK=true
export TS_NODE_TRANSPILE_ONLY=true

# Compilar
cd client
npx vite build --config vite.config.prod.ts
cd ..
```

### Paso 3: Preparar archivos para despliegue

```bash
# Crear directorio de distribución
mkdir -p dist/client

# Copiar archivos compilados
cp -R client/dist/* dist/client/

# Crear servidor de producción
# (Crear un archivo server.js similar al de simple-deploy.js)

# Crear package.json de producción
# (Crear un package.json básico con express como dependencia)
```

### Paso 4: Desplegar

```bash
cd dist
npm install --production
node server.js
```

## Solución de problemas comunes

### Error de TypeScript con "vite/client"

Si encuentras errores relacionados con `vite/client`, debes crear una configuración específica para producción:

```json
// tsconfig.prod.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```

Y usarla durante la compilación:

```bash
tsc --project tsconfig.prod.json
```

### Errores de dependencias durante la compilación

Si encuentras errores por dependencias faltantes:

```bash
npm install --save-dev autoprefixer postcss tailwindcss
```

### Error de conexión al iniciar el servidor

Si el servidor no puede iniciarse por problemas de puerto:

```bash
# Cambiar el puerto en el archivo .env
echo "PORT=3001" >> .env

# O iniciar directamente con un puerto diferente
PORT=3001 node server.js
```

## Configuración de servidor web (Nginx/Apache)

### Nginx

```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName tudominio.com
    
    ProxyRequests Off
    ProxyPreserveHost On
    ProxyVia Full
    
    <Proxy *>
        Require all granted
    </Proxy>
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

## Despliegue en Replit

1. Configura el archivo `.replit`:

```
entrypoint = "dist/server.js"
```

2. Despliega utilizando la opción "Deploy" en el panel de control de Replit.

## Variables de entorno necesarias

Para un funcionamiento completo, configura estas variables de entorno:

```
NODE_ENV=production
PORT=3000
```

Si la aplicación utiliza servicios externos (como Firebase, OpenAI, etc.), asegúrate de configurar también sus respectivas claves API.

## Notas adicionales

- La aplicación está optimizada para producción
- El servidor Express está configurado para servir archivos estáticos con caché
- Para más información sobre la estructura del proyecto, consulta README.md