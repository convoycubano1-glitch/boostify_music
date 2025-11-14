# AI Music Video Creator - Simplified Version

## Overview
Sistema simplificado para crear videos musicales con IA que permite a los usuarios subir canciones, extraer lyrics, generar scripts visuales y crear timelines con duraciones aleatorias.

**URL de Producción**: https://boostify.replit.app

## Recent Changes (November 2024)

### ✂️ Mejora Timeline: Resize/Stretch de Clips Estilo CapCut (LATEST)
**Fecha**: 14 de Noviembre, 2024
**Objetivo**: Implementar funcionalidad de estirar/alargar clips como en CapCut

**Mejoras implementadas**:
1. ✅ **Botón Trim Tool agregado a la toolbar**:
   - Nuevo botón con icono de flechas ↔️ (ArrowLeftRight)
   - Atajo de teclado: Tecla `T`
   - Ubicado entre Select y Razor tools

2. ✅ **Resize mejorado en modo Select** (estilo CapCut):
   - Ahora puedes estirar clips SIN cambiar a Trim tool
   - Simplemente arrastra las manijas (handles) de los bordes
   - Funciona exactamente como CapCut/Premiere Pro
   - El cursor cambia a `↔` cuando estás sobre las manijas

3. ✅ **Manijas visuales mejoradas**:
   - Más anchas y visibles (11px en móvil, 3px en desktop)
   - Color naranja cuando seleccionadas
   - Indicador visual con línea blanca en el centro
   - Feedback táctil en dispositivos móviles

**Cómo usar**:
- **Modo Select (V)**: Arrastra el centro para mover, arrastra los bordes para estirar
- **Modo Trim (T)**: Todo el clip es redimensionable, detecta automáticamente qué borde estirar
- **Funciona con snap**: El resize respeta los puntos de snap (beats, markers, grid)

**Archivos modificados**:
- `client/src/components/music-video/TimelineEditor.tsx` - Lógica de resize y toolbar

### 🔐 Restauración de Early Access Modal + Fix de Login en Dispositivos
**Fecha**: 14 de Noviembre, 2024
**Objetivo**: Solucionar problemas de login en dispositivos y restaurar modal de Early Access

**Problemas identificados y solucionados**:
1. ✅ **Error "Unable to verify that the app domain is authorized"**:
   - Causa: Dominios de Replit no autorizados en Firebase Console
   - Solución: Documentación completa de cómo agregar dominios autorizados
   - Ubicación: Ver sección "Firebase Authentication Configuration" en este archivo

2. ✅ **Modal de Early Access no aparecía**:
   - Restaurado en homepage (`client/src/pages/home.tsx`)
   - Aparece automáticamente después de 3 segundos
   - Solo para usuarios NO logueados
   - Permite registro rápido sin login completo

3. ✅ **Login con Google funcionando**:
   - Botón "Get Started" usa `authService.signInWithGoogle()`
   - Incluye icono de Google para claridad
   - Manejo automático de popup/redirect según dispositivo
   - Móviles usan redirect (más confiable)
   - Desktop usa popup (mejor UX)

**Cambios técnicos**:
- `client/src/pages/home.tsx`:
  - Import de `EarlyAccessModal`
  - Estado `showEarlyAccessModal`
  - useEffect para mostrar modal después de 3s
  - Componente `<EarlyAccessModal />` agregado al JSX

**Configuración requerida** (Firebase Console):
- Agregar dominios autorizados: `replit.app`, `replit.dev`, `boostify.replit.app`
- Ver instrucciones detalladas en sección "Firebase Authentication Configuration"

**Notas**:
- El sistema YA tiene Google Sign-In implementado
- El problema principal es de configuración (dominios), no de código
- El modal de Early Access es para capturar leads rápidamente

### ✅ Flujo Secuencial de Transcripción → Generación de Conceptos
**Fecha**: 14 de Noviembre, 2024
**Objetivo**: Asegurar que los conceptos se generen DESPUÉS de analizar la letra de la canción

**Problema resuelto**:
- El director ahora SIEMPRE genera las 3 propuestas de guiones DESPUÉS de completar la transcripción de la canción
- Los conceptos tienen contexto completo de la letra antes de ser generados
- Mensajes de progreso claros muestran la secuencia: "Analyzing lyrics..." → "Generating proposals..."

**Cambios implementados**:
1. ✅ **Loading states mejorados**:
   - "🎵 Step 1/2: Analyzing song lyrics to understand the context..."
   - "✅ Lyrics analyzed! Now generating creative proposals..."
   - "🎬 Step 2/2: Generating 3 creative proposals based on your lyrics..."

