import { ApifyClient } from 'apify-client';
import { z } from 'zod';

// Define la estructura de datos esperada de la API de Apollo
interface ApolloResult {
  name?: string;
  email?: string;
  organization?: {
    name?: string;
  };
  title?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

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
    if (!import.meta.env.VITE_APIFY_API_KEY) {
      throw new Error('API key not configured');
    }

    const client = new ApifyClient({
      token: import.meta.env.VITE_APIFY_API_KEY,
    });

    const input = {
      url: `https://app.apollo.io/#/people?finderViewId=5b8050d050a3893c382e9360&page=1&sortByField=recommendations_score`,
      totalRecords: 100,
      getWorkEmails: true,
      getPersonalEmails: true,
      searchQuery: `${category} ${query} music industry`,
      filters: {
        industryTags: ['Music', 'Entertainment', 'Media']
      }
    };

    const run = await client.actor("jljBwyyQakqrL1wae").call(input);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Transformar y validar los resultados
    return (items as ApolloResult[]).map(item => ({
      name: item.name || 'Unknown',
      email: item.email,
      company: item.organization?.name,
      role: item.title,
      category: category,
      socialMedia: {
        linkedin: item.linkedin,
        twitter: item.twitter,
        instagram: item.instagram
      }
    }));
  } catch (error) {
    console.error('Error en la búsqueda de contactos:', error);
    throw new Error('Error en la búsqueda de contactos: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function checkApifyRun(runId: string): Promise<any> {
  const response = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${import.meta.env.VITE_APIFY_API_TOKEN}`
  );

  if (!response.ok) {
    throw new Error('Error al verificar el estado del proceso de vistas');
  }

  return response.json();
}