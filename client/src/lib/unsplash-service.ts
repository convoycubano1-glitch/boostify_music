import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || ''
});

export async function getRelevantImage(query: string): Promise<string> {
  try {
    const result = await unsplash.photos.getRandom({
      query,
      orientation: 'landscape',
    });

    if (result.response) {
      return result.response.urls.regular;
    }
    
    // Fallback image if no results
    return 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&w=1200';
  } catch (error) {
    console.error('Error fetching image from Unsplash:', error);
    // Return a default educational image if there's an error
    return 'https://images.unsplash.com/photo-1516534775068-ba3e7458af70?auto=format&fit=crop&w=1200';
  }
}
