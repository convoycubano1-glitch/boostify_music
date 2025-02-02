import { z } from 'zod';

const contactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  category: z.string(),
  socialMedia: z.object({
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional()
  }).optional()
});

export type Contact = z.infer<typeof contactSchema>;

export const contactCategories = [
  'Sellos Discográficos',
  'Medios de Comunicación',
  'Promotores de Eventos',
  'Managers',
  'Agencias de PR',
  'Influencers Musicales',
  'Blogs de Música',
  'Radio',
  'Plataformas Streaming'
] as const;

export async function searchContacts(category: string, query: string): Promise<Contact[]> {
  try {
    const response = await fetch(`https://api.apify.com/v2/acts/apify~web-scraper/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_APIFY_API_KEY}`
      },
      body: JSON.stringify({
        startUrls: [{
          url: `https://www.google.com/search?q=${encodeURIComponent(`${category} ${query} music industry contact`)}`
        }],
        pageFunction: `async function pageFunction(context) {
          const { $, request, log } = context;
          const results = [];
          
          // Extract structured data
          $('div.g').each((index, element) => {
            const title = $(element).find('h3').text();
            const description = $(element).find('.VwiC3b').text();
            const link = $(element).find('a').first().attr('href');
            
            if (title && description) {
              results.push({
                name: title,
                description: description,
                url: link,
                category: "${category}"
              });
            }
          });
          
          return results;
        }`
      })
    });

    if (!response.ok) {
      throw new Error('Error al buscar contactos');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error en la búsqueda de contactos:', error);
    throw error;
  }
}

export async function getRunStatus(runId: string) {
  try {
    const response = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${import.meta.env.VITE_APIFY_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Error al verificar el estado de la búsqueda');
    }

    return response.json();
  } catch (error) {
    console.error('Error al obtener estado:', error);
    throw error;
  }
}