2. ✅ **Logs de debugging**:
   - Console logs muestran cuando la transcripción está disponible
   - Logs confirman que `generateThreeConceptProposals` recibe la letra completa
   - Verificación del contexto: `[LYRICS CONTEXT] Letra disponible: ...`

3. ✅ **Flujo garantizado**:
   ```
   Usuario selecciona director →
   Transcribir canción PRIMERO (con progress bar) →
   Generar master character (si hay fotos) →
   Generar 3 conceptos CON contexto de letra →
   Mostrar propuestas al usuario
   ```

**Archivos modificados**:
- `client/src/components/music-video/music-video-ai.tsx`: 
  - `handleDirectorSelection()`: Mensajes de progreso mejorados
  - `handleGenerateConcepts()`: Logs de verificación de contexto
  - `generateConceptProposals()`: Validación de transcripción disponible

**Beneficio**:
- 🎯 Propuestas 100% coherentes con la historia de la canción
- 📝 Director tiene contexto completo antes de crear conceptos
- 🔍 UX clara mostrando cada paso del proceso

### 🎬 Timeline con Timings Perfectos + Guardar/Cargar Proyectos
**Fecha**: 13 de Noviembre, 2024
**Objetivo**: Sincronización perfecta con música y gestión de proyectos

**Funcionalidades implementadas**:
1. ✅ **Timings Perfectos del Script**:
   - El timeline respeta exactamente los `start_time` y `duration` del JSON del script
   - Función `adjustSceneDurations` ajusta las duraciones para encajar perfectamente en la duración total
   - Cada escena se posiciona exactamente donde debe estar según la música
   - Console logs muestran los timings exactos: `🎬 Creating clip X: start=Xs, duration=Xs`

2. ✅ **Guardar/Cargar Proyectos en Timeline**:
   - **Input de nombre de proyecto** en el toolbar del timeline
   - **Botón "Save"** (icono Save) para guardar el proyecto actual
   - **Botón "Load"** (icono FolderOpen) para abrir diálogo de proyectos guardados
   - **Diálogo de carga** muestra lista de todos los proyectos del usuario con:
     - Nombre del proyecto
     - Status (completed, generating_images, draft)
     - Progreso de imágenes y videos
     - Fecha de última actualización
   - Los proyectos guardados mantienen todos los timings exactos del timeline

3. ✅ **Botones de Regenerar Imagen y Generar Video**:
   - **Botón "Regenerar Imagen"** (morado) sobre cada imagen
   - **Botón "Generar Video"** (azul) sobre cada imagen
   - Botones semi-transparentes siempre visibles para dispositivos táctiles

**Flujo de trabajo**:
1. Usuario crea proyecto: Concepto → Script → Timeline → Imágenes
2. Timings del timeline se sincronizan perfectamente con la música
3. Usuario puede guardar el proyecto con nombre personalizado
4. Usuario puede cargar proyectos previos desde el timeline
5. Usuario puede regenerar imágenes o generar videos de escenas específicas

**Archivos modificados**:
- `client/src/components/music-video/TimelineEditor.tsx`: UI de guardar/cargar proyectos
- `client/src/components/music-video/music-video-ai.tsx`: Props y diálogo de carga de proyectos
- `client/src/lib/api/music-video-generator.ts`: Función adjustSceneDurations para timings perfectos

## Recent Changes (November 2024)

### 🚀 Corrección Completa de Deployment Cloud Run (LATEST)
**Fecha**: 12 de Noviembre, 2024
**Objetivo**: Solucionar todos los problemas de deployment para Cloud Run en producción

**Problemas resueltos**:
1. ✅ **Detección automática de deployment**: 
   - Servidor detecta `REPLIT_DEPLOYMENT=1` (variable oficial de Replit)
   - Modo development local / production en deployment automático
   - Fuerza development mode en local, ignora NODE_ENV del sistema

2. ✅ **Sesiones stateless para Cloud Run**:
   - Reemplazado `express-session` con `cookie-session`
   - Eliminado MemoryStore que causaba crash loops
   - Todas las sesiones almacenadas en cookies encriptadas
   - Compatible con múltiples instancias de Cloud Run

3. ✅ **Build process verificado**:
   - Build genera correctamente `dist/client/` con todos los assets
   - Servidor sirve desde la ruta correcta en producción
   - Archivos estáticos accesibles sin errores 404

**Cómo funciona**:
1. **En local**: Servidor detecta ausencia de `REPLIT_DEPLOYMENT` y usa modo development
2. **En deployment**: Replit establece `REPLIT_DEPLOYMENT=1` automáticamente, servidor usa modo production
3. **Sin configuración manual**: No necesitas establecer NODE_ENV manualmente

