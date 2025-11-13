import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * POST /api/gemini/analyze-face
 * Analiza fotos del artista para extraer características faciales detalladas
 */
router.post('/analyze-face', async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Se requieren imágenes para analizar' });
    }

    console.log(`🔍 Analizando ${images.length} fotos del artista...`);

    // Convertir base64 a formato para Gemini
    const imageParts = images.map((base64Image: string) => {
      // Remover el prefijo data:image/...;base64, si existe
      const base64Data = base64Image.includes('base64,') 
        ? base64Image.split('base64,')[1] 
        : base64Image;
      
      return {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      };
    });

    // Usar Gemini 2.0 Flash para análisis visual
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze these ${images.length} photo(s) of the same person in extreme detail. Extract ALL facial characteristics with precision.

Return ONLY valid JSON with this EXACT structure (no markdown, no code blocks):
{
  "faceShape": "oval|round|square|heart|diamond|rectangular",
  "jawline": "strong|soft|angular|rounded|defined",
  "cheekbones": "high|prominent|subtle|soft",
  "eyeShape": "almond|round|hooded|monolid|upturned|downturned",
  "eyeColor": "brown|blue|green|hazel|amber|gray",
  "eyeSize": "large|medium|small",
  "eyebrowShape": "arched|straight|curved|thick|thin",
  "eyeSpacing": "close-set|wide-set|normal",
  "noseShape": "straight|Roman|button|aquiline|snub|broad|narrow",
  "noseSize": "proportionate|prominent|small",
  "lipShape": "full|thin|bow-shaped|heart-shaped|wide|narrow",
  "lipSize": "full|medium|thin",
  "smileType": "wide|subtle|closed|toothy|asymmetric",
  "hairColor": "exact color description",
  "hairTexture": "straight|wavy|curly|coily",
  "hairStyle": "detailed description",
  "hairline": "straight|widow's peak|receding|high|low",
  "skinTone": "fair|light|medium|tan|olive|brown|deep",
  "skinTexture": "smooth|textured|clear|freckled",
  "distinctiveFeatures": ["feature1", "feature2"],
  "typicalExpression": "description",
  "facialProportions": {
    "foreheadSize": "large|medium|small",
    "eyeToEyeDistance": "close|normal|wide",
    "noseToLipDistance": "short|normal|long",
    "chinSize": "strong|moderate|delicate"
  },
  "apparentAge": "young adult|adult|mature",
  "perceivedGender": "masculine|feminine|androgynous",
  "overallDescription": "Complete detailed description in 2-3 sentences",
  "generationPrompt": "Optimized prompt for AI image generation describing this exact person's features"
}

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code blocks. Start with { and end with }.`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    console.log('📊 Respuesta de Gemini recibida');

    // Limpiar la respuesta si viene con markdown
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(cleanedResponse);
    
    console.log('✅ Análisis facial completado exitosamente');
    console.log(`   - Forma de cara: ${analysis.faceShape}`);
    console.log(`   - Ojos: ${analysis.eyeShape}, ${analysis.eyeColor}`);
    console.log(`   - Tono de piel: ${analysis.skinTone}`);

    res.json({ 
      success: true, 
      analysis 
    });

  } catch (error) {
    console.error('❌ Error en análisis facial:', error);
    res.status(500).json({ 
      error: 'Error analizando características faciales',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
