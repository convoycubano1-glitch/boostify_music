# AI Music Video Creator - Simplified Version

## Overview
Sistema simplificado para crear videos musicales con IA que permite a los usuarios subir canciones, extraer lyrics, generar scripts visuales y crear timelines con duraciones aleatorias.

**URL de Producción**: https://boostify.replit.app

## ⚠️ AUTHENTICATION ARCHITECTURE

**IMPORTANTE**: Este proyecto usa **Replit Auth** (OpenID Connect), NO Firebase Auth.

### Middleware Correcto por Caso de Uso:
1. **Para endpoints de autenticación de usuario** → Use `isAuthenticated` de `server/replitAuth.ts`
   - Ejemplo: `/api/artist-generator/my-artists`
   - Este middleware verifica sesiones de Replit Auth
   - `req.user.id` contiene el user ID (número)

2. **Para endpoints que necesitan validación Firebase** → Use `authenticate` de `server/middleware/auth.ts`
   - Solo para casos específicos donde se valida token Firebase
   - `req.user.uid` contiene el Firebase UID (string)

### User Object Structure (Replit Auth):
```typescript
req.user = {
  id: number,           // PostgreSQL user ID
  replitId: string,     // Replit user ID
  email: string,
  firstName: string,
  lastName: string,
  role: string
}
```

### Bug Fix Pattern - November 16, 2024:
❌ **INCORRECTO**: `import { authenticate } from '../middleware/auth'`
✅ **CORRECTO**: `import { isAuthenticated } from '../replitAuth'`

## Recent Changes (November 2024)

### 🎬 YouTube Growth Tools - SISTEMA COMPLETO (3 FASES COMPLETADAS)

## 📊 RESUMEN EJECUTIVO

**Total Features:** 12 herramientas completas
**Total Endpoints:** 19 endpoints funcionales
**AI Stack:** Gemini AI + FAL AI + Apify
**Subscription Tiers:** FREE, CREATOR ($59.99), PRO ($99.99), ENTERPRISE ($149.99)

### 🎯 DISTRIBUCIÓN POR TIER:

| Tier | Precio | Features | Mejor Para | Valor |
|------|--------|----------|------------|-------|
| **FREE** | $0 | 5 análisis demo | Probar plataforma | $0 |
| **CREATOR** | $59.99/mo | 4 básicas (FASE 1) | YouTubers individuales | ~$200/mo |
| **PRO** | $99.99/mo | 8 avanzadas (FASE 1+2) | Creadores serios | ~$500/mo |
| **ENTERPRISE** | $149.99/mo | 12 TODAS unlimited | Agencias/Equipos | $2,000+/mo |

**FASE 1 (CREATOR):** Pre-Launch Score, Keywords, Title Analyzer, Content Ideas
**FASE 2 (PRO):** + Thumbnail AI, Competitor Analysis, Trend Predictor, Transcript Extractor
**FASE 3 (ENTERPRISE):** + Multi-Channel Tracking, Content Calendar AI, Auto-Optimization, API Access

---

### 🎬 YouTube Growth Tools - FASE 1: Quick Wins Creator
**Fecha**: 16 de Noviembre, 2024
**Objetivo**: Implementar herramientas de optimización de YouTube usando Gemini AI + Apify scraping

**Funcionalidades implementadas (FASE 1 - Quick Wins Creator)**:
1. ✅ **Pre-Launch Score** (`POST /api/youtube/pre-launch-score`):
   - Predice el éxito de un video ANTES de publicar (score 0-100)
   - Usa Apify para scraping de videos top en el nicho
   - Gemini AI analiza patrones y genera score predictivo
   - Incluye: fortalezas, debilidades, recomendaciones
   - Estimación de vistas (7 días / 30 días)

