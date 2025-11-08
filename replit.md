# AI Music Video Creator - Simplified Version

## Overview
Sistema simplificado para crear videos musicales con IA que permite a los usuarios subir canciones, extraer lyrics, generar scripts visuales y crear timelines con duraciones aleatorias.

## Recent Changes (November 2024)

### 🎨 Concepto-Primero con Referencias Visuales (LATEST)
**Fecha**: 8 de Noviembre, 2024
**Objetivo**: Mejorar coherencia visual del script JSON generando concepto narrativo ANTES de las escenas

**Cambios implementados**:
1. ✅ Nueva función `generateMusicVideoConcept()` en `openrouter.fixed.ts`
   - Genera concepto visual completo ANTES del script
   - Incluye: historia/narrativa, tema visual, progresión de mood
   - Define vestuario principal del artista (outfit, colores, accesorios, hair/makeup)
   - Especifica 2-3 locaciones principales con descripciones detalladas
   - Establece paleta de colores coherente
   - Identifica elementos visuales recurrentes
   - Planifica momentos narrativos clave

2. ✅ Schema expandido `MusicVideoConcept` en `music-video-scene.ts`
   - `story_concept`: Narrativa completa del video
   - `main_wardrobe`: Vestuario detallado del artista
   - `locations`: Array de locaciones con mood y uso
   - `color_palette`: Colores primarios y de acento
   - `recurring_visual_elements`: Elementos que se repiten
   - `key_narrative_moments`: Momentos importantes con timestamps

3. ✅ Schema `MusicVideoScene` mejorado con:
   - `wardrobe`: Objeto con descripción completa de outfit en cada escena
   - `visual_references`: Sistema para referenciar escenas previas
     - `reference_scene_ids`: IDs de escenas anteriores para mantener consistencia
     - `key_visual_elements`: Elementos visuales a mantener
     - `color_continuity`: Descripción de continuidad de color

4. ✅ Prompt de Gemini actualizado para:
   - Usar el concepto como base para todas las escenas
   - Mantener vestuario consistente en TODAS las escenas de performance
   - Referenciar escenas anteriores para coherencia visual
   - Incluir detalles específicos de outfit, accesorios, hair/makeup
   - Sistema de referencias: escenas posteriores referencian IDs de escenas anteriores

**Workflow mejorado**:
```
Upload Audio → Transcribe Lyrics → 
  ↓
🆕 Generate Concept (historia, vestuario, locaciones, paleta) →
  ↓
Generate Script JSON (con concepto como base) →
  → Escenas incluyen wardrobe details y visual_references
  → Mayor coherencia entre escenas
  ↓
Add to Timeline → Generate Images (usando referencias previas) → Export Video
```

**Beneficios**:
- ✨ Vestuario consistente en todas las escenas de performance
- ✨ Narrativa coherente desde el inicio hasta el final
- ✨ Referencias a escenas anteriores para continuidad visual
- ✨ Paleta de colores unificada
- ✨ Mejor calidad JSON al tener plan visual claro
- ✨ Sistema preparado para usar imágenes generadas como referencias en escenas siguientes

### Major Simplification
**Fecha**: 6 de Noviembre, 2024
**Razón**: El usuario reportó que el proyecto era demasiado complejo y "nada funcionaba correctamente"

**Cambios implementados**:
1. ✅ Eliminado completamente el sistema de Beat Synchronization (~540 líneas de código)
   - Archivo `beat-synchronization-panel.tsx` eliminado
   - Funciones de detección de beats eliminadas (`detectBeatsAndCreateSegments`, `generateBeatsJSON`, `downloadBeatsJSON`)
   - Estados relacionados eliminados (`beatsData`, `syncOptions`, `beatsDurations`, `beatsJsonData`, `showBeatDetails`, `selectedBeatIndex`)
   - UI de sincronización de beats eliminada del componente principal

2. ✅ Simplificado `openrouter.fixed.ts`:
   - Parámetro `beatsDurations` eliminado de `generateMusicVideoScript`
   - Función `generateDurationsFromBeats` eliminada
   - `generarGuionFallback` ahora solo genera duraciones aleatorias (2-6 segundos)

