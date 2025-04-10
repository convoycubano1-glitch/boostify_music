#!/bin/bash

# Script para realizar un build completo de la aplicación
echo "🔨 INICIANDO CONSTRUCCIÓN COMPLETA DE LA APLICACIÓN..."
echo "⚠️ Este proceso tomará mucho tiempo (puede ser más de 15 minutos)"
echo "⚠️ Por favor, NO INTERRUMPIR bajo ninguna circunstancia..."
echo ""

# Limpiar carpeta dist existente
if [ -d "client/dist" ]; then
  echo "🗑️ Eliminando carpeta client/dist existente..."
  rm -rf client/dist
fi

# Crear carpeta dist
mkdir -p client/dist

# Marcar inicio del proceso
echo "Build iniciado: $(date)" > build-in-progress.txt
echo "Este archivo se eliminará cuando el build se complete." >> build-in-progress.txt

# Ejecutar el build y guardar la salida en los archivos de log
echo "🔨 Compilando aplicación React (build completo)..."
echo "📢 ESTE PROCESO TOMARÁ MUCHO TIEMPO. Por favor, espere hasta que termine..."
echo "📢 El progreso se registrará en build.log"
echo ""

cd client && npx vite build > ../build.log 2> ../build-error.log

# Verificar si el build se completó correctamente
if [ $? -eq 0 ]; then
  echo "✅ CONSTRUCCIÓN COMPLETADA CON ÉXITO"
  echo "📂 Archivos generados en client/dist"

  # Actualizar start.js para usar production-server.js
  echo "// Archivo principal para iniciar el servidor de producción
console.log('Iniciando servidor en modo producción...');

// Importar y ejecutar el servidor de producción que sirve los archivos compilados
import './production-server.js';" > ../start.js

  echo "✅ Archivo start.js actualizado para usar el servidor de producción"
  
  # Eliminar archivo de progreso
  rm -f ../build-in-progress.txt
  
  echo ""
  echo "🎉 PROCESO COMPLETADO. Reinicie el servidor para ver la versión de producción."
  echo "Para reiniciar el servidor en modo producción, ejecute:"
  echo "> npm start"
else
  echo "❌ Error en la construcción. Revise los logs para más detalles."
  echo "📝 Logs disponibles en: build-error.log"
fi