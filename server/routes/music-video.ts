/**
 * Rutas para generación de conceptos de videos musicales usando OpenAI + FAL
 */
import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { generateImageWithNanoBanana } from '../services/fal-service';

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
 * Genera imagen con FAL nano-banana (Gemini 2.5 Flash via FAL)
 */
async function generateConceptImage(prompt: string, conceptIndex: number): Promise<{ success: boolean; imageUrl?: string; error?: string; provider?: string }> {
  try {
    console.log(`🎨 [Concept #${conceptIndex + 1}] Generando imagen con FAL nano-banana...`);
    
    const enhancedPrompt = `Create a cinematic movie poster for a music video with this concept: ${prompt}. High-quality, professional, cinematographic style.`;
    
    const result = await generateImageWithNanoBanana(enhancedPrompt, {
      aspectRatio: '3:4', // Portrait para pósters
      numImages: 1,
      outputFormat: 'png'
    });

    if (result.success && result.imageUrl) {
      console.log(`✅ [Concept #${conceptIndex + 1}] Imagen generada con FAL nano-banana`);
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
    const { lyrics, directorName, characterReference, audioDuration } = req.body;

    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log(`🎬 Generando 3 conceptos de video musical con OpenAI...`);
    console.log(`📝 Letra: ${lyrics.substring(0, 100)}...`);
    console.log(`🎭 Director: ${directorName || 'Unknown'}`);

    const prompt = `Based on these lyrics and director style, create three distinct, creative music video concepts. Each concept should showcase a different visual and narrative approach to the same song.

LYRICS:
${lyrics}

DIRECTOR: ${directorName || 'Creative Director'}
${audioDuration ? `DURATION: ${Math.floor(audioDuration)} seconds` : ''}
${characterReference && characterReference.length > 0 ? `NOTE: The artist has ${characterReference.length} reference images provided for visual consistency.` : ''}

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
    const imagePromises = concepts.map(async (concept: any, index: number) => {
      // Crear prompt para la imagen basado en el concepto
      const imagePrompt = `Professional cinematic movie poster for music video concept:
Title: ${concept.title}
Visual Theme: ${concept.visual_theme}
Mood: ${concept.mood}
Color Palette: ${concept.color_palette?.primary_colors?.join(', ')}
Story: ${concept.story_concept?.substring(0, 150)}...
Style: High-quality Hollywood-level cinematography, 4K poster design`;

      const imageResult = await generateConceptImage(imagePrompt, index);
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
 */
router.post("/generate-script", async (req: Request, res: Response) => {
  try {
    const { lyrics, concept, directorName, audioDuration, editingStyle, sceneCount } = req.body;

    if (!lyrics) {
      return res.status(400).json({ error: 'Lyrics are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log(`🎬 Generando script completo de video musical con OpenAI...`);
    console.log(`📝 Duración: ${audioDuration}s, Escenas: ${sceneCount || 'auto'}`);

    const targetScenes = sceneCount || (audioDuration ? Math.ceil(audioDuration / 4) : 12);

    let conceptSection = '';
    if (concept) {
      conceptSection = `

🎨 VISUAL CONCEPT (USE THIS AS FOUNDATION):
Story: ${concept.story_concept || ''}
Visual Theme: ${concept.visual_theme || ''}
Mood: ${concept.mood || ''}
Color Palette: ${JSON.stringify(concept.color_palette || {})}
Wardrobe: ${JSON.stringify(concept.wardrobe || concept.main_wardrobe || {})}
Locations: ${JSON.stringify(concept.locations || [])}
`;
    }

    const prompt = `You are an award-winning music video director creating a COHESIVE NARRATIVE with visual variety. Generate a complete music video script for these lyrics. Return ONLY valid JSON, no markdown.

LYRICS:
${lyrics}
${conceptSection}
DIRECTOR: ${directorName || 'Creative Director'}
DURATION: ${audioDuration || 180} seconds
TARGET SCENES: ${targetScenes}
EDITING STYLE: ${editingStyle?.name || 'Dynamic'}

🎯 CRITICAL CREATIVE REQUIREMENTS:

1. **NARRATIVE COHERENCE**: Create a complete story arc with beginning, middle, and end. Every scene should connect logically to tell ONE cohesive story based on the concept and lyrics.

2. **SHOT VARIETY** (MUST FOLLOW THIS DISTRIBUTION):
   - 30% PERFORMANCE shots: Artist singing/performing (use "shot_category": "PERFORMANCE")
   - 40% B-ROLL shots: Cinematic visuals that tell the story WITHOUT the artist (use "shot_category": "B-ROLL")
   - 30% STORY shots: Narrative scenes with characters/elements from the story (use "shot_category": "STORY")

3. **VISUAL PROGRESSION**: Scenes should progress naturally:
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

    res.status(200).json({
      success: true,
      script: script
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
