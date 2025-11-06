# AI Music Video Creator - Simplified Version

## Overview
Sistema simplificado para crear videos musicales con IA que permite a los usuarios subir canciones, extraer lyrics, generar scripts visuales y crear timelines con duraciones aleatorias.

## Recent Changes (November 2024)
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
- `OPENAI_API_KEY` - Para transcripción con Whisper
- `GEMINI_API_KEY` - Para generación de scripts e imágenes
- `FAL_API_KEY` - Para generación de imágenes
- `STRIPE_SECRET_KEY` - Para pagos
- `VITE_STRIPE_PUBLIC_KEY` - Para pagos (frontend)
- `DATABASE_URL` - PostgreSQL connection string

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
