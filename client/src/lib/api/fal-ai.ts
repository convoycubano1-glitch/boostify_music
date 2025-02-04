import { fal } from "@fal-ai/client";
import axios from 'axios';

// Configure fal client
if (!import.meta.env.VITE_FAL_API_KEY) {
  console.error("VITE_FAL_API_KEY is not configured");
}

fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY
});

interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  imageSize?: string;
}

interface GenerateAudioParams {
  prompt: string;
  duration_seconds?: number;
}

export async function generateImageWithFal(params: GenerateImageParams) {
  console.log("Starting image generation with params:", {
    ...params,
    prompt: params.prompt.substring(0, 50) + "..." // Log truncated prompt for privacy
  });

  try {
    const result = await fal.subscribe("fal-ai/flux-pro", {
      input: {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "",
        image_size: params.imageSize || "landscape_16_9",
      },
      pollInterval: 5000, // Poll every 5 seconds
      logs: true,
      onQueueUpdate: (update) => {
        console.log("Generation status:", update.status);
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("Generation completed, result:", {
      requestId: result.requestId,
      hasImages: result.data?.images?.length > 0
    });

    return result;
  } catch (error) {
    console.error("Error generating image with Fal.ai:", error);
    throw error;
  }
}

export async function generateAudioWithFal(params: GenerateAudioParams) {
  console.log("Starting audio generation with params:", {
    ...params,
    prompt: params.prompt.substring(0, 50) + "..." // Log truncated prompt for privacy
  });

  try {
    const result = await fal.subscribe("fal-ai/stable-audio", {
      input: {
        prompt: params.prompt,
        duration_seconds: params.duration_seconds || 30, // Default to 30 seconds if not specified
      },
      pollInterval: 5000, // Poll every 5 seconds
      logs: true,
      onQueueUpdate: (update) => {
        console.log("Audio generation status:", update.status);
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    console.log("Audio generation completed, result:", {
      requestId: result.requestId,
      hasAudio: !!result.data?.audio_url
    });

    return result;
  } catch (error) {
    console.error("Error generating audio with Fal.ai:", error);
    throw error;
  }
}

// Test function to verify fal.ai integration
export async function testFalIntegration() {
  console.log("Testing Fal.ai integration...");
  try {
    const testResult = await generateImageWithFal({
      prompt: "A professional studio portrait of a musician, high quality, photorealistic, 4k",
      negativePrompt: "deformed, unrealistic, cartoon, anime, illustration, low quality, blurry",
      imageSize: "landscape_16_9"
    });

    console.log("Test successful, result:", testResult);
    return testResult;
  } catch (error) {
    console.error("Fal.ai test failed:", error);
    throw error;
  }
}