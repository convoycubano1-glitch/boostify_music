#!/bin/bash

# Script para ejecutar la extracción de artistas generados
# Opciones disponibles:
# --stats: Muestra estadísticas generales
# --details: Muestra detalles básicos de cada artista
# --full: Muestra todos los detalles de cada artista
# --id=<id>: Muestra detalles de un artista específico
# --limit=<num>: Limita el número de artistas a extraer

# Ejecutar script de extracción
echo "Ejecutando extracción de artistas..."
npx tsx scripts/extract-generated-artists.ts "$@"