2. ✅ **Keywords Generator** (`POST /api/youtube/generate-keywords`):
   - Genera keywords optimizados basados en datos reales de YouTube
   - Apify extrae tags trending del nicho
   - Gemini AI optimiza keywords con análisis de dificultad
   - Métricas: relevancia (1-10), competencia, búsquedas estimadas
   - Código de dificultad: easy (verde), medium (amarillo), hard (rojo)

3. ✅ **Title Analyzer** (`POST /api/youtube/analyze-title`):
   - Analiza y optimiza títulos de videos
   - Scores: Overall, CTR, SEO, Emotional (0-100 cada uno)
   - Identifica fortalezas y debilidades del título
   - Genera 3 títulos alternativos mejorados
   - Sugerencias específicas de optimización

4. ✅ **Content Ideas Generator** (`POST /api/youtube/content-ideas`):
   - Descubre gaps de contenido en tu nicho
   - Scraping de 20+ videos populares con Apify
   - Gemini AI identifica oportunidades no explotadas
   - Genera ideas completas: título, descripción, keywords, hook
   - Estimación de vistas y dificultad por idea
   - Detecta subtemas trending

**Subscription Limits por Plan**:
```typescript
FREE: Pre-Launch (5/mes), Keywords (5/mes), Title (5/mes), Ideas (0)
CREATOR ($59.99): Pre-Launch (20/mes), Keywords (50/mes), Title (20/mes), Ideas (20/mes)
PRO ($99.99): Pre-Launch (100/mes), Keywords (100/mes), Title (100/mes), Ideas (50/mes)
ENTERPRISE ($149.99): UNLIMITED en todas las herramientas
```

**Tecnologías Usadas**:
- **Gemini AI** (gemini-2.0-flash-exp): Análisis y generación de contenido
- **Apify Client**: Scraping de YouTube con actor `streamers/youtube-scraper`
- **Firebase Firestore**: Tracking de usage limits por usuario/feature
- **TypeScript**: Full-stack type safety

**Frontend Components** (`client/src/pages/youtube-views.tsx`):
- 4 tabs interactivos con resultados en tiempo real
- Animaciones con Framer Motion
- Copy-to-clipboard para keywords y títulos
- Scores visuales con código de colores
- Badges para dificultad y competencia
- Diseño responsive (mobile-first)

**Archivos principales**:
- `server/routes/youtube-tools.ts` - Backend endpoints con Gemini + Apify
- `client/src/pages/youtube-views.tsx` - Frontend completo
- `server/routes.ts` - Registro de rutas `/api/youtube/*`

### 🎬 YouTube Growth Tools - FASE 2: Pro Differentiators (LATEST)
**Fecha**: 16 de Noviembre, 2024
**Objetivo**: Funcionalidades PRO que justifican upgrade - herramientas avanzadas con Gemini AI + FAL AI

**Funcionalidades implementadas (FASE 2 - Pro Features)**:
1. ✅ **Thumbnail Generator** (`POST /api/youtube/generate-thumbnail`):
   - Gemini AI genera 3 prompts optimizados para thumbnails
   - FAL AI genera imágenes reales (landscape 16:9)
   - Incluye: CTR score predicho, texto sugerido, razón
   - Límite: 30/mes (Pro), UNLIMITED (Enterprise)
   - Usa FAL_KEY para generación de imágenes

2. ✅ **Competitor Deep Analysis** (`POST /api/youtube/analyze-competitor`):
   - Scraping de 30 videos del competidor con Apify
   - Gemini AI analiza estrategia de contenido
   - Descubre: mejores temas, frecuencia upload, gaps explotables
   - Insights: días/horarios óptimos, debilidades, oportunidades
   - Límite: 20 canales/mes (Pro), UNLIMITED (Enterprise)

3. ✅ **Trend Predictor** (`POST /api/youtube/predict-trends`):
   - Detecta trends ANTES de que exploten (últimos 7 días)
   - Scraping de 40+ videos trending en el nicho
   - Gemini AI identifica patrones emergentes
   - Para cada trend: confianza (0-100), tiempo para actuar, keywords
   - Competition level: low/medium/high
   - Límite: Diario (Pro & Enterprise)

