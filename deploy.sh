#!/bin/bash

# Script para iniciar el despliegue en producción
echo "🚀 Preparando despliegue de Boostify Music..."

# Detectar si hay un servidor activo en el puerto 5173
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
  echo "📋 El puerto 5173 ya está en uso. Vamos a detener el proceso..."
  kill $(lsof -t -i:5173)
  echo "✅ Proceso detenido"
fi

# Iniciar el servidor Vite en el puerto 5173
echo "🌟 Iniciando Vite en puerto 5173..."
npx vite --port 5173 &

# Esperar un momento para que el servidor inicie
sleep 2

echo "✨ IMPORTANTE: Para ver la plataforma completa con todos los estilos, debes acceder al puerto 5173"
echo "   URL de la plataforma: http://localhost:5173"
echo ""
echo "El servidor está ejecutándose en segundo plano."

# Al finalizar
echo "Para detener el servidor, ejecuta: 'kill \$(lsof -t -i:5173)'"