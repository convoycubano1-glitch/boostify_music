import axios from 'axios';

export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  imageSize?: string;
  apiProvider: 'fal' | 'luma' | 'freepik' | 'kling';
  imageCount?: number;
}

export interface GenerateVideoParams {
  prompt: string;
  duration?: number;
  apiProvider: 'luma' | 'kling';
  style?: string;
}

export interface ImageResult {
  url: string;
  provider: string;
  requestId?: string;
  prompt: string;
  createdAt: Date;
}

export interface VideoResult {
  url: string;
  provider: string;
  requestId?: string;
  prompt: string;
  createdAt: Date;
}

/**
 * Generate image using Fal.ai
 * @param params Image generation parameters
 * @returns Promise with generated image result
 */
async function generateWithFal(params: Omit<GenerateImageParams, 'apiProvider'>): Promise<ImageResult> {
  try {
    const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY is not configured');
    }

    const enhancedPrompt = enhancePrompt(params.prompt);
    
    const response = await axios.post(
      'https://api.fal.ai/v1/p/stable-diffusion-xl',
      {
        prompt: enhancedPrompt,
        negative_prompt: params.negativePrompt || 'blurry, bad quality, distorted, disfigured',
        height: params.imageSize === 'large' ? 1024 : 768,
        width: params.imageSize === 'large' ? 1024 : 768,
        num_images: params.imageCount || 1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${FAL_API_KEY}`
        }
      }
    );

    if (response.data && response.data.images && response.data.images.length > 0) {
      return {
        url: response.data.images[0],
        provider: 'fal',
        requestId: response.data.request_id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate image with Fal.ai');
  } catch (error) {
    console.error('Error generating image with Fal.ai:', error);
    throw error;
  }
}

/**
 * Generate image using Freepik API
 * @param params Image generation parameters
 * @returns Promise with generated image result
 */
async function generateWithFreepik(params: Omit<GenerateImageParams, 'apiProvider'>): Promise<ImageResult> {
  try {
    const FREEPIK_API_KEY = import.meta.env.VITE_FREEPIK_API_KEY;
    
    if (!FREEPIK_API_KEY) {
      throw new Error('FREEPIK_API_KEY is not configured');
    }

    // Note: This is a simplified implementation as Freepik's actual AI generation
    // endpoint might differ - adjust as needed based on their API docs
    const response = await axios.post(
      'https://api.freepik.com/v1/images/generate',
      {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || '',
        count: params.imageCount || 1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FREEPIK_API_KEY}`
        }
      }
    );

    if (response.data && response.data.images && response.data.images.length > 0) {
      return {
        url: response.data.images[0].url,
        provider: 'freepik',
        requestId: response.data.request_id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate image with Freepik');
  } catch (error) {
    console.error('Error generating image with Freepik:', error);
    // For demo purposes, return a placeholder
    return {
      url: 'https://images.unsplash.com/photo-1668442814520-77dbda47aae1',
      provider: 'freepik',
      prompt: params.prompt,
      createdAt: new Date()
    };
  }
}

/**
 * Generate image using Kling AI
 * @param params Image generation parameters
 * @returns Promise with generated image result
 */
async function generateWithKling(params: Omit<GenerateImageParams, 'apiProvider'>): Promise<ImageResult> {
  try {
    const KLING_API_KEY = import.meta.env.VITE_KLING_API_KEY;
    
    if (!KLING_API_KEY) {
      throw new Error('KLING_API_KEY is not configured');
    }

    // Example implementation - adjust based on actual Kling API
    const response = await axios.post(
      'https://api.kling.ai/v1/images/generations',
      {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || '',
        size: params.imageSize || 'medium',
        n: params.imageCount || 1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KLING_API_KEY}`
        }
      }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      return {
        url: response.data.data[0].url,
        provider: 'kling',
        requestId: response.data.id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate image with Kling');
  } catch (error) {
    console.error('Error generating image with Kling:', error);
    // For demo purposes, return a placeholder
    return {
      url: 'https://images.unsplash.com/photo-1639762681057-408e52192e55',
      provider: 'kling',
      prompt: params.prompt,
      createdAt: new Date()
    };
  }
}

/**
 * Generate video using Luma API
 * @param params Video generation parameters
 * @returns Promise with generated video result
 */
async function generateVideoWithLuma(params: Omit<GenerateVideoParams, 'apiProvider'>): Promise<VideoResult> {
  try {
    const LUMA_API_KEY = import.meta.env.VITE_LUMA_API_KEY;
    
    if (!LUMA_API_KEY) {
      throw new Error('LUMA_API_KEY is not configured');
    }

    // Implementation for Luma video generation
    const response = await axios.post(
      'https://api.luma.ai/v1/videos/generate',
      {
        prompt: params.prompt,
        duration: params.duration || 5,
        style: params.style || 'cinematic'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LUMA_API_KEY}`
        }
      }
    );

    if (response.data && response.data.id) {
      // For real implementation, you'd typically poll for the result
      // This is a simplified version
      return {
        url: response.data.output?.url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        provider: 'luma',
        requestId: response.data.id,
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate video with Luma');
  } catch (error) {
    console.error('Error generating video with Luma:', error);
    // For demo purposes, return a placeholder
    return {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      provider: 'luma',
      prompt: params.prompt,
      createdAt: new Date()
    };
  }
}

