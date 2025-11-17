/**
 * Rutas para generación de conceptos de videos musicales usando Gemini
 */
import { Router, Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";

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

    res.status(200).json({
      success: true,
      concepts: concepts
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

    const prompt = `Generate a complete music video script for these lyrics. Return ONLY valid JSON, no markdown.

LYRICS:
${lyrics}
${conceptSection}
DIRECTOR: ${directorName || 'Creative Director'}
DURATION: ${audioDuration || 180} seconds
TARGET SCENES: ${targetScenes}
EDITING STYLE: ${editingStyle?.name || 'Dynamic'}

Create a detailed script with exactly ${targetScenes} scenes. Each scene MUST include:
- scene_number: Sequential number
- start_time: Start time in seconds
- duration: Scene duration in seconds (vary between 2-6 seconds)
- lyrics: Lyrics for this scene
- shot_type: One of [close-up, medium-shot, wide-shot, extreme-close-up, over-shoulder, tracking-shot, crane-shot, drone-shot]
- camera_movement: One of [static, pan, tilt, dolly, tracking, handheld, steadicam, crane, drone, zoom]
- lens: One of [wide-angle, standard, telephoto, macro, fisheye]
- role: Either "performance" or "b-roll"
- music_section: One of [intro, verse, pre-chorus, chorus, bridge, breakdown, outro]
- visual_description: Detailed description of what's happening
- mood: Emotional tone
- lighting: Lighting setup
- color_grading: Color treatment
- location: Where this scene takes place
- props: Array of props needed
- wardrobe_notes: Wardrobe details for this scene

Return ONLY this JSON structure (no markdown):
{
  "title": "Video title",
  "total_duration": ${audioDuration || 180},
  "scenes": [
    {
      "scene_number": 1,
      "start_time": 0,
      "duration": 3.5,
      "lyrics": "...",
      "shot_type": "wide-shot",
      "camera_movement": "dolly",
      "lens": "wide-angle",
      "role": "performance",
      "music_section": "intro",
      "visual_description": "...",
      "mood": "mysterious",
      "lighting": "low-key dramatic",
      "color_grading": "cool tones",
      "location": "urban rooftop",
      "props": ["microphone", "fog machine"],
      "wardrobe_notes": "..."
    }
  ]
}`;

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

    const script = JSON.parse(cleanedContent);

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
