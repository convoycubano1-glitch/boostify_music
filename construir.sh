#!/bin/bash

# Script simplificado para construir la aplicación usando el constructor más simple
# Este script utiliza el build-simple.js que mantiene la misma funcionalidad que en desarrollo

# Colores para terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}==========================================${NC}"
echo -e "${MAGENTA}    COMPILACIÓN SIMPLE PARA PRODUCCIÓN${NC}"
echo -e "${MAGENTA}==========================================${NC}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js no está instalado.${NC}"
  exit 1
fi

# Ejecutar script de construcción simple
echo -e "\n${YELLOW}Ejecutando script de compilación simplificado...${NC}"
node build-simple.js

# Verificar si el proceso fue exitoso
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}¡Compilación completada con éxito!${NC}"
  
  # Preguntar si quiere ejecutar la aplicación
  echo -e "\n${CYAN}¿Deseas iniciar la aplicación en modo producción? (s/n)${NC}"
  read -n 1 -r
  echo
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}Iniciando aplicación...${NC}"
    cd dist && node start.js
  else
    echo -e "${YELLOW}Para iniciar la aplicación más tarde, ejecuta:${NC}"
    echo -e "${CYAN}cd dist && node start.js${NC}"
  fi
else
  echo -e "\n${RED}Error durante la compilación.${NC}"
  echo -e "${YELLOW}Revisa los mensajes anteriores para más detalles.${NC}"
fi