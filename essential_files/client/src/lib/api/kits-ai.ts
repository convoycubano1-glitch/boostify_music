import axios from 'axios';

const KITS_AI_ENDPOINTS = {
  mastering: 'https://api.kits.ai/v1/mastering',
  // Los endpoints mostrados en la imagen
  voiceConversion: 'https://api.kits.ai/v1/voice-conversion',
  voiceModel: 'https://api.kits.ai/v1/voice-model',
  textToSpeech: 'https://api.kits.ai/v1/text-to-speech',
  vocalSeparations: 'https://api.kits.ai/v1/vocal-separations',
  stemSplitter: 'https://api.kits.ai/v1/stem-splitter',
  voiceBlender: 'https://api.kits.ai/v1/voice-blender',
};

const kitsAiClient = axios.create({
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_KITS_AI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function masterTrack(audioFile: File) {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await kitsAiClient.post(KITS_AI_ENDPOINTS.mastering, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function separateVocals(audioFile: File) {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await kitsAiClient.post(KITS_AI_ENDPOINTS.vocalSeparations, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function splitStems(audioFile: File) {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await kitsAiClient.post(KITS_AI_ENDPOINTS.stemSplitter, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
