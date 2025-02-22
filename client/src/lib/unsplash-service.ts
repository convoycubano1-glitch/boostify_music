import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ''
});

export async function getRelevantImage(query: string): Promise<string> {
  try {
    // Enrich the query with music industry related terms for better context
    const enrichedQuery = `${query} music industry professional recording studio artist`;

    const result = await unsplash.photos.getRandom({
      query: enrichedQuery,
      orientation: 'landscape',
      contentFilter: 'high',
      // Ensure we get professional, high-quality images
      collections: ['317099', '3694365', '4332580'], // Collections related to music industry
    });

    if (result.response) {
      if (Array.isArray(result.response)) {
        return result.response[0].urls.regular;
      }
      return result.response.urls.regular;
    }

    // Fallback image if no results
    return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200';
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    // Return a default music-related image if there's an error
    return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200';
  }
}