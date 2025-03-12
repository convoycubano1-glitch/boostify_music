#!/bin/bash

# Script para compilar y ejecutar la aplicación en modo producción
# Este script simplifica el proceso de construcción y prueba

# Colores para terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}    CONSTRUCCIÓN Y PRUEBA DE PRODUCCIÓN   ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Paso 1: Ejecutar el script de construcción optimizado
echo -e "\n${YELLOW}Paso 1: Compilando proyecto para producción...${NC}"
node build-production-optimized.js

# Verificar si la compilación tuvo éxito
if [ $? -ne 0 ]; then
    echo -e "\n${RED}Error: La compilación falló. Abortando.${NC}"
    exit 1
fi

# Paso 2: Entrar al directorio de distribución
echo -e "\n${YELLOW}Paso 2: Navegando al directorio de distribución...${NC}"
cd dist

# Paso 3: Iniciar el servidor
echo -e "\n${YELLOW}Paso 3: Iniciando servidor de producción...${NC}"
echo -e "${GREEN}La aplicación estará disponible en http://0.0.0.0:3000${NC}\n"
node start.js

# Este script no llegará aquí a menos que el servidor se detenga
echo -e "\n${RED}El servidor ha sido detenido.${NC}"