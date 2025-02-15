import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TextModel, ImageModel, AIModelsConfig } from '@/types/ai-models';

interface AIModelsStore extends AIModelsConfig {
  updateTextModel: (model: TextModel) => void;
  updateImageModel: (model: ImageModel) => void;
  setDefaultTextModel: (modelId: string) => void;
  setDefaultImageModel: (modelId: string) => void;
  toggleModelStatus: (modelId: string, type: 'text' | 'image') => void;
}

const initialState: AIModelsConfig = {
  textModels: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      modelId: 'gpt-4o',
      maxTokens: 8192,
      temperature: 0.7,
      enabled: true,
      contextWindow: 8192,
    },
    {
      id: 'claude-3-5',
      name: 'Claude 3.5',
      provider: 'anthropic',
      modelId: 'claude-3-5-sonnet-20241022',
      maxTokens: 16384,
      temperature: 0.7,
      enabled: true,
      contextWindow: 16384,
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      provider: 'perplexity',
      modelId: 'llama-3.1-sonar-small-128k-online',
      maxTokens: 4096,
      temperature: 0.7,
      enabled: true,
      contextWindow: 4096,
    },
  ],
  imageModels: [
    {
      id: 'fal-stable-xl',
      name: 'FAL Stable XL',
      provider: 'fal',
      modelId: 'stable-xl',
      enabled: true,
      maxResolution: {
        width: 1024,
        height: 1024,
      },
    },
    {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      provider: 'openai',
      modelId: 'dall-e-3',
      enabled: true,
      maxResolution: {
        width: 1024,
        height: 1024,
      },
    },
  ],
  defaultTextModel: 'gpt-4o',
  defaultImageModel: 'fal-stable-xl',
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
      setDefaultTextModel: (modelId) =>
        set(() => ({ defaultTextModel: modelId })),
      setDefaultImageModel: (modelId) =>
        set(() => ({ defaultImageModel: modelId })),
      toggleModelStatus: (modelId, type) =>
        set((state) => {
          if (type === 'text') {
            return {
              textModels: state.textModels.map((m) =>
                m.id === modelId ? { ...m, enabled: !m.enabled } : m
              ),
            };
          }
          return {
            imageModels: state.imageModels.map((m) =>
              m.id === modelId ? { ...m, enabled: !m.enabled } : m
            ),
          };
        }),
    }),
    {
      name: 'ai-models-storage',
    }
  )
);