**Archivos modificados**:
- `server/index.ts`: Detección de REPLIT_DEPLOYMENT (variable oficial)
- `server/auth.ts`: Migrado a cookie-session para stateless sessions
- `server/routes.ts`: Eliminada configuración duplicada de express-session
- `build-for-deploy.js`: Genera dist/client correctamente
- `package.json`: Agregado cookie-session como dependencia

**Variables de entorno necesarias** (configurar en Replit Secrets):
- `SESSION_SECRET`: Clave secreta para encriptar cookies de sesión
- `OPENAI_API_KEY`: API key de OpenAI
- `FAL_API_KEY`: API key de Fal.ai
- Firebase credentials: Ya configurados en FIREBASE_CONFIG

**NO necesitas configurar**: `NODE_ENV` ni `REPLIT_DEPLOYMENT` - se detectan automáticamente

### 🛍️ Generación de Productos con IA + Branding Boostify
**Fecha**: 11 de Noviembre, 2024
**Objetivo**: Generar productos de merchandise con imágenes únicas usando IA y branding de Boostify

**Cambios implementados**:
1. ✅ **Generación de imágenes únicas por producto**:
   - Cada producto ahora tiene una imagen única generada con IA
   - Prompts específicos para cada tipo (T-Shirt, Hoodie, Cap, Poster, Stickers, Vinyl)
   - Incluyen branding de Boostify (colores naranja y negro)
   - Estilo profesional de fotografía de producto

2. ✅ **Botón en Editar Perfil**:
   - Nueva sección "Merchandise" en el diálogo de edición
   - Botón "Generar Productos con IA" con diseño atractivo
   - Genera automáticamente 6 productos con imágenes únicas
   - Estado de carga mientras se generan las imágenes

3. ✅ **Preparación para Printful**:
   - Nota visible sobre integración futura con Printful
   - Estructura de productos compatible con print-on-demand
   - Tallas configuradas para producción física

**Beneficios**:
- 🎨 Cada producto tiene una imagen profesional y única
- 🏷️ Branding consistente de Boostify en todos los productos
- ⚡ Generación automática en segundos
- 🔮 Preparado para integración con Printful

### 🎤 Gestión de Shows + Limpieza de UI
**Fecha**: 11 de Noviembre, 2024
**Objetivo**: Permitir a los artistas gestionar sus shows y eliminar secciones duplicadas

**Cambios implementados**:
1. ✅ **Sistema de gestión de shows**:
   - Formulario en "Editar Perfil" para agregar shows
   - Campos: Nombre del lugar, fecha/hora, ubicación, URL de tickets (opcional)
   - Guardado en Firebase colección `shows`
   - Opción para eliminar shows existentes
   - Vista previa de todos los shows programados

2. ✅ **Visualización de shows en el perfil**:
   - Sección "Upcoming Shows" ahora muestra shows reales
   - Ordenados por fecha (más próximos primero)
   - Formato de fecha y hora localizado
   - Botón de "Tickets" si hay URL disponible
   - Estado vacío cuando no hay shows

3. ✅ **Limpieza de UI**:
   - Eliminada sección "Bio" duplicada (la biografía ya aparece arriba)
   - Interfaz más limpia y organizada

**Beneficios**:
- 🎸 Los artistas pueden promocionar sus presentaciones en vivo
- 🎫 Enlaces directos para compra de tickets
- 📅 Gestión fácil desde el perfil
- ✨ UI más limpia sin duplicación de información

### 🎯 Control Deslizante de Posición del Banner + URLs Únicas de Artista
**Fecha**: 11 de Noviembre, 2024
**Objetivo**: Mejorar precisión en el ajuste del banner y crear URLs compartibles para cada artista

**Cambios implementados**:
1. ✅ **Slider de posición del banner** (0-100%):
   - Control deslizante interactivo para ajuste preciso de posición vertical
   - Almacenado como porcentaje numérico (0-100) en Firebase
   - Convertido a CSS `object-position: center {valor}%`
   - Preview en tiempo real mientras se ajusta
   - Estilos CSS personalizados para el slider con efectos hover

2. ✅ **Sistema de slugs únicos**:
   - Campo `slug` agregado al perfil del artista en Firebase
   - Auto-generación desde `displayName` (ejemplo: "DJ Antonio" → "dj-antonio")
   - Editable manualmente por el artista
   - Guardado en Firebase junto con otros datos del perfil
   - URLs del formato: `https://boostify.replit.app/artist/dj-antonio`
   - Búsqueda en `/artist/:slug` mediante query en Firebase por campo `slug`
   - URLs dinámicas usando `window.location.origin` (funcionan en dev y producción)