3. ✅ Workflow simplificado:
   ```
   Upload Audio → Transcribe Lyrics → Generate JSON Script (random durations) 
   → Add to Timeline → Modify Editing Style → Export Video
   ```

## Project Architecture

### Frontend
- **Framework**: React + TypeScript + Vite
- **Routing**: wouter
- **UI**: shadcn/ui + Tailwind CSS
- **Estado**: React Query para data fetching

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle

### Key Components
- `client/src/components/music-video/music-video-ai.tsx` - Componente principal simplificado
- `client/src/lib/api/openrouter.fixed.ts` - Generación de scripts con Gemini
- `client/src/lib/api/gemini-image.ts` - Generación de imágenes con Gemini
- `client/src/components/music-video/TimelineEditor.tsx` - Editor de timeline

### Core Features
1. **Audio Upload**: Subir archivos de audio
2. **Transcription**: Extraer lyrics usando OpenAI Whisper
3. **Script Generation**: Generar guiones visuales con Gemini 2.5 Flash
   - Duraciones aleatorias 2-6 segundos basadas en estilo de edición
   - Soporte para hasta 3 imágenes de referencia facial
   - Balance 50/50 entre escenas de performance y B-roll
4. **Timeline Editor**: Crear y modificar timeline de video
5. **Image Generation**: Generar imágenes para cada escena
6. **Video Export**: Convertir timeline a video

### Removed Features
- ❌ Beat Synchronization Panel
- ❌ Beat Detection System
- ❌ BPM Analysis
- ❌ Beat-based Duration Calculation
- ❌ Beat Visualization Graphs
- ❌ Timecodes JSON Export

## User Preferences
- **Simplicidad**: El usuario prefiere workflows simples y directos
- **Funcionalidad básica**: Priorizar funciones core sobre features avanzadas
- **Estabilidad**: Asegurar que las funciones implementadas funcionen correctamente antes de agregar nuevas

## Environment Variables

### Backend API Keys (Replit Secrets - Required for Production)
Estas variables DEBEN estar configuradas en Replit Secrets para funcionar en producción:
- `OPENAI_API_KEY2` - Para transcripción de audio con Whisper (debe empezar con sk-proj- o sk-)
- `GEMINI_API_KEY` - Para generación de scripts e imágenes con Gemini
- `FAL_API_KEY` - Para generación de imágenes (usado en frontend también como VITE_FAL_API_KEY)
- `STRIPE_SECRET_KEY` - Para procesamiento de pagos
- `DATABASE_URL` - PostgreSQL connection string (auto-configurado)

### Frontend API Keys (Variables de entorno con prefijo VITE_)
- `VITE_STRIPE_PUBLIC_KEY` - Clave pública de Stripe para el frontend
- `VITE_FAL_API_KEY` - API key de Fal.ai para generación de imágenes

### Configuración para Producción (Deployment)
⚠️ **IMPORTANTE**: Cuando despliegues la app (Publish), asegúrate de que:
1. Todas las API keys estén configuradas en **Replit Secrets** (icono de candado en la barra lateral)
2. Las keys sean las mismas que usas en desarrollo
3. La key de OpenAI sea válida y tenga créditos disponibles
4. Reinicia el deployment después de actualizar los Secrets

### Solución de Problemas
- **Error 401 en transcripción**: Verifica que `OPENAI_API_KEY2` esté configurada en Secrets
- **API key works in dev but not in production**: Asegúrate de que los Secrets estén sincronizados con `OPENAI_API_KEY2`
- **Formatos de archivo no soportados**: La app ahora soporta todos los formatos de iPhone (HEIC, HEIF, M4A, CAF, etc.)

## Running the Project
```bash
npm run dev  # Inicia servidor Express + Vite
```

## Database Migrations
```bash
npm run db:push         # Push schema changes to database
npm run db:push --force # Force push (in case of data-loss warnings)
```

## Important Notes
- **NO** usar beat synchronization - ha sido completamente eliminado
- Las duraciones de las escenas se generan SOLO de forma aleatoria en el JSON
- El timeline lee duraciones directamente del JSON generado
- No hay fallback a detección de beats en ninguna parte del código
