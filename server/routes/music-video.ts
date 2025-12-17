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
 * Genera contenido de texto usando OpenAI gpt-4o-mini
 */
async function generateTextWithOpenAI(prompt: string, options: {
  temperature?: number;
  maxTokens?: number;
} = {}): Promise<string> {
  console.log(`🤖 Generando texto con OpenAI gpt-4o-mini...`);
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
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
  
  console.log(`✅ Texto generado con OpenAI`);
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
 * Genera 3 propuestas de conceptos visuales para un video musical
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

    console.log(`🎬 Generando 3 conceptos de video musical con OpenAI...`);
    console.log(`📝 Letra: ${lyrics.substring(0, 100)}...`);
    console.log(`🎭 Director: ${directorName || 'Unknown'}`);
    console.log(`👤 Género del artista: ${artistGender || 'no especificado'} → ${genderDescription}`);

    const prompt = `Based on these lyrics and director style, create three distinct, creative music video concepts. Each concept should showcase a different visual and narrative approach to the same song.

LYRICS:
${lyrics}

DIRECTOR: ${directorName || 'Creative Director'}
${audioDuration ? `DURATION: ${Math.floor(audioDuration)} seconds` : ''}

🎭 CRITICAL - ARTIST IDENTITY:
The main performer is a ${genderDescription}. ALL visual descriptions, wardrobe, and character references MUST accurately represent this gender. Do NOT describe the artist with incorrect gender characteristics.
${characterReference && characterReference.length > 0 ? `NOTE: The artist has ${characterReference.length} reference images provided for visual consistency. Use these to inform accurate character depiction.` : ''}

Create three complete concepts, each with:
1. A unique title (creative, catchy, cinema-style)
2. A compelling story/narrative concept
3. Visual theme and aesthetic (cinematography style, color palette, mood)
4. Key scenes and moments
5. Wardrobe and styling details
6. Location/setting descriptions

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "concepts": [
    {
      "title": "Concept Title",
      "story_concept": "The narrative story...",
      "visual_theme": "Visual aesthetic and cinematography style...",
      "color_palette": {
        "primary_colors": ["color1", "color2"],
        "accent_colors": ["color3"],
        "mood_colors": "Description of color mood"
      },
      "wardrobe": {
        "main_outfit": "Description...",
        "color_scheme": "Colors...",
        "style_notes": "Style details..."
      },
      "key_scenes": [
        {
          "timestamp": "0:30",
          "description": "What happens at this moment",
          "visual_style": "How it looks"
        }
      ],
      "locations": ["Location 1", "Location 2"],
      "mood": "Overall emotional tone"
    }
  ]
}`;

    const fullPrompt = `You are an expert music video creative director working with ${directorName}. Create three distinct, creative concepts that showcase different approaches to the same song. Return ONLY valid JSON, no markdown formatting.

${prompt}`;

    const textContent = await generateTextWithOpenAI(fullPrompt, {
      temperature: 0.9,
      maxTokens: 8192
    });
    
    if (!textContent) {
      throw new Error('No content received from Gemini');
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

    console.log(`✅ Generados ${concepts.length} conceptos de video musical`);
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
        imageProvider: imageResult.provider || 'none'
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
          
          // Enriquecer cada escena con información musical
          script.scenes = script.scenes.map((scene: any, index: number) => {
            const startTime = scene.start_time || (index * (audioDuration / script.scenes.length));
            const endTime = scene.start_time + (scene.duration || 3);
            
            // Encontrar sección musical
            const section = audioAnalysis!.sections.find(
              s => startTime >= s.startTime && startTime < s.endTime
            );
            
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
          
          logger.log(`[generate-script] ✅ Script enriquecido con:
            - BPM: ${audioAnalysis.bpm}
            - Secciones: ${audioAnalysis.sections.length}
            - Key Moments: ${audioAnalysis.keyMoments.length}
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
