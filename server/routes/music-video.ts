/**
 * Rutas para generación de conceptos de videos musicales usando OpenAI + FAL
 * 
 * 🎵 Integración con Audio Analysis:
 * - El script se enriquece automáticamente con análisis de audio
 * - Timestamps basados en beats musicales
 * - Transiciones según energía de la sección
 */
import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { generateImageWithNanoBanana } from '../services/fal-service';
import { analyzeAudio, generateEditingRecommendations, AudioAnalysisResult } from '../services/audio-analysis-service';
import { logger } from '../utils/logger';

const router = Router();

// Cliente OpenAI para generación de texto
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

/**
 * 🎭 PERFILES COMPLETOS DE DIRECTORES
 * Incluye técnicas cinematográficas, paletas de color, referencias y especialidades
 */
const DIRECTOR_FULL_PROFILES: Record<string, {
  name: string;
  signature_techniques: string[];
  camera_work: string[];
  color_palette: string[];
  lighting_style: string;
  editing_rhythm: string;
  iconic_references: string[];
  specialty: string;
  music_video_approach: string;
}> = {
  'Spike Jonze': {
    name: 'Spike Jonze',
    signature_techniques: ['Single-take wonders', 'Practical effects over CGI', 'Intimate handheld moments', 'Surreal mundane juxtaposition'],
    camera_work: ['Steadicam following subjects', 'Wide establishing shots', 'Close-up emotional beats', 'Dance choreography coverage'],
    color_palette: ['Warm nostalgic yellows', 'Soft pastels', 'Natural daylight tones', 'Muted earth colors'],
    lighting_style: 'Natural light preference, golden hour magic, soft diffused interiors',
    editing_rhythm: 'Patient pacing with sudden bursts of kinetic energy, long takes broken by quick cuts',
    iconic_references: ['Weapon of Choice (flying Walken)', 'Praise You (guerrilla dance)', 'Da Funk (lonely dog-man)'],
    specialty: 'Making the absurd feel emotionally genuine',
    music_video_approach: 'Simple high-concept ideas executed with heart and humor'
  },
  'Hype Williams': {
    name: 'Hype Williams',
    signature_techniques: ['Fisheye lens distortion', 'Slow-motion opulence', 'Reflective surfaces', 'Luxury car culture'],
    camera_work: ['Extreme wide-angle close-ups', 'Circular dolly shots', 'Low angle power shots', 'Static glamour poses'],
    color_palette: ['Rich golds', 'Deep purples', 'Neon accents', 'High-contrast blacks'],
    lighting_style: 'Dramatic rim lighting, jewel-tone gels, high-key beauty lighting',
    editing_rhythm: 'Slow, deliberate cuts that linger on luxury and beauty',
    iconic_references: ['Mo Money Mo Problems', 'Hypnotize', 'California Love'],
    specialty: 'Elevating hip-hop aesthetics to cinematic glamour',
    music_video_approach: 'Maximum visual impact, aspirational wealth imagery, iconic artist positioning'
  },
  'Michel Gondry': {
    name: 'Michel Gondry',
    signature_techniques: ['In-camera magic tricks', 'Stop-motion integration', 'Handcrafted set pieces', 'Temporal manipulation'],
    camera_work: ['Locked-off symmetry', 'Whip pans', 'Perspective tricks', 'Miniature photography'],
    color_palette: ['Saturated primaries', 'Craft paper textures', 'Vintage film look', 'Playful patterns'],
    lighting_style: 'Theatrical spotlights, practical bulbs visible in frame, DIY charm',
    editing_rhythm: 'Rhythmic cuts synced perfectly to music, magical transitions, loop structures',
    iconic_references: ['Around the World (Daft Punk)', 'Star Guitar (landscapes as music)', 'Everlong (dream logic)'],
    specialty: 'Making impossible things feel handmade and warm',
    music_video_approach: 'Visual puzzles and in-camera illusions that reward repeat viewing'
  },
  'David Fincher': {
    name: 'David Fincher',
    signature_techniques: ['Perfect symmetry', 'Impossible camera moves', 'Desaturated intensity', 'Meticulous control'],
    camera_work: ['Smooth tracking shots', 'Top-down surveillance angles', 'Slow deliberate dollies', 'Through-the-wall movements'],
    color_palette: ['Sickly greens', 'Steel blues', 'Copper browns', 'Deep shadows'],
    lighting_style: 'Low-key noir lighting, motivated sources, harsh practical lights',
    editing_rhythm: 'Precision cuts on beat, building tension through accumulation',
    iconic_references: ['Vogue (Madonna)', 'Freedom 90', 'Only (Nine Inch Nails)'],
    specialty: 'Dark psychological intensity with technical perfection',
    music_video_approach: 'Every frame precisely designed, iconic imagery, narrative sophistication'
  },
  'Edgar Wright': {
    name: 'Edgar Wright',
    signature_techniques: ['Match cuts on everything', 'Whip pans with sound design', 'Visual comedy timing', 'Pop culture homage'],
    camera_work: ['Snap zooms', 'Crash zooms', 'Wipe transitions', 'Synchronized multicam'],
    color_palette: ['Bold saturated colors', 'British grays suddenly exploding with color', 'Neon nightlife'],
    lighting_style: 'Punchy contrast, practical neons, dramatic color shifts',
    editing_rhythm: 'Hyper-kinetic cuts synced to every beat and sound, zero dead space',
    iconic_references: ['Scott Pilgrim style', 'Baby Driver car chase rhythm', 'Shaun of the Dead montages'],
    specialty: 'Visual rhythm as comedy, music as editing driver',
    music_video_approach: 'Every cut, every sound, every movement synced to the track perfectly'
  },
  'Denis Villeneuve': {
    name: 'Denis Villeneuve',
    signature_techniques: ['IMAX scale grandeur', 'Slow contemplative pace', 'Sci-fi minimalism', 'Sound design as character'],
    camera_work: ['Massive wide shots', 'Slow push-ins', 'Aerial vistas', 'Geometric framing'],
    color_palette: ['Desert oranges', 'Blade Runner neons', 'Fog grays', 'Monochromatic palettes'],
    lighting_style: 'Natural epic lighting, volumetric atmospherics, silhouettes against vast skies',
    editing_rhythm: 'Meditative long takes, building dread through restraint',
    iconic_references: ['Dune sandworms scale', 'Arrival linguistics', 'Blade Runner 2049 neons'],
    specialty: 'Making audiences feel small in an overwhelming beautiful world',
    music_video_approach: 'Epic scale emotional journeys, cosmic significance, visual poetry'
  },
  'Baz Luhrmann': {
    name: 'Baz Luhrmann',
    signature_techniques: ['Theatrical excess', 'Mixed era aesthetics', 'Music-driven narratives', 'Romanticism'],
    camera_work: ['Sweeping crane shots', 'Dizzying spins', 'Intimate then epic transitions', 'Dance coverage'],
    color_palette: ['Bold reds', 'Gatsby golds', 'Saturated jewel tones', 'Glitter and sparkle'],
    lighting_style: 'Theatrical spotlights, fairy lights, champagne bubbles catching light',
    editing_rhythm: 'Frenetic during parties, languid during romance, always theatrical',
    iconic_references: ['Moulin Rouge! (Roxanne tango)', 'Romeo + Juliet (aquarium)', 'Great Gatsby (parties)'],
    specialty: 'Making everything feel like the most important moment in history',
    music_video_approach: 'Every video is an epic romance, maximum emotion, visual extravagance'
  },
  'Wes Anderson': {
    name: 'Wes Anderson',
    signature_techniques: ['Perfect symmetry always', 'Planimetric framing', 'Whip pans between scenes', 'Title cards'],
    camera_work: ['Centered subjects', 'Lateral tracking shots', 'Dollhouse cutaways', 'Top-down inserts'],
    color_palette: ['Millennial pink', 'Mustard yellow', 'Mint green', 'Terracotta'],
    lighting_style: 'Flat, even, storybook lighting with no harsh shadows',
    editing_rhythm: 'Deadpan timing, held beats, comedic precision',
    iconic_references: ['Grand Budapest Hotel (miniatures)', 'Moonrise Kingdom (pastoral)', 'Royal Tenenbaums (tableaux)'],
    specialty: 'Making the quirky feel heartbreaking',
    music_video_approach: 'Meticulous dollhouse worlds, each frame a photograph worth framing'
  },
  'Christopher Nolan': {
    name: 'Christopher Nolan',
    signature_techniques: ['Practical effects at scale', 'Non-linear storytelling', 'IMAX 70mm', 'Time manipulation'],
    camera_work: ['Handheld intensity', 'IMAX wide establishing', 'Rotational environments', 'Zero gravity'],
    color_palette: ['Steel blues', 'Warm ambers', 'High contrast', 'Natural desaturated'],
    lighting_style: 'Available light preference, dramatic natural contrast, real locations',
    editing_rhythm: 'Parallel timelines intercutting, building to crescendo, precise logic',
    iconic_references: ['Inception (rotating hallway)', 'Interstellar (tesseract)', 'Dunkirk (ticking clock)'],
    specialty: 'Making you think while making you feel',
    music_video_approach: 'High-concept puzzles with emotional cores, reality-bending visuals'
  },
  'Quentin Tarantino': {
    name: 'Quentin Tarantino',
    signature_techniques: ['Trunk shots', 'Chapter structure', 'Pop culture dialogue', 'Revenge narratives'],
    camera_work: ['Low angle hero shots', 'Long steadicam walks', 'Crash zooms', 'Mexican standoff coverage'],
    color_palette: ['Grindhouse yellows', 'Blood reds', 'Retro color grades', '70s warmth'],
    lighting_style: 'Stylized practical lighting, chiaroscuro for drama, neon for cool',
    editing_rhythm: 'Tension building through dialogue, explosive violence release, musical cues',
    iconic_references: ['Kill Bill (anime sequence)', 'Pulp Fiction (dance)', 'Django (Western vistas)'],
    specialty: 'Making violence stylish and dialogue musical',
    music_video_approach: 'Each video a mini revenge film or stylish character piece'
  }
};

