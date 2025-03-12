#!/bin/bash
# Script para corregir importaciones en client/src/pages/course-detail.tsx

# Reemplazar importaciones dinámicas
sed -i -e 's#import(../lib/api/fal-ai)#import("../lib/api/fal-ai")#g' client/src/pages/course-detail.tsx

# Verificar el resultado
echo "Verificando el contenido actualizado:"
grep -n "import" client/src/pages/course-detail.tsx | grep "fal-ai"
