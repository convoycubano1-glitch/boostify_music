import { fal } from "@fal-ai/client";
import axios from 'axios';

// Configure fal client
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY
});

interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  imageSize?: string;
}

export async function generateImageWithFal(params: GenerateImageParams) {
  const result = await fal.subscribe("fal-ai/flux-pro", {
    input: {
      prompt: params.prompt,
      negative_prompt: params.negativePrompt,
      image_size: params.imageSize || "landscape_16_9",
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });

  return result;
}

// Test function to verify fal.ai integration
export async function testFalIntegration() {
  try {
    const testResult = await generateImageWithFal({
      prompt: "A professional studio portrait of a musician, high quality, photorealistic, 4k",
      negativePrompt: "deformed, unrealistic, cartoon, anime, illustration, low quality, blurry",
    });

    console.log("Test result:", testResult);
    return testResult;
  } catch (error) {
    console.error("Fal.ai test failed:", error);
    throw error;
  }
}