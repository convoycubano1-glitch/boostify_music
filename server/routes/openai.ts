import { Request, Response } from 'express';
import { Express } from 'express';
import fetch from 'node-fetch';

// Configuración de OpenRouter
// Eliminamos espacios en blanco extra que puedan estar en la clave API
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Configura las rutas para OpenAI/OpenRouter
 */
export function setupOpenAIRoutes(app: Express) {
  /**
   * Route for generating chat completions
   * No requerimos autenticación aquí ya que es una API interna y la clave está en el backend
   */
  app.post('/api/chat/completions', async (req: Request, res: Response) => {
    try {
      const { messages, model = 'anthropic/claude-3-haiku', temperature = 0.7 } = req.body;

      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OpenRouter API key is not configured on the server' });
      }

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
      }

      console.log('Making request to OpenRouter with model:', model);
      console.log('Messages length:', messages.length);

      // Log complete request details for debugging
      console.log('OpenRouter API Request:', {
        url: `${BASE_URL}/chat/completions`,
        model,
        messagesCount: messages.length,
        apiKeyPresent: !!OPENROUTER_API_KEY,
      });
      
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.referer || 'https://boostify-music.app',
          'X-Title': 'Boostify Music Assistant',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        return res.status(response.status).json({ 
          error: `OpenRouter API error: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }

      const data = await response.json();
      return res.json(data);
    } catch (error) {
      console.error('Error in chat completion endpoint:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * Manager Tools Content Generation Endpoint
   * This endpoint receives requests from the client and proxies them to OpenRouter
   * with proper server-side authentication
   */
  app.post('/api/manager/generate-content', async (req: Request, res: Response) => {
    try {
      const { prompt, type } = req.body;

      if (!prompt || !type) {
        return res.status(400).json({ error: 'Prompt and type are required' });
      }

      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'OpenRouter API key is not configured on the server' });
      }

      console.log(`Generating ${type} content with prompt:`, prompt);

      // Prepare system prompt based on content type
      const systemPrompt = `You are an expert AI assistant specialized in ${type} management for music artists and events. Provide detailed, well-structured responses.`;
      
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': req.headers.referer || 'https://boostify-music.app',
          'X-Title': 'Boostify Music Manager Tools',
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-sonnet",
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        return res.status(response.status).json({ 
          error: `OpenRouter API error: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        return res.status(500).json({ error: 'Invalid response format from OpenRouter' });
      }
      
      return res.json({ content: data.choices[0].message.content });
    } catch (error) {
      console.error('Error in manager content generation endpoint:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}