4. ✅ **Transcript Extractor** (`POST /api/youtube/extract-transcript`):
   - Extrae transcript del video (simulado - requiere YouTube API)
   - Gemini AI identifica momentos virales para Shorts
   - Sugiere: timestamps, duración, hook, título para cada Short
   - Viral score (0-100) por cada clip
   - Límite: 50 videos/mes (Pro), UNLIMITED (Enterprise)

**Subscription Limits FASE 2**:
```typescript
FREE/CREATOR: Todas las features PRO BLOQUEADAS (0 usos)
PRO ($99.99):
  - Thumbnail Generator: 30/mes
  - Competitor Analysis: 20/mes
  - Trend Predictor: DAILY
  - Transcript Extractor: 50/mes
ENTERPRISE ($149.99): UNLIMITED en todas
```

**Tecnologías Agregadas**:
- **FAL AI** (`fal-ai/flux/schnell`): Generación de imágenes para thumbnails
- **Firebase Firestore**: Tracking de usage para nuevas features
- **Apify**: Scraping intensivo (30-40 videos por análisis)

**Valor Agregado PRO**:
- 🎨 Thumbnails generados automáticamente con predicción de CTR
- 🔍 Análisis profundo de competidores con insights accionables
- 📈 Detección temprana de trends (ventaja competitiva)
- ✂️ Sugerencias de clips para Shorts (ahorra horas de edición)

### 🚀 YouTube Growth Tools - FASE 3: Enterprise Power (LATEST)
**Fecha**: 16 de Noviembre, 2024
**Objetivo**: Funcionalidades ENTERPRISE nivel agencia - multi-channel, automatización, API access

**Funcionalidades implementadas (FASE 3 - Enterprise Features)**:
1. ✅ **Multi-Channel Tracking** (`POST /api/youtube/track-channel`, `GET /api/youtube/multi-channel-analytics`):
   - Gestiona múltiples canales simultáneamente
   - Dashboard unificado con métricas comparativas
   - Gemini AI genera insights estratégicos multi-channel
   - Identifica: best performer, cross-promotion ideas, resource allocation
   - Actions: add, list, remove channels
   - Perfecto para agencias y equipos
   - Límite: UNLIMITED (Enterprise only)

2. ✅ **Content Calendar AI** (`POST /api/youtube/generate-calendar`):
   - Genera calendario completo de 30 días
   - Apify scrapea content trending en el nicho
   - Gemini AI crea plan de contenido personalizado
   - Para cada video: título optimizado, keywords, upload time, script outline, thumbnail concept, estimated views
   - Organizado por semanas con goals mensuales
   - Variables: niche, goals, videosPerWeek, targetAudience
   - Guarda calendarios en Firestore para referencia
   - Límite: UNLIMITED (Enterprise only)

3. ✅ **Auto-Optimization Engine** (`POST /api/youtube/setup-auto-optimization`, `POST /api/youtube/check-optimization`):
   - Monitoreo 24/7 de performance de videos
   - Gemini AI detecta problemas automáticamente
   - Alertas con optimizaciones específicas
   - Para cada issue: action, impact (high/medium/low), urgency, reason
   - Performance score (0-100)
   - Status: underperforming/on-track/exceeding
   - Métricas: CTR, retention, views, engagement
   - Predicted improvement estimado
   - Límite: UNLIMITED (Enterprise only)

4. ✅ **API Access** (`POST /api/youtube/api-key/generate`, `GET /api/youtube/api-keys`):
   - Genera API keys para integraciones externas
   - Rate limit: 10,000 requests/mes
   - Acceso a TODOS los endpoints vía REST API
   - Tracking de usage por API key
   - Docs: https://docs.boostify.com/api
   - Perfecto para automatizaciones y workflows
   - Límite: UNLIMITED keys (Enterprise only)