3. ✅ **UI mejorada para slugs**:
   - Sección destacada con diseño visual en el diálogo de edición
   - Preview de la URL completa en tiempo real
   - Indicador visual cuando el slug es válido
   - Generación automática al cambiar el nombre artístico

4. ✅ **Aplicación en el perfil público**:
   - Banner usa `object-position: center {bannerPosition}%`
   - Permite ajuste preciso desde el borde superior (0%) hasta el inferior (100%)
   - Transición suave con CSS transitions

**Beneficios**:
- 🎯 Control preciso sobre posición del banner (0-100%)
- 🔗 URLs compartibles y personalizadas para cada artista
- ✨ Auto-generación inteligente de slugs
- 📱 Preview inmediato de la URL final
- 🎨 Estilos visuales atractivos para el slider
- 📲 QR Code actualizado automáticamente con el slug del artista
- 🌐 Funciona en desarrollo y producción usando URLs dinámicas

### 📸 Subida Directa de Imágenes de Perfil y Banner
**Fecha**: 11 de Noviembre, 2024
**Objetivo**: Permitir subir imágenes JPG/PNG directamente desde dispositivos móviles (iPhone) además de generar con IA

**Cambios implementados**:
1. ✅ Funciones de subida directa en `edit-profile-dialog.tsx`:
   - `handleUploadProfileImage()` - Sube imagen de perfil a Firebase Storage
   - `handleUploadBannerImage()` - Sube imagen de banner a Firebase Storage
   - Soporte para formatos: JPG, JPEG, PNG, WEBP, HEIC (compatible con iPhone)

2. ✅ UI mejorada con doble opción:
   - Botón "Subir" - Para subir archivo desde dispositivo
   - Botón "IA" - Para generar imagen con Gemini AI
   - Ambas opciones disponibles sin eliminar ninguna funcionalidad existente

3. ✅ Optimización mobile-first completa:
   - Grid de productos adaptativo (2 columnas en móvil, responsive en desktop)
   - Botones de compra con texto condensado en móviles
   - Header optimizado con tamaños adaptativos
   - Alturas de hero banner responsive (h-72 en móvil → h-96 en desktop)

4. ✅ Prompts mejorados para imágenes de productos:
   - Cada tipo de producto (T-Shirt, Hoodie, Cap, Poster, Sticker Pack, Vinyl) tiene prompts únicos
   - Detalles específicos de colores, ángulos, materiales y estilos fotográficos
   - Mayor variedad y realismo en las imágenes generadas

**Compatibilidad móvil**:
- ✅ iPhone: Soporta HEIC, HEIF, JPG, PNG desde Photos
- ✅ Android: JPG, PNG, WEBP
- ✅ Responsive design 100% en todas las pantallas

### 🎨 Concepto-Primero con Referencias Visuales
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

### 🔐 Firebase Authentication Configuration (IMPORTANT!)

#### Problema: "Unable to verify that the app domain is authorized"
Este error ocurre cuando el dominio de tu aplicación NO está autorizado en Firebase Console.

#### Solución - Configurar Dominios Autorizados:

1. **Ir a Firebase Console**: https://console.firebase.google.com
2. **Seleccionar tu proyecto**: Boostify (o el nombre de tu proyecto)
3. **Navegar a Authentication**:
   - En el menú lateral, click en "Authentication"
   - Click en la pestaña "Settings"
   - Scroll hasta "Authorized domains"

4. **Agregar dominios de Replit**:
   ```
   replit.app
   replit.dev
   replit.co
   [tu-username].repl.co
   [tu-repl-name].[tu-username].repl.co
   ```

5. **Agregar dominios específicos de tu aplicación**:
   - Click en "Add domain"
   - Agregar uno por uno:
     - `boostify.replit.app` (tu dominio de producción)
     - `*.replit.dev` (para desarrollo)
     - `localhost` (para desarrollo local)

6. **Guardar cambios** y esperar 1-2 minutos para que se propaguen

#### Verificar que funciona:
- Abrir la app en el navegador
- Click en "Get Started" o cualquier botón de login
- El popup de Google debería aparecer sin errores
- Si estás en móvil, usará redirect automáticamente

#### Notas adicionales:
- **El botón "Get Started" YA tiene Google Sign-In** con el icono de Google
- **El modal de Early Access** ahora aparece automáticamente después de 3 segundos (solo para usuarios NO logueados)
- **En móviles** (iOS/Android): El sistema usa `signInWithRedirect` automáticamente porque los popups no funcionan bien
- **En desktop**: Usa `signInWithPopup` para mejor experiencia de usuario

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
