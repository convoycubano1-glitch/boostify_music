import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import OpenAI from 'openai';
import { ApifyClient } from 'apify-client';
import { db } from '../db';
import { musicIndustryContacts, outreachTemplates, users } from '../../db/schema';
import { eq, or, ilike, and, sql, desc, inArray } from 'drizzle-orm';

const router = express.Router();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Initialize Apify Client
const getApifyClient = () => {
  return new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });
};

/**
 * POST /api/pr-ai/generate-pitch
 * Genera un mensaje pitch profesional usando OpenAI + plantillas + biografía completa
 */
router.post('/generate-pitch', authenticate, async (req: Request, res: Response) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        success: false, 
        message: 'OpenAI no está configurado' 
      });
    }

    const { artistName, contentType, contentTitle, genre, biography, artistProfileUrl, templateId, mediaType } = req.body;

    if (!artistName || !contentType || !contentTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos' 
      });
    }

    // Fetch template if provided
    let templateContent = '';
    if (templateId) {
      const [template] = await db
        .select()
        .from(outreachTemplates)
        .where(eq(outreachTemplates.id, templateId));
      
      if (template) {
        templateContent = template.bodyHtml || template.bodyText || '';
      }
    }

    // Build enhanced prompt with full biography and template reference
    const prompt = `Eres un experto en relaciones públicas para la industria musical latina. 
Tu objetivo es crear un pitch personalizado que logre respuestas de medios de comunicación.

INFORMACIÓN DEL ARTISTA:
- Nombre artístico: ${artistName}
- Género musical: ${genre || 'música urbana/latin'}
- Landing page: ${artistProfileUrl || 'No disponible'}
${biography ? `
BIOGRAFÍA COMPLETA DEL ARTISTA:
${biography}
` : ''}

LANZAMIENTO A PROMOCIONAR:
- Tipo de contenido: ${contentType}
- Título: ${contentTitle}
- Tipo de medio objetivo: ${mediaType || 'general (radio, podcast, blog, TV)'}

${templateContent ? `
PLANTILLA DE REFERENCIA (usa este estilo y tono):
${templateContent}
` : ''}

INSTRUCCIONES PARA EL PITCH:
1. Personaliza el mensaje basándote en la biografía del artista
2. Destaca logros específicos mencionados en la biografía
3. Adapta el tono al tipo de medio objetivo
4. Incluye un call-to-action claro (entrevista, reseña, airplay)
5. Mantén el mensaje entre 3-5 frases concisas
6. Menciona la landing page del artista para más información
7. Sé auténtico y evita frases genéricas

NO incluyas saludos ni despedidas, solo el cuerpo del pitch.
El pitch debe poder insertarse directamente en un email profesional.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.8
    });

    const generatedText = response.choices[0]?.message?.content || '';

    res.json({
      success: true,
      pitch: generatedText.trim()
    });

  } catch (error: any) {
    console.error('[PR AI GENERATE PITCH ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al generar pitch' 
    });
  }
});

/**
 * POST /api/pr-ai/find-matching-contacts
 * Encuentra contactos de la base de datos que coincidan con el perfil del artista
 */
router.post('/find-matching-contacts', authenticate, async (req: Request, res: Response) => {
  try {
    const { genres, countries, mediaTypes, limit = 50 } = req.body;

    // Build dynamic conditions based on artist profile
    const conditions = [];
    
    // Map mediaTypes to categories
    const mediaToCategory: Record<string, string> = {
      'radio': 'radio',
      'tv': 'tv',
      'podcast': 'radio', // Podcasts often under radio category
      'blog': 'pr_marketing',
      'magazine': 'pr_marketing'
    };

    // Filter by media type categories
    if (mediaTypes && mediaTypes.length > 0) {
      const categories = [...new Set(mediaTypes.map((m: string) => mediaToCategory[m] || 'other'))];
      if (categories.length > 0) {
        conditions.push(
          sql`${musicIndustryContacts.category} IN (${sql.join(categories.map(c => sql`${c}`), sql`, `)})`
        );
      }
    }

    // Filter by countries (check if any of the target countries match)
    if (countries && countries.length > 0) {
      const countryConditions = countries.map((country: string) => 
        ilike(musicIndustryContacts.country, `%${country}%`)
      );
      conditions.push(or(...countryConditions));
    }

    // Filter by genres in keywords
    if (genres && genres.length > 0) {
      const genreConditions = genres.map((genre: string) => 
        ilike(musicIndustryContacts.keywords, `%${genre}%`)
      );
      conditions.push(or(...genreConditions));
    }

    // Only get contacts with email
    conditions.push(sql`${musicIndustryContacts.email} IS NOT NULL`);
    
    // Only get new or not recently contacted
    conditions.push(
      or(
        eq(musicIndustryContacts.status, 'new'),
        sql`${musicIndustryContacts.lastContactedAt} < NOW() - INTERVAL '30 days'`
      )
    );

    // Execute query
    const contacts = await db
      .select({
        id: musicIndustryContacts.id,
        fullName: musicIndustryContacts.fullName,
        email: musicIndustryContacts.email,
        jobTitle: musicIndustryContacts.jobTitle,
        companyName: musicIndustryContacts.companyName,
        category: musicIndustryContacts.category,
        country: musicIndustryContacts.country,
        keywords: musicIndustryContacts.keywords,
        status: musicIndustryContacts.status,
        emailsSent: musicIndustryContacts.emailsSent
      })
      .from(musicIndustryContacts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .orderBy(desc(musicIndustryContacts.createdAt));

    res.json({
      success: true,
      contacts,
      count: contacts.length,
      filters: { genres, countries, mediaTypes }
    });

  } catch (error: any) {
    console.error('[PR AI FIND CONTACTS ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al buscar contactos' 
    });
  }
});

/**
 * POST /api/pr-ai/extract-media-contacts
 * Extrae contactos de medios usando Apify (20 a la vez para no saturar)
 */
router.post('/extract-media-contacts', authenticate, async (req: Request, res: Response) => {
  try {
    const { searchQuery, country, mediaType, batchSize = 20 } = req.body;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'searchQuery es requerido'
      });
    }

    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_TOKEN) {
      return res.status(503).json({
        success: false,
        message: 'Apify no está configurado'
      });
    }

    const apifyClient = getApifyClient();

    // Build search query for media contacts
    const fullQuery = `${searchQuery} ${country || ''} ${mediaType || ''} contacto email`.trim();

    console.log(`🔍 [APIFY PR] Extracting media contacts: "${fullQuery}" (batch: ${batchSize})`);

    // Use Google Search Scraper to find media contacts
    const run = await apifyClient.actor('apify/google-search-scraper').call({
      queries: fullQuery,
      maxPagesPerQuery: 1,
      resultsPerPage: Math.min(batchSize, 20), // Limit to 20 max per batch
      mobileResults: false,
      languageCode: 'es',
      countryCode: country === 'USA' ? 'us' : 
                   country === 'Mexico' ? 'mx' : 
                   country === 'España' ? 'es' :
                   country === 'Colombia' ? 'co' :
                   country === 'Argentina' ? 'ar' : 'mx'
    });

    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    // Process and extract contact info from search results
    const extractedContacts: any[] = [];
    const batchId = `apify_${Date.now()}`;

    for (const item of items) {
      // Extract organic results
      const organicResults = item.organicResults || [];
      
      for (const result of organicResults.slice(0, batchSize)) {
        // Try to extract email from snippets or descriptions
        const emailMatch = result.description?.match(/[\w.-]+@[\w.-]+\.\w+/);
        const phoneMatch = result.description?.match(/\+?[\d\s-]{10,}/);

        const contact = {
          fullName: result.title?.substring(0, 100) || 'Media Contact',
          email: emailMatch ? emailMatch[0] : null,
          phone: phoneMatch ? phoneMatch[0]?.trim() : null,
          companyName: result.displayedLink || result.link?.split('/')[2] || null,
          companyWebsite: result.link,
          jobTitle: mediaType ? `${mediaType} Contact` : 'Media Contact',
          country: country || null,
          category: mediaType === 'radio' ? 'radio' : 
                   mediaType === 'tv' ? 'tv' : 
                   mediaType === 'podcast' ? 'radio' : 
                   'pr_marketing',
          keywords: searchQuery,
          importSource: 'apify',
          importBatchId: batchId,
          status: 'new'
        };

        // Only add if we have at least company info or email
        if (contact.email || contact.companyWebsite) {
          extractedContacts.push(contact);
        }
      }
    }

    // Save to database (skip duplicates by email)
    let savedCount = 0;
    let skippedCount = 0;

    for (const contact of extractedContacts) {
      try {
        // Check if email already exists
        if (contact.email) {
          const existing = await db
            .select({ id: musicIndustryContacts.id })
            .from(musicIndustryContacts)
            .where(eq(musicIndustryContacts.email, contact.email))
            .limit(1);

          if (existing.length > 0) {
            skippedCount++;
            continue;
          }
        }

        // Insert new contact
        await db.insert(musicIndustryContacts).values(contact as any);
        savedCount++;
      } catch (err) {
        console.error('Error saving contact:', err);
        skippedCount++;
      }
    }

    console.log(`✅ [APIFY PR] Saved ${savedCount} new contacts, skipped ${skippedCount} duplicates`);

    res.json({
      success: true,
      extracted: extractedContacts.length,
      saved: savedCount,
      skipped: skippedCount,
      batchId,
      message: `Extraídos ${extractedContacts.length} contactos, guardados ${savedCount} nuevos`
    });

  } catch (error: any) {
    console.error('[APIFY PR EXTRACT ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al extraer contactos' 
    });
  }
});

/**
 * POST /api/pr-ai/enrich-contacts
 * Enriquece contactos existentes con más información usando Apify
 */
router.post('/enrich-contacts', authenticate, async (req: Request, res: Response) => {
  try {
    const { contactIds, batchSize = 10 } = req.body;

    if (!contactIds || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'contactIds es requerido'
      });
    }

    const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
    if (!APIFY_TOKEN) {
      return res.status(503).json({
        success: false,
        message: 'Apify no está configurado'
      });
    }

    // Get contacts to enrich
    const contacts = await db
      .select()
      .from(musicIndustryContacts)
      .where(inArray(musicIndustryContacts.id, contactIds.slice(0, batchSize)));

    const apifyClient = getApifyClient();
    let enrichedCount = 0;

    for (const contact of contacts) {
      if (!contact.companyWebsite && !contact.linkedin) continue;

      try {
        // If we have a LinkedIn URL, use LinkedIn scraper
        if (contact.linkedin) {
          const run = await apifyClient.actor('apify/linkedin-profile-scraper').call({
            profileUrls: [contact.linkedin],
            maxProfilesPerRun: 1
          });

          const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
          
          if (items.length > 0) {
            const profile = items[0] as any;
            await db
              .update(musicIndustryContacts)
              .set({
                firstName: profile.firstName || contact.firstName,
                lastName: profile.lastName || contact.lastName,
                headline: profile.headline || contact.headline,
                jobTitle: profile.position || contact.jobTitle,
                companyName: profile.company || contact.companyName,
                updatedAt: new Date()
              })
              .where(eq(musicIndustryContacts.id, contact.id));
            
            enrichedCount++;
          }
        }
      } catch (err) {
        console.error(`Error enriching contact ${contact.id}:`, err);
      }
    }

    res.json({
      success: true,
      enriched: enrichedCount,
      total: contacts.length
    });

  } catch (error: any) {
    console.error('[APIFY PR ENRICH ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al enriquecer contactos' 
    });
  }
});

/**
 * POST /api/pr-ai/improve-text
 * Mejora cualquier texto usando OpenAI
 */
router.post('/improve-text', authenticate, async (req: Request, res: Response) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        success: false, 
        message: 'OpenAI no está configurado' 
      });
    }

    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Texto requerido' 
      });
    }

    const prompt = `Mejora el siguiente texto para que sea más profesional, conciso y efectivo para ${context || 'comunicación con medios'}:

Texto original:
"${text}"

Instrucciones:
1. Mantén el mensaje principal
2. Hazlo más profesional y pulido
3. Elimina redundancias
4. Mejora la claridad
5. Máximo 3 frases

Solo devuelve el texto mejorado, sin explicaciones.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300
    });

    const improvedText = response.choices[0]?.message?.content || '';

    res.json({
      success: true,
      improvedText: improvedText.trim()
    });

  } catch (error: any) {
    console.error('[PR AI IMPROVE TEXT ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al mejorar texto' 
    });
  }
});

/**
 * POST /api/pr-ai/generate-press-photo
 * Genera una imagen profesional para PR usando FAL AI
 */
router.post('/generate-press-photo', authenticate, async (req: Request, res: Response) => {
  try {
    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return res.status(503).json({ 
        success: false, 
        message: 'FAL AI no está configurado' 
      });
    }

    const { artistName, genre, style, profileImageUrl } = req.body;

    if (!artistName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre de artista requerido' 
      });
    }

    // Generar prompt basado en el perfil del artista
    const imagePrompt = `Professional press photo for ${genre || 'music'} artist ${artistName}, ${style || 'studio photography'}, high-quality, professional lighting, music industry standard, cinematic, editorial style, 4K resolution`;

    // Llamar a FAL AI para generar la imagen
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      res.json({
        success: true,
        imageUrl: data.images[0].url,
        prompt: imagePrompt
      });
    } else {
      throw new Error('No se generó ninguna imagen');
    }

  } catch (error: any) {
    console.error('[PR AI GENERATE PHOTO ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al generar imagen' 
    });
  }
});

/**
 * POST /api/pr-ai/suggest-campaign-title
 * Sugiere un título creativo para la campaña
 */
router.post('/suggest-campaign-title', authenticate, async (req: Request, res: Response) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        success: false, 
        message: 'OpenAI no está configurado' 
      });
    }

    const { artistName, contentType, contentTitle } = req.body;

    const prompt = `Sugiere 3 títulos creativos y profesionales para una campaña de PR.

Información:
- Artista: ${artistName}
- Tipo: ${contentType}
- Contenido: ${contentTitle}

Los títulos deben:
1. Ser descriptivos pero creativos
2. Incluir el tipo de contenido
3. Ser memorables
4. Máximo 60 caracteres

Formato: devuelve solo 3 títulos, uno por línea, sin numeración ni explicaciones.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200
    });

    const suggestions = (response.choices[0]?.message?.content || '').trim().split('\n').filter(s => s.trim());

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 3)
    });

  } catch (error: any) {
    console.error('[PR AI SUGGEST TITLE ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al sugerir títulos' 
    });
  }
});

export default router;