**Subscription Limits FASE 3**:
```typescript
FREE/CREATOR/PRO: Todas las features ENTERPRISE BLOQUEADAS (0 usos)
ENTERPRISE ($149.99): UNLIMITED en todas (multi-channel, calendar, auto-opt, API)
```

**Casos de Uso Enterprise**:
- 🏢 **Agencias**: Gestionar 10+ canales de clientes desde un dashboard
- 📊 **Equipos**: Planificación de contenido coordinada con calendarios AI
- 🤖 **Automatización**: Integrar con herramientas externas vía API
- 🔄 **Optimización**: Monitoreo continuo sin intervención manual

**Tecnologías Agregadas FASE 3**:
- **Firestore Collections**: tracked_channels, content_calendars, auto_optimization, api_keys
- **Gemini AI**: Análisis multi-channel, generación de calendarios, detección de problemas
- **Apify**: Scraping para insights de calendario
- **REST API**: Endpoints externos con rate limiting

**Endpoints FASE 3 (Total: 8)**:
```
POST   /api/youtube/track-channel (add/remove canales)
GET    /api/youtube/multi-channel-analytics (dashboard comparativo)
POST   /api/youtube/generate-calendar (calendario 30 días)
POST   /api/youtube/setup-auto-optimization (activar monitoring)
POST   /api/youtube/check-optimization (revisar performance)
POST   /api/youtube/api-key/generate (generar API key)
GET    /api/youtube/api-keys (listar API keys)
GET    /api/youtube/usage-stats (estadísticas de uso)
```

### 🎵 Sistema de Tokenización de Música Web3/Blockchain
**Fecha**: 15 de Noviembre, 2024
**Objetivo**: Implementar sistema completo de tokenización de música usando ERC-1155 en Polygon blockchain

**Funcionalidades implementadas**:
1. ✅ **Base de Datos PostgreSQL**:
   - Tabla `tokenized_songs`: Canciones tokenizadas con metadata blockchain
   - Tabla `token_purchases`: Registro de compras de tokens con transaction hashes
   - Tabla `artist_token_earnings`: Ganancias de artistas por venta de tokens
   - Tracking automático de supply disponible y ganancias en ETH/USD

2. ✅ **Backend API (server/routes/tokenization.ts)**:
   - `GET /api/tokenization/songs/:artistId` - Obtener todas las canciones tokenizadas
   - `GET /api/tokenization/songs/active/:artistId` - Obtener canciones activas
   - `POST /api/tokenization/create` - Tokenizar nueva canción
   - `POST /api/tokenization/purchase/record` - Registrar compra de tokens
   - `PUT /api/tokenization/song/:id/toggle` - Activar/desactivar venta
   - `GET /api/tokenization/earnings/:artistId` - Ver ganancias en blockchain

3. ✅ **Smart Contract ERC-1155** (contracts/BoostifyMusicTokens.sol):
   - Un contrato maestro para TODAS las canciones (gas efficient)
   - Cada canción = Token ID único en el contrato
   - Split automático on-chain: 80% artista, 20% plataforma
   - Funciones de mint, buy, toggle, y gestión de precios
   - Seguridad: ReentrancyGuard, OpenZeppelin audited libraries
   - Desplegable en Polygon (~$0.01 por transacción)

4. ✅ **Web3 Frontend Integration**:
   - Wagmi + Viem (stack moderno TypeScript-first)
   - RainbowKit para wallet connection (MetaMask, WalletConnect, etc.)
   - Providers configurados en App.tsx
   - Soporte para Polygon y Mumbai testnet

5. ✅ **Panel de Tokenización para Artistas** (TokenizationPanel):
   - Dashboard con métricas: canciones tokenizadas, ganancias totales ETH
   - Formulario para tokenizar nuevas canciones
   - Configuración de: nombre, símbolo, supply total, precio USD
   - Toggle para activar/desactivar ventas
   - Visualización de supply disponible vs total

