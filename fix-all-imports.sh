#!/bin/bash
# Script para corregir todas las importaciones dinámicas en los archivos clave

# 1. Corregir importaciones dinámicas de Firebase en ai-agents.tsx
echo "Corrigiendo importaciones en ai-agents.tsx..."
sed -i 's|import(.../../lib/firebase.)|import("../firebase")|g' client/src/pages/ai-agents.tsx

# 2. Corregir importaciones dinámicas de APIs en ai-agents.tsx
echo "Corrigiendo importaciones de APIs en ai-agents.tsx..."
sed -i 's|import(.../../lib/api/openrouteraiagents.)|import("../lib/api/openrouteraiagents")|g' client/src/pages/ai-agents.tsx

# 3. Corregir importaciones dinámicas de FAL AI en course-detail.tsx
echo "Corrigiendo importaciones en course-detail.tsx..."
sed -i 's|import(.../../lib/api/fal-ai.)|import("../lib/api/fal-ai")|g' client/src/pages/course-detail.tsx
sed -i 's|import(../lib/api/fal-ai)|import("../lib/api/fal-ai")|g' client/src/pages/course-detail.tsx

# 4. Verificar las correcciones
echo "Verificando correcciones:"
echo "ai-agents.tsx:"
grep -n "import.*firebase" client/src/pages/ai-agents.tsx
grep -n "openrouteraiagents" client/src/pages/ai-agents.tsx

echo "course-detail.tsx:"
grep -n "import.*fal-ai" client/src/pages/course-detail.tsx

echo "Script de corrección completado."