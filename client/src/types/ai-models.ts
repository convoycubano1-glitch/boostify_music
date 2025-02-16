import { z } from "zod";

export const textModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(["openai", "anthropic", "google", "cohere", "deepseek", "alibaba", "baidu", "zhipu"]),
  modelId: z.string(),
  maxTokens: z.number(),
  temperature: z.number(),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  contextWindow: z.number(),
});

export const imageModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(["fal", "openai", "stability", "baidu"]),
  modelId: z.string(),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  maxResolution: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

export const ttsModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(["google", "microsoft", "elevenlabs", "baidu"]),
  modelId: z.string(),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  features: z.array(z.string()),
});

export const videoModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.enum(["runway", "zhipu"]),
  modelId: z.string(),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  maxDuration: z.number(),
});

export type TextModel = z.infer<typeof textModelSchema>;
export type ImageModel = z.infer<typeof imageModelSchema>;
export type TTSModel = z.infer<typeof ttsModelSchema>;
export type VideoModel = z.infer<typeof videoModelSchema>;

export interface AIModelsConfig {
  textModels: TextModel[];
  imageModels: ImageModel[];
  ttsModels: TTSModel[];
  videoModels: VideoModel[];
  defaultTextModel: string;
  defaultImageModel: string;
  defaultTTSModel: string;
  defaultVideoModel: string;
}