6. ✅ **Vista Pública de Música Tokenizada** (TokenizedMusicView):
   - Muestra canciones tokenizadas en perfil público del artista
   - Cards atractivos con imagen, descripción y beneficios
   - Precio en USD y ETH
   - Indicador de supply disponible
   - Botón "Connect Wallet" si no está conectado
   - Botón "Comprar Tokens" que abre modal de compra

7. ✅ **Diálogo de Compra de Tokens** (BuyTokensDialog):
   - Integración completa con MetaMask
   - Input para cantidad de tokens a comprar
   - Cálculo en tiempo real del total en USD y ETH
   - Ejecución de transacción on-chain con Wagmi
   - Confirmación de transacción en blockchain
   - Registro automático en base de datos
   - Estados de UI: loading, confirming, success, error

**Características del sistema**:
- ⛓️ **Blockchain**: ERC-1155 multi-token en Polygon
- 💰 **Split automático**: 80% artista, 20% plataforma (on-chain)
- 🦊 **MetaMask Integration**: Compra directa con wallet
- 🎨 **Token Metadata**: Imagen, descripción, beneficios para holders
- 💎 **Benefits System**: Descuentos en merch, acceso exclusivo, etc.
- 📊 **Real-time tracking**: Actualización automática de supply y ganancias
- 🔐 **Seguridad**: Smart contract auditado, ReentrancyGuard, validaciones

**Arquitectura técnica**:
```
Frontend (Viem + Wagmi)
    ↓
  MetaMask
    ↓
Polygon Blockchain (ERC-1155 Contract)
    ↓
Backend API (record purchase)
    ↓
PostgreSQL (analytics + tracking)
```

**Archivos clave**:
- `db/schema.ts` - Tablas tokenized_songs, token_purchases, artist_token_earnings
- `server/routes/tokenization.ts` - API completa de tokenización
- `contracts/BoostifyMusicTokens.sol` - Smart contract ERC-1155
- `contracts/README.md` - Guía de deployment y testing
- `client/src/lib/web3-config.ts` - Configuración Wagmi + chains
- `client/src/components/tokenization/tokenization-panel.tsx` - Panel artista
- `client/src/components/tokenization/tokenized-music-view.tsx` - Vista pública
- `client/src/components/tokenization/buy-tokens-dialog.tsx` - Compra con MetaMask

**Workflow del usuario**:
1. Artista crea canción tokenizada desde su panel
2. Define supply (ej: 10,000 tokens), precio (ej: $0.10/token), beneficios
3. Boostify admin despliega tokens en blockchain (mint on ERC-1155)
4. Fans visitan perfil del artista y ven sección "Música Tokenizada"
5. Fan conecta MetaMask y selecciona cantidad de tokens
6. Transacción se ejecuta en Polygon (~$0.01 gas fee)
7. Smart contract transfiere tokens al fan y ETH al artista (80%) y plataforma (20%)
8. Backend registra compra en PostgreSQL para analytics
9. Artista ve ganancias en tiempo real en su panel

**Deployment del Smart Contract**:
1. Instalar Hardhat: `npm install --save-dev hardhat @openzeppelin/contracts`
2. Configurar `hardhat.config.js` con Polygon RPC
3. Obtener test MATIC de faucet.polygon.technology (Mumbai)
4. Deploy: `npx hardhat run scripts/deploy.js --network mumbai`
5. Verificar: `npx hardhat verify --network mumbai CONTRACT_ADDRESS`
6. Actualizar `BOOSTIFY_CONTRACT_ADDRESS` en `client/src/lib/web3-config.ts`

**Gas Costs (Polygon)**:
- Deploy contract: ~$0.05
- Mint song tokens: ~$0.003
- Buy tokens: ~$0.002
- Toggle status: ~$0.001

**Roadmap**:
- [ ] WalletConnect project ID configuration
- [ ] Metadata hosting (IPFS o server)
- [ ] Secondary market (OpenSea integration)
- [ ] Dynamic pricing based on demand
- [ ] Staking rewards for token holders

