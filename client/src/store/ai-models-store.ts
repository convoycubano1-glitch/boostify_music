import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TextModel, ImageModel, TTSModel, VideoModel, AIModelsConfig } from '@/types/ai-models';

interface AIModelsStore extends AIModelsConfig {
  updateTextModel: (model: TextModel) => void;
  updateImageModel: (model: ImageModel) => void;
  updateTTSModel: (model: TTSModel) => void;
  updateVideoModel: (model: VideoModel) => void;
  setDefaultTextModel: (modelId: string) => void;
  setDefaultImageModel: (modelId: string) => void;
  setDefaultTTSModel: (modelId: string) => void;
  setDefaultVideoModel: (modelId: string) => void;
  toggleModelStatus: (modelId: string, type: 'text' | 'image' | 'tts' | 'video') => void;
}

const initialState: AIModelsConfig = {
  textModels: [
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      modelId: 'gpt-4-turbo',
      maxTokens: 128000,
      temperature: 0.7,
      enabled: true,
      contextWindow: 128000,
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      modelId: 'gpt-3.5-turbo',
      maxTokens: 16384,
      temperature: 0.7,
      enabled: true,
      contextWindow: 16384,
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      modelId: 'claude-3-opus',
      maxTokens: 200000,
      temperature: 0.7,
      enabled: true,
      contextWindow: 200000,
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      modelId: 'claude-3-sonnet',
      maxTokens: 200000,
      temperature: 0.7,
      enabled: true,
      contextWindow: 200000,
    },
    {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      modelId: 'claude-3-haiku',
      maxTokens: 200000,
      temperature: 0.7,
      enabled: true,
      contextWindow: 200000,
    },
    {
      id: 'gemini-1-ultra',
      name: 'Gemini Ultra',
      provider: 'google',
      modelId: 'gemini-1-ultra',
      maxTokens: 32768,
      temperature: 0.7,
      enabled: true,
      contextWindow: 32768,
    },
    {
      id: 'gemini-1-pro',
      name: 'Gemini Pro',
      provider: 'google',
      modelId: 'gemini-1-pro',
      maxTokens: 32768,
      temperature: 0.7,
      enabled: true,
      contextWindow: 32768,
    },
    {
      id: 'command-r',
      name: 'Command-R',
      provider: 'cohere',
      modelId: 'command-r',
      maxTokens: 4096,
      temperature: 0.7,
      enabled: true,
      contextWindow: 4096,
    },
    {
      id: 'deepseek-67b',
      name: 'DeepSeek 67B',
      provider: 'deepseek',
      modelId: 'deepseek-67b',
      maxTokens: 32768,
      temperature: 0.7,
      enabled: true,
      contextWindow: 32768,
    },
    {
      id: 'qwen-2.5-max',
      name: 'Qwen 2.5 Max',
      provider: 'alibaba',
      modelId: 'qwen-2.5-max',
      maxTokens: 32768,
      temperature: 0.7,
      enabled: true,
      contextWindow: 32768,
    },
    {
      id: 'ernie-4.0',
      name: 'ERNIE 4.0',
      provider: 'baidu',
      modelId: 'ernie-4.0',
      maxTokens: 32768,
      temperature: 0.7,
      enabled: true,
      contextWindow: 32768,
    },
    {
      id: 'chatglm3-6b',
      name: 'ChatGLM3 6B',
      provider: 'zhipu',
      modelId: 'chatglm3-6b',
      maxTokens: 32768,
      temperature: 0.7,
      enabled: true,
      contextWindow: 32768,
    },
  ],
  imageModels: [
    {
      id: 'dall-e-3',
      name: 'DALL·E 3',
      provider: 'openai',
      modelId: 'dall-e-3',
      enabled: true,
      maxResolution: {
        width: 1024,
        height: 1024,
      },
    },
    {
      id: 'stable-diffusion-xl',
      name: 'Stable Diffusion XL',
      provider: 'stability',
      modelId: 'stable-diffusion-xl',
      enabled: true,
      maxResolution: {
        width: 1024,
        height: 1024,
      },
    },
    {
      id: 'ernie-vilg-2',
      name: 'ERNIE-ViLG 2.0',
      provider: 'baidu',
      modelId: 'ernie-vilg-2.0',
      enabled: true,
      maxResolution: {
        width: 1024,
        height: 1024,
      },
    },
  ],
  ttsModels: [
    {
      id: 'wavenet',
      name: 'Google WaveNet',
      provider: 'google',
      modelId: 'wavenet',
      enabled: true,
      features: ['Multiple voices', 'High quality', 'Neural network based'],
    },
    {
      id: 'azure-neural-voices',
      name: 'Azure Neural Voices',
      provider: 'microsoft',
      modelId: 'azure-neural-voices',
      enabled: true,
      features: ['Multiple languages', 'Emotional tones', 'Neural voices'],
    },
    {
      id: 'elevenlabs-v2',
      name: 'ElevenLabs V2',
      provider: 'elevenlabs',
      modelId: 'elevenlabs-v2',
      enabled: true,
      features: ['Voice cloning', 'High fidelity', 'Emotional control'],
    },
    {
      id: 'baidu-tts',
      name: 'Baidu TTS',
      provider: 'baidu',
      modelId: 'baidu-tts',
      enabled: true,
      features: ['Chinese optimization', 'Multiple voices', 'Real-time synthesis'],
    },
  ],
  videoModels: [
    {
      id: 'runway-gen-2',
      name: 'Runway Gen-2',
      provider: 'runway',
      modelId: 'runway-gen-2',
      enabled: true,
      maxDuration: 180,
    },
    {
      id: 'zhipu-ai-ying',
      name: 'Zhipu AI Ying',
      provider: 'zhipu',
      modelId: 'zhipu-ai-ying',
      enabled: true,
      maxDuration: 120,
    },
  ],
  defaultTextModel: 'gpt-4-turbo',
  defaultImageModel: 'dall-e-3',
  defaultTTSModel: 'elevenlabs-v2',
  defaultVideoModel: 'runway-gen-2',
};