/**
 * 🎵 Detecta el género musical basándose en la letra
 */
function detectMusicGenre(lyrics: string): { genre: string; subgenre: string; mood: string } {
  const lyricsLower = lyrics.toLowerCase();
  
  // Patrones para detectar géneros
  const genrePatterns = {
    hiphop: /\b(flex|drip|gang|hood|hustle|money|bitch|nigga|trap|plug|ice|chain|whip|ride|squad|homie|flow)\b/gi,
    reggaeton: /\b(perreo|dembow|baila|mami|papi|booty|sandungueo|bellaqueo|gatita|gata|loca|duro)\b/gi,
    pop: /\b(love|heart|baby|forever|dream|star|shine|tonight|dance|feel)\b/gi,
    rock: /\b(scream|fire|burn|rage|fight|thunder|rebel|crash|break|wild)\b/gi,
    rnb: /\b(body|touch|skin|night|slow|groove|vibe|mood|sexy|sensual)\b/gi,
    latin: /\b(corazón|amor|vida|loco|fuego|caliente|rumba|sabor|pasión)\b/gi,
    electronic: /\b(bass|drop|rave|beat|pulse|synth|neon|club|dj)\b/gi,
    country: /\b(truck|road|hometown|beer|whiskey|cowboy|boots|farm|southern)\b/gi,
    indie: /\b(melancholy|wandering|aesthetic|vintage|nostalgia|dreaming|floating)\b/gi
  };
  
  let maxMatches = 0;
  let detectedGenre = 'pop';
  
  for (const [genre, pattern] of Object.entries(genrePatterns)) {
    const matches = (lyricsLower.match(pattern) || []).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedGenre = genre;
    }
  }
  
  // Subgéneros y moods asociados
  const genreDetails: Record<string, { subgenre: string; mood: string }> = {
    hiphop: { subgenre: 'trap/boom-bap', mood: 'confident and bold' },
    reggaeton: { subgenre: 'perreo/urbano', mood: 'sensual and energetic' },
    pop: { subgenre: 'mainstream/dance-pop', mood: 'uplifting and catchy' },
    rock: { subgenre: 'alternative/hard rock', mood: 'intense and rebellious' },
    rnb: { subgenre: 'contemporary R&B', mood: 'smooth and sensual' },
    latin: { subgenre: 'latin pop/salsa', mood: 'passionate and romantic' },
    electronic: { subgenre: 'EDM/house', mood: 'energetic and euphoric' },
    country: { subgenre: 'modern country', mood: 'nostalgic and authentic' },
    indie: { subgenre: 'indie/alternative', mood: 'introspective and artistic' }
  };
  
  return {
    genre: detectedGenre,
    ...genreDetails[detectedGenre]
  };
}

/**
 * 🎭 Analiza las emociones principales de la letra
 */
