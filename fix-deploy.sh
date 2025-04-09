#!/bin/bash

# Script de compilación y despliegue para Boostify Music
# Este script corrige el problema con vite/client y compila la aplicación

echo "🚀 Iniciando preparación para despliegue..."

# 1. Crear copia de seguridad del archivo tsconfig.json
cp tsconfig.json tsconfig.json.backup
echo "✅ Backup de tsconfig.json creado"

# 2. Modificar tsconfig.json para eliminar vite/client
sed -i 's/"vite\/client"//g' tsconfig.json
sed -i 's/,""\]/\]/g' tsconfig.json
sed -i 's/\[\]/\["node"\]/g' tsconfig.json
echo "✅ Referencia a vite/client eliminada de tsconfig.json"

# 3. Instalar dependencias requeridas
echo "📦 Instalando dependencias necesarias..."
npm install --no-save autoprefixer tailwindcss sonner

# 4. Compilar la aplicación
echo "🔨 Compilando la aplicación..."
cd client && NODE_ENV=production SKIP_PREFLIGHT_CHECK=true TS_NODE_TRANSPILE_ONLY=true npx vite build
cd ..

# 5. Crear archivos de despliegue
echo "📝 Creando archivos de despliegue..."
node create-deployment-files.js

# 6. Restaurar el archivo tsconfig.json original
cp tsconfig.json.backup tsconfig.json
rm tsconfig.json.backup
echo "✅ tsconfig.json original restaurado"

echo "✅ ¡Proceso completado! Verifica la carpeta dist/ para los archivos de despliegue."