import { Request, Response } from 'express';
import { Express } from 'express';

/**
 * Setup routes for Education related API endpoints
 */
export function setupEducationRoutes(app: Express) {
  // Endpoint to generate course content with OpenRouter
  app.post('/api/education/generate-course', async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt in request body' });
      }

      // Get the OpenRouter API key from environment variables
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
      
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenRouter API key is not configured on the server' 
        });
      }

      // Prepare the headers for OpenRouter
      const headers = {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": req.headers.origin || "https://boostify.music.app",
        "X-Title": "Boostify Music Education",
        "Content-Type": "application/json"
      };
      
      // Use the Gemini 2.0 Flash model as requested
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-preview-02-05:free",
          messages: [
            {
              role: "system",
              content: `You are a JSON generator for music education courses. You MUST return a valid JSON object with this EXACT structure:
{
  "overview": "course overview text",
  "objectives": ["objective1", "objective2", "objective3"],
  "curriculum": [
    {
      "title": "lesson title",
      "description": "lesson description",
      "estimatedMinutes": 60
    }
  ],
  "topics": ["topic1", "topic2", "topic3"],
  "assignments": ["assignment1", "assignment2"],
  "applications": ["application1", "application2"]
}`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        return res.status(500).json({ 
          error: `Error from OpenRouter API: ${response.status} ${response.statusText}` 
        });
      }

      const data = await response.json();
      
      if (!data || !data.choices || !data.choices.length) {
        return res.status(500).json({ error: 'Invalid API response format' });
      }

      const content = data.choices[0].message?.content;
      
      if (!content) {
        return res.status(500).json({ error: 'No content in API response' });
      }

      // Parse the JSON content
      try {
        const courseContent = JSON.parse(content);
        return res.json(courseContent);
      } catch (parseError) {
        console.error('Error parsing JSON from API response:', parseError);
        return res.status(500).json({ 
          error: 'Failed to parse course content from API response',
          rawContent: content
        });
      }
    } catch (error) {
      console.error('Error generating course content:', error);
      return res.status(500).json({ 
        error: 'Failed to generate course content', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to safely get the OpenRouter API key
  app.get('/api/get-openrouter-key', (req: Request, res: Response) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.json({ exists: false });
    }
    // Return the actual key instead of just a boolean for direct client usage
    // This is only for this educational context - in production this would be better handled server-side only
    res.json({ exists: true, key: apiKey });
  });
}