export const useAIModelsStore = create<AIModelsStore>()(
  persist(
    (set) => ({
      ...initialState,
      updateTextModel: (model) =>
        set((state) => ({
          textModels: state.textModels.map((m) =>
            m.id === model.id ? model : m
          ),
        })),
      updateImageModel: (model) =>
        set((state) => ({
          imageModels: state.imageModels.map((m) =>
            m.id === model.id ? model : m
          ),
        })),
      updateTTSModel: (model) =>
        set((state) => ({
          ttsModels: state.ttsModels.map((m) =>
            m.id === model.id ? model : m
          ),
        })),
      updateVideoModel: (model) =>
        set((state) => ({
          videoModels: state.videoModels.map((m) =>
            m.id === model.id ? model : m
          ),
        })),
      setDefaultTextModel: (modelId) =>
        set(() => ({ defaultTextModel: modelId })),
      setDefaultImageModel: (modelId) =>
        set(() => ({ defaultImageModel: modelId })),
      setDefaultTTSModel: (modelId) =>
        set(() => ({ defaultTTSModel: modelId })),
      setDefaultVideoModel: (modelId) =>
        set(() => ({ defaultVideoModel: modelId })),
      toggleModelStatus: (modelId, type) =>
        set((state) => {
          switch (type) {
            case 'text':
              return {
                textModels: state.textModels.map((m) =>
                  m.id === modelId ? { ...m, enabled: !m.enabled } : m
                ),
              };
            case 'image':
              return {
                imageModels: state.imageModels.map((m) =>
                  m.id === modelId ? { ...m, enabled: !m.enabled } : m
                ),
              };
            case 'tts':
              return {
                ttsModels: state.ttsModels.map((m) =>
                  m.id === modelId ? { ...m, enabled: !m.enabled } : m
                ),
              };
            case 'video':
              return {
                videoModels: state.videoModels.map((m) =>
                  m.id === modelId ? { ...m, enabled: !m.enabled } : m
                ),
              };
          }
        }),
    }),
    {
      name: 'ai-models-storage',
    }
  )
);