import axios from 'axios';

const ZUNO_API_ENDPOINT = 'https://api.zuno.ai/v1/generate';

const zunoClient = axios.create({
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_ZUNO_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

interface GenerateMusicParams {
  prompt: string;
  modelName?: string;
  title?: string;
  tags?: string;
}

export async function generateMusic(params: GenerateMusicParams) {
  const response = await zunoClient.post(ZUNO_API_ENDPOINT, {
    prompt: params.prompt,
    model_name: params.modelName || 'chirp-v3.5',
    title: params.title,
    tags: params.tags,
  });

  return response.data;
}

export async function checkGenerationStatus(taskId: string) {
  const response = await zunoClient.get(`${ZUNO_API_ENDPOINT}/status/${taskId}`);
  return response.data;
}
