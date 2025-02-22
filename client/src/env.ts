import { z } from "zod";

const envSchema = z.object({
  VITE_OPENROUTER_API_KEY: z.string(),
});

export const env = envSchema.parse({
  VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
});
