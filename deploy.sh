#!/bin/bash

# Script de despliegue optimizado para Boostify Music
# Este script prepara la aplicación y la inicia en modo compatible con producción

# Detener cualquier servidor existente
echo "🔍 Deteniendo servidores existentes..."
pkill -f "node start-prod.js" || true
pkill -f "tsx server/index.ts" || true
pkill -f "ts-node server/index.ts" || true
pkill -f "node server/index.js" || true

# Configurar el entorno
export NODE_ENV=development
export SKIP_PREFLIGHT_CHECK=true
export TS_NODE_TRANSPILE_ONLY=true
export PORT=3000

echo "✅ Variables de entorno configuradas"

# Verificar dependencias necesarias
echo "📦 Verificando dependencias necesarias..."
npm list tsx >/dev/null 2>&1 || npm install --no-save tsx@latest
npm list ts-node >/dev/null 2>&1 || npm install --no-save ts-node@latest

echo "🚀 Iniciando servidor en modo producción en el puerto 3000..."
echo "🌍 La aplicación estará disponible en: https://workspace.replit.app"
echo ""
echo "Si no puedes ver el home page, sigue estos pasos:"
echo "1. Asegúrate de visitar: https://workspace.replit.app"
echo "2. Si ves solo una pantalla en blanco, prueba refrescar o limpiar la caché"
echo "3. Para el despliegue en producción, usa el comando 'node start-prod.js'"
echo ""

# Ejecutar el servidor con variables de entorno
NODE_ENV=development SKIP_PREFLIGHT_CHECK=true TS_NODE_TRANSPILE_ONLY=true PORT=3000 tsx server/index.ts