### 💰 Sistema de Crowdfunding Completo
**Fecha**: 15 de Noviembre, 2024
**Objetivo**: Implementar sistema completo de crowdfunding para financiar proyectos musicales

**Funcionalidades implementadas**:
1. ✅ **Base de Datos PostgreSQL**:
   - Tabla `crowdfunding_campaigns`: Campañas de crowdfunding por artista
   - Tabla `crowdfunding_contributions`: Contribuciones de fans con metadata
   - Tracking automático de monto total recaudado y número de contribuidores
   - Configuración flexible: título, descripción, meta, fechas

2. ✅ **Backend API (server/routes/crowdfunding.ts)**:
   - `GET /api/crowdfunding/campaign/:artistSlug` - Obtener campaña activa de un artista
   - `GET /api/crowdfunding/my-campaign` - Obtener campaña del usuario autenticado
   - `POST /api/crowdfunding/campaign` - Crear/actualizar campaña
   - `POST /api/crowdfunding/create-payment-intent` - Stripe payment intent
   - `POST /api/crowdfunding/confirm-contribution` - Confirmar contribución y actualizar wallet
   - `GET /api/crowdfunding/contributions/:campaignId` - Ver contribuciones recibidas

3. ✅ **Botón Flotante en Perfil Público** (CrowdfundingButton):
   - Aparece SOLO si el artista tiene campaña activa
   - Posicionado flotante en esquina superior derecha
   - Diseño atractivo con gradiente y animación de heartbeat
   - Muestra progreso de la campaña (%)
   - Modal con formulario de contribución integrado con Stripe

4. ✅ **Panel de Control para Artistas** (CrowdfundingPanel):
   - Activar/desactivar campaña con switch toggle
   - Configurar título, descripción y meta de recaudación
   - Visualización en tiempo real de:
     - Total recaudado
     - Ganancias del artista (70%)
     - Número de contribuidores
     - Barra de progreso visual
   - Lista de contribuciones recientes con mensajes de fans
   - Panel de earnings mostrando split 70/30 (artista/plataforma)

5. ✅ **Integración con Stripe**:
   - Payment intents para procesamiento seguro
   - Split automático: 70% artista, 30% plataforma
   - Las ganancias del artista se acreditan automáticamente al wallet
   - Soporte para contribuciones anónimas
   - Mensajes opcionales de los contributors

**Características del sistema**:
- 🔒 **Campaña desactivada por defecto**: Los artistas deben activarla manualmente
- 💵 **Split de pagos**: 70% artista, 30% plataforma fee
- 💳 **Stripe Integration**: Procesamiento de pagos seguro
- 👤 **Contribuciones anónimas**: Opción de ocultar nombre del contributor
- 💬 **Mensajes de fans**: Los contributors pueden dejar mensajes de apoyo
- 📊 **Analytics en vivo**: Progreso, earnings, y estadísticas en tiempo real
- 🎯 **Flexible**: Meta de recaudación configurable, sin límite de tiempo fijo

**Archivos clave**:
- `db/schema.ts` - Tablas crowdfunding_campaigns y crowdfunding_contributions
- `server/routes/crowdfunding.ts` - API completa de crowdfunding
- `client/src/components/crowdfunding/crowdfunding-button.tsx` - Botón flotante + modal
- `client/src/components/crowdfunding/crowdfunding-panel.tsx` - Panel de control del artista
- `client/src/pages/artist-profile.tsx` - Integración del botón en perfil público

**Workflow del usuario**:
1. Artista abre su perfil y accede al panel de crowdfunding
2. Configura título, descripción y meta de recaudación
3. Activa campaña con el toggle switch
4. Aparece botón "Support My Music" en su perfil público
5. Fans contribuyen con tarjeta de crédito a través de Stripe
6. Artista recibe 70% en su wallet automáticamente
7. Dashboard muestra progreso y lista de contribuciones