function analyzeEmotions(lyrics: string): { primary: string; secondary: string; arc: string } {
  const lyricsLower = lyrics.toLowerCase();
  
  const emotionPatterns = {
    love: /\b(love|heart|kiss|hold|forever|together|baby|darling|sweetheart)\b/gi,
    heartbreak: /\b(cry|tears|pain|hurt|broken|lost|gone|leave|alone|miss)\b/gi,
    empowerment: /\b(strong|power|rise|fight|win|queen|king|boss|unstoppable|fearless)\b/gi,
    party: /\b(dance|party|club|night|drink|celebrate|wild|fun|crazy|lit)\b/gi,
    nostalgia: /\b(remember|yesterday|old|past|memory|young|childhood|back then)\b/gi,
    desire: /\b(want|need|crave|body|touch|feel|close|hot|fire)\b/gi,
    rebellion: /\b(fuck|shit|rebel|break|rules|free|escape|riot|against)\b/gi,
    hope: /\b(dream|hope|believe|tomorrow|future|shine|light|faith)\b/gi
  };
  
  const scores: Record<string, number> = {};
  for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
    scores[emotion] = (lyricsLower.match(pattern) || []).length;
  }
  
  const sorted = Object.entries(scores).sort(([,a], [,b]) => b - a);
  const primary = sorted[0]?.[0] || 'love';
  const secondary = sorted[1]?.[0] || 'empowerment';
  
  // Arco emocional basado en combinación
  const arcs: Record<string, string> = {
    'love+heartbreak': 'From passion to pain - a love story with tragic ending',
    'heartbreak+hope': 'Rising from ashes - healing journey after loss',
    'empowerment+rebellion': 'Breaking free - triumphant liberation',
    'party+desire': 'Night of abandon - hedonistic celebration',
    'nostalgia+love': 'Bittersweet memories - longing for past love',
    'desire+love': 'Burning passion - intense romantic pursuit',
    'hope+empowerment': 'Inspirational anthem - overcoming obstacles'
  };
  
  const arcKey = `${primary}+${secondary}`;
  const arc = arcs[arcKey] || `Journey from ${primary} to ${secondary} - emotional transformation`;
  
  return { primary, secondary, arc };
}

/**
 * Genera contenido de texto usando OpenAI GPT-4o (modelo completo para mejor creatividad)
 */
async function generateTextWithOpenAI(prompt: string, options: {
  temperature?: number;
  maxTokens?: number;
  useFullModel?: boolean;
} = {}): Promise<string> {
  // Usar GPT-4o completo para conceptos creativos, gpt-4o-mini para tareas simples
  const model = options.useFullModel ? 'gpt-4o' : 'gpt-4o-mini';
  console.log(`🤖 Generando texto con OpenAI ${model}...`);
  
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: options.temperature ?? 0.9,
    max_tokens: options.maxTokens ?? 8192,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content received from OpenAI');
  }
  
  console.log(`✅ Texto generado con OpenAI ${model}`);
  return content;
}

/**
 * 🎬 PREMIUM CINEMATOGRAPHIC POSTER PROMPTS
 * Genera prompts de alta calidad estilo Hollywood/Cinema
 */
function buildPremiumPosterPrompt(concept: any, directorName: string, songInfo?: { artist?: string; title?: string }, artistGender?: string): string {
  // Director-specific visual styles
  const directorStyles: Record<string, string> = {
    'Spike Jonze': 'Whimsical surrealism, intimate close-ups, warm nostalgic tones, dreamlike sequences with practical effects, indie film aesthetic',
    'Hype Williams': 'Ultra-wide fisheye lens, opulent luxury aesthetic, slow-motion glamour, high contrast neon colors, bling and excess',
    'Michel Gondry': 'Handcrafted DIY aesthetic, stop-motion elements, paper craft textures, vintage camera effects, playful inventiveness',
    'David Fincher': 'Dark atmospheric shadows, desaturated color palette, meticulous symmetry, noir thriller mood, clinical precision',
    'Edgar Wright': 'Dynamic kinetic framing, bold color blocking, rhythmic visual comedy, British wit aesthetic, pop culture homage',
    'Denis Villeneuve': 'Epic scale compositions, vast landscapes, minimalist elegance, sci-fi grandeur, contemplative atmosphere',
    'Baz Luhrmann': 'Extravagant visual spectacle, bold saturated colors, theatrical glamour, musical rhythm in editing',
    'Wes Anderson': 'Symmetrical framing, pastel color palette, storybook aesthetic, meticulous production design',
    'Christopher Nolan': 'IMAX grandeur, practical effects, non-linear storytelling hints, cerebral intensity',
    'Quentin Tarantino': 'Bold retro aesthetic, grindhouse vibes, dynamic angles, pop culture references',
    'default': 'Professional cinematic composition, dramatic lighting, movie poster quality'
  };

  const directorStyle = directorStyles[directorName] || directorStyles['default'];
  
  // Extract visual elements from concept
  const colors = concept.color_palette?.primary_colors?.join(', ') || 'dramatic cinematic colors';
  const mood = concept.mood || 'intense emotional';
  const visualTheme = concept.visual_theme || 'cinematic storytelling';
  
  // 🎭 Descripción de género para el artista principal
  const genderDesc = artistGender === 'masculine' ? 'male protagonist'
    : artistGender === 'feminine' ? 'female protagonist'
    : artistGender === 'androgynous' ? 'androgynous lead character'
    : 'lead protagonist';
  
  // Build premium Hollywood blockbuster poster prompt
  return `HOLLYWOOD BLOCKBUSTER MOVIE POSTER - Premium theatrical one-sheet design

🎬 DIRECTOR VISION: ${directorName}
${directorStyle}

🎭 MAIN CHARACTER: ${genderDesc} - The star of this music video
IMPORTANT: Accurately depict the artist's gender and appearance from reference images.

📽️ POSTER CONCEPT: "${concept.title}"
🌟 VISUAL THEME: ${visualTheme}
🎨 COLOR PALETTE: ${colors}
😮 MOOD: ${mood}

📐 PROFESSIONAL POSTER LAYOUT:
- TOP ZONE (15%): Clean space for movie title/logo placement
- HERO ZONE (60%): Dramatic central composition featuring the ${genderDesc}
- BILLING BLOCK ZONE (25%): Space for credits, production logos, release date

🎥 CINEMATIC REQUIREMENTS:
- 4K theatrical one-sheet quality (27x40 inch ratio)
- Drew Struzan / Olly Moss inspired painted realism
- Epic hero shot with dramatic backlighting
- Volumetric lighting, lens flares, atmospheric depth
- IMAX/Dolby Cinema presentation aesthetic
- Award campaign quality (Oscar-worthy key art)

🖼️ COMPOSITION ELEMENTS:
- Central heroic figure pose (dramatic silhouette or portrait)
- Layered depth with foreground/midground/background elements
- Secondary characters or story elements in supporting positions
- Environmental storytelling matching the song's narrative
- Professional film grain texture
- Cinematic color grading with rich blacks and vibrant highlights

📖 STORY CAPTURED:
${concept.story_concept?.substring(0, 300) || 'A powerful emotional journey captured in a single iconic frame'}

⚠️ TEXT HANDLING:
- Leave TOP 15% completely clear for title treatment
- Leave BOTTOM 20% for billing block credits
- The visual composition should frame naturally around these text zones
- NO actual text/typography in the image - just leave appropriate negative space

Create an ICONIC, COLLECTIBLE movie poster that fans would want to frame on their wall.`;
}

