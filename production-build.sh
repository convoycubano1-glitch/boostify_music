#!/bin/bash
# Script para compilación segura de producción
# Este script automatiza todos los pasos necesarios para preparar la aplicación para producción

# Definir colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}    PROCESO DE COMPILACIÓN PARA PRODUCCIÓN   ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Paso 1: Verificar pre-requisitos
echo -e "\n${BLUE}1. Verificando pre-requisitos...${NC}"

# Verificar Node.js y npm
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js no está instalado. Por favor instale Node.js v18+ para continuar.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $NODE_MAJOR -lt 18 ]; then
  echo -e "${RED}✗ Node.js v$NODE_VERSION no es compatible. Se requiere Node.js v18+.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js v$NODE_VERSION es compatible${NC}"

# Verificar entorno y variables críticas
echo -e "\n${BLUE}2. Ejecutando verificación pre-producción...${NC}"
node production-check.js

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ La verificación pre-producción falló. Por favor corrija los errores antes de continuar.${NC}"
  exit 1
fi

# Paso 3: Corregir errores de TypeScript
echo -e "\n${BLUE}3. Corrigiendo errores de TypeScript...${NC}"
node fix-typescript-errors.js

if [ $? -ne 0 ]; then
  echo -e "${YELLOW}⚠ La corrección de errores de TypeScript falló. Se intentará continuar de todos modos.${NC}"
fi

# Paso 4: Ejecutar compilación segura
echo -e "\n${BLUE}4. Ejecutando compilación segura...${NC}"
node secure-build.js

if [ $? -ne 0 ]; then
  echo -e "${RED}✗ La compilación segura falló.${NC}"
  exit 1
fi

echo -e "\n${GREEN}✅ Proceso de compilación para producción completado exitosamente${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "\nPara iniciar la aplicación en modo producción, ejecute:"
echo -e "${YELLOW}cd dist && node server.js${NC}"
echo -e "\nAlternativamente, puede usar PM2 para una gestión más robusta:"
echo -e "${YELLOW}cd dist && pm2 start server.js --name \"boostify-music\"${NC}"

exit 0