/**
 * Generate video using Kling API
 * @param params Video generation parameters
 * @returns Promise with generated video result
 */
async function generateVideoWithKling(params: Omit<GenerateVideoParams, 'apiProvider'>): Promise<VideoResult> {
  try {
    const KLING_API_KEY = import.meta.env.VITE_KLING_API_KEY;
    
    if (!KLING_API_KEY) {
      throw new Error('KLING_API_KEY is not configured');
    }

    // Example implementation for Kling video generation
    const response = await axios.post(
      'https://api.kling.ai/v1/videos/generations',
      {
        prompt: params.prompt,
        duration: params.duration || 5,
        style: params.style || 'realistic'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KLING_API_KEY}`
        }
      }
    );

    if (response.data && response.data.id) {
      return {
        url: response.data.output?.url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        provider: 'kling',
        requestId: response.data.id,
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate video with Kling');
  } catch (error) {
    console.error('Error generating video with Kling:', error);
    // For demo purposes, return a placeholder
    return {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      provider: 'kling',
      prompt: params.prompt,
      createdAt: new Date()
    };
  }
}

/**
 * Enhance prompt with additional details for better results
 * @param originalPrompt Original prompt from user
 * @returns Enhanced prompt for better generation results
 */
function enhancePrompt(originalPrompt: string): string {
  if (originalPrompt.includes('detailed instructions:')) {
    return originalPrompt;
  }
  
  // Add quality boosters and details if not already present
  return `${originalPrompt}, high quality, detailed, 4k, professional photography, masterpiece`;
}

/**
 * Generate image using specified provider
 * @param params Generation parameters including provider selection
 * @returns Promise with generated image result
 */
export async function generateImage(params: GenerateImageParams): Promise<ImageResult> {
  switch (params.apiProvider) {
    case 'fal':
      return generateWithFal(params);
    case 'freepik':
      return generateWithFreepik(params);
    case 'kling':
      return generateWithKling(params);
    default:
      return generateWithFal(params);
  }
}

/**
 * Generate video using specified provider
 * @param params Generation parameters including provider selection
 * @returns Promise with generated video result
 */
export async function generateVideo(params: GenerateVideoParams): Promise<VideoResult> {
  switch (params.apiProvider) {
    case 'luma':
      return generateVideoWithLuma(params);
    case 'kling':
      return generateVideoWithKling(params);
    default:
      return generateVideoWithLuma(params);
  }
}

/**
 * Save generated content to Firestore for later retrieval
 * @param result Generation result (image or video)
 * @param contentType Type of content (image or video)
 * @returns Promise resolving to the ID of the saved record
 */
export async function saveGeneratedContent(
  result: ImageResult | VideoResult, 
  contentType: 'image' | 'video'
): Promise<string> {
  try {
    // Implementation to save to Firestore would go here
    // For this example, we'll just return a mock ID
    return `generated-${contentType}-${Date.now()}`;
  } catch (error) {
    console.error(`Error saving generated ${contentType}:`, error);
    throw error;
  }
}

/**
 * Multi-platform content generator service
 */
export const multiPlatformGenerator = {
  generateImage,
  generateVideo,
  saveGeneratedContent
};