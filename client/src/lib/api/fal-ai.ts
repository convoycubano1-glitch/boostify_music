import axios from 'axios';

const FAL_API_ENDPOINT = 'https://api.fal.ai/v1/models';
const FLUX_PRO_MODEL = 'fal-ai/flux-pro';

const falClient = axios.create({
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_FAL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

interface GenerateCoverArtParams {
  prompt: string;
  negativePrompt?: string;
  style?: string;
}

export async function generateCoverArt(params: GenerateCoverArtParams) {
  const response = await falClient.post(`${FAL_API_ENDPOINT}/${FLUX_PRO_MODEL}/generate`, {
    prompt: params.prompt,
    negative_prompt: params.negativePrompt,
    style: params.style,
  });

  return response.data;
}
