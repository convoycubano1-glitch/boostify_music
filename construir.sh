#!/bin/bash

# Colores para los mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}==========================================${NC}"
echo -e "${PURPLE}= SCRIPT DE CONSTRUCCIÓN PARA PRODUCCIÓN =${NC}"
echo -e "${PURPLE}==========================================${NC}"

# Función para ejecutar comandos y mostrar su salida
execute_command() {
  echo -e "${CYAN}\n>> Ejecutando: $1${NC}"
  eval $1
  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Error al ejecutar comando${NC}"
    return 1
  else
    echo -e "${GREEN}✓ Comando ejecutado con éxito${NC}"
    return 0
  fi
}

# Limpiar directorio dist si existe
if [ -d "dist" ]; then
  echo -e "${CYAN}\n>> Limpiando directorio dist existente...${NC}"
  rm -rf dist
fi

# Crear directorio dist y subdirectorios
echo -e "${CYAN}\n>> Creando estructura de directorios...${NC}"
mkdir -p dist/client

# Compilar frontend con Vite
echo -e "${CYAN}\n>> Compilando frontend con Vite...${NC}"
if execute_command "cd client && npx vite build"; then
  echo -e "${GREEN}✓ Frontend compilado correctamente${NC}"
else
  echo -e "${YELLOW}⚠️ Error al compilar frontend, intentando con opciones alternativas...${NC}"
  if execute_command "cd client && NODE_ENV=production npx vite build"; then
    echo -e "${GREEN}✓ Frontend compilado con NODE_ENV=production${NC}"
  else
    echo -e "${RED}✗ La compilación del frontend ha fallado repetidamente${NC}"
    exit 1
  fi
fi

# Compilar backend con TypeScript (si está configurado)
echo -e "${CYAN}\n>> Verificando compilación del backend...${NC}"
if [ -f "tsconfig.json" ]; then
  execute_command "npx tsc --project tsconfig.json" || echo -e "${YELLOW}⚠️ Advertencia: La compilación TypeScript ha fallado, continuando...${NC}"
fi

# Copiar archivos necesarios
echo -e "${CYAN}\n>> Copiando archivos compilados...${NC}"
execute_command "cp -r client/dist/* dist/client/"

# Crear script de inicio para producción
echo -e "${CYAN}\n>> Creando script de inicio para producción...${NC}"
cat > dist/start.js << 'EOF'
/**
 * Script de arranque para producción
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import fs from 'fs';

// Configuración básica
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Inicializar Express
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Capturar todas las demás rutas y servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Iniciar servidor
const server = createServer(app);
server.listen(PORT, HOST, () => {
  console.log(`Servidor ejecutándose en http://${HOST}:${PORT}`);
});
EOF

# Copiar package.json para producción
echo -e "${CYAN}\n>> Preparando package.json para producción...${NC}"
cat > dist/package.json << EOF
{
  "name": "boostify-music-production",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node start.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}
EOF

# Copiar archivo .env si existe
if [ -f ".env" ]; then
  echo -e "${CYAN}\n>> Copiando archivo .env...${NC}"
  cp .env dist/
fi

echo -e "${GREEN}\n✓ CONSTRUCCIÓN COMPLETADA EXITOSAMENTE${NC}"
echo -e "${GREEN}La aplicación está lista para producción en el directorio 'dist'${NC}"
echo -e "${CYAN}Para iniciar la aplicación: cd dist && node start.js${NC}"