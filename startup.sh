#!/bin/bash

# Script de inicio para el entorno de producción de Boostify Music
# Este script automatiza el proceso de compilación y ejecución en producción

# Colores para mejor legibilidad
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

echo -e "${BLUE}=======================================${RESET}"
echo -e "${BLUE}   INICIALIZACIÓN DE BOOSTIFY MUSIC   ${RESET}"
echo -e "${BLUE}=======================================${RESET}"

# Verificar Node.js
echo -e "\n${YELLOW}Verificando versión de Node.js...${RESET}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js no está instalado${RESET}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} instalado${RESET}"

# Verificar npm
echo -e "\n${YELLOW}Verificando versión de npm...${RESET}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm no está instalado${RESET}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION} instalado${RESET}"

# Verificar variables de entorno críticas
echo -e "\n${YELLOW}Verificando variables de entorno...${RESET}"
MISSING_VARS=0

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}✗ OPENAI_API_KEY no está configurada${RESET}"
    MISSING_VARS=$((MISSING_VARS+1))
else
    echo -e "${GREEN}✓ OPENAI_API_KEY configurada${RESET}"
fi

if [ -z "$FAL_API_KEY" ]; then
    echo -e "${RED}✗ FAL_API_KEY no está configurada${RESET}"
    MISSING_VARS=$((MISSING_VARS+1))
else
    echo -e "${GREEN}✓ FAL_API_KEY configurada${RESET}"
fi

if [ $MISSING_VARS -gt 0 ]; then
    echo -e "\n${RED}Advertencia: $MISSING_VARS variables de entorno importantes no están configuradas${RESET}"
    echo -e "${YELLOW}La aplicación puede no funcionar correctamente sin estas variables.${RESET}"
    read -p "¿Desea continuar de todos modos? (s/n): " CONTINUE
    if [[ "$CONTINUE" != "s" && "$CONTINUE" != "S" ]]; then
        echo -e "${RED}Operación cancelada por el usuario${RESET}"
        exit 1
    fi
fi

# Compilar la aplicación
echo -e "\n${YELLOW}Compilando la aplicación para producción...${RESET}"
node build-for-replit.js

if [ $? -ne 0 ]; then
    echo -e "${RED}Error durante la compilación${RESET}"
    exit 1
fi

# Iniciar la aplicación
echo -e "\n${YELLOW}Iniciando la aplicación en modo producción...${RESET}"
cd dist

# Determinar el puerto
PORT=${PORT:-3000}
echo -e "${BLUE}La aplicación estará disponible en: http://localhost:${PORT}${RESET}"

# Iniciar el servidor
node server.js