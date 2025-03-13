#!/bin/bash

# Script para añadir importación de React a archivos .tsx y .jsx que lo necesiten
echo "Buscando archivos .tsx que usan JSX pero no importan React..."

# Función para procesar un archivo
process_file() {
  local file=$1
  
  # Verificar si el archivo ya importa React
  if grep -q "import React" "$file"; then
    echo "✓ $file ya importa React"
    return
  fi
  
  # Verificar si el archivo usa JSX (buscar patrones comunes de JSX como <div, <span, etc.)
  if grep -q "<[a-zA-Z][^>]*>" "$file"; then
    echo "⚙️ Añadiendo importación de React a $file"
    
    # Crear un archivo temporal
    tmp_file=$(mktemp)
    
    # Añadir importación de React al principio del archivo
    echo 'import React from "react";' > "$tmp_file"
    cat "$file" >> "$tmp_file"
    
    # Reemplazar el archivo original
    mv "$tmp_file" "$file"
    echo "✅ Actualizado $file"
  else
    echo "- $file no parece usar JSX, ignorando"
  fi
}

# Encontrar todos los archivos .tsx y .jsx y procesarlos
find ./client/src -type f \( -name "*.tsx" -o -name "*.jsx" \) | while read file; do
  process_file "$file"
done

echo "Proceso completado. Recuerda reiniciar la aplicación para aplicar los cambios."