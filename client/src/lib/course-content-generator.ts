import { z } from 'zod';

const lessonContentSchema = z.object({
  title: z.string(),
  content: z.object({
    introduction: z.string(),
    keyPoints: z.array(z.string()),
    mainContent: z.array(z.object({
      subtitle: z.string(),
      paragraphs: z.array(z.string())
    })),
    practicalExercises: z.array(z.string()),
    additionalResources: z.array(z.string()),
    summary: z.string()
  })
});

export type LessonContent = z.infer<typeof lessonContentSchema>;

export async function generateLessonContent(lessonTitle: string, lessonDescription: string): Promise<LessonContent> {
  try {
    if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://api.openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': `${window.location.origin}`,
          'X-Title': 'Artist Boost - Course Content Generation',
        },
        body: JSON.stringify({
          model: 'google/gemini-pro',
          messages: [
            {
              role: 'system',
              content: `You are an expert music industry educator creating comprehensive lesson content for professional music industry courses. 
Generate detailed, practical content with real-world examples in JSON format with the following structure:

{
  "title": "${lessonTitle}",
  "content": {
    "introduction": "Engaging introduction to the topic (2-3 paragraphs)",
    "keyPoints": ["Array of 4-6 key takeaways"],
    "mainContent": [
      {
        "subtitle": "Logical section heading",
        "paragraphs": ["Detailed explanations with examples and industry insights", "Multiple paragraphs per section"]
      }
    ],
    "practicalExercises": ["3-5 hands-on exercises or assignments"],
    "additionalResources": ["Relevant tools, websites, or learning materials"],
    "summary": "Concise summary of main concepts"
  }
}`
            },
            {
              role: 'user',
              content: `Generate comprehensive lesson content for: "${lessonTitle}"
Topic Description: ${lessonDescription}
Focus on practical knowledge, real-world examples, and current industry practices.
Include specific tools, techniques, and strategies used in the modern music industry.
IMPORTANT: Respond only with the JSON structure, no additional text.`
            }
          ],
          temperature: 0.7,
          stream: false
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate lesson content: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenRouter API');
      }

      let content;
      try {
        // If the content is already a JSON object, use it directly
        content = typeof data.choices[0].message.content === 'string' 
          ? JSON.parse(data.choices[0].message.content)
          : data.choices[0].message.content;
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        throw new Error('Failed to parse lesson content');
      }

      // Validate the response against our schema
      return lessonContentSchema.parse(content);

    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error generating lesson content:', error);
    throw error;
  }
}