/**
 * Genera imagen con FAL nano-banana (Gemini 2.5 Flash via FAL)
 * ⚡ Optimizado con prompts premium cinematográficos
 */
async function generateConceptImage(
  prompt: string, 
  conceptIndex: number,
  options?: { concept?: any; directorName?: string; songInfo?: { artist?: string; title?: string }; artistGender?: string }
): Promise<{ success: boolean; imageUrl?: string; error?: string; provider?: string }> {
  try {
    console.log(`🎨 [Concept #${conceptIndex + 1}] Generando póster PREMIUM con FAL nano-banana...`);
    
    // Use premium prompt if concept data is available
    let enhancedPrompt = prompt;
    if (options?.concept) {
      enhancedPrompt = buildPremiumPosterPrompt(
        options.concept, 
        options.directorName || 'Creative Director',
        options.songInfo,
        options.artistGender // 🎭 Pasar género del artista
      );
    }
    
    const result = await generateImageWithNanoBanana(enhancedPrompt, {
      aspectRatio: '3:4', // Portrait para pósters
      numImages: 1,
      outputFormat: 'png'
    });

    if (result.success && result.imageUrl) {
      console.log(`✅ [Concept #${conceptIndex + 1}] ¡Póster PREMIUM generado con FAL nano-banana!`);
      return {
        success: true,
        imageUrl: result.imageUrl,
        provider: 'fal-nano-banana'
      };
    }

    return { 
      success: false, 
      error: result.error || 'No image generated' 
    };
  } catch (error: any) {
    console.error(`❌ [Concept #${conceptIndex + 1}] Error generando imagen:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/music-video/generate-concepts
 * Genera 3 propuestas de conceptos visuales DIFERENCIADOS para un video musical
 * 
 * 🚀 MEJORAS v2:
 * - Usa GPT-4o completo para mayor creatividad
 * - Incluye perfil completo del director
 * - 3 arquetipos diferenciados: Narrativo, Abstracto, Performance
 * - Detecta género musical y emociones de la letra
 */
router.post("/generate-concepts", async (req: Request, res: Response) => {
  try {
    const { lyrics, directorName, characterReference, audioDuration, artistGender } = req.body;

    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // 🎭 Mapear género detectado a descripción para el prompt
    const genderDescription = artistGender === 'masculine' ? 'male artist/performer'
      : artistGender === 'feminine' ? 'female artist/performer'
      : artistGender === 'androgynous' ? 'androgynous artist/performer'
      : 'artist/performer';

    // 🎵 NUEVO: Detectar género musical de la letra
    const musicGenre = detectMusicGenre(lyrics);
    console.log(`🎵 Género detectado: ${musicGenre.genre} (${musicGenre.subgenre}) - Mood: ${musicGenre.mood}`);

    // 🎭 NUEVO: Analizar emociones de la letra
    const emotions = analyzeEmotions(lyrics);
    console.log(`💫 Emociones: ${emotions.primary} + ${emotions.secondary}`);
    console.log(`📈 Arco emocional: ${emotions.arc}`);

    // 🎬 NUEVO: Obtener perfil completo del director
    const directorProfile = DIRECTOR_FULL_PROFILES[directorName] || null;

    console.log(`🎬 Generando 3 conceptos DIFERENCIADOS con GPT-4o...`);
    console.log(`📝 Letra: ${lyrics.substring(0, 100)}...`);
    console.log(`🎭 Director: ${directorName || 'Unknown'}`);
    console.log(`👤 Género del artista: ${artistGender || 'no especificado'} → ${genderDescription}`);

    // 🎬 PROMPT MEJORADO con perfil de director, género musical y emociones
    const prompt = `You are ${directorName}, the legendary music video director. Create THREE RADICALLY DIFFERENT concepts for this song, each exploring a completely different approach.

═══════════════════════════════════════════════════════════════
📝 SONG LYRICS:
═══════════════════════════════════════════════════════════════
${lyrics}

═══════════════════════════════════════════════════════════════
🎵 MUSIC ANALYSIS:
═══════════════════════════════════════════════════════════════
• Genre: ${musicGenre.genre.toUpperCase()} (${musicGenre.subgenre})
• Overall Mood: ${musicGenre.mood}
• Duration: ${audioDuration ? Math.floor(audioDuration) + ' seconds' : 'Standard length'}

═══════════════════════════════════════════════════════════════
💫 EMOTIONAL ANALYSIS:
═══════════════════════════════════════════════════════════════
• Primary Emotion: ${emotions.primary.toUpperCase()}
• Secondary Emotion: ${emotions.secondary}
• Emotional Arc: ${emotions.arc}

═══════════════════════════════════════════════════════════════
🎭 ARTIST PROFILE:
═══════════════════════════════════════════════════════════════
• Performer: ${genderDescription}
${characterReference && characterReference.length > 0 ? `• Reference Images: ${characterReference.length} provided for visual consistency` : '• No reference images - create generic but consistent character'}

${directorProfile ? `
═══════════════════════════════════════════════════════════════
🎬 YOUR DIRECTORIAL SIGNATURE (${directorName}):
═══════════════════════════════════════════════════════════════
• Signature Techniques: ${directorProfile.signature_techniques.join(', ')}
• Camera Work: ${directorProfile.camera_work.join(', ')}
• Color Palette: ${directorProfile.color_palette.join(', ')}
• Lighting Style: ${directorProfile.lighting_style}
• Editing Rhythm: ${directorProfile.editing_rhythm}
• Your Specialty: ${directorProfile.specialty}
• Your Approach to Music Videos: ${directorProfile.music_video_approach}
• Iconic References: ${directorProfile.iconic_references.join(', ')}
` : ''}

═══════════════════════════════════════════════════════════════
🎯 THE THREE CONCEPTS (MUST BE RADICALLY DIFFERENT):
═══════════════════════════════════════════════════════════════

📖 CONCEPT 1 - "NARRATIVE" (Story-Driven)
Create a SHORT FILM with a compelling story arc. Think mini-movie with:
- Clear protagonist journey
- Beginning, middle, climactic ending
- Character development
- Plot twists or emotional revelations
- The song as the soundtrack to a cinematic story

🌀 CONCEPT 2 - "ABSTRACT/ARTISTIC" (Visual Poetry)
Create a VISUAL ART PIECE without literal narrative. Think:
- Symbolic imagery and metaphors
- Surreal or dreamlike sequences
- Dance/movement as expression
- Experimental visuals and effects
- The song as inspiration for visual art

🎤 CONCEPT 3 - "PERFORMANCE" (Artist-Centric)
Create a STAR-MAKING performance video. Think:
- Iconic looks and poses
- Multiple stunning locations or sets
- Fashion-forward styling
- The artist as the absolute center
- Moments designed to go viral and become GIFs

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════
1. Each concept MUST feel like it could be from a DIFFERENT director (while using your techniques)
2. Each concept MUST have a UNIQUE title that sounds like a movie/art piece
3. The ${genderDescription} MUST be accurately represented in ALL descriptions
4. Apply your signature ${directorProfile?.color_palette?.[0] || 'cinematic'} color palette
5. Include at least 3 specific ICONIC MOMENTS per concept (scenes that would become famous)
6. Each concept should be AWARD-WORTHY and FRESH

Return ONLY valid JSON with this structure:
{
  "concepts": [
    {
      "title": "Evocative Cinema Title",
      "concept_type": "narrative|abstract|performance",
      "story_concept": "Detailed narrative/concept description (200+ words)...",
      "visual_theme": "Cinematography style, visual approach...",
      "director_techniques_used": ["technique1", "technique2"],
      "color_palette": {
        "primary_colors": ["color1", "color2"],
        "accent_colors": ["color3"],
        "mood_colors": "How colors support the emotion"
      },
      "wardrobe": {
        "main_outfit": "Detailed description...",
        "alternative_looks": ["look2", "look3"],
        "style_notes": "Fashion direction..."
      },
      "iconic_moments": [
        {
          "timestamp": "0:30",
          "description": "The moment that would become famous",
          "why_iconic": "What makes this visually memorable"
        }
      ],
      "key_scenes": [
        {
          "timestamp": "0:00-0:30",
          "description": "Scene description",
          "visual_style": "How it looks",
          "camera_movement": "Specific camera work"
        }
      ],
      "locations": [
        {
          "name": "Location name",
          "description": "Detailed description",
          "mood": "Emotional purpose"
        }
      ],
      "mood": "Overall emotional tone",
      "music_video_references": ["Similar iconic videos for inspiration"]
    }
  ]
}`;

    // 🚀 USAR GPT-4o COMPLETO para conceptos creativos premium
    const textContent = await generateTextWithOpenAI(prompt, {
      temperature: 0.95, // Alta creatividad
      maxTokens: 12000, // Más espacio para conceptos detallados
      useFullModel: true // 🚀 GPT-4o completo
    });
    
    if (!textContent) {
      throw new Error('No content received from GPT-4o');
    }

    // Limpiar cualquier markdown que pueda haber en la respuesta
    let cleanedContent = textContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const result = JSON.parse(cleanedContent);
    const concepts = result.concepts || [];

    console.log(`✅ Generados ${concepts.length} conceptos DIFERENCIADOS de video musical`);
    console.log(`📸 Generando ${concepts.length} imágenes de póster EN PARALELO...`);

    // Generar las 3 imágenes EN PARALELO (mucho más rápido que secuencial)
    // 🎬 Usando prompts PREMIUM cinematográficos
    const imagePromises = concepts.map(async (concept: any, index: number) => {
      // Usar el nuevo sistema de prompts premium
      const imageResult = await generateConceptImage(
        '', // El prompt se genera internamente con el concepto
        index,
        {
          concept: concept,
          directorName: directorName || 'Creative Director',
          songInfo: {
            artist: req.body.artistName,
            title: req.body.songTitle
          },
          artistGender: artistGender // 🎭 Pasar género del artista para consistencia
        }
      );
      return {
        ...concept,
        coverImage: imageResult.imageUrl || null,
        isGenerating: false,
        error: imageResult.success ? null : imageResult.error,
        imageProvider: imageResult.provider || 'none',
        // 🎵 Añadir metadata de análisis
        musicGenre: musicGenre.genre,
        emotionalArc: emotions.arc
      };
    });

    const conceptsWithImages = await Promise.all(imagePromises);
    
    const successCount = conceptsWithImages.filter(c => c.coverImage).length;
    console.log(`✅ Generadas ${successCount}/${conceptsWithImages.length} imágenes de póster`);

    res.status(200).json({
      success: true,
      concepts: conceptsWithImages
    });

  } catch (error) {
    console.error('❌ Error generando conceptos de video:', error);
    res.status(500).json({ 
      error: 'Error generating video concepts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/music-video/generate-script
 * Genera el guión completo del video musical con todas las escenas
 * 
 * 🎵 INTEGRACIÓN AUDIO ANALYSIS:
 * Si se proporciona audioUrl, el script se enriquece automáticamente con:
 * - Timestamps alineados a beats musicales
 * - Información de sección musical (verso, coro, etc.)
 * - Transiciones recomendadas según energía
 * - Instrumento dominante para matching con músicos
 */
router.post("/generate-script", async (req: Request, res: Response) => {
  try {
    const { lyrics, concept, directorName, audioDuration, editingStyle, sceneCount, audioUrl } = req.body;

    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log(`🎬 Generando script completo de video musical con OpenAI...`);
    console.log(`📝 Duración: ${audioDuration}s, Escenas: ${sceneCount || 'auto'}`);

    // 🎵 AUDIO ANALYSIS: Analizar audio en paralelo si se proporciona URL
    let audioAnalysis: AudioAnalysisResult | null = null;
    let audioAnalysisPromise: Promise<AudioAnalysisResult> | null = null;
    
    if (audioUrl) {
      logger.log(`[generate-script] 🎵 Iniciando análisis de audio en paralelo...`);
      audioAnalysisPromise = analyzeAudio(audioUrl).catch(err => {
        logger.warn(`[generate-script] ⚠️ Audio analysis failed, continuing without: ${err.message}`);
        return null as any;
      });
    }

    const targetScenes = sceneCount || (audioDuration ? Math.ceil(audioDuration / 4) : 12);

    // 🎨 Construir sección de concepto visual si existe
    let conceptSection = '';
    if (concept) {
      conceptSection = `

🎨 VISUAL CONCEPT (USE THIS AS THE NARRATIVE FOUNDATION):
Story Concept: ${concept.story_concept || ''}
Visual Theme: ${concept.visual_theme || ''}
Mood Progression: ${concept.mood_progression || concept.mood || ''}
Color Palette: ${JSON.stringify(concept.color_palette || {})}
Main Wardrobe: ${JSON.stringify(concept.wardrobe || concept.main_wardrobe || {})}
Locations: ${JSON.stringify(concept.locations || [])}
Recurring Visual Elements: ${JSON.stringify(concept.recurring_visual_elements || [])}
Key Narrative Moments: ${JSON.stringify(concept.key_narrative_moments || [])}

⚠️ IMPORTANT: Every scene must align with this concept. The story_concept defines the narrative arc.
`;
    }

    // 📝 Dividir la letra en segmentos para asignar a cada escena
    const lyricsLines = lyrics.split('\n').filter((line: string) => line.trim().length > 0);
    const linesPerScene = Math.max(1, Math.ceil(lyricsLines.length / targetScenes));
    
    console.log(`📝 Letra: ${lyricsLines.length} líneas, ~${linesPerScene} líneas por escena`);

    // 🎬 DIRECTOR STYLES - Influencia específica de cada director en el guión
    const directorStylesForScript: Record<string, string> = {
      'Spike Jonze': `SPIKE JONZE SIGNATURE STYLE:
- Intimate, emotionally raw close-ups that capture vulnerability
- Whimsical surrealism blended with grounded reality
- Warm nostalgic color tones, golden hour lighting
- Practical effects over CGI, handmade quality
- Long takes that let emotions breathe
- Unexpected transitions and dreamlike sequences
- Music synced to subtle character movements`,
      'Hype Williams': `HYPE WILLIAMS SIGNATURE STYLE:
- Ultra-wide fisheye lens distortion in key scenes
- Opulent, maximalist set design with bling aesthetic
- Slow-motion glamour shots with high contrast lighting
- Neon colors, chrome surfaces, luxury brand placement
- Low angle power shots emphasizing dominance
- Quick cuts synced to beats, rhythmic editing
- Excess and spectacle in every frame`,
      'Michel Gondry': `MICHEL GONDRY SIGNATURE STYLE:
- Handcrafted DIY aesthetic with visible creativity
- Stop-motion elements and paper craft textures
- Vintage camera effects, Super 8 film grain
- Playful visual inventiveness and optical illusions
- Seamless in-camera transitions
- Recursive visual loops and patterns
- Childlike wonder meets sophisticated technique`,
      'David Fincher': `DAVID FINCHER SIGNATURE STYLE:
- Dark atmospheric shadows with precise lighting
- Desaturated, cold color palette with green/blue tints
- Meticulous symmetry and geometric framing
- Noir thriller mood, clinical precision
- Slow, deliberate camera movements
- High contrast with deep blacks
- Uncomfortable intimacy in close-ups`,
      'Edgar Wright': `EDGAR WRIGHT SIGNATURE STYLE:
- Dynamic kinetic framing with whip pans
- Bold color blocking and pop art palette
- Rhythmic visual comedy synced perfectly to music
- Quick zooms and snap cuts on beats
- Creative scene transitions (match cuts, wipes)
- British wit and pop culture homages
- Every frame packed with visual information`,
      'Denis Villeneuve': `DENIS VILLENEUVE SIGNATURE STYLE:
- Epic scale compositions with vast landscapes
- Minimalist elegance, space and silence
- Slow, contemplative camera movements
- Sci-fi grandeur even in intimate moments
- Muted earth tones with occasional color pops
- Atmospheric fog and haze
- Existential weight in every shot`,
      'Wes Anderson': `WES ANDERSON SIGNATURE STYLE:
- Perfectly symmetrical, centered framing
- Pastel color palette with bold accents
- Storybook aesthetic and whimsical production design
- Flat, lateral camera movements
- Precise, choreographed character blocking
- Nostalgic, handcrafted world-building
- Quirky typography and chapter cards`,
      'default': `PROFESSIONAL CINEMATIC STYLE:
- Balanced shot composition with rule of thirds
- Dynamic camera movements that serve the story
- Rich color grading with cinematic contrast
- Mix of wide establishing shots and intimate close-ups
- Smooth transitions between scenes
- Professional lighting setups`
    };

    const directorStyleSection = directorStylesForScript[directorName] || directorStylesForScript['default'];

    const prompt = `You are an award-winning music video director creating a COHESIVE NARRATIVE with visual variety. Generate a complete music video script for these lyrics. Return ONLY valid JSON, no markdown.

📜 SONG LYRICS (THIS IS THE FOUNDATION - EVERY SCENE MUST CONNECT TO THESE LYRICS):
${lyrics}
${conceptSection}

🎬 DIRECTOR: ${directorName || 'Creative Director'}
${directorStyleSection}

⚠️ CRITICAL: Every scene MUST reflect the director's signature visual style described above. The camera work, lighting, color grading, and overall aesthetic should be unmistakably ${directorName}'s work.

DURATION: ${audioDuration || 180} seconds
TARGET SCENES: ${targetScenes}
EDITING STYLE: ${editingStyle?.name || 'Dynamic'}

🎯 CRITICAL CREATIVE REQUIREMENTS:

1. **LYRICS-FIRST APPROACH**: 
   - DIVIDE the lyrics evenly across all ${targetScenes} scenes
   - Each scene's "lyrics" field MUST contain the actual lyrics for that moment
   - The "lyric_connection" field MUST explain how the visual interprets those specific lyrics
   - The "narrative_context" MUST connect the scene to the overall story inspired by the lyrics

2. **NARRATIVE COHERENCE**: Create a complete story arc with beginning, middle, and end. Every scene should connect logically to tell ONE cohesive story based on the concept and lyrics.

3. **SHOT VARIETY** (MUST FOLLOW THIS DISTRIBUTION):
   - 30% PERFORMANCE shots: Artist singing/performing (use "shot_category": "PERFORMANCE")
   - 40% B-ROLL shots: Cinematic visuals that tell the story WITHOUT the artist (use "shot_category": "B-ROLL")
   - 30% STORY shots: Narrative scenes with characters/elements from the story (use "shot_category": "STORY")

4. **VISUAL PROGRESSION**: Scenes should progress naturally:
   - Opening: Establish the world and main character
   - Rising: Develop the conflict or emotional journey
   - Climax: Peak emotional or visual moment
   - Resolution: Closure or final statement

Create exactly ${targetScenes} scenes. FIRST 10 SCENES ARE CRITICAL - they set the entire tone and narrative.

Each scene MUST include ALL these fields:

TECHNICAL:
- scene_number: Sequential number
- start_time: Start time in seconds
- duration: Scene duration (vary 2-6 seconds)
- shot_type: [close-up, medium-shot, wide-shot, extreme-close-up, over-shoulder, tracking-shot, crane-shot, drone-shot]
- camera_movement: [static, pan, tilt, dolly, tracking, handheld, steadicam, crane, drone, zoom]
- lens: [wide-angle, standard, telephoto, macro, fisheye]
- lighting: Specific lighting setup
- color_grading: Color treatment

NARRATIVE (NEW - CRITICAL FOR IMAGE GENERATION):
- shot_category: MUST be "PERFORMANCE" | "B-ROLL" | "STORY" (follow 30/40/30 distribution)
- use_artist_reference: Boolean - if true, use artist's face as reference (for performance, detail shots, or narrative scenes where artist appears)
- reference_usage: If using reference: "full_performance" | "detail_shot" | "alternate_angle" | "story_character" | "none"
  * full_performance: Artist performing/singing (traditional music video shot)
  * detail_shot: Close-up detail (hands, eyes, expression, gesture) - artist present but focus on specific element
  * alternate_angle: Different camera angle of same moment - creative cinematography
  * story_character: Artist as character in narrative (not performing, but acting/present in story)
  * none: Pure B-roll or visuals without artist
- narrative_context: 2-3 sentences explaining what's happening in the story at this moment
- lyric_connection: How this specific lyric connects to the visual concept
- story_progression: Where we are in the story arc (e.g., "Introduction of main character", "Rising tension", "Emotional climax")
- emotion: Primary emotion for this scene
- visual_description: DETAILED description (3-4 sentences) of exactly what we see - be specific about actions, expressions, environment, camera focus

SCENE DETAILS:
- lyrics: Lyrics for this scene
- music_section: [intro, verse, pre-chorus, chorus, bridge, breakdown, outro]
- location: Specific location
- props: Array of props
- wardrobe_notes: Wardrobe details

Return ONLY this JSON structure (no markdown, no explanation):
{
  "title": "Video title",
  "narrative_summary": "One paragraph summary of the complete story/concept",
  "total_duration": ${audioDuration || 180},
  "scenes": [
    {
      "scene_number": 1,
      "start_time": 0,
      "duration": 3.5,
      "lyrics": "...",
      "shot_type": "wide-shot",
      "shot_category": "STORY",
      "use_artist_reference": false,
      "reference_usage": "none",
      "camera_movement": "dolly",
      "lens": "wide-angle",
      "music_section": "intro",
      "narrative_context": "We open in a desolate urban landscape. The main character walks alone through empty streets, symbolizing isolation and searching for meaning.",
      "lyric_connection": "The opening lyrics about feeling lost mirror the visual of wandering through the city",
      "story_progression": "Act 1 - Introduction: Establishing the character's emotional state and world",
      "emotion": "melancholic, searching",
      "visual_description": "Wide establishing shot of a lone figure walking down a rain-slicked street at dusk. Neon signs reflect in puddles. The character is dressed in dark clothing, head down, shoulders hunched. Camera slowly dollies forward, following from behind.",
      "mood": "mysterious, melancholic",
      "lighting": "low-key dramatic with practical neon lights",
      "color_grading": "desaturated cool tones with warm neon accents",
      "location": "urban city street at dusk",
      "props": ["neon signs", "rain", "street lights"],
      "wardrobe_notes": "Dark jacket, casual street wear"
    }
  ]
}

IMPORTANT REFERENCE USAGE GUIDELINES:
- PERFORMANCE shots (30%): Always use_artist_reference=true with "full_performance"
- DETAIL SHOTS: use_artist_reference=true with "detail_shot" for cinematic close-ups (hands on instrument, eyes, facial expressions)
- ALTERNATE ANGLES: use_artist_reference=true with "alternate_angle" for creative cinematography of same performance
- STORY/CHARACTER: use_artist_reference=true with "story_character" when artist appears as character in narrative
- B-ROLL (40%): use_artist_reference=false with "none" for pure visuals without artist

This creates MAXIMUM REALISM and VISUAL VARIETY - the artist appears in multiple ways (performing, details, angles, character) while B-roll provides cinematic breathing space!

REMEMBER: Mix PERFORMANCE, B-ROLL, and STORY shots. Use artist reference creatively for detail shots and angles, not just full performance. Tell a COMPLETE STORY with visual variety!`;

    const textContent = await generateTextWithOpenAI(prompt, {
      temperature: 0.8,
      maxTokens: 8192
    });
    
    let cleanedContent = textContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    // Limpiar caracteres especiales y problemas de formato JSON
    cleanedContent = cleanedContent
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Eliminar caracteres de control
      .replace(/,\s*}/g, '}') // Eliminar comas trailing
      .replace(/,\s*]/g, ']') // Eliminar comas trailing en arrays
      .trim();

    let script: any;
    try {
      script = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.warn('⚠️ JSON parse error, attempting recovery:', parseError);
      // Último intento: usar regex para extraer JSON válido
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          script = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error(`JSON parsing failed after recovery attempt: ${parseError}`);
        }
      } else {
        throw new Error(`No valid JSON found in response: ${parseError}`);
      }
    }

    console.log(`✅ Script generado con ${script.scenes?.length || 0} escenas`);

    // 🎵 AUDIO ENRICHMENT: Esperar y aplicar análisis de audio si está disponible
    if (audioAnalysisPromise) {
      try {
        audioAnalysis = await audioAnalysisPromise;
        
        if (audioAnalysis && script.scenes) {
          logger.log(`[generate-script] 🎵 Enriqueciendo script con análisis de audio...`);
          
          const recommendations = generateEditingRecommendations(audioAnalysis);
          
          // 🎵 DURACIONES INTELIGENTES basadas en sección musical
          const durationsBySection: Record<string, { min: number; max: number }> = {
            'intro': { min: 3, max: 5 },      // Intro: clips más largos, establecen la escena
            'verse': { min: 2, max: 3.5 },    // Verso: storytelling, ritmo moderado
            'pre-chorus': { min: 1.5, max: 2.5 }, // Pre-coro: building tension, cortes más rápidos
            'chorus': { min: 1.5, max: 2.5 }, // Coro: energía alta, cortes rápidos
            'bridge': { min: 3, max: 4.5 },   // Bridge: pausa dramática, clips más largos
            'breakdown': { min: 2, max: 4 },  // Breakdown: variado
            'outro': { min: 3, max: 5 },      // Outro: desaceleración, clips largos
            'solo': { min: 2.5, max: 4 },     // Solo: spotlight musical
            'instrumental': { min: 2, max: 4 }, // Instrumental: B-roll variado
          };
          
          // Enriquecer cada escena con información musical
          script.scenes = script.scenes.map((scene: any, index: number) => {
            const startTime = scene.start_time || (index * (audioDuration / script.scenes.length));
            
            // Encontrar sección musical
            const section = audioAnalysis!.sections.find(
              s => startTime >= s.startTime && startTime < s.endTime
            );
            
            // 🎵 DURACIÓN INTELIGENTE basada en sección
            const sectionType = section?.type || 'verse';
            const durationRange = durationsBySection[sectionType] || { min: 2, max: 4 };
            const smartDuration = durationRange.min + Math.random() * (durationRange.max - durationRange.min);
            const originalDuration = scene.duration || 3;
            
            // Usar la duración inteligente si es significativamente diferente
            const finalDuration = Math.round(smartDuration * 10) / 10; // Redondear a 1 decimal
            
            const endTime = startTime + finalDuration;
            
            // Encontrar beat más cercano para snap
            const nearestBeat = audioAnalysis!.beats.reduce((prev, curr) => 
              Math.abs(curr - startTime) < Math.abs(prev - startTime) ? curr : prev
            , audioAnalysis!.beats[0] || startTime);
            
            // Verificar si es un key moment
            const keyMoment = audioAnalysis!.keyMoments.find(
              km => Math.abs(km.timestamp - startTime) < 1.5
            );
            
            // Encontrar instrumento dominante
            let dominantInstrument: string | null = null;
            for (const inst of audioAnalysis!.instruments) {
              const activeSegment = inst.segments.find(
                seg => startTime >= seg.startTime && startTime < seg.endTime && seg.prominence === 'lead'
              );
              if (activeSegment) {
                dominantInstrument = inst.name;
                break;
              }
            }
            
            return {
              ...scene,
              // 🎵 DURACIÓN INTELIGENTE
              duration: finalDuration,
              original_duration: originalDuration,
              
              // 🎵 Timestamps alineados a música
              beat_aligned_start: nearestBeat,
              original_start_time: scene.start_time,
              
              // 🎵 Sección musical
              audio_section: section?.type || 'unknown',
              audio_energy: section?.energy || 'medium',
              
              // 🎵 Transición recomendada según energía
              suggested_transition: recommendations.transitionsByEnergy[section?.energy || 'medium'],
              
              // 🎵 Instrumento dominante (para matching con músicos)
              dominant_instrument: dominantInstrument,
              
              // 🎵 Key moment info
              is_key_moment: !!keyMoment,
              key_moment_type: keyMoment?.type,
              key_moment_effect: keyMoment?.suggestedEffect,
            };
          });
          
          // Recalcular start_times basados en nuevas duraciones
          let cumulativeTime = 0;
          script.scenes = script.scenes.map((scene: any) => {
            const adjustedScene = {
              ...scene,
              start_time: Math.round(cumulativeTime * 10) / 10,
            };
            cumulativeTime += scene.duration;
            return adjustedScene;
          });
          
          // Añadir metadata de audio al script
          script.audioAnalysis = {
            bpm: audioAnalysis.bpm,
            key: audioAnalysis.key,
            duration: audioAnalysis.duration,
            sectionsCount: audioAnalysis.sections.length,
            sections: audioAnalysis.sections.map(s => ({
              type: s.type,
              startTime: s.startTime,
              endTime: s.endTime,
              energy: s.energy,
            })),
            keyMomentsCount: audioAnalysis.keyMoments.length,
          };
          
          // Log de duraciones variadas
          const durations = script.scenes.map((s: any) => s.duration);
          const minDur = Math.min(...durations);
          const maxDur = Math.max(...durations);
          const avgDur = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
          
          logger.log(`[generate-script] ✅ Script enriquecido con DURACIONES INTELIGENTES:
            - BPM: ${audioAnalysis.bpm}
            - Secciones: ${audioAnalysis.sections.length}
            - Key Moments: ${audioAnalysis.keyMoments.length}
            - Duraciones: min=${minDur.toFixed(1)}s, max=${maxDur.toFixed(1)}s, avg=${avgDur.toFixed(1)}s
          `);
        }
      } catch (enrichError: any) {
        logger.warn(`[generate-script] ⚠️ Error enriching script: ${enrichError.message}`);
        // Continuar sin enriquecimiento
      }
    }

    res.status(200).json({
      success: true,
      script: script,
      audioAnalyzed: !!audioAnalysis,
    });

  } catch (error) {
    console.error('❌ Error generando script de video:', error);
    res.status(500).json({ 
      error: 'Error generating video script',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/music-video/enhance-prompt
 * Mejora un prompt básico de video con detalles cinematográficos
 */
router.post("/enhance-prompt", async (req: Request, res: Response) => {
  try {
    const { basePrompt, shotType, mood, visualStyle } = req.body;

    if (!basePrompt) {
      return res.status(400).json({ error: 'Base prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log(`🎨 Mejorando prompt cinematográfico con OpenAI...`);

    const enhancePrompt = `You are a professional cinematic prompt engineer. Take this basic video prompt and enhance it with detailed, visually expressive cinematographic details while maintaining all technical specifications.

BASE PROMPT: ${basePrompt}
SHOT TYPE: ${shotType || 'medium-shot'}
MOOD: ${mood || 'dramatic'}
VISUAL STYLE: ${visualStyle || 'cinematic'}

Enhance this prompt with:
- Specific lighting details (direction, quality, color temperature)
- Camera angles and movements
- Composition details (rule of thirds, leading lines, etc.)
- Atmospheric elements (fog, rain, particles, etc.)
- Color palette and grading notes
- Depth and focus details
- Professional cinematography terms

Return ONLY the enhanced prompt text, no JSON, no extra formatting.`;

    const enhancedPrompt = await generateTextWithOpenAI(enhancePrompt, {
      temperature: 0.7,
      maxTokens: 500
    });
    
    if (!enhancedPrompt) {
      throw new Error('No enhanced prompt received from OpenAI');
    }

    console.log(`✅ Prompt mejorado generado`);

    res.status(200).json({
      success: true,
      enhancedPrompt: enhancedPrompt
    });

  } catch (error) {
    console.error('❌ Error mejorando prompt:', error);
    res.status(500).json({ 
      error: 'Error enhancing prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