**Ubicación del panel**:
- El panel de crowdfunding está integrado en el perfil del artista
- Aparece debajo de "Mis Ganancias" y antes de "Estadísticas del Perfil"
- Solo visible para el dueño del perfil (no para visitantes)
- Sección colapsable con header estilo gradiente y badge "70%"

**Base de datos**:
- ✅ Tablas creadas en PostgreSQL:
  - `crowdfunding_campaigns` - Gestión de campañas
  - `crowdfunding_contributions` - Registro de contribuciones
- ✅ Índices optimizados para consultas rápidas
- ✅ Relaciones con foreign keys y cascade deletes

### 🔐 Critical Fix: Replit Auth Endpoint Routing + React Query 401 Handling
**Fecha**: 15 de Noviembre, 2024
**Problema**: La aplicación se quedaba atascada en "Verificando acceso..." con bucle infinito de errores 401.

**Causa raíz (Parte 1 - Backend)**: 
- Vite's catch-all middleware (`app.use("*", ...)` en `server/vite.ts`) estaba interceptando el endpoint `/api/auth/user` antes de que pudiera llegar a los handlers de Express
- El endpoint se registraba dentro de `setupAuth()` → `registerRoutes()`, pero el middleware de Vite tenía prioridad
- Resultado: el endpoint devolvía HTML en lugar de JSON/401

**Causa raíz (Parte 2 - Frontend)**:
- El `queryClient` estaba configurado con `on401: "throw"` por defecto
- React Query trataba el 401 como un error, causando que `isLoading` se quedara en `true` permanentemente
- El hook `useAuth` intentaba manejar el error, pero React Query seguía en estado de error

**Solución implementada**:

**Backend**:
1. ✅ Movió `/api/auth/user` de `server/replitAuth.ts` a `server/index.ts`
2. ✅ Se registra DESPUÉS de `registerRoutes(app)` pero ANTES de `setupVite(app, server)`
3. ✅ Esto asegura que el endpoint tenga prioridad sobre el catch-all de Vite

**Frontend**:
1. ✅ Modificó `useAuth()` para usar `getQueryFn({ on401: "returnNull" })`
2. ✅ Ahora cuando el endpoint devuelve 401, React Query devuelve `null` en lugar de lanzar error
3. ✅ Eliminó lógica compleja de manejo de errores que ya no es necesaria

**Archivos modificados**:
- `server/index.ts` - Llama a `setupAuth()` DESPUÉS de `registerRoutes()` pero ANTES de `setupVite()` (líneas 136-148)
- `server/index.ts` - Sobrescribe `/api/auth/user` para manejo directo sin middleware (líneas 150-175)
- `server/routes.ts` - Eliminó llamada a `setupAuth()` (ahora se llama desde index.ts)
- `server/replitAuth.ts` - Eliminó endpoint duplicado `/api/auth/user`, dejó nota explicativa
- `client/src/hooks/use-auth.ts` - Usa `getQueryFn({ on401: "returnNull" })`
- `client/src/pages/home.tsx` - Cambió botón "Get Started" para redirigir a `/api/login` en lugar de Firebase Auth

**Comportamiento correcto**:
- Usuario NO autenticado: endpoint devuelve 401, React Query devuelve `null`, `isLoading` = `false`
- Usuario autenticado: endpoint devuelve datos del usuario, React Query los cachea correctamente
- No hay bucle infinito de errores, la aplicación carga la UI apropiada inmediatamente

**Nota técnica importante**: 
- Este endpoint NO puede estar en `setupAuth()` porque se registra antes que Vite
- Vite's middleware se ejecuta en orden, y su catch-all captura todas las rutas no manejadas
- Para endpoints de autenticación, siempre usar `getQueryFn({ on401: "returnNull" })` en React Query

### ✂️ Mejora Timeline: Resize/Stretch de Clips Estilo CapCut
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
