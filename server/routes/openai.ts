import { Request, Response } from 'express';
import { Express } from 'express';
import fetch from 'node-fetch';

// Configuración de OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Configura las rutas para OpenAI/OpenRouter
 */
export function setupOpenAIRoutes(app: Express) {
  /**
   * Route for generating chat completions
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
}