/**
 * Rutas para generación de conceptos de videos musicales usando Gemini
 */
import { Router, Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import fetch from 'node-fetch';

const router = Router();

// Configurar múltiples clientes de Gemini para fallback automático
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2
].filter(key => key && key.length > 0);

const geminiClients = apiKeys.map(key => new GoogleGenAI({ apiKey: key || "" }));

/**
 * Intenta generar contenido con fallback automático entre API keys
 */
async function generateContentWithFallback(params: any): Promise<any> {
  let lastError: any = null;
  
  for (let i = 0; i < geminiClients.length; i++) {
    try {
      console.log(`🔑 Generando con Gemini API key ${i + 1}/${geminiClients.length}...`);
      const client = geminiClients[i];
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API timeout después de 60 segundos')), 60000);
      });
      
      const generationPromise = client.models.generateContent(params);
      
      const response = await Promise.race([generationPromise, timeoutPromise]);
      console.log(`✅ Generación exitosa con API key ${i + 1}`);
      return response;
    } catch (error: any) {
      lastError = error;
      
      console.error(`❌ Error con API key ${i + 1}:`, error.message);
      
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.warn(`⚠️ API key ${i + 1} sin cuota disponible, intentando con siguiente key...`);
        continue;
      }
      
      if (error.message?.includes('timeout')) {
        console.warn(`⏱️ API key ${i + 1} timeout, intentando con siguiente key...`);
        continue;
      }
      
      throw error;
    }
  }
  
  console.error('❌ Todas las API keys agotaron su cuota o fallaron');
  throw lastError || new Error('Todas las API keys de Gemini han fallado');
}

/**
 * Genera imagen con FLUX Context (fal-ai/flux-pro/kontext) - RÁPIDO
 * Fallback a Gemini si falla
 */
async function generateConceptImage(prompt: string, conceptIndex: number): Promise<{ success: boolean; imageUrl?: string; error?: string; provider?: string }> {
  const FAL_API_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
  
  // INTENTO 1: FLUX Context (más rápido - 2x)
  if (FAL_API_KEY) {
    try {
      console.log(`🚀 [Concept #${conceptIndex + 1}] Generando con FLUX Context...`);
      
      const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          image_size: 'portrait_4_3',
          num_images: 1,
          num_inference_steps: 30,
          guidance_scale: 3.5,
          enable_safety_checker: false
        })
      });

      if (response.ok) {
        const result = await response.json() as any;
        if (result.images && result.images.length > 0) {
          console.log(`✅ [Concept #${conceptIndex + 1}] Imagen generada con FLUX (rápido!)`);
          return {
            success: true,
            imageUrl: result.images[0].url,
            provider: 'flux-context'
          };
        }
      }
    } catch (fluxError: any) {
      console.warn(`⚠️ [Concept #${conceptIndex + 1}] FLUX falló:`, fluxError.message);
    }
  }

  // INTENTO 2: Gemini 2.5 Flash Image (fallback)
  try {
    console.log(`🔄 [Concept #${conceptIndex + 1}] Fallback a Gemini 2.5 Flash Image...`);
    
    // Generar imagen con Gemini usando el cliente disponible
    const client = geminiClients[0];
    if (!client) {
      return { success: false, error: 'No Gemini client available' };
    }

    const response = await generateContentWithFallback({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [{ text: `Create a cinematic movie poster for a music video with this concept: ${prompt}. High-quality, professional, cinematographic style.` }]
        }
      ],
      config: {
        temperature: 0.7,
      }
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
    if (imagePart?.inlineData?.data) {
      const base64Image = imagePart.inlineData.data;
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;
      console.log(`✅ [Concept #${conceptIndex + 1}] Imagen generada con Gemini fallback`);
      return {
        success: true,
        imageUrl: dataUrl,
        provider: 'gemini-fallback'
      };
    }

    return { success: false, error: 'No image data from Gemini' };
  } catch (geminiError: any) {
    console.error(`❌ [Concept #${conceptIndex + 1}] Gemini fallback también falló:`, geminiError.message);
    return { success: false, error: geminiError.message };
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

    if (geminiClients.length === 0) {
      return res.status(500).json({ error: 'No Gemini API keys configured' });
    }

    console.log(`🎬 Generando 3 conceptos de video musical con Gemini...`);
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

    const response = await generateContentWithFallback({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      config: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
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

    if (geminiClients.length === 0) {
      return res.status(500).json({ error: 'No Gemini API keys configured' });
    }

    console.log(`🎬 Generando script completo de video musical con Gemini...`);
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

    const response = await generateContentWithFallback({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      config: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error('No content received from Gemini');
    }

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

    if (geminiClients.length === 0) {
      return res.status(500).json({ error: 'No Gemini API keys configured' });
    }

    console.log(`🎨 Mejorando prompt cinematográfico con Gemini...`);

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

    const response = await generateContentWithFallback({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [{ text: enhancePrompt }]
        }
      ],
      config: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 500,
      }
    });

    const enhancedPrompt = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    
    if (!enhancedPrompt) {
      throw new Error('No enhanced prompt received from Gemini');
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
